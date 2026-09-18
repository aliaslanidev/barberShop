import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth, requireRole } from "@/middleware/auth";
import {
  createOwnBlockedSlotHandler,
  deleteOwnBlockedSlotHandler,
  listOwnBlockedSlotsHandler,
} from "@/modules/blocked-slots/blocked-slots.controller";

export const blockedSlotsRouter = Router();

blockedSlotsRouter.get(
  "/me",
  requireAuth,
  requireRole("BARBER"),
  asyncHandler(listOwnBlockedSlotsHandler)
);
blockedSlotsRouter.post(
  "/me",
  requireAuth,
  requireRole("BARBER"),
  asyncHandler(createOwnBlockedSlotHandler)
);
blockedSlotsRouter.delete(
  "/me/:id",
  requireAuth,
  requireRole("BARBER"),
  asyncHandler(deleteOwnBlockedSlotHandler)
);