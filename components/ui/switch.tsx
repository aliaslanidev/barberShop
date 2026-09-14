"use client";

import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
};

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex h-6 w-11 items-center rounded-full p-0.5 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        checked ? "justify-start bg-primary" : "justify-end bg-input"
      )}
      {...props}
    >
      <span className="h-5 w-5 rounded-full bg-background shadow" />
    </button>
  );
}