"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Scissors, CalendarClock, TrendingUp } from "lucide-react";

import { getAuthToken } from "@/lib/data/mock-session";
import { formatToman, toPersianDigits } from "@/lib/utils";
import {
  getDashboardSummaryApi,
  ApiError,
  type ApiDashboardSummary,
} from "@/lib/api";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<ApiDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    getDashboardSummaryApi(token)
      .then(setSummary)
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "خطا در دریافت آمار داشبورد");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const stats = [
    {
      label: "نوبت‌های امروز",
      value: summary ? toPersianDigits(String(summary.todaysBookingsCount)) : "—",
      icon: CalendarClock,
    },
    {
      label: "آرایشگرهای فعال",
      value: summary ? toPersianDigits(String(summary.activeBarbersCount)) : "—",
      icon: Users,
    },
    {
      label: "تعداد خدمات",
      value: summary ? toPersianDigits(String(summary.servicesCount)) : "—",
      icon: Scissors,
    },
    {
      label: "درآمد این ماه",
      value: summary ? formatToman(summary.revenueThisMonth) : "—",
      icon: TrendingUp,
    },
  ] as const;

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
                  <div className="text-lg font-bold">
                    {isLoading ? "..." : stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 text-sm font-bold">دسترسی سریع</h2>
          <p className="text-sm text-muted-foreground">
            از منوی بالا برای مدیریت باربرها، خدمات، نوبت‌ها، تعطیلات و
            تنظیمات سالن استفاده کنید.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}