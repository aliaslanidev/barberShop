"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { getAuthToken } from "@/lib/data/mock-session";
import {
  listBarbers,
  listMyBlockedSlotsApi,
  createMyBlockedSlotApi,
  deleteMyBlockedSlotApi,
  ApiError,
  type ApiBarber,
  type ApiBlockedSlot,
} from "@/lib/api";

const SALON_OPEN_HOUR = 9;
const SALON_CLOSE_HOUR = 21;

const SESSION_SLOTS: string[] = Array.from(
  { length: SALON_CLOSE_HOUR - SALON_OPEN_HOUR },
  (_, i) => `${String(SALON_OPEN_HOUR + i).padStart(2, "0")}:00`
);

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatJalali(isoDate: string): string {
  return new DateObject({
    date: new Date(`${isoDate}T00:00:00`),
    calendar: persian,
    locale: persian_fa,
  }).format("YYYY/MM/DD");
}

export default function BlockSlotsPage() {
  const { user } = useAuth();
  const [barber, setBarber] = useState<ApiBarber | null>(null);
  const [slots, setSlots] = useState<ApiBlockedSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<DateObject | null>(null);
  // اسلات‌هایی که کاربر تازه انتخاب کرده ولی هنوز تایید نکرده (فقط برای همین تاریخ)
  const [selectedTimes, setSelectedTimes] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refresh() {
    const token = getAuthToken();
    try {
      const all = await listBarbers();
      const mine = all.find((b) => b.user.id === user?.id) ?? null;
      setBarber(mine);
      if (mine?.blockSlots && token) {
        const list = await listMyBlockedSlotsApi(token);
        setSlots(list);
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

  const selectedDateStr = date ? toISODate(date.toDate()) : null;

  const blockedTimesForSelectedDate = useMemo(() => {
    if (!selectedDateStr) return new Set<string>();
    return new Set(
      slots.filter((s) => s.date.slice(0, 10) === selectedDateStr).map((s) => s.time)
    );
  }, [slots, selectedDateStr]);

  // با عوض‌شدن تاریخ، انتخاب‌های نیمه‌کاره پاک بشن
  function handleDateChange(value: DateObject | null) {
    setDate(value);
    setSelectedTimes(new Set());
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        در حال دریافت اطلاعات...
      </div>
    );
  }

  if (!barber?.blockSlots) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold md:text-2xl">بلاک‌کردن اسلات</h1>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            شما اجازه‌ی بلاک‌کردن اسلات را ندارید.
          </CardContent>
        </Card>
      </div>
    );
  }

  function toggleSelect(time: string) {
    // اسلاتی که از قبل بلاک شده، از همین‌جا قابل انتخاب نیست — حذفش از پایین صفحه‌ست
    if (blockedTimesForSelectedDate.has(time)) return;
    setSelectedTimes((prev) => {
      const next = new Set(prev);
      if (next.has(time)) next.delete(time);
      else next.add(time);
      return next;
    });
  }

  async function handleConfirm() {
    const token = getAuthToken();
    if (!token || !selectedDateStr || selectedTimes.size === 0) return;

    setIsSubmitting(true);
    try {
      await Promise.all(
        Array.from(selectedTimes).map((time) =>
          createMyBlockedSlotApi({ date: selectedDateStr, time }, token)
        )
      );
      toast.success(`${selectedTimes.size} اسلات بلاک شد`);
      setSelectedTimes(new Set());
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در بلاک‌کردن اسلات‌ها");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    setSelectedTimes(new Set());
  }

  async function handleDelete(id: string) {
    const token = getAuthToken();
    if (!token) return;
    try {
      await deleteMyBlockedSlotApi(id, token);
      toast.success("بلاک اسلات برداشته شد");
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در حذف بلاک");
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">بلاک‌کردن اسلات</h1>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-2">
            <Label>تاریخ</Label>
            <JalaliDatePicker value={date} onChange={handleDateChange} placeholder="انتخاب تاریخ" />
          </div>

          {selectedDateStr ? (
            <>
              <div className="flex flex-col gap-2">
                <Label>ساعت (چندتا رو می‌تونی انتخاب کنی)</Label>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {SESSION_SLOTS.map((time) => {
                    const isBlocked = blockedTimesForSelectedDate.has(time);
                    const isSelected = selectedTimes.has(time);
                    return (
                      <button
                        key={time}
                        type="button"
                        disabled={isBlocked}
                        onClick={() => toggleSelect(time)}
                        className={cn(
                          "rounded-lg border-2 px-2 py-2 text-sm font-medium transition-colors",
                          isBlocked
                            ? "cursor-not-allowed border-red-500 bg-red-500 text-white"
                            : isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-secondary/40 text-foreground hover:bg-secondary"
                        )}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  قرمز = از قبل بلاک‌شده (برای برداشتنش از لیست پایین اقدام کن). رنگی = انتخاب فعلی تو.
                </p>
              </div>

              {selectedTimes.size > 0 && (
                <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">
                    {selectedTimes.size} اسلات انتخاب شده
                  </span>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                      لغو
                    </Button>
                    <Button type="button" size="sm" onClick={handleConfirm} disabled={isSubmitting}>
                      {isSubmitting ? "..." : "تایید و بلاک کردن"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">اول یه تاریخ انتخاب کن.</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <p className="text-sm font-medium">همه‌ی اسلات‌های بلاک‌شده</p>
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">هیچ اسلاتی بلاک نشده است.</p>
        ) : (
          slots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2"
            >
              <span className="text-sm">
                {formatJalali(slot.date.slice(0, 10))} — ساعت {slot.time}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(slot.id)}
                aria-label="حذف بلاک"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}