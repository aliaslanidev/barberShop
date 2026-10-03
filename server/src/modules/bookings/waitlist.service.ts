import type { Prisma, WaitlistStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import { formatPersianDate, toPersianDigits } from "@/utils/persian-date";

const OFFER_MINUTES = 5;
const ACTIVE_STATUSES: WaitlistStatus[] = ["WAITING", "OFFERED"];

function parseDateOnly(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function tehranDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function isSlotInPast(date: string, time: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  if (date < today) return true;
  if (date > today) return false;
  const currentMinute = Number(part("hour")) * 60 + Number(part("minute"));
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes <= currentMinute;
}

function waitlistKey(barberId: string, date: string, time: string) {
  return `${barberId}:${date}:${time}`;
}

export async function lockWaitlistSlot(
  tx: Prisma.TransactionClient,
  barberId: string,
  date: string,
  time: string,
) {
  await tx.$queryRaw`
    SELECT 1::int FROM pg_advisory_xact_lock(hashtextextended(${waitlistKey(barberId, date, time)}, 0))
  `;
}

async function advanceSlot(
  tx: Prisma.TransactionClient,
  barberId: string,
  date: string,
  time: string,
) {
  await lockWaitlistSlot(tx, barberId, date, time);
  const dateOnly = parseDateOnly(date);
  const now = new Date();

  const barber = await tx.barberProfile.findUnique({
    where: { id: barberId },
    select: { isActive: true, user: { select: { isActive: true } } },
  });
  if (isSlotInPast(date, time, now)) {
    await tx.slotWaitlist.updateMany({
      where: { barberId, date: dateOnly, time, status: { in: ACTIVE_STATUSES } },
      data: { status: "CANCELLED", offerExpiresAt: null },
    });
    await tx.slotHold.deleteMany({ where: { barberId, date: dateOnly, time } });
    return;
  }
  if (!barber?.isActive || !barber.user.isActive) {
    await tx.slotWaitlist.updateMany({
      where: { barberId, date: dateOnly, time, status: "OFFERED" },
      data: { status: "WAITING", offerExpiresAt: null },
    });
    await tx.slotHold.deleteMany({ where: { barberId, date: dateOnly, time } });
    return;
  }

  const expiredOffers = await tx.slotWaitlist.findMany({
    where: {
      barberId,
      date: dateOnly,
      time,
      status: "OFFERED",
      offerExpiresAt: { lte: now },
    },
    select: { id: true },
  });
  if (expiredOffers.length > 0) {
    await tx.slotWaitlist.updateMany({
      where: { id: { in: expiredOffers.map((offer) => offer.id) } },
      data: { status: "EXPIRED", offerExpiresAt: null },
    });
    await tx.slotHold.deleteMany({
      where: { waitlistRequestId: { in: expiredOffers.map((offer) => offer.id) } },
    });
  }

  const activeOffer = await tx.slotWaitlist.findFirst({
    where: { barberId, date: dateOnly, time, status: "OFFERED", offerExpiresAt: { gt: now } },
  });
  if (activeOffer) return;

  const existingBooking = await tx.booking.findFirst({
    where: { barberId, date: dateOnly, time, status: { not: "CANCELLED" } },
    select: { id: true },
  });
  if (existingBooking) return;

  const activeHold = await tx.slotHold.findUnique({
    where: { barberId_date_time: { barberId, date: dateOnly, time } },
  });
  if (activeHold?.expiresAt && activeHold.expiresAt > now) return;
  if (activeHold) await tx.slotHold.delete({ where: { id: activeHold.id } });

  const blockedSlot = await tx.blockedSlot.findFirst({
    where: { barberId, date: dateOnly, time },
    select: { id: true },
  });
  const [holiday, timeOff] = await Promise.all([
    tx.salonHoliday.findFirst({ where: { date: dateOnly }, select: { id: true } }),
    tx.timeOff.findFirst({ where: { barberId, date: dateOnly }, select: { id: true } }),
  ]);
  if (blockedSlot || holiday || timeOff) return;

  const waiting = await tx.slotWaitlist.findMany({
    where: { barberId, date: dateOnly, time, status: "WAITING" },
    include: { customer: { select: { isActive: true } } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  for (const request of waiting) {
    if (!request.customer.isActive) {
      await tx.slotWaitlist.update({
        where: { id: request.id },
        data: { status: "CANCELLED" },
      });
      continue;
    }

    const requestedServiceIds = request.serviceIds.length > 0 ? request.serviceIds : [request.serviceId];
    const barberServices = await tx.barberService.findMany({
      where: { barberId, serviceId: { in: requestedServiceIds }, isActive: true },
      select: { serviceId: true },
    });
    if (barberServices.length !== requestedServiceIds.length) {
      await tx.slotWaitlist.update({
        where: { id: request.id },
        data: { status: "CANCELLED" },
      });
      continue;
    }

    const offerExpiresAt = new Date(now.getTime() + OFFER_MINUTES * 60_000);
    await tx.slotHold.create({
      data: {
        barberId,
        date: dateOnly,
        time,
        expiresAt: offerExpiresAt,
        waitlistRequestId: request.id,
      },
    });
    await tx.slotWaitlist.update({
      where: { id: request.id },
      data: { status: "OFFERED", offerExpiresAt },
    });
    await tx.notification.create({
      data: {
        userId: request.customerId,
        type: "SLOT_WAITLIST_OFFER",
        title: "ساعت موردنظرتان آزاد شد",
        body: `ساعت ${toPersianDigits(time)} در تاریخ ${formatPersianDate(dateOnly)} آزاد شده؛ برای ثبت نوبت ${toPersianDigits(String(OFFER_MINUTES))} دقیقه فرصت دارید.`,
        link: "/customer/bookings",
      },
    });
    return;
  }
}

export async function joinWaitlist(
  customerId: string,
  input: { barberId: string; serviceId?: string; serviceIds?: string[]; date: string; time: string },
) {
  const serviceIds = [...new Set(input.serviceIds ?? (input.serviceId ? [input.serviceId] : []))];
  if (serviceIds.length === 0 || serviceIds.length > 2) {
    throw new AppError("برای هر درخواست باید یک یا دو سرویس انتخاب کنید", 400);
  }
  const dateOnly = parseDateOnly(input.date);
  if (isSlotInPast(input.date, input.time)) {
    throw new AppError("برای ساعت‌های گذشته نمی‌توانید درخواست ثبت کنید", 409);
  }
  const weekdayByJsDay = [
    "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
  ] as const;
  const weekday = weekdayByJsDay[dateOnly.getUTCDay()];
  const [barber, workingHours, holiday, timeOff, blockedSlot] = await Promise.all([
    prisma.barberProfile.findUnique({
      where: { id: input.barberId },
      select: { isActive: true, workingDays: true, user: { select: { isActive: true } } },
    }),
    prisma.workingHours.findUnique({ where: { day: weekday } }),
    prisma.salonHoliday.findFirst({ where: { date: dateOnly }, select: { id: true } }),
    prisma.timeOff.findFirst({
      where: { barberId: input.barberId, date: dateOnly },
      select: { id: true },
    }),
    prisma.blockedSlot.findFirst({
      where: { barberId: input.barberId, date: dateOnly, time: input.time },
      select: { id: true },
    }),
  ]);
  if (!barber?.isActive || !barber.user.isActive) {
    throw new AppError("این آرایشگر در حال حاضر نوبت جدید نمی‌پذیرد", 409);
  }
  const barberWorksThatDay = barber.workingDays.length === 0 || barber.workingDays.includes(weekday);
  const [openHour, openMinute] = (workingHours?.openTime ?? "00:00").split(":").map(Number);
  const [closeHour, closeMinute] = (workingHours?.closeTime ?? "00:00").split(":").map(Number);
  const [slotHour, slotMinute] = input.time.split(":").map(Number);
  const openAt = openHour * 60 + openMinute;
  const closeAt = closeHour * 60 + closeMinute;
  const slotAt = slotHour * 60 + slotMinute;
  if (
    !workingHours?.isOpen ||
    !barberWorksThatDay ||
    holiday ||
    timeOff ||
    blockedSlot ||
    slotAt < openAt ||
    slotAt + 60 > closeAt ||
    (slotAt - openAt) % 60 !== 0
  ) {
    throw new AppError("این ساعت برای صف انتظار در دسترس نیست", 409);
  }

  const [customer, barberServices] = await Promise.all([
    prisma.user.findUnique({ where: { id: customerId }, select: { isActive: true } }),
    prisma.barberService.findMany({
      where: { barberId: input.barberId, serviceId: { in: serviceIds }, isActive: true },
      select: { serviceId: true },
    }),
  ]);
  if (!customer?.isActive) throw new AppError("حساب مشتری فعال نیست", 403);
  if (barberServices.length !== serviceIds.length) {
    throw new AppError("یکی از سرویس‌ها در حال حاضر توسط این آرایشگر ارائه نمی‌شود", 400);
  }

  return prisma.$transaction(async (tx) => {
    await lockWaitlistSlot(tx, input.barberId, input.date, input.time);
    const [booking, existing] = await Promise.all([
      tx.booking.findFirst({
        where: {
          barberId: input.barberId,
          date: dateOnly,
          time: input.time,
          status: "CONFIRMED",
        },
        select: { customerId: true },
      }),
      tx.slotWaitlist.findUnique({
        where: {
          customerId_barberId_date_time: {
            customerId,
            barberId: input.barberId,
            date: dateOnly,
            time: input.time,
          },
        },
      }),
    ]);
    if (!booking || booking.customerId === customerId) {
      throw new AppError("این ساعت دیگر برای صف انتظار در دسترس نیست", 409);
    }
    if (existing && ACTIVE_STATUSES.includes(existing.status)) {
      throw new AppError("درخواست شما برای این ساعت از قبل ثبت شده است", 409);
    }
    if (existing) {
      return tx.slotWaitlist.update({
        where: { id: existing.id },
        data: {
          serviceId: serviceIds[0],
          serviceIds,
          status: "WAITING",
          createdAt: new Date(),
          offerExpiresAt: null,
        },
      });
    }
    return tx.slotWaitlist.create({
      data: {
        customerId,
        barberId: input.barberId,
        serviceId: serviceIds[0],
        serviceIds,
        date: dateOnly,
        time: input.time,
      },
    });
  });
}

export async function getMyWaitlist(customerId: string) {
  const date = tehranDateKey();
  const [requests, futureBookings] = await Promise.all([
    prisma.slotWaitlist.findMany({
      where: { customerId, status: { in: ACTIVE_STATUSES }, date: { gte: parseDateOnly(date) } },
      include: {
        barber: { include: { user: { select: { name: true } } } },
        service: { select: { title: true } },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }, { createdAt: "asc" }],
    }),
    prisma.booking.findMany({
      where: { customerId, status: "CONFIRMED", date: { gte: parseDateOnly(date) } },
      include: {
        barber: { include: { user: { select: { name: true } } } },
        service: { select: { title: true } },
        bookingServices: { include: { service: { select: { title: true } } } },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    }),
  ]);

  const requestServiceIds = [...new Set(requests.flatMap((request) =>
    request.serviceIds.length > 0 ? request.serviceIds : [request.serviceId],
  ))];
  const requestServices = await prisma.service.findMany({
    where: { id: { in: requestServiceIds } },
    select: { id: true, title: true },
  });
  const titleByServiceId = new Map(requestServices.map((service) => [service.id, service.title]));

  return {
    requests: requests.map((request) => {
      const serviceIds = request.serviceIds.length > 0 ? request.serviceIds : [request.serviceId];
      return {
        id: request.id,
        barberId: request.barberId,
        serviceId: request.serviceId,
        serviceIds,
        date: dateKey(request.date),
        time: request.time,
        status: request.status,
        offerExpiresAt: request.offerExpiresAt,
        barberName: request.barber.user.name,
        serviceTitle: serviceIds.map((id) => titleByServiceId.get(id)).filter(Boolean).join(" + "),
      };
    }),
    futureBookings: futureBookings
      .filter((booking) => !isSlotInPast(dateKey(booking.date), booking.time))
      .map((booking) => ({
        id: booking.id,
        date: dateKey(booking.date),
        time: booking.time,
        barberName: booking.barber.user.name,
        serviceTitle: booking.bookingServices.length > 0
          ? booking.bookingServices.map((item) => item.service.title).join(" + ")
          : booking.service.title,
      })),
  };
}

export async function cancelWaitlistRequest(customerId: string, requestId: string) {
  const request = await prisma.slotWaitlist.findFirst({
    where: { id: requestId, customerId, status: { in: ACTIVE_STATUSES } },
  });
  if (!request) throw new AppError("درخواست فعال صف انتظار پیدا نشد", 404);

  await prisma.$transaction(async (tx) => {
    await lockWaitlistSlot(tx, request.barberId, dateKey(request.date), request.time);
    const cancelled = await tx.slotWaitlist.updateMany({
      where: { id: request.id, customerId, status: { in: ACTIVE_STATUSES } },
      data: { status: "CANCELLED", offerExpiresAt: null },
    });
    if (cancelled.count === 0) {
      throw new AppError("این پیشنهاد قبلاً پاسخ داده شده یا منقضی شده است", 409);
    }
    await tx.slotHold.deleteMany({ where: { waitlistRequestId: request.id } });
  });

  try {
    await advanceWaitlistSlot(request.barberId, dateKey(request.date), request.time);
  } catch (error) {
    console.error("خطا در انتقال صف انتظار پس از لغو درخواست", request.id, error);
  }
}

export async function acceptWaitlistOffer(
  customerId: string,
  requestId: string,
  replaceBookingId?: string,
) {
  const initialRequest = await prisma.slotWaitlist.findFirst({
    where: { id: requestId, customerId },
    select: { barberId: true, date: true, time: true },
  });
  if (!initialRequest) throw new AppError("پیشنهاد صف انتظار پیدا نشد", 404);

  const date = dateKey(initialRequest.date);
  const result = await prisma.$transaction(async (tx) => {
    await lockWaitlistSlot(tx, initialRequest.barberId, date, initialRequest.time);
    await tx.$queryRaw`SELECT id FROM barber_profiles WHERE id = ${initialRequest.barberId} FOR UPDATE`;

    const request = await tx.slotWaitlist.findFirst({
      where: { id: requestId, customerId },
      include: {
        barber: { include: { user: true } },
        service: true,
        customer: { select: { name: true } },
      },
    });
    const now = new Date();
    if (
      !request ||
      request.status !== "OFFERED" ||
      !request.offerExpiresAt ||
      request.offerExpiresAt <= now
    ) {
      throw new AppError("مهلت این پیشنهاد تمام شده است؛ در صورت آزادشدن، نوبت بعدی صف مطلع می‌شود", 410);
    }
    if (!request.barber.isActive || !request.barber.user.isActive) {
      throw new AppError("این آرایشگر دیگر نوبت جدید نمی‌پذیرد", 409);
    }
    const hold = await tx.slotHold.findUnique({ where: { waitlistRequestId: request.id } });
    if (!hold || hold.expiresAt <= now) {
      throw new AppError("مهلت این پیشنهاد تمام شده است", 410);
    }
    const collision = await tx.booking.findFirst({
      where: {
        barberId: request.barberId,
        date: request.date,
        time: request.time,
        status: { not: "CANCELLED" },
      },
      select: { id: true },
    });
    if (collision) throw new AppError("این ساعت دیگر آزاد نیست", 409);

    let replacedBooking: {
      id: string;
      barberId: string;
      date: Date;
      time: string;
      barber: { userId: string };
    } | null = null;
    if (replaceBookingId) {
      replacedBooking = await tx.booking.findFirst({
        where: { id: replaceBookingId, customerId, status: "CONFIRMED" },
        select: {
          id: true,
          barberId: true,
          date: true,
          time: true,
          barber: { select: { userId: true } },
        },
      });
      if (!replacedBooking || isSlotInPast(dateKey(replacedBooking.date), replacedBooking.time, now)) {
        throw new AppError("نوبت انتخاب‌شده برای جایگزینی معتبر نیست", 409);
      }
    }

    const requestedServiceIds = request.serviceIds.length > 0 ? request.serviceIds : [request.serviceId];
    const barberServices = await tx.barberService.findMany({
      where: {
        barberId: request.barberId,
        serviceId: { in: requestedServiceIds },
        isActive: true,
      },
      include: { service: true },
    });
    if (barberServices.length !== requestedServiceIds.length) {
      throw new AppError("یکی از سرویس‌های انتخاب‌شده دیگر قابل رزرو نیست", 409);
    }
    const priceByServiceId = new Map(
      barberServices.map((item) => [
        item.serviceId,
        item.customPrice ?? item.service.priceValue,
      ]),
    );

    const barberSnapshot = await tx.barberProfile.findUnique({
      where: { id: request.barberId },
      select: { managePricing: true, exclusiveCustomers: true },
    });
    if (!barberSnapshot) throw new AppError("آرایشگر پیدا نشد", 404);

    if (replacedBooking) {
      await tx.booking.update({
        where: { id: replacedBooking.id },
        data: { status: "CANCELLED" },
      });
      await tx.cancellation.create({
        data: {
          bookingId: replacedBooking.id,
          cancelledById: customerId,
          cancelledByRole: "CUSTOMER",
          reason: "جابه‌جایی نوبت از طریق صف انتظار",
        },
      });
      await tx.notification.create({
        data: {
          userId: replacedBooking.barber.userId,
          type: "BOOKING_STATUS_CHANGED",
          title: "لغو و جابه‌جایی نوبت",
          body: `نوبت ${formatPersianDate(replacedBooking.date)} ساعت ${toPersianDigits(replacedBooking.time)} برای جایگزینی با ساعت آزاد صف انتظار لغو شد.`,
          link: "/barber/bookings",
        },
      });
    }

    const booking = await tx.booking.create({
      data: {
        customerId,
        barberId: request.barberId,
        serviceId: request.serviceId,
        bookingServices: {
          create: requestedServiceIds.map((serviceId) => ({
            serviceId,
            price: priceByServiceId.get(serviceId)!,
          })),
        },
        date: request.date,
        time: request.time,
        status: "CONFIRMED",
        price: requestedServiceIds.reduce(
          (total, serviceId) => total + (priceByServiceId.get(serviceId) ?? 0),
          0,
        ),
        isBarberOwnRevenue: barberSnapshot.managePricing,
        isPrivateCustomer: barberSnapshot.exclusiveCustomers,
      },
      include: {
        barber: { include: { user: true } },
        service: true,
        bookingServices: { include: { service: true } },
        customer: true,
        rating: true,
      },
    });

    await tx.slotWaitlist.update({
      where: { id: request.id },
      data: { status: "ACCEPTED", offerExpiresAt: null },
    });
    await tx.slotHold.delete({ where: { id: hold.id } });
    await tx.notification.create({
      data: {
        userId: request.barber.userId,
        type: "BOOKING_CREATED",
        title: "نوبت جدید",
        body: `${request.customer.name} یک نوبت برای ${formatPersianDate(request.date)} ساعت ${toPersianDigits(request.time)} ثبت کرد`,
        link: "/barber/bookings",
      },
    });
    await tx.notification.create({
      data: {
        userId: customerId,
        type: "BOOKING_STATUS_CHANGED",
        title: "نوبت صف انتظار ثبت شد",
        body: `نوبت ${requestedServiceIds.map((serviceId) => barberServices.find((item) => item.serviceId === serviceId)?.service.title).filter(Boolean).join(" + ")} برای ${formatPersianDate(request.date)} ساعت ${toPersianDigits(request.time)} ثبت شد.`,
        link: "/customer/bookings",
      },
    });

    return { booking, replacedBooking };
  });

  if (result.replacedBooking) {
    try {
      await advanceWaitlistSlot(
        result.replacedBooking.barberId,
        dateKey(result.replacedBooking.date),
        result.replacedBooking.time,
      );
    } catch (error) {
      console.error("خطا در انتقال صف انتظار پس از جابه‌جایی نوبت", result.replacedBooking.id, error);
    }
  }
  return result.booking;
}

export async function advanceWaitlistSlot(barberId: string, date: string, time: string) {
  await prisma.$transaction((tx) => advanceSlot(tx, barberId, date, time));
}

export async function processWaitlistOffers() {
  const now = new Date();
  const tehranDate = tehranDateKey(now);
  const slots = await prisma.$queryRaw<Array<{ barberId: string; date: Date; time: string }>>`
    SELECT "barberId", "date", "time"
    FROM "slot_waitlists"
    WHERE "status" IN ('WAITING'::"WaitlistStatus", 'OFFERED'::"WaitlistStatus")
      AND "date" >= ${parseDateOnly(tehranDate)}
    GROUP BY "barberId", "date", "time"
    ORDER BY MIN("createdAt") ASC
    LIMIT 500
  `;

  for (const slot of slots) {
    await advanceWaitlistSlot(slot.barberId, dateKey(slot.date), slot.time);
  }
}
