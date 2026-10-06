"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, MessageSquareOff, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusCard, TableStatusBadge } from "@/components/ui/status-card";
import { ratingStatusTone } from "@/lib/status-tones";
import { StandardTable } from "@/components/ui/standard-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/data/mock-session";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ApiError,
  listBarbers,
  listRatingsApi,
  updateRatingStatusApi,
  type ApiBarber,
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
  const [barbers, setBarbers] = useState<ApiBarber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [barberFilter, setBarberFilter] = useState<string>("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<ApiAdminRating | null>(
    null,
  );

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError("نشست شما منقضی شده است. دوباره وارد شوید.");
      setIsLoading(false);
      return;
    }

    Promise.allSettled([listRatingsApi(token), listBarbers()])
      .then(([ratingsResult, barbersResult]) => {
        if (ratingsResult.status === "fulfilled") {
          setRatings(ratingsResult.value);
        } else {
          const err = ratingsResult.reason;
          setError(
            err instanceof ApiError ? err.message : "خطا در دریافت نظرها",
          );
        }

        if (barbersResult.status === "fulfilled") {
          setBarbers(barbersResult.value);
        } else {
          const err = barbersResult.reason;
          toast.error(
            err instanceof ApiError
              ? err.message
              : "خطا در دریافت فهرست آرایشگرها",
          );
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

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

        <Select
          value={barberFilter || "ALL"}
          onValueChange={(value) =>
            setBarberFilter(value === "ALL" ? "" : value)
          }
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="همهٔ آرایشگرها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">همهٔ آرایشگرها</SelectItem>
            {barbers.map((barber) => (
              <SelectItem key={barber.id} value={barber.id}>
                {barber.user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-[#0e110f] py-12 text-muted-foreground">
          <MessageSquareOff className="h-7 w-7" />
          <p className="text-sm">نظری در این بخش وجود ندارد</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <StandardTable
              rows={visible}
              minWidth="1136px"
              getRowProps={(rating) => ({
                "aria-label": `مشاهده جزئیات نظر ${rating.customerName}`,
                title: "برای مشاهدهٔ جزئیات دوبار کلیک کنید",
              })}
              onRowDoubleClick={(rating, event) => {
                if (
                  event.target instanceof Element &&
                  event.target.closest("button")
                ) {
                  return;
                }
                setSelectedRating(rating);
              }}
              onRowKeyDown={(rating, event) => {
                if (
                  event.target === event.currentTarget &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  setSelectedRating(rating);
                }
              }}
              columns={[
                {
                  id: "barber",
                  header: "آرایشگر",
                  width: 150,
                  minWidth: 130,
                  sortValue: (rating) => rating.barberName,
                  cell: (rating) => (
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rust text-xs font-bold text-white">
                        {initialsOf(rating.barberName)}
                      </span>
                      <span className="truncate font-medium" title={rating.barberName}>
                        {rating.barberName}
                      </span>
                    </div>
                  ),
                },
                {
                  id: "customer",
                  header: "مشتری",
                  width: 150,
                  minWidth: 130,
                  sortValue: (rating) => rating.customerName,
                  cell: (rating) => (
                    <>
                      <div className="truncate" title={rating.customerName}>
                        {rating.customerName}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground" title={rating.serviceTitle}>
                        {rating.serviceTitle}
                      </div>
                    </>
                  ),
                },
                {
                  id: "score",
                  header: "امتیاز",
                  width: 100,
                  minWidth: 90,
                  sortValue: (rating) => rating.score,
                  cell: (rating) => <Stars score={rating.score} />,
                },
                {
                  id: "comment",
                  header: "نظر",
                  width: 230,
                  minWidth: 160,
                  sortValue: (rating) => rating.comment ?? "",
                  cell: (rating) => (
                    <div
                      className="rounded-md border border-border/80 bg-background/40 px-2.5 py-1.5 text-xs leading-6 text-muted-foreground"
                      title={rating.comment || "بدون متن نظر"}
                    >
                      <span className="block truncate">
                        {rating.comment || "بدون متن نظر"}
                      </span>
                    </div>
                  ),
                },
                {
                  id: "date",
                  header: "تاریخ",
                  width: 120,
                  minWidth: 110,
                  sortValue: (rating) => rating.createdAt,
                  className: "whitespace-nowrap text-xs text-muted-foreground",
                  cell: (rating) => formatDate(rating.createdAt),
                },
                {
                  id: "status",
                  header: "وضعیت",
                  width: 140,
                  minWidth: 125,
                  sortValue: (rating) => STATUS_LABELS[rating.status],
                  cell: (rating) => (
                    <TableStatusBadge tone={ratingStatusTone(rating.status)}>
                      {STATUS_LABELS[rating.status]}
                    </TableStatusBadge>
                  ),
                },
                {
                  id: "actions",
                  header: "عملیات",
                  width: 190,
                  minWidth: 170,
                  sortValue: (rating) => STATUS_LABELS[rating.status],
                  className: "text-center",
                  cell: (rating) => (
                    <div className="flex justify-center gap-2">
                      {rating.status !== "APPROVED" && (
                        <Button
                          type="button"
                          size="sm"
                          className="px-3"
                          disabled={busyId === rating.id}
                          onClick={() => void handleStatus(rating.id, "APPROVED")}
                        >
                          <Check className="ml-1 h-3.5 w-3.5" />
                          تایید
                        </Button>
                      )}
                      {rating.status !== "REJECTED" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="px-3"
                          disabled={busyId === rating.id}
                          onClick={() => void handleStatus(rating.id, "REJECTED")}
                        >
                          <X className="ml-1 h-3.5 w-3.5" />
                          رد
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {visible.map((r) => (
              <StatusCard
                key={r.id}
                tone={
                  r.status === "APPROVED"
                    ? "success"
                    : r.status === "REJECTED"
                      ? "danger"
                      : "warning"
                }
                showTint={false}
                accentClassName="bg-primary"
                className="bg-[#0e110f]"
                contentClassName="flex flex-col gap-3 pe-4 py-4"
              >
                <button
                  type="button"
                  className="flex w-full flex-col gap-3 text-start transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`مشاهده جزئیات نظر ${r.customerName}`}
                  onClick={() => setSelectedRating(r)}
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rust text-xs font-bold text-white">
                        {initialsOf(r.barberName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{r.barberName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          مشتری: {r.customerName}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-medium",
                        STATUS_STYLES[r.status],
                      )}
                    >
                      {STATUS_LABELS[r.status]}
                    </span>
                  </div>

                  <div className="flex w-full items-center justify-between gap-3">
                    <Stars score={r.score} />
                    <span className="truncate text-xs text-muted-foreground">
                      {r.serviceTitle}
                    </span>
                  </div>

                  <div className="w-full rounded-lg border border-border/80 bg-background/40 px-3 py-2 text-start">
                    <p className="mb-1 text-[11px] text-muted-foreground">
                      متن نظر مشتری
                    </p>
                    <p className="line-clamp-2 text-sm leading-7 text-foreground/90">
                      {r.comment || "بدون متن نظر (فقط امتیاز)"}
                    </p>
                  </div>

                  <div className="flex w-full items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(r.createdAt)}</span>
                    <span>برای مشاهدهٔ جزئیات لمس کنید</span>
                  </div>
                </button>

                <div className="flex gap-2 border-t border-border pt-3">
                  {r.status !== "APPROVED" && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyId === r.id}
                      onClick={() => void handleStatus(r.id, "APPROVED")}
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
                      onClick={() => void handleStatus(r.id, "REJECTED")}
                    >
                      <X className="ml-1 h-4 w-4" />
                      رد
                    </Button>
                  )}
                </div>
              </StatusCard>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={selectedRating !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRating(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {selectedRating && (
            <>
              <DialogHeader>
                <DialogTitle>جزئیات نظر مشتری</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">آرایشگر</p>
                    <p className="mt-1 font-medium">{selectedRating.barberName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">مشتری</p>
                    <p className="mt-1 font-medium">{selectedRating.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">خدمت</p>
                    <p className="mt-1 font-medium">{selectedRating.serviceTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">تاریخ</p>
                    <p className="mt-1 font-medium">{formatDate(selectedRating.createdAt)}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">امتیاز</p>
                    <Stars score={selectedRating.score} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">وضعیت</p>
                    <p className="mt-1 font-medium">{STATUS_LABELS[selectedRating.status]}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="rounded-lg border border-border bg-secondary/30 p-3.5">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      متن نظر مشتری
                    </p>
                    <p className="whitespace-pre-wrap break-words leading-8">
                      {selectedRating.comment || "بدون متن نظر (فقط امتیاز)"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
