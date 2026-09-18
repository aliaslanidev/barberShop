import { z } from "zod";

export const createTimeOffSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "فرمت تاریخ باید YYYY-MM-DD باشد"),
  reason: z.string().optional(),
});

export const leaveRequestStatusQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

export type CreateTimeOffInput = z.infer<typeof createTimeOffSchema>;
export type LeaveRequestStatusQuery = z.infer<typeof leaveRequestStatusQuerySchema>;