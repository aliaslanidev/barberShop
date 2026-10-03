"use client";

import { RoleBottomNav, type RoleNavItem } from "@/components/role-bottom-nav";
import { getBarberNavItems } from "@/components/barber/barber-nav-items";
import { useCurrentBarberProfile } from "@/lib/hooks/use-current-barber";

export function BarberBottomNav() {
  const barber = useCurrentBarberProfile();
  const items: RoleNavItem[] = getBarberNavItems(barber);
  return <RoleBottomNav items={items} />;
}