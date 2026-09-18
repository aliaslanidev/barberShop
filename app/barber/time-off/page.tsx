"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { useAuth } from "@/lib/auth-context";
import { getAuthToken } from "@/lib/data/mock-session";
import {
  listBarbers,
  listMyTimeOffApi,
  createMyTimeOffApi,
  deleteMyTimeOffApi,
  cancelMyLeaveRequestApi,
  ApiError,
  type ApiBarber,
  type ApiTimeOff,
  type ApiLeaveRequest,
} from "@/lib/api";

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

const STATUS_LABELS: Record<ApiLeaveRequest["status"], string> = {
  PENDING: "در انتظار تایید",
  APPROVED: "تاییدشده",
  REJECTED: "رد شده",
};

export default function BarberTimeOffPage() {
  const { user } = useAuth();
  const [barber, setBarber] = useState<ApiBarber | null>(null);
  const [timeOffs, setTimeOffs] = useState<ApiTimeOff[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<ApiLeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<DateObject | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refresh() {
    const token = getAuthToken();
    try {
      const all = await listBarbers();
      const mine = all.find((b) => b.user.id === user?.id) ?? null;
      setBarber(mine);
      if (token) {
        const result = await listMyTimeOffApi(token);
        setTimeOffs(result.timeOffs);
        setLeaveRequests(result.leaveRequests);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        در حال دریافت اطلاعات...
      </div>
    );
  }

  const canManageDirectly = barber?.manageTimeOff ?? false;

  async function handleSubmit() {
    const token = getAuthToken();
    if (!token || !date) {
      toast.error("یه تاریخ انتخاب کن");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createMyTimeOffApi(
        { date: toISODate(date.toDate()), reason: reason || undefined },
        token
      );
      if (result.type === "TIME_OFF") {
        toast.success("مرخصی ثبت شد");
      } else {
        toast.success("درخواست مرخصی ثبت شد و در انتظار تایید است");
      }
      setDate(null);
      setReason("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ثبت مرخصی");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTimeOff(id: string) {
    const token = getAuthToken();
    if (!token) return;
    try {
      await deleteMyTimeOffApi(id, token);
      toast.success("مرخصی حذف شد");
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در حذف مرخصی");
    }
  }

  async function handleCancelRequest(id: string) {
    const token = getAuthToken();
    if (!token) return;
    try {
      await cancelMyLeaveRequestApi(id, token);
      toast.success("درخواست لغو شد");
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در لغو درخواست");
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">مرخصی</h1>
      <p className="text-sm text-muted-foreground">
        {canManageDirectly
          ? "مرخصی‌ای که ثبت کنی مستقیم اعمال می‌شه، بدون نیاز به تایید."
          : "درخواست مرخصی‌ات باید توسط مدیر سالن تایید بشه."}
      </p>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-2">
            <Label>تاریخ</Label>
            <JalaliDatePicker value={date} onChange={setDate} placeholder="انتخاب تاریخ" />
          </div>
          {!canManageDirectly && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="reason">توضیح (اختیاری)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="مثلاً: کار شخصی"
              />
            </div>
          )}
          <Button onClick={handleSubmit} disabled={!date || isSubmitting}>
            {isSubmitting ? "..." : canManageDirectly ? "ثبت مرخصی" : "ارسال درخواست مرخصی"}
          </Button>
        </CardContent>
      </Card>

      {timeOffs.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">مرخصی‌های ثبت‌شده</p>
          {timeOffs.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2"
            >
              <span className="text-sm">{formatJalali(t.date.slice(0, 10))}</span>
              {canManageDirectly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteTimeOff(t.id)}
                  aria-label="حذف مرخصی"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {leaveRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">درخواست‌های مرخصی</p>
          {leaveRequests.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2"
            >
              <div className="text-sm">
                <span>{formatJalali(r.date.slice(0, 10))}</span>
                <span className="mx-2 text-muted-foreground">—</span>
                <span
                  className={
                    r.status === "PENDING"
                      ? "text-yellow-500"
                      : r.status === "APPROVED"
                        ? "text-green-500"
                        : "text-destructive"
                  }
                >
                  {STATUS_LABELS[r.status]}
                </span>
              </div>
              {r.status === "PENDING" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleCancelRequest(r.id)}
                  aria-label="لغو درخواست"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}