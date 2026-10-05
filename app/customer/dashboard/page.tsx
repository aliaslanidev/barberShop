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
import { toPersianDigits } from "@/lib/utils";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const customer = getCurrentCustomer();
  const [nextBooking, setNextBooking] = useState<ApiBooking | null>(null);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!customer) {
      router.replace("/login");
      return;
    }
    const token = getAuthToken();
    if (!token) return;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    Promise.all([
      listBookingsApi(token, { status: "CONFIRMED", dateFrom: todayStr, pageSize: 1 }),
      listBookingsApi(token, {
        statuses: ["COMPLETED", "CANCELLED"],
        pageSize: 1,
        sort: "desc",
      }),
    ])
      .then(([upcoming, history]) => {
        setNextBooking(upcoming.items[0] ?? null);
        setUpcomingCount(upcoming.total);
        setHistoryCount(history.total);
      })
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
            <p className="mt-1 text-2xl font-bold text-primary">{toPersianDigits(upcomingCount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">تعداد کل نوبت‌های قبلی</p>
            <p className="mt-1 text-2xl font-bold">{toPersianDigits(historyCount)}</p>
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