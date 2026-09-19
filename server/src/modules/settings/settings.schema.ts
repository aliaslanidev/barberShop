import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const weekdaySchema = z.enum([
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
]);

export const updateSalonInfoSchema = z.object({
  name: z.string().trim().min(2, "نام سالن باید حداقل ۲ کاراکتر باشد").max(60).optional(),
  address: z.string().trim().max(200, "آدرس خیلی طولانی است").optional(),
  phone: z.string().trim().max(20, "شماره تماس خیلی طولانی است").optional(),
});

export const updateWorkingHoursSchema = z.object({
  isOpen: z.boolean().optional(),
  openTime: z.string().regex(timeRegex, "فرمت ساعت باید HH:mm باشد").optional(),
  closeTime: z.string().regex(timeRegex, "فرمت ساعت باید HH:mm باشد").optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "رمز عبور فعلی را وارد کنید"),
  newPassword: z.string().min(4, "رمز عبور جدید باید حداقل ۴ کاراکتر باشد"),
});

export type UpdateSalonInfoInput = z.infer<typeof updateSalonInfoSchema>;
export type UpdateWorkingHoursInput = z.infer<typeof updateWorkingHoursSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;