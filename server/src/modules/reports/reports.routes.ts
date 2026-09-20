import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import {
  getBookingsSummaryHandler,
  getDashboardSummaryHandler,
} from "@/modules/reports/reports.controller";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

reportsRouter.get("/bookings-summary", asyncHandler(getBookingsSummaryHandler));
reportsRouter.get("/dashboard", asyncHandler(getDashboardSummaryHandler));