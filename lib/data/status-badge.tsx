import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/data/bookings";

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  confirmed: { label: "تایید‌شده", className: "bg-primary/10 text-primary" },
  completed: { label: "انجام‌شده", className: "bg-secondary text-secondary-foreground" },
  cancelled: { label: "لغوشده", className: "bg-red-500/10 text-red-400" },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}