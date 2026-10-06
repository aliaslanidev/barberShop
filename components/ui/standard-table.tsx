import {
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn, toPersianDigits } from "@/lib/utils";
import { StandardTablePagination } from "@/components/ui/standard-table-pagination";

type SortValue = string | number | Date | null | undefined;

export function StandardTableSortHeader({
  label,
  direction,
  onSort,
  ariaLabel,
}: {
  label: ReactNode;
  direction: "asc" | "desc" | false;
  onSort: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      className="group inline-flex h-full items-center gap-1 font-medium text-primary/80 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      aria-label={ariaLabel ?? `مرتب‌سازی بر اساس ${typeof label === "string" ? label : "این ستون"}`}
      onClick={onSort}
    >
      {label}
      {direction === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : direction === "desc" ? (
        <ArrowDown className="h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      )}
    </button>
  );
}

export interface StandardTableColumn<TData> {
  id: string;
  header: ReactNode;
  className?: string;
  headerClassName?: string;
  width?: number;
  minWidth?: number;
  sortValue?: (row: TData) => SortValue;
  cell: (row: TData) => ReactNode;
}

interface StandardTableProps<TData extends { id: string }> {
  columns: StandardTableColumn<TData>[];
  rows: TData[];
  className?: string;
  minWidth?: string;
  rowNumberOffset?: number;
  resizable?: boolean;
  pagination?: boolean;
  emptyMessage?: ReactNode;
  onRowDoubleClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;
  onRowKeyDown?: (row: TData, event: KeyboardEvent<HTMLTableRowElement>) => void;
  getRowProps?: (row: TData) => {
    "aria-label"?: string;
    title?: string;
  };
}

export function StandardTable<TData extends { id: string }>({
  columns,
  rows,
  className,
  minWidth,
  rowNumberOffset = 0,
  resizable = true,
  pagination = true,
  emptyMessage,
  onRowDoubleClick,
  onRowKeyDown,
  getRowProps,
}: StandardTableProps<TData>) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () =>
      Object.fromEntries(
        columns.map((column) => [column.id, column.width ?? 160]),
      ),
  );
  const [sortState, setSortState] = useState<{
    columnId: string;
    descending: boolean;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const getColumnWidth = (column: StandardTableColumn<TData>) =>
    columnWidths[column.id] ?? column.width ?? 160;

  const sortedRows = useMemo(() => {
    if (!sortState) return rows;
    const column = columns.find((item) => item.id === sortState.columnId);
    const sortValue = column?.sortValue;
    if (!sortValue) return rows;

    return rows
      .map((row, index) => ({ row, index, value: sortValue(row) }))
      .sort((a, b) => {
        const left = a.value;
        const right = b.value;
        let result = 0;
        if (left == null || right == null) {
          result = left == null ? (right == null ? 0 : -1) : 1;
        } else if (left instanceof Date && right instanceof Date) {
          result = left.getTime() - right.getTime();
        } else if (typeof left === "number" && typeof right === "number") {
          result = left - right;
        } else {
          result = String(left).localeCompare(String(right), "fa");
        }
        return (sortState.descending ? -result : result) || a.index - b.index;
      })
      .map(({ row }) => row);
  }, [columns, rows, sortState]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = pagination
    ? sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedRows;

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
    <div className={cn("flex flex-col gap-3", className)}>
    <div className="standard-table overflow-x-auto rounded-lg border border-border border-r-2 border-r-primary bg-[#0e110f]">
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
              className="h-10 w-14 px-3 text-center font-medium text-primary/80"
            >
              #
            </th>
            {columns.map((column, columnIndex) => (
              <th
                key={column.id}
                scope="col"
                className={cn(
                  "relative h-10 whitespace-nowrap px-4 pe-5 text-primary/80 font-medium",
                  column.headerClassName,
                )}
              >
                {column.sortValue ? (
                  <StandardTableSortHeader
                    label={column.header}
                    ariaLabel={`مرتب‌سازی بر اساس ${typeof column.header === "string" ? column.header : column.id}`}
                    direction={
                      sortState?.columnId === column.id
                        ? sortState.descending
                          ? "desc"
                          : "asc"
                        : false
                    }
                    onSort={() =>
                      setSortState((current) =>
                        current?.columnId === column.id
                          ? { columnId: column.id, descending: !current.descending }
                          : { columnId: column.id, descending: false },
                      )
                    }
                  />
                ) : (
                  column.header
                )}
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
          {visibleRows.map((row, index) => (
            <tr
              key={row.id}
              tabIndex={onRowDoubleClick || onRowKeyDown ? 0 : undefined}
              onDoubleClick={
                onRowDoubleClick
                  ? (event) => onRowDoubleClick(row, event)
                  : undefined
              }
              onKeyDown={
                onRowKeyDown ? (event) => onRowKeyDown(row, event) : undefined
              }
              className={cn(
                "align-middle transition-colors hover:bg-white/[0.025]",
                (onRowDoubleClick || onRowKeyDown) &&
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
              )}
              {...getRowProps?.(row)}
            >
              <td className="px-3 py-2.5 text-center text-xs tabular-nums text-muted-foreground">
                {toPersianDigits(rowNumberOffset + (pagination ? (currentPage - 1) * pageSize : 0) + index + 1)}
              </td>
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={cn("px-4 py-2.5", column.className)}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
          {sortedRows.length === 0 && emptyMessage != null && (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-4 py-8 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    {pagination && (
      <StandardTablePagination
        total={sortedRows.length}
        page={currentPage}
        pageSize={pageSize}
        itemLabel="مورد"
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
      />
    )}
    </div>
  );
}
