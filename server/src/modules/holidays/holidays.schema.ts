import { z } from "zod";

export const createHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "فرمت تاریخ باید YYYY-MM-DD باشد"),
  reason: z.string().trim().max(100, "دلیل نباید بیشتر از ۱۰۰ کاراکتر باشد").optional(),
});

export const listHolidaysQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
export type ListHolidaysQuery = z.infer<typeof listHolidaysQuerySchema>;