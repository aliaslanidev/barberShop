"use client";

import { RoleSidebar } from "@/components/role-sidebar";
import { getBarberNavItems } from "@/components/barber/barber-nav-items";
import type { ApiBarber } from "@/lib/api";

interface BarberSidebarProps {
  barber: ApiBarber;
}

export function BarberSidebar({ barber }: BarberSidebarProps) {
  return (
    <RoleSidebar
      name={barber.user.name}
      role="آرایشگر"
      items={getBarberNavItems(barber)}
    />
  );
}