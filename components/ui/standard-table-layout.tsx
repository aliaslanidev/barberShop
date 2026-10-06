"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { Search } from "lucide-react";
import { cn, toPersianDigits } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function StandardTablePanel({
  toolbar,
  children,
  className,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "standard-table-panel flex flex-col gap-4 rounded-xl border border-border bg-[#0e110f] p-4",
        className,
      )}
    >
      {toolbar && <StandardTableToolbar>{toolbar}</StandardTableToolbar>}
      {children}
    </section>
  );
}

export function StandardTablePageHeading({
  title,
  description,
}: {
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="standard-table-page-heading space-y-1">
      <h1 className="text-xl font-bold leading-tight">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function StandardTableToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      dir="rtl"
      className={cn(
        "standard-table-toolbar flex flex-col gap-2 sm:flex-row sm:items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

type StandardTableSearchProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className"
> & {
  className?: string;
  clearAction?: ReactNode;
};

export function StandardTableSearch({
  className,
  clearAction,
  ...inputProps
}: StandardTableSearchProps) {
  return (
    <div className={cn("standard-table-search relative min-w-0 flex-1", className)}>
      <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        {...inputProps}
        className={cn("h-10 pr-9", clearAction && "pl-9")}
      />
      {clearAction && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2">
          {clearAction}
        </span>
      )}
    </div>
  );
}

export interface StandardTableFilterTab<TValue extends string = string> {
  value: TValue;
  label: string;
  count?: number;
}

export function StandardTableFilterTabs<TValue extends string>({
  items,
  value,
  onChange,
  className,
  ariaLabel = "فیلتر جدول",
}: {
  items: StandardTableFilterTab<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "standard-table-filter-tabs flex min-w-0 flex-wrap items-center gap-2",
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(item.value)}
            className={cn(
              "h-8 shrink-0 rounded-full border px-4 text-xs font-medium transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            {item.label}
            {item.count != null && (
              <span className="mr-1.5 tabular-nums">
                {toPersianDigits(item.count)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
