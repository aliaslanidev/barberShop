import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/customer/status-badge";
import { formatToman } from "@/lib/utils";
import { getBarberById } from "@/lib/data/barbers";
import { getServiceById } from "@/lib/data/services";
import type { Booking } from "@/lib/data/bookings";

interface BookingCardProps {
  booking: Booking;
  onCancel?: (id: string) => void;
}

export function BookingCard({ booking, onCancel }: BookingCardProps) {
  const barber = getBarberById(booking.barberId);
  const service = getServiceById(booking.serviceId);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium">{service?.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">با {barber?.name}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>{booking.dateDisplay} — ساعت {booking.time}</span>
          {service && <span className="text-primary">{formatToman(service.priceValue)}</span>}
        </div>

        {booking.notes && (
          <p className="rounded-lg bg-secondary/50 p-2 text-xs text-muted-foreground">{booking.notes}</p>
        )}

        {booking.status === "confirmed" && onCancel && (
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