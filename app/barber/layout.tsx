import { BarberNav } from "@/components/barber/barber-nav";

export default function BarberLayout({ children }: { children: React.ReactNode }) {
  // TODO: وقتی auth واقعی وصل شد، اینجا باید چک بشه کاربر نقش barber داره یا نه
  return (
    <div className="min-h-screen">
      <BarberNav />
      <div className="container py-8">{children}</div>
    </div>
  );
}