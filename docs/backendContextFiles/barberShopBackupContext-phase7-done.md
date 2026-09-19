# barberShopBackupContext.md

> این فایل، مرجع کامل وضعیت پروژه‌ست. هر چت جدیدی که با Claude درباره‌ی این
> پروژه باز می‌شه، باید این فایل رو بخونه تا بفهمه داستان از چه قراره.
> هر مرحله از نقشه‌راه فقط وقتی تیک می‌خوره که کاربر (صاحب پروژه) تست کرده و
> تایید کرده که کار می‌کنه. تا اون موقع `[ ]` می‌مونه.

آخرین به‌روزرسانی: **فاز ۶ (امتیازدهی) تمام و تایید شد ✅.** **فاز ۷
(نوتیفیکیشن) هم تمام و تایید شد ✅** — مدل `Notification`، Web Push
(VAPID + subscribe/unsubscribe)، endpointهای `/notifications/me`،
`/notifications/:id/read`، `/notifications/read-all`، کامپوننت
`NotificationBell` تو سه پنل (admin/barber/customer) **و حالا هدر سایت
عمومی هم** (`components/header.tsx`)، و یک باگ رفع شد: زنگوله تو هدر
عمومی سایت اصلاً import نشده بود، اضافه شد و تست/تایید شد. قدم بعدی: فاز
۸ (گزارش‌ها و پنل مدیر سالن).

⚠️ **نکته‌ی مهم برای Claude در چت بعدی:** جزئیات دقیق پیاده‌سازی مدل
`Notification` و ماژول بک‌اندش (فیلدهای دقیق، ساختار سرویس، نحوه‌ی وصل‌شدن
رویدادهای فاز ۴ تا ۶ به نوتیفیکیشن) تو یه چت جداگانه انجام شده و این فایل
فقط از روی کدی که تو یه چت دیگه (دیباگ زنگوله) دیده شده مستندسازی شده. قبل
از دست‌زدن به بک‌اند نوتیفیکیشن، حتماً فایل‌های واقعی
(`server/src/modules/notifications/`) رو بخون، فرض نکن.

---

## ⚠️ نکته‌ی حیاتی درباره‌ی سبک همکاری

**صاحب پروژه قصد یادگیری کدنویسی نداره.** هدف صرفاً راه‌اندازی و تحویل
پروژه‌ی کارکرده‌ست، نه آموزش. یعنی تو هر چت بعدی:
- Claude باید کارها رو مستقیماً خودش انجام بده (نوشتن فایل‌ها، اجرای
  دستورات لازم در sandbox، دادن دستورات آماده‌ی کپی‌پیست برای چیزهایی که
  فقط روی سیستم خودِ کاربر قابل اجراست مثل `npm install` یا ست‌کردن دیتابیس).
- به‌جای توضیح مفهومی طولانی یا آموزش «چرا این‌جوری»، باید نتیجه/فایل
  نهایی رو تحویل بده و فقط در حد لازم خلاصه توضیح بده.
- سوال بپرس فقط وقتی تصمیمی معماری/محصولی لازمه که Claude نمی‌تونه خودش
  حدس بزنه؛ در غیر این صورت با بهترین‌ practice پیش بره و ادامه بده.
- **کار قدم‌به‌قدم**: کاربر می‌خواد مشکلات یکی‌یکی حل بشن («شمرده شمرده»)،
  نه همه با هم. حدس نزن؛ اگه فایلی لازمه، اسم/دستور پیداکردنش رو بگو
  (کاربر ویندوز/PowerShell داره — `grep` نیست، از
  `Get-ChildItem ... | Select-String` استفاده کن).
- فایل‌های واقعی کاربر رو قبل از تغییر بخون؛ اگه کاربر فایلی فرستاد که با
  نسخه‌ی تحویل‌داده‌شده‌ی قبلی فرق داره، یعنی هنوز جایگزین نکرده — نسخه‌ی
  خودش مبنای کار نیست، بهش بگو.
- **فایل‌ها همیشه کامل تحویل داده بشن** (کل محتوای فایل، آماده‌ی
  کپی‌پیست)، نه diff یا «این خط رو اضافه کن». همراه هر فایل مسیر دقیقش تو
  پروژه گفته بشه.

---

## ۱. معرفی کلی پروژه

سایت رزرو نوبت یک **آرایشگاه مردانه**، کاملاً **فارسی** (RTL)، با نسخه‌ی
**PWA** (قابل نصب روی گوشی). فرانت تقریباً تکمیله. بک‌اند از صفر ساخته شده
(فاز ۱ تا ۷ تمام) و جایگزین لایه‌ی mock قدیمی شده.

## ۲. استک فنی

| بخش | تکنولوژی |
|---|---|
| فرانت | Next.js 14 (App Router)، TypeScript، Tailwind، shadcn/radix-ui، react-hook-form + zod، react-multi-date-picker (تقویم جلالی) |
| بک‌اند | Node.js + **Express** + **Prisma ORM** (TypeScript) |
| دیتابیس | **PostgreSQL** |
| احراز هویت | JWT (Bearer token)، bcrypt برای هش پسورد |
| نوتیفیکیشن | **Web Push API** استاندارد (پکیج `web-push`, رایگان، بدون سرویس ثالث) + جدول `Notification` برای inbox داخل پنل — ✅ پیاده و تست شد |
| محل بک‌اند | پوشه‌ی `server/` **داخل همین ریپو** (نه ریپوی جدا)، پکیج جدا از فرانت |

مسیر واقعی پروژه روی سیستم کاربر: `D:\workarea\barBerShop\barbershop\`

## ۳. ساختار فرانت (خلاصه)

```
app/
  (site)/            صفحه اصلی، booking، login، register  — عمومی
  admin/             پنل ادمین: dashboard, barbers, services, bookings, holidays, reports, settings, leave-requests
  barber/            پنل آرایشگر: dashboard, bookings, customers, schedule, services, time-off, block-slots
  customer/          پنل مشتری: dashboard, bookings, history, profile
components/          UI کامپوننت‌ها (shadcn-style) + نوبار/سایدبار مخصوص هر نقش
  notification-bell.tsx   ← زنگوله‌ی نوتیفیکیشن، تو admin/barber/customer layout و هدر عمومی
lib/
  api.ts             تمام توابع API واقعی (fetch wrapper + توابع تایپ‌شده به‌ازای هر endpoint)
  auth-context.tsx   AuthProvider واقعی (JWT)، هوک useAuth()
  push-notifications.ts   enablePushNotifications, getNotificationPermission
  data/mock-session.ts    دیگه mock نیست؛ کش سبک سشن (شامل توکن واقعی JWT) تو localStorage.
                           getAuthToken() از همین‌جا استفاده می‌شه.
  data/*.ts          بقیه‌ی فایل‌های قدیمی mock (services.ts, barbers.ts, ...) دیگه برای
                      CRUD استفاده نمی‌شن؛ فقط بعضی‌هاشون (مثل SERVICE_ICONS) برای
                      تایپ/نگاشت آیکون هنوز import می‌شن.
```

### استراکچر کامل `app/`

```
app/
│   globals.css
│   layout.tsx                   ← AuthProvider کل اپ رو می‌پیچه
│
├───(site)                       ← عمومی، بدون نیاز به لاگین
│   │   layout.tsx
│   │   page.tsx                 ← صفحه اصلی
│   │
│   ├───booking
│   │       page.tsx             ← فرم رزرو نوبت (دو مسیر: آرایشگر/سرویس) + SlotHold + پیش‌فاکتور
│   │
│   ├───login
│   │       page.tsx
│   │
│   └───register
│           page.tsx             ← فقط رول CUSTOMER می‌سازه
│
├───admin
│   │   layout.tsx                ← NotificationBell + UserMenu
│   │
│   ├───barbers          page.tsx  ← افزودن/ویرایش آرایشگر + پرمیشن‌ها
│   ├───bookings          page.tsx  ← لیست کل نوبت‌های سالن
│   ├───dashboard         page.tsx
│   ├───holidays          page.tsx  ← تعطیلات سالن + مرخصی آرایشگرها
│   ├───leave-requests    page.tsx  ← بررسی درخواست‌های مرخصی
│   ├───reports           page.tsx  ← گزارش‌ها (فاز ۸، هنوز باقی‌مونده)
│   ├───services          page.tsx  ← CRUD خدمات + قیمت پیش‌فرض سالن
│   └───settings          page.tsx  ← اطلاعات سالن، ساعات کاری، تغییر رمز ادمین
│
├───barber
│   │   layout.tsx                ← NotificationBell + UserMenu
│   │   page.tsx
│   │
│   ├───block-slots       page.tsx  ← بستن ساعت خاص (پرمیشن blockSlots)
│   ├───bookings          page.tsx  ← همه‌ی نوبت‌ها (۴ تب) + شروع/پایان سرویس (فقط امروز)
│   ├───customers         page.tsx  ← فقط مشتری‌های خودش
│   ├───dashboard         page.tsx
│   ├───schedule          page.tsx  ← فقط اگه manageSchedule داشته باشه
│   ├───services          page.tsx  ← فقط اگه manageServices/managePricing داشته باشه
│   └───time-off          page.tsx  ← ثبت مستقیم (با پرمیشن) یا درخواست (بدون پرمیشن)
│
└───customer
    │   layout.tsx                ← NotificationBell + UserMenu
    │
    ├───bookings          page.tsx  ← نوبت‌های CONFIRMED + IN_PROGRESS
    ├───dashboard         page.tsx
    ├───history           page.tsx  ← نوبت‌های گذشته + ثبت امتیاز/نظر برای COMPLETED
    └───profile           page.tsx  ← ویرایش اطلاعات + تغییر رمز (چون خودش ثبت‌نام کرده)
```

## ۴. ساختار بک‌اند

> مسیر واقعی: `D:\workarea\barBerShop\barbershop\server\`. `.env` و
> `docker-compose.yml` از قبل تنظیم شدن. نسخه‌ی Prisma **باید همون
> `5.22.0`** بمونه؛ پیشنهاد آپدیت به `8.x` نادیده گرفته بشه.
> Postgres روی هاست `5433`، بک‌اند Express روی `4010`، همه چیز زیر
> پیشوند `/api` mount شده (`http://localhost:4010/api/...`).

```
server/
  prisma/
    schema.prisma     مدل‌های User, BarberProfile, Service, BarberService,
                       Booking, TimeOff, LeaveRequest, BlockedSlot, SlotHold,
                       SalonHoliday, SalonSettings, WorkingHours, Rating, Notification
    seed.ts
  src/
    config/env.ts
    lib/prisma.ts
    middleware/        auth.ts (requireAuth/requireRole), errorHandler.ts
    utils/              jwt.ts, password.ts, asyncHandler.ts, AppError.ts
    modules/
      auth/             login, register, me                              ✅
      services/         CRUD خدمات                                        ✅
      barbers/          CRUD آرایشگر + permissions                        ✅
      bookings/         availability + رزرو + وضعیت‌ها + SlotHold + قیمت   ✅
      blocked-slots/     بستن اسلات خاص (`/blocked-slots/me`)              ✅
      time-off/          مرخصی مستقیم/درخواستی + تایید/رد ادمین            ✅
      holidays/          تعطیلات سالن                                     ✅ (جزئیات پیاده‌سازی ثبت نشده)
      settings/          SalonSettings + WorkingHours                     ✅ (جزئیات پیاده‌سازی ثبت نشده)
      ratings/           امتیاز/نظر (فاز ۶)                                ✅ (جزئیات دقیق پیاده‌سازی ثبت نشده — پایین رو ببین)
      notifications/     inbox + Web Push subscribe (فاز ۷)                ✅ (جزئیات دقیق پیاده‌سازی ثبت نشده — پایین رو ببین)
    routes/index.ts
    app.ts / server.ts
  package.json, tsconfig.json, .env.example, README.md, docker-compose.yml
```

اکانت‌های seed:

| نقش | موبایل | پسورد |
|---|---|---|
| ادمین | 09120000001 | admin123 |
| آرایشگر | 09120000002 | barber123 |
| مشتری | 09120000003 | customer123 |

## ۵. نقش‌ها و سطح دسترسی

### قانون ثبت‌نام و مدیریت نقش‌ها (مهم)
- **ثبت‌نام عمومی (فرم register) همیشه و فقط نقش `CUSTOMER` می‌سازه.**
- نقش‌های `BARBER`, `MANAGER`, `ADMIN` **فقط توسط ادمین** ساخته می‌شن.
- برای این نقش‌ها، **موبایل (یوزرنیم) و پسورد رو خودِ ادمین موقع ساخت
  تعیین می‌کنه**، و خودِ اون کاربر اجازه‌ی تغییر یوزرنیم/پسورد خودش رو
  نداره — فقط ادمین می‌تونه ویرایش/ریست کنه. (این قانون شامل خودِ ادمین
  نمی‌شه.)

### مشتری (Customer)
- تنها رولی که از مسیر عمومی `register` ساخته می‌شه.
- آزاده رمز عبور خودش رو تغییر بده.
- رزرو نوبت با دو مسیر ورودی (اول آرایشگر / اول سرویس).
- صفحه‌ی شخصی: پروفایل، نوبت‌های فعلی، تاریخچه.
- بعد از `COMPLETED`: امتیاز (۱ تا ۵) + نظر (اختیاری) ثبت می‌کنه.
  **امتیازها عمومی هستن.**

### آرایشگر (Barber)
- نمی‌تونه خودش ثبت‌نام کنه؛ فقط ادمین می‌سازه.
- حق تغییر موبایل/پسورد خودش رو نداره.
- پنل شخصی، فقط نوبت‌ها/مشتری‌های خودش.
- پرمیشن‌های اختیاری (هرکدوم جدا توسط ادمین فعال/غیرفعال می‌شه):
  - `manageServices` — فعال/غیرفعال‌کردن موقت سرویس‌های اختصاص‌داده‌شده
  - `managePricing` — قیمت اختصاصی خودش (`customPrice`)
  - `manageSchedule` — انتخاب روزهای کاری هفته (`workingDays`)
  - `manageTimeOff` — ثبت مستقیم مرخصی بدون تایید
  - `blockSlots` — بستن ساعت خاص تو یه روز
  - `cancelOwnBookings` — لغو نوبت‌های تاییدشده‌ی خودش
  - `viewCustomers` — دیدن لیست مشتری‌های خودش
- پرمیشن‌های ثابت: داشبورد/نوبت‌ها/تاریخچه‌ی خودش، شروع/پایان سرویس، ثبت مرخصی.
- شروع/پایان کار: `CONFIRMED → IN_PROGRESS → COMPLETED` روی خودِ `Booking`.

### مدیر سالن (Manager)
- زیرمجموعه‌ی دسترسی ادمین، یک سالن (نه چندسالنی).
- فقط ادمین می‌سازتش؛ خودش حق تغییر یوزرنیم/پسورد نداره.
- دسترسی: همه‌ی نوبت‌ها، گزارش‌ها، لیست آرایشگرها، تایید/رد مرخصی.
- **ندارد**: ساخت/حذف آرایشگر، تغییر پرمیشن آرایشگر، تنظیمات کلی سالن.
- فعلاً پنل اختصاصی نداره، به `/admin/dashboard` ریدایرکت می‌شه (فاز ۸).

### ادمین (Admin)
- بالاترین سطح دسترسی. تنها نقشی که برای بقیه (آرایشگر، مدیر، ادمین
  دیگه) حساب می‌سازه و یوزرنیم/پسورد اولیه تعیین می‌کنه.
- تایید/رد مرخصی، قیمت پیش‌فرض سالن، تعطیلات سالن.

## ۶. جریان‌های کلیدی کسب‌وکار

1. **رزرو نوبت** — دو مسیر ورودی → `Booking` با status اولیه‌ی `CONFIRMED`.
2. **شروع/پایان سرویس** — `IN_PROGRESS` → `COMPLETED`.
3. **امتیازدهی** ✅ — بعد از `COMPLETED`، مشتری امتیاز ۱ تا ۵ + نظر اختیاری
   (تا ۳۰۰ کاراکتر) ثبت می‌کنه؛ فقط یک‌بار، فقط مشتریِ همون نوبت. معدل و
   تعداد آرا عمومی؛ ویرایش/حذف بعد از ثبت نداریم.
4. **مرخصی** — بدون پرمیشن → درخواست → تایید/رد ادمین. با پرمیشن → مستقیم.
5. **نوتیفیکیشن** ✅ — مدل `Notification` (inbox) + Web Push. رویدادهایی
   که به نوتیفیکیشن وصل شدن (بر اساس `NotificationType` تو `lib/api.ts`):
   - `BOOKING_CREATED` — نوبت جدید ثبت شد
   - `BOOKING_STATUS_CHANGED` — تغییر وضعیت نوبت (شروع/پایان/لغو)
   - `LEAVE_REQUEST_STATUS` — تایید/رد درخواست مرخصی
   - `RATING_STATUS` — تایید/رد نظر

## ۷. تصمیم‌ها و توافق‌های ثبت‌شده (Policy Log)

| # | موضوع | تصمیم |
|---|---|---|
| 1 | بک‌اند | Node.js + Express + Prisma، داخل `server/` همین ریپو |
| 2 | دیتابیس | PostgreSQL |
| 3 | نقش «مدیر سالن» | زیرمجموعه‌ی دسترسی ادمین، یک سالن |
| 4 | نوتیفیکیشن | Web Push API (رایگان، حتی با برنامه‌ی بسته می‌رسه) |
| 5 | امتیازدهی | عمومی، همه (حتی قبل از رزرو) می‌بینن |
| 6 | ثبت‌نام عمومی | همیشه رول `CUSTOMER` |
| 7 | ساخت رول‌های غیرمشتری | فقط توسط ادمین |
| 8 | تغییر رمز/یوزرنیم رول‌های غیرمشتری | فقط ادمین می‌تونه تغییر بده |
| 9 | هدف کاربر | فقط راه‌اندازی/تحویل پروژه، نه یادگیری کدنویسی |
| 10 | ایزوله‌سازی از پروژه‌ی دیگه | Postgres تو Docker، پورت‌های اختصاصی (`5433`, `4010`) |
| 11 | قیمت آرایشگر | `BarberService.customPrice` nullable، فقط با `managePricing` |
| 12 | مرخصی | با پرمیشن مستقیم، بدونش `LeaveRequest` |
| 13 | ساعات کاری | ثابت و سراسری سالن (۹–۲۱) |
| 14 | هولد اسلات | ۵ دقیقه، بدون cron، endpointهای عمومی |
| 15 | قیمت ثبت‌شده‌ی نوبت | موقع رزرو تو `Booking.price` ذخیره و ثابت می‌مونه |
| 16 | نمایش قیمت به مشتری | همیشه قیمت همون آرایشگر |
| 17 | بعد از ثبت رزرو | صفحه‌ی پیش‌فاکتور/اطلاعیه، نه برگشت به مرحله‌ی اول |
| 18 | نوبت‌های آرایشگر | همه‌ی نوبت‌ها با تب‌بندی؛ شروع/پایان فقط برای امروز |
| 19 | هدر سایت عمومی | وضعیت لاگین (آواتار/نام/نقش/پنل/خروج) هم تو هدر `(site)` |
| 20 | پرداخت | فقط حضوری و بعد از انجام سرویس |
| 21 | لغو نوبت | مشتری هر وقت بخواد، بدون محدودیت زمانی، تایید دو مرحله‌ای تو UI |
| 22 | خروج از حساب | `clearMockSession()` → event → `AuthContext` هم خالی می‌شه |
| 23 | امتیازدهی (فاز ۶) | هر نوبت فقط یک امتیاز، فقط مشتریِ همون نوبت، فقط وقتی `COMPLETED`؛ ۱ تا ۵ + نظر اختیاری تا ۳۰۰ کاراکتر؛ معدل/تعداد آرا عمومی، متن نظر فقط برای آرایشگر/ادمین؛ بدون ویرایش/حذف |
| 24 | نوتیفیکیشن (فاز ۷) | inbox داخل پنل (`Notification` model) + Web Push موازی؛ زنگوله تو همه‌ی پنل‌ها **و** هدر سایت عمومی وقتی لاگین باشه |

## ۸. نقشه‌راه اجرا

> قانون: هر آیتم فقط بعد از اینکه کاربر تست کرد و در چت گفت «تایید شد»،
> از `[ ]` به `[x]` تغییر می‌کنه.

### فاز ۰ تا ۵ — ✅ همگی تمام (پایه بک‌اند، تست ماژول‌ها، اتصال فرانت،
Bookings، مرخصی/تعطیلات/تنظیمات/پرمیشن‌های آرایشگر)

### ➕ اصلاحات بعد از فاز ۵ (هدر سایت، قیمت، پیش‌فاکتور، نوبت‌های آرایشگر، SlotHold، صفحه‌ی نوبت‌های مشتری) ✅ همگی تست و تایید شد

### فاز ۶ — شروع/پایان کار و امتیازدهی ✅ تمام و تایید شد
- [x] endpoint شروع/پایان سرویس (از فاز ۴)
- [x] مدل و endpoint امتیاز/نظر (`Rating`)
- [x] محاسبه و نمایش معدل امتیاز + تعداد آرا در پروفایل عمومی آرایشگر
- [x] فرم امتیازدهی در پنل مشتری (کارت‌های `COMPLETED` تو تاریخچه)

> ⚠️ طراحی طبق پیشنهاد اولیه‌ی تاییدشده (Policy #23) پیاده شده؛ جزئیات
> دقیق پیاده‌سازی endpointها/schema تو این فایل ثبت نشده — قبل از تغییر،
> `server/src/modules/ratings/` رو بخون.

### فاز ۷ — نوتیفیکیشن ✅ تمام و تایید شد
- [x] مدل `Notification` (inbox داخل پنل)
- [x] راه‌اندازی Web Push (VAPID keys، پکیج `web-push`)
- [x] ذخیره‌ی subscription کاربر (`lib/push-notifications.ts` →
      `subscribePushApi`/`unsubscribePushApi`)
- [x] اتصال رویدادهای فاز ۴ تا ۶ به نوتیفیکیشن (`BOOKING_CREATED`,
      `BOOKING_STATUS_CHANGED`, `LEAVE_REQUEST_STATUS`, `RATING_STATUS`)
- [x] UI نمایش inbox تو هر پنل (`components/notification-bell.tsx`)
- [x] **رفع باگ:** زنگوله تو هدر سایت عمومی (`components/header.tsx`)
      اصلاً import/render نشده بود؛ اضافه شد و تست/تایید شد.

> ⚠️ جزئیات دقیق endpointها/schema بک‌اند نوتیفیکیشن تو این فایل ثبت
> نشده — قبل از تغییر، `server/src/modules/notifications/` رو بخون.
> چیزی که از فرانت (`lib/api.ts`, `notification-bell.tsx`,
> `push-notifications.ts`) مطمئنیم:
> - `GET /notifications/me` → `{ notifications: ApiNotification[], unreadCount: number }`
> - `PATCH /notifications/:id/read` و `PATCH /notifications/read-all`
> - `POST /notifications/subscribe` و `DELETE /notifications/subscribe`
>   با بدنه‌ی `{ endpoint, keys: { p256dh, auth } }`
> - پولینگ فرانت هر ۳۰ ثانیه (`POLL_INTERVAL_MS`) + رفرش موقع باز کردن دراپ‌داون
> - درخواست اجازه‌ی Push فقط یک‌بار (وقتی `Notification.permission === "default"`)

**قدم بعدی: فاز ۸**

### فاز ۸ — گزارش‌ها و پنل مدیر سالن
- [ ] ماژول `reports` (aggregate روی Booking برای admin/reports)
- [ ] تعریف نهایی پرمیشن نقش Manager + پیاده‌سازی پنل اختصاصی

### فاز ۹ — سخت‌سازی و آماده‌سازی دیپلوی
- [ ] rate limiting، helmet، بازبینی امنیتی کلی
- [ ] بررسی نهایی validation همه‌ی endpointها
- [ ] تنظیمات production (env، migrate deploy، لاگ‌گیری)
- [ ] مستندسازی نهایی API

---

## ۹. نکات مهم برای Claude در چت‌های بعدی

- همیشه اول همین فایل رو مرجع بگیر، نه فرض‌های خودت.
- کدی که قبلاً نوشته شده رو تکرار نکن مگر کاربر بگه تغییرش بده.
- هیچ مرحله‌ای رو «تمام‌شده» فرض نکن مگر این فایل صراحتاً `[x]` داشته باشه.
- زبان پاسخ‌ها فارسی، سبک کدنویسی/کامنت‌ها هم فارسی.
- **کاربر قصد یادگیری برنامه‌نویسی نداره** — مستقیم برو سر اجرا و نتیجه،
  تصمیم‌های فنی جزئی رو خودت بگیر، فقط برای تصمیم‌های سطح‌بالا سوال بپرس.
- ثبت‌نام عمومی همیشه رول `CUSTOMER` می‌سازه؛ رول‌های دیگه فقط با ابزار ادمین.
- **فایل‌ها همیشه کامل تحویل داده بشن**، نه diff. همراه هر فایل مسیر
  دقیقش تو پروژه گفته بشه.
- **کار قدم‌به‌قدم**، حدس نزن؛ اگه فایلی لازمه دستور پیداکردنش با
  `Get-ChildItem ... | Select-String` (کاربر PowerShell/ویندوز داره).
- فایل‌های واقعی کاربر رو قبل از تغییر بخون؛ اگه نسخه‌ی کاربر با آخرین
  تحویلی فرق داره یعنی هنوز جایگزین نکرده.
- برای دیباگ مشکلات UI (چیزی که نمایش داده نمی‌شه)، ترتیب موثر: ۱) پیدا
  کردن فایل کامپوننت با grep، ۲) بررسی خود کامپوننت، ۳) بررسی جایی که
  import/render می‌شه (و همه‌ی جاهایی که *باید* render بشه ولی نشده —
  مثل هدر عمومی که این‌بار جا مونده بود)، ۴) چک‌کردن DOM واقعی با
  `document.querySelector(...).outerHTML` تو کنسول مرورگر (مطمئن‌ترین راه
  برای فهمیدن این‌که واقعاً کدوم صفحه/کامپوننت رندر شده).

- مسیرهای واقعی فایل‌های کلیدی: `components/header.tsx` (هدر سایت
  عمومی)، `components/user-menu.tsx`، `components/notification-bell.tsx`،
  `components/role-sidebar.tsx`، `components/admin/admin-sidebar.tsx`،
  `components/barber/barber-sidebar.tsx` (+ `barber-bottom-nav`)،
  `components/customer/customer-sidebar.tsx`،
  `components/customer/booking-card.tsx`،
  `components/customer/status-badge.tsx`، `lib/utils.ts` (شامل
  `formatToman`)، `lib/api.ts`، `lib/auth-context.tsx`،
  `lib/data/mock-session.ts` (شامل `getAuthToken`)،
  `lib/push-notifications.ts`، `lib/hooks/use-current-barber.ts`.
  مسیرهای پنل: `/admin/dashboard`، `/barber/dashboard`،
  `/customer/dashboard` (+ `/customer/bookings`, `/customer/history`,
  `/customer/profile`).
