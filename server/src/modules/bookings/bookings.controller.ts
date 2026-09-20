import type { Request, Response } from "express";
import * as bookingsService from "@/modules/bookings/bookings.service";
import * as barbersService from "@/modules/barbers/barbers.service";
import {
  createBookingSchema,
  updateBookingStatusSchema,
  availabilityQuerySchema,
  availabilityRangeQuerySchema,
  listBookingsQuerySchema,
  createHoldSchema,
} from "@/modules/bookings/bookings.schema";
import { AppError } from "@/utils/AppError";

export async function availabilityHandler(req: Request, res: Response) {
  const { barberId, date } = availabilityQuerySchema.parse(req.query);
  const slots = await bookingsService.getSlotsWithStatus(barberId, date);
  res.json(slots);
}

export async function availabilityRangeHandler(req: Request, res: Response) {
  const { barberId, from, to } = availabilityRangeQuerySchema.parse(req.query);
  const dates = await bookingsService.getAvailableDatesInRange(barberId, from, to);
  res.json(dates);
}

export async function createHoldHandler(req: Request, res: Response) {
  const input = createHoldSchema.parse(req.body);
  const hold = await bookingsService.createOrExtendHold(input.barberId, input.date, input.time);
  res.status(201).json({ id: hold.id, expiresAt: hold.expiresAt });
}

export async function extendHoldHandler(req: Request, res: Response) {
  const hold = await bookingsService.extendHold(req.params.id);
  res.json({ id: hold.id, expiresAt: hold.expiresAt });
}

export async function releaseHoldHandler(req: Request, res: Response) {
  await bookingsService.releaseHold(req.params.id);
  res.status(204).send();
}

export async function createBookingHandler(req: Request, res: Response) {
  const input = createBookingSchema.parse(req.body);
  const booking = await bookingsService.createBooking(req.user!.userId, input);
  res.status(201).json(booking);
}

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
  const { status, reason } = updateBookingStatusSchema.parse(req.body);
  const booking = await bookingsService.updateBookingStatus(req.params.id, req.user!, status, reason);
  res.json(booking);
}

export async function myCustomersHandler(req: Request, res: Response) {
  const barberId = await bookingsService.getBarberProfileIdForUser(req.user!.userId);
  if (!barberId) throw new AppError("پروفایل آرایشگری برای این حساب پیدا نشد", 404);

  const barber = await barbersService.getBarberById(barberId);
  if (!barber.viewCustomers) {
    throw new AppError("شما اجازه‌ی مشاهده‌ی لیست مشتریان را ندارید", 403);
  }

  const customers = await bookingsService.getBarberCustomers(barberId);
  res.json(customers);
}