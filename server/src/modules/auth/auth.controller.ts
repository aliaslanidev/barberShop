import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "@/modules/auth/auth.schema";
import * as authService from "@/modules/auth/auth.service";

export async function loginHandler(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  res.json(result);
}

export async function registerHandler(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);
  res.status(201).json(result);
}

export async function meHandler(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.user!.userId);
  res.json({
    id: user.id,
    name: user.name,
    mobile: user.mobile,
    role: user.role,
    barberProfile: user.barberProfile ?? undefined,
  });
}
