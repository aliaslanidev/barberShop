"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/customer/status-badge";
import { cn, formatToman } from "@/lib/utils";
import type { ApiBooking } from "@/lib/api";

interface BookingCardProps {
  booking: ApiBooking;
  onCancel?: (id: string) => void | Promise<void>;
}

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

export function BookingCard({ booking, onCancel }: BookingCardProps) {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // قیمت ثبت‌شده موقع رزرو؛ برای نوبت‌های قدیمی (price = null) قیمت سرویس
  const price = booking.price ?? booking.service.priceValue;
  const isCancelled = booking.status === "CANCELLED";

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