"use client";

import { useState, type ReactNode } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

const PAGE_SIZE_OPTIONS = [5, 10, 15];

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
  initialPageSize?: number;
  // اگه پاس داده بشه، در موبایل (زیر md) به جای جدول، برای هر ردیف یک کارت
  // نمایش داده می‌شه. در این حالت صفحه‌بندیِ داخلیِ جدول در موبایل مخفیه و همه‌ی
  // داده‌ی ورودی (مثلاً یک صفحه‌ی سمت سرور) پشت‌سرهم نمایش داده می‌شه.
  // اگه پاس داده نشه، رفتار قبلی (جدول با اسکرول افقی) حفظ می‌شه.
  renderMobileCard?: (item: TData) => ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "داده‌ای پیدا نشد",
  initialPageSize = 10,
  renderMobileCard,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    initialState: { pagination: { pageSize: initialPageSize } },
  });

  const rows = table.getRowModel().rows;
  // ردیف‌ها قبل از صفحه‌بندی داخلی (برای کارت‌های موبایل)
  const mobileRows = table.getPrePaginationRowModel().rows;
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;

  return (
    <div className="flex flex-col gap-3">
      {/* موبایل: کارت‌ها */}
      {renderMobileCard && (
        <div className="flex flex-col gap-3 md:hidden">
          {mobileRows.length ? (
            mobileRows.map((row) => (
              <div key={row.id}>{renderMobileCard(row.original)}</div>
            ))
          ) : (
            <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          )}
        </div>
      )}

      {/* دسکتاپ (یا همه‌ی سایزها اگه renderMobileCard نداریم): جدول */}
      <div
        className={
          renderMobileCard
            ? "hidden overflow-x-auto rounded-lg border border-border md:block"
            : "overflow-x-auto rounded-lg border border-border"
        }
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="p-6 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* صفحه‌بندی داخلی: اگه کارت موبایل داریم، فقط در دسکتاپ نمایش داده می‌شه */}
      {rows.length > 0 && (
        <div
          className={
            renderMobileCard
              ? "hidden flex-wrap items-center justify-between gap-3 md:flex"
              : "flex flex-wrap items-center justify-between gap-3"
          }
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>تعداد در صفحه:</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {toPersianDigits(size)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              صفحه {toPersianDigits(pageIndex + 1)} از{" "}
              {toPersianDigits(Math.max(pageCount, 1))} (
              {toPersianDigits(data.length)} مورد)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                <ChevronRight className="h-4 w-4" />
                قبلی
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                بعدی
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}