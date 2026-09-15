"use client";

import {
  LayoutDashboard,
  Users,
  Scissors,
  CalendarClock,
  CalendarX,
  Clock,
} from "lucide-react";
import { RoleBottomNav, type RoleNavItem } from "@/components/role-bottom-nav";
import {
  getBarberPermissions,
  type Permission,
} from "@/lib/data/barber-permissions";
import { getCurrentBarberId } from "@/lib/data/barber-session";

const baseItems: RoleNavItem[] = [
  { href: "/barber/dashboard", label: "داشبورد", icon: LayoutDashboard },
  { href: "/barber/bookings", label: "نوبت‌های امروز", icon: CalendarClock },
  { href: "/barber/customers", label: "مشتریان من", icon: Users },
];

const managedItems: (RoleNavItem & { permission: Permission })[] = [
  {
    href: "/barber/services",
    label: "سرویس و قیمت",
    icon: Scissors,
    permission: "manage_services",
  },
  {
    href: "/barber/schedule",
    label: "زمان‌بندی",
    icon: Clock,
    permission: "manage_schedule",
  },
  {
    href: "/barber/time-off",
    label: "مرخصی",
    icon: CalendarX,
    permission: "manage_time_off",
  },
];

export function BarberBottomNav() {
  const currentBarberId = getCurrentBarberId();
  const permissions = currentBarberId
    ? getBarberPermissions(currentBarberId)
    : [];

  const visibleManaged = managedItems.filter((item) =>
    permissions.includes(item.permission)
  );
  const items: RoleNavItem[] = [...baseItems, ...visibleManaged];

  return <RoleBottomNav items={items} />;
}