import type { Request, Response } from "express";
import * as settingsService from "@/modules/settings/settings.service";
import {
  changePasswordSchema,
  updateSalonInfoSchema,
  updateWorkingHoursSchema,
  weekdaySchema,
} from "@/modules/settings/settings.schema";

export async function getSettingsHandler(_req: Request, res: Response) {
  const settings = await settingsService.getSettings();
  res.json(settings);
}

export async function updateSalonInfoHandler(req: Request, res: Response) {
  const input = updateSalonInfoSchema.parse(req.body);
  const salon = await settingsService.updateSalonInfo(input);
  res.json(salon);
}

export async function updateWorkingHoursHandler(req: Request, res: Response) {
  const day = weekdaySchema.parse(req.params.day);
  const input = updateWorkingHoursSchema.parse(req.body);
  const hours = await settingsService.updateWorkingHours(day, input);
  res.json(hours);
}

export async function changePasswordHandler(req: Request, res: Response) {
  const input = changePasswordSchema.parse(req.body);
  await settingsService.changeOwnPassword(req.user!.userId, input);
  res.status(204).send();
}