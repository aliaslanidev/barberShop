"use client";

import {
  LayoutDashboard,
  Users,
  Scissors,
  CalendarClock,
  CalendarX,
  Clock,
} from "lucide-react";
import { RoleSidebar, type RoleNavItem } from "@/components/role-sidebar";
import {
  getBarberPermissions,
  type Permission,
} from "@/lib/data/barber-permissions";
import type { Barber } from "@/lib/data/barbers";

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

interface BarberSidebarProps {
  barber: Barber;
}

export function BarberSidebar({ barber }: BarberSidebarProps) {
  const permissions = getBarberPermissions(barber.id);
  const visibleManaged = managedItems.filter((item) =>
    permissions.includes(item.permission)
  );
  const items: RoleNavItem[] = [...baseItems, ...visibleManaged];

  return <RoleSidebar name={barber.name} role="آرایشگر" items={items} />;
}