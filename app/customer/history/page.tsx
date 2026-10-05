"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { BookingCard } from "@/components/customer/booking-card";
import { BookingPagination } from "@/components/booking-pagination";
import {
  listBookingsApi,
  createRatingApi,
  ApiError,
  type ApiBooking,
} from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";

const PAGE_SIZE = 20;

function CustomerHistoryContent() {
  // اگه از روی نوتیف اومده باشیم: /customer/history?review=<bookingId>
  const reviewId = useSearchParams().get("review");
  const reviewLookupDone = useRef(false);

  const [history, setHistory] = useState<ApiBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // با عوض شدن نوبتِ نوتیف، جستجوی نوبت باید دوباره انجام بشه
  // (این effect باید قبل از effect اصلی پایین باشه)
  useEffect(() => {
    reviewLookupDone.current = false;
  }, [reviewId]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    let cancelled = false;

    async function load(authToken: string) {
      const fetchPage = (p: number) =>
        listBookingsApi(authToken, {
          statuses: ["COMPLETED", "CANCELLED"],
          page: p,
          pageSize: PAGE_SIZE,
          sort: "desc",
        });

      try {
        let result = await fetchPage(page);

        // فقط بار اول: اگه نوبت مورد نظر نوتیف تو این صفحه نبود، صفحه‌های بعدی رو بگرد
        if (reviewId && !reviewLookupDone.current) {
          reviewLookupDone.current = true;
          if (!result.items.some((b) => b.id === reviewId)) {
            let p = result.page;
            while (p < result.totalPages) {
              p += 1;
              const next = await fetchPage(p);
              if (next.items.some((b) => b.id === reviewId)) {
                result = next;
                break;
              }
            }
          }
        }

        if (cancelled) return;
        setHistory(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        if (result.page !== page) setPage(result.page);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof ApiError ? err.message : "خطا در دریافت تاریخچه");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load(token);
    return () => {
      cancelled = true;
    };
  }, [page, reviewId]);

  // ثبت امتیاز. اگه خطا بده، پیام رو نشون می‌دیم و دوباره throw می‌کنیم تا
  // BookingCard بدونه ثبت انجام نشده و فرم رو باز نگه داره.
  async function handleRate(bookingId: string, score: number, comment: string) {
    const token = getAuthToken();
    if (!token) return;
    try {
      const rating = await createRatingApi(
        { bookingId, score, comment: comment.trim() || undefined },
        token,
      );
      setHistory((prev) => prev.map((b) => (b.id === bookingId ? { ...b, rating } : b)));
      toast.success("امتیاز شما ثبت شد. ممنون از نظرتان");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ثبت امتیاز");
      throw err;
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        در حال دریافت تاریخچه...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">تاریخچه‌ی نوبت‌ها</h1>

      {history.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            هنوز نوبتی ثبت نشده.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {history.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onRate={handleRate}
              autoOpenRating={booking.id === reviewId}
            />
          ))}
        </div>
      )}
      <BookingPagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
    </div>
  );
}

// useSearchParams در Next 14 برای build نیاز به Suspense داره
export default function CustomerHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-muted-foreground">
          در حال دریافت تاریخچه...
        </div>
      }
    >
      <CustomerHistoryContent />
    </Suspense>
  );
}