import type { Request, Response } from "express";
import * as notificationsService from "@/modules/notifications/notifications.service";

export async function listMyNotificationsHandler(req: Request, res: Response) {
  const data = await notificationsService.listMyNotifications(req.user!.userId);
  res.json(data);
}

export async function markNotificationReadHandler(req: Request, res: Response) {
  await notificationsService.markNotificationRead(req.user!.userId, req.params.id);
  res.json({ ok: true });
}

export async function markAllNotificationsReadHandler(req: Request, res: Response) {
  await notificationsService.markAllNotificationsRead(req.user!.userId);
  res.json({ ok: true });
}