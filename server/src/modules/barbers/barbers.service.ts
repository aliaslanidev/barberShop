import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import { hashPassword } from "@/utils/password";
import { notifyUser } from "@/modules/notifications/notifications.service";
import type {
  CreateBarberInput,
  UpdateBarberInput,
  UpdatePermissionsInput,
  UpdateBarberAccountStatusInput,
} from "@/modules/barbers/barbers.schema";
import type { Role, Weekday } from "@prisma/client";
import {
  getRatingSummaries,
  EMPTY_RATING_SUMMARY,
} from "@/modules/ratings/ratings.service";

// user.isActive/blockedReason/blockedAt هم اینجا include می‌شن تا فرانت
// بتونه وضعیت «دسترسی به حساب» رو (جدا از BarberProfile.isActive که
// «پذیرش نوبت جدید» رو کنترل می‌کنه) نشون بده.
const barberInclude = {
  user: {
    select: {
      id: true,
      name: true,
      mobile: true,
      isActive: true,
      blockedReason: true,
      blockedAt: true,
    },
  },
  services: { include: { service: true } },
};

export async function getAllBarbers() {
  const barbers = await prisma.barberProfile.findMany({
    include: barberInclude,
    orderBy: { createdAt: "asc" },
  });

  // معدل امتیاز و تعداد آرا (عمومی) — با یک کوئری برای همه‌ی آرایشگرها
  const summaries = await getRatingSummaries(barbers.map((b) => b.id));
  return barbers.map((b) => ({
    ...b,
    rating: summaries.get(b.id) ?? EMPTY_RATING_SUMMARY,
  }));
}

export async function getBarberById(id: string) {
  const barber = await prisma.barberProfile.findUnique({
    where: { id },
    include: barberInclude,
  });
  if (!barber) throw new AppError("آرایشگر پیدا نشد", 404);

  const summaries = await getRatingSummaries([id]);
  return { ...barber, rating: summaries.get(id) ?? EMPTY_RATING_SUMMARY };
}

export async function createBarber(input: CreateBarberInput) {
  const exists = await prisma.user.findUnique({ where: { mobile: input.mobile } });
  if (exists) throw new AppError("این شماره موبایل قبلاً ثبت شده است", 409);

  const passwordHash = await hashPassword(input.password);
  const initials = input.name.slice(0, 2);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      mobile: input.mobile,
      passwordHash,
      role: "BARBER",
      barberProfile: {
        create: {
          bio: input.bio ?? "",
          initials,
          services: input.serviceIds
            ? { create: input.serviceIds.map((serviceId) => ({ serviceId })) }
            : undefined,
        },
      },
    },
    include: { barberProfile: true },
  });

  return getBarberById(user.barberProfile!.id);
}

export async function updateBarber(id: string, input: UpdateBarberInput) {
  const barber = await getBarberById(id);

  if (input.name || input.mobile) {
    await prisma.user.update({
      where: { id: barber.user.id },
      data: { name: input.name, mobile: input.mobile },
    });
  }

  if (input.serviceIds) {
    await prisma.barberService.deleteMany({ where: { barberId: id } });
    await prisma.barberService.createMany({
      data: input.serviceIds.map((serviceId) => ({ barberId: id, serviceId })),
    });
  }

  await prisma.barberProfile.update({
    where: { id },
    data: { bio: input.bio, isActive: input.isActive },
  });

  return getBarberById(id);
}

export async function updateBarberPermissions(id: string, input: UpdatePermissionsInput) {
  await getBarberById(id);
  await prisma.barberProfile.update({ where: { id }, data: input });
  return getBarberById(id);
}

export async function deleteBarber(id: string) {
  const barber = await getBarberById(id);
  await prisma.user.delete({ where: { id: barber.user.id } });
}

async function getOwnBarberServiceOrThrow(userId: string, serviceId: string) {
  const barberProfile = await prisma.barberProfile.findUnique({ where: { userId } });
  if (!barberProfile) throw new AppError("پروفایل آرایشگر پیدا نشد", 404);

  const link = await prisma.barberService.findUnique({
    where: { barberId_serviceId: { barberId: barberProfile.id, serviceId } },
  });
  if (!link) throw new AppError("این سرویس برای شما تعریف نشده است", 404);

  return { barberProfile, link };
}

export async function updateOwnServicePrice(
  userId: string,
  serviceId: string,
  customPrice: number | null
) {
  const { barberProfile } = await getOwnBarberServiceOrThrow(userId, serviceId);

  if (!barberProfile.managePricing) {
    throw new AppError("شما اجازه‌ی تعیین قیمت را ندارید", 403);
  }

  await prisma.barberService.update({
    where: { barberId_serviceId: { barberId: barberProfile.id, serviceId } },
    data: { customPrice },
  });

  return getBarberById(barberProfile.id);
}

export async function updateOwnServiceActive(
  userId: string,
  serviceId: string,
  isActive: boolean
) {
  const { barberProfile } = await getOwnBarberServiceOrThrow(userId, serviceId);

  if (!barberProfile.manageServices) {
    throw new AppError("شما اجازه‌ی فعال/غیرفعال‌کردن خدمات را ندارید", 403);
  }

  await prisma.barberService.update({
    where: { barberId_serviceId: { barberId: barberProfile.id, serviceId } },
    data: { isActive },
  });

  return getBarberById(barberProfile.id);
}

// آرایشگر با پرمیشن manageSchedule، روزهای کاری هفتگی خودش رو تعیین می‌کنه.
// آرایه‌ی خالی یعنی برگرد به پیروی از روزهای بازسالن.
export async function updateOwnWorkingDays(userId: string, workingDays: Weekday[]) {
  const barberProfile = await prisma.barberProfile.findUnique({ where: { userId } });
  if (!barberProfile) throw new AppError("پروفایل آرایشگر پیدا نشد", 404);

  if (!barberProfile.manageSchedule) {
    throw new AppError("شما اجازه‌ی تعیین زمان‌بندی را ندارید", 403);
  }

  await prisma.barberProfile.update({
    where: { id: barberProfile.id },
    data: { workingDays },
  });

  return getBarberById(barberProfile.id);
}

// ==================== غیرفعال‌سازی کامل حساب آرایشگر (فاز تکمیلی ۱.۲) ====================

// نوبت‌های آینده‌ی تاییدشده‌ی این آرایشگر (امروز به بعد) — برای نمایش تو
// مودال تایید قبل از غیرفعال‌سازی کامل حساب.
export async function getFutureConfirmedBookings(barberId: string) {
  await getBarberById(barberId);

  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  return prisma.booking.findMany({
    where: { barberId, status: "CONFIRMED", date: { gte: todayStart } },
    include: { customer: true, service: true },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
}

interface ActingAdmin {
  userId: string;
  role: Role;
}

export async function updateBarberAccountStatus(
  id: string,
  input: UpdateBarberAccountStatusInput,
  actingAdmin: ActingAdmin
) {
  const barber = await getBarberById(id);

  if (input.isActive) {
    // رفع مسدودیت — فقط دسترسی به حساب برمی‌گرده. BarberProfile.isActive
    // («پذیرش نوبت جدید») خودکار برنمی‌گرده؛ ادمین جدا تصمیم می‌گیره کِی
    // نوبت‌گیری رو هم باز کنه (مثلاً بعد از پایان مرخصی طولانی).
    await prisma.user.update({
      where: { id: barber.user.id },
      data: { isActive: true, blockedReason: null, blockedAt: null },
    });
    return getBarberById(id);
  }

  const futureBookings = await getFutureConfirmedBookings(id);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: barber.user.id },
      data: {
        isActive: false,
        blockedReason: input.reason ?? "توسط ادمین غیرفعال شد",
        blockedAt: new Date(),
      },
    });

    // کسکید یک‌طرفه: غیرفعال‌شدن حساب همیشه پذیرش نوبت جدید رو هم می‌بنده
    await tx.barberProfile.update({ where: { id }, data: { isActive: false } });

    if (input.cancelFutureBookings) {
      for (const booking of futureBookings) {
        await tx.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });
        await tx.cancellation.create({
          data: {
            bookingId: booking.id,
            cancelledById: actingAdmin.userId,
            cancelledByRole: actingAdmin.role,
            reason: "غیرفعال‌سازی حساب آرایشگر توسط ادمین",
          },
        });
      }
    }
  });

  if (input.cancelFutureBookings) {
    for (const booking of futureBookings) {
      notifyUser(booking.customerId, {
        type: "BOOKING_STATUS_CHANGED",
        title: "لغو نوبت",
        body: `نوبت شما برای ${booking.date.toISOString().slice(0, 10)} ساعت ${booking.time} به دلیل در دسترس نبودن آرایشگر لغو شد`,
        link: "/customer/bookings",
      }).catch(() => {});
    }
  }

  return getBarberById(id);
}