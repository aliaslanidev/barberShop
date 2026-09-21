"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  X,
} from "lucide-react";

import { getMyCustomersApi, ApiError } from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PAGE_SIZE_OPTIONS = [5, 10, 15] as const;
const DEFAULT_PAGE_SIZE = 5;
const SEARCH_DEBOUNCE_MS = 350;

type SortDir = "asc" | "desc";

type BarberCustomer = { name: string; phone: string };

function toPersianDigits(input: string | number) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(/[0-9]/g, (d) => persianDigits[Number(d)]);
}

// نرمال‌سازی ارقام فارسی/عربی به انگلیسی برای جستجوی شماره
function toEnglishDigits(input: string) {
  return input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

// شماره صفحه‌ها با «…» وقتی زیاد باشن: مثلاً 1 ... 4 5 6 ... 12
type PageItem = number | "ellipsis-left" | "ellipsis-right";

function getPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  let start = Math.max(2, current - 1);
  let end = Math.min(total - 1, current + 1);
  if (current <= 3) end = 4;
  if (current >= total - 2) start = total - 3;

  const items: PageItem[] = [1];
  if (start > 2) items.push("ellipsis-left");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 1) items.push("ellipsis-right");
  items.push(total);
  return items;
}

interface SortHeaderProps {
  label: string;
  active: boolean;
  dir: SortDir;
  onSort: () => void;
}

function SortHeader({ label, active, dir, onSort }: SortHeaderProps) {
  return (
    <button
      type="button"
      onClick={onSort}
      className={cn(
        "inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground",
        active && "text-foreground",
      )}
    >
      {label}
      <ArrowUpDown className="h-3.5 w-3.5" />
      {active && <span className="text-xs">{dir === "asc" ? "↑" : "↓"}</span>}
    </button>
  );
}

export default function BarberCustomersPage() {
  const [customers, setCustomers] = useState<BarberCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // بعد از debounce
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    getMyCustomersApi(token)
      .then(setCustomers)
      .catch((err) =>
        toast.error(err instanceof ApiError ? err.message : "خطا در دریافت مشتریان"),
      )
      .finally(() => setIsLoading(false));
  }, []);

  // debounce جستجو
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // فیلتر + مرتب‌سازی سمت کلاینت (بک‌اند لیست کامل رو برمی‌گردونه)
  const filtered = useMemo(() => {
    const q = toEnglishDigits(search).toLowerCase();
    const list = q
      ? customers.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            toEnglishDigits(c.phone).includes(q),
        )
      : [...customers];

    list.sort((a, b) => a.name.localeCompare(b.name, "fa"));
    if (sortDir === "desc") list.reverse();
    return list;
  }, [customers, search, sortDir]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageCustomers = filtered.slice(startIndex, startIndex + pageSize);
  const pageItems = getPageItems(currentPage, totalPages);
  const hasFilters = search !== "";

  function handleSort() {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        در حال دریافت مشتریان...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* هدر و جستجو */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">مشتریان من</h1>
          <p className="text-sm text-muted-foreground">
            طبق قانون اسکوپ، آرایشگر فقط به مشتریانی دسترسی داره که باهاشون نوبت
            داشته — نه کل مشتریان سالن.
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

      {total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
            <Users className="h-8 w-8" />
            <p className="text-sm">
              {hasFilters
                ? "مشتری‌ای با این مشخصات پیدا نشد."
                : "هنوز مشتری‌ای نداشتید."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {/* جدول (دسکتاپ) */}
          <div className="hidden overflow-hidden rounded-lg border border-border md:block">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-muted-foreground">
                <tr className="text-right">
                  <th className="p-3">
                    <SortHeader
                      label="مشتری"
                      active
                      dir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="p-3 font-medium">شماره موبایل</th>
                </tr>
              </thead>
              <tbody>
                {pageCustomers.map((customer) => (
                  <tr
                    key={customer.phone}
                    className="border-t border-border align-top transition-colors hover:bg-secondary/20"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                          {customer.name.slice(0, 1)}
                        </div>
                        <span className="font-medium">{customer.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span dir="ltr" className="inline-block text-muted-foreground">
                        {customer.phone}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* کارت (موبایل) */}
          <div className="flex flex-col gap-3 md:hidden">
            {pageCustomers.map((customer) => (
              <Card key={customer.phone}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                      {customer.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p dir="ltr" className="text-right text-xs text-muted-foreground">
                        {customer.phone}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* صفحه‌بندی */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-xs text-muted-foreground">
                نمایش {toPersianDigits(startIndex + 1)} تا{" "}
                {toPersianDigits(startIndex + pageCustomers.length)} از{" "}
                {toPersianDigits(total)} مشتری
              </p>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="page-size"
                  className="text-xs text-muted-foreground"
                >
                  تعداد در هر صفحه
                </label>
                <select
                  id="page-size"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="h-8 rounded-md border border-border bg-card px-2 text-sm outline-none focus:border-primary"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {toPersianDigits(size)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="صفحه‌بندی"
                className="flex flex-wrap items-center gap-1.5"
              >
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronRight className="ml-1 h-4 w-4" />
                  قبلی
                </Button>

                {pageItems.map((item) =>
                  typeof item === "number" ? (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      aria-current={item === currentPage ? "page" : undefined}
                      className={cn(
                        "h-8 min-w-8 rounded-md border px-2 text-sm transition-colors",
                        item === currentPage
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:bg-secondary",
                      )}
                    >
                      {toPersianDigits(item)}
                    </button>
                  ) : (
                    <span
                      key={item}
                      className="px-1 text-sm text-muted-foreground"
                    >
                      …
                    </span>
                  ),
                )}

                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  بعدی
                  <ChevronLeft className="mr-1 h-4 w-4" />
                </Button>
              </nav>
            )}
          </div>
        </div>
      )}
    </div>
  );
}