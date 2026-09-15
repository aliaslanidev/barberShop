"use client";

import { LayoutDashboard, CalendarClock, History, UserRound } from "lucide-react";
import { RoleSidebar, type RoleNavItem } from "@/components/role-sidebar";
import type { CustomerInfo } from "@/lib/data/customer-session";

const customerNavItems: RoleNavItem[] = [
  { label: "داشبورد", href: "/customer/dashboard", icon: LayoutDashboard },
  { label: "نوبت‌های من", href: "/customer/bookings", icon: CalendarClock },
  { label: "تاریخچه", href: "/customer/history", icon: History },
  { label: "پروفایل", href: "/customer/profile", icon: UserRound },
];

interface CustomerSidebarProps {
  customer: CustomerInfo;
}

export function CustomerSidebar({ customer }: CustomerSidebarProps) {
  return (
    <RoleSidebar name={customer.name} role="مشتری" items={customerNavItems} />
  );
}