import type { ApiBarberPermissions } from "@/lib/api";

// این نوع دیگه از mock نمی‌خونه — دقیقاً همون فیلدهای camelCase ایه که
// بک‌اند واقعی برمی‌گردونه (ApiBarberPermissions در lib/api.ts).
export type OptionalPermission = keyof ApiBarberPermissions;

export type Permission =
  | "view_own_dashboard"
  | "view_own_bookings"
  | "view_own_customers"
  | "view_own_history"
  | "start_service"
  | "end_service"
  | "view_service_history"
  | OptionalPermission;

// این‌ها بخشی از نقش «آرایشگر» هستن و به همه‌ی آرایشگرها به‌صورت خودکار
// تعلق می‌گیرن؛ اختیاری نیستن و ادمین نیازی به فعال‌سازی جداگانه‌شون نداره.
const BASE_PERMISSIONS: Permission[] = [
  "view_own_dashboard",
  "view_own_bookings",
  "view_own_customers",
  "view_own_history",
  "start_service",
  "end_service",
  "view_service_history",
];

// تغییر مهم نسبت به نسخه‌ی قبلی: دیگه barberId نمی‌گیره و از یه mock
// درون‌حافظه‌ای نمی‌خونه — مستقیماً همون آبجکت پرمیشن‌های واقعیِ آرایشگر
// (که از ApiBarber سرور میاد، مثلاً از useCurrentBarber یا هر جایی که
// getBarberApi/listBarbers صداش می‌زنه) رو می‌گیره. اگه جایی از این تابع
// قبلاً با یه barberId string صدا زده می‌شد، باید اول ApiBarber مربوطه رو
// (از طریق lib/api.ts) بگیره و همون آبجکت رو پاس بده.
export function getBarberPermissions(
  barber: ApiBarberPermissions | null | undefined
): Permission[] {
  if (!barber) return [];

  const grantedOptional = (
    Object.entries(barber) as [OptionalPermission, boolean][]
  )
    .filter(([, isGranted]) => isGranted)
    .map(([permission]) => permission as Permission);

  return [...BASE_PERMISSIONS, ...grantedOptional];
}

export function barberHasPermission(
  barber: ApiBarberPermissions | null | undefined,
  permission: Permission
) {
  return getBarberPermissions(barber).includes(permission);
}