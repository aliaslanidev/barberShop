"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/customer/status-badge";
import { cn, formatToman } from "@/lib/utils";
import type { ApiBooking } from "@/lib/api";

interface BookingCardProps {
  booking: ApiBooking;
  onCancel?: (id: string) => void | Promise<void>;
  // اگه پاس داده بشه، برای نوبت‌های تمام‌شده‌ی بدون امتیاز فرم امتیازدهی نمایش داده می‌شه.
  // اگه ثبت با خطا مواجه بشه باید throw کنه (تا فرم باز بمونه).
  onRate?: (bookingId: string, score: number, comment: string) => Promise<void>;
}

const COMMENT_MAX_LENGTH = 300;

function toPersianDigits(input: string) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return input.replace(/[0-9]/g, (d) => persianDigits[Number(d)]);
}

// تاریخ نوبت ممکنه "2026-09-19" یا ISO کامل باشه؛ فقط ۱۰ کاراکتر اول رو
// می‌خونیم و Date محلی می‌سازیم تا مشکل جابه‌جایی منطقه‌ی زمانی پیش نیاد.
function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ستاره‌های فقط‌نمایشی
function StarsDisplay({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`امتیاز ${value} از ۵`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i <= value ? "fill-primary text-primary" : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}

export function BookingCard({ booking, onCancel, onRate }: BookingCardProps) {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // قیمت ثبت‌شده موقع رزرو؛ برای نوبت‌های قدیمی (price = null) قیمت سرویس
  const price = booking.price ?? booking.service.priceValue;
  const isCancelled = booking.status === "CANCELLED";

  // نوبت‌های قدیمی/پاسخ‌های بدون فیلد rating رو هم null حساب می‌کنیم
  const existingRating = booking.rating ?? null;
  const canRate = booking.status === "COMPLETED" && !existingRating && !!onRate;

  async function handleConfirmCancel() {
    if (!onCancel) return;
    setIsCancelling(true);
    try {
      await onCancel(booking.id);
    } finally {
      setIsCancelling(false);
      setIsConfirmingCancel(false);
    }
  }

  async function handleSubmitRating() {
    if (!onRate || score < 1) return;
    setIsSubmittingRating(true);
    try {
      await onRate(booking.id, score, comment);
      // موفق: والد booking.rating رو ست می‌کنه و کارت خودش حالت «امتیاز ثبت شده» رو نشون می‌ده
    } catch {
      // پیام خطا رو والد نشون داده؛ فرم باز می‌مونه تا کاربر دوباره تلاش کنه
    } finally {
      setIsSubmittingRating(false);
    }
  }

  const activeStars = hoverScore || score;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium">{booking.service.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">با {booking.barber.user.name}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>
            {formatDate(booking.date)} — ساعت {toPersianDigits(booking.time)}
          </span>
          <span
            className={cn(
              isCancelled ? "text-muted-foreground line-through" : "font-medium text-primary",
            )}
          >
            {formatToman(price)}
          </span>
        </div>

        {booking.notes && (
          <p className="rounded-lg bg-secondary/50 p-2 text-xs text-muted-foreground">
            {booking.notes}
          </p>
        )}

        {/* امتیاز ثبت‌شده */}
        {booking.status === "COMPLETED" && existingRating && (
          <div className="space-y-2 rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">امتیاز شما</span>
              <StarsDisplay value={existingRating.score} />
            </div>
            {existingRating.comment && (
              <p className="text-xs leading-6 text-muted-foreground">{existingRating.comment}</p>
            )}
          </div>
        )}

        {/* فرم امتیازدهی */}
        {canRate && (
          <>
            {!isRatingOpen ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRatingOpen(true)}
                className="mt-1 self-start gap-1"
              >
                <Star className="h-4 w-4 text-primary" />
                امتیاز به این آرایشگر
              </Button>
            ) : (
              <div className="mt-1 space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">
                  خدمات {booking.barber.user.name} چطور بود؟
                </p>

                <div
                  className="flex items-center gap-1"
                  onMouseLeave={() => setHoverScore(0)}
                  dir="ltr"
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`امتیاز ${i}`}
                      onMouseEnter={() => setHoverScore(i)}
                      onClick={() => setScore(i)}
                      className="p-0.5"
                    >
                      <Star
                        className={cn(
                          "h-7 w-7 transition-colors",
                          i <= activeStars
                            ? "fill-primary text-primary"
                            : "text-muted-foreground/40",
                        )}
                      />
                    </button>
                  ))}
                </div>

                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
                  placeholder="نظر شما (اختیاری)"
                  rows={3}
                />
                <p className="text-left text-[11px] text-muted-foreground" dir="ltr">
                  {comment.length}/{COMMENT_MAX_LENGTH}
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={score < 1 || isSubmittingRating}
                    onClick={handleSubmitRating}
                  >
                    {isSubmittingRating ? "در حال ثبت..." : "ثبت امتیاز"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isSubmittingRating}
                    onClick={() => {
                      setIsRatingOpen(false);
                      setScore(0);
                      setHoverScore(0);
                      setComment("");
                    }}
                  >
                    انصراف
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {booking.status === "CONFIRMED" && onCancel && (
          <>
            {!isConfirmingCancel ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmingCancel(true)}
                className="mt-1 self-start text-red-400 hover:text-red-400"
              >
                لغو نوبت
              </Button>
            ) : (
              <div className="mt-1 space-y-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <p className="text-xs leading-6 text-muted-foreground">
                  آیا از لغو این نوبت مطمئن هستید؟ این کار قابل بازگشت نیست.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isCancelling}
                    onClick={handleConfirmCancel}
                    className="text-red-400 hover:text-red-400"
                  >
                    {isCancelling ? "در حال لغو..." : "بله، لغو شود"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isCancelling}
                    onClick={() => setIsConfirmingCancel(false)}
                  >
                    انصراف
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}