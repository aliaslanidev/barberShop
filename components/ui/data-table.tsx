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
import {
  StandardTable,
  type StandardTableColumn,
} from "@/components/ui/standard-table";
import { StandardTablePagination } from "@/components/ui/standard-table-pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
  initialPageSize?: number;
  showPagination?: boolean;
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
  showPagination = true,
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
  const pageIndex = table.getState().pagination.pageIndex;
  const standardColumns: StandardTableColumn<(typeof rows)[number]>[] =
    table.getVisibleLeafColumns().map((column) => {
      const header = table
        .getHeaderGroups()[0]
        .headers.find((item) => item.column.id === column.id);

      return {
        id: column.id,
        width: column.getSize(),
        minWidth: column.columnDef.minSize,
        header: header
          ? flexRender(column.columnDef.header, header.getContext())
          : null,
        headerClassName: "text-primary/80",
        cell: (row) => {
          const cell = row
            .getVisibleCells()
            .find((item) => item.column.id === column.id);
          return cell
            ? flexRender(cell.column.columnDef.cell, cell.getContext())
            : null;
        },
      };
    });

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
      <div className={renderMobileCard ? "hidden md:block" : undefined}>
        <StandardTable
          rows={rows}
          columns={standardColumns}
          minWidth={`${56 + standardColumns.length * 150}px`}
          emptyMessage={emptyMessage}
          rowNumberOffset={pageIndex * table.getState().pagination.pageSize}
          pagination={false}
        />
      </div>

      {/* صفحه‌بندی داخلی: اگه کارت موبایل داریم، فقط در دسکتاپ نمایش داده می‌شه */}
      {showPagination && rows.length > 0 && (
        <StandardTablePagination
          className={renderMobileCard ? "hidden md:flex" : undefined}
          total={data.length}
          page={pageIndex + 1}
          pageSize={table.getState().pagination.pageSize}
          onPageChange={(nextPage) => table.setPageIndex(nextPage - 1)}
          onPageSizeChange={(size) => table.setPageSize(size)}
          itemLabel="مورد"
        />
      )}
    </div>
  );
}