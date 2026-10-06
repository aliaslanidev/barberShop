import { useState, type PointerEvent, type ReactNode } from "react";
import { cn, toPersianDigits } from "@/lib/utils";

export interface StandardTableColumn<TData> {
  id: string;
  header: ReactNode;
  className?: string;
  width?: number;
  minWidth?: number;
  cell: (row: TData) => ReactNode;
}

interface StandardTableProps<TData extends { id: string }> {
  columns: StandardTableColumn<TData>[];
  rows: TData[];
  className?: string;
  minWidth?: string;
  rowNumberOffset?: number;
  resizable?: boolean;
}

export function StandardTable<TData extends { id: string }>({
  columns,
  rows,
  className,
  minWidth,
  rowNumberOffset = 0,
  resizable = true,
}: StandardTableProps<TData>) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () =>
      Object.fromEntries(
        columns.map((column) => [column.id, column.width ?? 160]),
      ),
  );
  const getColumnWidth = (column: StandardTableColumn<TData>) =>
    columnWidths[column.id] ?? column.width ?? 160;

  function resizeColumn(
    column: StandardTableColumn<TData>,
    event: PointerEvent<HTMLDivElement>,
    startX: number,
    startWidth: number,
  ) {
    const direction = document.documentElement.dir === "rtl" ? -1 : 1;
    const nextWidth = Math.max(
      column.minWidth ?? 96,
      startWidth + (event.clientX - startX) * direction,
    );
    setColumnWidths((current) => ({ ...current, [column.id]: nextWidth }));
  }

  const totalWidth = 56 + columns.reduce(
    (total, column) => total + getColumnWidth(column),
    0,
  );
  const requestedMinWidth = minWidth ? Number.parseFloat(minWidth) : 0;
  const tableWidth = Math.max(totalWidth, requestedMinWidth);

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-border border-r-2 border-r-primary bg-[#0e110f]",
        className,
      )}
    >
      <table
        className="border-separate border-spacing-0 text-sm"
        style={{ width: `max(100%, ${tableWidth}px)`, tableLayout: "fixed" }}
      >
        <colgroup>
          <col style={{ width: 56 }} />
          {columns.map((column) => (
            <col key={column.id} style={{ width: getColumnWidth(column) }} />
          ))}
        </colgroup>
        <thead className="bg-[#151a17] text-xs text-primary/80">
          <tr className="border-b border-primary/15 text-right">
            <th
              scope="col"
              className="w-14 px-3 py-3 text-center font-medium"
            >
              #
            </th>
            {columns.map((column, columnIndex) => (
              <th
                key={column.id}
                scope="col"
                className={cn(
                  "relative px-4 py-3 pe-5 font-medium",
                  column.className,
                )}
              >
                {column.header}
                {resizable && columnIndex < columns.length - 1 && (
                  <div
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`تغییر اندازه ستون ${column.id}`}
                    aria-valuemin={column.minWidth ?? 96}
                    aria-valuenow={Math.round(getColumnWidth(column))}
                    tabIndex={0}
                    className="group/resize absolute inset-y-0 end-0 z-10 flex w-2 cursor-col-resize touch-none items-center justify-center outline-none after:h-full after:w-px after:bg-border/60 after:transition-colors hover:after:bg-primary focus-visible:after:bg-primary"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.currentTarget.setPointerCapture(event.pointerId);
                      event.currentTarget.dataset.startX = String(event.clientX);
                      event.currentTarget.dataset.startWidth = String(
                        getColumnWidth(column),
                      );
                    }}
                    onPointerMove={(event) => {
                      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
                        return;
                      }
                      resizeColumn(
                        column,
                        event,
                        Number(event.currentTarget.dataset.startX),
                        Number(event.currentTarget.dataset.startWidth),
                      );
                    }}
                    onPointerUp={(event) => {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                        return;
                      }
                      event.preventDefault();
                      const direction =
                        document.documentElement.dir === "rtl" ? -1 : 1;
                      const delta = event.key === "ArrowRight" ? 10 : -10;
                      setColumnWidths((current) => ({
                        ...current,
                        [column.id]: Math.max(
                          column.minWidth ?? 96,
                          current[column.id] + delta * direction,
                        ),
                      }));
                    }}
                  />
                )}
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
                  className={cn(
                    "px-4 py-3",
                    column.className,
                  )}
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
