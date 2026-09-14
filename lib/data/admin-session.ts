// این فایل موقتاً یک ادمین ثابت را شبیه‌سازی می‌کند.
// وقتی سیستم احراز هویت واقعی پیاده شد، این باید از سشن/توکن واقعی خوانده شود.

export type AdminInfo = {
  id: string;
  name: string;
  role: "admin";
};

export const CURRENT_ADMIN: AdminInfo = {
  id: "admin-1",
  name: "مدیر سیستم",
  role: "admin",
};

// طبق مستند اسکوپ پروژه، ادمین به کل پلتفرم دسترسی کامل دارد
// و برخلاف باربر/منیجر، نیازی به چک permission جداگانه ندارد.
export function getCurrentAdmin(): AdminInfo {
  return CURRENT_ADMIN;
}