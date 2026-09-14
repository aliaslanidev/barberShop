// ⚠️ شبیه‌سازی سشن با localStorage — فقط برای توسعه‌ی بدون بک‌اند.
// وقتی auth واقعی (JWT/سشن سمت سرور) وصل شد، این فایل باید کامل حذف بشه.

export type MockRole = "admin" | "barber" | "customer";

export type MockSession = {
  role: MockRole;
  id: string;
  name: string;
};

const STORAGE_KEY = "mock_session";

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
}