"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingCard } from "@/components/customer/booking-card";
import { getNextBooking, getUpcomingBookings, getBookingHistory } from "@/lib/data/bookings";
import { getCurrentCustomer } from "@/lib/data/customer-session";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const customer = getCurrentCustomer();

  useEffect(() => {
    if (!customer) {
      router.replace("/login");
    }
  }, [customer, router]);

  if (!customer) {
    return null;
  }

  const nextBooking = getNextBooking(customer.id);
  const upcomingCount = getUpcomingBookings(customer.id).length;
  const historyCount = getBookingHistory(customer.id).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold md:text-2xl">سلام {customer.name.split(" ")[0]} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">خلاصه‌ی وضعیت نوبت‌هات اینجاست.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">نوبت‌های آینده</p>
            <p className="mt-1 text-2xl font-bold text-primary">{upcomingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">تعداد کل نوبت‌های قبلی</p>
            <p className="mt-1 text-2xl font-bold">{historyCount}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">نزدیک‌ترین نوبت</h2>
        {nextBooking ? (
          <BookingCard booking={nextBooking} />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <p className="text-sm text-muted-foreground">نوبت آینده‌ای ندارید.</p>
              <Button asChild>
                <Link href="/booking">رزرو نوبت جدید</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}