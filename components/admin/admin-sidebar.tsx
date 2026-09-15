"use client";

import {
  LayoutDashboard,
  Users,
  Scissors,
  CalendarClock,
  CalendarX,
  BarChart3,
  Settings,
} from "lucide-react";
import { RoleSidebar, type RoleNavItem } from "@/components/role-sidebar";
import type { AdminInfo } from "@/lib/data/admin-session";

const adminNavItems: RoleNavItem[] = [
  { label: "داشبورد", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "باربرها", href: "/admin/barbers", icon: Users },
  { label: "خدمات و قیمت", href: "/admin/services", icon: Scissors },
  { label: "نوبت‌ها", href: "/admin/bookings", icon: CalendarClock },
  { label: "تعطیلات", href: "/admin/holidays", icon: CalendarX },
  { label: "گزارش‌ها", href: "/admin/reports", icon: BarChart3 },
  { label: "تنظیمات", href: "/admin/settings", icon: Settings },
];

interface AdminSidebarProps {
  admin: AdminInfo;
}

export function AdminSidebar({ admin }: AdminSidebarProps) {
  return (
    <RoleSidebar name={admin.name} role="مدیر سیستم" items={adminNavItems} />
  );
}