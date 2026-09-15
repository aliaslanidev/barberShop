"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  getBarberPermissions,
  type Permission,
} from "@/lib/data/barber-permissions";
import { getCurrentBarberId } from "@/lib/data/barber-session";

const baseItems = [
  { href: "/barber/dashboard", label: "داشبورد" },
  { href: "/barber/bookings", label: "نوبت‌های امروز" },
  { href: "/barber/customers", label: "مشتریان من" },
];

const managedItems: {
  href: string;
  label: string;
  permission: Permission;
}[] = [
  {
    href: "/barber/services",
    label: "سرویس و قیمت",
    permission: "manage_services",
  },
  {
    href: "/barber/schedule",
    label: "زمان‌بندی",
    permission: "manage_schedule",
  },
  {
    href: "/barber/time-off",
    label: "مرخصی",
    permission: "manage_time_off",
  },
];

export function BarberNav() {
  const pathname = usePathname();

  const currentBarberId = getCurrentBarberId();

  const permissions = currentBarberId
    ? getBarberPermissions(currentBarberId)
    : [];

  const visibleManaged = managedItems.filter((item) =>
    permissions.includes(item.permission)
  );

  const items = [...baseItems, ...visibleManaged];

  return (
    <nav className="border-b border-border bg-card">
      <div className="container flex gap-1 overflow-x-auto py-3">
        {items.map((item) => {
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