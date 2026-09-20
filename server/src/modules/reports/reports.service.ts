import { prisma } from "@/lib/prisma";
import type { BookingStatus } from "@prisma/client";

const ALL_STATUSES: BookingStatus[] = ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export async function getBookingsSummary() {
  const [totalCount, statusGroups, barberGroups, barbers] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.booking.groupBy({ by: ["barberId"], _count: { _all: true } }),
    prisma.barberProfile.findMany({ include: { user: { select: { name: true } } } }),
  ]);

  const byStatus = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<
    BookingStatus,
    number
  >;
  for (const g of statusGroups) byStatus[g.status] = g._count._all;

  const barberNameById = new Map(barbers.map((b) => [b.id, b.user.name]));

  const barbersWithBookings = barberGroups.map((g) => ({
    barberId: g.barberId,
    barberName: barberNameById.get(g.barberId) ?? "—",
    count: g._count._all,
  }));

  // آرایشگرهایی که هنوز هیچ نوبتی ندارن هم با شمار صفر تو لیست باشن
  const barbersWithNoBookings = barbers
    .filter((b) => !barberGroups.some((g) => g.barberId === b.id))
    .map((b) => ({ barberId: b.id, barberName: b.user.name, count: 0 }));

  const byBarber = [...barbersWithBookings, ...barbersWithNoBookings].sort(
    (a, b) => b.count - a.count,
  );

  return { totalCount, byStatus, byBarber };
}

// آمار داشبورد ادمین: نوبت‌های امروز، آرایشگرهای فعال، تعداد خدمات، درآمد
// این ماه (فقط نوبت‌های COMPLETED، چون طبق تصمیم پروژه پرداخت فقط حضوری و
// بعد از انجام سرویس ثبت می‌شه).
export async function getDashboardSummary() {
  const now = new Date();

  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const [todaysBookingsCount, activeBarbersCount, servicesCount, completedThisMonth] =
    await Promise.all([
      prisma.booking.count({
        where: { date: { gte: todayStart, lt: todayEnd }, status: { not: "CANCELLED" } },
      }),
      prisma.barberProfile.count({ where: { isActive: true } }),
      prisma.service.count(),
      prisma.booking.findMany({
        where: { status: "COMPLETED", date: { gte: monthStart, lt: monthEnd } },
        select: { price: true, service: { select: { priceValue: true } } },
      }),
    ]);

  // price ممکنه برای نوبت‌های خیلی قدیمی null باشه؛ اون‌وقت از قیمت پایه‌ی
  // سرویس استفاده می‌کنیم (همون قانونی که بقیه‌ی جاهای پروژه دارن)
  const revenueThisMonth = completedThisMonth.reduce(
    (sum, b) => sum + (b.price ?? b.service.priceValue),
    0,
  );

  return {
    todaysBookingsCount,
    activeBarbersCount,
    servicesCount,
    revenueThisMonth,
  };
}