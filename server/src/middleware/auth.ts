import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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
//
// علاوه بر اعتبار توکن، وضعیت isActive کاربر رو هم زنده از دیتابیس چک
// می‌کنه (نه فقط موقع لاگین) — چون این میدلور رو همه‌ی روت‌های نیازمند
// لاگین صدا می‌زنن، همینجا جلوی هر درخواستی از یه حساب مسدود (مشتری،
// آرایشگر یا مدیر) گرفته می‌شه، نه فقط جلوی ورود اولیه. عمداً async/await
// با throw مستقیم استفاده نشده چون این تابع بدون asyncHandler صدا زده
// می‌شه؛ به‌جاش خطاها با next(err) پاس داده می‌شن.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new AppError("لطفاً وارد حساب کاربری‌تان شوید", 401));
    return;
  }

  const token = header.slice("Bearer ".length);
  let payload: { userId: string; role: Role };
  try {
    payload = verifyToken(token);
  } catch {
    next(new AppError("نشست شما منقضی شده، دوباره وارد شوید", 401));
    return;
  }

  prisma.user
    .findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isActive: true, blockedReason: true },
    })
    .then((user) => {
      if (!user) {
        next(new AppError("نشست شما منقضی شده، دوباره وارد شوید", 401));
        return;
      }
      if (!user.isActive) {
        next(new AppError(user.blockedReason ?? "حساب کاربری شما مسدود شده است", 403));
        return;
      }
      req.user = { userId: user.id, role: user.role };
      next();
    })
    .catch(next);
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