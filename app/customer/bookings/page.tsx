"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingCard } from "@/components/customer/booking-card";
import { listBookingsApi, updateBookingStatusApi, ApiError, type ApiBooking } from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";

export default function CustomerBookingsPage() {
  const [items, setItems] = useState<ApiBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    const token = getAuthToken();
    if (!token) return;
    try {
      const data = await listBookingsApi(token);
      // نوبت‌های فعال: تاییدشده + در حال انجام. (انجام‌شده/لغوشده تو «تاریخچه» هستن.)
      // قبلاً فقط CONFIRMED می‌اومد و نوبتِ «در حال انجام» نه اینجا دیده می‌شد نه تو تاریخچه.
      const active = data
        .filter((b) => b.status === "CONFIRMED" || b.status === "IN_PROGRESS")
        .sort((a, b) => (a.date.slice(0, 10) + a.time < b.date.slice(0, 10) + b.time ? -1 : 1));
      setItems(active);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در دریافت نوبت‌ها");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCancel(id: string) {
    const token = getAuthToken();
    if (!token) return;
    try {
      await updateBookingStatusApi(id, "CANCELLED", token);
      await refresh();
      toast.success("نوبت لغو شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در لغو نوبت");
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        در حال دریافت نوبت‌ها...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">نوبت‌های من</h1>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-sm text-muted-foreground">نوبت فعالی ندارید.</p>
            <Button asChild size="sm">
              <Link href="/booking">رزرو نوبت</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((booking) => (
            <BookingCard key={booking.id} booking={booking} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
}