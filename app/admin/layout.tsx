"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scissors } from "lucide-react";
import { getCurrentAdmin, type AdminInfo } from "@/lib/data/admin-session";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav";
import { UserMenu } from "@/components/user-menu";

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

  // ⚠️ فعلاً خروج فقط کلید مخصوص سشن ادمین رو از localStorage پاک می‌کنه.
  // اگه lib/data/admin-session.ts کلید متفاوتی استفاده می‌کنه یا خروج باید
  // یه API call بزنه، این تابع رو با منطق واقعی (یا تابع logoutAdmin خودت) عوض کن.
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin-session");
    }
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#020b0a]/90 text-white backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6">
          {/* لوگو */}
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center text-emerald-400">
              <Scissors size={27} strokeWidth={1.8} />
            </div>

            <span className="text-lg font-bold tracking-tight">
              سالن <span className="text-emerald-400">آرایش</span>
            </span>
          </Link>

          <UserMenu name={admin.name} onLogout={handleLogout} />
        </div>
      </header>

      <div className="flex">
        <AdminSidebar admin={admin} />
        <main className="min-w-0 flex-1 pb-20 md:pb-6">
          <div className="container py-6">{children}</div>
        </main>
      </div>

      <AdminBottomNav />
    </div>
  );
}