"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { services as allServices } from "@/lib/data/services";
import { getServicesByBarber } from "@/lib/data/barbers";
import { barberHasPermission } from "@/lib/data/barber-permissions";
import { CURRENT_BARBER_ID } from "@/lib/data/barber-session";
import { formatToman } from "@/lib/utils";

export default function BarberServicesPage() {
  const canManage = barberHasPermission(CURRENT_BARBER_ID, "manage_services");
  const myServiceIds = getServicesByBarber(CURRENT_BARBER_ID);
  const myServices = allServices.filter((s) => myServiceIds.includes(s.id));

  const [prices, setPrices] = useState<Record<string, number>>(
    Object.fromEntries(myServices.map((s) => [s.id, s.priceValue]))
  );

  if (!canManage) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold md:text-2xl">سرویس‌ها و قیمت‌گذاری</h1>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            شما دسترسی مدیریت سرویس و قیمت را ندارید؛ این تنظیمات توسط سالن مدیریت می‌شود.
            {/* TODO: این چک باید سمت سرور هم تکرار بشه؛ مخفی‌کردن UI به‌تنهایی امنیت محسوب نمی‌شه */}
          </CardContent>
        </Card>
      </div>
    );
  }

  function handleSave() {
    // TODO: اتصال به API واقعی وقتی بک‌اند آماده شد
    toast.success("قیمت‌ها ذخیره شد");
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">سرویس‌ها و قیمت‌گذاری</h1>
      <div className="space-y-4">
        {myServices.map((s) => (
          <div key={s.id} className="space-y-2">
            <Label htmlFor={s.id}>{s.title}</Label>
            <Input
              id={s.id}
              type="number"
              value={prices[s.id]}
              onChange={(e) => setPrices((p) => ({ ...p, [s.id]: Number(e.target.value) }))}
            />
            <p className="text-xs text-muted-foreground">فعلی: {formatToman(prices[s.id])}</p>
          </div>
        ))}
      </div>
      <Button onClick={handleSave}>ذخیره تغییرات</Button>
    </div>
  );
}