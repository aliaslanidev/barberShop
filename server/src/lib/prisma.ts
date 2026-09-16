import { PrismaClient } from "@prisma/client";

// در dev، هر بار reload شدن فایل نباید کانکشن جدید به دیتابیس باز کنه؛
// برای همین یک نمونه‌ی سراسری روی globalThis نگه می‌داریم.
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
