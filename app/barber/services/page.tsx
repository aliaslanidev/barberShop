"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getAuthToken } from "@/lib/data/mock-session";
import { listBarbers, updateMyServicePriceApi, ApiError, type ApiBarber } from "@/lib/api";
import { formatToman } from "@/lib/utils";

export default function BarberServicesPage() {
  const { user } = useAuth();
  const [barber, setBarber] = useState<ApiBarber | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  async function refresh() {
    try {
      const all = await listBarbers();
      const mine = all.find((b) => b.user.id === user?.id) ?? null;
      setBarber(mine);
      if (mine) {
        setPrices(
          Object.fromEntries(
            mine.services.map((s) => [s.serviceId, String(s.customPrice ?? s.service.priceValue)])
          )
        );
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در دریافت اطلاعات");
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
        <h1 className="text-xl font-bold md:text-2xl">سرویس‌ها و قیمت‌گذاری</h1>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            شما دسترسی مدیریت قیمت را ندارید؛ قیمت خدمات شما توسط سالن تعیین می‌شود.
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleSave(serviceId: string) {
    const token = getAuthToken();
    if (!token) return;
    const raw = prices[serviceId];
    const value = Number(raw);
    if (!raw || Number.isNaN(value) || value <= 0) {
      toast.error("قیمت وارد شده معتبر نیست");
      return;
    }
    setSavingId(serviceId);
    try {
      const updated = await updateMyServicePriceApi(serviceId, value, token);
      setBarber(updated);
      toast.success("قیمت ذخیره شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ذخیره‌ی قیمت");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">سرویس‌ها و قیمت‌گذاری</h1>
      <div className="space-y-4">
        {barber.services.length === 0 ? (
          <p className="text-sm text-muted-foreground">هنوز سرویسی به شما اختصاص داده نشده است.</p>
        ) : (
          barber.services.map(({ serviceId, service, customPrice }) => (
            <div key={serviceId} className="space-y-2">
              <Label htmlFor={serviceId}>{service.title}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id={serviceId}
                  type="number"
                  value={prices[serviceId] ?? ""}
                  onChange={(e) => setPrices((p) => ({ ...p, [serviceId]: e.target.value }))}
                />
                <Button size="sm" disabled={savingId === serviceId} onClick={() => handleSave(serviceId)}>
                  {savingId === serviceId ? "..." : "ذخیره"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {customPrice != null
                  ? `قیمت اختصاصی فعلی: ${formatToman(customPrice)}`
                  : `از قیمت پیش‌فرض سالن استفاده می‌شود: ${formatToman(service.priceValue)}`}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}