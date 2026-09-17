"use client";

import { useEffect, useState } from "react";
import { listBarbers, ApiError, type ApiBarber } from "@/lib/api";
import { getMockSession } from "@/lib/data/mock-session";

// ⚠️ نکته‌ی معماری مهم: session.id (از JWT) همون User.id هست، نه
// BarberProfile.id. تو مدل قدیمیِ mock این دو تا یکی بودن (id ثابت "ali" و
// امثالهم)، ولی تو بک‌اند واقعی جدان. برای همه‌جایی که قبلاً از
// getCurrentBarberId() به‌عنوان "شناسه‌ی آرایشگر" استفاده می‌شد (سایدبار،
// ناوبری، داشبورد، پرمیشن‌ها)، باید از این هوک استفاده کرد که با matching
// روی userId، پروفایل واقعی آرایشگر (شامل پرمیشن‌های flat) رو پیدا می‌کنه.
export function useCurrentBarberProfile() {
  // undefined = در حال لود، null = پیدا نشد/کاربر آرایشگر نیست
  const [barber, setBarber] = useState<ApiBarber | null | undefined>(undefined);

  useEffect(() => {
    const session = getMockSession();
    if (!session || session.role !== "barber") {
      setBarber(null);
      return;
    }
    listBarbers()
      .then((all) => {
        const mine = all.find((b) => b.userId === session.id) ?? null;
        setBarber(mine);
      })
      .catch((err) => {
        console.error(err instanceof ApiError ? err.message : err);
        setBarber(null);
      });
  }, []);

  return barber;
}