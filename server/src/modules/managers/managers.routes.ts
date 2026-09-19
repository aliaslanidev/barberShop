import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth, requireRole } from "@/middleware/auth";
import {
  createManagerHandler,
  deleteManagerHandler,
  listManagersHandler,
  updateManagerHandler,
} from "@/modules/managers/managers.controller";

export const managersRouter = Router();

// همه‌ی عملیات این ماژول فقط برای ADMIN است — طبق تصمیم پروژه، مدیر سالن
// (MANAGER) حق ساخت/ویرایش/حذف هیچ مدیر سالن دیگه‌ای رو نداره؛ فقط ادمین
// اصلی این کار رو می‌کنه (دقیقاً مثل ساخت آرایشگر).
managersRouter.use(requireAuth, requireRole("ADMIN"));

managersRouter.get("/", asyncHandler(listManagersHandler));
managersRouter.post("/", asyncHandler(createManagerHandler));
managersRouter.patch("/:id", asyncHandler(updateManagerHandler));
managersRouter.delete("/:id", asyncHandler(deleteManagerHandler));