"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import DateObject from "react-date-object";
import { cn } from "@/lib/utils";

import { getAuthToken } from "@/lib/data/mock-session";
import {
  getBookingsSummaryApi,
  getSalonRevenueReportApi,
  listBarbers,
  ApiError,
  type ApiBookingsSummary,
  type ApiSalonRevenueReport,
  type ApiBarber,
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

function formatToman(amount: number): string {
  return `${amount.toLocaleString("fa-IR")} تومان`;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// شنبه شروع هفته‌ست (تقویم ایرانی)، نه یکشنبه
function startOfWeek(d: Date): Date {
  const result = new Date(d);
  const jsDay = result.getDay(); // 0=یکشنبه ... 6=شنبه
  const daysSinceSaturday = (jsDay + 1) % 7;
  result.setDate(result.getDate() - daysSinceSaturday);
  return result;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

type PeriodKey = "TODAY" | "WEEK" | "MONTH" | "YEAR" | "CUSTOM";

const PERIOD_LABELS: Record<PeriodKey, string> = {
  TODAY: "امروز",
  WEEK: "این هفته",
  MONTH: "این ماه",
  YEAR: "امسال",
  CUSTOM: "بازه دلخواه",
};

export default function AdminReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<ApiBookingsSummary | null>(null);
  const [barbers, setBarbers] = useState<ApiBarber[]>([]);

  const [revenueBarberId, setRevenueBarberId] = useState<string>("ALL");
  const [period, setPeriod] = useState<PeriodKey>("MONTH");
  const [customFrom, setCustomFrom] = useState<DateObject | null>(null);
  const [customTo, setCustomTo] = useState<DateObject | null>(null);
  const [revenue, setRevenue] = useState<ApiSalonRevenueReport | null>(null);
  const [isRevenueLoading, setIsRevenueLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      setIsRevenueLoading(false);
      return;
    }
    Promise.all([getBookingsSummaryApi(token), listBarbers()])
      .then(([s, b]) => {
        setSummary(s);
        setBarbers(b);
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "خطا در دریافت گزارش‌ها");
      })
      .finally(() => setIsLoading(false));
  }, []);

  // بازه‌ی تاریخ بر اساس دوره‌ی انتخاب‌شده. برای CUSTOM از تاریخ‌های
  // انتخابیِ کاربر استفاده می‌شه؛ اگه هنوز انتخاب نکرده، فیلتر تاریخ اعمال نمی‌شه.
  const { dateFrom, dateTo } = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "TODAY":
        return { dateFrom: toISODate(now), dateTo: toISODate(now) };
      case "WEEK":
        return { dateFrom: toISODate(startOfWeek(now)), dateTo: toISODate(now) };
      case "MONTH":
        return { dateFrom: toISODate(startOfMonth(now)), dateTo: toISODate(now) };
      case "YEAR":
        return { dateFrom: toISODate(startOfYear(now)), dateTo: toISODate(now) };
      case "CUSTOM":
        return {
          dateFrom: customFrom ? toISODate(customFrom.toDate()) : undefined,
          dateTo: customTo ? toISODate(customTo.toDate()) : undefined,
        };
    }
  }, [period, customFrom, customTo]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsRevenueLoading(false);
      return;
    }
    // تو حالت دلخواه، تا وقتی هر دو تاریخ انتخاب نشده صبر کن
    if (period === "CUSTOM" && (!dateFrom || !dateTo)) {
      setRevenue(null);
      setIsRevenueLoading(false);
      return;
    }
    setIsRevenueLoading(true);
    getSalonRevenueReportApi(token, {
      ...(revenueBarberId === "ALL" ? {} : { barberId: revenueBarberId }),
      dateFrom,
      dateTo,
    })
      .then(setRevenue)
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "خطا در دریافت گزارش مالی");
      })
      .finally(() => setIsRevenueLoading(false));
  }, [revenueBarberId, period, dateFrom, dateTo]);

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

      {/* گزارش مالی — طبق بند ۷.۱، سرور خودش نوبت‌های isBarberOwnRevenue و
          isPrivateCustomer رو حذف می‌کنه، اینجا فقط فیلتر آرایشگر و بازه‌ی
          زمانی رو می‌فرستیم */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">گزارش مالی سالن</h2>
            <div className="flex flex-wrap gap-2">
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {PERIOD_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={revenueBarberId} onValueChange={setRevenueBarberId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="همه‌ی آرایشگرها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه‌ی آرایشگرها</SelectItem>
                  {barbers.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {period === "CUSTOM" && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">از تاریخ</span>
                <JalaliDatePicker value={customFrom} onChange={setCustomFrom} placeholder="از" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">تا تاریخ</span>
                <JalaliDatePicker value={customTo} onChange={setCustomTo} placeholder="تا" />
              </div>
            </div>
          )}

          {period === "CUSTOM" && (!customFrom || !customTo) ? (
            <p className="text-sm text-muted-foreground">هر دو تاریخ «از» و «تا» را انتخاب کنید.</p>
          ) : isRevenueLoading ? (
            <p className="text-sm text-muted-foreground">در حال دریافت گزارش مالی...</p>
          ) : !revenue ? (
            <p className="text-sm text-muted-foreground">خطا در دریافت گزارش مالی</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-secondary/40 p-4">
                  <span className="block text-sm text-muted-foreground">مجموع درآمد سالن</span>
                  <span className="text-xl font-bold">{formatToman(revenue.totalRevenue)}</span>
                </div>
                <div className="rounded-lg bg-secondary/40 p-4">
                  <span className="block text-sm text-muted-foreground">نوبت تکمیل‌شده</span>
                  <span className="text-xl font-bold">{revenue.completedCount}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">به تفکیک آرایشگر</p>
                {revenue.byBarber.length === 0 ? (
                  <p className="text-sm text-muted-foreground">داده‌ای موجود نیست</p>
                ) : (
                  revenue.byBarber.map((b) => (
                    <div
                      key={b.barberId}
                      className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2"
                    >
                      <span className="text-sm">{b.barberName}</span>
                      <div className="text-left text-sm">
                        <span className="font-medium">{formatToman(b.revenue)}</span>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{b.count} نوبت</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">به تفکیک سرویس</p>
                {revenue.byService.length === 0 ? (
                  <p className="text-sm text-muted-foreground">داده‌ای موجود نیست</p>
                ) : (
                  revenue.byService.map((s) => (
                    <div
                      key={s.serviceId}
                      className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2"
                    >
                      <span className="text-sm">{s.serviceTitle}</span>
                      <div className="text-left text-sm">
                        <span className="font-medium">{formatToman(s.revenue)}</span>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{s.count} نوبت</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}