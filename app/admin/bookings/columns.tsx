"use client";

import type { ColumnDef, Column } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ApiBooking, BookingStatus } from "@/lib/api";

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
      accessorFn: (row) => row.service.title,
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