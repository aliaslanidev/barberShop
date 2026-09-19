"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { Users, Scissors, CalendarClock, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getAuthToken } from "@/lib/data/mock-session";
import {
  listBookingsApi,
  listBarbers,
  listServices,
  ApiError,
  type ApiBooking,
  type BookingStatus,
} from "@/lib/api";

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatToman(value: number): string {
  return `${value.toLocaleString("fa-IR")} تومان`;
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  CONFIRMED: "تایید شده",
  IN_PROGRESS: "در حال انجام",
  COMPLETED: "انجام شد",
  CANCELLED: "لغو شده",
};

interface DashboardData {
  todayBookings: ApiBooking[];
  activeBarbers: number;
  servicesCount: number;
  monthRevenue: number;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const now = new DateObject({ calendar: persian, locale: persian_fa });
        const todayStr = toISODate(now.toDate());
        const monthStart = toISODate(
          new DateObject(now).toFirstOfMonth().toDate()
        );
        const monthEnd = toISODate(
          new DateObject(now).toLastOfMonth().toDate()
        );

        const [bookings, barbers, services] = await Promise.all([
          listBookingsApi(token, { dateFrom: monthStart }),
          listBarbers(),
          listServices(),
        ]);

        const dayOf = (b: ApiBooking) => b.date.slice(0, 10);

        const todayBookings = bookings
          .filter((b) => dayOf(b) === todayStr && b.status !== "CANCELLED")
          .sort((a, b) => a.time.localeCompare(b.time));

        const monthRevenue = bookings
          .filter(
            (b) =>
              b.status === "COMPLETED" &&
              dayOf(b) >= monthStart &&
              dayOf(b) <= monthEnd
          )
          .reduce((sum, b) => sum + (b.price ?? b.service.priceValue), 0);

        setData({
          todayBookings,
          activeBarbers: barbers.filter((b) => b.isActive).length,
          servicesCount: services.length,
          monthRevenue,
        });
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "خطا در دریافت اطلاعات داشبورد"
        );
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        در حال دریافت اطلاعات...
      </div>
    );
  }

  const stats = [
    {
      label: "نوبت‌های امروز",
      value: (data?.todayBookings.length ?? 0).toLocaleString("fa-IR"),
      icon: CalendarClock,
    },
    {
      label: "آرایشگرهای فعال",
      value: (data?.activeBarbers ?? 0).toLocaleString("fa-IR"),
      icon: Users,
    },
    {
      label: "خدمات",
      value: (data?.servicesCount ?? 0).toLocaleString("fa-IR"),
      icon: Scissors,
    },
    {
      label: "درآمد این ماه",
      value: formatToman(data?.monthRevenue ?? 0),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">داشبورد مدیریت</h1>
        <p className="text-sm text-muted-foreground">نمای کلی وضعیت سالن</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 text-sm font-bold">نوبت‌های امروز</h2>

          {(data?.todayBookings.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              برای امروز نوبتی ثبت نشده
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {data?.todayBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-bold">
                      {b.time.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}
                    </span>
                    <span>{b.customer.name}</span>
                    <span className="text-muted-foreground">
                      {b.service.title} — {b.barber.user.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {STATUS_LABELS[b.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}