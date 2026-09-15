export type BookingStatus = "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  customerId: string;
  barberId: string;
  serviceId: string;
  dateKey: string; // برای مرتب‌سازی، مثلاً "1404-07-15"
  dateDisplay: string; // برای نمایش، مثلاً "۱۵ مهر ۱۴۰۴"
  time: string;
  status: BookingStatus;
  notes?: string;
}

// TODO: این mock هست. وقتی بک‌اند آماده شد، این‌ها باید از API بر اساس customerId بیان
export const bookings: Booking[] = [
  { id: "b1", customerId: "c1", barberId: "ali", serviceId: "haircut", dateKey: "1404-07-15", dateDisplay: "۱۵ مهر ۱۴۰۴", time: "14:00", status: "confirmed" },
  { id: "b2", customerId: "c1", barberId: "hamed", serviceId: "color", dateKey: "1404-07-20", dateDisplay: "۲۰ مهر ۱۴۰۴", time: "11:00", status: "confirmed" },
  { id: "b3", customerId: "c1", barberId: "reza", serviceId: "facial", dateKey: "1404-06-02", dateDisplay: "۰۲ شهریور ۱۴۰۴", time: "10:00", status: "completed" },
  { id: "b4", customerId: "c1", barberId: "mehdi", serviceId: "beard", dateKey: "1404-05-18", dateDisplay: "۱۸ مرداد ۱۴۰۴", time: "16:00", status: "completed" },
  { id: "b5", customerId: "c1", barberId: "ali", serviceId: "haircut", dateKey: "1404-05-01", dateDisplay: "۰۱ مرداد ۱۴۰۴", time: "09:00", status: "cancelled" },
];

export function getUpcomingBookings(customerId: string) {
  return bookings
    .filter((b) => b.customerId === customerId && b.status === "confirmed")
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

export function getBookingHistory(customerId: string) {
  return bookings
    .filter((b) => b.customerId === customerId && b.status !== "confirmed")
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

export function getNextBooking(customerId: string) {
  return getUpcomingBookings(customerId)[0] ?? null;
}