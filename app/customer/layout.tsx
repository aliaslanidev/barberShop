import { CustomerNav } from "@/components/customer/customer-nav";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  // TODO: وقتی auth واقعی وصل شد، اینجا باید چک بشه کاربر لاگینه یا نه
  // و در غیر این صورت به /booking یا یه صفحه‌ی لاگین ریدایرکت بشه.
  return (
    <div className="min-h-screen">
      <CustomerNav />
      <div className="container py-8">{children}</div>
    </div>
  );
}