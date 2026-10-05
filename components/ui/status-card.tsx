import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "info" | "warning" | "danger" | "neutral";

const toneStyles: Record<
  StatusTone,
  { accent: string; tint: string; chip: string }
> = {
  success: {
    accent: "bg-emerald-500",
    tint: "bg-emerald-500/[0.06]",
    chip: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30",
  },
  info: {
    accent: "bg-blue-500",
    tint: "bg-blue-500/[0.06]",
    chip: "bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-500/30",
  },
  warning: {
    accent: "bg-amber-500",
    tint: "bg-amber-500/[0.06]",
    chip: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30",
  },
  danger: {
    accent: "bg-red-500/80",
    tint: "bg-red-500/[0.05]",
    chip: "bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/30",
  },
  neutral: {
    accent: "bg-muted-foreground/40",
    tint: "",
    chip: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
  },
};

interface StatusCardProps extends HTMLAttributes<HTMLDivElement> {
  tone: StatusTone;
  dimmed?: boolean;
  contentClassName?: string;
  children: ReactNode;
}

export function StatusCard({
  tone,
  dimmed = false,
  className,
  contentClassName,
  children,
  ...props
}: StatusCardProps) {
  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        dimmed && "opacity-80",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0", styles.tint)}
      />
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0 start-0 w-1.5", styles.accent)}
      />
      <div className={cn("relative ps-5 pe-4 py-4", contentClassName)}>
        {children}
      </div>
    </div>
  );
}

interface StatusChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone: StatusTone;
  children: ReactNode;
}

export function StatusChip({
  tone,
  className,
  children,
  ...props
}: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        toneStyles[tone].chip,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
