"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import type { DateObject } from "react-multi-date-picker";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

import {
  listBookingsApi,
  updateBookingStatusApi,
  listBarbers,
  ApiError,
  type ApiBooking,
  type ApiBarber,
} from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";
import { STATUS_LABELS, formatPersianDate, getBookingColumns } from "./columns";

type DayFilter = "today" | "tomorrow" | "upcoming7" | "history" | "all" | "custom";

const DAY_TABS: { value: DayFilter; label: string }[] = [
  { value: "today", label: "امروز" },
  { value: "tomorrow", label: "فردا" },
  { value: "upcoming7", label: "۷ روز آینده" },
  { value: "history", label: "تاریخچه" },
  { value: "all", label: "همه" },
];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, days: number): Date {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export default function AdminBookingsPage() {
  const [barbers, setBarbers] = useState<ApiBarber[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [barberFilter, setBarberFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [dayFilter, setDayFilter] = useState<DayFilter>("today");
  const [customDate, setCustomDate] = useState<DateObject | null>(null);

  const todayStr = useMemo(() => toISODate(new Date()), []);
  const tomorrowStr = useMemo(() => toISODate(addDays(new Date(), 1)), []);
  const weekEndStr = useMemo(() => toISODate(addDays(new Date(), 6)), []);
  const customDateStr = customDate ? toISODate(customDate.toDate()) : "";

  async function refresh() {
    const token = getAuthToken();
    if (!token) return;
    try {
      const [b, list] = await Promise.all([listBarbers(), listBookingsApi(token)]);
      setBarbers(b);
      setBookings(list);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در دریافت نوبت‌ها");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleSelectTab(tab: DayFilter) {
    setDayFilter(tab);
    setCustomDate(null);
  }

  function handleCustomDateChange(value: DateObject | null) {
    setCustomDate(value);
    setDayFilter(value ? "custom" : "today");
  }

  const filtered = useMemo(() => {
    return bookings
      .filter((b) => {
        const dateStr = b.date.slice(0, 10); // ISO -> فقط بخش تاریخ
        switch (dayFilter) {
          case "today":
            return dateStr === todayStr;
          case "tomorrow":
            return dateStr === tomorrowStr;
          case "upcoming7":
            return dateStr >= todayStr && dateStr <= weekEndStr;
          case "history":
            return dateStr < todayStr;
          case "custom":
            return dateStr === customDateStr;
          case "all":
          default:
            return true;
        }
      })
      .filter((b) => barberFilter === "all" || b.barberId === barberFilter)
      .filter((b) => statusFilter === "all" || b.status === statusFilter)
      .filter(
        (b) =>
          !search.trim() ||
          b.customer.name.includes(search.trim()) ||
          b.customer.mobile.includes(search.trim()),
      );
  }, [bookings, dayFilter, customDateStr, todayStr, tomorrowStr, weekEndStr, barberFilter, statusFilter, search]);

  async function handleCancel(id: string) {
    const token = getAuthToken();
    if (!token) return;
    try {
      await updateBookingStatusApi(id, "CANCELLED", token);
      await refresh();
      toast.success("نوبت لغو شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در لغو نوبت");
    }
  }

  const columns = useMemo(() => getBookingColumns({ onCancel: handleCancel }), []);

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">در حال دریافت نوبت‌ها...</div>;
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">مدیریت نوبت‌ها</h1>
        <p className="text-sm text-muted-foreground">لیست همه‌ی نوبت‌های ثبت‌شده، فارغ از آرایشگر</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {DAY_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleSelectTab(tab.value)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    dayFilter === tab.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">تاریخ دلخواه:</span>
              <JalaliDatePicker value={customDate} onChange={handleCustomDateChange} placeholder="انتخاب تاریخ" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {dayFilter === "custom" && customDate
              ? `نمایش نوبت‌های تاریخ ${customDate.format("YYYY/MM/DD")}`
              : dayFilter === "today"
                ? `نمایش نوبت‌های امروز، ${formatPersianDate(todayStr)}`
                : dayFilter === "tomorrow"
                  ? `نمایش نوبت‌های فردا، ${formatPersianDate(tomorrowStr)}`
                  : dayFilter === "upcoming7"
                    ? "نمایش نوبت‌های ۷ روز آینده"
                    : dayFilter === "history"
                      ? "نمایش تاریخچه‌ی نوبت‌های گذشته"
                      : "نمایش همه‌ی نوبت‌ها"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجو با نام یا شماره مشتری..."
                className="pr-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={barberFilter} onValueChange={setBarberFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="آرایشگر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه‌ی آرایشگرها</SelectItem>
                {barbers.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه‌ی وضعیت‌ها</SelectItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTable columns={columns} data={filtered} emptyMessage="نوبتی با این فیلترها پیدا نشد" />
        </CardContent>
      </Card>
    </main>
  );
}