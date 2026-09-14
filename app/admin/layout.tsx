import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/data/admin-session";
import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = getCurrentAdmin();

  // اگر کاربر فعلی ادمین نباشد، اجازه‌ی دسترسی به هیچ صفحه‌ی /admin را ندارد.
  // این چک باید در آینده روی سشن/توکن واقعی انجام شود، نه فقط این مقدار موقت.
  if (!admin || admin.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-14 items-center justify-between">
          <span className="text-sm font-bold text-primary">پنل ادمین</span>
          <span className="text-sm text-muted-foreground">{admin.name}</span>
        </div>
      </header>

      <AdminNav />

      <div className="container py-6">{children}</div>
    </div>
  );
}