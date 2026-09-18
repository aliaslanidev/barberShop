import type { Prisma, Role, Weekday } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
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
export async function getAvailableSlots(barberId: string, dateStr: string): Promise<string[]> {
  const barber = await prisma.barberProfile.findUnique({ where: { id: barberId } });
  if (!barber || !barber.isActive) return [];

  const dateOnly = parseDateOnly(dateStr);
  const weekday = WEEKDAY_BY_JS_DAY[dateOnly.getUTCDay()];

  if (!barberWorksOnWeekday(barber.workingDays, weekday)) return [];

  const workingHours = await prisma.workingHours.findUnique({ where: { day: weekday } });
  if (!workingHours || !workingHours.isOpen) return [];

  const { gte, lt } = dateRangeForDay(dateStr);

  const [holiday, timeOff, bookings, blockedSlots] = await Promise.all([
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
  ]);

  if (holiday || timeOff) return [];

  const unavailableTimes = new Set([
    ...bookings.map((b) => b.time),
    ...blockedSlots.map((s) => s.time),
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
  dateStr: string
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

  const [holiday, timeOff, bookings, blockedSlots] = await Promise.all([
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
  ]);

  // مرخصی/تعطیلی یعنی کل روز بسته‌ست — بازم چیزی نشون نمی‌دیم
  if (holiday || timeOff) return [];

  const unavailableTimes = new Set([
    ...bookings.map((b) => b.time),
    ...blockedSlots.map((s) => s.time),
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

  const [holidays, timeOffs, bookings, blockedSlots] = await Promise.all([
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

const bookingIncludes = {
  barber: { include: { user: true } },
  service: true,
  customer: true,
} satisfies Prisma.BookingInclude;

export async function createBooking(customerId: string, input: CreateBookingInput) {
  const availableSlots = await getAvailableSlots(input.barberId, input.date);
  if (!availableSlots.includes(input.time)) {
    throw new AppError("این اسلات زمانی دیگه در دسترس نیست، لطفاً زمان دیگری انتخاب کنید", 409);
  }

  const barberService = await prisma.barberService.findUnique({
    where: { barberId_serviceId: { barberId: input.barberId, serviceId: input.serviceId } },
  });
  if (!barberService || !barberService.isActive) {
    throw new AppError("این سرویس در حال حاضر توسط این آرایشگر ارائه نمی‌شود", 400);
  }

  return prisma.booking.create({
    data: {
      customerId,
      barberId: input.barberId,
      serviceId: input.serviceId,
      date: parseDateOnly(input.date),
      time: input.time,
      notes: input.notes,
      status: "CONFIRMED",
    },
    include: bookingIncludes,
  });
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

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: newStatus },
    include: bookingIncludes,
  });
}