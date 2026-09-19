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

const STATUS_LABELS: Record<RatingStatus, string> = {
  PENDING: "در انتظار تایید",
  APPROVED: "تاییدشده",
  REJECTED: "ردشده",
};

const STATUS_STYLES: Record<RatingStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  APPROVED: "bg-emerald-500/10 text-emerald-500",
  REJECTED: "bg-red-500/10 text-red-400",
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
            "h-4 w-4",
            i < score ? "fill-primary text-primary" : "fill-none text-border"
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
        setError(err instanceof ApiError ? err.message : "خطا در دریافت نظرها")
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
    [ratings, barberFilter]
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
    [byBarber, statusFilter]
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
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "خطا در تغییر وضعیت نظر"
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">نظرها و امتیازها</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          متن نظر فقط بعد از تایید شما در صفحهٔ عمومی آرایشگر نمایش داده می‌شود.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                statusFilter === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary"
              )}
            >
              {f.label} ({toPersianDigits(counts[f.value])})
            </button>
          ))}
        </div>

        <select
          value={barberFilter}
          onChange={(e) => setBarberFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-card px-3 text-sm"
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
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
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
        <div className="space-y-3">
          {visible.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{r.customerName}</span>
                    <Stars score={r.score} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    آرایشگر: {r.barberName} · {r.serviceTitle} ·{" "}
                    {formatDate(r.date)} · ساعت {toPersianDigits(r.time)}
                  </p>
                </div>

                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    STATUS_STYLES[r.status]
                  )}
                >
                  {STATUS_LABELS[r.status]}
                </span>
              </div>

              {r.comment ? (
                <p className="mt-3 text-sm leading-7">{r.comment}</p>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  بدون متن نظر (فقط امتیاز)
                </p>
              )}

              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  ثبت‌شده در {formatDate(r.createdAt)}
                </span>

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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}