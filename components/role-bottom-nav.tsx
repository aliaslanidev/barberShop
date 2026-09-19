"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface RoleNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface RoleBottomNavProps {
  items: RoleNavItem[];
  // چند آیتم اول تو نوار پایین دیده بشه؛ بقیه می‌رن زیر «بیشتر». پیش‌فرض ۴.
  maxVisible?: number;
}

export function RoleBottomNav({ items, maxVisible = 4 }: RoleBottomNavProps) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // با هر تغییر مسیر (مثلاً کلیک روی یه آیتمِ زیر «بیشتر»)، پنل رو ببند
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  // اگه فقط یه آیتم اضافه‌تر از maxVisible باشه، خودِ همون آیتم رو نشون بده
  // به‌جای اینکه پشت یه دکمه‌ی «بیشتر» با فقط یه گزینه پنهانش کنیم
  const needsMore = items.length > maxVisible + 1;
  const visibleItems = needsMore ? items.slice(0, maxVisible) : items;
  const overflowItems = needsMore ? items.slice(maxVisible) : [];
  const isOverflowActive = overflowItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setIsMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      {isMoreOpen && (
        <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 mx-3 rounded-2xl border border-border bg-card p-2 shadow-lg md:hidden">
          <div className="grid grid-cols-4 gap-1">
            {overflowItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-[11px] font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-center leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex gap-1 px-2 py-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          {needsMore && (
            <button
              type="button"
              onClick={() => setIsMoreOpen((prev) => !prev)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors",
                isMoreOpen || isOverflowActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {isMoreOpen ? <X className="h-5 w-5" /> : <MoreHorizontal className="h-5 w-5" />}
              بیشتر
            </button>
          )}
        </div>
      </nav>
    </>
  );
}