import type { Request, Response } from "express";
import * as usersService from "@/modules/users/users.service";
import { updateCustomerStatusSchema } from "@/modules/users/users.schema";

export async function listCustomersHandler(_req: Request, res: Response) {
  const customers = await usersService.listCustomers();
  res.json(customers);
}

export async function updateCustomerStatusHandler(req: Request, res: Response) {
  const input = updateCustomerStatusSchema.parse(req.body);
  const customer = await usersService.updateCustomerStatus(req.params.id, input);
  res.json(customer);
}