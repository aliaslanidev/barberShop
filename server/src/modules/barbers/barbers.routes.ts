import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth, requireRole } from "@/middleware/auth";
import {
  createBarberHandler,
  deleteBarberHandler,
  getBarberHandler,
  listBarbersHandler,
  updateBarberHandler,
  updatePermissionsHandler,
} from "@/modules/barbers/barbers.controller";

export const barbersRouter = Router();

// لیست/جزئیات آرایشگرها برای صفحه‌ی بوکینگ عمومی هم لازمه، پس نیازی به login نیست
barbersRouter.get("/", asyncHandler(listBarbersHandler));
barbersRouter.get("/:id", asyncHandler(getBarberHandler));

barbersRouter.post("/", requireAuth, requireRole("ADMIN"), asyncHandler(createBarberHandler));
barbersRouter.patch("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(updateBarberHandler));
barbersRouter.patch(
  "/:id/permissions",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(updatePermissionsHandler)
);
barbersRouter.delete("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(deleteBarberHandler));
