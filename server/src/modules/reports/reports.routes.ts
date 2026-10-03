import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";
import {
  getBookingsSummaryHandler,
  getDashboardSummaryHandler,
  getSalonRevenueReportHandler,
  getOwnRevenueReportHandler,
} from "@/modules/reports/reports.controller";

const router = Router();

router.get("/bookings-summary", requireAuth, asyncHandler(getBookingsSummaryHandler));
router.get("/dashboard", requireAuth, asyncHandler(getDashboardSummaryHandler));

// گزارش مالی سالن (ادمین/مدیر) — فیلتر اختیاری با query: barberId, dateFrom, dateTo
router.get("/revenue", requireAuth, asyncHandler(getSalonRevenueReportHandler));

// گزارش درآمد شخصیِ خودِ آرایشگر (فقط BARBER با پرمیشن managePricing)
router.get("/revenue/mine", requireAuth, asyncHandler(getOwnRevenueReportHandler));

export const reportsRouter = router;