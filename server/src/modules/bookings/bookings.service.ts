import type { Prisma, Role, Weekday } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import { notifyUser } from "@/modules/notifications/notifications.service";
import type {
  CreateBookingInput,
  ListBookingsQuery,
  UpdateBookingStatusInput,
} from "@/modules/bookings/bookings.schema";

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

// مدت زمانی که یه اسلات بعد از انتخاب‌شدن (قبل از ثبت نهایی) برای همون
// مشتری نگه داشته می‌شه؛ تا این مدت بقیه نمی‌تونن همون ساعت رو انتخاب کنن.
const HOLD_DURATION_MINUTES = 5;

function generateSlotsInRange(openTime: string, closeTime: string): string[] {
  const slots: string[] = [];
  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  let cursor = openH * 60 + openM;
  const end = closeH * 60 + closeM;
  while (cursor + SLOT_DURATION_MINUTES <= end) {
    const h = Math.floor(cursor / 60).toString().padStart(2, "0");
    const m = (cursor % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    cursor += SLOT_DURATION_MINUTES;
  }
  return slots;
}

function barberWorksOnWeekday(workingDays: Weekday[], weekday: Weekday): boolean {
  return workingDays.length === 0 || workingDays.includes(weekday);
}

// نسخه‌ی «فقط آزادها» — برای منطق داخلی (ساخت نوبت، شمارش ظرفیت روزها)
//
// excludeHoldId: هولدِ خودِ همین مشتری رو نادیده بگیر. وقتی مشتری داره
// نوبتش رو نهایی می‌کنه یا هولدش رو تمدید می‌کنه، نباید هولد خودش مانعش بشه.
export async function getAvailableSlots(
  barberId: string,
  dateStr: string,
  excludeHoldId?: string
): Promise<string[]> {
  const barber = await prisma.barberProfile.findUnique({ where: { id: barberId } });
  if (!barber || !barber.isActive) return [];

  const dateOnly = parseDateOnly(dateStr);
  const weekday = WEEKDAY_BY_JS_DAY[dateOnly.getUTCDay()];

  if (!barberWorksOnWeekday(barber.workingDays, weekday)) return [];

  const workingHours = await prisma.workingHours.findUnique({ where: { day: weekday } });
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
  const allSlots = generateSlotsInRange(workingHours.openTime, workingHours.closeTime);
  return allSlots.filter((slot) => !unavailableTimes.has(slot));
}

// نسخه‌ی «همه‌ی اسلات‌ها + وضعیت» — برای UI مشتری، تا اسلات‌های پر هم
// دیده بشن (قرمز/غیرفعال) نه اینکه از لیست کلاً حذف بشن
export interface SlotStatus {
  time: string;
  available: boolean;
}

export async function getSlotsWithStatus(
  barberId: string,
  dateStr: string,
  excludeHoldId?: string
): Promise<SlotStatus[]> {
  const barber = await prisma.barberProfile.findUnique({ where: { id: barberId } });
  if (!barber || !barber.isActive) return [];

  const dateOnly = parseDateOnly(dateStr);
  const weekday = WEEKDAY_BY_JS_DAY[dateOnly.getUTCDay()];

  // اگه روزِ کاری آرایشگر نیست، اصلاً هیچ اسلاتی (حتی قرمز) نمایش نمی‌دیم
  if (!barberWorksOnWeekday(barber.workingDays, weekday)) return [];

  const workingHours = await prisma.workingHours.findUnique({ where: { day: weekday } });
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

  const unavailableTimes = new Set([
    ...bookings.map((b) => b.time),
    ...blockedSlots.map((s) => s.time),
    ...holds.map((h) => h.time),
  ]);
  const allSlots = generateSlotsInRange(workingHours.openTime, workingHours.closeTime);
  return allSlots.map((time) => ({ time, available: !unavailableTimes.has(time) }));
}

export async function getAvailableDatesInRange(
  barberId: string,
  fromStr: string,
  toStr: string
): Promise<string[]> {
  const barber = await prisma.barberProfile.findUnique({ where: { id: barberId } });
  if (!barber || !barber.isActive) return [];

  const allWorkingHours = await prisma.workingHours.findMany();
  const hoursByDay = new Map(allWorkingHours.map((w) => [w.day, w]));

  const from = parseDateOnly(fromStr);
  const toExclusive = dateRangeForDay(toStr).lt;

  const [holidays, timeOffs, bookings, blockedSlots, holds] = await Promise.all([
    prisma.salonHoliday.findMany({ where: { date: { gte: from, lt: toExclusive } } }),
    prisma.timeOff.findMany({ where: { barberId, date: { gte: from, lt: toExclusive } } }),
    prisma.booking.findMany({
      where: { barberId, date: { gte: from, lt: toExclusive }, status: { not: "CANCELLED" } },
      select: { date: true, time: true },
    }),
    prisma.blockedSlot.findMany({
      where: { barberId, date: { gte: from, lt: toExclusive } },
      select: { date: true, time: true },
    }),
    prisma.slotHold.findMany({
      where: { barberId, date: { gte: from, lt: toExclusive }, expiresAt: { gt: new Date() } },
      select: { date: true, time: true },
    }),
  ]);

  const holidaySet = new Set(holidays.map((h) => h.date.toISOString().slice(0, 10)));
  const timeOffSet = new Set(timeOffs.map((t) => t.date.toISOString().slice(0, 10)));

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
    const barberWorksThisDay = barberWorksOnWeekday(barber.workingDays, weekday);

    if (wh?.isOpen && barberWorksThisDay && !holidaySet.has(dateStr) && !timeOffSet.has(dateStr)) {
      const totalSlots = generateSlotsInRange(wh.openTime, wh.closeTime).length;
      const occupied = occupiedCountByDate.get(dateStr) ?? 0;
      if (occupied < totalSlots) result.push(dateStr);
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}

// ==================== Slot Hold (نگه‌داری موقت اسلات حین پروسه‌ی رزرو) ====================
//
// وقتی مشتری یه ساعت رو انتخاب می‌کنه (قبل از تکمیل فرم/لاگین/تایید نهایی)،
// یه رکورد SlotHold با انقضای ۵ دقیقه‌ای ساخته می‌شه تا مشتری‌های دیگه
// نتونن همون لحظه همون ساعت رو انتخاب کنن. اگه مشتری رها کنه یا ۵ دقیقه
// بگذره، هولد منقضی می‌شه و چون همه‌ی کوئری‌های availability بالا شرط
// expiresAt > now دارن، خودکار نادیده گرفته می‌شه — نیازی به cron نیست.

export async function createOrExtendHold(barberId: string, dateStr: string, time: string) {
  const barber = await prisma.barberProfile.findUnique({ where: { id: barberId } });
  if (!barber || !barber.isActive) {
    throw new AppError("آرایشگر پیدا نشد", 404);
  }

  const availableSlots = await getAvailableSlots(barberId, dateStr);
  if (!availableSlots.includes(time)) {
    throw new AppError("این اسلات زمانی در دسترس نیست، لطفاً زمان دیگری انتخاب کنید", 409);
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
        409
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
    throw new AppError("این ساعت همین الان توسط شخص دیگری در حال رزرو است، لطفاً ساعت دیگری انتخاب کنید", 409);
  }
}

export async function extendHold(holdId: string) {
  const hold = await prisma.slotHold.findUnique({ where: { id: holdId } });
  if (!hold) {
    throw new AppError("زمان نگه‌داری این نوبت تمام شده، لطفاً دوباره انتخاب کنید", 410);
  }
  if (hold.expiresAt < new Date()) {
    await prisma.slotHold.delete({ where: { id: holdId } }).catch(() => {});
    throw new AppError("زمان نگه‌داری این نوبت تمام شده، لطفاً دوباره انتخاب کنید", 410);
  }

  const expiresAt = new Date(Date.now() + HOLD_DURATION_MINUTES * 60 * 1000);
  return prisma.slotHold.update({ where: { id: holdId }, data: { expiresAt } });
}

export async function releaseHold(holdId: string) {
  await prisma.slotHold.deleteMany({ where: { id: holdId } });
}

const bookingIncludes = {
  barber: { include: { user: true } },
  service: true,
  customer: true,
  // امتیازِ ثبت‌شده برای این نوبت (یا null) — تا UI مشتری بدونه کدوم نوبت‌های
  // تمام‌شده هنوز امتیاز نگرفتن
  rating: true,
} satisfies Prisma.BookingInclude;

export async function createBooking(customerId: string, input: CreateBookingInput) {
  // اگه مشتری هولدِ همین اسلات رو داره، تو چک زیر خودش مانع خودش نشه
  let ownHoldId: string | undefined;
  if (input.holdId) {
    const hold = await prisma.slotHold.findUnique({ where: { id: input.holdId } });
    const dateOnly = parseDateOnly(input.date);
    if (
      hold &&
      hold.barberId === input.barberId &&
      hold.time === input.time &&
      hold.date.getTime() === dateOnly.getTime() &&
      hold.expiresAt > new Date()
    ) {
      ownHoldId = hold.id;
    }
  }

  const availableSlots = await getAvailableSlots(input.barberId, input.date, ownHoldId);
  if (!availableSlots.includes(input.time)) {
    throw new AppError("این اسلات زمانی دیگر در دسترس نیست، لطفاً زمان دیگری انتخاب کنید", 409);
  }

  const barberService = await prisma.barberService.findUnique({
    where: { barberId_serviceId: { barberId: input.barberId, serviceId: input.serviceId } },
    include: { service: true },
  });
  if (!barberService || !barberService.isActive) {
    throw new AppError("این سرویس در حال حاضر توسط این آرایشگر ارائه نمی‌شود", 400);
  }

  const booking = await prisma.booking.create({
    data: {
      customerId,
      barberId: input.barberId,
      serviceId: input.serviceId,
      date: parseDateOnly(input.date),
      time: input.time,
      notes: input.notes,
      // قیمت نهایی همین لحظه ثبت می‌شه؛ تغییر بعدیِ قیمت آرایشگر/سرویس روی این نوبت اثری نداره
      price: barberService.customPrice ?? barberService.service.priceValue,
      status: "CONFIRMED",
    },
    include: bookingIncludes,
  });

  if (ownHoldId) {
    await prisma.slotHold.deleteMany({ where: { id: ownHoldId } }).catch(() => {});
  }

  // نوتیف برای آرایشگر: نوبت جدید ثبت شد
  notifyUser(booking.barber.user.id, {
    type: "BOOKING_CREATED",
    title: "نوبت جدید",
    body: `${booking.customer.name} یک نوبت برای ${booking.date.toISOString().slice(0, 10)} ساعت ${booking.time} ثبت کرد`,
    link: "/barber/bookings",
  }).catch(() => {});

  return booking;
}

export async function getBarberProfileIdForUser(userId: string): Promise<string | null> {
  const profile = await prisma.barberProfile.findUnique({ where: { userId } });
  return profile?.id ?? null;
}

export async function listBookings(filter: ListBookingsQuery) {
  const where: Prisma.BookingWhereInput = {};
  if (filter.barberId) where.barberId = filter.barberId;
  if (filter.customerId) where.customerId = filter.customerId;
  if (filter.status) where.status = filter.status;

  if (filter.date) {
    const { gte, lt } = dateRangeForDay(filter.date);
    where.date = { gte, lt };
  } else if (filter.dateFrom || filter.dateTo) {
    where.date = {
      ...(filter.dateFrom ? { gte: parseDateOnly(filter.dateFrom) } : {}),
      ...(filter.dateTo ? { lt: dateRangeForDay(filter.dateTo).lt } : {}),
    };
  }

  return prisma.booking.findMany({
    where,
    include: bookingIncludes,
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
}

export async function getBookingById(id: string) {
  const booking = await prisma.booking.findUnique({ where: { id }, include: bookingIncludes });
  if (!booking) throw new AppError("نوبت پیدا نشد", 404);
  return booking;
}

export async function getBarberCustomers(barberId: string) {
  const bookings = await prisma.booking.findMany({
    where: { barberId },
    include: { customer: true },
    distinct: ["customerId"],
    orderBy: { createdAt: "desc" },
  });
  return bookings.map((b) => ({ name: b.customer.name, phone: b.customer.mobile }));
}

interface ActingUser {
  userId: string;
  role: Role;
}

export async function updateBookingStatus(
  bookingId: string,
  actingUser: ActingUser,
  newStatus: UpdateBookingStatusInput["status"]
) {
  const booking = await getBookingById(bookingId);

  const isAdmin = actingUser.role === "ADMIN" || actingUser.role === "MANAGER";
  const isOwnerCustomer =
    actingUser.role === "CUSTOMER" && booking.customerId === actingUser.userId;

  let isOwnerBarber = false;
  let barberCancelPermission = false;
  if (actingUser.role === "BARBER") {
    const profile = await prisma.barberProfile.findUnique({ where: { userId: actingUser.userId } });
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

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: newStatus },
    include: bookingIncludes,
  });

  // نوتیف‌های تغییر وضعیت نوبت
  if (newStatus === "IN_PROGRESS") {
    notifyUser(updated.customer.id, {
      type: "BOOKING_STATUS_CHANGED",
      title: "شروع سرویس",
      body: `سرویس شما نزد ${updated.barber.user.name} شروع شد`,
      link: "/customer/bookings",
    }).catch(() => {});
  } else if (newStatus === "COMPLETED") {
    notifyUser(updated.customer.id, {
      type: "BOOKING_STATUS_CHANGED",
      title: "سرویس تمام شد",
      body: `سرویس شما نزد ${updated.barber.user.name} تمام شد — می‌تونید امتیاز بدید`,
      link: "/customer/bookings",
    }).catch(() => {});
  } else if (newStatus === "CANCELLED") {
    if (isOwnerCustomer) {
      // مشتری خودش لغو کرد -> به آرایشگر اطلاع بده
      notifyUser(updated.barber.user.id, {
        type: "BOOKING_STATUS_CHANGED",
        title: "لغو نوبت",
        body: `نوبت ${updated.date.toISOString().slice(0, 10)} ساعت ${updated.time} توسط مشتری لغو شد`,
        link: "/barber/bookings",
      }).catch(() => {});
    } else {
      // آرایشگر یا ادمین لغو کرد -> به مشتری اطلاع بده
      notifyUser(updated.customer.id, {
        type: "BOOKING_STATUS_CHANGED",
        title: "لغو نوبت",
        body: `نوبت شما برای ${updated.date.toISOString().slice(0, 10)} ساعت ${updated.time} لغو شد`,
        link: "/customer/bookings",
      }).catch(() => {});
    }
  }

  return updated;
}