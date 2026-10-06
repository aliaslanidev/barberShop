"use client";

import { StandardTablePagination } from "@/components/ui/standard-table-pagination";

type BookingPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize?: number;
  showPageSize?: boolean;
  onPageSizeChange?: (pageSize: number) => void;
  onPageChange: (page: number) => void;
};

export function BookingPagination({
  page,
  totalPages,
  total,
  pageSize,
  showPageSize = false,
  onPageSizeChange,
  onPageChange,
}: BookingPaginationProps) {
  const resolvedPageSize =
    pageSize ?? Math.max(1, Math.ceil(total / totalPages));

  return (
    <StandardTablePagination
      total={total}
      page={page}
      pageSize={resolvedPageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      showPageSize={showPageSize}
      itemLabel="نوبت"
    />
  );
}
