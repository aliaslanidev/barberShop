import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import { comparePassword, hashPassword } from "@/utils/password";
import { signToken } from "@/utils/jwt";
import type { LoginInput, RegisterInput } from "@/modules/auth/auth.schema";

function toPublicUser(user: { id: string; name: string; mobile: string; role: string }) {
  return { id: user.id, name: user.name, mobile: user.mobile, role: user.role };
}

// معادل findMockAccount تو mock-accounts.ts
export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { mobile: input.mobile } });
  if (!user) {
    throw new AppError("شماره موبایل یا رمز عبور اشتباه است", 401);
  }

  const isValid = await comparePassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new AppError("شماره موبایل یا رمز عبور اشتباه است", 401);
  }

  // چک وضعیت حساب بعد از تایید رمز (نه قبلش)، تا پیام مسدودی صرفاً به
  // کسی نشون داده بشه که واقعاً رمز درست رو داره
  if (!user.isActive) {
    throw new AppError(user.blockedReason ?? "حساب کاربری شما مسدود شده است", 403);
  }

  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: toPublicUser(user) };
}

// معادل isMobileTaken + addMockAccount؛ ثبت‌نام همیشه با role مشتری انجام می‌شه —
// آرایشگر و ادمین رو فقط ادمین از پنل می‌سازه (createBarber).
export async function register(input: RegisterInput) {
  const exists = await prisma.user.findUnique({ where: { mobile: input.mobile } });
  if (exists) {
    throw new AppError("این شماره موبایل قبلاً ثبت شده است", 409);
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { name: input.name, mobile: input.mobile, passwordHash, role: "CUSTOMER" },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: toPublicUser(user) };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { barberProfile: true },
  });
  if (!user) throw new AppError("کاربر پیدا نشد", 404);
  return user;
}