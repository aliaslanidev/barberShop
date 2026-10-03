import { z } from "zod";

// مدیر سالن برخلاف آرایشگر، پروفایل جدا (BarberProfile) نداره؛ فقط یه
// User ساده با role=MANAGER هست. اسکیمای ساده‌تری داره (بدون bio/serviceIds/permissions).
export const createManagerSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ حرف باشد"),
  mobile: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
  password: z.string().min(4, "رمز عبور باید حداقل ۴ کاراکتر باشد"),
});

export const updateManagerSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ حرف باشد").optional(),
  mobile: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست").optional(),
  // رمز جدید اختیاریه؛ اگه فرستاده نشه رمز قبلی دست‌نخورده می‌مونه
  password: z.string().min(4, "رمز عبور باید حداقل ۴ کاراکتر باشد").optional(),
});

// غیرفعال‌سازی کامل حساب (فاز تکمیلی ۱.۲). مدیر سالن نوبت نداره، پس
// برخلاف آرایشگر نیازی به چک نوبت‌های آینده/مودال نیست — فقط
// فعال/غیرفعال ساده، دقیقاً هم‌الگوی مشتری.
export const updateManagerStatusSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().optional(),
});

export type CreateManagerInput = z.infer<typeof createManagerSchema>;
export type UpdateManagerInput = z.infer<typeof updateManagerSchema>;
export type UpdateManagerStatusInput = z.infer<typeof updateManagerStatusSchema>;