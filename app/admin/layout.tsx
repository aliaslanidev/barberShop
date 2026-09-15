"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentAdmin, type AdminInfo } from "@/lib/data/admin-session";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminInfo | null | undefined>(undefined);

  useEffect(() => {
    const current = getCurrentAdmin();
    if (!current) {
      router.replace("/login");
      return;
    }
    setAdmin(current);
  }, [router]);

  if (admin === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-muted-foreground">
          در حال بررسی دسترسی...
        </span>
      </div>
    );
  }
  if (!admin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="container flex h-14 items-center justify-between">
          <span className="text-sm font-bold text-primary">پنل ادمین</span>
          <span className="text-sm text-muted-foreground">{admin.name}</span>
        </div>
      </header>

      <div className="flex">
        <AdminSidebar />
        <main className="min-w-0 flex-1 pb-20 md:pb-6">
          <div className="container py-6">{children}</div>
        </main>
      </div>

      <AdminBottomNav />
    </div>
  );
}