// از فاز ۳ به بعد این فایل دیگه شبیه‌سازی نیست — همون کش سبک سشنِ کاربرِ واقعاً
// لاگین‌کرده (بعد از تایید بک‌اند) هست، به‌همراه توکن JWT، تو localStorage.
// اسم فایل/توابع رو عمداً عوض نکردیم تا importهای زیادی که تو کل پروژه
// (admin-session.ts, barber-session.ts, customer-session.ts, سایدبارها...)
// به این فایل وصلن نشکنن. منبع حقیقت داده الان بک‌انده، نه اینجا.

export type MockRole = "admin" | "barber" | "customer" | "manager";

export type MockSession = {
  role: MockRole;
  id: string;
  name: string;
  token: string;
};

export const STORAGE_KEY = "mock_session";

// وقتی سشن پاک می‌شه (از هر جای پروژه: سایدبار، layoutها، AuthContext) این
// event روی window پخش می‌شه تا AuthProvider هم state خودش رو خالی کنه و
// هدر سایت و بقیه‌ی جاها همون لحظه «خارج‌شده» رو نشون بدن.
export const SESSION_CLEARED_EVENT = "mock-session-cleared";

export function setMockSession(session: MockSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getMockSession(): MockSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MockSession;
  } catch {
    return null;
  }
}

export function clearMockSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(SESSION_CLEARED_EVENT));
}

// برای استفاده‌ی lib/api.ts هنگام ارسال درخواست‌های احراز هویت‌دار
export function getAuthToken(): string | null {
  return getMockSession()?.token ?? null;
}