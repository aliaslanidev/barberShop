"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getPublicStatsApi, type ApiPublicStats, ApiError } from "@/lib/api";

export function SiteStats() {
  const [stats, setStats] = useState<ApiPublicStats | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getPublicStatsApi()
      .then((result) => {
        if (isMounted) setStats(result);
      })
      .catch((error) => {
        if (!isMounted) return;
        setHasError(true);
        toast.error(
          error instanceof ApiError
            ? error.message
            : "خطا در دریافت آمار سالن",
        );
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = [
    { value: stats?.experienceYears, label: "سال سابقه" },
    { value: stats?.barberCount, label: "آرایشگر فعال" },
    { value: stats?.customerCount, label: "مشتری سالن" },
  ];

  return (
    <div
      className="container grid grid-cols-3 divide-x divide-x-reverse divide-primary/20 py-8 text-center sm:py-10"
      aria-label="آمار سالن"
    >
      {metrics.map((metric) => (
        <div key={metric.label} className="px-2">
          <div
            className="text-2xl font-bold text-primary sm:text-3xl"
            aria-live="polite"
          >
            {metric.value === undefined
              ? hasError
                ? "—"
                : "…"
              : metric.value.toLocaleString("fa-IR")}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{metric.label}</div>
        </div>
      ))}
    </div>
  );
}
