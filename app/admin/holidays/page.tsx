"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { getAuthToken } from "@/lib/data/mock-session";
import {
  listSalonHolidaysApi,
  createSalonHolidayApi,
  deleteSalonHolidayApi,
  listAllTimeOffApi,
  ApiError,
  type ApiSalonHoliday,
  type ApiTimeOffWithBarber,
} from "@/lib/api";

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatJalali(isoDate: string): string {
  return new DateObject({
    date: new Date(`${isoDate.slice(0, 10)}T00:00:00`),
    calendar: persian,
    locale: persian_fa,
  }).format("YYYY/MM/DD");
}

export default function AdminHolidaysPage() {
  const [date, setDate] = useState<DateObject | null>(null);
  const [reason, setReason] = useState("");
  const [holidays, setHolidays] = useState<ApiSalonHoliday[]>([]);
  const [timeOffEntries, setTimeOffEntries] = useState<ApiTimeOffWithBarber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refresh() {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const [holidaysResult, timeOffResult] = await Promise.all([
        listSalonHolidaysApi(token),
        listAllTimeOffApi(token),
      ]);
      setHolidays(holidaysResult);
      setTimeOffEntries(timeOffResult);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در دریافت اطلاعات");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAdd() {
    const token = getAuthToken();
    if (!token || !date) return;
    setIsSubmitting(true);
    try {
      await createSalonHolidayApi(
        { date: toISODate(date.toDate()), reason: reason.trim() || undefined },
        token
      );
      toast.success("تعطیلی ثبت شد");
      setDate(null);
      setReason("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ثبت تعطیلی");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    const token = getAuthToken();
    if (!token) return;
    try {
      await deleteSalonHolidayApi(id, token);
      toast.success("تعطیلی حذف شد");
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در حذف تعطیلی");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        در حال دریافت اطلاعات...
      </div>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">تعطیلات</h1>
        <p className="text-sm text-muted-foreground">
          تعطیلی کل سالن و مرخصی آرایشگرها
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <h2 className="font-semibold">تعطیلی کل سالن</h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-2">
              <Label>تاریخ</Label>
              <JalaliDatePicker value={date} onChange={setDate} placeholder="انتخاب تاریخ" />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label>دلیل (اختیاری)</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="مثلا: عید نوروز"
              />
            </div>
            <Button onClick={handleAdd} disabled={!date || isSubmitting}>
              {isSubmitting ? "..." : "افزودن تعطیلی"}
            </Button>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {holidays.length === 0 && (
              <p className="text-sm text-muted-foreground">
                هنوز تعطیلی‌ای ثبت نشده
              </p>
            )}
            {holidays.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2 text-sm"
              >
                <span>
                  {formatJalali(h.date)}
                  {h.reason && (
                    <span className="text-muted-foreground"> — {h.reason}</span>
                  )}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => handleRemove(h.id)}
                >
                  حذف
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <h2 className="font-semibold">مرخصی آرایشگرها</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-right text-muted-foreground">
                  <th className="p-2 font-medium">آرایشگر</th>
                  <th className="p-2 font-medium">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {timeOffEntries.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="p-2">{e.barber.user.name}</td>
                    <td className="p-2">{formatJalali(e.date)}</td>
                  </tr>
                ))}

                {timeOffEntries.length === 0 && (
                  <tr>
                    <td colSpan={2} className="p-6 text-center text-muted-foreground">
                      هیچ مرخصی‌ای ثبت نشده
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}