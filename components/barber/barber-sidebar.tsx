"use client";

import {
  LayoutDashboard,
  Users,
  Scissors,
  CalendarClock,
  CalendarX,
  Clock,
  Ban,
} from "lucide-react";
import { RoleSidebar, type RoleNavItem } from "@/components/role-sidebar";
import type { ApiBarber } from "@/lib/api";

const baseItems: RoleNavItem[] = [
  { href: "/barber/dashboard", label: "داشبورد", icon: LayoutDashboard },
  { href: "/barber/bookings", label: "نوبت‌ها", icon: CalendarClock },
];

// نگاشت فیلدهای flat بک‌اند به آیتم‌های منو. بعضی آیتم‌ها به بیش از یه
// پرمیشن وابسته‌ن (مثلاً سرویس/قیمت با managePricing یا manageServices)،
// پس به‌جای یه permissionKey ثابت، یه تابع isVisible می‌گیریم.
const managedItems: (RoleNavItem & { isVisible: (barber: ApiBarber) => boolean })[] = [
  {
    href: "/barber/customers",
    label: "مشتریان من",
    icon: Users,
    isVisible: (barber) => barber.viewCustomers,
  },
  {
    href: "/barber/services",
    label: "سرویس و قیمت",
    icon: Scissors,
    isVisible: (barber) => barber.managePricing || barber.manageServices,
  },
  {
    href: "/barber/schedule",
    label: "زمان‌بندی",
    icon: Clock,
    isVisible: (barber) => barber.manageSchedule,
  },
  {
    href: "/barber/time-off",
    label: "مرخصی",
    icon: CalendarX,
    isVisible: (barber) => barber.manageTimeOff,
  },
  {
    href: "/barber/block-slots",
    label: "بلاک کردن اسلات",
    icon: Ban,
    isVisible: (barber) => barber.blockSlots,
  },
];

interface BarberSidebarProps {
  barber: ApiBarber;
}

export function BarberSidebar({ barber }: BarberSidebarProps) {
  const visibleManaged = managedItems.filter((item) => item.isVisible(barber));
  const items: RoleNavItem[] = [...baseItems, ...visibleManaged];

  return <RoleSidebar name={barber.user.name} role="آرایشگر" items={items} />;
}