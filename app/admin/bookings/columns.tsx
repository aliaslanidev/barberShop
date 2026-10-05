"use client";

import { useState } from "react";
import type { ColumnDef, Column } from "@tanstack/react-table";
import { ArrowUpDown, Clock, Phone, Scissors, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBookingServiceTitles, type ApiBooking, type BookingStatus } from "@/lib/api";

export const STATUS_LABELS: Record<BookingStatus, string> = {
  CONFIRMED: "در انتظار",
  IN_PROGRESS: "در حال انجام",
  COMPLETED: "انجام‌شده",
  CANCELLED: "لغو‌شده",
};

export const STATUS_STYLES: Record<BookingStatus, string> = {
  CONFIRMED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function formatPersianDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", {
      day: "numeric",
      month: "long",
      weekday: "long",
    });
  } catch {
    return iso;
  }
}

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

function SortableHeader({ label, column }: { label: string; column: Column<ApiBooking, unknown> }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-mr-2 h-8 gap-1 px-2 font-medium text-muted-foreground hover:text-foreground"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown className="h-3.5 w-3.5" />
    </Button>
  );
}

interface BookingColumnsOptions {
  onCancel: (id: string) => void;
}

// دیگه نیازی به barberNameById/SERVICE_LABELS نیست — ApiBooking خودش
// barber.user.name و service.title رو join‌شده از بک‌اند میاره
export function getBookingColumns({ onCancel }: BookingColumnsOptions): ColumnDef<ApiBooking>[] {
  return [
    {
      accessorKey: "date",
      header: ({ column }) => <SortableHeader label="تاریخ" column={column} />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{formatPersianDate(row.original.date)}</span>
      ),
    },
    {
      accessorKey: "time",
      header: ({ column }) => <SortableHeader label="ساعت" column={column} />,
      cell: ({ row }) => <span className="font-mono">{row.original.time}</span>,
    },
    {
      id: "customerName",
      accessorFn: (row) => row.customer.name,
      header: "مشتری",
    },
    {
      id: "customerPhone",
      accessorFn: (row) => row.customer.mobile,
      header: "شماره تماس",
      cell: ({ row }) => (
        <span className="font-mono" dir="ltr">
          {row.original.customer.mobile}
        </span>
      ),
    },
    {
      id: "barberName",
      accessorFn: (row) => row.barber.user.name,
      header: "آرایشگر",
    },
    {
      id: "serviceTitle",
      accessorFn: getBookingServiceTitles,
      header: "خدمت",
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader label="وضعیت" column={column} />,
      cell: ({ row }) => (
        <span className={cn("rounded-full px-2 py-1 text-xs font-medium", STATUS_STYLES[row.original.status])}>
          {STATUS_LABELS[row.original.status]}
        </span>
      ),
    },
    {
      id: "actions",
      header: "عملیات",
      cell: ({ row }) => {
        const booking = row.original;
        if (booking.status === "CANCELLED" || booking.status === "COMPLETED") return null;
        return (
          <Button size="sm" variant="destructive" onClick={() => onCancel(booking.id)}>
            لغو نوبت
          </Button>
        );
      },
    },
  ];
}

// ==================== کارت موبایل ====================

// رنگ‌بندی کارت بر اساس وضعیت (مناسب تم تیره): نوار کناری، سایه‌ی ملایم پس‌زمینه و نشان وضعیت
const CARD_THEME: Record<
  BookingStatus,
  { accent: string; tint: string; badge: string; time: string }
> = {
  CONFIRMED: {
    accent: "bg-blue-500",
    tint: "bg-blue-500/[0.07]",
    badge: "bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-500/30",
    time: "text-blue-300",
  },
  IN_PROGRESS: {
    accent: "bg-amber-500",
    tint: "bg-amber-500/[0.07]",
    badge: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30",
    time: "text-amber-300",
  },
  COMPLETED: {
    accent: "bg-emerald-500",
    tint: "bg-emerald-500/[0.06]",
    badge: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30",
    time: "text-emerald-300",
  },
  CANCELLED: {
    accent: "bg-red-500/70",
    tint: "bg-red-500/[0.05]",
    badge: "bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/30",
    time: "text-muted-foreground",
  },
};

// کارت موبایلِ هر نوبت — جایگزین ردیف جدول در صفحه‌های کوچک
export function BookingMobileCard({
  booking,
  onCancel,
}: {
  booking: ApiBooking;
  onCancel: (id: string) => void | Promise<void>;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const theme = CARD_THEME[booking.status];
  const canCancel = booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS";
  const isCancelled = booking.status === "CANCELLED";
  const initial = booking.customer.name.trim().charAt(0) || "؟";

  async function handleConfirmCancel() {
    setIsCancelling(true);
    try {
      await onCancel(booking.id);
    } finally {
      setIsCancelling(false);
      setIsConfirming(false);
    }
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card py-4 pl-4 pr-5 shadow-sm",
        isCancelled && "opacity-80",
      )}
    >
      {/* نوار رنگی وضعیت (سمت شروع در RTL) و سایه‌ی ملایم پس‌زمینه */}
      <span className={cn("pointer-events-none absolute inset-0", theme.tint)} />
      <span className={cn("absolute inset-y-0 right-0 w-1.5", theme.accent)} />

      <div className="relative flex flex-col gap-3.5">
        {/* ردیف اول: ساعت و تاریخ + وضعیت */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Clock className={cn("h-4 w-4 shrink-0", theme.time)} />
            <span className={cn("text-lg font-bold leading-none", theme.time)}>
              {toPersianDigits(booking.time)}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {formatPersianDate(booking.date)}
            </span>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
              theme.badge,
            )}
          >
            {STATUS_LABELS[booking.status]}
          </span>
        </div>

        {/* مشتری */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold text-white/90",
              theme.accent,
            )}
            aria-hidden
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{booking.customer.name}</p>
            <p dir="ltr" className="mt-0.5 text-right text-xs text-muted-foreground">
              {toPersianDigits(booking.customer.mobile)}
            </p>
          </div>
        </div>

        {/* آرایشگر و خدمت */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-background/50 p-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              آرایشگر
            </div>
            <p className="mt-1 text-sm font-medium">{booking.barber.user.name}</p>
          </div>
          <div className="rounded-lg bg-background/50 p-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Scissors className="h-3.5 w-3.5" />
              خدمت
            </div>
            <p className="mt-1 text-sm font-medium">{getBookingServiceTitles(booking)}</p>
          </div>
        </div>

        {/* عملیات */}
        {isConfirming ? (
          <div className="space-y-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-sm leading-6">
              نوبت {booking.customer.name} لغو شود؟ این کار قابل بازگشت نیست.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="destructive"
                className="h-11"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
              >
                {isCancelling ? "در حال لغو..." : "بله، لغو شود"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={isCancelling}
                onClick={() => setIsConfirming(false)}
              >
                انصراف
              </Button>
            </div>
          </div>
        ) : (
          <div className={cn("grid gap-2", canCancel ? "grid-cols-2" : "grid-cols-1")}>
            <a
              href={`tel:${booking.customer.mobile}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-background/60 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Phone className="h-4 w-4" />
              تماس با مشتری
            </a>
            {canCancel && (
              <Button
                type="button"
                variant="outline"
                className="h-11 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                onClick={() => setIsConfirming(true)}
              >
                لغو نوبت
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}