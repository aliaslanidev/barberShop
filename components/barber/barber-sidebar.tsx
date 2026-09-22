"use client";

import {
  LayoutDashboard,
  Users,
  Scissors,
  CalendarClock,
  CalendarX,
  Clock,
  Ban,
  MessageSquare,
  Wallet,
} from "lucide-react";
import { RoleSidebar, type RoleNavItem } from "@/components/role-sidebar";
import type { ApiBarber } from "@/lib/api";

// مرخصی برای همه‌ی آرایشگرها نمایان است: با پرمیشن مستقیم ثبت می‌شود،
// بدون پرمیشن به‌صورت درخواست برای تایید ادمین.
const baseItems: RoleNavItem[] = [
  { href: "/barber/dashboard", label: "داشبورد", icon: LayoutDashboard },
  { href: "/barber/bookings", label: "نوبت‌ها", icon: CalendarClock },
  { href: "/barber/time-off", label: "مرخصی", icon: CalendarX },
  { href: "/barber/reviews", label: "نظرات من", icon: MessageSquare },
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
    href: "/barber/block-slots",
    label: "بلاک کردن اسلات",
    icon: Ban,
    isVisible: (barber) => barber.blockSlots,
  },
  {
    // فقط آرایشگرِ خودمختار (managePricing) گزارش درآمد شخصی داره — طبق
    // تصمیم بند ۷.۱، این گزارش هیچ‌جای دیگه‌ای (نه ادمین، نه مدیر) دیده نمی‌شه
    href: "/barber/revenue",
    label: "درآمد من",
    icon: Wallet,
    isVisible: (barber) => barber.managePricing,
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