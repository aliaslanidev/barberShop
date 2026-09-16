import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth, requireRole } from "@/middleware/auth";
import {
  createServiceHandler,
  deleteServiceHandler,
  getServiceHandler,
  listServicesHandler,
  updateServiceHandler,
} from "@/modules/services/services.controller";

export const servicesRouter = Router();

// لیست خدمات باید برای همه (حتی مهمان‌ها تو صفحه‌ی بوکینگ) در دسترس باشه
servicesRouter.get("/", asyncHandler(listServicesHandler));
servicesRouter.get("/:id", asyncHandler(getServiceHandler));

// مدیریت خدمات فقط برای ادمین — چون permission «manage_services» آرایشگر
// طبق طراحی فعلی تو صفحه‌ی خودِ آرایشگر مدیریت می‌شه (فاز بعدی)
servicesRouter.post("/", requireAuth, requireRole("ADMIN"), asyncHandler(createServiceHandler));
servicesRouter.patch("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(updateServiceHandler));
servicesRouter.delete("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(deleteServiceHandler));
