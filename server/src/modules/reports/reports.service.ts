import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import type { BookingStatus } from "@prisma/client";

const ALL_STATUSES: BookingStatus[] = ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

// این تابع فقط «گزارش عمومی سالن» رو برمی‌گردونه — طبق تصمیم بند ۷.۱،
// هر نوبتی که isPrivateCustomer=true داره (یعنی وقت ثبت، آرایشگر پرمیشن
// «مشتری اختصاصی» رو داشته) از totalCount و byBarber کاملاً حذف می‌شه؛
// این نوبت‌ها اصلاً جزو «نوبت‌های سالن» محسوب نمی‌شن.
export async function getBookingsSummary() {
  const salonWhere = { isPrivateCustomer: false } as const;

  const [totalCount, statusGroups, barberGroups, barbers] = await Promise.all([
    prisma.booking.count({ where: salonWhere }),
    prisma.booking.groupBy({ by: ["status"], where: salonWhere, _count: { _all: true } }),
    prisma.booking.groupBy({ by: ["barberId"], where: salonWhere, _count: { _all: true } }),
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
//
// revenueThisMonth فقط درآمدِ سالنه: نوبت‌هایی که isBarberOwnRevenue=true
// دارن (یعنی وقت ثبت، آرایشگر پرمیشن managePricing رو داشته) کاملاً از این
// جمع حذف می‌شن — طبق تصمیم بند ۷.۱، حتی اگه آرایشگر قیمتش رو عوض نکرده
// باشه، بازم جزو درآمد سالن حساب نمی‌شه.
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
        where: {
          status: "COMPLETED",
          date: { gte: monthStart, lt: monthEnd },
          isBarberOwnRevenue: false,
        },
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

// گزارش مالیِ سالن قابل‌فیلتر بر اساس آرایشگر و بازه‌ی تاریخ (بند ۷.۱).
// همیشه isBarberOwnRevenue=false و isPrivateCustomer=false رو اعمال
// می‌کنه — این گزارش فقط برای ادمین/مدیره و هرگز نباید درآمد شخصی یا
// مشتری اختصاصیِ یک آرایشگرِ خودمختار رو نشون بده.
export interface RevenueReportFilter {
  barberId?: string;
  dateFrom?: Date;
  dateTo?: Date; // exclusive
}

export async function getSalonRevenueReport(filter: RevenueReportFilter = {}) {
  const bookings = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      isBarberOwnRevenue: false,
      isPrivateCustomer: false,
      ...(filter.barberId ? { barberId: filter.barberId } : {}),
      ...(filter.dateFrom || filter.dateTo
        ? {
            date: {
              ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
              ...(filter.dateTo ? { lt: filter.dateTo } : {}),
            },
          }
        : {}),
    },
    select: {
      price: true,
      barberId: true,
      serviceId: true,
      service: { select: { priceValue: true, title: true } },
      barber: { select: { user: { select: { name: true } } } },
      date: true,
    },
  });

  let totalRevenue = 0;
  let completedCount = 0;
  const byBarber = new Map<string, { barberName: string; revenue: number; count: number }>();
  const byService = new Map<string, { serviceTitle: string; revenue: number; count: number }>();

  for (const b of bookings) {
    const amount = b.price ?? b.service.priceValue;
    totalRevenue += amount;
    completedCount += 1;

    const barberEntry = byBarber.get(b.barberId) ?? {
      barberName: b.barber.user.name,
      revenue: 0,
      count: 0,
    };
    barberEntry.revenue += amount;
    barberEntry.count += 1;
    byBarber.set(b.barberId, barberEntry);

    const serviceEntry = byService.get(b.serviceId) ?? {
      serviceTitle: b.service.title,
      revenue: 0,
      count: 0,
    };
    serviceEntry.revenue += amount;
    serviceEntry.count += 1;
    byService.set(b.serviceId, serviceEntry);
  }

  return {
    totalRevenue,
    completedCount,
    byBarber: Array.from(byBarber.entries()).map(([barberId, v]) => ({ barberId, ...v })),
    byService: Array.from(byService.entries()).map(([serviceId, v]) => ({ serviceId, ...v })),
  };
}

// گزارش درآمد شخصیِ یک آرایشگرِ خودمختار (managePricing). قاطعانه و
// بدون استثنا: فقط خودِ آرایشگر (کاربری که barberId متعلق به اونه) اجازه‌ی
// دیدن این گزارش رو داره — نه ادمین، نه مدیر سالن. این چک باید در
// کنترلر/روت انجام بشه (با تطبیق userId توکن با userId صاحبِ barberId)،
// نه فقط اینجا؛ این تابع صرفاً دیتا رو برمی‌گردونه.
export async function getBarberOwnRevenueReport(barberId: string) {
  const barberProfile = await prisma.barberProfile.findUnique({ where: { id: barberId } });
  if (!barberProfile) {
    throw new AppError("آرایشگر پیدا نشد", 404);
  }

  const bookings = await prisma.booking.findMany({
    where: {
      barberId,
      status: "COMPLETED",
      isBarberOwnRevenue: true,
    },
    select: {
      price: true,
      service: { select: { priceValue: true, title: true } },
      date: true,
    },
    orderBy: { date: "desc" },
  });

  let totalRevenue = 0;
  const byService = new Map<string, { serviceTitle: string; revenue: number; count: number }>();

  for (const b of bookings) {
    const amount = b.price ?? b.service.priceValue;
    totalRevenue += amount;

    const entry = byService.get(b.service.title) ?? { serviceTitle: b.service.title, revenue: 0, count: 0 };
    entry.revenue += amount;
    entry.count += 1;
    byService.set(b.service.title, entry);
  }

  return {
    totalRevenue,
    completedCount: bookings.length,
    byService: Array.from(byService.values()),
  };
}