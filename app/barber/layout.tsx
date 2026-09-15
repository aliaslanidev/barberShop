"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scissors } from "lucide-react";
import { getCurrentBarberId } from "@/lib/data/barber-session";
import { getBarberById, type Barber } from "@/lib/data/barbers";
import { clearMockSession } from "@/lib/data/mock-session";
import { BarberSidebar } from "@/components/barber/barber-sidebar";
import { BarberBottomNav } from "@/components/barber/barber-bottom-nav";
import { UserMenu } from "@/components/user-menu";

export default function BarberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [barber, setBarber] = useState<Barber | null | undefined>(undefined);

  useEffect(() => {
    const id = getCurrentBarberId();
    if (!id) {
      router.replace("/login");
      return;
    }

    const info = getBarberById(id);
    if (!info) {
      router.replace("/login");
      return;
    }

    setBarber(info);
  }, [router]);

  if (barber === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-muted-foreground">
          در حال بررسی دسترسی...
        </span>
      </div>
    );
  }
  if (!barber) return null;

  const handleLogout = () => {
    clearMockSession();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#020b0a]/90 text-white backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6">
          {/* لوگو */}
          <Link href="/barber/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center text-emerald-400">
              <Scissors size={27} strokeWidth={1.8} />
            </div>

            <span className="text-lg font-bold tracking-tight">
              سالن <span className="text-emerald-400">آرایش</span>
            </span>
          </Link>

          <UserMenu name={barber.name} role="آرایشگر" onLogout={handleLogout} />
        </div>
      </header>

      <div className="flex">
        <BarberSidebar barber={barber} />
        <main className="min-w-0 flex-1 pb-20 md:pb-6">
          <div className="container py-6">{children}</div>
        </main>
      </div>

      <BarberBottomNav />
    </div>
  );
}