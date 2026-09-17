"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { getMyCustomersApi, ApiError } from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";

export default function BarberCustomersPage() {
  const [customers, setCustomers] = useState<{ name: string; phone: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    getMyCustomersApi(token)
      .then(setCustomers)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "خطا در دریافت مشتریان"))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        در حال دریافت مشتریان...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">مشتریان من</h1>
      <p className="text-sm text-muted-foreground">
        طبق قانون اسکوپ، آرایشگر فقط به مشتریانی دسترسی داره که باهاشون نوبت
        داشته — نه کل مشتریان سالن.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {customers.map((c) => (
          <Card key={c.phone}>
            <CardContent className="flex items-center justify-between p-4">
              <span className="text-sm font-medium">{c.name}</span>
              <span dir="ltr" className="text-xs text-muted-foreground">
                {c.phone}
              </span>
            </CardContent>
          </Card>
        ))}
        {customers.length === 0 && (
          <p className="text-sm text-muted-foreground">هنوز مشتری‌ای نداشتید.</p>
        )}
      </div>
    </div>
  );
}