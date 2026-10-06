"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Users,
  X,
} from "lucide-react";

import { getMyCustomersApi, ApiError } from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  StandardTable,
  StandardTableSortHeader,
} from "@/components/ui/standard-table";
import { StandardTablePagination } from "@/components/ui/standard-table-pagination";

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

interface SortHeaderProps {
  label: string;
  active: boolean;
  dir: SortDir;
  onSort: () => void;
}

function SortHeader({ label, active, dir, onSort }: SortHeaderProps) {
  return (
    <StandardTableSortHeader
      label={label}
      direction={active ? dir : false}
      onSort={onSort}
    />
  );
}

export default function BarberCustomersPage() {
  const [customers, setCustomers] = useState<BarberCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // بعد از debounce
  const [sortKey, setSortKey] = useState<"name" | "phone">("name");
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

    list.sort((a, b) =>
      sortKey === "name"
        ? a.name.localeCompare(b.name, "fa")
        : a.phone.localeCompare(b.phone),
    );
    if (sortDir === "desc") list.reverse();
    return list;
  }, [customers, search, sortDir, sortKey]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageCustomers = filtered.slice(startIndex, startIndex + pageSize);
  const hasFilters = search !== "";

  function handleSort(key: "name" | "phone") {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      setPage(1);
      return;
    }
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
          <div className="hidden md:block">
            <StandardTable
              rows={pageCustomers.map((customer) => ({
                ...customer,
                id: customer.phone,
              }))}
              rowNumberOffset={startIndex}
              pagination={false}
              columns={[
                {
                  id: "customer",
                  header: (
                    <SortHeader
                      label="مشتری"
                      active={sortKey === "name"}
                      dir={sortDir}
                      onSort={() => handleSort("name")}
                    />
                  ),
                  width: 220,
                  minWidth: 170,
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
                  id: "phone",
                  header: (
                    <SortHeader
                      label="شماره موبایل"
                      active={sortKey === "phone"}
                      dir={sortDir}
                      onSort={() => handleSort("phone")}
                    />
                  ),
                  width: 190,
                  minWidth: 150,
                  className: "whitespace-nowrap",
                  cell: (customer) => (
                    <span
                      dir="ltr"
                      className="inline-block text-muted-foreground"
                    >
                      {toPersianDigits(customer.phone)}
                    </span>
                  ),
                },
              ]}
            />
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
                        {toPersianDigits(customer.phone)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
          />
        </div>
      )}
    </div>
  );
}