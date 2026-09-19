import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import type {
  CreateHolidayInput,
  ListHolidaysQuery,
} from "@/modules/holidays/holidays.schema";

function parseDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function dateRangeForDay(dateStr: string): { gte: Date; lt: Date } {
  const start = parseDateOnly(dateStr);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { gte: start, lt: end };
}

// خروجی API: تاریخ میلادی به‌صورت YYYY-MM-DD (تبدیل به جلالی سمت فرانت انجام می‌شه)
function toDto(h: { id: string; date: Date; reason: string | null }) {
  return { id: h.id, date: h.date.toISOString().slice(0, 10), reason: h.reason };
}

export async function listHolidays(query: ListHolidaysQuery) {
  const where: { date?: { gte?: Date; lt?: Date } } = {};
  if (query.from || query.to) {
    where.date = {
      ...(query.from ? { gte: parseDateOnly(query.from) } : {}),
      ...(query.to ? { lt: dateRangeForDay(query.to).lt } : {}),
    };
  }

  const holidays = await prisma.salonHoliday.findMany({
    where,
    orderBy: { date: "asc" },
  });
  return holidays.map(toDto);
}

export async function createHoliday(input: CreateHolidayInput) {
  const { gte, lt } = dateRangeForDay(input.date);

  const existing = await prisma.salonHoliday.findFirst({
    where: { date: { gte, lt } },
  });
  if (existing) {
    throw new AppError("این روز قبلاً به‌عنوان تعطیلی ثبت شده است", 409);
  }

  const activeBooking = await prisma.booking.findFirst({
    where: {
      date: { gte, lt },
      status: { in: ["CONFIRMED", "IN_PROGRESS"] },
    },
  });
  if (activeBooking) {
    throw new AppError(
      "برای این روز نوبت فعال وجود دارد؛ ابتدا نوبت‌ها را لغو کنید",
      409
    );
  }

  const holiday = await prisma.salonHoliday.create({
    data: { date: parseDateOnly(input.date), reason: input.reason || null },
  });
  return toDto(holiday);
}

export async function deleteHoliday(id: string) {
  const holiday = await prisma.salonHoliday.findUnique({ where: { id } });
  if (!holiday) throw new AppError("تعطیلی پیدا نشد", 404);

  await prisma.salonHoliday.delete({ where: { id } });
}