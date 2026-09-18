import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth, requireRole } from "@/middleware/auth";
import {
  approveLeaveRequestHandler,
  cancelOwnLeaveRequestHandler,
  createOwnTimeOffHandler,
  deleteOwnTimeOffHandler,
  listLeaveRequestsHandler,
  listOwnTimeOffHandler,
  rejectLeaveRequestHandler,
} from "@/modules/time-off/time-off.controller";

export const timeOffRouter = Router();

timeOffRouter.get("/me", requireAuth, requireRole("BARBER"), asyncHandler(listOwnTimeOffHandler));
timeOffRouter.post("/me", requireAuth, requireRole("BARBER"), asyncHandler(createOwnTimeOffHandler));
timeOffRouter.delete(
  "/me/:id",
  requireAuth,
  requireRole("BARBER"),
  asyncHandler(deleteOwnTimeOffHandler)
);
timeOffRouter.delete(
  "/me/requests/:id",
  requireAuth,
  requireRole("BARBER"),
  asyncHandler(cancelOwnLeaveRequestHandler)
);

timeOffRouter.get(
  "/requests",
  requireAuth,
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(listLeaveRequestsHandler)
);
timeOffRouter.patch(
  "/requests/:id/approve",
  requireAuth,
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(approveLeaveRequestHandler)
);
timeOffRouter.patch(
  "/requests/:id/reject",
  requireAuth,
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(rejectLeaveRequestHandler)
);