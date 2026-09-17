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
import type { ApiBarber } from "@/lib/api";

const baseItems: RoleNavItem[] = [
  { href: "/barber/dashboard", label: "داشبورد", icon: LayoutDashboard },
  { href: "/barber/bookings", label: "نوبت‌های امروز", icon: CalendarClock },
  { href: "/barber/customers", label: "مشتریان من", icon: Users },
];

// نگاشت مستقیم فیلدهای flat بک‌اند به آیتم‌های منو — دیگه نیازی به
// lib/data/barber-permissions.ts (که فرمت nested قدیمی رو داشت) نیست
const managedItems: (RoleNavItem & { permissionKey: keyof ApiBarber })[] = [
  {
    href: "/barber/services",
    label: "سرویس و قیمت",
    icon: Scissors,
    permissionKey: "manageServices",
  },
  {
    href: "/barber/schedule",
    label: "زمان‌بندی",
    icon: Clock,
    permissionKey: "manageSchedule",
  },
  {
    href: "/barber/time-off",
    label: "مرخصی",
    icon: CalendarX,
    permissionKey: "manageTimeOff",
  },
];

interface BarberSidebarProps {
  barber: ApiBarber;
}

export function BarberSidebar({ barber }: BarberSidebarProps) {
  const visibleManaged = managedItems.filter((item) => barber[item.permissionKey] === true);
  const items: RoleNavItem[] = [...baseItems, ...visibleManaged];

  return <RoleSidebar name={barber.user.name} role="آرایشگر" items={items} />;
}