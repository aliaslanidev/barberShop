import { getMockSession } from "./mock-session";

export type AdminRole = "admin" | "manager";

export type AdminInfo = {
  id: string;
  name: string;
  role: AdminRole;
};

// حالا از localStorage (mock-session) می‌خونه، نه یه مقدار ثابت.
// ادمین (admin) و مدیر سالن (manager) هر دو اجازه‌ی ورود به پنل /admin
// رو دارن. محدودیت‌های مدیر سالن نسبت به ادمین (نبود ساخت/حذف آرایشگر،
// تغییر پرمیشن آرایشگر، تنظیمات کلی سالن، ساخت مدیر سالن دیگه) داخل خودِ
// صفحات/کامپوننت‌ها بر اساس همین role چک می‌شه — نه اینجا.
export function getCurrentAdmin(): AdminInfo | null {
  const session = getMockSession();
  if (!session || (session.role !== "admin" && session.role !== "manager")) {
    return null;
  }
  return { id: session.id, name: session.name, role: session.role };
}