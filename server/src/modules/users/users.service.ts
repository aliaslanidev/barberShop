import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import type { UpdateCustomerStatusInput } from "@/modules/users/users.schema";

// لیست همه‌ی مشتری‌ها برای پنل ادمین — همراه وضعیت فعال/مسدود و تعداد
// لغوهای خودشون (cancelCount)، تا ادمین بدونه چرا کسی مسدود شده.
export async function listCustomers() {
  return prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      mobile: true,
      isActive: true,
      cancelCount: true,
      blockedReason: true,
      blockedAt: true,
      createdAt: true,
    },
  });
}

export async function updateCustomerStatus(customerId: string, input: UpdateCustomerStatusInput) {
  const customer = await prisma.user.findUnique({ where: { id: customerId } });
  if (!customer || customer.role !== "CUSTOMER") {
    throw new AppError("مشتری پیدا نشد", 404);
  }

  if (input.isActive) {
    // رفع مسدودیت (خودکار یا دستی) — شمارنده‌ی لغو هم صفر می‌شه تا مشتری
    // از صفر شروع کنه، نه اینکه با یه لغوی دیگه بلافاصله دوباره Block بشه
    return prisma.user.update({
      where: { id: customerId },
      data: {
        isActive: true,
        cancelCount: 0,
        blockedReason: null,
        blockedAt: null,
      },
    });
  }

  return prisma.user.update({
    where: { id: customerId },
    data: {
      isActive: false,
      blockedReason: input.reason ?? "توسط مدیریت غیرفعال شد",
      blockedAt: new Date(),
    },
  });
}