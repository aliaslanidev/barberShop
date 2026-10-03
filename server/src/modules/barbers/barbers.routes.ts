import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth, requireRole } from "@/middleware/auth";
import {
  createBarberHandler,
  deleteBarberHandler,
  getBarberHandler,
  getFutureBookingsHandler,
  listBarbersHandler,
  updateAccountStatusHandler,
  updateBarberHandler,
  updateOwnServiceActiveHandler,
  updateOwnServicePriceHandler,
  updateOwnWorkingDaysHandler,
  updatePermissionsHandler,
} from "@/modules/barbers/barbers.controller";

export const barbersRouter = Router();

barbersRouter.get("/", asyncHandler(listBarbersHandler));
barbersRouter.get("/:id", asyncHandler(getBarberHandler));

barbersRouter.patch(
  "/me/services/:serviceId/price",
  requireAuth,
  requireRole("BARBER"),
  asyncHandler(updateOwnServicePriceHandler)
);

barbersRouter.patch(
  "/me/services/:serviceId/active",
  requireAuth,
  requireRole("BARBER"),
  asyncHandler(updateOwnServiceActiveHandler)
);

barbersRouter.patch(
  "/me/working-days",
  requireAuth,
  requireRole("BARBER"),
  asyncHandler(updateOwnWorkingDaysHandler)
);

barbersRouter.post("/", requireAuth, requireRole("ADMIN"), asyncHandler(createBarberHandler));
barbersRouter.patch("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(updateBarberHandler));
barbersRouter.patch(
  "/:id/permissions",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(updatePermissionsHandler)
);
barbersRouter.delete("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(deleteBarberHandler));

// غیرفعال‌سازی کامل حساب آرایشگر (فاز تکمیلی ۱.۲) — فقط ادمین اصلی،
// هم‌راستا با بقیه‌ی عملیات حساس این ماژول
barbersRouter.get(
  "/:id/future-bookings",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(getFutureBookingsHandler)
);
barbersRouter.patch(
  "/:id/account-status",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(updateAccountStatusHandler)
);