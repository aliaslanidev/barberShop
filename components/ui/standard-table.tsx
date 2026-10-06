import type { ReactNode } from "react";
import { cn, toPersianDigits } from "@/lib/utils";

export interface StandardTableColumn<TData> {
  id: string;
  header: ReactNode;
  className?: string;
  cell: (row: TData) => ReactNode;
}

interface StandardTableProps<TData extends { id: string }> {
  columns: StandardTableColumn<TData>[];
  rows: TData[];
  className?: string;
  minWidth?: string;
  rowNumberOffset?: number;
}

export function StandardTable<TData extends { id: string }>({
  columns,
  rows,
  className,
  minWidth,
  rowNumberOffset = 0,
}: StandardTableProps<TData>) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-border border-r-2 border-r-primary bg-[#0e110f]",
        className,
      )}
    >
      <table
        className="w-full text-sm"
        style={minWidth ? { minWidth } : undefined}
      >
        <thead className="bg-[#151a17] text-xs text-primary/80">
          <tr className="border-b border-primary/15 text-right">
            <th
              scope="col"
              className="w-14 px-3 py-3 text-center font-medium"
            >
              #
            </th>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={cn("px-4 py-3 font-medium", column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className="align-middle transition-colors hover:bg-white/[0.025]"
            >
              <td className="px-3 py-3 text-center text-xs tabular-nums text-muted-foreground">
                {toPersianDigits(rowNumberOffset + index + 1)}
              </td>
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={cn("px-4 py-3", column.className)}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
