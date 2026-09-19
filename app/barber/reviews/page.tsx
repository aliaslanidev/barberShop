"use client";

import { useEffect, useState } from "react";
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
  PENDING: "bg-amber-500/10 text-amber-500",
  APPROVED: "bg-emerald-500/10 text-emerald-500",
  REJECTED: "bg-red-500/10 text-red-400",
};

function Stars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">نظرات من</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          همهٔ امتیازها و نظرهایی که مشتریان برای شما ثبت کرده‌اند.
        </p>
      </div>

      {summary && (
        <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
          <Star className="h-8 w-8 fill-primary text-primary" />
          {summary.count > 0 && summary.average != null ? (
            <div>
              <div className="text-2xl font-bold">
                {toPersianDigits(summary.average.toFixed(1)).replace(".", "٫")}
              </div>
              <div className="text-xs text-muted-foreground">
                از {toPersianDigits(summary.count)} امتیاز
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              هنوز امتیازی ثبت نشده
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
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
        <div className="space-y-3">
          {ratings.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{r.customerName}</span>
                    <Stars score={r.score} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.serviceTitle} · {formatDate(r.date)} · ساعت{" "}
                    {toPersianDigits(r.time)}
                  </p>
                </div>

                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    STATUS_STYLES[r.status]
                  )}
                >
                  {STATUS_LABELS[r.status]}
                </span>
              </div>

              {r.comment ? (
                <p className="mt-3 text-sm leading-7">{r.comment}</p>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
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