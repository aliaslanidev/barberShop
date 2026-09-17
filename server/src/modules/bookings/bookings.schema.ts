import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD (میلادی)
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:mm

export const createBookingSchema = z.object({
  barberId: z.string().min(1, "آرایشگر مشخص نشده"),
  serviceId: z.string().min(1, "سرویس مشخص نشده"),
  date: z.string().regex(dateRegex, "فرمت تاریخ باید YYYY-MM-DD باشد"),
  time: z.string().regex(timeRegex, "فرمت ساعت باید HH:mm باشد"),
  notes: z.string().optional(),
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

export const listBookingsQuerySchema = z.object({
  barberId: z.string().optional(),
  customerId: z.string().optional(),
  status: z.enum(["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  date: z.string().regex(dateRegex).optional(),
  dateFrom: z.string().regex(dateRegex).optional(),
  dateTo: z.string().regex(dateRegex).optional(),
});
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;