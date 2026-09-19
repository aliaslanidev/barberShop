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

// فقط برای ادمین/مدیر: دیدن نظرهای یه آرایشگر خاص
export const listBarberRatingsQuerySchema = z.object({
  barberId: z.string().min(1, "آرایشگر مشخص نشده"),
});
export type ListBarberRatingsQuery = z.infer<typeof listBarberRatingsQuerySchema>;