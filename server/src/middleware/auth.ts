import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { verifyToken } from "@/utils/jwt";
import { AppError } from "@/utils/AppError";

// این تایپ رو به Request اضافه می‌کنیم تا req.user تو کل پروژه تایپ‌شده باشه
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { userId: string; role: Role };
    }
  }
}

// این میدلور معادل getMockSession() تو فرانته، با این فرق که به‌جای
// خوندن از localStorage، توکن JWT رو از هدر Authorization می‌خونه.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError("لطفاً وارد حساب کاربری‌تان شوید", 401);
  }

  const token = header.slice("Bearer ".length);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    throw new AppError("نشست شما منقضی شده، دوباره وارد شوید", 401);
  }
}

// معادل چک role !== "admin" تو getCurrentAdmin/getCurrentBarber و ...
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError("شما به این بخش دسترسی ندارید", 403);
    }
    next();
  };
}
