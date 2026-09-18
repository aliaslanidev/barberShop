import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import type {
  CreateBlockedSlotInput,
  ListBlockedSlotsQuery,
} from "@/modules/blocked-slots/blocked-slots.schema";

function parseDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function dateRangeForDay(dateStr: string): { gte: Date; lt: Date } {
  const start = parseDateOnly(dateStr);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { gte: start, lt: end };
}

async function getOwnBarberProfileWithPermission(userId: string) {
  const barberProfile = await prisma.barberProfile.findUnique({ where: { userId } });
  if (!barberProfile) throw new AppError("پروفایل آرایشگر پیدا نشد", 404);
  if (!barberProfile.blockSlots) {
    throw new AppError("شما اجازه‌ی بلاک‌کردن اسلات را ندارید", 403);
  }
  return barberProfile;
}

export async function listOwnBlockedSlots(userId: string, query: ListBlockedSlotsQuery) {
  const barberProfile = await prisma.barberProfile.findUnique({ where: { userId } });
  if (!barberProfile) throw new AppError("پروفایل آرایشگر پیدا نشد", 404);

  const where: { barberId: string; date?: { gte?: Date; lt?: Date } } = {
    barberId: barberProfile.id,
  };
  if (query.from || query.to) {
    where.date = {
      ...(query.from ? { gte: parseDateOnly(query.from) } : {}),
      ...(query.to ? { lt: dateRangeForDay(query.to).lt } : {}),
    };
  }

  return prisma.blockedSlot.findMany({
    where,
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
}

export async function createOwnBlockedSlot(userId: string, input: CreateBlockedSlotInput) {
  const barberProfile = await getOwnBarberProfileWithPermission(userId);

  const { gte, lt } = dateRangeForDay(input.date);
  const existingBooking = await prisma.booking.findFirst({
    where: {
      barberId: barberProfile.id,
      date: { gte, lt },
      time: input.time,
      status: { not: "CANCELLED" },
    },
  });
  if (existingBooking) {
    throw new AppError("این اسلات نوبت تاییدشده دارد و قابل بلاک‌کردن نیست", 409);
  }

  return prisma.blockedSlot.upsert({
    where: {
      barberId_date_time: {
        barberId: barberProfile.id,
        date: parseDateOnly(input.date),
        time: input.time,
      },
    },
    update: {},
    create: {
      barberId: barberProfile.id,
      date: parseDateOnly(input.date),
      time: input.time,
    },
  });
}

export async function deleteOwnBlockedSlot(userId: string, id: string) {
  const barberProfile = await getOwnBarberProfileWithPermission(userId);

  const slot = await prisma.blockedSlot.findUnique({ where: { id } });
  if (!slot || slot.barberId !== barberProfile.id) {
    throw new AppError("اسلات بلاک‌شده پیدا نشد", 404);
  }

  await prisma.blockedSlot.delete({ where: { id } });
}