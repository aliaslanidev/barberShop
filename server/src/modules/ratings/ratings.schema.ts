import { z } from "zod";

export const createRatingSchema = z.object({
  bookingId: z.string().min(1, "نوبت مشخص نشده"),
  score: z
    .number({ invalid_type_error: "امتیاز باید عدد باشد" })
    .int("امتیاز باید عدد صحیح باشد")
    .min(1, "امتیاز حداقل ۱ است")
    .max(5, "امتیاز حداکثر ۵ است"),
  comment: z.string().trim().max(300, "نظر حداکثر ۳۰۰ کاراکتر می‌تونه باشه").optional(),
});
export type CreateRatingInput = z.infer<typeof createRatingSchema>;

// ادمین/مدیر: لیست نظرها با فیلتر اختیاری آرایشگر و وضعیت (صفحه‌ی تایید نظرها)
export const listRatingsQuerySchema = z.object({
  barberId: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});
export type ListRatingsQuery = z.infer<typeof listRatingsQuerySchema>;

// ادمین/مدیر: تایید یا رد نمایش عمومیِ متن یه نظر
export const updateRatingStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});
export type UpdateRatingStatusInput = z.infer<typeof updateRatingStatusSchema>;