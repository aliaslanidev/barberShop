import { getBarberById } from "@/lib/data/barbers";

export type Permission =
  | "view_own_dashboard"
  | "view_own_bookings"
  | "view_own_customers"
  | "view_own_history"
  | "manage_services"
  | "manage_pricing"
  | "manage_schedule"
  | "manage_time_off"
  | "block_slots"
  | "cancel_own_bookings"
  | "start_service"
  | "end_service"
  | "view_service_history";

// این‌ها بخشی از نقش «آرایشگر» هستن و به همه‌ی آرایشگرها به‌صورت خودکار تعلق می‌گیرن؛
// اختیاری نیستن و ادمین نیازی به فعال‌سازی جداگانه‌شون نداره.
const BASE_PERMISSIONS: Permission[] = [
  "view_own_dashboard",
  "view_own_bookings",
  "view_own_customers",
  "view_own_history",
  "start_service",
  "end_service",
  "view_service_history",
];

// پرمیشن‌های اختیاری/قابل‌واگذاری — این‌ها مستقیماً از روی آرایه‌ی
// permissions هر آرایشگر (که ادمین تک‌به‌تک تنظیم می‌کنه) خونده می‌شن.
// هیچ مفهوم «نوع آرایشگر» بین ادمین و این پرمیشن‌ها واسطه نیست.
export function getBarberPermissions(barberId: string): Permission[] {
  const barber = getBarberById(barberId);
  if (!barber) return [];

  const grantedOptional = (
    Object.entries(barber.permissions) as [Permission, boolean][]
  )
    .filter(([, isGranted]) => isGranted)
    .map(([permission]) => permission);

  return [...BASE_PERMISSIONS, ...grantedOptional];
}

export function barberHasPermission(barberId: string, permission: Permission) {
  return getBarberPermissions(barberId).includes(permission);
}