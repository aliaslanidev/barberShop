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
  getPublicBarberReviews,
  type ApiBarber,
  type ApiPublicBarberReviews,
} from "@/lib/api";

function toPersianDigits(input: string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

  return input.replace(/[0-9]/g, (digit) => {
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

  useEffect(() => {
    if (!state) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    setIsLoading(true);
    setData(null);

    getPublicBarberReviews(state.barber.id)
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        {barber && (
          <>
            <DialogHeader>
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

            <div className="mt-2 space-y-3">
              {isLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  در حال بارگذاری نظرها...
                </p>
              ) : data?.reviews && data.reviews.length > 0 ? (
                data.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-lg border border-border bg-card p-3 text-sm"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-medium">{review.customerName}</span>

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
                      <p className="text-xs leading-6 text-muted-foreground">
                        {review.comment}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
                  <MessageSquareOff className="h-6 w-6" />

                  <p className="text-xs">
                    هنوز نظر تاییدشده‌ای برای این آرایشگر ثبت نشده
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4">
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