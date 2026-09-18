"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { getAuthToken } from "@/lib/data/mock-session";
import {
  listBarbers,
  updateMyWorkingDaysApi,
  ApiError,
  type ApiBarber,
  type ApiWeekday,
} from "@/lib/api";

const WEEK_DAYS: { label: string; value: ApiWeekday }[] = [
  { label: "شنبه", value: "SATURDAY" },
  { label: "یکشنبه", value: "SUNDAY" },
  { label: "دوشنبه", value: "MONDAY" },
  { label: "سه‌شنبه", value: "TUESDAY" },
  { label: "چهارشنبه", value: "WEDNESDAY" },
  { label: "پنجشنبه", value: "THURSDAY" },
  { label: "جمعه", value: "FRIDAY" },
];

function sameDaySet(a: ApiWeekday[], b: ApiWeekday[]) {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((d) => setB.has(d));
}

export default function BarberSchedulePage() {
  const { user } = useAuth();
  const [barber, setBarber] = useState<ApiBarber | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState<ApiWeekday[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  async function refresh() {
    try {
      const all = await listBarbers();
      const mine = all.find((b) => b.user.id === user?.id) ?? null;
      setBarber(mine);
      if (mine) setSelectedDays(mine.workingDays);
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

  if (!barber?.manageSchedule) {
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

  const isDirty = !sameDaySet(selectedDays, barber.workingDays);

  function toggleDay(day: ApiWeekday) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSave() {
    const token = getAuthToken();
    if (!token) return;
    setIsSaving(true);
    try {
      const updated = await updateMyWorkingDaysApi(selectedDays, token);
      setBarber(updated);
      setSelectedDays(updated.workingDays);
      toast.success("زمان‌بندی ذخیره شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ذخیره‌ی زمان‌بندی");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    if (barber) setSelectedDays(barber.workingDays);
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">زمان‌بندی کاری</h1>
      <p className="text-sm text-muted-foreground">
        روزهای کاری خود را انتخاب کنید (ساعت کاری فعلاً ثابت ۹ تا ۲۱ است).
      </p>
      <div className="flex flex-wrap gap-2">
        {WEEK_DAYS.map(({ label, value }) => {
          const isActive = selectedDays.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggleDay(value)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm transition-colors",
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleCancel} disabled={!isDirty}>
          لغو
        </Button>
        <Button onClick={handleSave} disabled={!isDirty || isSaving}>
          {isSaving ? "..." : "ذخیره تغییرات"}
        </Button>
      </div>
    </div>
  );
}