import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/customer/status-badge";
import { formatToman } from "@/lib/utils";
import type { ApiBooking } from "@/lib/api";

interface BookingCardProps {
  booking: ApiBooking;
  onCancel?: (id: string) => void;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function BookingCard({ booking, onCancel }: BookingCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium">{booking.service.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">با {booking.barber.user.name}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>
            {formatDate(booking.date)} — ساعت {booking.time}
          </span>
          <span className="text-primary">{formatToman(booking.service.priceValue)}</span>
        </div>

        {booking.notes && (
          <p className="rounded-lg bg-secondary/50 p-2 text-xs text-muted-foreground">
            {booking.notes}
          </p>
        )}

        {booking.status === "CONFIRMED" && onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(booking.id)}
            className="mt-1 self-start text-red-400 hover:text-red-400"
          >
            لغو نوبت
          </Button>
        )}
      </CardContent>
    </Card>
  );
}