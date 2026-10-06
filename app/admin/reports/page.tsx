"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { StatusCard } from "@/components/ui/status-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import DateObject from "react-date-object";
import { cn, toPersianDigits } from "@/lib/utils";

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
  return `${toPersianDigits(amount.toLocaleString("en-US"))} تومان`;
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
type ReportTab = "BOOKINGS" | "REVENUE";

const PERIOD_LABELS: Record<PeriodKey, string> = {
  TODAY: "امروز",
  WEEK: "این هفته",
  MONTH: "این ماه",
  YEAR: "امسال",
  CUSTOM: "بازه دلخواه",
};

function ReportAccordion({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const panelId = useId();
  const titleId = useId();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateDesktopState = () => setIsDesktop(mediaQuery.matches);
    updateDesktopState();
    mediaQuery.addEventListener("change", updateDesktopState);
    return () => mediaQuery.removeEventListener("change", updateDesktopState);
  }, []);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-[#151a17]">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        id={titleId}
        aria-controls={panelId}
        aria-expanded={isOpen || isDesktop}
        tabIndex={isDesktop ? -1 : undefined}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-right lg:pointer-events-none"
      >
        <span className="font-semibold">{title}</span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          {summary}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-4 w-4 transition-transform duration-200 lg:hidden",
              isOpen && "rotate-180",
            )}
          />
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={titleId}
        className={cn(
          "grid transition-[grid-template-rows,visibility] duration-200 ease-out",
          isOpen
            ? "grid-rows-[1fr]"
            : "invisible grid-rows-[0fr] lg:visible lg:grid-rows-[1fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-border p-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function AdminReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<ApiBookingsSummary | null>(null);
  const [barbers, setBarbers] = useState<ApiBarber[]>([]);
  const [activeTab, setActiveTab] = useState<ReportTab>("BOOKINGS");

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
          گزارش عملکرد نوبت‌ها و درآمد حاصل از آن‌ها
        </p>
      </div>

      <div
        role="group"
        aria-label="نوع گزارش"
        className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-[#0e110f] p-1.5"
      >
        {([
          { value: "BOOKINGS", label: "عملکرد نوبت‌ها" },
          { value: "REVENUE", label: "درآمد نوبت‌ها" },
        ] as const).map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4",
              activeTab === tab.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "BOOKINGS" ? (
        <section
          aria-label="گزارش عملکرد نوبت‌ها"
          className="space-y-5"
        >
          <section
            aria-label="خلاصه نوبت‌ها"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
          >
            <Card className="col-span-2 bg-[#0e110f] sm:col-span-1">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-sm text-muted-foreground">کل نوبت‌ها</span>
                <span className="text-2xl font-bold">{toPersianDigits(totalCount)}</span>
              </CardContent>
            </Card>

            {STATUS_ORDER.map((status) => (
              <Card key={status} className="bg-[#0e110f]">
                <CardContent className="flex flex-col gap-1 p-4">
                  <span className="text-sm text-muted-foreground">{STATUS_LABELS[status]}</span>
                  <span className="text-2xl font-bold">{toPersianDigits(summary.byStatus[status])}</span>
                </CardContent>
              </Card>
            ))}
          </section>

          <ReportAccordion
            title="نوبت‌ها به تفکیک آرایشگر"
            summary={`${toPersianDigits(summary.byBarber.length)} آرایشگر`}
          >
            {summary.byBarber.length === 0 ? (
              <p className="text-sm text-muted-foreground">هنوز آرایشگری ثبت نشده</p>
            ) : (
              <div className="flex flex-col gap-4">
                {summary.byBarber.map((b) => (
                  <div key={b.barberId} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-sm">{b.barberName}</span>
                      <span className="shrink-0 text-sm font-medium">{toPersianDigits(b.count)} نوبت</span>
                    </div>
                    <div
                      className="h-2.5 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-label={`نوبت‌های ${b.barberName}`}
                      aria-valuemin={0}
                      aria-valuemax={maxBarberCount}
                      aria-valuenow={b.count}
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(b.count / maxBarberCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ReportAccordion>

          <ReportAccordion
            title="نوبت‌ها به تفکیک وضعیت"
            summary={`${toPersianDigits(totalCount)} نوبت`}
          >
            {totalCount === 0 ? (
              <p className="text-sm text-muted-foreground">هنوز نوبتی ثبت نشده</p>
            ) : (
              <>
                <div
                  className="flex h-3 w-full overflow-hidden rounded-full"
                  role="img"
                  aria-label="نمودار توزیع نوبت‌ها بر اساس وضعیت"
                >
                  {STATUS_ORDER.map((status) =>
                    summary.byStatus[status] > 0 ? (
                      <div
                        key={status}
                        className={cn(STATUS_STYLES[status])}
                        style={{
                          width: `${(summary.byStatus[status] / totalCount) * 100}%`,
                        }}
                        title={`${STATUS_LABELS[status]}: ${summary.byStatus[status]}`}
                      />
                    ) : null,
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {STATUS_ORDER.map((status) => (
                    <div
                      key={status}
                      className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 px-3 py-2.5 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2.5 w-2.5 shrink-0 rounded-full",
                            STATUS_STYLES[status],
                          )}
                        />
                        {STATUS_LABELS[status]}
                      </span>
                      <span className="font-medium">{summary.byStatus[status]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </ReportAccordion>
        </section>
      ) : (
        <section
          aria-label="گزارش درآمد نوبت‌ها"
          className="space-y-5"
        >
      {/* درآمد از نوبت‌های سالن محاسبه می‌شود؛ این بخش حسابداری یا پرداخت واقعی نیست. */}
      <Card className="bg-[#0e110f]">
        <CardContent className="flex flex-col gap-4 p-4">
          <div>
            <h2 className="font-semibold">درآمد نوبت‌ها</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {PERIOD_LABELS[period]} ·{" "}
              {revenueBarberId === "ALL"
                ? "همه‌ی آرایشگرها"
                : barbers.find((barber) => barber.id === revenueBarberId)?.user.name}
            </p>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              این مبلغ بر اساس نوبت‌های تکمیل‌شده محاسبه شده و نشان‌دهنده‌ی پرداخت واقعی یا حسابداری سالن نیست.
            </p>
          </div>

          <ReportAccordion
            title="تنظیم فیلترهای گزارش"
            summary={PERIOD_LABELS[period]}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                value={period}
                onValueChange={(v) => setPeriod(v as PeriodKey)}
              >
                <SelectTrigger aria-label="بازه زمانی گزارش">
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
                <SelectTrigger aria-label="فیلتر بر اساس آرایشگر">
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

            {period === "CUSTOM" && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">از تاریخ</span>
                  <JalaliDatePicker
                    value={customFrom}
                    onChange={setCustomFrom}
                    placeholder="از"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">تا تاریخ</span>
                  <JalaliDatePicker
                    value={customTo}
                    onChange={setCustomTo}
                    placeholder="تا"
                  />
                </div>
              </div>
            )}
          </ReportAccordion>

          {period === "CUSTOM" && (!customFrom || !customTo) ? (
            <p className="text-sm text-muted-foreground">هر دو تاریخ «از» و «تا» را انتخاب کنید.</p>
          ) : isRevenueLoading ? (
            <p className="text-sm text-muted-foreground">در حال دریافت درآمد نوبت‌ها...</p>
          ) : !revenue ? (
            <p className="text-sm text-muted-foreground">خطا در دریافت گزارش درآمد نوبت‌ها</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-[#151a17] p-4">
                  <span className="block text-sm text-muted-foreground">درآمد محاسبه‌شده از نوبت‌ها</span>
                  <span className="text-xl font-bold">{formatToman(revenue.totalRevenue)}</span>
                </div>
                <div className="rounded-lg bg-[#151a17] p-4">
                  <span className="block text-sm text-muted-foreground">نوبت تکمیل‌شده</span>
                  <span className="text-xl font-bold">{toPersianDigits(revenue.completedCount)}</span>
                </div>
              </div>

              <ReportAccordion
                title="جزئیات درآمد"
                summary={`${toPersianDigits(revenue.byBarber.length + revenue.byService.length)} مورد`}
              >
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">به تفکیک آرایشگر</p>
                    {revenue.byBarber.length === 0 ? (
                      <p className="text-sm text-muted-foreground">داده‌ای موجود نیست</p>
                    ) : (
                      revenue.byBarber.map((b) => (
                        <div
                          key={b.barberId}
                          className="flex items-center justify-between gap-3 rounded-lg bg-[#151a17] px-3 py-2"
                        >
                          <span className="min-w-0 truncate text-sm">{b.barberName}</span>
                          <div className="shrink-0 text-left text-sm">
                            <span className="font-medium">{formatToman(b.revenue)}</span>
                            <span className="mx-2 text-muted-foreground">·</span>
                            <span className="text-muted-foreground">{toPersianDigits(b.count)} نوبت</span>
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
                          className="flex items-center justify-between gap-3 rounded-lg bg-[#151a17] px-3 py-2"
                        >
                          <span className="min-w-0 truncate text-sm">{s.serviceTitle}</span>
                          <div className="shrink-0 text-left text-sm">
                            <span className="font-medium">{formatToman(s.revenue)}</span>
                            <span className="mx-2 text-muted-foreground">·</span>
                            <span className="text-muted-foreground">{toPersianDigits(s.count)} نوبت</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </ReportAccordion>
            </>
          )}
        </CardContent>
      </Card>
        </section>
      )}
    </main>
  );
}