"use client";

import type { ColumnDef, Column } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  Appointment,
  ServiceSessionStatus,
} from "@/lib/data/appointments";

export const STATUS_LABELS: Record<ServiceSessionStatus, string> = {
  upcoming: "در انتظار",
  in_progress: "در حال انجام",
  completed: "انجام‌شده",
  cancelled: "لغو‌شده",
};

export const STATUS_STYLES: Record<ServiceSessionStatus, string> = {
  upcoming: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

// اگه lib/data/services.ts داری، این رو با اسم واقعی سرویس‌ها جایگزین کن
export const SERVICE_LABELS: Record<string, string> = {
  haircut: "اصلاح مو",
  beard: "اصلاح ریش",
  color: "رنگ مو",
  facial: "پاکسازی پوست",
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

function SortableHeader({
  label,
  column,
}: {
  label: string;
  column: Column<Appointment, unknown>;
}) {
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
  barberNameById: Map<string, string>;
  onCancel: (id: string) => void;
}

export function getBookingColumns({
  barberNameById,
  onCancel,
}: BookingColumnsOptions): ColumnDef<Appointment>[] {
  return [
    {
      accessorKey: "date",
      header: ({ column }) => <SortableHeader label="تاریخ" column={column} />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {formatPersianDate(row.original.date)}
        </span>
      ),
    },
    {
      accessorKey: "time",
      header: ({ column }) => <SortableHeader label="ساعت" column={column} />,
      cell: ({ row }) => <span className="font-mono">{row.original.time}</span>,
    },
    {
      accessorKey: "customerName",
      header: "مشتری",
    },
    {
      accessorKey: "customerPhone",
      header: "شماره تماس",
      cell: ({ row }) => (
        <span className="font-mono" dir="ltr">
          {row.original.customerPhone}
        </span>
      ),
    },
    {
      accessorKey: "barberId",
      header: "آرایشگر",
      cell: ({ row }) =>
        barberNameById.get(row.original.barberId) ?? row.original.barberId,
    },
    {
      accessorKey: "serviceId",
      header: "خدمت",
      cell: ({ row }) =>
        SERVICE_LABELS[row.original.serviceId] ?? row.original.serviceId,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader label="وضعیت" column={column} />,
      cell: ({ row }) => (
        <span
          className={cn(
            "rounded-full px-2 py-1 text-xs font-medium",
            STATUS_STYLES[row.original.status],
          )}
        >
          {STATUS_LABELS[row.original.status]}
        </span>
      ),
    },
    {
      id: "actions",
      header: "عملیات",
      cell: ({ row }) => {
        const appointment = row.original;
        if (
          appointment.status === "cancelled" ||
          appointment.status === "completed"
        ) {
          return null;
        }
        return (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onCancel(appointment.id)}
          >
            لغو نوبت
          </Button>
        );
      },
    },
  ];
}