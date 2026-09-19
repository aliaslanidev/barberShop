import type { Request, Response } from "express";
import * as holidaysService from "@/modules/holidays/holidays.service";
import {
  createHolidaySchema,
  listHolidaysQuerySchema,
} from "@/modules/holidays/holidays.schema";

export async function listHolidaysHandler(req: Request, res: Response) {
  const query = listHolidaysQuerySchema.parse(req.query);
  const holidays = await holidaysService.listHolidays(query);
  res.json(holidays);
}

export async function createHolidayHandler(req: Request, res: Response) {
  const input = createHolidaySchema.parse(req.body);
  const holiday = await holidaysService.createHoliday(input);
  res.status(201).json(holiday);
}

export async function deleteHolidayHandler(req: Request, res: Response) {
  await holidaysService.deleteHoliday(req.params.id);
  res.status(204).send();
}