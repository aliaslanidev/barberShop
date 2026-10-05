import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { getPublicStatsHandler } from "@/modules/stats/stats.controller";

export const statsRouter = Router();

statsRouter.get("/", asyncHandler(getPublicStatsHandler));
