"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { getAuthToken } from "@/lib/data/mock-session";
import { BlockedSlotsManager } from "@/components/barber/blocked-slots-manager";
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

  useEffect(() => {
    if (barber && window.location.hash === "#blocked-slots") {
      document.getElementById("blocked-slots")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [barber]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        در حال دریافت اطلاعات...
      </div>
    );
  }

  if (!barber?.manageSchedule && !barber?.blockSlots) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold md:text-2xl">زمان‌بندی کاری</h1>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            شما اجازه‌ی مدیریت زمان‌بندی یا بستن ساعت‌های خاص را ندارید.
          </CardContent>
        </Card>
      </div>
    );
  }

  const isDirty = barber.manageSchedule && !sameDaySet(selectedDays, barber.workingDays);

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
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-xl font-bold md:text-2xl">زمان‌بندی کاری</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          روزهای کاری، ساعت‌های ویژه و محدودیت‌های پذیرش نوبت را مدیریت کنید.
        </p>
      </header>

      <div
        className={cn(
          "grid items-stretch gap-4 sm:gap-5",
          barber.manageSchedule && barber.blockSlots ? "lg:grid-cols-2" : "grid-cols-1"
        )}
      >
        {barber.manageSchedule && (
          <Card className="h-full">
            <CardContent className="flex h-full flex-col gap-4 p-4 sm:p-5">
              <div>
                <h2 className="text-lg font-semibold">روزهای کاری</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  ساعت کاری فعلاً ثابت و از ۹ تا ۲۱ است.
                </p>
              </div>
              <div className="flex flex-1 flex-col justify-between gap-5">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {WEEK_DAYS.map(({ label, value }) => {
                    const isActive = selectedDays.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => toggleDay(value)}
                        className={cn(
                          "min-h-11 rounded-lg border px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:bg-secondary"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={!isDirty}
                    className="w-full sm:w-auto"
                  >
                    لغو تغییرات
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!isDirty || isSaving}
                    className="w-full sm:w-auto"
                  >
                    {isSaving ? "در حال ذخیره..." : "ذخیره روزهای کاری"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {barber.blockSlots && (
          <BlockedSlotsManager hasWorkingSchedule={barber.manageSchedule} />
        )}
      </div>
    </div>
  );
}