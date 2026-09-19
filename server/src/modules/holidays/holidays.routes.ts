import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth, requireRole } from "@/middleware/auth";
import {
  createHolidayHandler,
  deleteHolidayHandler,
  listHolidaysHandler,
} from "@/modules/holidays/holidays.controller";

export const holidaysRouter = Router();

holidaysRouter.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(listHolidaysHandler)
);
holidaysRouter.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(createHolidayHandler)
);
holidaysRouter.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(deleteHolidayHandler)
);