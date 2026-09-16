import type { Request, Response } from "express";
import * as servicesService from "@/modules/services/services.service";
import { createServiceSchema, updateServiceSchema } from "@/modules/services/services.schema";

export async function listServicesHandler(_req: Request, res: Response) {
  const services = await servicesService.getAllServices();
  res.json(services);
}

export async function getServiceHandler(req: Request, res: Response) {
  const service = await servicesService.getServiceById(req.params.id);
  res.json(service);
}

export async function createServiceHandler(req: Request, res: Response) {
  const input = createServiceSchema.parse(req.body);
  const service = await servicesService.createService(input);
  res.status(201).json(service);
}

export async function updateServiceHandler(req: Request, res: Response) {
  const input = updateServiceSchema.parse(req.body);
  const service = await servicesService.updateService(req.params.id, input);
  res.json(service);
}

export async function deleteServiceHandler(req: Request, res: Response) {
  await servicesService.deleteService(req.params.id);
  res.status(204).send();
}
