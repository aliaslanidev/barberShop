import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import {
  createRatingHandler,
  myRatingsHandler,
  listRatingsHandler,
  updateRatingStatusHandler,
  publicBarberReviewsHandler,
} from "@/modules/ratings/ratings.controller";

export const ratingsRouter = Router();

// عمومی، بدون نیاز به لاگین (برای مودال «مشاهده بیشتر» قبل از ورود مشتری) —
// باید قبل از ratingsRouter.use(requireAuth) رجیستر بشه
ratingsRouter.get("/public/:barberId", asyncHandler(publicBarberReviewsHandler));

// از اینجا به بعد، همه‌ی endpointها نیاز به لاگین دارن.
ratingsRouter.use(requireAuth);

ratingsRouter.post("/", asyncHandler(createRatingHandler));
ratingsRouter.get("/me", asyncHandler(myRatingsHandler));
ratingsRouter.get("/", asyncHandler(listRatingsHandler));
ratingsRouter.patch("/:id/status", asyncHandler(updateRatingStatusHandler));