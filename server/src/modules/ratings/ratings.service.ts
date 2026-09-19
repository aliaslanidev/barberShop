import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import type { CreateRatingInput } from "@/modules/ratings/ratings.schema";

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

// ثبت امتیاز: فقط مشتریِ همون نوبت، فقط بعد از COMPLETED، و فقط یک بار برای هر نوبت
export async function createRating(customerId: string, input: CreateRatingInput) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: { rating: true },
  });

  if (!booking) throw new AppError("نوبت پیدا نشد", 404);
  if (booking.customerId !== customerId) {
    throw new AppError("شما فقط می‌تونید برای نوبت‌های خودتان امتیاز ثبت کنید", 403);
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
    // race condition: دو درخواست همزمان برای یک نوبت (bookingId یونیکه)
    if ((err as { code?: string }).code === "P2002") {
      throw new AppError("برای این نوبت قبلاً امتیاز ثبت شده است", 409);
    }
    throw err;
  }
}

// لیست امتیازها و نظرهای یه آرایشگر — فقط برای خودِ آرایشگر و ادمین
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
      createdAt: r.createdAt,
      date: r.booking.date,
      time: r.booking.time,
      serviceTitle: r.booking.service.title,
      customerName: r.booking.customer.name,
    })),
  };
}