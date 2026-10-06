"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import type { DateObject } from "react-multi-date-picker";

import { BookingPagination } from "@/components/booking-pagination";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StandardTableFilterTabs,
  StandardTablePageHeading,
  StandardTablePanel,
  StandardTableSearch,
} from "@/components/ui/standard-table-layout";
import { StandardTableSortHeader } from "@/components/ui/standard-table";
import { StatusCard, TableStatusBadge } from "@/components/ui/status-card";
import {
  ApiError,
  getBookingServiceTitles,
  listBookingsApi,
  updateBookingStatusApi,
  type ApiBooking,
  type BookingStatus,
} from "@/lib/api";
import { bookingStatusTone } from "@/lib/status-tones";
import { getAuthToken } from "@/lib/data/mock-session";
import { toPersianDigits } from "@/lib/utils";

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

const STATUS_LABELS: Record<BookingStatus, string> = {
  CONFIRMED: "در انتظار",
  IN_PROGRESS: "در حال انجام",
  COMPLETED: "انجام‌شده",
  CANCELLED: "لغوشده",
};

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(base: Date, days: number): Date {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function dateKeyOf(booking: ApiBooking): string {
  return booking.date.slice(0, 10);
}

function formatPersianDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("fa-IR", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
}

function SortableHeader({
  label,
  column,
}: {
  label: string;
  column: Column<ApiBooking, unknown>;
}) {
  return (
    <StandardTableSortHeader
      label={label}
      direction={column.getIsSorted() || false}
      onSort={() => column.toggleSorting(column.getIsSorted() === "asc")}
    />
  );
}

function getBookingColumns({
  today,
  onUpdateStatus,
}: {
  today: string;
  onUpdateStatus: (id: string, status: BookingStatus) => void;
}): ColumnDef<ApiBooking>[] {
  return [
    {
      id: "date",
      accessorFn: dateKeyOf,
      header: ({ column }) => <SortableHeader label="تاریخ" column={column} />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{formatPersianDate(row.original.date)}</span>
      ),
    },
    {
      accessorKey: "time",
      header: ({ column }) => <SortableHeader label="ساعت" column={column} />,
      cell: ({ row }) => (
        <span className="font-mono">{toPersianDigits(row.original.time)}</span>
      ),
    },
    {
      id: "customerName",
      accessorFn: (row) => row.customer.name,
      header: ({ column }) => <SortableHeader label="مشتری" column={column} />,
    },
    {
      id: "customerPhone",
      accessorFn: (row) => row.customer.mobile,
      header: ({ column }) => <SortableHeader label="شماره تماس" column={column} />,
      cell: ({ row }) => (
        <span className="font-mono" dir="ltr">
          {toPersianDigits(row.original.customer.mobile)}
        </span>
      ),
    },
    {
      id: "serviceTitle",
      accessorFn: getBookingServiceTitles,
      header: ({ column }) => <SortableHeader label="خدمت" column={column} />,
      size: 170,
      minSize: 130,
      maxSize: 190,
      cell: ({ row }) => {
        const title = getBookingServiceTitles(row.original);
        return (
          <span className="block truncate whitespace-nowrap" title={title}>
            {title}
          </span>
        );
      },
    },
    {
      id: "price",
      accessorFn: (row) => row.price ?? row.service.priceValue,
      header: ({ column }) => <SortableHeader label="مبلغ" column={column} />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {toPersianDigits((row.original.price ?? row.original.service.priceValue).toLocaleString("fa-IR"))} تومان
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader label="وضعیت" column={column} />,
      size: 120,
      minSize: 110,
      maxSize: 140,
      cell: ({ row }) => (
        <TableStatusBadge tone={bookingStatusTone(row.original.status)}>
          {STATUS_LABELS[row.original.status]}
        </TableStatusBadge>
      ),
    },
    {
      id: "actions",
      accessorFn: (row) => row.status,
      header: ({ column }) => <SortableHeader label="عملیات" column={column} />,
      size: 160,
      minSize: 150,
      maxSize: 175,
      cell: ({ row }) => {
        const booking = row.original;
        if (dateKeyOf(booking) !== today) return null;
        if (booking.status === "CONFIRMED") {
          return (
            <Button
              size="sm"
              className="whitespace-nowrap"
              onClick={() => onUpdateStatus(booking.id, "IN_PROGRESS")}
            >
              شروع سرویس
            </Button>
          );
        }
        if (booking.status === "IN_PROGRESS") {
          return (
            <Button
              size="sm"
              className="whitespace-nowrap"
              onClick={() => onUpdateStatus(booking.id, "COMPLETED")}
            >
              پایان سرویس
            </Button>
          );
        }
        return null;
      },
    },
  ];
}

function BookingMobileCard({
  booking,
  today,
  onUpdateStatus,
}: {
  booking: ApiBooking;
  today: string;
  onUpdateStatus: (id: string, status: BookingStatus) => void;
}) {
  const canUpdateStatus =
    dateKeyOf(booking) === today &&
    (booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS");

  return (
    <StatusCard
      tone={bookingStatusTone(booking.status)}
      showTint={false}
      accentClassName="bg-primary"
      className="bg-[#0e110f]"
      contentClassName="flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{booking.customer.name}</p>
          <p dir="ltr" className="mt-1 text-right text-xs text-muted-foreground">
            {toPersianDigits(booking.customer.mobile)}
          </p>
        </div>
        <TableStatusBadge tone={bookingStatusTone(booking.status)}>
          {STATUS_LABELS[booking.status]}
        </TableStatusBadge>
      </div>
      <div className="text-xs text-muted-foreground">
        <p>
          {formatPersianDate(booking.date)} · ساعت {toPersianDigits(booking.time)}
        </p>
        <p className="mt-1">
          {getBookingServiceTitles(booking)} ·{" "}
          {toPersianDigits(
            (booking.price ?? booking.service.priceValue).toLocaleString("fa-IR"),
          )}{" "}
          تومان
        </p>
        {booking.notes && <p className="mt-1">توضیحات: {booking.notes}</p>}
      </div>
      {canUpdateStatus && (
        <Button
          size="sm"
          className="self-start"
          onClick={() =>
            onUpdateStatus(
              booking.id,
              booking.status === "CONFIRMED" ? "IN_PROGRESS" : "COMPLETED",
            )
          }
        >
          {booking.status === "CONFIRMED" ? "شروع سرویس" : "پایان سرویس"}
        </Button>
      )}
    </StatusCard>
  );
}

export default function BarberBookingsPage() {
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [dayFilter, setDayFilter] = useState<DayFilter>("today");
  const [customDate, setCustomDate] = useState<DateObject | null>(null);

  const today = useMemo(() => toISODate(new Date()), []);
  const tomorrow = useMemo(() => toISODate(addDays(new Date(), 1)), []);
  const weekEnd = useMemo(() => toISODate(addDays(new Date(), 6)), []);
  const customDateString = customDate ? toISODate(customDate.toDate()) : "";

  const refresh = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      let date: string | undefined;
      let dateFrom: string | undefined;
      let dateTo: string | undefined;

      if (dayFilter === "today") date = today;
      if (dayFilter === "tomorrow") date = tomorrow;
      if (dayFilter === "upcoming7") {
        dateFrom = today;
        dateTo = weekEnd;
      }
      if (dayFilter === "history") dateTo = toISODate(addDays(new Date(), -1));
      if (dayFilter === "custom") date = customDateString;

      const result = await listBookingsApi(token, {
        page,
        pageSize,
        status: statusFilter === "all" ? undefined : statusFilter,
        date,
        dateFrom,
        dateTo,
        search: search.trim() || undefined,
        sort: dayFilter === "history" || dayFilter === "all" ? "desc" : "asc",
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
  }, [
    customDateString,
    dayFilter,
    page,
    pageSize,
    search,
    statusFilter,
    today,
    tomorrow,
    weekEnd,
  ]);

  useEffect(() => {
    const timeout = setTimeout(() => void refresh(), 250);
    return () => clearTimeout(timeout);
  }, [refresh]);

  const handleUpdateStatus = useCallback(
    async (id: string, status: BookingStatus) => {
      const token = getAuthToken();
      if (!token) return;
      try {
        await updateBookingStatusApi(id, status, token);
        await refresh();
        toast.success(status === "IN_PROGRESS" ? "سرویس شروع شد" : "سرویس پایان یافت");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت");
      }
    },
    [refresh],
  );

  const columns = useMemo(
    () => getBookingColumns({ today, onUpdateStatus: handleUpdateStatus }),
    [today, handleUpdateStatus],
  );

  function handleSelectTab(value: DayFilter) {
    setDayFilter(value);
    setCustomDate(null);
    setPage(1);
  }

  function handleCustomDateChange(value: DateObject | null) {
    setCustomDate(value);
    setDayFilter(value ? "custom" : "today");
    setPage(1);
  }

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">در حال دریافت نوبت‌ها...</div>;
  }

  return (
    <main className="space-y-6">
      <StandardTablePageHeading
        title="نوبت‌های من"
        description="لیست نوبت‌های ثبت‌شده برای شما"
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
            <span className="shrink-0 text-sm text-muted-foreground">تاریخ دلخواه:</span>
            <JalaliDatePicker
              value={customDate}
              onChange={handleCustomDateChange}
              placeholder="انتخاب تاریخ"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {dayFilter === "custom" && customDate
            ? `نمایش نوبت‌های تاریخ ${customDate.format("YYYY/MM/DD")}`
            : dayFilter === "today"
              ? `نمایش نوبت‌های امروز، ${formatPersianDate(today)}`
              : dayFilter === "tomorrow"
                ? `نمایش نوبت‌های فردا، ${formatPersianDate(tomorrow)}`
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
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as BookingStatus | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="sm:w-44">
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
            <BookingMobileCard
              booking={booking}
              today={today}
              onUpdateStatus={handleUpdateStatus}
            />
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
