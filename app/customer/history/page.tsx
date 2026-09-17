"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { BookingCard } from "@/components/customer/booking-card";
import { listBookingsApi, ApiError, type ApiBooking } from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";

export default function CustomerHistoryPage() {
  const [history, setHistory] = useState<ApiBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    listBookingsApi(token)
      .then((all) => {
        const filtered = all
          .filter((b) => b.status === "COMPLETED" || b.status === "CANCELLED")
          .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));
        setHistory(filtered);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "خطا در دریافت تاریخچه"))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        در حال دریافت تاریخچه...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">تاریخچه‌ی نوبت‌ها</h1>

      {history.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            هنوز نوبتی ثبت نشده.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {history.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}