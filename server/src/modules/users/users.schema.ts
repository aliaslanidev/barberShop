import { z } from "zod";

// isActive=false یعنی ادمین داره مشتری رو دستی مسدود می‌کنه (reason اختیاریه).
// isActive=true یعنی رفع مسدودیت — چه اون مسدودیت خودکار بوده (بعد از ۳ لغو)
// چه دستی — و شمارنده‌ی لغوهای مشتری (cancelCount) هم صفر می‌شه.
export const updateCustomerStatusSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().optional(),
});
export type UpdateCustomerStatusInput = z.infer<typeof updateCustomerStatusSchema>;

// لیست مشتری‌ها: جستجو، فیلتر وضعیت، مرتب‌سازی و صفحه‌بندی سمت سرور
export const listCustomersQuerySchema = z.object({
  search: z.string().trim().max(50).optional(),
  status: z.enum(["ALL", "ACTIVE", "BLOCKED"]).default("ALL"),
  sortBy: z.enum(["createdAt", "name", "cancelCount"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;