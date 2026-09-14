"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentBarberId } from "@/lib/data/barber-session";
import { BarberNav } from "@/components/barber/barber-nav";

export default function BarberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [barberId, setBarberId] = useState<string | null | undefined>(
    undefined
  );

  useEffect(() => {
    const id = getCurrentBarberId();
    if (!id) {
      router.replace("/login");
      return;
    }
    setBarberId(id);
  }, [router]);

  if (barberId === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-muted-foreground">
          در حال بررسی دسترسی...
        </span>
      </div>
    );
  }
  if (!barberId) return null;

  return (
    <div className="min-h-screen">
      <BarberNav />
      <div className="container py-8">{children}</div>
    </div>
  );
}