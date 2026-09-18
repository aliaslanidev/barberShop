import { z } from "zod";

export const createBlockedSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "فرمت تاریخ باید YYYY-MM-DD باشد"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "فرمت ساعت باید HH:mm باشد"),
});

export const listBlockedSlotsQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateBlockedSlotInput = z.infer<typeof createBlockedSlotSchema>;
export type ListBlockedSlotsQuery = z.infer<typeof listBlockedSlotsQuerySchema>;