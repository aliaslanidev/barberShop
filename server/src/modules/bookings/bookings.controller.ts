import type { Request, Response } from "express";
import * as bookingsService from "@/modules/bookings/bookings.service";
import {
  createBookingSchema,
  updateBookingStatusSchema,
  availabilityQuerySchema,
  availabilityRangeQuerySchema,
  listBookingsQuerySchema,
} from "@/modules/bookings/bookings.schema";
import { AppError } from "@/utils/AppError";

// عمومی — تو فلوی بوکینگ، تاریخ/ساعت قبل از مرحله‌ی auth انتخاب می‌شن
export async function availabilityHandler(req: Request, res: Response) {
  const { barberId, date } = availabilityQuerySchema.parse(req.query);
  const slots = await bookingsService.getAvailableSlots(barberId, date);
  res.json(slots);
}

// برای رنگ‌کردن/غیرفعال‌کردن روزهای بدون ظرفیت تو تقویم رزرو
export async function availabilityRangeHandler(req: Request, res: Response) {
  const { barberId, from, to } = availabilityRangeQuerySchema.parse(req.query);
  const dates = await bookingsService.getAvailableDatesInRange(barberId, from, to);
  res.json(dates);
}

export async function createBookingHandler(req: Request, res: Response) {
  const input = createBookingSchema.parse(req.body);
  const booking = await bookingsService.createBooking(req.user!.userId, input);
  res.status(201).json(booking);
}

// نتیجه بر اساس نقش کاربر خودکار محدود می‌شه — دقیقاً معادل منطقی که
// قبلاً تو getUpcomingBookings/getBarberCustomers/... تو فرانت mock بود
export async function listBookingsHandler(req: Request, res: Response) {
  const query = listBookingsQuerySchema.parse(req.query);
  const user = req.user!;

  if (user.role === "CUSTOMER") {
    query.customerId = user.userId;
  } else if (user.role === "BARBER") {
    const barberId = await bookingsService.getBarberProfileIdForUser(user.userId);
    if (!barberId) throw new AppError("پروفایل آرایشگری برای این حساب پیدا نشد", 404);
    query.barberId = barberId;
  }
  // ADMIN/MANAGER: هر فیلتری که تو query اومده همون‌طور اعمال می‌شه (یا خالی = همه)

  const bookings = await bookingsService.listBookings(query);
  res.json(bookings);
}

export async function getBookingHandler(req: Request, res: Response) {
  const booking = await bookingsService.getBookingById(req.params.id);
  const user = req.user!;

  if (user.role === "CUSTOMER" && booking.customerId !== user.userId) {
    throw new AppError("شما به این نوبت دسترسی ندارید", 403);
  }
  if (user.role === "BARBER") {
    const barberId = await bookingsService.getBarberProfileIdForUser(user.userId);
    if (booking.barberId !== barberId) {
      throw new AppError("شما به این نوبت دسترسی ندارید", 403);
    }
  }

  res.json(booking);
}

export async function updateBookingStatusHandler(req: Request, res: Response) {
  const { status } = updateBookingStatusSchema.parse(req.body);
  const booking = await bookingsService.updateBookingStatus(req.params.id, req.user!, status);
  res.json(booking);
}

export async function myCustomersHandler(req: Request, res: Response) {
  const barberId = await bookingsService.getBarberProfileIdForUser(req.user!.userId);
  if (!barberId) throw new AppError("پروفایل آرایشگری برای این حساب پیدا نشد", 404);
  const customers = await bookingsService.getBarberCustomers(barberId);
  res.json(customers);
}