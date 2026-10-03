"use client";

import { Button } from "@/components/ui/button";

type BookingPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function BookingPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: BookingPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <p className="text-xs text-muted-foreground">
        صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")} ·{" "}
        {total.toLocaleString("fa-IR")} نوبت
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          قبلی
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          بعدی
        </Button>
      </div>
    </div>
  );
}
