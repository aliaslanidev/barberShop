"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentCustomer, type CustomerInfo } from "@/lib/data/customer-session";
import { CustomerNav } from "@/components/customer/customer-nav";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerInfo | null | undefined>(
    undefined
  );

  useEffect(() => {
    const current = getCurrentCustomer();
    if (!current) {
      router.replace("/login");
      return;
    }
    setCustomer(current);
  }, [router]);

  if (customer === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-muted-foreground">
          در حال بررسی دسترسی...
        </span>
      </div>
    );
  }
  if (!customer) return null;

  return (
    <div className="min-h-screen">
      <CustomerNav />
      <div className="container py-8">{children}</div>
    </div>
  );
}