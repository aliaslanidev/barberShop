"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { BookingCard } from "@/components/customer/booking-card";
import { getUpcomingBookings, type Booking } from "@/lib/data/bookings";

export default function CustomerBookingsPage() {
  const [items, setItems] = useState<Booking[]>(getUpcomingBookings());

  function handleCancel(id: string) {
    // TODO: وقتی بک‌اند آماده شد، اینجا باید یه درخواست DELETE/PATCH به API بره
    setItems((prev) => prev.filter((b) => b.id !== id));
    toast.success("نوبت لغو شد");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">نوبت‌های من</h1>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            نوبت آینده‌ای ندارید.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((booking) => (
            <BookingCard key={booking.id} booking={booking} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
}