import { StatusChip } from "@/components/ui/status-card";
import { bookingStatusTone } from "@/lib/status-tones";
import type { BookingStatus } from "@/lib/api";

const statusLabels: Record<BookingStatus, string> = {
  CONFIRMED: "تایید‌شده",
  IN_PROGRESS: "در حال انجام",
  COMPLETED: "انجام‌شده",
  CANCELLED: "لغوشده",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <StatusChip tone={bookingStatusTone(status)}>{statusLabels[status]}</StatusChip>
  );
}