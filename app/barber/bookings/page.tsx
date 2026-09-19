"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  listBookingsApi,
  updateBookingStatusApi,
  ApiError,
  type ApiBooking,
  type BookingStatus,
} from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";

type Tab = "today" | "upcoming" | "past" | "all";

const TABS: { key: Tab; label: string }[] = [
  { key: "today", label: "امروز" },
  { key: "upcoming", label: "پیش‌رو" },
  { key: "past", label: "گذشته" },
  { key: "all", label: "همه" },
];

const EMPTY_MESSAGES: Record<Tab, string> = {
  today: "امروز نوبتی ندارید.",
  upcoming: "نوبت پیش‌رویی ندارید.",
  past: "هنوز نوبت گذشته‌ای ثبت نشده.",
  all: "هنوز نوبتی ثبت نشده.",
};

const statusLabel: Record<BookingStatus, string> = {
  CONFIRMED: "در انتظار",
  IN_PROGRESS: "در حال انجام",
  COMPLETED: "انجام‌شده",
  CANCELLED: "لغوشده",
};

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toPersianDigits(input: string) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return input.replace(/[0-9]/g, (d) => persianDigits[Number(d)]);
}

// تاریخ نوبت ممکنه "2026-09-19" یا ISO کامل باشه — فقط ۱۰ کاراکتر اول مهمه
function dateKeyOf(booking: ApiBooking) {
  return booking.date.slice(0, 10);
}

// نمایش تاریخ شمسی. با ساختن Date محلی از اجزای تاریخ، مشکل جابه‌جایی
// منطقه‌ی زمانی (UTC) پیش نمیاد.
function formatDateLabel(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fa-IR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BarberBookingsPage() {
  const [items, setItems] = useState<ApiBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("today");

  const today = toISODate(new Date());

  async function refresh() {
    const token = getAuthToken();
    if (!token) return;
    try {
      // بدون فیلتر تاریخ: همه‌ی نوبت‌های آرایشگر
      const data = await listBookingsApi(token);
      setItems(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در دریافت نوبت‌ها");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function updateStatus(id: string, status: BookingStatus) {
    const token = getAuthToken();
    if (!token) return;
    try {
      await updateBookingStatusApi(id, status, token);
      await refresh();
      toast.success(status === "IN_PROGRESS" ? "سرویس شروع شد" : "سرویس پایان یافت");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت");
    }
  }

  const counts = useMemo(() => {
    let todayCount = 0;
    let upcoming = 0;
    let past = 0;
    for (const b of items) {
      const key = dateKeyOf(b);
      if (key === today) todayCount++;
      else if (key > today) upcoming++;
      else past++;
    }
    return { today: todayCount, upcoming, past, all: items.length };
  }, [items, today]);

  // فیلتر + مرتب‌سازی + گروه‌بندی بر اساس روز
  const groups = useMemo(() => {
    const filtered = items.filter((b) => {
      const key = dateKeyOf(b);
      if (tab === "today") return key === today;
      if (tab === "upcoming") return key > today;
      if (tab === "past") return key < today;
      return true;
    });

    // گذشته و همه: جدیدترین اول. امروز و پیش‌رو: نزدیک‌ترین اول. ساعت‌ها همیشه صعودی.
    const dateDir = tab === "past" || tab === "all" ? -1 : 1;
    filtered.sort((a, b) => {
      const ka = dateKeyOf(a);
      const kb = dateKeyOf(b);
      if (ka !== kb) return ka < kb ? -dateDir : dateDir;
      return a.time.localeCompare(b.time);
    });

    const map = new Map<string, ApiBooking[]>();
    for (const b of filtered) {
      const key = dateKeyOf(b);
      const list = map.get(key);
      if (list) list.push(b);
      else map.set(key, [b]);
    }
    return Array.from(map.entries());
  }, [items, tab, today]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        در حال دریافت نوبت‌ها...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">نوبت‌ها</h1>

      <div className="flex gap-2 rounded-lg bg-secondary p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {t.label}{" "}
            <span className="text-xs opacity-80">
              ({toPersianDigits(String(counts[t.key]))})
            </span>
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {EMPTY_MESSAGES[tab]}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([dateKey, bookings]) => (
            <div key={dateKey} className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                {formatDateLabel(dateKey)}
                {dateKey === today && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    امروز
                  </span>
                )}
              </h2>

              {bookings.map((a) => (
                <Card key={a.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <div>
                      <p className="text-sm font-medium">{a.customer.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.service.title} — ساعت {toPersianDigits(a.time)} · {statusLabel[a.status]}
                      </p>
                      {a.notes && (
                        <p className="mt-1 text-xs text-muted-foreground">توضیحات: {a.notes}</p>
                      )}
                    </div>
                    {/* شروع/پایان سرویس فقط برای نوبت‌های امروز */}
                    {dateKey === today && (
                      <div className="flex gap-2">
                        {a.status === "CONFIRMED" && (
                          <Button size="sm" onClick={() => updateStatus(a.id, "IN_PROGRESS")}>
                            شروع سرویس
                          </Button>
                        )}
                        {a.status === "IN_PROGRESS" && (
                          <Button size="sm" onClick={() => updateStatus(a.id, "COMPLETED")}>
                            پایان سرویس
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}