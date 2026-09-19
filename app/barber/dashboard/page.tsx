"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrentBarberProfile } from "@/lib/hooks/use-current-barber";
import { listBookingsApi, ApiError, type ApiBooking } from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";

const UPCOMING_PREVIEW_COUNT = 5;

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toPersianDigits(input: string) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return input.replace(/[0-9]/g, (d) => persianDigits[Number(d)]);
}

function dateKeyOf(booking: ApiBooking) {
  return booking.date.slice(0, 10);
}

function formatShortDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fa-IR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function BarberDashboardPage() {
  const barber = useCurrentBarberProfile();
  // همه‌ی نوبت‌های امروز و روزهای آینده
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = toISODate(new Date());

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    listBookingsApi(token, { dateFrom: today })
      .then((data) => setBookings(data.filter((b) => dateKeyOf(b) >= today)))
      .catch((err) => console.error(err instanceof ApiError ? err.message : err))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todays = useMemo(() => bookings.filter((b) => dateKeyOf(b) === today), [bookings, today]);

  // نوبت‌های پیش‌رو: امروزِ در انتظار + روزهای بعد (بدون انجام‌شده/لغوشده)
  const upcoming = useMemo(() => {
    return bookings
      .filter((b) => {
        if (b.status === "COMPLETED" || b.status === "CANCELLED") return false;
        const key = dateKeyOf(b);
        return key > today || (key === today && b.status === "CONFIRMED");
      })
      .sort((a, b) => {
        const ka = dateKeyOf(a);
        const kb = dateKeyOf(b);
        if (ka !== kb) return ka < kb ? -1 : 1;
        return a.time.localeCompare(b.time);
      });
  }, [bookings, today]);

  if (barber === undefined || isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">در حال بارگذاری...</div>;
  }
  if (!barber) return null;

  const completed = todays.filter((a) => a.status === "COMPLETED").length;
  const remaining = todays.filter((a) => a.status !== "COMPLETED" && a.status !== "CANCELLED").length;
  const futureCount = bookings.filter(
    (b) => dateKeyOf(b) > today && b.status !== "CANCELLED",
  ).length;
  const current = todays.find((a) => a.status === "IN_PROGRESS");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold md:text-2xl">سلام {barber.user.name.split(" ")[0]} 👋</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">نوبت‌های امروز</p>
            <p className="mt-1 text-2xl font-bold">{toPersianDigits(String(todays.length))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">انجام‌شده</p>
            <p className="mt-1 text-2xl font-bold text-primary">{toPersianDigits(String(completed))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">باقی‌مانده امروز</p>
            <p className="mt-1 text-2xl font-bold">{toPersianDigits(String(remaining))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">نوبت‌های روزهای آینده</p>
            <p className="mt-1 text-2xl font-bold">{toPersianDigits(String(futureCount))}</p>
          </CardContent>
        </Card>
      </div>

      {current && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">در حال انجام</h2>
          <Card className="border-primary/50">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium">{current.customer.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {current.service.title} — ساعت {toPersianDigits(current.time)}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                در حال انجام
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">نوبت‌های پیش‌رو</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/barber/bookings">مشاهده همه نوبت‌ها</Link>
          </Button>
        </div>

        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              نوبت پیش‌رویی ندارید.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, UPCOMING_PREVIEW_COUNT).map((a) => {
              const key = dateKeyOf(a);
              return (
                <Card key={a.id}>
                  <CardContent className="flex items-center justify-between gap-3 p-5">
                    <div>
                      <p className="text-sm font-medium">{a.customer.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.service.title} — ساعت {toPersianDigits(a.time)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {key === today ? "امروز" : formatShortDate(key)}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
            {upcoming.length > UPCOMING_PREVIEW_COUNT && (
              <p className="text-center text-xs text-muted-foreground">
                و {toPersianDigits(String(upcoming.length - UPCOMING_PREVIEW_COUNT))} نوبت دیگر
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}