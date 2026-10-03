import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import type {
  ListCustomersQuery,
  UpdateCustomerStatusInput,
} from "@/modules/users/users.schema";

// ارقام فارسی/عربی و ی/ک عربی رو برای جستجو یکدست می‌کنه
function normalizeSearch(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک");
}

function buildOrderBy(
  sortBy: ListCustomersQuery["sortBy"],
  sortDir: ListCustomersQuery["sortDir"]
): Prisma.UserOrderByWithRelationInput[] {
  const primary: Prisma.UserOrderByWithRelationInput =
    sortBy === "name"
      ? { name: sortDir }
      : sortBy === "cancelCount"
        ? { cancelCount: sortDir }
        : { createdAt: sortDir };
  // id برای ثابت‌بودن ترتیب بین صفحه‌ها
  return [primary, { id: "asc" }];
}

// مشتری‌ای که *همه‌ی* نوبت‌هاش isPrivateCustomer=true دارن (یعنی فقط با
// آرایشگرِ دارای پرمیشن «مشتری اختصاصی» نوبت گرفته) جزو «مشتری سالن»
// محسوب نمی‌شه و باید از این لیست حذف بشه (بند ۷.۱). مشتری‌ای که هیچ
// نوبتی نداره، یا حداقل یک نوبتِ غیرخصوصی داره، همچنان تو لیست می‌مونه —
// طبق Edge Case حل‌شده: تکراری‌بودنِ مشتری بین لیست عمومی و لیست خصوصیِ
// آرایشگر عمدیه، نه چیزی که اینجا باید حذفش کنیم.
const salonCustomerFilter: Prisma.UserWhereInput = {
  OR: [
    { bookings: { none: {} } },
    { bookings: { some: { isPrivateCustomer: false } } },
  ],
};

// لیست مشتری‌ها برای پنل ادمین — همراه وضعیت فعال/مسدود و تعداد
// لغوهای خودشون (cancelCount)، تا ادمین بدونه چرا کسی مسدود شده.
export async function listCustomers(query: ListCustomersQuery) {
  const search = query.search ? normalizeSearch(query.search) : "";

  const baseWhere: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    AND: [salonCustomerFilter],
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { mobile: { contains: search } },
          ],
        }
      : {}),
  };

  // شمارنده‌ی تب‌ها با جستجو هماهنگه ولی به فیلتر وضعیت وابسته نیست
  const [allCount, activeCount] = await Promise.all([
    prisma.user.count({ where: baseWhere }),
    prisma.user.count({ where: { ...baseWhere, isActive: true } }),
  ]);
  const blockedCount = allCount - activeCount;

  const total =
    query.status === "ACTIVE" ? activeCount : query.status === "BLOCKED" ? blockedCount : allCount;

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, totalPages);

  const filteredWhere: Prisma.UserWhereInput = {
    ...baseWhere,
    ...(query.status === "ACTIVE"
      ? { isActive: true }
      : query.status === "BLOCKED"
        ? { isActive: false }
        : {}),
  };

  const items = await prisma.user.findMany({
    where: filteredWhere,
    orderBy: buildOrderBy(query.sortBy, query.sortDir),
    skip: (page - 1) * query.pageSize,
    take: query.pageSize,
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

  return {
    items,
    total,
    page,
    pageSize: query.pageSize,
    totalPages,
    counts: { all: allCount, active: activeCount, blocked: blockedCount },
  };
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