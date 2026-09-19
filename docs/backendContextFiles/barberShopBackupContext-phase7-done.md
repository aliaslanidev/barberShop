# barberShopBackupContext.md

> این فایل، مرجع کامل وضعیت پروژه‌ست. هر چت جدیدی که با Claude درباره‌ی این
> پروژه باز می‌شه، باید این فایل رو بخونه تا بفهمه داستان از چه قراره.
> هر مرحله از نقشه‌راه فقط وقتی تیک می‌خوره که کاربر (صاحب پروژه) تست کرده و
> تایید کرده که کار می‌کنه. تا اون موقع `[ ]` می‌مونه.

آخرین به‌روزرسانی: **فاز ۶ (امتیازدهی) و فاز ۷ (نوتیفیکیشن) هر دو تمام و
تایید شدن ✅.** تو همین چت، با خوندن مستقیم کد واقعی سرور (نه حدس)، یه
**اشتباه مهم تو فایل کانتکست قبلی کشف و اصلاح شد**: فایل قبلی نوشته بود
ماژول‌های `holidays` و `settings` هم تو فاز ۵ ساخته و تایید شدن، ولی این
**غلط بود** — این دو ماژول اصلاً بک‌اند ندارن و صفحاتشون هنوز کاملاً mock
هستن (پایین، بخش ۴ و ۱۰ رو ببین). فاز ۸ بازتعریف شد تا این دو رو هم شامل
بشه.

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
- **⚠️ درس گرفته‌شده از این چت: فرض «تمام‌شده» رو با کد واقعی چک کن.**
  فایل کانتکست قبلی چیزی رو «تمام‌شده» ثبت کرده بود که وقتی کد واقعی
  خونده شد، معلوم شد اصلاً وجود نداره (بخش holidays/settings). از این به
  بعد، قبل از اینکه بر مبنای این فایل کاری «قبلاً انجام شده» فرض بشه، اگه
  شک هست، با `Get-ChildItem` یا `Get-Content` خود کد رو چک کن، نه فقط این
  سند رو باور کن.

---

## ۱. معرفی کلی پروژه

سایت رزرو نوبت یک **آرایشگاه مردانه**، کاملاً **فارسی** (RTL)، با نسخه‌ی
**PWA** (قابل نصب روی گوشی). فرانت تقریباً تکمیله. بک‌اند از صفر ساخته شده؛
بخش عمده‌ی جایگزینی لایه‌ی mock قدیمی تموم شده، ولی سه صفحه‌ی ادمین
(تعطیلات، تنظیمات، گزارش‌ها) هنوز کاملاً mock هستن — بخش ۴ و ۱۰.

## ۲. استک فنی

| بخش | تکنولوژی |
|---|---|
| فرانت | Next.js 14 (App Router)، TypeScript، Tailwind، shadcn/radix-ui، react-hook-form + zod، react-multi-date-picker (تقویم جلالی) |
| بک‌اند | Node.js + **Express** + **Prisma ORM** (TypeScript) |
| دیتابیس | **PostgreSQL** |
| احراز هویت | JWT (Bearer token)، bcrypt برای هش پسورد |
| نوتیفیکیشن | **Web Push API** استاندارد (پکیج `web-push`) + جدول `Notification` برای inbox داخل پنل — ✅ پیاده و تست شد |
| محل بک‌اند | پوشه‌ی `server/` **داخل همین ریپو**، پکیج جدا از فرانت |

مسیر واقعی پروژه روی سیستم کاربر: `D:\workarea\barBerShop\barbershop\`
(ویندوز، PowerShell — نه `grep`، از `Get-ChildItem ... | Select-String`
استفاده کن)

## ۳. ساختار فرانت (خلاصه)

```
app/
  (site)/            صفحه اصلی، booking، login، register  — عمومی
  admin/             dashboard, barbers, services, bookings, holidays*,
                      reports*, settings*, leave-requests
                      (* = هنوز mock، بک‌اند نداره — بخش ۴ و ۱۰)
  barber/            dashboard, bookings, customers, schedule, services,
                      time-off, block-slots
  customer/          dashboard, bookings, history, profile
components/          UI کامپوننت‌ها + نوبار/سایدبار هر نقش
  notification-bell.tsx   زنگوله‌ی نوتیفیکیشن — تو admin/barber/customer
                      layout و هم تو header.tsx عمومی سایت
  header.tsx          هدر سایت عمومی؛ وضعیت لاگین از useAuth() می‌خونه
lib/
  api.ts             تمام توابع API واقعی (fetch wrapper + تابع تایپ‌شده به‌ازای هر endpoint)
  auth-context.tsx   AuthProvider واقعی (JWT)، هوک useAuth()
  push-notifications.ts   enablePushNotifications, getNotificationPermission
  data/mock-session.ts    دیگه mock نیست؛ فقط کش سبک سشن (شامل توکن واقعی
                      JWT) تو localStorage. getAuthToken() از همین‌جاست.
  data/holidays.ts, salon-settings.ts, mock-accounts.ts, appointments.ts
                      ⚠️ هنوز واقعاً mock هستن و توسط admin/holidays،
                      admin/settings، admin/reports استفاده می‌شن
                      (بخش ۱۰ رو ببین)
```

### استراکچر کامل `app/`

```
app/
│   globals.css
│   layout.tsx                   ← AuthProvider کل اپ رو می‌پیچه
│
├───(site)                       ← عمومی
│   │   layout.tsx
│   │   page.tsx
│   ├───booking       page.tsx   ← رزرو (SlotHold + پیش‌فاکتور)
│   ├───login          page.tsx
│   └───register       page.tsx  ← فقط CUSTOMER
│
├───admin
│   │   layout.tsx                ← NotificationBell + UserMenu
│   ├───barbers        page.tsx
│   ├───bookings        page.tsx
│   ├───dashboard       page.tsx
│   ├───holidays        page.tsx  ⚠️ mock — بخش ۱۰
│   ├───leave-requests  page.tsx
│   ├───reports         page.tsx  ⚠️ mock — بخش ۱۰
│   ├───services        page.tsx
│   └───settings        page.tsx  ⚠️ mock — بخش ۱۰ (شامل تغییر رمز ادمین!)
│
├───barber
│   │   layout.tsx                ← NotificationBell + UserMenu
│   │   page.tsx
│   ├───block-slots     page.tsx
│   ├───bookings        page.tsx
│   ├───customers       page.tsx
│   ├───dashboard       page.tsx
│   ├───schedule        page.tsx
│   ├───services        page.tsx
│   └───time-off        page.tsx
│
└───customer
    │   layout.tsx                ← NotificationBell + UserMenu
    ├───bookings        page.tsx
    ├───dashboard        page.tsx
    ├───history          page.tsx  ← امتیازدهی برای COMPLETED
    └───profile          page.tsx
```

## ۴. ساختار بک‌اند — ✅ مستقیماً از روی کد واقعی تایید شد

> مسیر واقعی: `D:\workarea\barBerShop\barbershop\server\`. Postgres روی
> هاست `5433`، بک‌اند Express روی `4010`، همه‌چیز زیر `/api`. Prisma باید
> `5.22.0` بمونه.

**پوشه‌های واقعی `server\src\modules\`** (خروجی مستقیم `Get-ChildItem`):
```
auth
barbers
blocked-slots
bookings
notifications
ratings
services
time-off
```

**❌ این پوشه‌ها وجود ندارن:** `holidays`, `settings`, `reports`. تو
`server\src\routes\index.ts` این سه به‌صورت TODO کامنت‌شده‌ان:
```ts
// apiRouter.use("/holidays", holidaysRouter);
// apiRouter.use("/settings", settingsRouter);       -> SalonSettings + WorkingHours
// apiRouter.use("/reports", reportsRouter);         -> aggregate query روی Booking
```
با این‌حال، مدل‌های Prisma مربوطه (`SalonHoliday`, `SalonSettings`,
`WorkingHours`) **از قبل تو `schema.prisma` هستن** — فقط لایه‌ی
module/controller/route/service بک‌اندشون ساخته نشده.

**الگوی هر ماژول (تایید شده از `blocked-slots`، `bookings`، `barbers`):**
هر ماژول ۴ فایل داره: `<name>.controller.ts`, `<name>.routes.ts`,
`<name>.schema.ts` (zod), `<name>.service.ts`. روت‌ها مرکزی تو
`server\src\routes\index.ts` mount می‌شن.

**نکات دقیق تایید‌شده از خوندن `bookings.service.ts` و `barbers.service.ts`:**
- `notifyUser(userId, { type, title, body, link })` از
  `@/modules/notifications/notifications.service` import و صدا زده می‌شه؛
  همیشه با `.catch(() => {})` (خطای نوتیف نباید کل عملیات اصلی رو بشکنه).
- رویدادهای نوتیف که *مستقیماً تو کد دیده شدن*:
  - `createBooking` → `BOOKING_CREATED` به آرایشگر
  - `updateBookingStatus` با `IN_PROGRESS` → `BOOKING_STATUS_CHANGED` به مشتری
  - `updateBookingStatus` با `COMPLETED` → `BOOKING_STATUS_CHANGED` به مشتری (با پیام «می‌تونید امتیاز بدید»)
  - `updateBookingStatus` با `CANCELLED` → `BOOKING_STATUS_CHANGED` به طرف مقابل (بسته به اینکه مشتری لغو کرده یا آرایشگر/ادمین)
  - (`LEAVE_REQUEST_STATUS` و `RATING_STATUS` تو enum هستن ولی محل صداشون
    تو این چت مستقیماً دیده نشد — احتمالاً تو `time-off.service.ts` و
    `ratings.service.ts`، ولی این فرضه نه مشاهده؛ قبل از تغییر این دو
    ماژول، خودشون رو بخون.)
- `getAllBarbers`/`getBarberById` تو `barbers.service.ts` از
  `getRatingSummaries`/`EMPTY_RATING_SUMMARY` (از
  `@/modules/ratings/ratings.service`) استفاده می‌کنن تا معدل امتیاز
  و تعداد آرا رو به هر آرایشگر ضمیمه کنن — یعنی فاز ۶ (نمایش معدل تو
  پروفایل عمومی آرایشگر) **قطعاً وصل و پیاده‌سازی شده**.
- `bookingIncludes` شامل `rating: true` هست — یعنی هر `Booking` که
  برگردونده می‌شه، امتیازش (اگه ثبت شده) رو هم همراه داره.
- منطق availability (`getAvailableSlots`, `getSlotsWithStatus`,
  `getAvailableDatesInRange`) بدون تغییر نسبت به فاز قبل کار می‌کنه:
  چک تعطیلی/مرخصی/نوبت‌های موجود/بلاک‌شده/هولدهای فعال.
- `updateBookingStatus` مجوزها: `IN_PROGRESS`/`COMPLETED` فقط آرایشگر خودِ
  نوبت یا ادمین/مدیر؛ `CANCELLED` مشتری خودِ نوبت، یا آرایشگر با
  `cancelOwnBookings`، یا ادمین/مدیر.

**اکانت‌های seed:**

| نقش | موبایل | پسورد |
|---|---|---|
| ادمین | 09120000001 | admin123 |
| آرایشگر | 09120000002 | barber123 |
| مشتری | 09120000003 | customer123 |

## ۵. مدل کامل Prisma — ✅ مستقیماً از `schema.prisma` تایید شد

```
enum Role { ADMIN, MANAGER, BARBER, CUSTOMER }
enum BookingStatus { CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED }
enum Weekday { SATURDAY..FRIDAY }
enum NotificationType { BOOKING_CREATED, BOOKING_STATUS_CHANGED, LEAVE_REQUEST_STATUS, RATING_STATUS }
enum RatingStatus { PENDING, APPROVED, REJECTED }
enum LeaveRequestStatus { PENDING, APPROVED, REJECTED }

User              id, name, mobile(unique), passwordHash, role, ...
                  ← relations: barberProfile, bookings(customer), notifications, pushSubscriptions
BarberProfile     id, userId(unique), bio, initials, isActive,
                  manageServices/managePricing/manageSchedule/manageTimeOff/
                  blockSlots/cancelOwnBookings/viewCustomers (همه Boolean، پیش‌فرض false),
                  workingDays Weekday[] (خالی = پیرو WorkingHours سالن)
Service           id, title, desc, priceValue, icon, featured
BarberService     barberId+serviceId (PK ترکیبی)، customPrice؟، isActive
Booking           id, customerId, barberId, serviceId, date, time, status,
                  notes؟, price؟ (قیمت ثبت‌شده‌ی لحظه‌ی رزرو)
Rating            id, bookingId(unique), barberId, score, comment؟, status(PENDING/APPROVED/REJECTED)
TimeOff           id, barberId, date  — @@unique([barberId, date])
LeaveRequest      id, barberId, date, reason؟, status, reviewedBy؟
BlockedSlot       id, barberId, date, time — @@unique([barberId, date, time])
SlotHold          id, barberId, date, time, expiresAt — @@unique([barberId, date, time])
SalonHoliday      id, date, reason؟                    ← مدل هست، بک‌اند/ماژول نیست
SalonSettings     id="main", name, address, phone       ← مدل هست، بک‌اند/ماژول نیست
WorkingHours      id, day(unique), isOpen, openTime, closeTime  ← مدل هست، بک‌اند/ماژول نیست
Notification      id, userId, type, title, body, link؟, isRead
PushSubscription  id, userId, endpoint(unique), p256dh, auth
```

## ۶. نقش‌ها و سطح دسترسی

### قانون ثبت‌نام و مدیریت نقش‌ها
- ثبت‌نام عمومی همیشه و فقط `CUSTOMER` می‌سازه.
- `BARBER`, `MANAGER`, `ADMIN` فقط توسط ادمین ساخته می‌شن، با یوزرنیم/پسورد
  که خودِ ادمین تعیین می‌کنه. این نقش‌ها حق تغییر خودشون رو ندارن.

### مشتری (Customer)
- تنها رول ثبت‌نام عمومی.
- رزرو با دو مسیر ورودی (اول آرایشگر / اول سرویس).
- بعد از `COMPLETED`: امتیاز ۱ تا ۵ + نظر اختیاری (تا ۳۰۰ کاراکتر)، فقط
  یک‌بار، فقط مشتریِ همون نوبت. **معدل و تعداد آرا عمومی**؛ بدون
  ویرایش/حذف بعد از ثبت.

### آرایشگر (Barber)
- فقط ادمین می‌سازه؛ حق تغییر موبایل/پسورد خودش رو نداره.
- پرمیشن‌های اختیاری (هرکدوم جدا فعال/غیرفعال می‌شه توسط ادمین):
  `manageServices`, `managePricing`, `manageSchedule`, `manageTimeOff`,
  `blockSlots`, `cancelOwnBookings`, `viewCustomers`.
- شروع/پایان کار: `CONFIRMED → IN_PROGRESS → COMPLETED` روی خودِ `Booking`.

### مدیر سالن (Manager)
- زیرمجموعه‌ی دسترسی ادمین، یک سالن. فقط ادمین می‌سازتش.
- دسترسی: همه‌ی نوبت‌ها، گزارش‌ها، لیست آرایشگرها، تایید/رد مرخصی.
- **ندارد**: ساخت/حذف آرایشگر، تغییر پرمیشن آرایشگر، تنظیمات کلی سالن.
- فعلاً پنل اختصاصی نداره، به `/admin/dashboard` ریدایرکت می‌شه (فاز ۸).

### ادمین (Admin)
- بالاترین دسترسی؛ تنها نقشی که برای بقیه حساب می‌سازه.

## ۷. جریان‌های کلیدی کسب‌وکار

1. **رزرو نوبت** → `Booking` با `CONFIRMED`.
2. **شروع/پایان سرویس** → `IN_PROGRESS` → `COMPLETED`.
3. **امتیازدهی** ✅ — بعد از `COMPLETED`، ۱ بار، فقط مشتریِ همون نوبت.
4. **مرخصی** — بدون پرمیشن → درخواست → تایید/رد ادمین. با پرمیشن → مستقیم.
5. **نوتیفیکیشن** ✅ — مدل `Notification` (inbox) + Web Push. رویدادهای
   وصل‌شده (مطابق `NotificationType`): `BOOKING_CREATED`,
   `BOOKING_STATUS_CHANGED` (مستقیماً تو کد `bookings.service.ts` دیده
   شد)، و `LEAVE_REQUEST_STATUS`, `RATING_STATUS` (تو enum هستن، محل صدا
   زدنشون مستقیماً دیده نشده — فرض می‌شه تو `time-off`/`ratings` باشه).

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
| 13 | ساعات کاری | ثابت و سراسری سالن (۹–۲۱) |
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
| 25 | **فاز ۸ شامل holidays+settings هم می‌شه** | چون این دو ماژول اصلاً بک‌اند ندارن (کشف‌شده تو همین چت)، فاز ۸ فقط `reports` نیست؛ باید `holidays`، `settings`، `reports` هر سه ساخته بشن، بعد پنل Manager |

## ۹. فرضیات قبلی — تایید و قطعی (فاز ۰)
- [x] «nest» = Next.js بوده؛ بک‌اند همون Express می‌مونه
- [x] شروع/پایان کار = فقط تغییر status روی همون `Booking`
- [x] مرخصیِ بدون‌پرمیشن → `LeaveRequest` + تایید/رد دستی
- [x] پرمیشن «مدیر سالن» قطعی: دیدن همه‌چی + تایید/رد مرخصی، بدون ساخت/حذف آرایشگر یا تنظیمات کلی

---

## ۱۰. نقشه‌راه اجرا

> قانون: هر آیتم فقط بعد از تست و تایید صریح کاربر از `[ ]` به `[x]`
> تغییر می‌کنه.

### فاز ۰ تا ۵ — ✅ همگی تمام (پایه بک‌اند، تست ماژول‌ها، اتصال فرانت، Bookings، مرخصی/پرمیشن‌های آرایشگر)

> ⚠️ **اصلاحیه‌ی مهم:** نسخه‌ی قبلی این فایل ادعا کرده بود که تو همین فاز
> ۵، ماژول‌های `holidays` و `settings` (بک‌اند) هم ساخته و تست شدن. این
> **نادرست بود**. با چک مستقیم `server\src\modules\` (که فقط `auth,
> barbers, blocked-slots, bookings, notifications, ratings, services,
> time-off` رو داره) و `server\src\routes\index.ts` (که `holidays`،
> `settings`، `reports` رو به‌صورت TODO کامنت کرده)، مشخص شد این دو ماژول
> اصلاً وجود ندارن. صفحات `app/admin/holidays/page.tsx` و
> `app/admin/settings/page.tsx` **مستقیماً بررسی و تایید شد** که هنوز
> کاملاً از فایل‌های mock قدیمی می‌خونن:
> - `admin/holidays` → `lib/data/holidays.ts` (`getAllSalonHolidays`,
>   `addSalonHoliday`, `removeSalonHoliday`) و `lib/data/time-off.ts`
>   (`getAllTimeOff`) و `lib/data/barbers.ts` (`getAllBarbers`، نسخه‌ی
>   mock، نه API واقعی)
> - `admin/settings` → `lib/data/salon-settings.ts` (`getSalonInfo`,
>   `updateSalonInfo`, `getWorkingHours`, `updateWorkingHours`) و
>   `lib/data/mock-accounts.ts` (`updateAccountPassword` — یعنی **تغییر
>   رمز ادمین الان هم صرفاً لوکال/mock هست، اصلاً به بک‌اند واقعی
>   نمی‌رسه!**)
> این دو صفحه از نظر UI کامل و آماده‌ان، فقط لایه‌ی داده‌شون باید از mock
> به API واقعی سوییچ بشه (بعد از اینکه ماژول بک‌اندش ساخته بشه).

### ➕ اصلاحات بعد از فاز ۵ (هدر سایت، قیمت، پیش‌فاکتور، نوبت‌های آرایشگر، SlotHold، صفحه‌ی نوبت‌های مشتری) ✅ همگی تست و تایید شد

### فاز ۶ — شروع/پایان کار و امتیازدهی ✅ تمام و تایید شد
- [x] endpoint شروع/پایان سرویس
- [x] مدل و endpoint امتیاز/نظر (`Rating`) — ماژول `server/src/modules/ratings/` موجود و تایید شد
- [x] محاسبه و نمایش معدل امتیاز + تعداد آرا — **مستقیماً تو کد
      `barbers.service.ts` تایید شد**: `getAllBarbers`/`getBarberById` از
      `getRatingSummaries` استفاده می‌کنن و `rating` رو به خروجی هر
      آرایشگر اضافه می‌کنن.
- [x] فرم امتیازدهی در پنل مشتری

> طراحی طبق Policy #23 پیاده شده. جزئیات دقیق endpointها/controller تو
> `ratings.controller.ts` مستقیماً این چت خونده نشده (فقط از
> `barbers.service.ts` و `bookings.service.ts` — که `Rating` رو
> include/استفاده می‌کنن — استنباط شد)؛ قبل از تغییر ماژول ratings، خودش
> رو بخون.

### فاز ۷ — نوتیفیکیشن ✅ تمام و تایید شد
- [x] مدل `Notification` — تایید شد از `schema.prisma`
- [x] راه‌اندازی Web Push (VAPID، پکیج `web-push`) — تایید شد از
      `lib/push-notifications.ts` (فرانت) و مدل `PushSubscription`
- [x] ذخیره‌ی subscription (`subscribePushApi`/`unsubscribePushApi` در
      `lib/api.ts`؛ POST/DELETE `/notifications/subscribe`)
- [x] اتصال رویدادها — **مستقیماً تو کد `bookings.service.ts` تایید شد**
      که `notifyUser(...)` برای `BOOKING_CREATED` و `BOOKING_STATUS_CHANGED`
      (شروع/پایان/لغو سرویس) صدا زده می‌شه. `LEAVE_REQUEST_STATUS` و
      `RATING_STATUS` تو enum هستن؛ محل دقیق صداشدنشون مستقیماً دیده نشده.
- [x] UI inbox (`components/notification-bell.tsx`) — تو admin/barber/customer layout
- [x] **رفع باگ:** زنگوله تو هدر سایت عمومی (`components/header.tsx`)
      اصلاً import/render نشده بود؛ اضافه و تست/تایید شد
      (`NotificationBell` کنار `UserMenu` وقتی `user` لاگین باشه).

> ساختار endpointهای تایید‌شده از فرانت (`lib/api.ts`):
> - `GET /notifications/me` → `{ notifications: ApiNotification[], unreadCount: number }`
> - `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
> - `POST /notifications/subscribe` / `DELETE /notifications/subscribe` با `{ endpoint, keys: { p256dh, auth } }`
> - پولینگ فرانت هر ۳۰ ثانیه + رفرش موقع باز کردن دراپ‌داون؛ درخواست
>   اجازه‌ی Push فقط یک‌بار (وقتی `Notification.permission === "default"`)

**قدم بعدی: فاز ۸ — بازتعریف‌شده**

### فاز ۸ — تعطیلات، تنظیمات، گزارش‌ها، پنل مدیر سالن

> این فاز الان **۴ زیرقسمت** داره (نسخه‌ی قبلی این فایل فقط `reports` و
> «Manager» رو تو فاز ۸ داشت؛ `holidays`/`settings` رو اشتباهاً فاز ۵
> ثبت کرده بود). هر زیرقسمت قدم‌به‌قدم و جدا انجام و تست می‌شه.

- [ ] **۸.۱ ماژول بک‌اند `holidays`**: CRUD روی `SalonHoliday` (لیست، افزودن،
      حذف). باید هم‌سبک `blocked-slots` (controller+routes+schema+service)
      ساخته بشه. بعدش `app/admin/holidays/page.tsx` از mock
      (`lib/data/holidays.ts`) به `lib/api.ts` سوییچ بشه. (لیست مرخصی
      آرایشگرها تو همین صفحه هم باید از `lib/data/time-off.ts` mock به
      endpoint واقعی `time-off` که از قبل هست سوییچ بشه.)
- [ ] **۸.۲ ماژول بک‌اند `settings`**: `SalonSettings` (نام/آدرس/تلفن
      سالن) + `WorkingHours` (ساعات کاری هفتگی) + endpoint تغییر رمز خودِ
      ادمین (با هش bcrypt واقعی، نه `mock-accounts.ts`). بعدش
      `app/admin/settings/page.tsx` سوییخ بشه.
- [ ] **۸.۳ ماژول بک‌اند `reports`**: aggregate روی `Booking` (تعداد به
      تفکیک وضعیت، تعداد به تفکیک آرایشگر). بعدش `app/admin/reports/page.tsx`
      از mock (`lib/data/appointments.ts`, `lib/data/barbers.ts`) به API
      واقعی سوییچ بشه.
- [ ] **۸.۴ پنل اختصاصی Manager**: تعریف نهایی روت‌ها/UI (الان فقط به
      `/admin/dashboard` ریدایرکت می‌شه)، با دسترسی محدود طبق Policy #3.

### فاز ۹ — سخت‌سازی و آماده‌سازی دیپلوی
- [ ] rate limiting، helmet، بازبینی امنیتی کلی
- [ ] بررسی نهایی validation همه‌ی endpointها
- [ ] تنظیمات production (env، migrate deploy، لاگ‌گیری)
- [ ] مستندسازی نهایی API

---

## ۱۱. نکات مهم برای Claude در چت‌های بعدی

- همیشه اول همین فایل رو مرجع بگیر، **ولی اگه بخشی حیاتیه و شک داری،
  حتماً با کد واقعی چک کن** — این فایل قبلاً یه بار اشتباه ثبت شده بود.
- کدی که قبلاً نوشته شده رو تکرار نکن مگر کاربر بگه تغییرش بده.
- هیچ مرحله‌ای رو «تمام‌شده» فرض نکن مگر این فایل صراحتاً `[x]` داشته باشه
  **و** در صورت شک، با کد واقعی تایید کن.
- زبان پاسخ‌ها فارسی، سبک کدنویسی/کامنت‌ها هم فارسی.
- **کاربر قصد یادگیری برنامه‌نویسی نداره** — مستقیم برو سر اجرا و نتیجه.
- ثبت‌نام عمومی همیشه رول `CUSTOMER`؛ رول‌های دیگه فقط با ابزار ادمین.
- **فایل‌ها همیشه کامل تحویل داده بشن**، نه diff. مسیر دقیق هر فایل تو
  پروژه گفته بشه.
- **کار قدم‌به‌قدم**، حدس نزن؛ دستور پیداکردن فایل با
  `Get-ChildItem ... | Select-String` بده (کاربر PowerShell/ویندوز داره).
- فایل‌های واقعی کاربر رو قبل از تغییر بخون.
- برای ساخت ماژول بک‌اند جدید (holidays/settings/reports)، همیشه از یه
  ماژول موجود هم‌ساختار (مثل `blocked-slots`) به‌عنوان الگوی
  controller/routes/schema/service استفاده کن — این الگو تو پروژه ثابته.
- برای دیباگ مشکلات UI، ترتیب موثر: ۱) پیدا کردن فایل با grep، ۲) بررسی
  خود کامپوننت، ۳) بررسی همه‌ی جاهایی که باید import/render بشه، ۴) چک
  DOM واقعی با `document.querySelector(...).outerHTML` تو کنسول مرورگر.

- مسیرهای واقعی فایل‌های کلیدی فرانت: `components/header.tsx`,
  `components/user-menu.tsx`, `components/notification-bell.tsx`,
  `components/role-sidebar.tsx`, `components/admin/admin-sidebar.tsx`,
  `components/barber/barber-sidebar.tsx` (+ `barber-bottom-nav`),
  `components/customer/customer-sidebar.tsx`,
  `components/customer/booking-card.tsx`,
  `components/customer/status-badge.tsx`, `lib/utils.ts` (شامل
  `formatToman`), `lib/api.ts`, `lib/auth-context.tsx`,
  `lib/data/mock-session.ts` (شامل `getAuthToken`),
  `lib/push-notifications.ts`, `lib/hooks/use-current-barber.ts`.
- مسیرهای mock که هنوز فعالن (فاز ۸ باید جایگزینشون کنه):
  `lib/data/holidays.ts`, `lib/data/salon-settings.ts`,
  `lib/data/mock-accounts.ts`, `lib/data/appointments.ts`,
  `lib/data/barbers.ts` (فقط تو `admin/reports` و `admin/holidays`، نه
  جاهای دیگه که قبلاً به API واقعی وصل شدن).
- مسیرهای پنل: `/admin/dashboard`, `/barber/dashboard`,
  `/customer/dashboard` (+ `/customer/bookings`, `/customer/history`,
  `/customer/profile`).
- الگوی ماژول بک‌اند (تایید‌شده، هر ماژول جدید همینو دنبال کنه):
  `<name>.controller.ts`, `<name>.routes.ts`, `<name>.schema.ts` (zod),
  `<name>.service.ts`؛ mount مرکزی تو `server/src/routes/index.ts`.
