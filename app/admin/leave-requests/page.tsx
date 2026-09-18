"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuthToken } from "@/lib/data/mock-session";
import {
  listLeaveRequestsApi,
  approveLeaveRequestApi,
  rejectLeaveRequestApi,
  ApiError,
  type ApiLeaveRequestWithBarber,
} from "@/lib/api";

function formatJalali(isoDate: string): string {
  return new DateObject({
    date: new Date(`${isoDate}T00:00:00`),
    calendar: persian,
    locale: persian_fa,
  }).format("YYYY/MM/DD");
}

export default function AdminLeaveRequestsPage() {
  const [requests, setRequests] = useState<ApiLeaveRequestWithBarber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function refresh() {
    const token = getAuthToken();
    if (!token) return;
    try {
      const list = await listLeaveRequestsApi(token, "PENDING");
      setRequests(list);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در دریافت درخواست‌ها");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleApprove(id: string) {
    const token = getAuthToken();
    if (!token) return;
    setProcessingId(id);
    try {
      await approveLeaveRequestApi(id, token);
      toast.success("درخواست تایید شد");
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در تایید درخواست");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    const token = getAuthToken();
    if (!token) return;
    setProcessingId(id);
    try {
      await rejectLeaveRequestApi(id, token);
      toast.success("درخواست رد شد");
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در رد درخواست");
    } finally {
      setProcessingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        در حال دریافت درخواست‌ها...
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">درخواست‌های مرخصی</h1>
        <p className="text-sm text-muted-foreground">درخواست‌های در انتظار تایید</p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            درخواست در انتظاری وجود ندارد.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{r.barber.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatJalali(r.date.slice(0, 10))}
                    {r.reason && <span> — {r.reason}</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    disabled={processingId === r.id}
                    onClick={() => handleReject(r.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={processingId === r.id}
                    onClick={() => handleApprove(r.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}