"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentBarberProfile } from "@/lib/hooks/use-current-barber";
import { listBookingsApi, ApiError, type ApiBooking } from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function BarberDashboardPage() {
  const barber = useCurrentBarberProfile();
  const [todays, setTodays] = useState<ApiBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    listBookingsApi(token, { date: toISODate(new Date()) })
      .then(setTodays)
      .catch((err) => console.error(err instanceof ApiError ? err.message : err))
      .finally(() => setIsLoading(false));
  }, []);

  if (barber === undefined || isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">در حال بارگذاری...</div>;
  }
  if (!barber) return null;

  const completed = todays.filter((a) => a.status === "COMPLETED").length;
  const remaining = todays.filter((a) => a.status !== "COMPLETED" && a.status !== "CANCELLED").length;
  const current = todays.find((a) => a.status === "IN_PROGRESS");
  const next = todays.find((a) => a.status === "CONFIRMED");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold md:text-2xl">سلام {barber.user.name.split(" ")[0]} 👋</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">نوبت‌های امروز</p>
            <p className="mt-1 text-2xl font-bold">{todays.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">انجام‌شده</p>
            <p className="mt-1 text-2xl font-bold text-primary">{completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">باقی‌مانده</p>
            <p className="mt-1 text-2xl font-bold">{remaining}</p>
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
                  {current.service.title} — ساعت {current.time}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                در حال انجام
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {next && !current && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">نوبت بعدی</h2>
          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium">{next.customer.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {next.service.title} — ساعت {next.time}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}