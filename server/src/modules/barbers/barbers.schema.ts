import { z } from "zod";

export const createBarberSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ حرف باشد"),
  mobile: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
  password: z.string().min(4, "رمز عبور باید حداقل ۴ کاراکتر باشد"),
  bio: z.string().optional(),
  serviceIds: z.array(z.string()).optional(),
});

export const updateBarberSchema = z.object({
  name: z.string().min(2).optional(),
  mobile: z.string().regex(/^09\d{9}$/).optional(),
  bio: z.string().optional(),
  isActive: z.boolean().optional(),
  serviceIds: z.array(z.string()).optional(),
});

// معادل BarberPermissions تو barbers.ts
export const updatePermissionsSchema = z.object({
  manageServices: z.boolean().optional(),
  managePricing: z.boolean().optional(),
  manageSchedule: z.boolean().optional(),
  manageTimeOff: z.boolean().optional(),
  blockSlots: z.boolean().optional(),
  cancelOwnBookings: z.boolean().optional(),
});

export type CreateBarberInput = z.infer<typeof createBarberSchema>;
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>;
export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;
