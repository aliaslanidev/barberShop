"use client";

import {
  LayoutDashboard,
  Users,
  Scissors,
  CalendarClock,
  CalendarX,
  CalendarCheck,
  MessageSquare,
  BarChart3,
  Settings,
} from "lucide-react";
import { RoleBottomNav, type RoleNavItem } from "@/components/role-bottom-nav";

const adminNavItems: RoleNavItem[] = [
  { label: "داشبورد", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "باربرها", href: "/admin/barbers", icon: Users },
  { label: "خدمات و قیمت", href: "/admin/services", icon: Scissors },
  { label: "نوبت‌ها", href: "/admin/bookings", icon: CalendarClock },
  { label: "نظرات", href: "/admin/ratings", icon: MessageSquare },
  { label: "تعطیلات", href: "/admin/holidays", icon: CalendarX },
  { label: "درخواست‌های مرخصی", href: "/admin/leave-requests", icon: CalendarCheck },
  { label: "گزارش‌ها", href: "/admin/reports", icon: BarChart3 },
  { label: "تنظیمات", href: "/admin/settings", icon: Settings },
];

export function AdminBottomNav() {
  return <RoleBottomNav items={adminNavItems} />;
}