import type { Request, Response } from "express";
import * as notificationsService from "@/modules/notifications/notifications.service";
import {
  subscribePushSchema,
  unsubscribePushSchema,
} from "@/modules/notifications/notifications.schema";

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

export async function subscribePushHandler(req: Request, res: Response) {
  const input = subscribePushSchema.parse(req.body);
  await notificationsService.subscribeToPush(req.user!.userId, input);
  res.status(201).json({ ok: true });
}

export async function unsubscribePushHandler(req: Request, res: Response) {
  const { endpoint } = unsubscribePushSchema.parse(req.body);
  await notificationsService.unsubscribeFromPush(req.user!.userId, endpoint);
  res.json({ ok: true });
}