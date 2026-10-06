"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { DateObject } from "react-multi-date-picker";

import { BookingPagination } from "@/components/booking-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { DataTable } from "@/components/ui/data-table";
import {
  StandardTableFilterTabs,
  StandardTablePanel,
  StandardTablePageHeading,
  StandardTableSearch,
} from "@/components/ui/standard-table-layout";

import {
  listBookingsApi,
  updateBookingStatusApi,
  listBarbers,
  ApiError,
  type ApiBooking,
  type ApiBarber,
  type BookingStatus,
} from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";
import {
  STATUS_LABELS,
  formatPersianDate,
  getBookingColumns,
  BookingMobileCard,
} from "./columns";

type DayFilter = "today" | "tomorrow" | "upcoming7" | "history" | "all" | "custom";

const PAGE_SIZE_OPTIONS = [5, 10, 15];
const DEFAULT_PAGE_SIZE = 5;

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
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [barberFilter, setBarberFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");

  const [dayFilter, setDayFilter] = useState<DayFilter>("today");
  const [customDate, setCustomDate] = useState<DateObject | null>(null);

  const todayStr = useMemo(() => toISODate(new Date()), []);
  const tomorrowStr = useMemo(() => toISODate(addDays(new Date(), 1)), []);
  const weekEndStr = useMemo(() => toISODate(addDays(new Date(), 6)), []);
  const customDateStr = customDate ? toISODate(customDate.toDate()) : "";

  const refresh = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      let date: string | undefined;
      let dateFrom: string | undefined;
      let dateTo: string | undefined;
      if (dayFilter === "today") date = todayStr;
      if (dayFilter === "tomorrow") date = tomorrowStr;
      if (dayFilter === "upcoming7") {
        dateFrom = todayStr;
        dateTo = weekEndStr;
      }
      if (dayFilter === "history") dateTo = toISODate(addDays(new Date(), -1));
      if (dayFilter === "custom") date = customDateStr;

      const result = await listBookingsApi(token, {
        page,
        pageSize,
        barberId: barberFilter === "all" ? undefined : barberFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        date,
        dateFrom,
        dateTo,
        search: search.trim() || undefined,
      });
      setBookings(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در دریافت نوبت‌ها");
    } finally {
      setIsLoading(false);
    }
  }, [dayFilter, customDateStr, page, pageSize, barberFilter, statusFilter, search, todayStr, tomorrowStr, weekEndStr]);

  useEffect(() => {
    listBarbers()
      .then(setBarbers)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "خطا در دریافت آرایشگرها"));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => void refresh(), 250);
    return () => clearTimeout(timeout);
  }, [refresh]);

  function handleSelectTab(tab: DayFilter) {
    setDayFilter(tab);
    setCustomDate(null);
    setPage(1);
  }

  function handleCustomDateChange(value: DateObject | null) {
    setCustomDate(value);
    setDayFilter(value ? "custom" : "today");
    setPage(1);
  }

  const handleCancel = useCallback(async (id: string) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      await updateBookingStatusApi(id, "CANCELLED", token);
      await refresh();
      toast.success("نوبت لغو شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در لغو نوبت");
    }
  }, [refresh]);

  const columns = useMemo(() => getBookingColumns({ onCancel: handleCancel }), [handleCancel]);

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">در حال دریافت نوبت‌ها...</div>;
  }

  return (
    <main className="space-y-6">
      <StandardTablePageHeading
        title="مدیریت نوبت‌ها"
        description="لیست همه‌ی نوبت‌های ثبت‌شده، فارغ از آرایشگر"
      />

      <StandardTablePanel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StandardTableFilterTabs
              items={DAY_TABS}
              value={dayFilter}
              onChange={handleSelectTab}
              ariaLabel="فیلتر تاریخ نوبت‌ها"
            />

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
      </StandardTablePanel>

      <StandardTablePanel
        toolbar={
          <>
            <StandardTableSearch
              placeholder="جستجو با نام یا شماره مشتری..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />

            <Select value={barberFilter} onValueChange={(value) => { setBarberFilter(value); setPage(1); }}>
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

            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value as BookingStatus | "all"); setPage(1); }}>
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
          </>
        }
      >

          <DataTable
            columns={columns}
            data={bookings}
            emptyMessage="نوبتی با این فیلترها پیدا نشد"
            initialPageSize={pageSize}
            showPagination={false}
            renderMobileCard={(booking) => (
              <BookingMobileCard booking={booking} onCancel={handleCancel} />
            )}
          />
          <BookingPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            showPageSize
            onPageSizeChange={(value) => {
              if (!PAGE_SIZE_OPTIONS.includes(value)) return;
              setPageSize(value);
              setPage(1);
            }}
            onPageChange={setPage}
          />
      </StandardTablePanel>
    </main>
  );
}