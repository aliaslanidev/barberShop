import type { Request, Response } from "express";
import { AppError } from "@/utils/AppError";
import { prisma } from "@/lib/prisma";
import * as reportsService from "@/modules/reports/reports.service";

export async function getBookingsSummaryHandler(req: Request, res: Response) {
  const user = req.user!;
  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    throw new AppError("شما به این بخش دسترسی ندارید", 403);
  }
  const data = await reportsService.getBookingsSummary();
  res.json(data);
}

export async function getDashboardSummaryHandler(req: Request, res: Response) {
  const user = req.user!;
  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    throw new AppError("شما به این بخش دسترسی ندارید", 403);
  }
  const data = await reportsService.getDashboardSummary();
  res.json(data);
}

function parseDateQueryParam(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new AppError("فرمت تاریخ باید YYYY-MM-DD باشد", 400);
  }
  return d;
}

// گزارش مالی سالن — فقط ادمین/مدیر. طبق تصمیم بند ۷.۱، این گزارش هرگز
// نوبت‌های isBarberOwnRevenue=true یا isPrivateCustomer=true رو نشون
// نمی‌ده (این فیلتر داخل reportsService.getSalonRevenueReport اعمال می‌شه).
export async function getSalonRevenueReportHandler(req: Request, res: Response) {
  const user = req.user!;
  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    throw new AppError("شما به این بخش دسترسی ندارید", 403);
  }

  const barberId = typeof req.query.barberId === "string" ? req.query.barberId : undefined;
  const dateFrom = parseDateQueryParam(req.query.dateFrom);
  let dateTo = parseDateQueryParam(req.query.dateTo);
  // dateTo تو گزارش exclusive استفاده می‌شه، پس اگه کاربر یه روز مشخص
  // (نه بازه) رو به‌عنوان "تا" می‌فرسته، باید یک روز جلو بره تا خودِ اون
  // روز هم داخل بازه حساب بشه
  if (dateTo) {
    dateTo = new Date(dateTo);
    dateTo.setUTCDate(dateTo.getUTCDate() + 1);
  }

  const data = await reportsService.getSalonRevenueReport({ barberId, dateFrom, dateTo });
  res.json(data);
}

// گزارش درآمد شخصیِ آرایشگرِ خودمختار — فقط خودِ آرایشگر صاحبِ این
// barberId. قاطعانه و بدون استثنا: نه ادمین، نه مدیر سالن نباید بتونن این
// endpoint رو برای دیدن درآمد شخصی یه آرایشگر دیگه فراخوانی کنن؛ به همین
// خاطر این هندلر barberId رو از پارامتر نمی‌گیره، بلکه از خودِ کاربرِ
// لاگین‌شده استخراج می‌کنه.
export async function getOwnRevenueReportHandler(req: Request, res: Response) {
  const user = req.user!;
  if (user.role !== "BARBER") {
    throw new AppError("این گزارش فقط برای آرایشگر قابل مشاهده است", 403);
  }

  const barberProfile = await prisma.barberProfile.findUnique({
    where: { userId: user.userId },
  });
  if (!barberProfile) {
    throw new AppError("پروفایل آرایشگر پیدا نشد", 404);
  }
  if (!barberProfile.managePricing) {
    // بدون این پرمیشن اصلاً نوبتی با isBarberOwnRevenue=true نداره؛
    // پیام روشن‌تری بده تا سردرگم نشه
    throw new AppError("شما اجازه‌ی قیمت‌گذاری (و در نتیجه گزارش درآمد شخصی) ندارید", 403);
  }

  const data = await reportsService.getBarberOwnRevenueReport(barberProfile.id);
  res.json(data);
}