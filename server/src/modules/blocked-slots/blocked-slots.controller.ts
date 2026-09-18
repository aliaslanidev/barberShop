import type { Request, Response } from "express";
import * as blockedSlotsService from "@/modules/blocked-slots/blocked-slots.service";
import {
  createBlockedSlotSchema,
  listBlockedSlotsQuerySchema,
} from "@/modules/blocked-slots/blocked-slots.schema";

export async function listOwnBlockedSlotsHandler(req: Request, res: Response) {
  const query = listBlockedSlotsQuerySchema.parse(req.query);
  const slots = await blockedSlotsService.listOwnBlockedSlots(req.user!.userId, query);
  res.json(slots);
}

export async function createOwnBlockedSlotHandler(req: Request, res: Response) {
  const input = createBlockedSlotSchema.parse(req.body);
  const slot = await blockedSlotsService.createOwnBlockedSlot(req.user!.userId, input);
  res.status(201).json(slot);
}

export async function deleteOwnBlockedSlotHandler(req: Request, res: Response) {
  await blockedSlotsService.deleteOwnBlockedSlot(req.user!.userId, req.params.id);
  res.status(204).send();
}