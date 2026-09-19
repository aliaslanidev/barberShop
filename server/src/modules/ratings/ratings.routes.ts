import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import {
  createRatingHandler,
  myRatingsHandler,
  barberRatingsHandler,
} from "@/modules/ratings/ratings.controller";

export const ratingsRouter = Router();

// همه‌ی endpointهای امتیاز نیاز به لاگین دارن. (معدل و تعداد آرا عمومیه و
// از طریق GET /barbers میاد؛ متن نظرها فقط برای خودِ آرایشگر و ادمینه.)
ratingsRouter.use(requireAuth);

ratingsRouter.post("/", asyncHandler(createRatingHandler));
ratingsRouter.get("/me", asyncHandler(myRatingsHandler));
ratingsRouter.get("/", asyncHandler(barberRatingsHandler));