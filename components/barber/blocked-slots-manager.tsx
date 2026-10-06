"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, X } from "lucide-react";
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

type PendingBlockedTime = { date: string; time: string };
type BlockedSlotsManagerProps = { hasWorkingSchedule: boolean };

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
  }).format("dddd D/M/YYYY");
}

export function BlockedSlotsManager({ hasWorkingSchedule }: BlockedSlotsManagerProps) {
  const [slots, setSlots] = useState<ApiBlockedSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<DateObject | null>(null);
  const [pendingTimes, setPendingTimes] = useState<Map<string, PendingBlockedTime>>(new Map());
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
  const sortedPendingTimes = useMemo(
    () =>
      Array.from(pendingTimes.entries())
        .map(([key, value]) => ({ key, ...value }))
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    [pendingTimes]
  );
  const blockedTimesForSelectedDate = useMemo(() => {
    if (!selectedDateStr) return new Set<string>();
    return new Set(
      slots.filter((slot) => slot.date.slice(0, 10) === selectedDateStr).map((slot) => slot.time)
    );
  }, [slots, selectedDateStr]);

  function handleDateChange(value: DateObject | null) {
    setDate(value);
  }

  function toggleSelect(time: string) {
    if (blockedTimesForSelectedDate.has(time)) return;
    if (!selectedDateStr) return;
    const key = `${selectedDateStr}|${time}`;
    setPendingTimes((prev) => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      else next.set(key, { date: selectedDateStr, time });
      return next;
    });
  }

  function removePendingTime(key: string) {
    setPendingTimes((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }

  function cancelChanges() {
    setPendingTimes(new Map());
  }

  async function handleConfirm() {
    const token = getAuthToken();
    if (!token || pendingTimes.size === 0) return;

    setIsSubmitting(true);
    try {
      const entries = Array.from(pendingTimes.entries());
      const results = await Promise.allSettled(
        entries.map(([, { date: selectedDate, time }]) =>
          createMyBlockedSlotApi({ date: selectedDate, time }, token)
        )
      );
      const successfulKeys = new Set(
        results.flatMap((result, index) =>
          result.status === "fulfilled" ? [entries[index][0]] : []
        )
      );
      const failedResult = results.find((result) => result.status === "rejected");
      setPendingTimes((prev) => {
        const next = new Map(prev);
        successfulKeys.forEach((key) => next.delete(key));
        return next;
      });

      if (successfulKeys.size > 0) {
        toast.success(`${toPersianDigits(successfulKeys.size)} ساعت بسته شد`);
      }
      if (failedResult?.status === "rejected") {
        toast.error(
          failedResult.reason instanceof ApiError
            ? failedResult.reason.message
            : `${toPersianDigits(results.length - successfulKeys.size)} ساعت ذخیره نشد؛ موارد ناموفق در فهرست باقی ماندند.`
        );
      }
      if (successfulKeys.size > 0) await refresh();
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
    <>
      <Card
        id="blocked-slots"
        className={cn(
          "h-full scroll-mt-24",
          !hasWorkingSchedule && "lg:col-span-2"
        )}
      >
        <CardContent className="flex h-full flex-col gap-4 p-4 sm:p-5">
          <div>
            <h2 className="text-lg font-semibold">بستن ساعت‌های خاص</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              تاریخ را انتخاب کنید، سپس ساعت‌هایی را که امکان پذیرش ندارید مشخص کنید.
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>تاریخ</Label>
              <JalaliDatePicker value={date} onChange={handleDateChange} placeholder="انتخاب تاریخ" />
            </div>

            {selectedDateStr ? (
              <div className="flex flex-col gap-2">
                <Label>ساعت‌های موردنظر</Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
                  {SESSION_SLOTS.map((time) => {
                    const isBlocked = blockedTimesForSelectedDate.has(time);
                    const isSelected = pendingTimes.has(`${selectedDateStr}|${time}`);
                    return (
                      <button
                        key={time}
                        type="button"
                        disabled={isBlocked}
                        aria-pressed={isSelected}
                        onClick={() => toggleSelect(time)}
                        className={cn(
                          "min-h-11 rounded-lg border-2 px-2 py-2 text-sm font-medium transition-colors",
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
            ) : (
              <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                ابتدا یک تاریخ انتخاب کنید تا ساعت‌های آن نمایش داده شوند.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardContent className="flex h-full flex-col gap-4 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">ساعت‌های انتخابی</p>
              <p className="mt-1 text-xs text-muted-foreground">
                انتخاب‌ها تا زمان ذخیره موقت می‌مانند.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
              {toPersianDigits(pendingTimes.size)}
            </span>
          </div>

          {sortedPendingTimes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
              هنوز ساعتی انتخاب نشده است.
            </p>
          ) : (
            <ul
              className="max-h-64 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1"
              aria-label="ساعت‌های انتخابی برای بستن"
            >
              {sortedPendingTimes.map(({ key, date: pendingDate, time }) => (
                <li
                  key={key}
                  className="flex items-center justify-between gap-2 rounded-lg bg-secondary/40 px-3 py-2"
                >
                  <span className="text-sm">
                    {formatJalali(pendingDate)} — ساعت {toPersianDigits(time)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePendingTime(key)}
                    disabled={isSubmitting}
                    aria-label={`حذف ساعت ${time} در تاریخ ${formatJalali(pendingDate)} از انتخاب‌ها`}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={cancelChanges}
              disabled={pendingTimes.size === 0 || isSubmitting}
              className="w-full sm:w-auto"
            >
              لغو تغییرات
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={pendingTimes.size === 0 || isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardContent className="flex h-full flex-col gap-3 p-4 sm:p-5">
          <div>
            <h2 className="text-base font-semibold">ساعت‌های بسته‌شده</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              برای آزادکردن ساعت، آن را از فهرست حذف کنید.
            </p>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">در حال دریافت اطلاعات...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">هنوز ساعتی بسته نشده است.</p>
          ) : (
            <div className="max-h-72 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
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
    </>
  );
}
