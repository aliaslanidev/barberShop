import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth, requireRole } from "@/middleware/auth";
import {
  createBarberHandler,
  deleteBarberHandler,
  getBarberHandler,
  listBarbersHandler,
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