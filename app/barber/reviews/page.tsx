"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquareOff, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/data/mock-session";
import {
  ApiError,
  listMyRatingsApi,
  type ApiBarberReviewsResponse,
  type RatingStatus,
} from "@/lib/api";

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

function formatDate(value: string): string {
  const d = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

const STATUS_LABELS: Record<RatingStatus, string> = {
  PENDING: "در انتظار تایید ادمین",
  APPROVED: "نمایش عمومی",
  REJECTED: "نمایش داده نمی‌شود",
};

const STATUS_STYLES: Record<RatingStatus, string> = {
  PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  APPROVED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  REJECTED: "border-red-500/30 bg-red-500/10 text-red-400",
};

function Stars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < score ? "fill-primary text-primary" : "fill-none text-border"
          )}
        />
      ))}
    </div>
  );
}

export default function BarberReviewsPage() {
  const [data, setData] = useState<ApiBarberReviewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError("نشست شما منقضی شده است. دوباره وارد شوید.");
      setIsLoading(false);
      return;
    }

    listMyRatingsApi(token)
      .then(setData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "خطا در دریافت نظرها")
      )
      .finally(() => setIsLoading(false));
  }, []);

  const summary = data?.summary;
  const ratings = data?.ratings ?? [];

  // تعداد هر امتیاز (۵ تا ۱) برای نمودار میله‌ای
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0];
    ratings.forEach((r) => {
      if (r.score >= 1 && r.score <= 5) counts[r.score] += 1;
    });
    return [5, 4, 3, 2, 1].map((score) => ({ score, count: counts[score] }));
  }, [ratings]);

  const maxCount = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold">نظرات من</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          همهٔ امتیازها و نظرهایی که مشتریان برای شما ثبت کرده‌اند. این صفحه فقط
          برای خودتان قابل مشاهده است.
        </p>
      </div>

      {summary && (
        <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-border bg-card p-5">
          {summary.count > 0 && summary.average != null ? (
            <>
              <div className="text-4xl font-extrabold leading-none text-primary">
                {toPersianDigits(summary.average.toFixed(1)).replace(".", "٫")}
                <small className="mr-1 text-base font-semibold text-muted-foreground">
                  / ۵
                </small>
              </div>

              <div className="text-sm text-muted-foreground">
                از{" "}
                <b className="text-foreground">
                  {toPersianDigits(summary.count)} نظر
                </b>
                <br />
                بر اساس نوبت‌های تکمیل‌شده
              </div>

              <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
                {distribution.map((d) => (
                  <div
                    key={d.score}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span className="w-3 text-center">
                      {toPersianDigits(d.score)}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded bg-secondary">
                      <div
                        className="h-full rounded bg-primary"
                        style={{ width: `${(d.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-5 text-left">
                      {toPersianDigits(d.count)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              هنوز امتیازی ثبت نشده
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          در حال بارگذاری...
        </p>
      ) : ratings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <MessageSquareOff className="h-7 w-7" />
          <p className="text-sm">هنوز نظری برای شما ثبت نشده</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {ratings.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-primary/40"
            >
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{r.customerName}</span>
                  <span
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-[10.5px] font-medium",
                      STATUS_STYLES[r.status]
                    )}
                  >
                    {STATUS_LABELS[r.status]}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {formatDate(r.date)} · ساعت {toPersianDigits(r.time)}
                </span>
              </div>

              <div className="mb-1.5 flex items-center gap-3">
                <Stars score={r.score} />
                <span className="text-xs text-muted-foreground">
                  {r.serviceTitle}
                </span>
              </div>

              {r.comment ? (
                <p className="text-sm leading-8 text-muted-foreground">
                  {r.comment}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  بدون متن نظر (فقط امتیاز)
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}