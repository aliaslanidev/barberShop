"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getAllBarbers,
  updateBarberPermissions,
  updateBarber,
  deleteBarber,
  type Barber,
  type BarberPermissions,
} from "@/lib/data/barbers";

const PERMISSION_ITEMS: { key: keyof BarberPermissions; label: string }[] = [
  { key: "manage_services", label: "مدیریت خدمات" },
  { key: "manage_pricing", label: "مدیریت قیمت‌گذاری" },
  { key: "manage_schedule", label: "مدیریت زمان‌بندی" },
  { key: "manage_time_off", label: "ثبت مرخصی" },
  { key: "block_slots", label: "بلاک کردن اسلات" },
  { key: "cancel_own_bookings", label: "کنسل نوبت‌های خودش" },
];

export default function AdminBarbersPage() {
  // منبع داده فعلاً in-memory است (lib/data/barbers.ts)؛ با فراخوانی دوباره‌ی
  // getAllBarbers بعد از هر تغییر، UI رو با state سینک نگه می‌داریم.
  const [barbers, setBarbers] = useState<Barber[]>(() => getAllBarbers());

  function refresh() {
    setBarbers([...getAllBarbers()]);
  }

  function togglePermission(barber: Barber, key: keyof BarberPermissions) {
    updateBarberPermissions(barber.id, { [key]: !barber.permissions[key] });
    refresh();
    toast.success(
      `پرمیشن «${PERMISSION_ITEMS.find((p) => p.key === key)?.label}» برای ${barber.name} ${
        !barber.permissions[key] ? "فعال" : "غیرفعال"
      } شد`
    );
  }

  function toggleActive(barber: Barber) {
    updateBarber(barber.id, { isActive: !barber.isActive });
    refresh();
    toast.success(barber.isActive ? `${barber.name} غیرفعال شد` : `${barber.name} فعال شد`);
  }

  function handleDelete(barber: Barber) {
    // TODO: قبل از حذف واقعی، باید چک بشه که نوبت آینده‌ی فعالی به این آرایشگر وصل نیست.
    deleteBarber(barber.id);
    refresh();
    toast.success(`${barber.name} حذف شد`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold md:text-2xl">مدیریت آرایشگرها</h1>
        <p className="text-sm text-muted-foreground">
          هر آرایشگر یک نقش سیستمی واحد (Barber) دارد؛ پرمیشن‌های اختیاری هرکدام
          به‌صورت مستقل و تک‌به‌تک توسط شما تعیین می‌شود.
        </p>
      </div>

      <div className="space-y-4">
        {barbers.map((barber) => (
          <Card key={barber.id} className={cn(!barber.isActive && "opacity-60")}>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{barber.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        barber.isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {barber.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </div>
                  {barber.mobile && (
                    <p className="text-xs text-muted-foreground">{barber.mobile}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(barber)}
                  >
                    {barber.isActive ? "غیرفعال کردن" : "فعال کردن"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(barber)}
                  >
                    حذف
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  پرمیشن‌های اختیاری
                </p>
                <div className="flex flex-wrap gap-2">
                  {PERMISSION_ITEMS.map((item) => {
                    const isGranted = barber.permissions[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => togglePermission(barber, item.key)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          isGranted
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-transparent text-muted-foreground hover:bg-accent"
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}