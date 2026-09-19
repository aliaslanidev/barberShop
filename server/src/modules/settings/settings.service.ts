import type { Weekday } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import { comparePassword, hashPassword } from "@/utils/password";
import type {
  ChangePasswordInput,
  UpdateSalonInfoInput,
  UpdateWorkingHoursInput,
} from "@/modules/settings/settings.schema";

// ترتیب نمایش: از شنبه تا جمعه
const WEEKDAYS: Weekday[] = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

// getUTCDay(): 0 = یکشنبه ... 6 = شنبه
const JS_DAY_TO_WEEKDAY: Weekday[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function toSalonDto(s: { name: string; address: string; phone: string }) {
  return { name: s.name, address: s.address, phone: s.phone };
}

function toHoursDto(w: { day: Weekday; isOpen: boolean; openTime: string; closeTime: string }) {
  return { day: w.day, isOpen: w.isOpen, openTime: w.openTime, closeTime: w.closeTime };
}

async function getOrCreateSalon() {
  return prisma.salonSettings.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main" },
  });
}

export async function getSettings() {
  const salon = await getOrCreateSalon();

  // اگه روزی تو دیتابیس نبود، با مقدار پیش‌فرض ساخته می‌شه
  const existing = await prisma.workingHours.findMany();
  const have = new Set(existing.map((w) => w.day));
  const missing = WEEKDAYS.filter((d) => !have.has(d));
  if (missing.length > 0) {
    await prisma.workingHours.createMany({
      data: missing.map((day) => ({ day })),
      skipDuplicates: true,
    });
  }

  const hours = await prisma.workingHours.findMany();
  const sorted = [...hours].sort(
    (a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day)
  );

  return { salon: toSalonDto(salon), workingHours: sorted.map(toHoursDto) };
}

export async function updateSalonInfo(input: UpdateSalonInfoInput) {
  const salon = await prisma.salonSettings.upsert({
    where: { id: "main" },
    update: input,
    create: { id: "main", ...input },
  });
  return toSalonDto(salon);
}

async function assertNoActiveBookingsOnWeekday(day: Weekday) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const bookings = await prisma.booking.findMany({
    where: { date: { gte: today }, status: { in: ["CONFIRMED", "IN_PROGRESS"] } },
    select: { date: true },
  });

  const hasAny = bookings.some((b) => JS_DAY_TO_WEEKDAY[b.date.getUTCDay()] === day);
  if (hasAny) {
    throw new AppError(
      "برای این روز هفته نوبت فعال آینده وجود دارد؛ ابتدا نوبت‌ها را لغو کنید",
      409
    );
  }
}

export async function updateWorkingHours(day: Weekday, input: UpdateWorkingHoursInput) {
  const current = await prisma.workingHours.upsert({
    where: { day },
    update: {},
    create: { day },
  });

  const next = {
    isOpen: input.isOpen ?? current.isOpen,
    openTime: input.openTime ?? current.openTime,
    closeTime: input.closeTime ?? current.closeTime,
  };

  if (next.isOpen && next.openTime >= next.closeTime) {
    throw new AppError("ساعت پایان باید بعد از ساعت شروع باشد", 400);
  }

  if (current.isOpen && !next.isOpen) {
    await assertNoActiveBookingsOnWeekday(day);
  }

  const updated = await prisma.workingHours.update({ where: { day }, data: next });
  return toHoursDto(updated);
}

export async function changeOwnPassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("کاربر پیدا نشد", 404);

  const isValid = await comparePassword(input.currentPassword, user.passwordHash);
  if (!isValid) throw new AppError("رمز عبور فعلی اشتباه است", 400);

  if (input.currentPassword === input.newPassword) {
    throw new AppError("رمز جدید باید با رمز فعلی متفاوت باشد", 400);
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}