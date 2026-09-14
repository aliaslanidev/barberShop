"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { getAllAppointments, type ServiceSessionStatus } from "@/lib/data/appointments";
import { getAllBarbers } from "@/lib/data/barbers";

const STATUS_LABELS: Record<ServiceSessionStatus, string> = {
  upcoming: "در انتظار",
  in_progress: "در حال انجام",
  completed: "انجام‌شده",
  cancelled: "لغو‌شده",
};

const STATUS_STYLES: Record<ServiceSessionStatus, string> = {
  upcoming: "bg-blue-500",
  in_progress: "bg-amber-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

export default function AdminReportsPage() {
  const appointments = getAllAppointments();
  const barbers = getAllBarbers();

  const totalCount = appointments.length;

  const byStatus = useMemo(() => {
    const counts = {} as Record<ServiceSessionStatus, number>;
    (Object.keys(STATUS_LABELS) as ServiceSessionStatus[]).forEach((s) => {
      counts[s] = 0;
    });
    appointments.forEach((a) => {
      counts[a.status] = (counts[a.status] ?? 0) + 1;
    });
    return counts;
  }, [appointments]);

  const byBarber = useMemo(() => {
    return barbers
      .map((b) => ({
        id: b.id,
        name: b.name,
        count: appointments.filter((a) => a.barberId === b.id).length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [appointments, barbers]);

  const maxBarberCount = Math.max(1, ...byBarber.map((b) => b.count));

  return (
    <main className="container flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">گزارش‌ها</h1>
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

        {(Object.keys(STATUS_LABELS) as ServiceSessionStatus[]).map((status) => (
          <Card key={status}>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-sm text-muted-foreground">
                {STATUS_LABELS[status]}
              </span>
              <span className="text-2xl font-bold">{byStatus[status]}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <h2 className="font-semibold">نوبت‌ها به تفکیک آرایشگر</h2>

          {byBarber.length === 0 && (
            <p className="text-sm text-muted-foreground">
              هنوز آرایشگری ثبت نشده
            </p>
          )}

          <div className="flex flex-col gap-3">
            {byBarber.map((b) => (
              <div key={b.id} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-sm">
                  {b.name}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${(b.count / maxBarberCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-8 shrink-0 text-left text-sm font-medium">
                  {b.count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <h2 className="font-semibold">نوبت‌ها به تفکیک وضعیت</h2>

          <div className="flex h-4 w-full overflow-hidden rounded-full">
            {(Object.keys(STATUS_LABELS) as ServiceSessionStatus[]).map((status) =>
              byStatus[status] > 0 ? (
                <div
                  key={status}
                  className={cn(STATUS_STYLES[status])}
                  style={{
                    width: `${(byStatus[status] / Math.max(1, totalCount)) * 100}%`,
                  }}
                  title={`${STATUS_LABELS[status]}: ${byStatus[status]}`}
                />
              ) : null
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            {(Object.keys(STATUS_LABELS) as ServiceSessionStatus[]).map((status) => (
              <div key={status} className="flex items-center gap-2 text-sm">
                <span
                  className={cn("h-3 w-3 rounded-full", STATUS_STYLES[status])}
                />
                {STATUS_LABELS[status]} ({byStatus[status]})
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}