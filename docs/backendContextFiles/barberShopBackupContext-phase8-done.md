# barberShopBackupContext.md

> این فایل، مرجع کامل وضعیت پروژه‌ست. هر چت جدیدی که با Claude درباره‌ی این
> پروژه باز می‌شه، باید این فایل رو بخونه تا بفهمه داستان از چه قراره.
> هر مرحله از نقشه‌راه فقط وقتی تیک می‌خوره که کاربر (صاحب پروژه) تست کرده و
> تایید کرده که کار می‌کنه. تا اون موقع `[ ]` می‌مونه.

آخرین به‌روزرسانی: **فاز ۸ (تعطیلات + تنظیمات + گزارش‌ها + پنل مدیر سالن)
تمام و تایید شد ✅.** با این فاز، تمام صفحات پنل ادمین دیگه به بک‌اند واقعی
وصلن — هیچ صفحه‌ی mock تو `app/admin` باقی نمونده. قدم بعدی: فاز ۹
(سخت‌سازی و آماده‌سازی دیپلوی).

⚠️ **نکته‌ی مهم درباره‌ی این فایل:** بخش زیادی از فاز ۸ (۸.۱ تعطیلات، ۸.۲
تنظیمات، ۸.۳ گزارش‌ها) تو یه **چت دیگه** انجام و تست شده، نه این چت. این
فایل جزئیات دقیق پیاده‌سازی بک‌اندشون (`server/src/modules/holidays`,
`settings`, `reports`) رو مستقیماً از کد ندیده — فقط از رو امضای
توابع/تایپ‌های `lib/api.ts` (که مستقیماً خونده شده) استنباط کرده. فقط بخش
۸.۴ (پنل Manager) کاملاً تو همین چت، قدم‌به‌قدم و با مشاهده‌ی مستقیم کد
ساخته و تایید شده.

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
- **فایل‌ها همیشه کامل تحویل داده بشن** (کل محتوای فایل، آماده‌ی
  کپی‌پیست) — کاربر صریحاً و با تاکید زیاد خواسته که هیچ‌وقت diff یا
  دستورالعمل «این خط رو اضافه کن» ندیم، همیشه فایل کامل.
- **⚠️ درس مهم از این چت — ریسک clobber روی فایل‌های مشترک:** وقتی چند
  چت روی یه پروژه کار می‌کنن، فایل‌های محوری مثل `lib/api.ts` و
  `server/src/routes/index.ts` ممکنه بین چت‌ها عوض شده باشن. اگه Claude
  یه فایل کامل رو از رو نسخه‌ی قدیمیِ خودش (تو کانتکست این مکالمه) بسازه و
  کاربر جایگزین کنه، ممکنه کارِ یه چت دیگه پاک بشه. **قانون:** قبل از
  اینکه فایل کامل برای یکی از این فایل‌های محوری/پرتغییر بدی، همیشه اول
  محتوای **فعلی واقعی**‌ش رو از کاربر بخواه (`Get-Content`)، حتی اگه نسخه‌ی
  قدیمی‌تری از قبل تو این مکالمه داری. کاربر ترجیح می‌ده یه قدم اضافه
  (فرستادن فایل) طی بشه تا خطر پاک‌شدن کار دیگران.
- فایل‌های واقعی کاربر رو قبل از تغییر بخون؛ اگه کاربر فایلی فرستاد که با
  نسخه‌ی تحویل‌داده‌شده‌ی قبلی فرق داره، یعنی هنوز جایگزین نکرده.

---

## ۱. معرفی کلی پروژه

سایت رزرو نوبت یک **آرایشگاه مردانه**، کاملاً **فارسی** (RTL)، با نسخه‌ی
**PWA** (قابل نصب روی گوشی، شامل Web Push واقعی که حتی با گوشی قفل/بسته
هم نوتیف می‌رسونه). فرانت و بک‌اند هر دو کامل به هم وصلن؛ **دیگه هیچ صفحه‌ی
mock باقی نمونده.**

## ۲. استک فنی

| بخش | تکنولوژی |
|---|---|
| فرانت | Next.js 14 (App Router)، TypeScript، Tailwind، shadcn/radix-ui، react-hook-form + zod، react-multi-date-picker (تقویم جلالی) |
| بک‌اند | Node.js + **Express** + **Prisma ORM** (TypeScript) |
| دیتابیس | **PostgreSQL** |
| احراز هویت | JWT (Bearer token)، bcrypt برای هش پسورد |
| نوتیفیکیشن | **Web Push API** (پکیج `web-push`) + جدول `Notification` inbox — ✅ کامل تایید شد (هم ارسال از بک‌اند، هم `push`/`notificationclick` listener تو Service Worker) |
| محل بک‌اند | پوشه‌ی `server/` **داخل همین ریپو**، پکیج جدا از فرانت |

مسیر واقعی پروژه روی سیستم کاربر: `D:\workarea\barBerShop\barbershop\`
(ویندوز، PowerShell)

## ۳. ساختار فرانت

```
app/
  (site)/            صفحه اصلی، booking، login، register — عمومی
  admin/             dashboard, barbers, managers, services, bookings,
                      ratings, holidays, leave-requests, reports, settings
                      ← همه‌شون الان به بک‌اند واقعی وصلن
  barber/            dashboard, bookings, customers, schedule, services,
                      time-off, block-slots, reviews
  customer/          dashboard, bookings, history, profile
components/
  notification-bell.tsx    زنگوله‌ی نوتیفیکیشن (admin/barber/customer
                      layout + هدر عمومی سایت)
  header.tsx           هدر سایت عمومی؛ وضعیت لاگین از useAuth() می‌خونه
  admin/
    admin-sidebar.tsx   سایدبار دسکتاپ ادمین/مدیر سالن — لینک‌های
                      «مدیران سالن» و «تنظیمات» فقط برای role=admin
    admin-bottom-nav.tsx  همون فیلتر، نسخه‌ی موبایل
lib/
  api.ts              همه‌ی توابع API واقعی (بدون هیچ mock)
  auth-context.tsx    AuthProvider واقعی (JWT)، هوک useAuth()
  push-notifications.ts  enablePushNotifications, getNotificationPermission
  data/mock-session.ts   کش سبک سشن (توکن واقعی JWT) تو localStorage.
                      MockRole = "admin"|"barber"|"customer"|"manager"
  data/admin-session.ts  getCurrentAdmin() — الان هم "admin" هم "manager"
                      رو قبول می‌کنه (AdminInfo.role: "admin"|"manager")
```

### استراکچر کامل `app/admin/` (بعد از فاز ۸)

```
admin/
│   layout.tsx                ← NotificationBell + UserMenu؛ getCurrentAdmin()
│                                برای هر دو نقش admin/manager کار می‌کنه
├───barbers        page.tsx   ← ✅ محدود شد: فقط role=admin می‌تونه بسازه/
│                                ویرایش/حذف/تغییر پرمیشن/فعال‌سازی کنه؛
│                                manager فقط مشاهده (isAdmin چک می‌شه)
├───bookings        page.tsx
├───dashboard        page.tsx  ⚠️ هنوز اعداد هاردکد داره (نه mock، نه API) —
│                                TODO صریح تو خودِ کد؛ فاز ۸ لمسش نکرد
├───holidays         page.tsx  ← ✅ فاز ۸.۱، وصل به /holidays
├───leave-requests   page.tsx
├───managers         page.tsx  ← 🆕 فاز ۸.۴، فقط role=admin (گارد داخل صفحه)
├───ratings          page.tsx
├───reports          page.tsx  ← ✅ فاز ۸.۳، وصل به /reports/bookings-summary
├───services         page.tsx
└───settings         page.tsx  ← ✅ فاز ۸.۲ (API) + ✅ فاز ۸.۴ (گارد isAdmin
                                 اضافه شد — manager با URL مستقیم هم بلاک می‌شه)
```

## ۴. ساختار بک‌اند

> مسیر واقعی: `D:\workarea\barBerShop\barbershop\server\`. Postgres روی
> هاست `5433`، Express روی `4010`، همه‌چیز زیر `/api`. Prisma باید
> `5.22.0` بمونه.

**پوشه‌های `server\src\modules\`** (تایید‌شده، شامل همه‌ی فاز ۸):
```
auth
barbers
blocked-slots
bookings
holidays        ← ✅ فاز ۸.۱ (جزئیات داخلی مستقیم دیده نشده، فقط از api.ts استنباط)
managers         ← 🆕 فاز ۸.۴ — ساخته‌شده و تایید‌شده تو همین چت
notifications
ratings
reports          ← ✅ فاز ۸.۳ (همون، فقط از api.ts استنباط)
services
settings         ← ✅ فاز ۸.۲ (همون، فقط از api.ts استنباط)
time-off
```

**الگوی هر ماژول (تایید‌شده، همه‌ی ماژول‌ها همینو دنبال می‌کنن):**
`<name>.controller.ts`, `<name>.routes.ts`, `<name>.schema.ts` (zod),
`<name>.service.ts`. Mount مرکزی تو `server/src/routes/index.ts`.

### ماژول `managers` — تایید‌شده کامل (ساخته‌شده تو همین چت)
- `managers.schema.ts`: `createManagerSchema` (name, mobile, password)،
  `updateManagerSchema` (همه اختیاری: name/mobile/password)
- `managers.service.ts`: CRUD ساده روی `User` با `role: "MANAGER"`.
  **مدیر سالن پروفایل جدا (مثل `BarberProfile`) نداره** — فقط یه سطر
  `User`. فیلد `isActive` برای `User` وجود نداره (فقط `BarberProfile`
  اون رو داره)، پس مدیر سالن فعال/غیرفعال‌سازی نداره، فقط حذف.
- `managers.routes.ts`: **همه‌ی route ها `requireAuth, requireRole("ADMIN")`**
  — یعنی مدیر سالن به‌هیچ‌وجه نمی‌تونه مدیر سالن دیگه بسازه/ویرایش/حذف
  کنه؛ این کار همیشه دست ادمین اصلیه (Policy #26).
- Endpoint ها: `GET /managers`, `POST /managers`, `PATCH /managers/:id`,
  `DELETE /managers/:id`.

### کنترل دسترسی Manager تو فرانت — الگوی تایید‌شده
- `lib/data/admin-session.ts` → `getCurrentAdmin()` هم `"admin"` هم
  `"manager"` رو قبول می‌کنه (هر دو اجازه‌ی ورود به `/admin/...` دارن).
- هر صفحه/کامپوننتی که باید محدود بشه، خودش `const admin =
  getCurrentAdmin(); const isAdmin = admin?.role === "admin";` می‌گیره و
  با شرط `isAdmin &&` قابلیت‌های حساس (دکمه‌ها/فرم‌ها) رو نشون/مخفی می‌کنه.
- `admin/settings/page.tsx` یه گارد کامل داره: اگه `admin && !isAdmin`،
  کل صفحه به‌جای محتوا پیام «دسترسی ندارید» نشون می‌ده — یعنی حتی با زدن
  مستقیم URL هم مدیر سالن بلاک می‌شه (نه فقط مخفی‌کردن لینک تو سایدبار).
- `admin/managers/page.tsx` همون الگو رو داره.
- `admin/barbers/page.tsx`: مدیر سالن می‌تونه لیست آرایشگرها و جزئیاتشون
  (پرمیشن‌ها، خدمات) رو **فقط ببینه** (switch ها `disabled`)، ولی دکمه‌ی
  «افزودن آرایشگر»، ویرایش، حذف، و دکمه‌های ذخیره‌ی پرمیشن/خدمات/فعال‌سازی
  همه با `isAdmin &&` مخفی/غیرفعالن.
- `components/admin/admin-sidebar.tsx` و `admin-bottom-nav.tsx`: آیتم‌های
  «مدیران سالن» و «تنظیمات» فقط وقتی `role === "admin"` تو لیست نمایش
  قرار می‌گیرن؛ بقیه‌ی آیتم‌ها (dashboard, barbers, services, bookings,
  ratings, holidays, leave-requests, reports) بین admin و manager مشترکن.
- برچسب نقش تو سایدبار: `admin` → «مدیر سیستم»، `manager` → «مدیر سالن».

⚠️ **این تصمیم صریحاً از کاربر گرفته شده:** حتی خودِ مدیر سالن هم فقط
توسط ادمین اصلی ساخته می‌شه (دقیقاً مثل آرایشگر) — مدیر سالن هرگز نمی‌تونه
مدیر سالن دیگه بسازه.

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
                  ⚠️ فیلد isActive نداره — غیرفعال‌سازی فقط برای
                  BarberProfile معناداره، نه برای User مستقیم (پس
                  ADMIN/MANAGER/CUSTOMER راه غیرفعال‌سازی ندارن، فقط حذف)
BarberProfile     id, userId(unique), bio, initials, isActive,
                  manageServices/managePricing/manageSchedule/manageTimeOff/
                  blockSlots/cancelOwnBookings/viewCustomers,
                  workingDays Weekday[]
Service           id, title, desc, priceValue, icon, featured
BarberService     barberId+serviceId (PK ترکیبی)، customPrice؟، isActive
Booking           id, customerId, barberId, serviceId, date, time, status, notes؟, price؟
Rating            id, bookingId(unique), barberId, score, comment؟, status
TimeOff           id, barberId, date — @@unique([barberId, date])
LeaveRequest      id, barberId, date, reason؟, status, reviewedBy؟
BlockedSlot       id, barberId, date, time — @@unique([barberId, date, time])
SlotHold          id, barberId, date, time, expiresAt — @@unique([barberId, date, time])
SalonHoliday      id, date, reason؟          ← ✅ فاز ۸.۱ ماژولش ساخته شد
SalonSettings     id="main", name, address, phone  ← ✅ فاز ۸.۲ ماژولش ساخته شد
WorkingHours      id, day(unique), isOpen, openTime, closeTime  ← ✅ فاز ۸.۲
Notification      id, userId, type, title, body, link؟, isRead
PushSubscription  id, userId, endpoint(unique), p256dh, auth
```

## ۶. نقش‌ها و سطح دسترسی

### قانون ثبت‌نام و مدیریت نقش‌ها
- ثبت‌نام عمومی همیشه و فقط `CUSTOMER` می‌سازه.
- `BARBER` و `MANAGER` فقط توسط **ادمین اصلی** ساخته می‌شن (Policy #7 و
  #26)، با یوزرنیم/پسورد که ادمین تعیین می‌کنه. این نقش‌ها حق تغییر
  خودشون رو ندارن (به‌جز چیزهایی که صریحاً براشون باز شده).

### مشتری (Customer) — بدون تغییر نسبت به قبل

### آرایشگر (Barber) — بدون تغییر نسبت به قبل

### مدیر سالن (Manager) — ✅ کامل پیاده و تایید شد
- **فقط ادمین اصلی می‌سازتش**، از `/admin/managers`. خودِ مدیر سالن هم حق
  ساخت مدیر سالن دیگه رو نداره.
- دسترسی (تایید‌شده): dashboard, barbers (فقط مشاهده), services, bookings,
  ratings, holidays, leave-requests (تایید/رد مرخصی), reports.
- **ندارد** (تایید‌شده، UI و بک‌اند هر دو محدودش می‌کنن):
  - ساخت/ویرایش/حذف آرایشگر، تغییر پرمیشن آرایشگر، فعال/غیرفعال‌سازی آرایشگر
  - ساخت/ویرایش/حذف مدیر سالن دیگه (`/admin/managers` کلاً غیرقابل‌دسترسیه)
  - تنظیمات کلی سالن (`/admin/settings` کلاً غیرقابل‌دسترسیه، حتی با URL مستقیم)
- پروفایل جدا نداره (فقط `User` با `role=MANAGER`)، پس فعال/غیرفعال‌سازی
  خودِ اکانت مدیر سالن هم وجود نداره (فقط حذف کامل).

### ادمین (Admin)
- بالاترین دسترسی؛ تنها نقشی که برای بقیه (Barber, Manager, Admin دیگه)
  حساب می‌سازه.

## ۷. جریان‌های کلیدی کسب‌وکار

1. **رزرو نوبت** → `Booking` با `CONFIRMED`.
2. **شروع/پایان سرویس** → `IN_PROGRESS` → `COMPLETED`.
3. **امتیازدهی** ✅ — بعد از `COMPLETED`، ۱ بار، فقط مشتریِ همون نوبت.
4. **مرخصی** — بدون پرمیشن → درخواست → تایید/رد ادمین **یا مدیر سالن**.
5. **نوتیفیکیشن** ✅ — inbox + Web Push واقعی (حتی گوشی قفل/بسته، به شرط
   PWA نصب‌شده و iOS 16.4+ برای آیفون).
6. **مدیریت سالن (فاز ۸)** ✅ — تعطیلات سالن، ساعات کاری هفتگی، اطلاعات
   سالن، تغییر رمز ادمین، گزارش خلاصه‌ی نوبت‌ها (تعداد کل/به‌تفکیک وضعیت/
   به‌تفکیک آرایشگر)، همه از بک‌اند واقعی.

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
| 13 | ساعات کاری | ثابت و سراسری سالن (۹–۲۱، الان از `/admin/settings` قابل تغییره) |
| 14 | هولد اسلات | ۵ دقیقه، بدون cron، endpointهای عمومی |
| 15 | قیمت ثبت‌شده‌ی نوبت | موقع رزرو تو `Booking.price` ذخیره و ثابت می‌مونه |
| 16 | نمایش قیمت به مشتری | همیشه قیمت همون آرایشگر |
| 17 | بعد از ثبت رزرو | صفحه‌ی پیش‌فاکتور/اطلاعیه |
| 18 | نوبت‌های آرایشگر | همه‌ی نوبت‌ها با تب‌بندی؛ شروع/پایان فقط برای امروز |
| 19 | هدر سایت عمومی | وضعیت لاگین هم تو هدر `(site)` |
| 20 | پرداخت | فقط حضوری و بعد از انجام سرویس |
| 21 | لغو نوبت | مشتری هر وقت بخواد، بدون محدودیت زمانی |
| 22 | خروج از حساب | `clearMockSession()` → event → `AuthContext` هم خالی می‌شه |
| 23 | امتیازدهی (فاز ۶) | هر نوبت فقط یک امتیاز، فقط مشتریِ همون نوبت، فقط `COMPLETED`؛ ۱ تا ۵ + نظر تا ۳۰۰ کاراکتر؛ معدل/تعداد آرا عمومی؛ بدون ویرایش/حذف |
| 24 | نوتیفیکیشن (فاز ۷) | inbox (`Notification`) + Web Push موازی؛ زنگوله تو همه‌ی پنل‌ها **و** هدر سایت عمومی |
| 25 | فاز ۸ شامل holidays+settings هم می‌شه | چون این دو ماژول اصلاً بک‌اند نداشتن، فاز ۸ فقط `reports` نبود؛ `holidays`+`settings`+`reports`+پنل Manager هر چهارتا اضافه شد |
| 26 | **معماری پنل Manager** | Manager از همون مسیرهای `/admin/...` استفاده می‌کنه (نه مسیر جدا)؛ هر صفحه با چک `role` (ADMIN یا MANAGER) قابلیت‌های محدود رو مخفی/غیرفعال می‌کنه؛ دلیل: صفحات Manager زیرمجموعه‌ی دقیق صفحات Admin‌ان، نه چیز متفاوت، و پروژه از قبل الگوی چک نقش (`requireRole`) رو داره |
| 27 | **ساخت اکانت Manager** | فقط ادمین اصلی می‌تونه مدیر سالن بسازه (دقیقاً مثل آرایشگر)؛ خودِ مدیر سالن هرگز نمی‌تونه مدیر سالن دیگه بسازه/ویرایش/حذف کنه — همه‌ی route های ماژول `managers` با `requireRole("ADMIN")` محافظت شدن |

---

## ۹. نقشه‌راه اجرا

### فاز ۰ تا ۷ — ✅ همگی تمام و تایید شده

### فاز ۸ — ✅ تمام و تایید شد

- [x] **۸.۱ ماژول بک‌اند `holidays`**: CRUD روی `SalonHoliday`؛
      `admin/holidays/page.tsx` به API واقعی وصل شد (`listSalonHolidaysApi`,
      `createSalonHolidayApi`, `deleteSalonHolidayApi`, `listAllTimeOffApi`).
      (جزئیات داخلی ماژول از چت دیگه؛ اینجا فقط از `lib/api.ts` تایید شد.)
- [x] **۸.۲ ماژول بک‌اند `settings`**: `SalonSettings` + `WorkingHours` +
      تغییر رمز ادمین واقعی (`getSettingsApi` عمومی، `updateSalonInfoApi`,
      `updateWorkingHoursApi`, `changePasswordApi` فقط ادمین).
      `admin/settings/page.tsx` به API واقعی وصل شد.
- [x] **۸.۳ ماژول بک‌اند `reports`**: `getBookingsSummaryApi` → مجموع/
      به‌تفکیک‌وضعیت/به‌تفکیک‌آرایشگر. `admin/reports/page.tsx` وصل شد.
- [x] **۸.۴ پنل اختصاصی Manager** — ✅ کامل تو همین چت ساخته و تایید شد:
  - ماژول بک‌اند `managers` (schema/service/controller/routes)، فقط `ADMIN`
  - `lib/data/admin-session.ts` تعمیم داده شد (admin یا manager)
  - `lib/api.ts`: `ApiManager` + `listManagersApi`/`createManagerApi`/
    `updateManagerApi`/`deleteManagerApi`
  - `app/admin/managers/page.tsx` صفحه‌ی جدید (فقط قابل‌مشاهده برای admin)
  - `app/admin/barbers/page.tsx` محدود شد (manager فقط مشاهده)
  - `app/admin/settings/page.tsx` گارد `isAdmin` گرفت (redirect داخل صفحه)
  - `components/admin/admin-sidebar.tsx` و `admin-bottom-nav.tsx`:
    لینک‌های «مدیران سالن»/«تنظیمات» فقط برای admin
  - تست شد: ادمین یه مدیر سالن ساخت، باهاش لاگین شد، محدودیت‌ها تایید شد ✅

> ⚠️ چیزی که فاز ۸ لمس نکرد: `app/admin/dashboard/page.tsx` هنوز اعداد
> کاملاً هاردکد داره («۱۲ نوبت امروز»، «۶ باربر فعال» و...)، با یه TODO
> صریح تو خودِ کد. این تنها صفحه‌ی باقی‌مونده‌ی پنل ادمین که به دیتای
> واقعی وصل نیست.

**قدم بعدی: فاز ۹**

### فاز ۹ — سخت‌سازی و آماده‌سازی دیپلوی
- [ ] `admin/dashboard` رو به API واقعی وصل کن (آمار زنده‌ی نوبت‌های
      امروز، باربرهای فعال، خدمات فعال، درآمد ماه) — این جا افتاد از فاز
      ۸ و باید یا اینجا یا به‌عنوان یه ریز-فاز جدا انجام بشه
- [ ] rate limiting، helmet، بازبینی امنیتی کلی
- [ ] بررسی نهایی validation همه‌ی endpointها
- [ ] تنظیمات production (env، migrate deploy، لاگ‌گیری)
- [ ] مستندسازی نهایی API

---

## ۱۰. نکات مهم برای Claude در چت‌های بعدی

- همیشه اول همین فایل رو مرجع بگیر، **ولی برای فایل‌های محوری/پرتغییر
  (`lib/api.ts`, `server/src/routes/index.ts`, و هر فایلی که ممکنه بین
  چت‌ها دست‌خورده باشه) قبل از ساخت نسخه‌ی کامل جدید، همیشه محتوای واقعی
  فعلی رو از کاربر بخواه** — این فایل قبلاً دوبار در معرض خطای «فرض
  اشتباه» بوده (یک‌بار holidays/settings که اصلاً وجود نداشتن، یک‌بار
  ریسک clobber کردن `lib/api.ts`).
- کدی که قبلاً نوشته شده رو تکرار نکن مگر کاربر بگه تغییرش بده.
- هیچ مرحله‌ای رو «تمام‌شده» فرض نکن مگر این فایل صراحتاً `[x]` داشته
  باشه.
- زبان پاسخ‌ها فارسی، سبک کدنویسی/کامنت‌ها هم فارسی.
- **کاربر قصد یادگیری برنامه‌نویسی نداره** — مستقیم برو سر اجرا و نتیجه.
- ثبت‌نام عمومی همیشه رول `CUSTOMER`؛ رول‌های دیگه (Barber, Manager) فقط
  با ابزار ادمین.
- **فایل‌ها همیشه کامل تحویل داده بشن**، هیچ‌وقت diff یا «این خط رو اضافه
  کن» — کاربر رو این نکته حساسیت زیادی داره.
- **کار قدم‌به‌قدم**، حدس نزن؛ دستور پیداکردن فایل با
  `Get-ChildItem ... | Select-String` بده.
- برای ساخت ماژول بک‌اند جدید، از یه ماژول موجود هم‌ساختار (مثل
  `blocked-slots` یا `managers`) به‌عنوان الگو استفاده کن.
- برای کنترل دسترسی Manager تو یه صفحه‌ی جدید: الگوی `const admin =
  getCurrentAdmin(); const isAdmin = admin?.role === "admin";` رو بگیر و
  قابلیت‌های حساس رو با `isAdmin &&` مشروط کن؛ اگه کل صفحه محدوده، یه
  early return با پیام «دسترسی ندارید» بذار (نمونه‌ش تو
  `admin/settings/page.tsx` و `admin/managers/page.tsx` هست).
- برای دیباگ مشکلات UI، ترتیب موثر: ۱) پیدا کردن فایل با grep، ۲) بررسی
  خود کامپوننت، ۳) بررسی همه‌ی جاهایی که باید import/render بشه، ۴) چک
  DOM واقعی با `document.querySelector(...).outerHTML` تو کنسول مرورگر.

- مسیرهای واقعی فایل‌های کلیدی: `components/header.tsx`,
  `components/user-menu.tsx`, `components/notification-bell.tsx`,
  `components/role-sidebar.tsx`, `components/role-bottom-nav.tsx`,
  `components/admin/admin-sidebar.tsx`,
  `components/admin/admin-bottom-nav.tsx`,
  `components/barber/barber-sidebar.tsx` (+ `barber-bottom-nav`),
  `components/customer/customer-sidebar.tsx`,
  `components/customer/booking-card.tsx`,
  `components/customer/status-badge.tsx`, `lib/utils.ts` (شامل
  `formatToman`), `lib/api.ts`, `lib/auth-context.tsx`,
  `lib/data/mock-session.ts` (شامل `getAuthToken`، `MockRole` شامل
  "manager")، `lib/data/admin-session.ts` (شامل `getCurrentAdmin`،
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
  settings, time-off` — دیگه هیچ ماژول کامنت‌شده/ناقصی تو
  `server/src/routes/index.ts` نمونده.
