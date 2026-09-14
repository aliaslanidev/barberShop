import { getBarberById, type BarberType } from "@/lib/data/barbers";

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
  | "end_service";

// طبق سند اسکوپ (بخش ۳۴): این‌ها پیش‌فرض‌های هر نوع بربر هستن.
// در نسخه‌ی واقعی، ادمین باید بتونه این‌ها رو per-barber سفارشی کنه.
const permissionsByType: Record<BarberType, Permission[]> = {
  professional: [
    "view_own_dashboard",
    "view_own_bookings",
    "view_own_customers",
    "view_own_history",
    "manage_services",
    "manage_pricing",
    "manage_schedule",
    "manage_time_off",
    "block_slots",
    "start_service",
    "end_service",
  ],
  regular: [
    "view_own_dashboard",
    "view_own_bookings",
    "view_own_customers",
    "view_own_history",
    "start_service",
    "end_service",
  ],
};

export function getBarberPermissions(barberId: string): Permission[] {
  const barber = getBarberById(barberId);
  if (!barber) return [];
  return permissionsByType[barber.barberType];
}

export function barberHasPermission(barberId: string, permission: Permission) {
  return getBarberPermissions(barberId).includes(permission);
}