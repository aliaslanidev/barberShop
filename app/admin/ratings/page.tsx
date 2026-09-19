"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, MessageSquareOff, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/data/mock-session";
import {
  ApiError,
  listRatingsApi,
  updateRatingStatusApi,
  type ApiAdminRating,
  type RatingStatus,
} from "@/lib/api";

type StatusFilter = RatingStatus | "ALL";

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

function formatDate(value: string): string {
  const d = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// «حمید رضایی» -> «ح.ر»
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0].charAt(0)}.${parts[parts.length - 1].charAt(0)}`;
}

const STATUS_LABELS: Record<RatingStatus, string> = {
  PENDING: "در انتظار تایید",
  APPROVED: "تاییدشده",
  REJECTED: "ردشده",
};

const STATUS_STYLES: Record<RatingStatus, string> = {
  PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  APPROVED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  REJECTED: "border-red-500/30 bg-red-500/10 text-red-400",
};

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "PENDING", label: "در انتظار" },
  { value: "APPROVED", label: "تاییدشده" },
  { value: "REJECTED", label: "ردشده" },
  { value: "ALL", label: "همه" },
];

function Stars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < score ? "fill-primary text-primary" : "fill-none text-border",
          )}
        />
      ))}
    </div>
  );
}

export default function AdminRatingsPage() {
  const [ratings, setRatings] = useState<ApiAdminRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [barberFilter, setBarberFilter] = useState<string>("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError("نشست شما منقضی شده است. دوباره وارد شوید.");
      setIsLoading(false);
      return;
    }

    listRatingsApi(token)
      .then(setRatings)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "خطا در دریافت نظرها"),
      )
      .finally(() => setIsLoading(false));
  }, []);

  const barbers = useMemo(() => {
    const map = new Map<string, string>();
    ratings.forEach((r) => map.set(r.barberId, r.barberName));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [ratings]);

  const byBarber = useMemo(
    () =>
      barberFilter
        ? ratings.filter((r) => r.barberId === barberFilter)
        : ratings,
    [ratings, barberFilter],
  );

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      ALL: byBarber.length,
    };
    byBarber.forEach((r) => {
      c[r.status] += 1;
    });
    return c;
  }, [byBarber]);

  const visible = useMemo(
    () =>
      statusFilter === "ALL"
        ? byBarber
        : byBarber.filter((r) => r.status === statusFilter),
    [byBarber, statusFilter],
  );

  async function handleStatus(id: string, status: "APPROVED" | "REJECTED") {
    const token = getAuthToken();
    if (!token) {
      setError("نشست شما منقضی شده است. دوباره وارد شوید.");
      return;
    }

    setBusyId(id);
    setError(null);
    try {
      await updateRatingStatusApi(id, status, token);
      setRatings((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "خطا در تغییر وضعیت نظر",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold">نظرها و امتیازها</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          متن نظر فقط بعد از تایید شما در صفحهٔ عمومی آرایشگر نمایش داده می‌شود.
        </p>
      </div>

      {/* تب‌های وضعیت + فیلتر آرایشگر */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-border bg-card p-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                statusFilter === f.value
                  ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label} ({toPersianDigits(counts[f.value])})
            </button>
          ))}
        </div>

        <select
          value={barberFilter}
          onChange={(e) => setBarberFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">همهٔ آرایشگرها</option>
          {barbers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          در حال بارگذاری...
        </p>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <MessageSquareOff className="h-7 w-7" />
          <p className="text-sm">نظری در این بخش وجود ندارد</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-secondary/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start font-medium">آرایشگر</th>
                <th className="px-4 py-3 text-start font-medium">مشتری</th>
                <th className="px-4 py-3 text-start font-medium">امتیاز</th>
                <th className="px-4 py-3 text-start font-medium">نظر</th>
                <th className="px-4 py-3 text-start font-medium">تاریخ</th>
                <th className="px-4 py-3 text-start font-medium">وضعیت</th>
                <th className="px-4 py-3 text-start font-medium" />
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {visible.map((r) => (
                <tr
                  key={r.id}
                  className="align-top transition-colors hover:bg-primary/[0.03]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rust text-xs font-bold text-white">
                        {initialsOf(r.barberName)}
                      </span>
                      <span className="font-medium">{r.barberName}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div>{r.customerName}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {r.serviceTitle}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <Stars score={r.score} />
                  </td>

                  <td className="max-w-[280px] px-4 py-3 leading-7 text-muted-foreground">
                    {r.comment ? r.comment : <span>—</span>}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-medium",
                        STATUS_STYLES[r.status],
                      )}
                    >
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {r.status !== "APPROVED" && (
                        <Button
                          type="button"
                          size="sm"
                          disabled={busyId === r.id}
                          onClick={() => handleStatus(r.id, "APPROVED")}
                        >
                          <Check className="ml-1 h-4 w-4" />
                          تایید
                        </Button>
                      )}
                      {r.status !== "REJECTED" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busyId === r.id}
                          onClick={() => handleStatus(r.id, "REJECTED")}
                        >
                          <X className="ml-1 h-4 w-4" />
                          رد
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
