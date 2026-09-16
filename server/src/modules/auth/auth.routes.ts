import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import { loginHandler, meHandler, registerHandler } from "@/modules/auth/auth.controller";

export const authRouter = Router();

authRouter.post("/login", asyncHandler(loginHandler));
authRouter.post("/register", asyncHandler(registerHandler));
authRouter.get("/me", requireAuth, asyncHandler(meHandler));
