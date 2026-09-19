import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth, requireRole } from "@/middleware/auth";
import {
  changePasswordHandler,
  getSettingsHandler,
  updateSalonInfoHandler,
  updateWorkingHoursHandler,
} from "@/modules/settings/settings.controller";

export const settingsRouter = Router();

// عمومی: اطلاعات سالن و ساعات کاری
settingsRouter.get("/", asyncHandler(getSettingsHandler));

settingsRouter.patch(
  "/salon",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(updateSalonInfoHandler)
);
settingsRouter.patch(
  "/working-hours/:day",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(updateWorkingHoursHandler)
);
settingsRouter.patch(
  "/password",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(changePasswordHandler)
);