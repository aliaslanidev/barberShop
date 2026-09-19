"use client";

import {
  LayoutDashboard,
  Users,
  Scissors,
  CalendarClock,
  CalendarX,
  Clock,
  MessageSquare,
} from "lucide-react";
import { RoleBottomNav, type RoleNavItem } from "@/components/role-bottom-nav";
import { useCurrentBarberProfile } from "@/lib/hooks/use-current-barber";
import type { ApiBarber } from "@/lib/api";

const baseItems: RoleNavItem[] = [
  { href: "/barber/dashboard", label: "داشبورد", icon: LayoutDashboard },
  { href: "/barber/bookings", label: "نوبت‌های امروز", icon: CalendarClock },
  { href: "/barber/time-off", label: "مرخصی", icon: CalendarX },
  { href: "/barber/reviews", label: "نظرات من", icon: MessageSquare },
  { href: "/barber/customers", label: "مشتریان من", icon: Users },
];

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
];

export function BarberBottomNav() {
  const barber = useCurrentBarberProfile();

  const visibleManaged = barber
    ? managedItems.filter((item) => barber[item.permissionKey] === true)
    : [];
  const items: RoleNavItem[] = [...baseItems, ...visibleManaged];

  return <RoleBottomNav items={items} />;
}