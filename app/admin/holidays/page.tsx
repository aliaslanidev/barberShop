"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import type { DateObject } from "react-multi-date-picker";

import {
  getAllSalonHolidays,
  addSalonHoliday,
  removeSalonHoliday,
} from "@/lib/data/holidays";
import { getAllTimeOff } from "@/lib/data/time-off";
import { getAllBarbers } from "@/lib/data/barbers";

export default function AdminHolidaysPage() {
  const barbers = getAllBarbers();
  const barberNameById = new Map(barbers.map((b) => [b.id, b.name]));

  const [date, setDate] = useState<DateObject | null>(null);
  const [reason, setReason] = useState("");
  const [holidays, setHolidays] = useState(getAllSalonHolidays());
  const timeOffEntries = getAllTimeOff();

  function handleAdd() {
    if (!date) return;
    addSalonHoliday(date.format("YYYY/MM/DD"), reason.trim() || undefined);
    setHolidays(getAllSalonHolidays());
    setDate(null);
    setReason("");
    toast.success("تعطیلی ثبت شد");
  }

  function handleRemove(id: string) {
    removeSalonHoliday(id);
    setHolidays(getAllSalonHolidays());
  }

  return (
    <main className="container flex flex-col gap-8 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">تعطیلات</h1>
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
            <Button onClick={handleAdd} disabled={!date}>
              افزودن تعطیلی
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
                  {h.dateDisplay}
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
                    <td className="p-2">
                      {barberNameById.get(e.barberId) ?? e.barberId}
                    </td>
                    <td className="p-2">{e.dateDisplay}</td>
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