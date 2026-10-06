"use client";

import { useEffect, useState } from "react";
import { MessageSquareOff, Star } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  ApiError,
  getPublicBarberReviews,
  type ApiBarber,
  type ApiPublicBarberReviews,
} from "@/lib/api";

const INITIAL_REVIEW_COUNT = 7;

function toPersianDigits(input: string | number): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

  return String(input).replace(/[0-9]/g, (digit) => {
    return persianDigits[Number(digit)];
  });
}

function formatReviewDate(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export interface BarberProfileModalState {
  barber: ApiBarber;
  onSelect: () => void;
}

interface BarberProfileModalProps {
  state: BarberProfileModalState | null;
  onClose: () => void;
}

export function BarberProfileModal({
  state,
  onClose,
}: BarberProfileModalProps) {
  const [data, setData] = useState<ApiPublicBarberReviews | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (!state) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    setIsLoading(true);
    setData(null);
    setError(null);
    setShowAllReviews(false);

    getPublicBarberReviews(state.barber.id)
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null);
          setError(
            err instanceof ApiError
              ? err.message
              : "خطا در دریافت نظرهای آرایشگر",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [state]);

  const barber = state?.barber ?? null;
  const rating = barber?.rating;

  const hasRating =
    rating != null && rating.count > 0 && rating.average != null;

  /*
   * این تابع قبل از render ساخته می‌شود تا TypeScript
   * داخل onClick دیگر state را null در نظر نگیرد.
   */
  const handleSelect = () => {
    if (!state) {
      return;
    }

    state.onSelect();
    onClose();
  };

  return (
    <Dialog
      open={state !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="flex h-[85dvh] max-h-[680px] w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden p-0 [&>button]:left-4 [&>button]:right-auto">
        {barber && (
          <>
            <DialogHeader className="shrink-0 px-5 pb-4 pt-6">
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rust text-base font-bold text-white">
                  {barber.initials}
                </span>

                <div className="min-w-0">
                  <DialogTitle className="text-base">
                    {barber.user.name}
                  </DialogTitle>

                  {hasRating ? (
                    <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />

                      <span className="font-medium text-foreground">
                        {toPersianDigits(rating.average!.toFixed(1)).replace(
                          ".",
                          "٫",
                        )}
                      </span>

                      <span>
                        از {toPersianDigits(String(rating.count))} نظر
                      </span>
                    </span>
                  ) : (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      هنوز امتیازی ثبت نشده
                    </span>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5">
              {isLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  در حال بارگذاری نظرها...
                </p>
              ) : error ? (
                <p
                  role="alert"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400"
                >
                  {error}
                </p>
              ) : data?.reviews && data.reviews.length > 0 ? (
                <div className="space-y-3 py-1">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-semibold text-foreground">
                      نظرهای تاییدشده
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {toPersianDigits(data.reviews.length)} نظر
                    </span>
                  </div>

                  {(showAllReviews
                    ? data.reviews
                    : data.reviews.slice(0, INITIAL_REVIEW_COUNT)
                  ).map((review) => (
                    <div
                      key={review.id}
                      className="rounded-lg border border-border bg-card p-3 text-sm"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {review.customerName}
                        </span>

                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatReviewDate(review.createdAt)}
                        </span>
                      </div>

                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }, (_, index) => (
                            <Star
                              key={index}
                              className={cn(
                                "h-3.5 w-3.5",
                                index < review.score
                                  ? "fill-primary text-primary"
                                  : "fill-none text-border",
                              )}
                            />
                          ))}
                        </div>

                        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                          {review.serviceTitle}
                        </span>
                      </div>

                      {review.comment ? (
                        <p className="whitespace-pre-wrap break-words text-xs leading-6 text-muted-foreground">
                          {review.comment}
                        </p>
                      ) : null}
                    </div>
                  ))}

                  {!showAllReviews &&
                    data.reviews.length > INITIAL_REVIEW_COUNT && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowAllReviews(true)}
                      >
                        مشاهدهٔ بیشتر (
                        {toPersianDigits(
                          data.reviews.length - INITIAL_REVIEW_COUNT,
                        )}{" "}
                        نظر دیگر)
                      </Button>
                    )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
                  <MessageSquareOff className="h-6 w-6" />

                  <p className="text-xs">
                    هنوز نظر تاییدشده‌ای برای این آرایشگر ثبت نشده
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="shrink-0 border-t border-border px-5 py-4">
              <Button type="button" className="w-full" onClick={handleSelect}>
                انتخاب همین آرایشگر
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}