"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Scissors,
  CalendarClock,
  CalendarX,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AdminInfo } from "@/lib/data/admin-session";

const adminNavItems = [
  { label: "داشبورد", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "باربرها", href: "/admin/barbers", icon: Users },
  { label: "خدمات و قیمت", href: "/admin/services", icon: Scissors },
  { label: "نوبت‌ها", href: "/admin/bookings", icon: CalendarClock },
  { label: "تعطیلات", href: "/admin/holidays", icon: CalendarX },
  { label: "گزارش‌ها", href: "/admin/reports", icon: BarChart3 },
  { label: "تنظیمات", href: "/admin/settings", icon: Settings },
] as const;

interface AdminSidebarProps {
  admin: AdminInfo;
}

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname();
  const initial = admin.name?.trim()?.charAt(0) || "?";

  return (
    <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-56 shrink-0 border-l border-border bg-card md:flex md:flex-col">
      {/* پروفایل ادمین */}
      <div className="flex flex-col items-center gap-3 border-b border-border px-4 py-6">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-primary text-lg font-bold text-[#02100d]">
            {initial}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col items-center text-center">
          <span className="text-sm font-medium text-foreground">
            {admin.name}
          </span>
          <span className="text-xs text-muted-foreground">مدیر سیستم</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 overflow-y-auto p-3">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}