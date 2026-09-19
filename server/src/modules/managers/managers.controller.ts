import type { Request, Response } from "express";
import {
  createManagerSchema,
  updateManagerSchema,
} from "@/modules/managers/managers.schema";
import * as managersService from "@/modules/managers/managers.service";

export async function listManagersHandler(_req: Request, res: Response) {
  const managers = await managersService.getAllManagers();
  res.json(managers);
}

export async function createManagerHandler(req: Request, res: Response) {
  const input = createManagerSchema.parse(req.body);
  const manager = await managersService.createManager(input);
  res.status(201).json(manager);
}

export async function updateManagerHandler(req: Request, res: Response) {
  const input = updateManagerSchema.parse(req.body);
  const manager = await managersService.updateManager(req.params.id, input);
  res.json(manager);
}

export async function deleteManagerHandler(req: Request, res: Response) {
  await managersService.deleteManager(req.params.id);
  res.status(204).send();
}