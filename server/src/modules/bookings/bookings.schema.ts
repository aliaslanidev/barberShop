import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD (میلادی)
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:mm

export const createBookingSchema = z.object({
  barberId: z.string().min(1, "آرایشگر مشخص نشده"),
  serviceId: z.string().min(1, "سرویس مشخص نشده"),
  date: z.string().regex(dateRegex, "فرمت تاریخ باید YYYY-MM-DD باشد"),
  time: z.string().regex(timeRegex, "فرمت ساعت باید HH:mm باشد"),
  notes: z.string().optional(),
  // اختیاری: id هولدی که تو مرحله‌ی انتخاب ساعت ساخته شده. اگه بفرستی،
  // سرور می‌فهمه این خودِ همون مشتریه که این ساعت رو نگه داشته بود، پس
  // هولدِ خودش مانع ثبت نوبتش نمی‌شه.
  holdId: z.string().optional(),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const updateBookingStatusSchema = z.object({
  status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;

export const availabilityQuerySchema = z.object({
  barberId: z.string().min(1, "آرایشگر مشخص نشده"),
  date: z.string().regex(dateRegex, "فرمت تاریخ باید YYYY-MM-DD باشد"),
});
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

// برای رنگ‌کردن/غیرفعال‌کردن روزهای بدون ظرفیت تو تقویم، قبل از اینکه
// کاربر یه روز خاص رو انتخاب کنه و بفهمه خالی نیست
export const availabilityRangeQuerySchema = z.object({
  barberId: z.string().min(1, "آرایشگر مشخص نشده"),
  from: z.string().regex(dateRegex, "فرمت تاریخ باید YYYY-MM-DD باشد"),
  to: z.string().regex(dateRegex, "فرمت تاریخ باید YYYY-MM-DD باشد"),
});
export type AvailabilityRangeQuery = z.infer<typeof availabilityRangeQuerySchema>;

export const listBookingsQuerySchema = z.object({
  barberId: z.string().optional(),
  customerId: z.string().optional(),
  status: z.enum(["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  date: z.string().regex(dateRegex).optional(),
  dateFrom: z.string().regex(dateRegex).optional(),
  dateTo: z.string().regex(dateRegex).optional(),
});
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;

// ==================== Slot Hold ====================

export const createHoldSchema = z.object({
  barberId: z.string().min(1, "آرایشگر مشخص نشده"),
  date: z.string().regex(dateRegex, "فرمت تاریخ باید YYYY-MM-DD باشد"),
  time: z.string().regex(timeRegex, "فرمت ساعت باید HH:mm باشد"),
});
export type CreateHoldInput = z.infer<typeof createHoldSchema>;