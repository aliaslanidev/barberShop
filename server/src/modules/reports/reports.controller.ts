import type { Request, Response } from "express";
import { AppError } from "@/utils/AppError";
import * as reportsService from "@/modules/reports/reports.service";

export async function getBookingsSummaryHandler(req: Request, res: Response) {
  const user = req.user!;
  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    throw new AppError("شما به این بخش دسترسی ندارید", 403);
  }
  const data = await reportsService.getBookingsSummary();
  res.json(data);
}

export async function getDashboardSummaryHandler(req: Request, res: Response) {
  const user = req.user!;
  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    throw new AppError("شما به این بخش دسترسی ندارید", 403);
  }
  const data = await reportsService.getDashboardSummary();
  res.json(data);
}