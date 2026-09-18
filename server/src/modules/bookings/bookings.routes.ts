import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import {
  availabilityHandler,
  availabilityRangeHandler,
  createHoldHandler,
  extendHoldHandler,
  releaseHoldHandler,
  createBookingHandler,
  listBookingsHandler,
  getBookingHandler,
  updateBookingStatusHandler,
  myCustomersHandler,
} from "@/modules/bookings/bookings.controller";

export const bookingsRouter = Router();

// عمومی — صفحه‌ی بوکینگ قبل از لاگین این‌ها رو صدا می‌زنه: چک availability
// و ساخت/تمدید/آزادسازی هولدِ موقت اسلات، چون هنوز مشتری لاگین نکرده
// (لاگین/ثبت‌نام تازه تو مرحله‌ی auth اتفاق می‌افته، بعد از انتخاب ساعت)
bookingsRouter.get("/availability", asyncHandler(availabilityHandler));
bookingsRouter.get("/availability-range", asyncHandler(availabilityRangeHandler));
bookingsRouter.post("/hold", asyncHandler(createHoldHandler));
bookingsRouter.patch("/hold/:id/extend", asyncHandler(extendHoldHandler));
bookingsRouter.delete("/hold/:id", asyncHandler(releaseHoldHandler));

// از اینجا به بعد نیاز به لاگین
bookingsRouter.use(requireAuth);

bookingsRouter.get("/", asyncHandler(listBookingsHandler));
bookingsRouter.get("/my-customers", asyncHandler(myCustomersHandler));
bookingsRouter.get("/:id", asyncHandler(getBookingHandler));
bookingsRouter.post("/", asyncHandler(createBookingHandler));
bookingsRouter.patch("/:id/status", asyncHandler(updateBookingStatusHandler));