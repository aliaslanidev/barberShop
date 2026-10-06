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
import { cn, toPersianDigits } from "@/lib/utils";
import { getAuthToken } from "@/lib/data/mock-session";
import {
  listMyBlockedSlotsApi,
  createMyBlockedSlotApi,
  deleteMyBlockedSlotApi,
  ApiError,
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

export function BlockedSlotsManager() {
  const [slots, setSlots] = useState<ApiBlockedSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<DateObject | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refresh() {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      setSlots(await listMyBlockedSlotsApi(token));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در دریافت ساعت‌های بسته‌شده");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedDateStr = date ? toISODate(date.toDate()) : null;
  const blockedTimesForSelectedDate = useMemo(() => {
    if (!selectedDateStr) return new Set<string>();
    return new Set(
      slots.filter((slot) => slot.date.slice(0, 10) === selectedDateStr).map((slot) => slot.time)
    );
  }, [slots, selectedDateStr]);

  function handleDateChange(value: DateObject | null) {
    setDate(value);
    setSelectedTimes(new Set());
  }

  function toggleSelect(time: string) {
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
      toast.success(`${toPersianDigits(selectedTimes.size)} ساعت بسته شد`);
      setSelectedTimes(new Set());
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در بستن ساعت‌ها");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const token = getAuthToken();
    if (!token) return;
    try {
      await deleteMyBlockedSlotApi(id, token);
      toast.success("محدودیت ساعت برداشته شد");
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در حذف بلاک");
    }
  }

  return (
    <section id="blocked-slots" className="min-w-0 space-y-3 scroll-mt-24">
      <div>
        <h2 className="text-lg font-semibold">بستن ساعت‌های خاص</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ساعت‌هایی را که امکان پذیرش نوبت ندارید، برای تاریخ دلخواه ببندید.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-col gap-2">
            <Label>تاریخ</Label>
            <JalaliDatePicker value={date} onChange={handleDateChange} placeholder="انتخاب تاریخ" />
          </div>

          {selectedDateStr ? (
            <>
              <div className="flex flex-col gap-2">
                <Label>ساعت‌های موردنظر</Label>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {SESSION_SLOTS.map((time) => {
                    const isBlocked = blockedTimesForSelectedDate.has(time);
                    const isSelected = selectedTimes.has(time);
                    return (
                      <button
                        key={time}
                        type="button"
                        disabled={isBlocked}
                        aria-pressed={isSelected}
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
                        {toPersianDigits(time)}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  قرمز = بسته‌شده؛ رنگی = انتخاب فعلی شما.
                </p>
              </div>

              {selectedTimes.size > 0 && (
                <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">
                    {toPersianDigits(selectedTimes.size)} ساعت انتخاب شده
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTimes(new Set())}
                    >
                      لغو
                    </Button>
                    <Button type="button" size="sm" onClick={handleConfirm} disabled={isSubmitting}>
                      {isSubmitting ? "در حال ثبت..." : "بستن ساعت‌های انتخاب‌شده"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">ابتدا یک تاریخ انتخاب کنید.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          <p className="text-sm font-medium">ساعت‌های بسته‌شده</p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">در حال دریافت اطلاعات...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">هنوز ساعتی بسته نشده است.</p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-secondary/40 px-3 py-2"
                >
                  <span className="min-w-0 text-sm">
                    {formatJalali(slot.date.slice(0, 10))} — ساعت {toPersianDigits(slot.time)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(slot.id)}
                    aria-label="برداشتن محدودیت ساعت"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
