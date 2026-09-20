import { z } from "zod";

// isActive=false یعنی ادمین داره مشتری رو دستی مسدود می‌کنه (reason اختیاریه).
// isActive=true یعنی رفع مسدودیت — چه اون مسدودیت خودکار بوده (بعد از ۳ لغو)
// چه دستی — و شمارنده‌ی لغوهای مشتری (cancelCount) هم صفر می‌شه.
export const updateCustomerStatusSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().optional(),
});
export type UpdateCustomerStatusInput = z.infer<typeof updateCustomerStatusSchema>;