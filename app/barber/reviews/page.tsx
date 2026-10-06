"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquareOff, Star } from "lucide-react";
import { StatusCard, TableStatusBadge } from "@/components/ui/status-card";
import { StandardTable } from "@/components/ui/standard-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ratingStatusTone } from "@/lib/status-tones";
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
  const [selectedRating, setSelectedRating] =
    useState<ApiBarberReviewsResponse["ratings"][number] | null>(null);

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
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-[#0e110f] py-12 text-muted-foreground">
          <MessageSquareOff className="h-7 w-7" />
          <p className="text-sm">هنوز نظری برای شما ثبت نشده</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <StandardTable
              rows={ratings}
              minWidth="990px"
              getRowProps={(rating) => ({
                "aria-label": `مشاهده جزئیات نظر ${rating.customerName}`,
                title: "برای مشاهدهٔ جزئیات دوبار کلیک کنید",
              })}
              onRowDoubleClick={(rating) => setSelectedRating(rating)}
              onRowKeyDown={(rating, event) => {
                if (
                  event.target === event.currentTarget &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  setSelectedRating(rating);
                }
              }}
              columns={[
                {
                  id: "customer",
                  header: "مشتری",
                  width: 180,
                  minWidth: 140,
                  sortValue: (rating) => rating.customerName,
                  cell: (rating) => (
                    <span className="block truncate font-medium" title={rating.customerName}>
                      {rating.customerName}
                    </span>
                  ),
                },
                {
                  id: "service",
                  header: "خدمت",
                  width: 170,
                  minWidth: 130,
                  sortValue: (rating) => rating.serviceTitle,
                  cell: (rating) => (
                    <span className="block truncate text-xs text-muted-foreground" title={rating.serviceTitle}>
                      {rating.serviceTitle}
                    </span>
                  ),
                },
                {
                  id: "score",
                  header: "امتیاز",
                  width: 110,
                  minWidth: 90,
                  sortValue: (rating) => rating.score,
                  cell: (rating) => <Stars score={rating.score} />,
                },
                {
                  id: "comment",
                  header: "نظر",
                  width: 230,
                  minWidth: 150,
                  sortValue: (rating) => rating.comment ?? "",
                  cell: (rating) => (
                    <div
                      className="rounded-md border border-border/80 bg-background/40 px-2.5 py-1.5 text-xs leading-6 text-muted-foreground"
                      title={rating.comment || "بدون متن نظر"}
                    >
                      <span className="block truncate">
                        {rating.comment || "بدون متن نظر"}
                      </span>
                    </div>
                  ),
                },
                {
                  id: "date",
                  header: "تاریخ",
                  width: 130,
                  minWidth: 110,
                  sortValue: (rating) => rating.date,
                  className: "whitespace-nowrap text-xs text-muted-foreground",
                  cell: (rating) => formatDate(rating.date),
                },
                {
                  id: "status",
                  header: "وضعیت",
                  width: 150,
                  minWidth: 130,
                  sortValue: (rating) => STATUS_LABELS[rating.status],
                  cell: (rating) => (
                    <TableStatusBadge tone={ratingStatusTone(rating.status)}>
                      {STATUS_LABELS[rating.status]}
                    </TableStatusBadge>
                  ),
                },
              ]}
            />
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {ratings.map((r) => (
              <StatusCard
                key={r.id}
                tone={ratingStatusTone(r.status)}
                showTint={false}
                accentClassName="bg-primary"
                className="bg-[#0e110f]"
                contentClassName="flex flex-col gap-3 pe-4 py-4"
              >
                <button
                  type="button"
                  className="flex w-full flex-col gap-3 text-start transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`مشاهده جزئیات نظر ${r.customerName}`}
                  onClick={() => setSelectedRating(r)}
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{r.customerName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.serviceTitle}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-medium",
                        r.status === "PENDING" &&
                          "border-amber-500/30 bg-amber-500/10 text-amber-500",
                        r.status === "APPROVED" &&
                          "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
                        r.status === "REJECTED" &&
                          "border-red-500/30 bg-red-500/10 text-red-400",
                      )}
                    >
                      {STATUS_LABELS[r.status]}
                    </span>
                  </div>

                  <div className="flex w-full items-center justify-between gap-3">
                    <Stars score={r.score} />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(r.date)} · ساعت {toPersianDigits(r.time)}
                    </span>
                  </div>

                  <div className="w-full rounded-lg border border-border/80 bg-background/40 px-3 py-2 text-start">
                    <p className="mb-1 text-[11px] text-muted-foreground">
                      متن نظر مشتری
                    </p>
                    <p className="line-clamp-2 text-sm leading-7 text-foreground/90">
                      {r.comment || "بدون متن نظر (فقط امتیاز)"}
                    </p>
                  </div>

                  <div className="flex w-full justify-end text-xs text-muted-foreground">
                    <span>برای مشاهدهٔ جزئیات لمس کنید</span>
                  </div>
                </button>
              </StatusCard>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={selectedRating !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRating(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {selectedRating && (
            <>
              <DialogHeader>
                <DialogTitle>جزئیات نظر مشتری</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">مشتری</p>
                    <p className="mt-1 font-medium">{selectedRating.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">خدمت</p>
                    <p className="mt-1 font-medium">{selectedRating.serviceTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">تاریخ</p>
                    <p className="mt-1 font-medium">
                      {formatDate(selectedRating.date)} · ساعت{" "}
                      {toPersianDigits(selectedRating.time)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">وضعیت</p>
                    <p className="mt-1 font-medium">
                      {STATUS_LABELS[selectedRating.status]}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">امتیاز</p>
                    <Stars score={selectedRating.score} />
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="rounded-lg border border-border bg-secondary/30 p-3.5">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      متن نظر مشتری
                    </p>
                    <p className="whitespace-pre-wrap break-words leading-8">
                      {selectedRating.comment || "بدون متن نظر (فقط امتیاز)"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}