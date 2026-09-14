// ⚠️ اکانت‌های ثابت برای تست لاگین بدون بک‌اند.
// وقتی auth واقعی وصل شد، این فایل کامل حذف می‌شود.

export type MockAccountRole = "admin" | "barber" | "customer";

export type MockAccount = {
  mobile: string;
  password: string;
  role: MockAccountRole;
  id: string;
  name: string;
};

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    mobile: "09120000001",
    password: "admin123",
    role: "admin",
    id: "admin-1",
    name: "مدیر سیستم",
  },
  {
    mobile: "09120000002",
    password: "barber123",
    role: "barber",
    id: "ali", // باید با آی‌دی واقعی سید در lib/data/barbers.ts یکی باشه
    name: "علی",
  },
  {
    mobile: "09120000003",
    password: "customer123",
    role: "customer",
    id: "customer-1",
    name: "مشتری تست",
  },
];

export function findMockAccount(
  mobile: string,
  password: string
): MockAccount | null {
  return (
    MOCK_ACCOUNTS.find((a) => a.mobile === mobile && a.password === password) ??
    null
  );
}