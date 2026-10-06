"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, toPersianDigits } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [5, 10, 15];

type PageItem = number | "left-ellipsis" | "right-ellipsis";

function getPageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages: PageItem[] = [];
  const start = Math.max(2, Math.min(page - 1, pageCount - 3));
  const end = Math.min(pageCount - 1, start + 2);
  pages.push(1);
  if (start > 2) pages.push("left-ellipsis");
  for (let item = start; item <= end; item += 1) pages.push(item);
  if (end < pageCount - 1) pages.push("right-ellipsis");
  pages.push(pageCount);
  return pages;
}

interface StandardTablePaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  itemLabel?: string;
  pageSizeOptions?: number[];
  showPageSize?: boolean;
  disabled?: boolean;
  className?: string;
}

export function StandardTablePagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = "مورد",
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  showPageSize = true,
  disabled = false,
  className,
}: StandardTablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const end = Math.min(currentPage * pageSize, total);

  return (
    <div
      dir="ltr"
      className={cn(
        "flex flex-wrap items-center justify-start gap-x-3 gap-y-2 text-xs text-muted-foreground",
        className,
      )}
    >
      {showPageSize && onPageSizeChange && (
        <div dir="ltr" className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 w-[3.25rem] px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {toPersianDigits(size)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span dir="rtl" className="whitespace-nowrap">
            تعداد در هر صفحه
          </span>
        </div>
      )}

      <p dir="rtl" className="whitespace-nowrap">
        نمایش {toPersianDigits(end)} از {toPersianDigits(total)} {itemLabel}
      </p>

      {pageCount > 1 && (
        <nav
          aria-label="صفحه‌بندی"
          dir="rtl"
          className="flex flex-wrap items-center gap-1"
        >
          {getPageItems(currentPage, pageCount).map((item, index) =>
            typeof item === "number" ? (
              <button
                key={item}
                type="button"
                disabled={disabled}
                aria-current={item === currentPage ? "page" : undefined}
                onClick={() => onPageChange(item)}
                className={cn(
                  "h-8 min-w-8 rounded-md border px-2 tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-50",
                  item === currentPage
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                {toPersianDigits(item)}
              </button>
            ) : (
              <span key={`${item}-${index}`} className="px-0.5">
                …
              </span>
            ),
          )}
          {pageCount > 5 && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 px-2.5 text-xs"
                disabled={disabled || currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
                قبلی
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 px-2.5 text-xs"
                disabled={disabled || currentPage >= pageCount}
                onClick={() => onPageChange(currentPage + 1)}
              >
                بعدی
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </nav>
      )}
    </div>
  );
}
