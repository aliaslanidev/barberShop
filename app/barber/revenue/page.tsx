"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import DateObject from "react-date-object";

import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { useAuth } from "@/lib/auth-context";
import { getAuthToken } from "@/lib/data/mock-session";
import {
  listBarbers,
  getMyRevenueReportApi,
  ApiError,
  type ApiBarber,
  type ApiBarberOwnRevenueReport,
} from "@/lib/api";

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

type PeriodKey = "TODAY" | "WEEK" | "MONTH" | "YEAR" | "ALL" | "CUSTOM";

const PERIOD_LABELS: Record<PeriodKey, string> = {
  TODAY: "امروز",
  WEEK: "این هفته",
  MONTH: "این ماه",
  YEAR: "امسال",
  ALL: "کل تاریخچه",
  CUSTOM: "بازه دلخواه",
};

export default function BarberRevenuePage() {
  const { user } = useAuth();
  const [barber, setBarber] = useState<ApiBarber | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [period, setPeriod] = useState<PeriodKey>("MONTH");
  const [customFrom, setCustomFrom] = useState<DateObject | null>(null);
  const [customTo, setCustomTo] = useState<DateObject | null>(null);
  const [report, setReport] = useState<ApiBarberOwnRevenueReport | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(true);

  useEffect(() => {
    async function loadBarber() {
      try {
        const all = await listBarbers();
        const mine = all.find((b) => b.user.id === user?.id) ?? null;
        setBarber(mine);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "خطا در دریافت اطلاعات");
      } finally {
        setIsLoading(false);
      }
    }
    if (user) loadBarber();
  }, [user?.id]);

  // بازه‌ی تاریخ بر اساس دوره‌ی انتخاب‌شده
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
      case "ALL":
        return { dateFrom: undefined, dateTo: undefined };
      case "CUSTOM":
        return {
          dateFrom: customFrom ? toISODate(customFrom.toDate()) : undefined,
          dateTo: customTo ? toISODate(customTo.toDate()) : undefined,
        };
    }
  }, [period, customFrom, customTo]);

  useEffect(() => {
    async function loadReport() {
      const token = getAuthToken();
      if (!token || !barber?.managePricing) {
        setIsReportLoading(false);
        return;
      }
      // تو حالت دلخواه، تا وقتی هر دو تاریخ انتخاب نشده صبر کن
      if (period === "CUSTOM" && (!dateFrom || !dateTo)) {
        setReport(null);
        setIsReportLoading(false);
        return;
      }
      setIsReportLoading(true);
      try {
        const result = await getMyRevenueReportApi(token, { dateFrom, dateTo });
        setReport(result);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "خطا در دریافت گزارش درآمد");
      } finally {
        setIsReportLoading(false);
      }
    }
    if (barber) loadReport();
  }, [barber, period, dateFrom, dateTo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        در حال دریافت اطلاعات...
      </div>
    );
  }

  if (!barber?.managePricing) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold md:text-2xl">درآمد من</h1>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            شما اجازه‌ی مشاهده‌ی این گزارش را ندارید.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">درآمد من</h1>
      <p className="text-sm text-muted-foreground">
        این گزارش فقط درآمد شخصی خودتان است و هیچ‌کس دیگری (ادمین/مدیر سالن) آن را نمی‌بیند.
      </p>

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
      ) : isReportLoading ? (
        <p className="text-sm text-muted-foreground">در حال دریافت گزارش...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="flex flex-col items-center gap-2 p-5">
                <Wallet className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">
                  {report ? formatToman(report.totalRevenue) : "—"}
                </span>
                <span className="text-xs text-muted-foreground">مجموع درآمد</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center gap-2 p-5">
                <span className="text-lg font-bold">{report?.completedCount ?? 0}</span>
                <span className="text-xs text-muted-foreground">نوبت تکمیل‌شده</span>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">تفکیک بر اساس سرویس</p>
            {!report || report.byService.length === 0 ? (
              <p className="text-sm text-muted-foreground">هنوز درآمدی ثبت نشده است.</p>
            ) : (
              report.byService.map((s) => (
                <div
                  key={s.serviceTitle}
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
    </div>
  );
}