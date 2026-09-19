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
import { RoleSidebar, type RoleNavItem } from "@/components/role-sidebar";
import type { AdminInfo } from "@/lib/data/admin-session";

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

// آیتم‌هایی که فقط ادمین اصلی می‌بینه — مدیر سالن حق ساخت مدیر دیگه یا
// تغییر تنظیمات کلی سالن رو نداره (تصمیم پروژه)
const adminOnlyNavItems: RoleNavItem[] = [
  { label: "مدیران سالن", href: "/admin/managers", icon: UserCog },
  { label: "تنظیمات", href: "/admin/settings", icon: Settings },
];

const ROLE_LABELS: Record<AdminInfo["role"], string> = {
  admin: "مدیر سیستم",
  manager: "مدیر سالن",
};

interface AdminSidebarProps {
  admin: AdminInfo;
}

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const items =
    admin.role === "admin" ? [...sharedNavItems, ...adminOnlyNavItems] : sharedNavItems;

  return <RoleSidebar name={admin.name} role={ROLE_LABELS[admin.role]} items={items} />;
}