import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />

      {/* pb-20 تا محتوا زیر نوار پایین ثابت گم نشه */}
      <div className="pb-20">{children}</div>

      <BottomNav />
    </>
  );
}