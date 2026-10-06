import type { Prisma, Role, Weekday } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import { formatPersianDate, toPersianDigits } from "@/utils/persian-date";
import { notifyUserSafely } from "@/modules/notifications/notifications.service";
import {
  advanceWaitlistSlot,
  lockWaitlistSlot,
} from "@/modules/bookings/waitlist.service";
import type {
  CreateBookingInput,
  ListBookingsQuery,
  UpdateBookingStatusInput,
} from "@/modules/bookings/bookings.schema";

// بعد از چندمین لغوِ خودِ مشتری (نه آرایشگر/ادمین) حساب مشتری خودکار
// مسدود می‌شه. آیتم ۱.۱ لیست اصلاحات.
const CUSTOMER_CANCEL_BLOCK_THRESHOLD = 3;

function parseDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}
function dateRangeForDay(dateStr: string): { gte: Date; lt: Date } {
  const start = parseDateOnly(dateStr);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { gte: start, lt: end };
}

const WEEKDAY_BY_JS_DAY: Record<number, Weekday> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

const SLOT_DURATION_MINUTES = 60;

// مدت زمانی که یه بازه زمانی بعد از انتخاب‌شدن (قبل از ثبت نهایی) برای همون
// مشتری نگه داشته می‌شه؛ تا این مدت بقیه نمی‌تونن همون ساعت رو انتخاب کنن.
const HOLD_DURATION_MINUTES = 5;

function isSlotInPast(
  dateStr: string,
  time: string,
  now = new Date(),
): boolean {
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

  if (dateStr < today) return true;
  if (dateStr > today) return false;

  const currentMinute = Number(part("hour")) * 60 + Number(part("minute"));
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes <= currentMinute;
}

function generateSlotsInRange(openTime: string, closeTime: string): string[] {
  const slots: string[] = [];
  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  let cursor = openH * 60 + openM;
  const end = closeH * 60 + closeM;
  while (cursor + SLOT_DURATION_MINUTES <= end) {
    const h = Math.floor(cursor / 60)
      .toString()
      .padStart(2, "0");
    const m = (cursor % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    cursor += SLOT_DURATION_MINUTES;
  }
  return slots;
}

function barberWorksOnWeekday(
  workingDays: Weekday[],
  weekday: Weekday,
): boolean {
  return workingDays.length === 0 || workingDays.includes(weekday);
}

// نسخه‌ی «فقط آزادها» — برای منطق داخلی (ساخت نوبت، شمارش ظرفیت روزها)
//
// excludeHoldId: هولدِخودِمین مشتری رو نادیده بگیر. وقتی مشتری داره
// نوبتش رو نهایی می‌کنه یا هولدش رو تمدید می‌کنه، نباید هولد خودش مانعش بشه.
export async function getAvailableSlots(
  barberId: string,
  dateStr: string,
  excludeHoldId?: string,
): Promise<string[]> {
  const barber = await prisma.barberProfile.findUnique({
    where: { id: barberId },
  });
  if (!barber || !barber.isActive) return [];

  const dateOnly = parseDateOnly(dateStr);
  const weekday = WEEKDAY_BY_JS_DAY[dateOnly.getUTCDay()];

  if (!barberWorksOnWeekday(barber.workingDays, weekday)) return [];

  const workingHours = await prisma.workingHours.findUnique({
    where: { day: weekday },
  });
  if (!workingHours || !workingHours.isOpen) return [];

  const { gte, lt } = dateRangeForDay(dateStr);

  const [holiday, timeOff, bookings, blockedSlots, holds] = await Promise.all([
    prisma.salonHoliday.findFirst({ where: { date: { gte, lt } } }),
    prisma.timeOff.findFirst({ where: { barberId, date: { gte, lt } } }),
    prisma.booking.findMany({
      where: {
        barberId,
        date: { gte, lt },
        status: { not: "CANCELLED" },
      },
      select: { time: true },
    }),
    prisma.blockedSlot.findMany({
      where: { barberId, date: { gte, lt } },
      select: { time: true },
    }),
    prisma.slotHold.findMany({
      where: {
        barberId,
        date: { gte, lt },
        expiresAt: { gt: new Date() },
        ...(excludeHoldId ? { id: { not: excludeHoldId } } : {}),
      },
      select: { time: true },
    }),
  ]);

  if (holiday || timeOff) return [];

  const unavailableTimes = new Set([
    ...bookings.map((b) => b.time),
    ...blockedSlots.map((s) => s.time),
    ...holds.map((h) => h.time),
  ]);
  const allSlots = generateSlotsInRange(
    workingHours.openTime,
    workingHours.closeTime,
  );
  return allSlots.filter(
    (slot) => !unavailableTimes.has(slot) && !isSlotInPast(dateStr, slot),
  );
}

// نسخه‌ی «همه‌ی بازه‌های زمانی + وضعیت» — برای UI مشتری، تا بازه‌های زمانی پر هم
// دیده بشن (قرمز/غیرفعال) نه اینکه از لیست کلاً حذف بشن
export interface SlotStatus {
  time: string;
  available: boolean;
  waitlistable: boolean;
}

export async function getSlotsWithStatus(
  barberId: string,
  dateStr: string,
  excludeHoldId?: string,
): Promise<SlotStatus[]> {
  const barber = await prisma.barberProfile.findUnique({
    where: { id: barberId },
  });
  if (!barber || !barber.isActive) return [];

  const dateOnly = parseDateOnly(dateStr);
  const weekday = WEEKDAY_BY_JS_DAY[dateOnly.getUTCDay()];

  // اگه روزکاری آرایشگر نیست، اصلاً هیچ بازه‌ای (حتی قرمز) نمایش نمی‌دیم
  if (!barberWorksOnWeekday(barber.workingDays, weekday)) return [];

  const workingHours = await prisma.workingHours.findUnique({
    where: { day: weekday },
  });
  if (!workingHours || !workingHours.isOpen) return [];

  const { gte, lt } = dateRangeForDay(dateStr);

  const [holiday, timeOff, bookings, blockedSlots, holds] = await Promise.all([
    prisma.salonHoliday.findFirst({ where: { date: { gte, lt } } }),
    prisma.timeOff.findFirst({ where: { barberId, date: { gte, lt } } }),
    prisma.booking.findMany({
      where: { barberId, date: { gte, lt }, status: { not: "CANCELLED" } },
      select: { time: true },
    }),
    prisma.blockedSlot.findMany({
      where: { barberId, date: { gte, lt } },
      select: { time: true },
    }),
    prisma.slotHold.findMany({
      where: {
        barberId,
        date: { gte, lt },
        expiresAt: { gt: new Date() },
        ...(excludeHoldId ? { id: { not: excludeHoldId } } : {}),
      },
      select: { time: true },
    }),
  ]);

  // مرخصی/تعطیلی یعنی کل روز بسته‌ست — بازم چیزی نشون نمی‌دیم
  if (holiday || timeOff) return [];

  const bookedTimes = new Set(bookings.map((booking) => booking.time));
  const unavailableTimes = new Set([
    ...bookedTimes,
    ...blockedSlots.map((s) => s.time),
    ...holds.map((h) => h.time),
  ]);
  const allSlots = generateSlotsInRange(
    workingHours.openTime,
    workingHours.closeTime,
  );
  return allSlots.map((time) => ({
    time,
    available: !unavailableTimes.has(time) && !isSlotInPast(dateStr, time),
    waitlistable: bookedTimes.has(time) && !isSlotInPast(dateStr, time),
  }));
}

export async function getAvailableDatesInRange(
  barberId: string,
  fromStr: string,
  toStr: string,
): Promise<string[]> {
  const barber = await prisma.barberProfile.findUnique({
    where: { id: barberId },
  });
  if (!barber || !barber.isActive) return [];

  const allWorkingHours = await prisma.workingHours.findMany();
  const hoursByDay = new Map(allWorkingHours.map((w) => [w.day, w]));

  const from = parseDateOnly(fromStr);
  const toExclusive = dateRangeForDay(toStr).lt;

  const [holidays, timeOffs, bookings, blockedSlots, holds] = await Promise.all(
    [
      prisma.salonHoliday.findMany({
        where: { date: { gte: from, lt: toExclusive } },
      }),
      prisma.timeOff.findMany({
        where: { barberId, date: { gte: from, lt: toExclusive } },
      }),
      prisma.booking.findMany({
        where: {
          barberId,
          date: { gte: from, lt: toExclusive },
          status: { not: "CANCELLED" },
        },
        select: { date: true, time: true },
      }),
      prisma.blockedSlot.findMany({
        where: { barberId, date: { gte: from, lt: toExclusive } },
        select: { date: true, time: true },
      }),
      prisma.slotHold.findMany({
        where: {
          barberId,
          date: { gte: from, lt: toExclusive },
          expiresAt: { gt: new Date() },
        },
        select: { date: true, time: true },
      }),
    ],
  );

  const holidaySet = new Set(
    holidays.map((h) => h.date.toISOString().slice(0, 10)),
  );
  const timeOffSet = new Set(
    timeOffs.map((t) => t.date.toISOString().slice(0, 10)),
  );

  const occupiedCountByDate = new Map<string, number>();
  for (const b of bookings) {
    const key = b.date.toISOString().slice(0, 10);
    occupiedCountByDate.set(key, (occupiedCountByDate.get(key) ?? 0) + 1);
  }
  for (const s of blockedSlots) {
    const key = s.date.toISOString().slice(0, 10);
    occupiedCountByDate.set(key, (occupiedCountByDate.get(key) ?? 0) + 1);
  }
  for (const h of holds) {
    const key = h.date.toISOString().slice(0, 10);
    occupiedCountByDate.set(key, (occupiedCountByDate.get(key) ?? 0) + 1);
  }

  const result: string[] = [];
  const cursor = new Date(from);
  while (cursor < toExclusive) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const weekday = WEEKDAY_BY_JS_DAY[cursor.getUTCDay()];
    const wh = hoursByDay.get(weekday);
    const barberWorksThisDay = barberWorksOnWeekday(
      barber.workingDays,
      weekday,
    );

    if (
      wh?.isOpen &&
      barberWorksThisDay &&
      !holidaySet.has(dateStr) &&
      !timeOffSet.has(dateStr)
    ) {
      const totalSlots = generateSlotsInRange(wh.openTime, wh.closeTime).filter(
        (time) => !isSlotInPast(dateStr, time),
      ).length;
      const occupied = occupiedCountByDate.get(dateStr) ?? 0;
      if (occupied < totalSlots) result.push(dateStr);
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}

// ==================== Slot Hold (نگه‌داری موقت بازه زمانی حین پروسه‌ی رزرو) ====================
//
// وقتی مشتری یه ساعت رو انتخاب می‌کنه (قبل از تکمیل فرم/لاگین/تایید نهایی)،
// یه رکورد SlotHold با انقضای ۵ دقیقه‌ای ساخته می‌شه تا مشتری‌های دیگه
// نتونن همون لحظه همون ساعت رو انتخاب کنن. اگه مشتری رها کنه یا ۵ دقیقه
// بگذره، هولد منقضی می‌شه و چون همه‌ی کوئری‌های availability بالا شرط
// expiresAt > now دارن، خودکار نادیده گرفته می‌شه — نیازی به cron نیست.

export async function createOrExtendHold(
  barberId: string,
  dateStr: string,
  time: string,
) {
  const barber = await prisma.barberProfile.findUnique({
    where: { id: barberId },
  });
  if (!barber || !barber.isActive) {
    throw new AppError("آرایشگر پیدا نشد", 404);
  }

  const availableSlots = await getAvailableSlots(barberId, dateStr);
  if (!availableSlots.includes(time)) {
    throw new AppError(
      "این بازه زمانی در دسترس نیست، لطفاً زمان دیگری انتخاب کنید",
      409,
    );
  }

  const dateOnly = parseDateOnly(dateStr);
  const expiresAt = new Date(Date.now() + HOLD_DURATION_MINUTES * 60 * 1000);

  const existing = await prisma.slotHold.findUnique({
    where: { barberId_date_time: { barberId, date: dateOnly, time } },
  });

  if (existing) {
    if (existing.expiresAt > new Date()) {
      throw new AppError(
        "این ساعت همین الان توسط شخص دیگری در حال رزرو است، لطفاً چند دقیقه‌ی دیگر امتحان کنید یا ساعت دیگری انتخاب کنید",
        409,
      );
    }
    if (existing.waitlistRequestId) {
      throw new AppError(
        "این ساعت در حال بررسی صف انتظار است؛ لطفاً چند لحظه دیگر تلاش کنید",
        409,
      );
    }
    // هولد قبلی منقضی شده — همون رکورد رو تمدید می‌کنیم
    return prisma.slotHold.update({
      where: { id: existing.id },
      data: { expiresAt },
    });
  }

  try {
    return await prisma.slotHold.create({
      data: { barberId, date: dateOnly, time, expiresAt },
    });
  } catch {
    // race condition: بین چک بالا و create، یه درخواست دیگه زودتر رسید
    throw new AppError(
      "این ساعت همین الان توسط شخص دیگری در حال رزرو است، لطفاً ساعت دیگری انتخاب کنید",
      409,
    );
  }
}

export async function extendHold(holdId: string) {
  const hold = await prisma.slotHold.findUnique({ where: { id: holdId } });
  if (!hold) {
    throw new AppError(
      "زمان نگه‌داری این نوبت تمام شده، لطفاً دوباره انتخاب کنید",
      410,
    );
  }
  if (hold.waitlistRequestId) {
    throw new AppError("این زمان به پیشنهاد صف انتظار اختصاص دارد", 403);
  }
  if (hold.expiresAt < new Date()) {
    await prisma.slotHold.delete({ where: { id: holdId } }).catch(() => {});
    throw new AppError(
      "زمان نگه‌داری این نوبت تمام شده، لطفاً دوباره انتخاب کنید",
      410,
    );
  }

  const expiresAt = new Date(Date.now() + HOLD_DURATION_MINUTES * 60 * 1000);
  return prisma.slotHold.update({ where: { id: holdId }, data: { expiresAt } });
}

export async function releaseHold(holdId: string) {
  await prisma.slotHold.deleteMany({
    where: { id: holdId, waitlistRequestId: null },
  });
}

const bookingIncludes = {
  barber: { include: { user: true } },
  service: true,
  bookingServices: { include: { service: true } },
  customer: true,
  // امتیازِ ثبت‌شده برای این نوبت (یا null) — تا UI مشتری بدونه کدوم نوبت‌های
  // تمام‌شده هنوز امتیاز نگرفتن
  rating: true,
} satisfies Prisma.BookingInclude;

export async function createBooking(
  customerId: string,
  input: CreateBookingInput,
) {
  const serviceIds = [
    ...new Set(input.serviceIds ?? (input.serviceId ? [input.serviceId] : [])),
  ];
  if (serviceIds.length === 0 || serviceIds.length > 2) {
    throw new AppError("برای هر نوبت باید یک یا دو سرویس انتخاب کنید", 400);
  }
  // اگه مشتری هولدهمین بازه زمانی رو داره، تو چک زیر خودش مانع خودش نشه
  let ownHoldId: string | undefined;
  if (input.holdId) {
    const hold = await prisma.slotHold.findUnique({
      where: { id: input.holdId },
    });
    const dateOnly = parseDateOnly(input.date);
    if (
      hold &&
      !hold.waitlistRequestId &&
      hold.barberId === input.barberId &&
      hold.time === input.time &&
      hold.date.getTime() === dateOnly.getTime() &&
      hold.expiresAt > new Date()
    ) {
      ownHoldId = hold.id;
    }
  }

  const availableSlots = await getAvailableSlots(
    input.barberId,
    input.date,
    ownHoldId,
  );
  if (!availableSlots.includes(input.time)) {
    throw new AppError(
      "این بازه زمانی دیگر در دسترس نیست، لطفاً زمان دیگری انتخاب کنید",
      409,
    );
  }

  const booking = await prisma.$transaction(async (tx) => {
    await lockWaitlistSlot(tx, input.barberId, input.date, input.time);
    // Deactivation locks this same row before checking/cancelling future
    // bookings, preventing a booking from slipping in during that decision.
    await tx.$queryRaw`SELECT id FROM barber_profiles WHERE id = ${input.barberId} FOR UPDATE`;

    const [existingBooking, activeHold] = await Promise.all([
      tx.booking.findFirst({
        where: {
          barberId: input.barberId,
          date: parseDateOnly(input.date),
          time: input.time,
          status: { not: "CANCELLED" },
        },
        select: { id: true },
      }),
      tx.slotHold.findUnique({
        where: {
          barberId_date_time: {
            barberId: input.barberId,
            date: parseDateOnly(input.date),
            time: input.time,
          },
        },
      }),
    ]);
    if (existingBooking) {
      throw new AppError(
        "این بازه زمانی دیگر در دسترس نیست، لطفاً زمان دیگری انتخاب کنید",
        409,
      );
    }
    if (
      activeHold &&
      activeHold.expiresAt > new Date() &&
      activeHold.id !== ownHoldId
    ) {
      throw new AppError(
        "این بازه زمانی در حال رزرو است؛ لطفاً دوباره انتخاب کنید",
        409,
      );
    }
    if (
      ownHoldId &&
      (!activeHold ||
        activeHold.id !== ownHoldId ||
        activeHold.waitlistRequestId ||
        activeHold.expiresAt <= new Date())
    ) {
      throw new AppError(
        "زمان نگه‌داری این نوبت تمام شده، لطفاً دوباره انتخاب کنید",
        409,
      );
    }

    const barberProfile = await tx.barberProfile.findUnique({
      where: { id: input.barberId },
      select: {
        isActive: true,
        user: { select: { isActive: true } },
        managePricing: true,
        exclusiveCustomers: true,
      },
    });
    if (!barberProfile) {
      throw new AppError("آرایشگر پیدا نشد", 404);
    }
    if (!barberProfile.isActive || !barberProfile.user.isActive) {
      throw new AppError("این آرایشگر در حال حاضر نوبت جدید نمی‌پذیرد", 409);
    }

    const barberServices = await tx.barberService.findMany({
      where: {
        barberId: input.barberId,
        serviceId: { in: serviceIds },
        isActive: true,
        service: { isActive: true },
      },
      include: { service: true },
    });
    if (barberServices.length !== serviceIds.length) {
      throw new AppError(
        "یکی از سرویس‌های انتخاب‌شده در حال حاضر توسط این آرایشگر ارائه نمی‌شود",
        400,
      );
    }

    // Snapshot current financial/privacy permissions at booking creation.
    const priceByServiceId = new Map(
      barberServices.map((item) => [
        item.serviceId,
        item.customPrice ?? item.service.priceValue,
      ]),
    );
    const booking = await tx.booking.create({
      data: {
        customerId,
        barberId: input.barberId,
        serviceId: serviceIds[0],
        date: parseDateOnly(input.date),
        time: input.time,
        notes: input.notes,
        price: serviceIds.reduce(
          (total, serviceId) => total + (priceByServiceId.get(serviceId) ?? 0),
          0,
        ),
        status: "CONFIRMED",
        isBarberOwnRevenue: barberProfile.managePricing,
        isPrivateCustomer: barberProfile.exclusiveCustomers,
      },
    });
    await tx.bookingServiceItem.createMany({
      data: serviceIds.map((serviceId) => ({
        bookingId: booking.id,
        serviceId,
        price: priceByServiceId.get(serviceId)!,
      })),
    });
    return tx.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: bookingIncludes,
    });
  });

  if (ownHoldId) {
    await prisma.slotHold
      .deleteMany({ where: { id: ownHoldId } })
      .catch(() => {});
  }

  // نوتیف برای آرایشگر: نوبت جدید ثبت شد
  await Promise.all([
    notifyUserSafely(
      booking.barber.user.id,
      {
        type: "BOOKING_CREATED",
        title: "نوبت جدید",
        body: `${booking.customer.name} یک نوبت برای ${formatPersianDate(booking.date)} ساعت ${toPersianDigits(booking.time)} ثبت کرد`,
        link: "/barber/bookings",
      },
      "booking-created-barber",
    ),
    notifyUserSafely(
      booking.customer.id,
      {
        type: "BOOKING_STATUS_CHANGED",
        title: "رزرو نوبت تایید شد",
        body: `نوبت شما برای ${formatPersianDate(booking.date)} ساعت ${toPersianDigits(booking.time)} ثبت شد`,
        link: "/customer/bookings",
      },
      "booking-created-customer",
    ),
  ]);

  return booking;
}

export async function getBarberProfileIdForUser(
  userId: string,
): Promise<string | null> {
  const profile = await prisma.barberProfile.findUnique({ where: { userId } });
  return profile?.id ?? null;
}

// excludePrivateCustomers: وقتی true، نوبت‌هایی که isPrivateCustomer=true
// دارن حذف می‌شن. کنترلر باید این رو true بفرسته برای /admin/bookings
// (ادمین/مدیر) و false/نده برای صفحه‌ی «نوبت‌های خودِ آرایشگر» (چون
// آرایشگر باید مشتری‌های اختصاصی خودش رو ببینه).
export async function listBookings(
  filter: ListBookingsQuery,
  excludePrivateCustomers = false,
) {
  const baseWhere: Prisma.BookingWhereInput = {};
  if (filter.barberId) baseWhere.barberId = filter.barberId;
  if (filter.customerId) baseWhere.customerId = filter.customerId;
  if (excludePrivateCustomers) baseWhere.isPrivateCustomer = false;

  if (filter.date) {
    const { gte, lt } = dateRangeForDay(filter.date);
    baseWhere.date = { gte, lt };
  } else if (filter.dateFrom || filter.dateTo) {
    baseWhere.date = {
      ...(filter.dateFrom ? { gte: parseDateOnly(filter.dateFrom) } : {}),
      ...(filter.dateTo ? { lt: dateRangeForDay(filter.dateTo).lt } : {}),
    };
  }

  if (filter.search) {
    baseWhere.customer = {
      OR: [
        { name: { contains: filter.search, mode: "insensitive" } },
        { mobile: { contains: filter.search } },
      ],
    };
  }

  const statuses =
    filter.statuses ?? (filter.status ? [filter.status] : undefined);
  const where: Prisma.BookingWhereInput = {
    ...baseWhere,
    ...(statuses ? { status: { in: statuses } } : {}),
  };
  const statusGroupsWhere = filter.status ? baseWhere : where;

  const [total, statusGroups] = await Promise.all([
    prisma.booking.count({ where }),
    filter.includeStatusCounts
      ? prisma.booking.groupBy({
          by: ["status"],
          where: statusGroupsWhere,
          _count: { _all: true },
        })
      : Promise.resolve(null),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / filter.pageSize));
  const page = Math.min(filter.page, totalPages);
  const items = await prisma.booking.findMany({
    where,
    include: bookingIncludes,
    orderBy: [{ date: filter.sort }, { time: "asc" }],
    skip: (page - 1) * filter.pageSize,
    take: filter.pageSize,
  });

  const statusCounts = filter.includeStatusCounts
    ? {
        CONFIRMED: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
        CANCELLED: 0,
      }
    : undefined;
  if (statusGroups && statusCounts) {
    for (const group of statusGroups) {
      statusCounts[group.status] = group._count._all;
    }
  }

  return {
    items,
    total,
    page,
    pageSize: filter.pageSize,
    totalPages,
    statusCounts,
  };
}

export async function getBookingById(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: bookingIncludes,
  });
  if (!booking) throw new AppError("نوبت پیدا نشد", 404);
  return booking;
}

// این تابع همیشه محدود به یک barberId خاصه (صفحه‌ی «مشتریان من» خودِ
// آرایشگر)، پس فیلتر isPrivateCustomer لازم نداره — آرایشگر باید مشتری‌های
// اختصاصی خودش رو هم ببینه. برای صفحه‌ی ادمین از این تابع استفاده نکنید؛
// اون باید از طریق ماژول customers با excludePrivateCustomers فراخوانی بشه.
export async function getBarberCustomers(barberId: string) {
  const bookings = await prisma.booking.findMany({
    where: { barberId },
    include: { customer: true },
    distinct: ["customerId"],
    orderBy: { createdAt: "desc" },
  });
  return bookings.map((b) => ({
    name: b.customer.name,
    phone: b.customer.mobile,
  }));
}

interface ActingUser {
  userId: string;
  role: Role;
}

export async function updateBookingStatus(
  bookingId: string,
  actingUser: ActingUser,
  newStatus: UpdateBookingStatusInput["status"],
  reason?: string,
) {
  const booking = await getBookingById(bookingId);

  const isAdmin = actingUser.role === "ADMIN" || actingUser.role === "MANAGER";
  const isOwnerCustomer =
    actingUser.role === "CUSTOMER" && booking.customerId === actingUser.userId;

  let isOwnerBarber = false;
  let barberCancelPermission = false;
  if (actingUser.role === "BARBER") {
    const profile = await prisma.barberProfile.findUnique({
      where: { userId: actingUser.userId },
    });
    if (profile && profile.id === booking.barberId) {
      isOwnerBarber = true;
      barberCancelPermission = profile.cancelOwnBookings;
    }
  }

  if (newStatus === "IN_PROGRESS") {
    if (!isOwnerBarber && !isAdmin) {
      throw new AppError("شما اجازه‌ی شروع این سرویس را ندارید", 403);
    }
    if (booking.status !== "CONFIRMED") {
      throw new AppError("فقط نوبت تاییدشده قابل شروع است", 400);
    }
  } else if (newStatus === "COMPLETED") {
    if (!isOwnerBarber && !isAdmin) {
      throw new AppError("شما اجازه‌ی پایان این سرویس را ندارید", 403);
    }
    if (booking.status !== "IN_PROGRESS") {
      throw new AppError("فقط نوبت در حال انجام قابل تکمیل است", 400);
    }
  } else if (newStatus === "CANCELLED") {
    const barberCanCancel = isOwnerBarber && barberCancelPermission;
    if (!isOwnerCustomer && !barberCanCancel && !isAdmin) {
      throw new AppError("شما اجازه‌ی لغو این نوبت را ندارید", 403);
    }
    if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
      throw new AppError("این نوبت قبلاً بسته شده است", 400);
    }
  }

  // آپدیت وضعیت نوبت + ثبت لغو + احتمالاً مسدودسازی مشتری، همه تو یه
  // تراکنش — تا اگه هرجاش خطا خورد، هیچ‌کدوم نصفه‌کاره ثبت نشه.
  const { booking: updated, customerBlocked } = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
      include: bookingIncludes,
    });
    let customerBlocked = false;

    if (newStatus === "CANCELLED") {
      // هر لغو (توسط هر نقشی) اینجا ثبت می‌شه — این جدول تاریخچه‌ی کامل لغوهاست
      await tx.cancellation.create({
        data: {
          bookingId: result.id,
          cancelledById: actingUser.userId,
          cancelledByRole: actingUser.role,
          reason: reason ?? null,
        },
      });

      // فقط لغوِ خودِ مشتری روی شمارنده‌ی مسدودسازی اثر داره؛ لغوی
      // آرایشگر/ادمین صرفاً بالا ثبت شد ولی مشتری رو به Block نزدیک نمی‌کنه.
      if (isOwnerCustomer) {
        const customer = await tx.user.update({
          where: { id: actingUser.userId },
          data: { cancelCount: { increment: 1 } },
        });

        if (
          customer.cancelCount >= CUSTOMER_CANCEL_BLOCK_THRESHOLD &&
          customer.isActive
        ) {
          await tx.user.update({
            where: { id: actingUser.userId },
            data: {
              isActive: false,
              blockedReason: `به دلیل لغو ${CUSTOMER_CANCEL_BLOCK_THRESHOLD} نوبت متوالی، حساب شما مسدود شد`,
              blockedAt: new Date(),
            },
          });
          customerBlocked = true;
        }
      }
    }

    return { booking: result, customerBlocked };
  });

  // نوتیف‌های تغییر وضعیت نوبت
  if (newStatus === "IN_PROGRESS") {
    await notifyUserSafely(
      updated.customer.id,
      {
        type: "BOOKING_STATUS_CHANGED",
        title: "شروع سرویس",
        body: `سرویس شما نزد ${updated.barber.user.name} شروع شد`,
        link: "/customer/bookings",
      },
      "booking-started",
    );
  } else if (newStatus === "COMPLETED") {
    await notifyUserSafely(
      updated.customer.id,
      {
        type: "BOOKING_STATUS_CHANGED",
        title: "سرویس تمام شد",
        body: `سرویس شما نزد ${updated.barber.user.name} تمام شد — می‌توانید امتیاز بدید`,
        link: `/customer/history?review=${updated.id}`,
      },
      "booking-completed",
    );
  } else if (newStatus === "CANCELLED") {
    if (isOwnerCustomer) {
      // مشتری خودش لغو کرد -> به آرایشگر اطلاع بده
      await notifyUserSafely(
        updated.barber.user.id,
        {
          type: "BOOKING_STATUS_CHANGED",
          title: "لغو نوبت",
          body: `نوبت ${formatPersianDate(updated.date)} ساعت ${toPersianDigits(updated.time)} توسط مشتری لغو شد`,
          link: "/barber/bookings",
        },
        "booking-cancelled-by-customer",
      );
    } else {
      // آرایشگر یا ادمین لغو کرد -> به مشتری اطلاع بده
      await notifyUserSafely(
        updated.customer.id,
        {
          type: "BOOKING_STATUS_CHANGED",
          title: "لغو نوبت",
          body: `نوبت شما برای ${formatPersianDate(updated.date)} ساعت ${toPersianDigits(updated.time)} لغو شد`,
          link: "/customer/bookings",
        },
        "booking-cancelled-by-staff",
      );
    }
    if (customerBlocked) {
      await notifyUserSafely(
        updated.customer.id,
        {
          type: "ACCOUNT_STATUS",
          title: "حساب شما به‌طور خودکار مسدود شد",
          body: `با رسیدن تعداد لغوهای نوبت به ${toPersianDigits(String(CUSTOMER_CANCEL_BLOCK_THRESHOLD))}، امکان ثبت نوبت جدید برای حساب شما غیرفعال شد. برای پیگیری با سالن تماس بگیرید.`,
          link: "/customer/bookings",
        },
        "customer-auto-blocked",
      );
    }
    try {
      await advanceWaitlistSlot(
        updated.barberId,
        updated.date.toISOString().slice(0, 10),
        updated.time,
      );
    } catch (error) {
      console.error(
        "خطا در انتقال صف انتظار پس از لغو نوبت",
        updated.id,
        error,
      );
    }
  }

  return updated;
}
