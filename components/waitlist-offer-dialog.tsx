"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import { toast } from "sonner";
import {
  acceptWaitlistOfferApi,
  declineWaitlistOfferApi,
  getMyWaitlistApi,
  ApiError,
  type ApiWaitlistRequest,
  type ApiWaitlistState,
} from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function toPersianDigits(value: string) {
  return value.replace(/[0-9]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

const EMPTY_STATE: ApiWaitlistState = { requests: [], futureBookings: [] };

export function WaitlistOfferDialog() {
  const { user, isLoading } = useAuth();
  const [state, setState] = useState<ApiWaitlistState>(EMPTY_STATE);
  const [selectedReplacement, setSelectedReplacement] = useState("none");
  const [now, setNow] = useState(() => Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading || user?.role !== "customer") {
      setState(EMPTY_STATE);
      return;
    }

    let active = true;
    let hasReportedError = false;
    const token = getAuthToken();
    if (!token) return;

    const load = async () => {
      try {
        const result = await getMyWaitlistApi(token);
        if (active) {
          setState(result);
          hasReportedError = false;
        }
      } catch (error) {
        if (active && !hasReportedError) {
          hasReportedError = true;
          console.error("خطا در دریافت پیشنهاد صف انتظار", error);
          toast.error(error instanceof ApiError ? error.message : "دریافت وضعیت صف انتظار ناموفق بود");
        }
      }
    };

    void load();
    const interval = window.setInterval(() => void load(), 15_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [isLoading, user?.id, user?.role]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const offer = useMemo<ApiWaitlistRequest | undefined>(
    () =>
      state.requests
        .filter((request) => request.status === "OFFERED" && request.offerExpiresAt)
        .sort(
          (first, second) =>
            new Date(first.offerExpiresAt!).getTime() - new Date(second.offerExpiresAt!).getTime(),
        )[0],
    [state.requests],
  );

  useEffect(() => {
    setSelectedReplacement("none");
  }, [offer?.id]);

  const remainingSeconds = offer?.offerExpiresAt
    ? Math.max(0, Math.ceil((new Date(offer.offerExpiresAt).getTime() - now) / 1000))
    : 0;

  async function refresh() {
    const token = getAuthToken();
    if (token) setState(await getMyWaitlistApi(token));
  }

  async function handleAccept() {
    const token = getAuthToken();
    if (!token || !offer || remainingSeconds <= 0) return;
    setIsSubmitting(true);
    try {
      await acceptWaitlistOfferApi(
        offer.id,
        selectedReplacement === "none" ? undefined : selectedReplacement,
        token,
      );
      toast.success("نوبت آزادشده با موفقیت برای شما ثبت شد");
      await refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "ثبت نوبت ناموفق بود");
      await refresh().catch((refreshError) =>
        console.error("خطا در تازه‌سازی پیشنهاد صف انتظار", refreshError),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDecline() {
    const token = getAuthToken();
    if (!token || !offer) return;
    setIsSubmitting(true);
    try {
      await declineWaitlistOfferApi(offer.id, token);
      toast.info("این پیشنهاد رد شد و به نفر بعدی صف اطلاع داده می‌شود");
      await refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "رد پیشنهاد ناموفق بود");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!offer) return null;

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent
        className="[&>button:first-of-type]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-right">ساعت موردنظرتان آزاد شد</DialogTitle>
          <DialogDescription className="text-right leading-7">
            {offer.serviceTitle} با {offer.barberName}، {formatDate(offer.date)} ساعت{" "}
            {toPersianDigits(offer.time)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm text-primary">
          <Clock3 className="h-4 w-4 shrink-0" />
          <span>
            {remainingSeconds > 0
              ? `${toPersianDigits(String(Math.floor(remainingSeconds / 60)).padStart(2, "0"))}:${toPersianDigits(String(remainingSeconds % 60).padStart(2, "0"))} فرصت دارید`
              : "مهلت پیشنهاد تمام شد؛ در حال بررسی نفر بعدی صف"}
          </span>
        </div>

        {state.futureBookings.length > 0 && (
          <fieldset className="max-h-60 space-y-2 overflow-y-auto">
            <legend className="mb-2 text-sm font-semibold">
              اگر می‌خواهید یکی از نوبت‌های آینده‌تان را با این ساعت جابه‌جا کنید، انتخابش کنید:
            </legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm">
              <input
                type="radio"
                name="waitlist-replacement"
                value="none"
                checked={selectedReplacement === "none"}
                onChange={() => setSelectedReplacement("none")}
                className="mt-1 accent-primary"
              />
              <span>بدون لغو نوبت‌های فعلی، این نوبت را اضافه کنم</span>
            </label>
            {state.futureBookings.map((booking) => (
              <label
                key={booking.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm"
              >
                <input
                  type="radio"
                  name="waitlist-replacement"
                  value={booking.id}
                  checked={selectedReplacement === booking.id}
                  onChange={() => setSelectedReplacement(booking.id)}
                  className="mt-1 accent-primary"
                />
                <span>
                  {booking.serviceTitle} با {booking.barberName}، {formatDate(booking.date)} ساعت{" "}
                  {toPersianDigits(booking.time)} را جایگزین کنم
                </span>
              </label>
            ))}
          </fieldset>
        )}

        <DialogFooter className="gap-2 sm:flex-row-reverse">
          <Button
            type="button"
            onClick={handleAccept}
            disabled={isSubmitting || remainingSeconds <= 0}
          >
            {isSubmitting ? "در حال ثبت..." : "ثبت این ساعت"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDecline}
            disabled={isSubmitting}
          >
            رد پیشنهاد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
