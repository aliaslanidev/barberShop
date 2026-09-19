"use client";

import {
  LayoutDashboard,
  Users,
  UserCog,
  Scissors,
  CalendarClock,
  CalendarX,
  CalendarCheck,
  MessageSquare,
  BarChart3,
  Settings,
} from "lucide-react";
import { RoleBottomNav, type RoleNavItem } from "@/components/role-bottom-nav";
import { getCurrentAdmin } from "@/lib/data/admin-session";

// آیتم‌هایی که هم ادمین هم مدیر سالن می‌بینن
const sharedNavItems: RoleNavItem[] = [
  { label: "داشبورد", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "باربرها", href: "/admin/barbers", icon: Users },
  { label: "خدمات و قیمت", href: "/admin/services", icon: Scissors },
  { label: "نوبت‌ها", href: "/admin/bookings", icon: CalendarClock },
  { label: "نظرات", href: "/admin/ratings", icon: MessageSquare },
  { label: "تعطیلات", href: "/admin/holidays", icon: CalendarX },
  { label: "درخواست‌های مرخصی", href: "/admin/leave-requests", icon: CalendarCheck },
  { label: "گزارش‌ها", href: "/admin/reports", icon: BarChart3 },
];

// آیتم‌هایی که فقط ادمین اصلی می‌بینه — دقیقاً هم‌الگوی admin-sidebar.tsx
const adminOnlyNavItems: RoleNavItem[] = [
  { label: "مدیران سالن", href: "/admin/managers", icon: UserCog },
  { label: "تنظیمات", href: "/admin/settings", icon: Settings },
];

export function AdminBottomNav() {
  const admin = getCurrentAdmin();
  const items =
    admin?.role === "admin" ? [...sharedNavItems, ...adminOnlyNavItems] : sharedNavItems;

  return <RoleBottomNav items={items} />;
}