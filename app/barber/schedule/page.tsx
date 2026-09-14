"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { barberHasPermission } from "@/lib/data/barber-permissions";
import { CURRENT_BARBER_ID } from "@/lib/data/barber-session";

const weekDays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

export default function BarberSchedulePage() {
  const canManage = barberHasPermission(CURRENT_BARBER_ID, "manage_schedule");
  const [activeDays, setActiveDays] = useState<string[]>([
    "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه",
  ]);

  if (!canManage) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold md:text-2xl">زمان‌بندی کاری</h1>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            زمان‌بندی شما توسط سالن تعیین می‌شود.
          </CardContent>
        </Card>
      </div>
    );
  }

  function toggleDay(day: string) {
    setActiveDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function handleSave() {
    // TODO: اتصال به API واقعی وقتی بک‌اند آماده شد
    toast.success("زمان‌بندی ذخیره شد");
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">زمان‌بندی کاری</h1>
      <p className="text-sm text-muted-foreground">
        روزهای کاری خود را انتخاب کنید (ساعت کاری فعلاً ثابت ۹ تا ۲۱ است).
      </p>
      <div className="flex flex-wrap gap-2">
        {weekDays.map((day) => {
          const isActive = activeDays.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm transition-colors",
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
      <Button onClick={handleSave}>ذخیره تغییرات</Button>
    </div>
  );
}