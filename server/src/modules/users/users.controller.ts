import type { Request, Response } from "express";
import * as usersService from "@/modules/users/users.service";
import {
  listCustomersQuerySchema,
  updateCustomerStatusSchema,
} from "@/modules/users/users.schema";

export async function listCustomersHandler(req: Request, res: Response) {
  const query = listCustomersQuerySchema.parse(req.query);
  const result = await usersService.listCustomers(query);
  res.json(result);
}

export async function updateCustomerStatusHandler(req: Request, res: Response) {
  const input = updateCustomerStatusSchema.parse(req.body);
  const customer = await usersService.updateCustomerStatus(req.params.id, input);
  res.json(customer);
}