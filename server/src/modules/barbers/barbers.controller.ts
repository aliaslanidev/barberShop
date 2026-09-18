import type { Request, Response } from "express";
import * as barbersService from "@/modules/barbers/barbers.service";
import {
  createBarberSchema,
  updateBarberSchema,
  updatePermissionsSchema,
  updateServicePriceSchema,
  updateServiceActiveSchema,
  updateWorkingDaysSchema,
} from "@/modules/barbers/barbers.schema";

export async function listBarbersHandler(_req: Request, res: Response) {
  res.json(await barbersService.getAllBarbers());
}

export async function getBarberHandler(req: Request, res: Response) {
  res.json(await barbersService.getBarberById(req.params.id));
}

export async function createBarberHandler(req: Request, res: Response) {
  const input = createBarberSchema.parse(req.body);
  res.status(201).json(await barbersService.createBarber(input));
}

export async function updateBarberHandler(req: Request, res: Response) {
  const input = updateBarberSchema.parse(req.body);
  res.json(await barbersService.updateBarber(req.params.id, input));
}

export async function updatePermissionsHandler(req: Request, res: Response) {
  const input = updatePermissionsSchema.parse(req.body);
  res.json(await barbersService.updateBarberPermissions(req.params.id, input));
}

export async function deleteBarberHandler(req: Request, res: Response) {
  await barbersService.deleteBarber(req.params.id);
  res.status(204).send();
}

export async function updateOwnServicePriceHandler(req: Request, res: Response) {
  const input = updateServicePriceSchema.parse(req.body);
  const barber = await barbersService.updateOwnServicePrice(
    req.user!.userId,
    req.params.serviceId,
    input.customPrice
  );
  res.json(barber);
}

export async function updateOwnServiceActiveHandler(req: Request, res: Response) {
  const input = updateServiceActiveSchema.parse(req.body);
  const barber = await barbersService.updateOwnServiceActive(
    req.user!.userId,
    req.params.serviceId,
    input.isActive
  );
  res.json(barber);
}

export async function updateOwnWorkingDaysHandler(req: Request, res: Response) {
  const input = updateWorkingDaysSchema.parse(req.body);
  const barber = await barbersService.updateOwnWorkingDays(req.user!.userId, input.workingDays);
  res.json(barber);
}