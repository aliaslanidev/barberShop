import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import type { CreateRatingInput } from "@/modules/ratings/ratings.schema";
import type { RatingStatus } from "@prisma/client";

export interface RatingSummary {
  average: number | null; // یک رقم اعشار، یا null اگه هنوز امتیازی نداره
  count: number;
}

export const EMPTY_RATING_SUMMARY: RatingSummary = { average: null, count: 0 };

// معدل و تعداد آرای چند آرایشگر با یک کوئری (برای لیست عمومی آرایشگرها)
export async function getRatingSummaries(barberIds: string[]): Promise<Map<string, RatingSummary>> {
  const result = new Map<string, RatingSummary>();
  if (barberIds.length === 0) return result;

  const rows = await prisma.rating.groupBy({
    by: ["barberId"],
    where: { barberId: { in: barberIds } },
    _avg: { score: true },
    _count: { _all: true },
  });

  for (const row of rows) {
    const avg = row._avg.score;
    result.set(row.barberId, {
      average: avg === null ? null : Math.round(avg * 10) / 10,
      count: row._count._all,
    });
  }
  return result;
}

export async function getRatingSummary(barberId: string): Promise<RatingSummary> {
  const map = await getRatingSummaries([barberId]);
  return map.get(barberId) ?? EMPTY_RATING_SUMMARY;
}

// ثبت امتیاز: فقط مشتری‌ همون نوبت، فقط بعد از COMPLETED، و فقط یک بار برای هر نوبت.
// status پیش‌فرض PENDING (تو schema تعریف شده) — امتیاز عددی فوری تو معدل
// اثر می‌ذاره، ولی متن نظر تا تایید ادمین عمومی نمایش داده نمی‌شه.
export async function createRating(customerId: string, input: CreateRatingInput) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: { rating: true },
  });

  if (!booking) throw new AppError("نوبت پیدا نشد", 404);
  if (booking.customerId !== customerId) {
    throw new AppError("شما فقط می‌توانید برای نوبت‌های خودتان امتیاز ثبت کنید", 403);
  }
  if (booking.status !== "COMPLETED") {
    throw new AppError("امتیازدهی فقط بعد از انجام سرویس امکان‌پذیر است", 400);
  }
  if (booking.rating) {
    throw new AppError("برای این نوبت قبلاً امتیاز ثبت شده است", 409);
  }

  try {
    return await prisma.rating.create({
      data: {
        bookingId: booking.id,
        barberId: booking.barberId,
        score: input.score,
        comment: input.comment ? input.comment : null,
      },
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw new AppError("برای این نوبت قبلاً امتیاز ثبت شده است", 409);
    }
    throw err;
  }
}

// لیست کامل امتیازها و نظرهای یه آرایشگر (همه‌ی وضعیت‌ها) — برای خودِآرایشگر (GET /ratings/me)
export async function listBarberRatings(barberId: string) {
  const [summary, ratings] = await Promise.all([
    getRatingSummary(barberId),
    prisma.rating.findMany({
      where: { barberId },
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            date: true,
            time: true,
            service: { select: { title: true } },
            customer: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  return {
    summary,
    ratings: ratings.map((r) => ({
      id: r.id,
      score: r.score,
      comment: r.comment,
      status: r.status,
      createdAt: r.createdAt,
      date: r.booking.date,
      time: r.booking.time,
      serviceTitle: r.booking.service.title,
      customerName: r.booking.customer.name,
    })),
  };
}

// ادمین/مدیر: لیست نظرها با فیلتر اختیاری آرایشگر و وضعیت — برای صفحه‌ی تایید نظرها
export async function listRatingsForAdmin(filter: { barberId?: string; status?: RatingStatus }) {
  const ratings = await prisma.rating.findMany({
    where: {
      barberId: filter.barberId,
      status: filter.status,
    },
    orderBy: { createdAt: "desc" },
    include: {
      barber: { include: { user: { select: { name: true } } } },
      booking: {
        select: {
          date: true,
          time: true,
          service: { select: { title: true } },
          customer: { select: { name: true } },
        },
      },
    },
  });

  return ratings.map((r) => ({
    id: r.id,
    barberId: r.barberId,
    barberName: r.barber.user.name,
    score: r.score,
    comment: r.comment,
    status: r.status,
    createdAt: r.createdAt,
    date: r.booking.date,
    time: r.booking.time,
    serviceTitle: r.booking.service.title,
    customerName: r.booking.customer.name,
  }));
}

// ادمین/مدیر: تایید یا رد نمایش عمومیِ متن یه نظر
export async function updateRatingStatus(id: string, status: "APPROVED" | "REJECTED") {
  const rating = await prisma.rating.findUnique({ where: { id } });
  if (!rating) throw new AppError("نظر پیدا نشد", 404);

  return prisma.rating.update({ where: { id }, data: { status } });
}

// نام مشتری برای نمایش عمومی: فقط نام کوچک + حرف اول نام‌خانوادگی (مثلاً «رضا احمدی» -> «رضا ا.»)
function maskCustomerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0);
  return `${parts[0]} ${lastInitial}.`;
}

// عمومی (بدون نیاز به لاگین): معدل/تعداد آرا + فقط نظرهای تاییدشده — برای
// مودال «مشاهده بیشتر» تو فلوی رزرو مشتری. serviceTitle هم برگردونده
// می‌شه تا مشخص باشه مشتری برای کدوم سرویس این نظر رو داده (آیتم ۴.۱).
export async function getPublicBarberReviews(barberId: string) {
  const [summary, ratings] = await Promise.all([
    getRatingSummary(barberId),
    prisma.rating.findMany({
      where: { barberId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            customer: { select: { name: true } },
            service: { select: { title: true } },
          },
        },
      },
    }),
  ]);

  return {
    summary,
    reviews: ratings
      .filter((r) => r.comment) // بدون متن نظر، چیزی برای نمایش عمومی نیست
      .map((r) => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt,
        customerName: maskCustomerName(r.booking.customer.name),
        serviceTitle: r.booking.service.title,
      })),
  };
}