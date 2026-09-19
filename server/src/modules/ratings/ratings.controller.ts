import type { Request, Response } from "express";
import * as ratingsService from "@/modules/ratings/ratings.service";
import * as bookingsService from "@/modules/bookings/bookings.service";
import * as barbersService from "@/modules/barbers/barbers.service";
import {
  createRatingSchema,
  listBarberRatingsQuerySchema,
} from "@/modules/ratings/ratings.schema";
import { AppError } from "@/utils/AppError";

// ثبت امتیاز — فقط مشتری
export async function createRatingHandler(req: Request, res: Response) {
  const user = req.user!;
  if (user.role !== "CUSTOMER") {
    throw new AppError("فقط مشتری می‌تونه امتیاز ثبت کند", 403);
  }
  const input = createRatingSchema.parse(req.body);
  const rating = await ratingsService.createRating(user.userId, input);
  res.status(201).json(rating);
}

// امتیازها و نظرهای خودِ آرایشگر لاگین‌شده
export async function myRatingsHandler(req: Request, res: Response) {
  const user = req.user!;
  if (user.role !== "BARBER") {
    throw new AppError("این بخش فقط برای آرایشگرها است", 403);
  }
  const barberId = await bookingsService.getBarberProfileIdForUser(user.userId);
  if (!barberId) throw new AppError("پروفایل آرایشگری برای این حساب پیدا نشد", 404);

  const data = await ratingsService.listBarberRatings(barberId);
  res.json(data);
}

// امتیازها و نظرهای یه آرایشگر مشخص — فقط ادمین/مدیر
export async function barberRatingsHandler(req: Request, res: Response) {
  const user = req.user!;
  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    throw new AppError("شما به این بخش دسترسی ندارید", 403);
  }
  const { barberId } = listBarberRatingsQuerySchema.parse(req.query);
  await barbersService.getBarberById(barberId); // اگه وجود نداشته باشه ۴۰۴ می‌ده

  const data = await ratingsService.listBarberRatings(barberId);
  res.json(data);
}