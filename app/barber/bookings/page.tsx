"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  listBookingsApi,
  updateBookingStatusApi,
  ApiError,
  type ApiBooking,
  type BookingStatus,
} from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";

const statusLabel: Record<BookingStatus, string> = {
  CONFIRMED: "در انتظار",
  IN_PROGRESS: "در حال انجام",
  COMPLETED: "انجام‌شده",
  CANCELLED: "لغوشده",
};

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function BarberBookingsPage() {
  const [items, setItems] = useState<ApiBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    const token = getAuthToken();
    if (!token) return;
    try {
      const data = await listBookingsApi(token, { date: toISODate(new Date()) });
      setItems(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در دریافت نوبت‌ها");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function updateStatus(id: string, status: BookingStatus) {
    const token = getAuthToken();
    if (!token) return;
    try {
      await updateBookingStatusApi(id, status, token);
      await refresh();
      toast.success(status === "IN_PROGRESS" ? "سرویس شروع شد" : "سرویس پایان یافت");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت");
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        در حال دریافت نوبت‌های امروز...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">نوبت‌های امروز</h1>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            امروز نوبتی ندارید.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="text-sm font-medium">{a.customer.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.service.title} — ساعت {a.time} · {statusLabel[a.status]}
                  </p>
                </div>
                <div className="flex gap-2">
                  {a.status === "CONFIRMED" && (
                    <Button size="sm" onClick={() => updateStatus(a.id, "IN_PROGRESS")}>
                      شروع سرویس
                    </Button>
                  )}
                  {a.status === "IN_PROGRESS" && (
                    <Button size="sm" onClick={() => updateStatus(a.id, "COMPLETED")}>
                      پایان سرویس
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}