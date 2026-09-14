import { Card, CardContent } from "@/components/ui/card";
import { BookingCard } from "@/components/customer/booking-card";
import { getBookingHistory } from "@/lib/data/bookings";

export default function CustomerHistoryPage() {
  const history = getBookingHistory();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">تاریخچه‌ی نوبت‌ها</h1>

      {history.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            هنوز نوبتی ثبت نشده.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {history.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}