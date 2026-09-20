"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, ShieldAlert, Users, X } from "lucide-react";

import {
  listCustomersApi,
  updateCustomerStatusApi,
  ApiError,
  type ApiCustomer,
} from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";
import { getCurrentAdmin } from "@/lib/data/admin-session";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

function toPersianDigits(input: string | number) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(/[0-9]/g, (d) => persianDigits[Number(d)]);
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AdminCustomersPage() {
  // مدیر سالن فقط اجازه‌ی مشاهده داره؛ مسدود/رفع‌مسدودکردن فقط برای ادمین
  // اصلیه (هم‌راستا با تصمیم پروژه برای پرمیشن‌های حساس، مثل صفحه‌ی آرایشگرها)
  const admin = getCurrentAdmin();
  const isAdmin = admin?.role === "admin";

  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function refresh() {
    const token = getAuthToken();
    if (!token) return;
    try {
      const data = await listCustomersApi(token);
      setCustomers(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در دریافت مشتریان");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const visibleCustomers = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return customers;
    return customers.filter((c) => c.name.includes(q) || c.mobile.includes(q));
  }, [customers, searchQuery]);

  async function handleToggleActive(customer: ApiCustomer, nextValue: boolean) {
    if (!isAdmin) return;
    const token = getAuthToken();
    if (!token) return;

    let reason: string | undefined;
    if (!nextValue) {
      const input = window.prompt(
        `دلیل مسدودکردن «${customer.name}» را وارد کنید (اختیاری):`,
        "",
      );
      // کاربر روی «انصراف» پنجره‌ی prompt زد
      if (input === null) return;
      reason = input.trim() || undefined;
    }

    setPendingId(customer.id);
    try {
      await updateCustomerStatusApi(customer.id, { isActive: nextValue, reason }, token);
      await refresh();
      toast.success(nextValue ? "مشتری فعال شد" : "مشتری مسدود شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت مشتری");
    } finally {
      setPendingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        در حال دریافت مشتریان...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">مدیریت مشتریان</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "مشتری‌های مسدودشده (خودکار یا دستی) را می‌توانید از همین‌جا فعال کنید"
              : "لیست مشتریان (فقط مشاهده)"}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            placeholder="جستجوی نام یا شماره موبایل"
            className="pl-9 pr-9"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="پاک کردن جستجو"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {visibleCustomers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
            <Users className="h-8 w-8" />
            <p className="text-sm">
              {customers.length === 0 ? "هنوز مشتری‌ای ثبت نشده." : "مشتری‌ای با این مشخصات پیدا نشد."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleCustomers.map((customer) => (
            <Card key={customer.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                    {customer.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p dir="ltr" className="text-left text-xs text-muted-foreground">
                      {customer.mobile}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1 sm:items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {toPersianDigits(customer.cancelCount)} لغو ثبت‌شده
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        customer.isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {customer.isActive ? "فعال" : "مسدود"}
                    </span>
                  </div>
                  {!customer.isActive && customer.blockedReason && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      {customer.blockedReason}
                      {customer.blockedAt && ` — ${formatDateTime(customer.blockedAt)}`}
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 border-t border-border pt-3 sm:border-0 sm:pt-0">
                    <span className="text-xs text-muted-foreground">
                      {customer.isActive ? "غیرفعال‌کردن" : "فعال‌کردن"}
                    </span>
                    <Switch
                      checked={customer.isActive}
                      disabled={pendingId === customer.id}
                      onCheckedChange={(v) => handleToggleActive(customer, v)}
                      aria-label="فعال/مسدود"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}