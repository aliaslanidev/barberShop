import type { Request, Response } from "express";
import * as ratingsService from "@/modules/ratings/ratings.service";
import * as bookingsService from "@/modules/bookings/bookings.service";
import * as barbersService from "@/modules/barbers/barbers.service";
import {
  createRatingSchema,
  listRatingsQuerySchema,
  updateRatingStatusSchema,
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

// امتیازها و نظرهای خودِ آرایشگر لاگین‌شده (همه‌ی وضعیت‌ها)
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

// ادمین/مدیر: لیست نظرها با فیلتر اختیاری آرایشگر/وضعیت — برای صفحه‌ی تایید نظرها
export async function listRatingsHandler(req: Request, res: Response) {
  const user = req.user!;
  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    throw new AppError("شما به این بخش دسترسی ندارید", 403);
  }
  const { barberId, status } = listRatingsQuerySchema.parse(req.query);
  if (barberId) await barbersService.getBarberById(barberId); // اگه وجود نداشته باشه ۴۰۴ می‌ده

  const data = await ratingsService.listRatingsForAdmin({ barberId, status });
  res.json(data);
}

// ادمین/مدیر: تایید یا رد نمایش عمومیِ متن یه نظر
export async function updateRatingStatusHandler(req: Request, res: Response) {
  const user = req.user!;
  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    throw new AppError("شما به این بخش دسترسی ندارید", 403);
  }
  const { status } = updateRatingStatusSchema.parse(req.body);
  const rating = await ratingsService.updateRatingStatus(req.params.id, status);
  res.json(rating);
}

// عمومی (بدون نیاز به لاگین): معدل + نظرهای تاییدشده‌ی یه آرایشگر — برای
// مودال «مشاهده بیشتر» تو فلوی رزرو
export async function publicBarberReviewsHandler(req: Request, res: Response) {
  const data = await ratingsService.getPublicBarberReviews(req.params.barberId);
  res.json(data);
}