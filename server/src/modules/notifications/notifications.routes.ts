import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import {
  listMyNotificationsHandler,
  markNotificationReadHandler,
  markAllNotificationsReadHandler,
  subscribePushHandler,
  unsubscribePushHandler,
} from "@/modules/notifications/notifications.controller";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get("/me", asyncHandler(listMyNotificationsHandler));
notificationsRouter.patch("/:id/read", asyncHandler(markNotificationReadHandler));
notificationsRouter.patch("/read-all", asyncHandler(markAllNotificationsReadHandler));
notificationsRouter.post("/subscribe", asyncHandler(subscribePushHandler));
notificationsRouter.delete("/subscribe", asyncHandler(unsubscribePushHandler));