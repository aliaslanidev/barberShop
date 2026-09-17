"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingCard } from "@/components/customer/booking-card";
import { getCurrentCustomer } from "@/lib/data/customer-session";
import { listBookingsApi, ApiError, type ApiBooking } from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const customer = getCurrentCustomer();
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!customer) {
      router.replace("/login");
      return;
    }
    const token = getAuthToken();
    if (!token) return;
    listBookingsApi(token)
      .then(setBookings)
      .catch((err) => console.error(err instanceof ApiError ? err.message : err))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer, router]);

  if (!customer) return null;

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        در حال بارگذاری...
      </div>
    );
  }

  const upcoming = bookings
    .filter((b) => b.status === "CONFIRMED")
    .sort((a, b) => (a.date + a.time > b.date + b.time ? 1 : -1));
  const nextBooking = upcoming[0] ?? null;
  const historyCount = bookings.filter((b) => b.status === "COMPLETED" || b.status === "CANCELLED").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold md:text-2xl">سلام {customer.name.split(" ")[0]} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">خلاصه‌ی وضعیت نوبت‌هات اینجاست.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">نوبت‌های آینده</p>
            <p className="mt-1 text-2xl font-bold text-primary">{upcoming.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">تعداد کل نوبت‌های قبلی</p>
            <p className="mt-1 text-2xl font-bold">{historyCount}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">نزدیک‌ترین نوبت</h2>
        {nextBooking ? (
          <BookingCard booking={nextBooking} />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <p className="text-sm text-muted-foreground">نوبت آینده‌ای ندارید.</p>
              <Button asChild>
                <Link href="/booking">رزرو نوبت جدید</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}