"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Scissors, CalendarPlus, Image as ImageIcon, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "خانه", href: "/", icon: Home },
  { label: "خدمات", href: "/#services", icon: Scissors },
  { label: "رزرو", href: "/booking", icon: CalendarPlus, primary: true },
  { label: "گالری", href: "/#gallery", icon: ImageIcon },
  { label: "تماس", href: "/#contact", icon: Phone },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end">
        {navItems.map((item) => {
          const Icon = item.icon;

          // برای مسیرهای واقعی (نه anchor) وضعیت فعال چک می‌شه
          const isActive = item.href === "/" ? pathname === "/" : !item.href.includes("#") && pathname.startsWith(item.href);

          if ("primary" in item && item.primary) {
            return (
              <Link key={item.href} href={item.href} className="relative flex flex-col items-center">
                <span className="absolute -top-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-9 pb-2 text-[11px] font-medium text-primary">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}