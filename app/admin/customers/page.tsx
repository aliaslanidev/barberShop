"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";

import {
  listCustomersApi,
  updateCustomerStatusApi,
  ApiError,
  type ApiCustomer,
  type ApiCustomersPage,
  type CustomerSortKey,
  type CustomerStatusFilter,
} from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";
import { getCurrentAdmin } from "@/lib/data/admin-session";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  StatusCard,
  StatusChip,
  TableStatusBadge,
} from "@/components/ui/status-card";
import { accountStatusTone } from "@/lib/status-tones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  StandardTable,
  StandardTableSortHeader,
} from "@/components/ui/standard-table";
import { StandardTablePagination } from "@/components/ui/standard-table-pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DEFAULT_PAGE_SIZE = 5;
const SEARCH_DEBOUNCE_MS = 350;

type SortDir = "asc" | "desc";

const FILTER_LABELS: Record<CustomerStatusFilter, string> = {
  ALL: "همه",
  ACTIVE: "فعال",
  BLOCKED: "مسدود",
};

function toPersianDigits(input: string | number) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(/[0-9]/g, (d) => persianDigits[Number(d)]);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <TableStatusBadge tone={accountStatusTone(isActive)}>
      {isActive ? "فعال" : "مسدود"}
    </TableStatusBadge>
  );
}

function BlockedInfo({ customer }: { customer: ApiCustomer }) {
  if (customer.isActive || (!customer.blockedReason && !customer.blockedAt)) {
    return null;
  }
  return (
    <p
      className="mt-1 flex max-w-[240px] items-center gap-1 text-xs text-destructive"
      title={customer.blockedReason ?? undefined}
    >
      <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">
        {customer.blockedReason ?? "بدون دلیل"}
        {customer.blockedAt && ` — ${formatDate(customer.blockedAt)}`}
      </span>
    </p>
  );
}

interface SortHeaderProps {
  label: string;
  sortKey: CustomerSortKey;
  activeKey: CustomerSortKey;
  dir: SortDir;
  onSort: (key: CustomerSortKey) => void;
}

function SortHeader({ label, sortKey, activeKey, dir, onSort }: SortHeaderProps) {
  const isActive = activeKey === sortKey;
  return (
    <StandardTableSortHeader
      label={label}
      direction={isActive ? dir : false}
      onSort={() => onSort(sortKey)}
    />
  );
}

type DialogTarget = { customer: ApiCustomer; action: "block" | "unblock" };

export default function AdminCustomersPage() {
  // مدیر سالن فقط اجازه‌ی مشاهده داره؛ مسدود/رفع‌مسدودکردن فقط برای ادمین
  // اصلیه (هم‌راستا با تصمیم پروژه برای پرمیشن‌های حساس، مثل صفحه‌ی آرایشگرها)
  const admin = getCurrentAdmin();
  const isAdmin = admin?.role === "admin";

  const [data, setData] = useState<ApiCustomersPage | null>(null);
  const [isLoading, setIsLoading] = useState(true); // فقط بار اول
  const [isFetching, setIsFetching] = useState(false); // هر بار دریافت مجدد

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // بعد از debounce
  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<CustomerSortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [refreshKey, setRefreshKey] = useState(0);

  const [target, setTarget] = useState<DialogTarget | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const latestRequestId = useRef(0);

  // debounce جستجو
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // دریافت داده از سرور با هر تغییر در جستجو/فیلتر/مرتب‌سازی/صفحه/تعداد در صفحه
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    const requestId = ++latestRequestId.current;
    setIsFetching(true);

    listCustomersApi(token, {
      search: search || undefined,
      status: statusFilter,
      sortBy: sortKey,
      sortDir,
      page,
      pageSize,
    })
      .then((result) => {
        // جواب درخواست‌های قدیمی‌تر نادیده گرفته می‌شه
        if (requestId !== latestRequestId.current) return;
        setData(result);
        if (result.page !== page) setPage(result.page);
      })
      .catch((err) => {
        if (requestId !== latestRequestId.current) return;
        toast.error(err instanceof ApiError ? err.message : "خطا در دریافت مشتریان");
      })
      .finally(() => {
        if (requestId !== latestRequestId.current) return;
        setIsLoading(false);
        setIsFetching(false);
      });
  }, [search, statusFilter, sortKey, sortDir, page, pageSize, refreshKey]);

  function handleSort(key: CustomerSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // برای «تعداد لغو» و «تاریخ» از زیاد به کم شروع می‌کنیم، برای نام از الف
      setSortDir(key === "name" ? "asc" : "desc");
    }
    setPage(1);
  }

  function handleFilterChange(value: CustomerStatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  function handlePageSizeChange(value: number) {
    setPageSize(value);
    setPage(1);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  function openDialog(customer: ApiCustomer) {
    setReason("");
    setTarget({ customer, action: customer.isActive ? "block" : "unblock" });
  }

  function closeDialog() {
    if (isSubmitting) return;
    setTarget(null);
    setReason("");
  }

  async function handleConfirm() {
    if (!target || !isAdmin) return;
    const token = getAuthToken();
    if (!token) return;

    const isBlocking = target.action === "block";

    setIsSubmitting(true);
    try {
      await updateCustomerStatusApi(
        target.customer.id,
        {
          isActive: !isBlocking,
          reason: isBlocking ? reason.trim() || undefined : undefined,
        },
        token,
      );
      toast.success(isBlocking ? "مشتری مسدود شد" : "مشتری فعال شد");
      setTarget(null);
      setReason("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت مشتری");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        در حال دریافت مشتریان...
      </div>
    );
  }

  const customers = data?.items ?? [];
  const total = data?.total ?? 0;
  const currentPage = data?.page ?? 1;
  const counts = data?.counts ?? { all: 0, active: 0, blocked: 0 };
  const startIndex = (currentPage - 1) * pageSize;
  const hasFilters = search !== "" || statusFilter !== "ALL";

  const tabCounts: Record<CustomerStatusFilter, number> = {
    ALL: counts.all,
    ACTIVE: counts.active,
    BLOCKED: counts.blocked,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* هدر و جستجو */}
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
            value={searchInput}
            placeholder="جستجوی نام یا شماره موبایل"
            className="pl-9 pr-9"
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput.length > 0 && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="پاک کردن جستجو"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* تب‌های فیلتر وضعیت */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTER_LABELS) as CustomerStatusFilter[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleFilterChange(key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              statusFilter === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-secondary",
            )}
          >
            {FILTER_LABELS[key]}
            <span className="mr-1.5 text-xs opacity-80">
              {toPersianDigits(tabCounts[key])}
            </span>
          </button>
        ))}
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
            <Users className="h-8 w-8" />
            <p className="text-sm">
              {hasFilters
                ? "مشتری‌ای با این مشخصات پیدا نشد."
                : "هنوز مشتری‌ای ثبت نشده."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={cn(
            "flex flex-col gap-6 transition-opacity",
            isFetching && "opacity-60",
          )}
        >
          {/* جدول (دسکتاپ) */}
          <div className="hidden md:block">
            <StandardTable
              rows={customers}
              rowNumberOffset={startIndex}
              pagination={false}
              columns={[
                {
                  id: "customer",
                  width: 210,
                  minWidth: 160,
                  header: (
                    <SortHeader
                      label="مشتری"
                      sortKey="name"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                  ),
                  className: "min-w-[180px]",
                  cell: (customer) => (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                        {customer.name.slice(0, 1)}
                      </div>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                  ),
                },
                {
                  id: "mobile",
                  width: 165,
                  minWidth: 135,
                  header: (
                    <SortHeader
                      label="شماره موبایل"
                      sortKey="mobile"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                  ),
                  className: "whitespace-nowrap",
                  cell: (customer) => (
                    <span
                      dir="ltr"
                      className="inline-block text-muted-foreground"
                    >
                      {toPersianDigits(customer.mobile)}
                    </span>
                  ),
                },
                {
                  id: "joined",
                  width: 180,
                  minWidth: 145,
                  header: (
                    <SortHeader
                      label="تاریخ عضویت"
                      sortKey="createdAt"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                  ),
                  className: "whitespace-nowrap text-muted-foreground",
                  cell: (customer) => formatDate(customer.createdAt),
                },
                {
                  id: "cancellations",
                  width: 140,
                  minWidth: 110,
                  header: (
                    <SortHeader
                      label="تعداد لغو"
                      sortKey="cancelCount"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                  ),
                  className: "whitespace-nowrap",
                  cell: (customer) => toPersianDigits(customer.cancelCount),
                },
                {
                  id: "status",
                  width: 150,
                  minWidth: 115,
                  header: (
                    <SortHeader
                      label="وضعیت"
                      sortKey="isActive"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                  ),
                  cell: (customer) => (
                    <>
                      <StatusBadge isActive={customer.isActive} />
                      <BlockedInfo customer={customer} />
                    </>
                  ),
                },
                ...(isAdmin
                  ? [
                      {
                        id: "actions",
                        width: 155,
                        minWidth: 125,
                        header: (
                          <SortHeader
                            label="عملیات"
                            sortKey="isActive"
                            activeKey={sortKey}
                            dir={sortDir}
                            onSort={handleSort}
                          />
                        ),
                        className: "whitespace-nowrap",
                        cell: (customer: ApiCustomer) => (
                          <Button
                            size="sm"
                            variant="outline"
                            className={cn(
                              "h-8 px-2.5 text-xs",
                              customer.isActive &&
                                "border-red-500/40 bg-red-500/[0.06] text-red-400 hover:border-red-500/60 hover:bg-red-500/10",
                              !customer.isActive &&
                                "border-primary/40 bg-primary/[0.06] text-primary hover:border-primary/60 hover:bg-primary/10",
                            )}
                            onClick={() => openDialog(customer)}
                          >
                            {customer.isActive ? "مسدود کردن" : "فعال کردن"}
                          </Button>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </div>

          {/* کارت (موبایل) */}
          <div className="flex flex-col gap-3 md:hidden">
            {customers.map((customer) => (
              <StatusCard
                key={customer.id}
                tone={customer.isActive ? "success" : "danger"}
                showTint={false}
                accentClassName="bg-primary"
                className="bg-[#0e110f]"
                contentClassName="flex flex-col gap-3 pe-4 py-4"
              >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                        {customer.name.slice(0, 1)}
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p dir="ltr" className="text-right text-xs text-muted-foreground">
                          {toPersianDigits(customer.mobile)}
                        </p>
                      </div>
                    </div>
                    <StatusChip
                      tone={customer.isActive ? "success" : "danger"}
                      className="px-2 py-0.5"
                    >
                      {customer.isActive ? "فعال" : "مسدود"}
                    </StatusChip>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{toPersianDigits(customer.cancelCount)} لغو ثبت‌شده</span>
                    <span>عضویت: {formatDate(customer.createdAt)}</span>
                  </div>

                  <BlockedInfo customer={customer} />

                  {isAdmin && (
                    <Button
                      size="sm"
                      variant={customer.isActive ? "outline" : "default"}
                      className={cn(
                        "w-full",
                        customer.isActive &&
                          "border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/15",
                      )}
                      onClick={() => openDialog(customer)}
                    >
                      {customer.isActive ? "مسدود کردن" : "فعال کردن"}
                    </Button>
                  )}
              </StatusCard>
            ))}
          </div>

          {/* صفحه‌بندی */}
          <StandardTablePagination
            total={total}
            page={currentPage}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            itemLabel="مشتری"
            disabled={isFetching}
          />
        </div>
      )}

      <Dialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          {target && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {target.action === "block"
                    ? "مسدود کردن مشتری"
                    : "فعال کردن مشتری"}
                </DialogTitle>
                <DialogDescription>
                  {target.action === "block"
                    ? `«${target.customer.name}» دیگر نمی‌تواند نوبت جدید رزرو کند.`
                    : `«${target.customer.name}» دوباره می‌تواند نوبت رزرو کند و شمارنده‌ی لغوهایش صفر می‌شود.`}
                </DialogDescription>
              </DialogHeader>

              {target.action === "block" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="block-reason">دلیل (اختیاری)</Label>
                  <Input
                    id="block-reason"
                    value={reason}
                    maxLength={200}
                    placeholder="مثلاً: لغو مکرر نوبت"
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={closeDialog}
                  disabled={isSubmitting}
                >
                  انصراف
                </Button>
                <Button
                  variant={target.action === "block" ? "destructive" : "default"}
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "..."
                    : target.action === "block"
                      ? "مسدود کن"
                      : "فعال کن"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}