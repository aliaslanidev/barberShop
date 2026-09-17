import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import {
  availabilityHandler,
  availabilityRangeHandler,
  createBookingHandler,
  listBookingsHandler,
  getBookingHandler,
  updateBookingStatusHandler,
  myCustomersHandler,
} from "@/modules/bookings/bookings.controller";

export const bookingsRouter = Router();

// عمومی — صفحه‌ی بوکینگ قبل از لاگین این رو صدا می‌زنه (مرحله‌ی تاریخ/ساعت)
bookingsRouter.get("/availability", asyncHandler(availabilityHandler));
bookingsRouter.get("/availability-range", asyncHandler(availabilityRangeHandler));

// از اینجا به بعد نیاز به لاگین
bookingsRouter.use(requireAuth);

bookingsRouter.get("/", asyncHandler(listBookingsHandler));
bookingsRouter.get("/my-customers", asyncHandler(myCustomersHandler));
bookingsRouter.get("/:id", asyncHandler(getBookingHandler));
bookingsRouter.post("/", asyncHandler(createBookingHandler));
bookingsRouter.patch("/:id/status", asyncHandler(updateBookingStatusHandler));