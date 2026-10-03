import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import type { BookingStatus } from "@prisma/client";

const ALL_STATUSES: BookingStatus[] = [
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

// این تابع فقط «گزارش عمومی سالن» رو برمی‌گردونه — طبق تصمیم بند ۷.۱،
// هر نوبتی که isPrivateCustomer=true داره (یعنی وقت ثبت، آرایشگر پرمیشن
// «مشتری اختصاصی» رو داشته) از totalCount و byBarber کاملاً حذف می‌شه؛
// این نوبت‌ها اصلاً جزو «نوبت‌های سالن» محسوب نمی‌شن.
export async function getBookingsSummary() {
  const salonWhere = { isPrivateCustomer: false } as const;

  const [totalCount, statusGroups, barberGroups, barbers] = await Promise.all([
    prisma.booking.count({ where: salonWhere }),
    prisma.booking.groupBy({
      by: ["status"],
      where: salonWhere,
      _count: { _all: true },
    }),
    prisma.booking.groupBy({
      by: ["barberId"],
      where: salonWhere,
      _count: { _all: true },
    }),
    prisma.barberProfile.findMany({
      include: { user: { select: { name: true } } },
    }),
  ]);

  const byStatus = Object.fromEntries(
    ALL_STATUSES.map((s) => [s, 0]),
  ) as Record<BookingStatus, number>;
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

  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const monthEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  const [
    todaysBookingsCount,
    activeBarbersCount,
    servicesCount,
    monthlyRevenueGroups,
  ] = await Promise.all([
    prisma.booking.count({
      where: {
        date: { gte: todayStart, lt: todayEnd },
        status: { not: "CANCELLED" },
      },
    }),
    prisma.barberProfile.count({ where: { isActive: true } }),
    prisma.service.count(),
    prisma.booking.groupBy({
      by: ["serviceId"],
      where: {
        status: "COMPLETED",
        date: { gte: monthStart, lt: monthEnd },
        isBarberOwnRevenue: false,
      },
      _sum: { price: true },
      _count: { _all: true, price: true },
    }),
  ]);

  const monthlyServices = await prisma.service.findMany({
    where: { id: { in: monthlyRevenueGroups.map((group) => group.serviceId) } },
    select: { id: true, priceValue: true },
  });
  const monthlyPriceByServiceId = new Map(monthlyServices.map((service) => [service.id, service.priceValue]));
  const revenueThisMonth = monthlyRevenueGroups.reduce((sum, group) => {
    const missingPriceCount = group._count._all - group._count.price;
    const fallbackPrice = monthlyPriceByServiceId.get(group.serviceId) ?? 0;
    return sum + (group._sum.price ?? 0) + missingPriceCount * fallbackPrice;
  }, 0);

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
  const revenueGroups = await prisma.booking.groupBy({
    by: ["barberId", "serviceId"],
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
    _sum: { price: true },
    _count: { _all: true, price: true },
  });

  let totalRevenue = 0;
  let completedCount = 0;
  const [services, barbers] = await Promise.all([
    prisma.service.findMany({
      where: { id: { in: revenueGroups.map((group) => group.serviceId) } },
      select: { id: true, title: true, priceValue: true },
    }),
    prisma.barberProfile.findMany({
      where: { id: { in: revenueGroups.map((group) => group.barberId) } },
      select: { id: true, user: { select: { name: true } } },
    }),
  ]);
  const serviceById = new Map(services.map((service) => [service.id, service]));
  const barberNameById = new Map(barbers.map((barber) => [barber.id, barber.user.name]));
  const byBarber = new Map<
    string,
    { barberName: string; revenue: number; count: number }
  >();
  const byService = new Map<
    string,
    { serviceTitle: string; revenue: number; count: number }
  >();

  for (const group of revenueGroups) {
    const service = serviceById.get(group.serviceId);
    if (!service) continue;

    const count = group._count._all;
    const missingPriceCount = count - group._count.price;
    const amount = (group._sum.price ?? 0) + missingPriceCount * service.priceValue;
    totalRevenue += amount;
    completedCount += count;

    const barberEntry = byBarber.get(group.barberId) ?? {
      barberName: barberNameById.get(group.barberId) ?? "—",
      revenue: 0,
      count: 0,
    };
    barberEntry.revenue += amount;
    barberEntry.count += count;
    byBarber.set(group.barberId, barberEntry);

    const serviceEntry = byService.get(group.serviceId) ?? {
      serviceTitle: service.title,
      revenue: 0,
      count: 0,
    };
    serviceEntry.revenue += amount;
    serviceEntry.count += count;
    byService.set(group.serviceId, serviceEntry);
  }

  return {
    totalRevenue,
    completedCount,
    byBarber: Array.from(byBarber.entries()).map(([barberId, v]) => ({
      barberId,
      ...v,
    })),
    byService: Array.from(byService.entries()).map(([serviceId, v]) => ({
      serviceId,
      ...v,
    })),
  };
}

// گزارش درآمد شخصیِ یک آرایشگرِ خودمختار (managePricing). قاطعانه و
// بدون استثنا: فقط خودِ آرایشگر (کاربری که barberId متعلق به اونه) اجازه‌ی
// دیدن این گزارش رو داره — نه ادمین، نه مدیر سالن. این چک باید در
// کنترلر/روت انجام بشه (با تطبیق userId توکن با userId صاحبِ barberId)،
// نه فقط اینجا؛ این تابع صرفاً دیتا رو برمی‌گردونه.
// dateTo در اینجا هم exclusive استفاده می‌شه (مثل گزارش سالن)
export async function getBarberOwnRevenueReport(
  barberId: string,
  filter: { dateFrom?: Date; dateTo?: Date } = {},
) {
  const barberProfile = await prisma.barberProfile.findUnique({
    where: { id: barberId },
  });
  if (!barberProfile) {
    throw new AppError("آرایشگر پیدا نشد", 404);
  }

  const revenueGroups = await prisma.booking.groupBy({
    by: ["serviceId"],
    where: {
      barberId,
      status: "COMPLETED",
      isBarberOwnRevenue: true,
      ...(filter.dateFrom || filter.dateTo
        ? {
            date: {
              ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
              ...(filter.dateTo ? { lt: filter.dateTo } : {}),
            },
          }
        : {}),
    },
    _sum: { price: true },
    _count: { _all: true, price: true },
  });

  const services = await prisma.service.findMany({
    where: { id: { in: revenueGroups.map((group) => group.serviceId) } },
    select: { id: true, title: true, priceValue: true },
  });
  const serviceById = new Map(services.map((service) => [service.id, service]));
  let totalRevenue = 0;
  let completedCount = 0;
  const byService = new Map<
    string,
    { serviceTitle: string; revenue: number; count: number }
  >();

  for (const group of revenueGroups) {
    const service = serviceById.get(group.serviceId);
    if (!service) continue;

    const count = group._count._all;
    const missingPriceCount = count - group._count.price;
    const amount = (group._sum.price ?? 0) + missingPriceCount * service.priceValue;
    totalRevenue += amount;
    completedCount += count;

    const entry = byService.get(service.title) ?? {
      serviceTitle: service.title,
      revenue: 0,
      count: 0,
    };
    entry.revenue += amount;
    entry.count += count;
    byService.set(service.title, entry);
  }

  return {
    totalRevenue,
    completedCount,
    byService: Array.from(byService.values()),
  };
}
