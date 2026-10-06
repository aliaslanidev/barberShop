import {
  CalendarClock,
  CalendarX,
  Clock,
  LayoutDashboard,
  MessageSquare,
  Scissors,
  Users,
  Wallet,
} from "lucide-react";
import type { ApiBarber } from "@/lib/api";
import type { RoleNavItem } from "@/components/role-sidebar";

const baseItems: RoleNavItem[] = [
  { href: "/barber/dashboard", label: "داشبورد", icon: LayoutDashboard },
  { href: "/barber/bookings", label: "نوبت‌ها", icon: CalendarClock },
  { href: "/barber/time-off", label: "مرخصی", icon: CalendarX },
  { href: "/barber/reviews", label: "نظرات من", icon: MessageSquare },
];

export function getBarberNavItems(
  barber: ApiBarber | null | undefined
): RoleNavItem[] {
  if (!barber) return baseItems;

  const managedItems: RoleNavItem[] = [];
  if (barber.viewCustomers) {
    managedItems.push({
      href: "/barber/customers",
      label: "مشتریان من",
      icon: Users,
    });
  }
  if (barber.managePricing || barber.manageServices) {
    managedItems.push({
      href: "/barber/services",
      label: "سرویس و قیمت",
      icon: Scissors,
    });
  }
  if (barber.manageSchedule || barber.blockSlots) {
    managedItems.push({
      href: "/barber/schedule",
      label: "زمان‌بندی",
      icon: Clock,
    });
  }
  if (barber.managePricing) {
    managedItems.push({
      href: "/barber/revenue",
      label: "درآمد من",
      icon: Wallet,
    });
  }

  return [...baseItems, ...managedItems];
}
