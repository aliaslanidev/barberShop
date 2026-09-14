import { Card, CardContent } from "@/components/ui/card";
import { Users, Scissors, CalendarClock, TrendingUp } from "lucide-react";

// TODO: این مقادیر باید از API واقعی (بوکینگ‌ها، باربرها، درآمد و...) خونده بشن.
const stats = [
  { label: "نوبت‌های امروز", value: "۱۲", icon: CalendarClock },
  { label: "باربرهای فعال", value: "۶", icon: Users },
  { label: "خدمات فعال", value: "۱۸", icon: Scissors },
  { label: "درآمد این ماه", value: "۴۲,۵۰۰,۰۰۰ ت", icon: TrendingUp },
] as const;

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">داشبورد مدیریت</h1>
        <p className="text-sm text-muted-foreground">
          نمای کلی وضعیت سالن
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 text-sm font-bold">دسترسی سریع</h2>
          <p className="text-sm text-muted-foreground">
            از منوی بالا برای مدیریت باربرها، خدمات، نوبت‌ها، تعطیلات و
            تنظیمات سالن استفاده کنید. بخش‌های کاربران/نقش‌ها/پرمیشن‌ها و
            گزارش‌های تفصیلی در مراحل بعدی اضافه می‌شوند.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}