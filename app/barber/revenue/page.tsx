"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { getAuthToken } from "@/lib/data/mock-session";
import {
  listBarbers,
  getMyRevenueReportApi,
  ApiError,
  type ApiBarber,
  type ApiBarberOwnRevenueReport,
} from "@/lib/api";

function formatToman(amount: number): string {
  return `${amount.toLocaleString("fa-IR")} تومان`;
}

export default function BarberRevenuePage() {
  const { user } = useAuth();
  const [barber, setBarber] = useState<ApiBarber | null>(null);
  const [report, setReport] = useState<ApiBarberOwnRevenueReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    const token = getAuthToken();
    try {
      const all = await listBarbers();
      const mine = all.find((b) => b.user.id === user?.id) ?? null;
      setBarber(mine);
      if (mine?.managePricing && token) {
        const result = await getMyRevenueReportApi(token);
        setReport(result);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در دریافت گزارش درآمد");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (user) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        در حال دریافت اطلاعات...
      </div>
    );
  }

  if (!barber?.managePricing) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold md:text-2xl">درآمد من</h1>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            شما اجازه‌ی مشاهده‌ی این گزارش را ندارید.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">درآمد من</h1>
      <p className="text-sm text-muted-foreground">
        این گزارش فقط درآمد شخصی خودتان است و هیچ‌کس دیگری (ادمین/مدیر سالن) آن را نمی‌بیند.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-5">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">
              {report ? formatToman(report.totalRevenue) : "—"}
            </span>
            <span className="text-xs text-muted-foreground">مجموع درآمد</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-5">
            <span className="text-lg font-bold">{report?.completedCount ?? 0}</span>
            <span className="text-xs text-muted-foreground">نوبت تکمیل‌شده</span>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">تفکیک بر اساس سرویس</p>
        {!report || report.byService.length === 0 ? (
          <p className="text-sm text-muted-foreground">هنوز درآمدی ثبت نشده است.</p>
        ) : (
          report.byService.map((s) => (
            <div
              key={s.serviceTitle}
              className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2"
            >
              <span className="text-sm">{s.serviceTitle}</span>
              <div className="text-left text-sm">
                <span className="font-medium">{formatToman(s.revenue)}</span>
                <span className="mx-2 text-muted-foreground">·</span>
                <span className="text-muted-foreground">{s.count} نوبت</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}