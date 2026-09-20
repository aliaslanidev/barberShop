# barberShopBackupContext.md

> این فایل، مرجع کامل وضعیت پروژه‌ست. هر چت جدیدی که با Claude درباره‌ی این
> پروژه باز می‌شه، باید این فایل رو بخونه تا بفهمه داستان از چه قراره.
> هر مرحله از نقشه‌راه فقط وقتی تیک می‌خوره که کاربر (صاحب پروژه) تست کرده و
> تایید کرده که کار می‌کنه. تا اون موقع `[ ]` می‌مونه.

آخرین به‌روزرسانی: **فاز ۸ کاملاً و بدون هیچ نکته‌ی باقی‌مونده تمام شد ✅.**
شامل: تعطیلات (۸.۱)، تنظیمات (۸.۲)، گزارش‌ها (۸.۳)، پنل مدیر سالن (۸.۴)، و
اتصال `admin/dashboard` به دیتای واقعی (که از قلم افتاده بود، جدا اضافه
شد). **دیگه هیچ صفحه‌ی mock یا هاردکد تو کل پنل ادمین باقی نمونده.** قدم
بعدی: فاز ۹ (سخت‌سازی و آماده‌سازی دیپلوی).

⚠️ **نکته‌ی مهم درباره‌ی این فایل:** بخش زیادی از فاز ۸ (۸.۱ تعطیلات، ۸.۲
تنظیمات، ۸.۳ گزارش‌ها) تو یه **چت دیگه** انجام و تست شده، نه این چت.
بخش‌های ۸.۴ (پنل Manager) و اتصال داشبورد کاملاً تو همین چت، قدم‌به‌قدم و
با مشاهده‌ی مستقیم کد ساخته و تایید شدن.

---

## ⚠️ نکته‌ی حیاتی درباره‌ی سبک همکاری

**صاحب پروژه قصد یادگیری کدنویسی نداره.** هدف صرفاً راه‌اندازی و تحویل
پروژه‌ی کارکرده‌ست، نه آموزش. یعنی تو هر چت بعدی:
- Claude باید کارها رو مستقیماً خودش انجام بده.
- به‌جای توضیح مفهومی طولانی، نتیجه/فایل نهایی رو تحویل بده.
- سوال بپرس فقط وقتی تصمیمی معماری/محصولی لازمه که Claude نمی‌تونه خودش
  حدس بزنه؛ در غیر این صورت با بهترین practice پیش بره و ادامه بده.
- **کار قدم‌به‌قدم**: مشکلات یکی‌یکی حل بشن، نه همه با هم. دستور پیداکردن
  فایل با `Get-ChildItem ... | Select-String` بده (کاربر PowerShell/ویندوز
  داره، نه grep).
- **فایل‌ها همیشه کامل تحویل داده بشن** — کاربر صریحاً و با تاکید زیاد
  (چندبار، با عصبانیت) خواسته که هیچ‌وقت diff یا دستورالعمل «این خط رو
  اضافه کن» ندیم، همیشه فایل کامل و آماده‌ی جایگزینی.
- **⚠️ قانون سخت‌گیرانه — قبل از فایل کامل، همیشه نسخه‌ی واقعی فعلی رو
  بخواه:** برای هر فایلی که ممکنه قبلاً وجود داشته باشه یا بین چت‌ها/زمان‌ها
  دست‌خورده باشه، Claude **هرگز نباید از حافظه یا حدس، محتوای فایل رو
  بازسازی کنه** — حتی چیزهای به‌ظاهر ساده و کوچیک (مثل یه تابع کمکی تو
  `lib/utils.ts`). همیشه اول `Get-Content` بخواه، بعد فایل کامل و دقیق رو
  بر همون مبنا بساز. این قانون دوبار در این پروژه نقض شده و باعث
  دلخوری/اتلاف وقت کاربر شده:
  1. یک‌بار با `holidays`/`settings` که فایل کانتکست قدیمی اشتباهاً
     «تمام‌شده» ثبت کرده بود.
  2. یک‌بار وقتی Claude به‌جای خواستن `lib/utils.ts`، خودش یه تابع
     `formatToman` مشابه و تکراری ساخت به‌جای استفاده از نسخه‌ی واقعی
     پروژه — با اینکه کار می‌کرد، کیفیت کد رو پایین آورد و اعتماد کاربر
     رو خدشه‌دار کرد.
  **جمع‌بندی:** اگه شک داری یه فایل/تابع/کامپوننت از قبل وجود داره یا
  نه — بپرس و بخواه، هیچ‌وقت نساز/حدس نزن.
- فایل‌های واقعی کاربر رو قبل از تغییر بخون؛ اگه کاربر فایلی فرستاد که با
  نسخه‌ی تحویل‌داده‌شده‌ی قبلی فرق داره، یعنی هنوز جایگزین نکرده.

---

## ۱. معرفی کلی پروژه

سایت رزرو نوبت یک **آرایشگاه مردانه**، کاملاً **فارسی** (RTL)، با نسخه‌ی
**PWA** (قابل نصب روی گوشی، شامل Web Push واقعی که حتی با گوشی قفل/بسته
هم نوتیف می‌رسونه). فرانت و بک‌اند کاملاً به هم وصلن؛ **هیچ صفحه‌ی mock یا
عدد هاردکد تو کل پنل ادمین باقی نمونده.**

## ۲. استک فنی

| بخش | تکنولوژی |
|---|---|
| فرانت | Next.js 14 (App Router)، TypeScript، Tailwind، shadcn/radix-ui، react-hook-form + zod، react-multi-date-picker (تقویم جلالی) |
| بک‌اند | Node.js + **Express** + **Prisma ORM** (TypeScript) |
| دیتابیس | **PostgreSQL** |
| احراز هویت | JWT (Bearer token)، bcrypt برای هش پسورد |
| نوتیفیکیشن | **Web Push API** (پکیج `web-push`) + جدول `Notification` inbox — ✅ کامل تایید شد |
| محل بک‌اند | پوشه‌ی `server/` **داخل همین ریپو**، پکیج جدا از فرانت |

مسیر واقعی پروژه روی سیستم کاربر: `D:\workarea\barBerShop\barbershop\`
(ویندوز، PowerShell)

## ۳. ساختار فرانت

```
app/
  (site)/            صفحه اصلی، booking، login، register — عمومی
  admin/             dashboard, barbers, managers, services, bookings,
                      ratings, holidays, leave-requests, reports, settings
                      ← همه‌شون الان به بک‌اند واقعی وصلن، بدون استثنا
  barber/            dashboard, bookings, customers, schedule, services,
                      time-off, block-slots, reviews
  customer/          dashboard, bookings, history, profile
components/
  notification-bell.tsx    زنگوله‌ی نوتیفیکیشن (admin/barber/customer
                      layout + هدر عمومی سایت)
  header.tsx           هدر سایت عمومی؛ وضعیت لاگین از useAuth() می‌خونه
  admin/
    admin-sidebar.tsx   لینک‌های «مدیران سالن» و «تنظیمات» فقط برای role=admin
    admin-bottom-nav.tsx  همون فیلتر، نسخه‌ی موبایل
lib/
  api.ts              همه‌ی توابع API واقعی (بدون هیچ mock)، شامل بخش
                      Managers و Reports/Dashboard
  utils.ts             شامل `cn`, `toPersianDigits(input: string):
                      string`, `formatToman(value: number): string`
                      (این دو تا رو هر جای دیگه‌ای هم که فرمت پول/عدد
                      فارسی لازم شد، همیشه از همین‌جا import کن، هیچ‌وقت
                      دوباره تعریف نکن)
  auth-context.tsx    AuthProvider واقعی (JWT)، هوک useAuth()
  push-notifications.ts  enablePushNotifications, getNotificationPermission
  data/mock-session.ts   کش سبک سشن (توکن واقعی JWT) تو localStorage.
                      MockRole = "admin"|"barber"|"customer"|"manager"
  data/admin-session.ts  getCurrentAdmin() — هم "admin" هم "manager" رو
                      قبول می‌کنه (AdminInfo.role: "admin"|"manager")
```

### استراکچر کامل `app/admin/` (بعد از فاز ۸ کامل)

```
admin/
│   layout.tsx                ← NotificationBell + UserMenu؛ getCurrentAdmin()
│                                برای هر دو نقش admin/manager کار می‌کنه
├───barbers        page.tsx   ← ✅ محدود شد: فقط role=admin می‌تونه بسازه/
│                                ویرایش/حذف/تغییر پرمیشن/فعال‌سازی کنه؛
│                                manager فقط مشاهده (isAdmin چک می‌شه)
├───bookings        page.tsx
├───dashboard        page.tsx  ← ✅ وصل به /reports/dashboard (نوبت‌های
│                                امروز، آرایشگر فعال، تعداد خدمات، درآمد
│                                این ماه) — دیگه هیچ عدد هاردکدی نداره
├───holidays         page.tsx  ← ✅ فاز ۸.۱، وصل به /holidays
├───leave-requests   page.tsx
├───managers         page.tsx  ← فاز ۸.۴، فقط role=admin (گارد داخل صفحه)
├───ratings          page.tsx
├───reports          page.tsx  ← ✅ فاز ۸.۳، وصل به /reports/bookings-summary
├───services         page.tsx
└───settings         page.tsx  ← ✅ فاز ۸.۲ (API) + گارد isAdmin (فاز ۸.۴)
```

## ۴. ساختار بک‌اند

> مسیر واقعی: `D:\workarea\barBerShop\barbershop\server\`. Postgres روی
> هاست `5433`، Express روی `4010`، همه‌چیز زیر `/api`. Prisma باید
> `5.22.0` بمونه.

**پوشه‌های `server\src\modules\`** (تایید‌شده، کامل):
```
auth
barbers
blocked-slots
bookings
holidays        ← فاز ۸.۱
managers         ← فاز ۸.۴ — ساخته‌شده و تایید‌شده تو همین چت
notifications
ratings
reports          ← فاز ۸.۳ + endpoint اضافه‌ی /dashboard (همین چت)
services
settings         ← فاز ۸.۲
time-off
```

**الگوی هر ماژول:** `<name>.controller.ts`, `<name>.routes.ts`,
`<name>.schema.ts` (zod), `<name>.service.ts`. Mount مرکزی تو
`server/src/routes/index.ts`.

### ماژول `managers` — تایید‌شده کامل
- `managers.schema.ts`: `createManagerSchema` (name, mobile, password)،
  `updateManagerSchema` (همه اختیاری).
- `managers.service.ts`: CRUD ساده روی `User` با `role: "MANAGER"`.
  مدیر سالن پروفایل جدا (مثل `BarberProfile`) نداره؛ `User` هم فیلد
  `isActive` نداره، پس مدیر سالن فعال/غیرفعال‌سازی نداره، فقط حذف.
- `managers.routes.ts`: **همه‌ی route ها `requireAuth,
  requireRole("ADMIN")`** — مدیر سالن به‌هیچ‌وجه نمی‌تونه مدیر سالن دیگه
  بسازه/ویرایش/حذف کنه (Policy #27).
- Endpoint ها: `GET/POST /managers`, `PATCH/DELETE /managers/:id`.

### ماژول `reports` — کامل (شامل endpoint داشبورد، اضافه‌شده تو همین چت)
- `getBookingsSummary()`: `totalCount`, `byStatus` (به‌تفکیک
  `BookingStatus`), `byBarber` (شامل آرایشگرهای بدون نوبت با شمار صفر).
- `getDashboardSummary()` (🆕): `todaysBookingsCount` (نوبت‌های امروز، غیر
  از CANCELLED)، `activeBarbersCount` (`BarberProfile.isActive=true`)،
  `servicesCount` (تعداد کل `Service` — **مدل `Service` فیلد `isActive`
  نداره**، پس مفهوم «سرویس فعال» تو دیتابیس وجود نداره، به‌جاش از تعداد
  کل استفاده شد)، `revenueThisMonth` (مجموع `price` نوبت‌های `COMPLETED`
  این ماه؛ برای نوبت‌های قدیمی که `price` ندارن، از `service.priceValue`
  استفاده می‌شه).
- هر دو endpoint فقط برای `ADMIN`/`MANAGER` (چک تو خودِ controller).
- Endpoint ها: `GET /reports/bookings-summary`, `GET /reports/dashboard`.

### کنترل دسترسی Manager تو فرانت — الگوی تایید‌شده و تکرارپذیر
- `lib/data/admin-session.ts` → `getCurrentAdmin()` هم `"admin"` هم
  `"manager"` رو قبول می‌کنه.
- هر صفحه/کامپوننتی که باید محدود بشه: `const admin = getCurrentAdmin();
  const isAdmin = admin?.role === "admin";` و قابلیت‌های حساس با
  `isAdmin &&` مشروط می‌شن.
- برای محدودیت کامل یه صفحه (مثل `admin/settings`، `admin/managers`): یه
  early return با پیام «دسترسی ندارید» — حتی با زدن مستقیم URL هم بلاک
  می‌شه، نه فقط مخفی‌کردن لینک تو سایدبار.
- `admin/barbers/page.tsx`: مدیر سالن فقط می‌بینه (switch ها `disabled`)؛
  دکمه‌ی افزودن/ویرایش/حذف و ذخیره‌ی پرمیشن/خدمات/فعال‌سازی همه
  `isAdmin &&`.
- سایدبار/بات‌نو: آیتم‌های «مدیران سالن» و «تنظیمات» فقط برای
  `role === "admin"`. برچسب نقش: `admin` → «مدیر سیستم»، `manager` →
  «مدیر سالن».

⚠️ **تصمیم صریح کاربر:** حتی خودِ مدیر سالن هم فقط توسط ادمین اصلی ساخته
می‌شه (دقیقاً مثل آرایشگر) — مدیر سالن هرگز نمی‌تونه مدیر سالن دیگه بسازه.

**اکانت‌های seed:**

| نقش | موبایل | پسورد |
|---|---|---|
| ادمین | 09120000001 | admin123 |
| آرایشگر | 09120000002 | barber123 |
| مشتری | 09120000003 | customer123 |

(مدیر سالن seed نداره — فقط از پنل `/admin/managers` توسط ادمین ساخته می‌شه)

## ۵. مدل کامل Prisma

```
enum Role { ADMIN, MANAGER, BARBER, CUSTOMER }
enum BookingStatus { CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED }
enum Weekday { SATURDAY..FRIDAY }
enum NotificationType { BOOKING_CREATED, BOOKING_STATUS_CHANGED, LEAVE_REQUEST_STATUS, RATING_STATUS }
enum RatingStatus { PENDING, APPROVED, REJECTED }
enum LeaveRequestStatus { PENDING, APPROVED, REJECTED }

User              id, name, mobile(unique), passwordHash, role, ...
                  ⚠️ فیلد isActive نداره — فقط BarberProfile اون رو داره
BarberProfile     id, userId(unique), bio, initials, isActive,
                  manageServices/managePricing/manageSchedule/manageTimeOff/
                  blockSlots/cancelOwnBookings/viewCustomers,
                  workingDays Weekday[]
Service           id, title, desc, priceValue, icon, featured
                  ⚠️ فیلد isActive هم نداره
BarberService     barberId+serviceId (PK ترکیبی)، customPrice؟، isActive
Booking           id, customerId, barberId, serviceId, date, time, status, notes؟, price؟
Rating            id, bookingId(unique), barberId, score, comment؟, status
TimeOff           id, barberId, date — @@unique([barberId, date])
LeaveRequest      id, barberId, date, reason؟, status, reviewedBy؟
BlockedSlot       id, barberId, date, time — @@unique([barberId, date, time])
SlotHold          id, barberId, date, time, expiresAt — @@unique([barberId, date, time])
SalonHoliday      id, date, reason؟          ← فاز ۸.۱
SalonSettings     id="main", name, address, phone  ← فاز ۸.۲
WorkingHours      id, day(unique), isOpen, openTime, closeTime  ← فاز ۸.۲
Notification      id, userId, type, title, body, link؟, isRead
PushSubscription  id, userId, endpoint(unique), p256dh, auth
```

## ۶. نقش‌ها و سطح دسترسی

### قانون ثبت‌نام و مدیریت نقش‌ها
- ثبت‌نام عمومی همیشه و فقط `CUSTOMER` می‌سازه.
- `BARBER` و `MANAGER` فقط توسط **ادمین اصلی** ساخته می‌شن (Policy #7 و
  #26)، با یوزرنیم/پسورد که ادمین تعیین می‌کنه.

### مشتری (Customer) — بدون تغییر

### آرایشگر (Barber) — بدون تغییر

### مدیر سالن (Manager) — ✅ کامل پیاده و تایید شد
- فقط ادمین اصلی می‌سازتش، از `/admin/managers`.
- دسترسی: dashboard, barbers (فقط مشاهده), services, bookings, ratings,
  holidays, leave-requests (تایید/رد مرخصی), reports.
- **ندارد:** ساخت/ویرایش/حذف/تغییر پرمیشن/فعال‌سازی آرایشگر؛
  ساخت/ویرایش/حذف مدیر سالن دیگه؛ تنظیمات کلی سالن.
- پروفایل جدا نداره، پس فعال/غیرفعال‌سازی خودِ اکانتش هم نداره (فقط حذف).

### ادمین (Admin)
- بالاترین دسترسی؛ تنها نقشی که برای بقیه حساب می‌سازه.

## ۷. جریان‌های کلیدی کسب‌وکار

1. **رزرو نوبت** → `Booking` با `CONFIRMED`.
2. **شروع/پایان سرویس** → `IN_PROGRESS` → `COMPLETED`.
3. **امتیازدهی** ✅ — بعد از `COMPLETED`، ۱ بار، فقط مشتریِ همون نوبت.
4. **مرخصی** — بدون پرمیشن → درخواست → تایید/رد ادمین یا مدیر سالن.
5. **نوتیفیکیشن** ✅ — inbox + Web Push واقعی.
6. **مدیریت سالن (فاز ۸)** ✅ — تعطیلات، ساعات کاری، اطلاعات سالن، تغییر
   رمز ادمین، گزارش خلاصه‌ی نوبت‌ها، **و آمار زنده‌ی داشبورد** (نوبت‌های
   امروز، آرایشگر فعال، تعداد خدمات، درآمد این ماه)، همه از بک‌اند واقعی.

## ۸. تصمیم‌ها و توافق‌های ثبت‌شده (Policy Log)

| # | موضوع | تصمیم |
|---|---|---|
| 1 | بک‌اند | Node.js + Express + Prisma، داخل `server/` همین ریپو |
| 2 | دیتابیس | PostgreSQL |
| 3 | نقش «مدیر سالن» | زیرمجموعه‌ی دسترسی ادمین، یک سالن |
| 4 | نوتیفیکیشن | Web Push API |
| 5 | امتیازدهی | عمومی، همه (حتی قبل از رزرو) می‌بینن |
| 6 | ثبت‌نام عمومی | همیشه رول `CUSTOMER` |
| 7 | ساخت رول‌های غیرمشتری | فقط توسط ادمین |
| 8 | تغییر رمز/یوزرنیم رول‌های غیرمشتری | فقط ادمین می‌تونه تغییر بده |
| 9 | هدف کاربر | فقط راه‌اندازی/تحویل پروژه، نه یادگیری کدنویسی |
| 10 | ایزوله‌سازی از پروژه‌ی دیگه | Postgres تو Docker، پورت‌های اختصاصی (`5433`, `4010`) |
| 11 | قیمت آرایشگر | `BarberService.customPrice` nullable، فقط با `managePricing` |
| 12 | مرخصی | با پرمیشن مستقیم، بدونش `LeaveRequest` |
| 13 | ساعات کاری | ثابت و سراسری سالن، الان از `/admin/settings` قابل تغییره |
| 14 | هولد اسلات | ۵ دقیقه، بدون cron، endpointهای عمومی |
| 15 | قیمت ثبت‌شده‌ی نوبت | موقع رزرو تو `Booking.price` ذخیره و ثابت می‌مونه |
| 16 | نمایش قیمت به مشتری | همیشه قیمت همون آرایشگر |
| 17 | بعد از ثبت رزرو | صفحه‌ی پیش‌فاکتور/اطلاعیه |
| 18 | نوبت‌های آرایشگر | همه‌ی نوبت‌ها با تب‌بندی؛ شروع/پایان فقط برای امروز |
| 19 | هدر سایت عمومی | وضعیت لاگین هم تو هدر `(site)` |
| 20 | پرداخت | فقط حضوری و بعد از انجام سرویس — همین قانون تو محاسبه‌ی «درآمد این ماه» هم رعایت شد (فقط نوبت‌های COMPLETED حساب می‌شن) |
| 21 | لغو نوبت | مشتری هر وقت بخواد، بدون محدودیت زمانی |
| 22 | خروج از حساب | `clearMockSession()` → event → `AuthContext` هم خالی می‌شه |
| 23 | امتیازدهی (فاز ۶) | هر نوبت فقط یک امتیاز، فقط مشتریِ همون نوبت، فقط `COMPLETED`؛ ۱ تا ۵ + نظر تا ۳۰۰ کاراکتر؛ معدل/تعداد آرا عمومی؛ بدون ویرایش/حذف |
| 24 | نوتیفیکیشن (فاز ۷) | inbox (`Notification`) + Web Push موازی؛ زنگوله تو همه‌ی پنل‌ها و هدر سایت عمومی |
| 25 | فاز ۸ شامل holidays+settings هم می‌شه | چون این دو ماژول اصلاً بک‌اند نداشتن |
| 26 | معماری پنل Manager | از همون مسیرهای `/admin/...`، با چک `role` تو خودِ صفحات (نه مسیر جدا) |
| 27 | ساخت اکانت Manager | فقط ادمین اصلی؛ مدیر سالن هرگز مدیر سالن دیگه نمی‌سازه |
| 28 | **«خدمات فعال» در داشبورد** | چون `Service` فیلد `isActive` نداره، کارت داشبورد به «تعداد خدمات» (کل) تغییر کرد، نه «خدمات فعال» |
| 29 | **فرمت اعداد/پول** | همیشه از `lib/utils.ts` (`formatToman`, `toPersianDigits`) استفاده بشه؛ هیچ‌وقت این توابع رو جای دیگه دوباره تعریف نکن |

---

## ۹. نقشه‌راه اجرا

### فاز ۰ تا ۷ — ✅ همگی تمام و تایید شده

### فاز ۸ — ✅ تمام و کامل، بدون هیچ نکته‌ی باقی‌مونده

- [x] **۸.۱ ماژول بک‌اند `holidays`**: CRUD روی `SalonHoliday`؛
      `admin/holidays/page.tsx` وصل شد.
- [x] **۸.۲ ماژول بک‌اند `settings`**: `SalonSettings` + `WorkingHours` +
      تغییر رمز ادمین واقعی؛ `admin/settings/page.tsx` وصل شد.
- [x] **۸.۳ ماژول بک‌اند `reports`**: `getBookingsSummaryApi`؛
      `admin/reports/page.tsx` وصل شد.
- [x] **۸.۴ پنل اختصاصی Manager**: ماژول `managers`، تعمیم
      `admin-session.ts`، صفحه‌ی `/admin/managers`، محدودسازی
      `admin/barbers` و `admin/settings`، فیلتر سایدبار/بات‌نو — همه تست
      و تایید شد.
- [x] **۸.۵ اتصال `admin/dashboard` به دیتای واقعی** (جا افتاده از فاز ۸،
      جدا انجام شد): endpoint جدید `GET /reports/dashboard`
      (`todaysBookingsCount`, `activeBarbersCount`, `servicesCount`,
      `revenueThisMonth`)؛ صفحه با `formatToman`/`toPersianDigits` واقعیِ
      `lib/utils.ts` (نه بازسازی‌شده) وصل شد. تست و تایید شد.

**هیچ صفحه یا عدد mock/هاردکدی تو `app/admin` باقی نمونده.**

**قدم بعدی: فاز ۹**

### فاز ۹ — سخت‌سازی و آماده‌سازی دیپلوی
- [ ] rate limiting، helmet، بازبینی امنیتی کلی
- [ ] بررسی نهایی validation همه‌ی endpointها
- [ ] تنظیمات production (env، migrate deploy، لاگ‌گیری)
- [ ] مستندسازی نهایی API

---

## ۱۰. نکات مهم برای Claude در چت‌های بعدی

- همیشه اول همین فایل رو مرجع بگیر، **ولی برای هر فایل/تابع/کامپوننتی که
  ممکنه از قبل وجود داشته باشه یا بین چت‌ها دست‌خورده باشه، همیشه محتوای
  واقعی فعلی رو از کاربر بخواه قبل از اینکه فایل کامل بسازی.** این قانون
  الان سه‌بار در این پروژه نقض شده (بخش «نکته‌ی حیاتی درباره‌ی سبک
  همکاری» بالا رو کامل بخون) و هر بار باعث اتلاف وقت و دلخوری کاربر شده.
  هیچ‌وقت یه تابع کمکی (مثل `formatToman`) رو از نو نساز اگه احتمال داره
  از قبل جایی تو پروژه باشه — بپرس و بخواه.
- کدی که قبلاً نوشته شده رو تکرار نکن مگر کاربر بگه تغییرش بده.
- هیچ مرحله‌ای رو «تمام‌شده» فرض نکن مگر این فایل صراحتاً `[x]` داشته
  باشه.
- زبان پاسخ‌ها فارسی، سبک کدنویسی/کامنت‌ها هم فارسی.
- **کاربر قصد یادگیری برنامه‌نویسی نداره** — مستقیم برو سر اجرا و نتیجه.
- ثبت‌نام عمومی همیشه رول `CUSTOMER`؛ رول‌های دیگه (Barber, Manager) فقط
  با ابزار ادمین.
- **فایل‌ها همیشه کامل تحویل داده بشن**، هیچ‌وقت diff یا «این خط رو اضافه
  کن».
- **کار قدم‌به‌قدم**، حدس نزن.
- برای ساخت ماژول بک‌اند جدید، از یه ماژول موجود هم‌ساختار (مثل
  `blocked-slots` یا `managers`) به‌عنوان الگو استفاده کن.
- برای کنترل دسترسی Manager تو یه صفحه‌ی جدید: الگوی `const admin =
  getCurrentAdmin(); const isAdmin = admin?.role === "admin";` رو بگیر و
  قابلیت‌های حساس رو با `isAdmin &&` مشروط کن.
- برای فرمت پول/عدد فارسی: همیشه `formatToman`/`toPersianDigits` از
  `lib/utils.ts` — هیچ‌وقت دوباره تعریف نکن.
- مدل‌های `User` و `Service` فیلد `isActive` **ندارن** (فقط
  `BarberProfile` و `BarberService` دارن) — این نکته چندجا (مدیریت
  اکانت Manager، آمار داشبورد) اثر گذاشته، حواست باشه اگه فیچر جدیدی به
  «فعال/غیرفعال‌بودن» یه کاربر یا سرویس نیاز داشت، اول باید فیلدش به
  مدل اضافه بشه.
- برای دیباگ مشکلات UI: ۱) پیدا کردن فایل با grep، ۲) بررسی خود
  کامپوننت، ۳) بررسی همه‌ی جاهایی که باید import/render بشه، ۴) چک DOM
  واقعی با `document.querySelector(...).outerHTML` تو کنسول مرورگر.

- مسیرهای واقعی فایل‌های کلیدی: `components/header.tsx`,
  `components/user-menu.tsx`, `components/notification-bell.tsx`,
  `components/role-sidebar.tsx`, `components/role-bottom-nav.tsx`,
  `components/admin/admin-sidebar.tsx`,
  `components/admin/admin-bottom-nav.tsx`,
  `components/barber/barber-sidebar.tsx` (+ `barber-bottom-nav`),
  `components/customer/customer-sidebar.tsx`,
  `components/customer/booking-card.tsx`,
  `components/customer/status-badge.tsx`, `lib/utils.ts` (`cn`,
  `toPersianDigits`, `formatToman`), `lib/api.ts`, `lib/auth-context.tsx`,
  `lib/data/mock-session.ts` (`getAuthToken`، `MockRole` شامل "manager")،
  `lib/data/admin-session.ts` (`getCurrentAdmin`،
  `AdminInfo.role: "admin"|"manager"`), `lib/push-notifications.ts`,
  `lib/hooks/use-current-barber.ts`.
- مسیرهای پنل: `/admin/dashboard`, `/admin/managers` (فقط admin),
  `/barber/dashboard`, `/customer/dashboard` (+ `/customer/bookings`,
  `/customer/history`, `/customer/profile`).
- الگوی ماژول بک‌اند: `<name>.controller.ts`, `<name>.routes.ts`,
  `<name>.schema.ts` (zod), `<name>.service.ts`؛ mount مرکزی تو
  `server/src/routes/index.ts`.
- **مسیرهای بک‌اند کامل الان:** `auth, barbers, blocked-slots, bookings,
  holidays, managers, notifications, ratings, reports, services,
  settings, time-off` — همه mount شده، هیچی کامنت‌شده/ناقص نمونده.
- **endpointهای گزارش:** `GET /reports/bookings-summary` (کل/به‌تفکیک
  وضعیت/به‌تفکیک آرایشگر)، `GET /reports/dashboard` (نوبت امروز، آرایشگر
  فعال، تعداد خدمات، درآمد این ماه) — هر دو فقط `ADMIN`/`MANAGER`.
