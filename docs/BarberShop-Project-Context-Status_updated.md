# سالن آرایش (BarberShop) — سند وضعیت و کانتکست کامل پروژه

**تاریخ به‌روزرسانی:** ۲۰۲۶/۰۶/۲۴ (۱۴ سپتامبر ۲۰۲۶)
**نام پکیج:** `salon-arayesh`

---

## ۱. معرفی و چشم‌انداز پروژه

یک پلتفرم کامل مدیریت سالن آرایش/آرایشگاه مردانه و رزرو نوبت آنلاینه، نه صرفاً یه فرم رزرو ساده. شامل:

- سایت عمومی (لندینگ، خدمات، باربرها، رزرو)
- ثبت‌نام/ورود مشتری
- رزرو نوبت با اسلات‌های زمانی ثابت یک‌ساعته
- پنل مشتری، پنل باربر، پنل مدیر سالن (Salon Manager)، پنل ادمین
- سیستم نقش/پرمیشن گرانولار
- پشتیبانی PWA

**ایده‌ی کلیدی کسب‌وکار:** بعضی باربرها کاملاً تحت کنترل سالن‌ان، بعضی‌ها (باربر حرفه‌ای/professional) می‌تونن خدمات، قیمت و زمان‌بندی خودشون رو مدیریت کنن — ولی این استقلال هم توسط ادمین کنترل می‌شه (پرمیشن به پرمیشن، نه خودکار).

---

## ۲. استک فنی واقعی (Actual Tech Stack)

> این استک با پروفایل عمومی فرانت‌اند من (React/MUI/Redux/TanStack Query) فرق داره — این پروژه مشخصاً روی این استک ساخته شده:

- **فریم‌ورک:** Next.js 14.2.5 (App Router)
- **زبان:** TypeScript
- **استایل:** Tailwind CSS
- **کامپوننت‌ها:** Radix UI primitives (dialog, label, popover, select) + کامپوننت‌های سبک shadcn/ui (در `components/ui/`)
- **فرم‌ها:** react-hook-form + zod + @hookform/resolvers
- **PWA:** @ducanh2912/next-pwa
- **فونت فارسی:** @fontsource/vazirmatn
- **تاریخ شمسی:** react-multi-date-picker
- **توست/نوتیفیکیشن UI:** sonner
- **آیکون:** lucide-react

**زبان/جهت:** فارسی، RTL، معماری برای پشتیبانی چندزبانه در آینده باز نگه داشته شده.

⚠️ **نکته‌ی مهم:** فعلاً هیچ بک‌اند واقعی (API/دیتابیس) وصل نیست. تمام داده‌ها (باربرها، خدمات، سشن‌ها) در فایل‌های mock داخل `lib/data/` به‌صورت آرایه‌ی در-حافظه شبیه‌سازی شده‌ان. سند اسکوپ اولیه از FastAPI/PostgreSQL برای بک‌اند صحبت کرده بود، ولی این هنوز پیاده نشده.

---

## ۳. ساختار مسیرها (Route Structure)

```
app/
  (site)/              → سایت عمومی
    page.tsx           → صفحه اصلی (هیرو، خدمات، گالری، درباره، CTA)
    booking/           → فرآیند رزرو نوبت
    login/             → صفحه ورود (فرم موبایل+رمز، بدون بک‌اند واقعی)
  customer/
    dashboard/
    bookings/
    history/
    profile/
  barber/
    layout.tsx         → چک نقش/پرمیشن + BarberNav
    dashboard/
    bookings/          → دکمه‌های شروع/پایان سرویس
    customers/
    services/          → فقط برای professional
    schedule/           → فقط برای professional
    time-off/           → فقط برای professional
  admin/
    layout.tsx         → چک نقش ادمین + AdminNav
    dashboard/          → کارت‌های آماری

lib/
  data/
    barbers.ts          → داده‌ی باربرها (عمومی + مدیریتی) — merge شده
    services.ts          → داده‌ی خدمات (برای سایت عمومی)
    appointments.ts       → داده‌ی نوبت‌ها
    barber-session.ts      → شبیه‌سازی سشن باربر فعلی (CURRENT_BARBER_ID)
    barber-permissions.ts   → منطق پرمیشن باربر
    admin-session.ts         → شبیه‌سازی ادمین فعلی (همیشه full-access)
    utils.ts                 → cn() helper

components/
  header.tsx              → هدر سایت عمومی (صفحه اصلی/ورود/رزرو)
  bottom-nav.tsx           → نوار پایین موبایل سایت عمومی
  barber/
    barber-nav.tsx
  admin/
    admin-nav.tsx
  customer/
  ui/                      → کامپوننت‌های پایه shadcn (button, card, input, label, ...)
```

---

## ۴. مدل نقش‌ها و پرمیشن‌ها (خلاصه‌ی مستند اسکوپ)

**۴ نقش سیستمی:** Admin, Salon Manager, Barber, Customer

قانون کلیدی طراحی:

```
ROLE + TYPE + PERMISSIONS
```

مثال:

```
role = barber
barberType = professional | regular
permissions = [manage_services, manage_pricing, manage_schedule, manage_time_off, block_slots, cancel_own_bookings, ...]
```

- **Admin:** دسترسی کامل به کل پلتفرم؛ تنها مرجع تغییر نقش/پرمیشن/نوع باربر.
- **Salon Manager:** پرمیشن‌هاش رو ادمین تعریف می‌کنه؛ به‌صورت پیش‌فرض به بخش‌های حساس (نقش/پرمیشن/تنظیمات سیستم) دسترسی نداره مگر صراحتاً داده بشه.
- **Barber:** یک نقش سیستمی، با `barberType: professional | regular`. نوع professional **خودکار** پرمیشن نمی‌ده — ادمین تک‌به‌تک پرمیشن می‌ده (مثال مستند: professional می‌تونه schedule/time-off مدیریت کنه ولی block_slots و cancel_own_bookings نه، مگر جدا فعال بشه).
- **Customer:** با ثبت‌نام عمومی خودکار ساخته می‌شه؛ نمی‌تونه نقش خودش رو بالا ببره.

قانون‌های سخت کسب‌وکار:
- اسلات‌های زمانی **globally fixed** (یک‌ساعته) — هیچ نقشی (حتی ادمین) نمی‌تونه اسلات دلخواه بسازه.
- Availability باید **سمت سرور** محاسبه بشه، نه فرانت‌اند.
- بلاک/کنسل کردن اسلاتی که نوبت تاییدشده داره، نباید نوبت رو بی‌صدا حذف کنه — باید فلو تایید/اطلاع‌رسانی جدا داشته باشه.

---

## ۵. چی ساخته شده (وضعیت فعلی، به تفکیک فاز)

### فاز ۳ — پنل باربر (تکمیل‌شده)
فایل‌های جدید:
- `lib/data/barber-session.ts` — شبیه‌سازی سشن با ثابت `CURRENT_BARBER_ID`
- `lib/data/barber-permissions.ts`
- `lib/data/appointments.ts`
- `components/barber/barber-nav.tsx`
- `app/barber/layout.tsx`
- `app/barber/dashboard/page.tsx`
- `app/barber/bookings/page.tsx` (دکمه‌های شروع/پایان سرویس)
- `app/barber/customers/page.tsx`
- `app/barber/services/page.tsx`
- `app/barber/schedule/page.tsx`
- `app/barber/time-off/page.tsx`

**نحوه‌ی تست:** با `CURRENT_BARBER_ID = "ali"` (professional) منوهای خدمات/زمان‌بندی/مرخصی دیده می‌شه؛ با `"reza"` (regular) فقط داشبورد/نوبت‌های امروز/مشتریان من دیده می‌شه و ورود مستقیم به URL محدود پیام «دسترسی ندارید» می‌ده.

### اصلاحات سایت عمومی (تکمیل‌شده)
- مشکل: دکمه‌های «رزرو آنلاین نوبت» و «رزرو نوبت» در صفحه اصلی هیچ `href`/`Link`ی نداشتن (فقط تو هدر کار می‌کرد).
- رفع شد: در `app/(site)/page.tsx` هر دو دکمه به `/booking` لینک شدن.
- به `components/header.tsx` دکمه‌ی «صفحه اصلی» (`/`) و «ورود» (`/login`) اضافه شد.
- صفحه‌ی `app/(site)/login/page.tsx` ساخته شد: فرم شماره موبایل + رمز عبور با react-hook-form/zod، بدون اتصال واقعی به بک‌اند (کامنت `TODO` برای اتصال بعدی API گذاشته شده).
- `components/ui/input.tsx` (که وجود نداشت) اضافه شد.

### فاز ۴ — پنل ادمین (در حال شروع)
ساخته‌شده تا این لحظه:
- `lib/data/admin-session.ts` — شبیه‌سازی ادمین ثابت (`CURRENT_ADMIN`)، چون ادمین طبق مستند همیشه full-access داره و نیاز به چک permission ندارد (برخلاف باربر)
- `components/admin/admin-nav.tsx` — نوار ناوبری با آیتم‌های: داشبورد، باربرها، خدمات و قیمت، نوبت‌ها، تعطیلات، گزارش‌ها، تنظیمات
- `app/admin/layout.tsx` — چک نقش (اگر ادمین نباشد ریدایرکت به `/login`) + رندر AdminNav
- `app/admin/dashboard/page.tsx` — کارت‌های آماری (نوبت‌های امروز، باربرهای فعال، خدمات فعال، درآمد ماه — همه mock)
- `lib/data/barbers.ts` **گسترش داده شد** (نه جایگزین): فایل قبلی که برای سایت عمومی/بوکینگ استفاده می‌شد (فیلدهای `bio`, `initials`, `serviceIds` و توابع `getBarberById`, `getBarbersByService`, `getServicesByBarber`) نگه داشته شد و این‌ها اضافه شدن:
  - فیلدهای `permissions`, `mobile`, `isActive`
  - توابع مدیریتی: `getAllBarbers`, `createBarber`, `updateBarber`, `setBarberType`, `updateBarberPermissions`, `deleteBarber`
  - داده‌ی seed فعلی: ۴ باربر — `ali` و `hamed` (professional)، `reza` و `mehdi` (regular)

**نحوه‌ی دسترسی به پنل ادمین در حالت فعلی:** چون سیستم لاگین واقعی وصل نیست، مستقیم برو به `/admin/dashboard` — `admin-session.ts` همیشه یک ادمین ثابت برمی‌گردونه، نیازی به لاگین یا تغییر مقدار (مثل `CURRENT_BARBER_ID`) نیست.

---

## ۶. چی هنوز مونده (بر اساس فاز‌بندی MVP سند اصلی)

### فاز ۴ — پنل ادمین (ادامه)
- [ ] صفحه‌ی مدیریت باربرها (`/admin/barbers`) — لیست، تغییر نوع، تغییر permission، غیرفعال/حذف
- [ ] مدیریت خدمات و قیمت (`/admin/services`)
- [ ] مدیریت نوبت‌ها (`/admin/bookings`) — رزرو دستی، ویرایش، کنسل
- [ ] زمان‌بندی سالن/باربرها
- [ ] تعطیلات (سالن + مرخصی تک‌تک باربر)
- [ ] کاربران/نقش‌ها/پرمیشن‌ها (بخش حساس‌ترین بخش ادمین)
- [ ] مدیران سالن (Salon Manager) — تعریف و پرمیشن‌دهی
- [ ] گزارش‌ها
- [ ] تنظیمات سالن

### فازهای بعدی (طبق سند اصلی، هنوز شروع نشده)
- **فاز ۵ — Service Tracking:** Start/End Service به‌صورت واقعی (الان فقط UI باربر داره، بدون بک‌اند)، وضعیت Completed
- **فاز ۶ — Reviews:** امتیاز/نظر مشتری، خلاصه‌ی امتیاز باربر
- **فاز ۷ — Notifications:** PWA Push، تنظیمات نوتیفیکیشن، نوتیفیکیشن رویدادمحور
- **فاز ۸ — Advanced Integrations:** واتس‌اپ، پیامک، گزارش‌گیری پیشرفته

### بک‌اند (هنوز اصلاً شروع نشده)
- هیچ API واقعی وصل نیست؛ همه‌چیز mock در `lib/data/` است.
- سند اولیه FastAPI + PostgreSQL رو پیشنهاد داده بود.
- Availability Engine (محاسبه‌ی اسلات‌های آزاد بر اساس ساعات کاری + بلاک‌شده‌ها + مرخصی + تعطیلات + نوبت‌های موجود) باید سمت سرور باشه — فعلاً پیاده نشده.
- سیستم احراز هویت واقعی (JWT/session) وصل نیست؛ صفحه‌ی `/login` فقط UI است.

---

## ۷. مرحله‌ی فعلی

**در حال کار روی فاز ۴ (پنل ادمین)، درست بعد از اسکلت اولیه (session + nav + layout + dashboard).**
قدم بعدی تصمیم‌گیری‌شده: ساخت صفحه‌ی مدیریت باربرها (`/admin/barbers`) که مستقیم از `lib/data/barbers.ts` می‌خونه و امکان تغییر نوع/پرمیشن باربر رو از UI می‌ده.

نکته‌ی باز: صفحه‌ی `/register` (که از `/login` بهش لینک داده شده) هنوز ساخته نشده.
