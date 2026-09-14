"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/customer/dashboard", label: "داشبورد" },
  { href: "/customer/bookings", label: "نوبت‌های من" },
  { href: "/customer/history", label: "تاریخچه" },
  { href: "/customer/profile", label: "پروفایل" },
];

export function CustomerNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-card">
      <div className="container flex gap-1 overflow-x-auto py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}