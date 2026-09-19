"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCurrentBarberProfile } from "@/lib/hooks/use-current-barber";
import type { ApiBarber } from "@/lib/api";

const baseItems = [
  { href: "/barber/dashboard", label: "داشبورد" },
  { href: "/barber/bookings", label: "نوبت‌های امروز" },
  { href: "/barber/customers", label: "مشتریان من" },
  { href: "/barber/time-off", label: "مرخصی" },
];

const managedItems: { href: string; label: string; permissionKey: keyof ApiBarber }[] = [
  { href: "/barber/services", label: "سرویس و قیمت", permissionKey: "manageServices" },
  { href: "/barber/schedule", label: "زمان‌بندی", permissionKey: "manageSchedule" },
];

export function BarberNav() {
  const pathname = usePathname();
  const barber = useCurrentBarberProfile();

  const visibleManaged = barber
    ? managedItems.filter((item) => barber[item.permissionKey] === true)
    : [];
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
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
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