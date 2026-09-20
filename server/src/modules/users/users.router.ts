import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth, requireRole } from "@/middleware/auth";
import {
  listCustomersHandler,
  updateCustomerStatusHandler,
} from "@/modules/users/users.controller";

export const usersRouter = Router();

usersRouter.use(requireAuth);

// مشاهده‌ی لیست مشتری‌ها: ادمین و مدیر سالن هر دو می‌تونن ببینن
usersRouter.get("/customers", requireRole("ADMIN", "MANAGER"), asyncHandler(listCustomersHandler));

// مسدود/رفع‌مسدود کردن: فقط ادمین اصلی (هم‌راستا با تصمیم پروژه برای
// پرمیشن‌های حساس در بخش آرایشگرها)
usersRouter.patch(
  "/customers/:id/status",
  requireRole("ADMIN"),
  asyncHandler(updateCustomerStatusHandler)
);