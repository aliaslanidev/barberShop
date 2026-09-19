"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { getAuthToken } from "@/lib/data/mock-session";
import {
  getBookingsSummaryApi,
  ApiError,
  type ApiBookingsSummary,
  type BookingStatus,
} from "@/lib/api";

const STATUS_ORDER: BookingStatus[] = ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

const STATUS_LABELS: Record<BookingStatus, string> = {
  CONFIRMED: "در انتظار",
  IN_PROGRESS: "در حال انجام",
  COMPLETED: "انجام‌شده",
  CANCELLED: "لغو‌شده",
};

const STATUS_STYLES: Record<BookingStatus, string> = {
  CONFIRMED: "bg-blue-500",
  IN_PROGRESS: "bg-amber-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-500",
};

export default function AdminReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<ApiBookingsSummary | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    getBookingsSummaryApi(token)
      .then(setSummary)
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "خطا در دریافت گزارش‌ها");
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        در حال دریافت اطلاعات...
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        خطا در دریافت گزارش‌ها
      </div>
    );
  }

  const totalCount = summary.totalCount;
  const maxBarberCount = Math.max(1, ...summary.byBarber.map((b) => b.count));

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">گزارش‌ها</h1>
        <p className="text-sm text-muted-foreground">
          آمار کلی نوبت‌ها بر اساس آرایشگر و وضعیت
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-sm text-muted-foreground">کل نوبت‌ها</span>
            <span className="text-2xl font-bold">{totalCount}</span>
          </CardContent>
        </Card>

        {STATUS_ORDER.map((status) => (
          <Card key={status}>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-sm text-muted-foreground">{STATUS_LABELS[status]}</span>
              <span className="text-2xl font-bold">{summary.byStatus[status]}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <h2 className="font-semibold">نوبت‌ها به تفکیک آرایشگر</h2>

          {summary.byBarber.length === 0 && (
            <p className="text-sm text-muted-foreground">هنوز آرایشگری ثبت نشده</p>
          )}

          <div className="flex flex-col gap-3">
            {summary.byBarber.map((b) => (
              <div key={b.barberId} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-sm">{b.barberName}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(b.count / maxBarberCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-left text-sm font-medium">{b.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <h2 className="font-semibold">نوبت‌ها به تفکیک وضعیت</h2>

          <div className="flex h-4 w-full overflow-hidden rounded-full">
            {STATUS_ORDER.map((status) =>
              summary.byStatus[status] > 0 ? (
                <div
                  key={status}
                  className={cn(STATUS_STYLES[status])}
                  style={{
                    width: `${(summary.byStatus[status] / Math.max(1, totalCount)) * 100}%`,
                  }}
                  title={`${STATUS_LABELS[status]}: ${summary.byStatus[status]}`}
                />
              ) : null,
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            {STATUS_ORDER.map((status) => (
              <div key={status} className="flex items-center gap-2 text-sm">
                <span className={cn("h-3 w-3 rounded-full", STATUS_STYLES[status])} />
                {STATUS_LABELS[status]} ({summary.byStatus[status]})
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}