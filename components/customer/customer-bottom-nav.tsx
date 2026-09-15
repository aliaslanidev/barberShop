"use client";

import { LayoutDashboard, CalendarClock, History, UserRound } from "lucide-react";
import { RoleBottomNav, type RoleNavItem } from "@/components/role-bottom-nav";

const customerNavItems: RoleNavItem[] = [
  { label: "داشبورد", href: "/customer/dashboard", icon: LayoutDashboard },
  { label: "نوبت‌های من", href: "/customer/bookings", icon: CalendarClock },
  { label: "تاریخچه", href: "/customer/history", icon: History },
  { label: "پروفایل", href: "/customer/profile", icon: UserRound },
];

export function CustomerBottomNav() {
  return <RoleBottomNav items={customerNavItems} />;
}