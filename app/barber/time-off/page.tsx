"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import type { DateObject } from "react-multi-date-picker";
import { barberHasPermission } from "@/lib/data/barber-permissions";
import { CURRENT_BARBER_ID } from "@/lib/data/barber-session";

interface TimeOffEntry {
  id: string;
  dateDisplay: string;
}

export default function BarberTimeOffPage() {
  const canManage = barberHasPermission(CURRENT_BARBER_ID, "manage_time_off");
  const [date, setDate] = useState<DateObject | null>(null);
  const [entries, setEntries] = useState<TimeOffEntry[]>([]);

  if (!canManage) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold md:text-2xl">مرخصی</h1>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            شما دسترسی مدیریت مرخصی را ندارید.
          </CardContent>
        </Card>
      </div>
    );
  }

  function addTimeOff() {
    if (!date) return;
    // TODO: اتصال به API واقعی وقتی بک‌اند آماده شد؛ باید چک کنه نوبت تاییدشده‌ای تو اون تاریخ نباشه
    // (طبق قانون اسکوپ: نوبت تاییدشده نباید بی‌سروصدا حذف بشه)
    setEntries((prev) => [...prev, { id: crypto.randomUUID(), dateDisplay: date.format("YYYY/MM/DD") }]);
    setDate(null);
    toast.success("مرخصی ثبت شد");
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">مرخصی</h1>

      <div className="space-y-3">
        <Label>ثبت روز مرخصی جدید</Label>
        <JalaliDatePicker value={date} onChange={setDate} placeholder="انتخاب تاریخ" />
        <Button onClick={addTimeOff} disabled={!date}>
          افزودن
        </Button>

        {entries.length > 0 && (
          <div className="space-y-2 pt-2">
            {entries.map((e) => (
              <div key={e.id} className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
                {e.dateDisplay}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}