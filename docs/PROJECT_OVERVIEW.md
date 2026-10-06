# BarberShop (salon-arayesh) — شمای کلی پروژه

> این فایل برای این نوشته شده که هر انسان یا AI بتواند بدون توضیح اضافه بفهمد پروژه چیست، چطور ساخته شده و قواعدش چیست.
> آخرین بروزرسانی: 2026-10-06
> بخش‌هایی که با «⚠️ تأیید نشده» علامت خورده‌اند از روی حدس یا اطلاعات قدیمی‌اند و باید با کد چک شوند.

---

## ۱. پروژه چیست؟

یک **PWA برای رزرو نوبت آرایشگاه/سالن** با رابط فارسی، راست‌به‌چپ (RTL).
مشتری نوبت می‌گیرد، آرایشگر نوبت‌ها و برنامه‌اش را مدیریت می‌کند، ادمین و مدیر سالن کل سیستم (آرایشگرها، سرویس‌ها، تعطیلات، گزارش‌ها، نظرها) را کنترل می‌کنند.

- نام پکیج فرانت: `salon-arayesh`
- نام پکیج بک‌اند: `barbershop-server`
- وضعیت: هنوز به هیچ مشتری واقعی داده/فروخته نشده. **تمام دیتای دیتابیس دیتای تستی است** و آزادانه می‌شود آن را ریست یا hard-delete کرد.
- روی لوکال (ویندوز) و روی یک سرور اجرا می‌شود.
- مسیر پروژه روی لوکال: `D:\workarea\barberShop\barberShop`

---

## ۲. استک فنی

### فرانت‌اند (ریشه‌ی ریپو)
- Next.js 14.2.5 (App Router)، React 18، TypeScript
- Tailwind CSS + tailwindcss-animate
- Radix UI (avatar, dialog, dropdown-menu, label, popover, select, slot) با کامپوننت‌های سبک shadcn در `components/ui/`
- react-hook-form + zod + @hookform/resolvers
- @tanstack/react-table **نسخه‌ی ^8.21.3** (نسخه‌ی 9 API ناسازگار دارد؛ نباید ارتقا داده شود)
- react-multi-date-picker (تقویم شمسی)، cmdk، sonner (toast)، lucide-react، react-icons
- فونت: `@fontsource/vazirmatn`
- PWA: `@ducanh2912/next-pwa` (خروجی `public/sw.js` و `sw.js.map` خودکار ساخته می‌شود و در گیت نیست)

### بک‌اند (`server/`)
- Express 4 + TypeScript (CommonJS)، اجرا با `tsx watch` در dev
- Prisma 5 + PostgreSQL 16
- zod برای validation، bcryptjs برای هش پسورد، jsonwebtoken برای JWT، cors، dotenv
- پورت: **4010**، پیشوند API: `/api`

### دیتابیس
- PostgreSQL 16 داخل Docker (`server/docker-compose.yml`)
- کانتینر `barbershop_postgres`، پورت میزبان **5433** (عمداً نه 5432)، volume به نام `barbershop_pgdata`
- یوزر/پسورد/نام دیتابیس در محیط dev: `barbershop`
- روی همان سیستم یک Postgres دیگر برای پروژه‌ی دیگر (aslaniDev) روی پورت 5432 اجرا می‌شود. ریست دیتابیس باربر به آن دست نمی‌زند.

---

## ۳. ساختار پوشه‌ها

```
barberShop/
├─ app/                      # صفحات Next.js (App Router)
│  ├─ layout.tsx
│  ├─ (site)/                # سایت عمومی: صفحه اصلی، booking، login، register
│  ├─ admin/                 # پنل ادمین/مدیر
│  ├─ barber/                # پنل آرایشگر
│  └─ customer/              # پنل مشتری
├─ components/
│  ├─ ui/                    # کامپوننت‌های پایه (button, dialog, data-table, standard-table*, jalali-date-picker, ...)
│  ├─ admin/  barber/  customer/   # sidebar / bottom-nav / nav هر پنل
│  └─ header, notification-bell, role-sidebar, role-bottom-nav, user-menu, waitlist-offer-dialog, ...
├─ lib/
│  ├─ api.ts                 # تمام فراخوانی‌های API + تایپ‌های Api*  (آدرس: NEXT_PUBLIC_API_URL یا http://localhost:4010/api)
│  ├─ auth-context.tsx       # context احراز هویت
│  ├─ status-tones.ts, utils.ts
│  ├─ hooks/use-current-barber.ts
│  └─ data/                  # ⚠️ بیشتر باقی‌مانده‌ی دوره‌ی mock؛ بخش «بدهی‌های فنی» را ببین
├─ worker/                   # سرویس‌ورکر PWA ⚠️ تأیید نشده که دقیقاً چه چیزی در آن است
├─ docs/                     # مستندات
├─ fonts/  public/  types/
└─ server/
   ├─ docker-compose.yml
   ├─ prisma/ (schema.prisma, seed.ts, migrations/)
   └─ src/
      ├─ app.ts, server.ts
      ├─ config/env.ts
      ├─ lib/prisma.ts
      ├─ middleware/ (auth.ts, errorHandler.ts)
      ├─ routes/index.ts
      ├─ utils/ (AppError, asyncHandler, jwt, password, persian-date)
      ├─ scripts/ (seed-working-hours.ts, inspect-working-hours.ts)
      └─ modules/<name>/  # هر ماژول: .controller / .routes / .schema / .service
```

### ماژول‌های بک‌اند
`auth`, `users` (مشتری‌ها), `barbers`, `managers`, `services`, `bookings` (+ `waitlist.service`, `waitlist.job`), `blocked-slots`, `time-off` (مرخصی + درخواست مرخصی), `holidays`, `ratings`, `notifications` (+ `reminders.job`), `reports`, `settings`, `stats`.

---

## ۴. نقش‌ها و دسترسی‌ها

چهار نقش (enum `Role`): `ADMIN`، `MANAGER` (مدیر سالن)، `BARBER`، `CUSTOMER`.

- **ADMIN**: دسترسی کامل. فقط ادمین اصلی می‌تواند آرایشگر/مدیر بسازد، حساب را غیرفعال کند، مشتری را مسدود/آزاد کند، رمز خودش را عوض کند و تنظیمات سالن را تغییر دهد.
- **MANAGER**: کاربر ساده با `role=MANAGER` و بدون `BarberProfile`. فقط ادمین اصلی می‌سازد. به گزارش‌ها، لیست مشتری‌ها (فقط مشاهده)، نظرها و ... دسترسی دارد. ⚠️ تأیید نشده: لیست دقیق دسترسی‌های مدیر.
- **BARBER**: هر آرایشگر یک `BarberProfile` دارد. دسترسی‌های اضافه‌اش **یک مجموعه Boolean جدا روی BarberProfile** است (نه آرایه و نه نوع «حرفه‌ای/معمولی»):
  - `manageServices`, `managePricing`, `manageSchedule`, `manageTimeOff`, `blockSlots`, `cancelOwnBookings`, `viewCustomers`, `exclusiveCustomers`
  - ادمین این‌ها را برای هر آرایشگر جدا تنظیم می‌کند (`PATCH /barbers/:id/permissions`).
- **CUSTOMER**: رزرو، لغو، تاریخچه، امتیاز دادن، لیست انتظار، پروفایل.

> تاریخچه: در طراحی قدیمی فیلد `barberType` (professional/regular) وجود داشت. **حذف شده است** و جایگزین آن پرمیشن‌های جدا شده.

---

## ۵. قواعد دامنه (Business Rules)

### رزرو و زمان‌بندی
- اسلات‌ها **یک‌ساعته و ثابت** هستند. دسترس‌پذیری (availability) **سمت سرور** حساب می‌شود، از:
  ساعت کاری سالن (`WorkingHours`) − تعطیلات سالن (`SalonHoliday`) − مرخصی آرایشگر (`TimeOff`) − اسلات‌های بلاک‌شده (`BlockedSlot`) − رزروهای موجود − نگه‌داری‌های فعال (`SlotHold`).
- `workingDays` روی آرایشگر: آرایه‌ی خالی = پیرو روزهای باز سالن؛ غیرخالی = فقط همان روزها کار می‌کند.
- در یک نوبت می‌شود **چند سرویس** انتخاب کرد (`BookingServiceItem`)؛ فیلد `Booking.serviceId` برای سازگاری با نوبت‌های قدیمی مانده.
- قیمت نهایی موقع رزرو در `Booking.price` ذخیره می‌شود (قیمت اختصاصی آرایشگر `customPrice` یا قیمت پیش‌فرض سرویس). برای نوبت‌های قدیمی `null` است و فرانت از قیمت سرویس استفاده می‌کند.

### نگه‌داری اسلات (SlotHold)
- وقتی مشتری ساعتی را انتخاب می‌کند، اسلات موقتاً نگه داشته می‌شود (پیش‌فرض ۵ دقیقه، قابل تمدید با `PATCH /bookings/hold/:id/extend`، قابل آزادسازی با `DELETE`).
- hold منقضی‌شده در کوئری‌های availability نادیده گرفته می‌شود؛ job جدا برای پاک‌سازی لازم نیست.

### لیست انتظار (Waitlist)
- اگر اسلات پر باشد و `waitlistable` باشد، مشتری می‌تواند در لیست انتظار بنشیند (`SlotWaitlist`).
- با خالی شدن اسلات (لغو)، به نفر اول پیشنهاد (OFFERED) با مهلت (`offerExpiresAt`) داده می‌شود و یک `SlotHold` برایش ساخته می‌شود. وضعیت‌ها: `WAITING → OFFERED → ACCEPTED | CANCELLED | EXPIRED`.
- مشتری پیشنهاد را می‌پذیرد (حتی با جایگزین کردن یک نوبت آینده‌اش، `replaceBookingId`) یا رد می‌کند.
- Job پس‌زمینه: `waitlist.job.ts`.

### وضعیت نوبت
`CONFIRMED → IN_PROGRESS → COMPLETED` یا `CANCELLED`. آرایشگر با دکمه‌ی «شروع سرویس / پایان سرویس» وضعیت را عوض می‌کند. لغو یا بلاک‌کردن اسلات‌ی که نوبت تأییدشده دارد باید از مسیر تأیید/اطلاع‌رسانی برود و بی‌صدا حذف نشود.

### لغو و مسدودسازی مشتری
- هر لغو در جدول `Cancellation` ثبت می‌شود (چه کسی، با چه نقشی، چرا).
- فقط لغوهایی که **خود مشتری** انجام داده به `User.cancelCount` اضافه می‌شود. با **۳ لغو** حساب مشتری خودکار غیرفعال (`isActive=false`) می‌شود. آزاد کردن فقط دستی توسط ادمین است و شمارنده را صفر می‌کند.
- **مشتری هرگز واقعاً Delete نمی‌شود** (فقط فعال/غیرفعال). آرایشگر/مدیر ممکن است واقعاً حذف شوند (ردیف `Cancellation` با `SetNull` می‌ماند).
- غیرفعال‌سازی حساب آرایشگر (`/barbers/:id/account-status`) جدا از `BarberProfile.isActive` (پذیرش نوبت جدید) است و می‌تواند نوبت‌های آینده را لغو و به مشتری اطلاع بدهد.

### مرخصی آرایشگر
- `TimeOff` = مرخصی ثبت‌شده‌ی قطعی (کل روز). `LeaveRequest` = درخواست مرخصی که منتظر تأیید ادمین/مدیر است (`PENDING/APPROVED/REJECTED`).
- `POST /time-off/me` بسته به شرایط یا مرخصی مستقیم می‌سازد یا درخواست؛ پاسخ شامل `type: "TIME_OFF" | "LEAVE_REQUEST"` است.

### امتیاز و نظر
- فقط برای نوبت `COMPLETED` و فقط توسط خود مشتری آن نوبت؛ هر نوبت حداکثر یک امتیاز.
- وضعیت `PENDING/APPROVED/REJECTED`. معدل و تعداد همیشه عمومی است؛ متن نظر فقط وقتی `APPROVED` باشد عمومی می‌شود. آرایشگر و ادمین همه را می‌بینند.
- نوتیفیکیشن «سرویس تمام شد، امتیاز بده» به `/customer/history?review=<bookingId>` لینک می‌شود و فرم امتیاز خودکار باز می‌شود.

### گزارش مالی (بند ۷.۱)
- دو **snapshot** روی هر `Booking` موقع ساخت نوبت ذخیره می‌شود:
  - `isBarberOwnRevenue` (از `managePricing`): درآمد شخصی آرایشگر است، نه درآمد سالن؛ در گزارش سالن حساب نمی‌شود و فقط خود آرایشگر می‌بیند (`/reports/revenue/mine`).
  - `isPrivateCustomer` (از `exclusiveCustomers`): مشتری/نوبت اختصاصی آرایشگر؛ از `/admin/customers`، `/admin/bookings` و شمارش سالن حذف می‌شود.
- این دو پرمیشن کاملاً مستقل از هم هستند.
- فقط نوبت‌های `COMPLETED` در درآمد شمرده می‌شوند.

### نوتیفیکیشن
- inbox داخل پنل هر کاربر (`Notification`) با `link` اختیاری برای کلیک و رفتن به صفحه‌ی مربوط. همچنین `PushSubscription` برای push.
- Job یادآوری نوبت: `reminders.job.ts` (فیلد `Booking.reminderSentAt`).

---

## ۶. مدل‌های دیتابیس (Prisma)

| مدل | نقش |
|---|---|
| `User` | همه‌ی کاربران؛ `mobile` یکتا، `passwordHash`، `role`، `isActive`، `cancelCount`، `blockedReason/At` |
| `BarberProfile` | پروفایل آرایشگر + پرمیشن‌ها + `workingDays` |
| `Service` | سرویس‌ها (`title, desc, priceValue, icon, featured`) |
| `BarberService` | رابطه‌ی آرایشگر↔سرویس با `customPrice` و `isActive` (کلید ترکیبی) |
| `Booking` | نوبت؛ snapshotهای مالی؛ `reminderSentAt` |
| `BookingServiceItem` | سرویس‌های هر نوبت با قیمت ثبت‌شده |
| `Cancellation` | تاریخچه‌ی لغوها |
| `Rating` | امتیاز/نظر هر نوبت |
| `TimeOff` / `LeaveRequest` | مرخصی / درخواست مرخصی |
| `BlockedSlot` | بلاک یک ساعت مشخص |
| `SlotHold` | نگه‌داری موقت اسلات |
| `SlotWaitlist` | لیست انتظار |
| `SalonHoliday` | تعطیلات سالن |
| `SalonSettings` | تنظیمات سالن (ردیف تکی با `id="main"`) |
| `WorkingHours` | ساعت کاری هر روز هفته (روز شروع هفته: شنبه) |
| `Notification` / `PushSubscription` | اعلان‌ها |

Enumها: `Role`, `BookingStatus`, `Weekday`, `NotificationType`, `WaitlistStatus`, `RatingStatus`, `LeaveRequestStatus`.
تاریخ‌ها در دیتابیس میلادی‌اند؛ تبدیل به شمسی سمت نمایش (و `utils/persian-date.ts` در سرور) است.

---

## ۷. API (خلاصه)

پایه: `http://localhost:4010/api`. احراز هویت با JWT در هدر (`token` به فراخوانی‌ها پاس داده می‌شود). تمام تایپ‌ها و توابع در `lib/api.ts`.

| گروه | مسیرهای مهم |
|---|---|
| auth | login / register (`auth.routes`) |
| barbers | `GET/POST /barbers`, `GET/PATCH/DELETE /barbers/:id`, `PATCH /barbers/:id/permissions`, `PATCH /barbers/:id/account-status`, `GET /barbers/:id/future-bookings`, `PATCH /barbers/me/services/:id/price`, `.../active`, `PATCH /barbers/me/working-days` |
| managers | `/managers` CRUD + `PATCH /managers/:id/status` |
| users | `GET /users/customers` (جستجو/فیلتر/مرتب‌سازی/صفحه‌بندی سمت سرور), `PATCH /users/customers/:id/status` |
| bookings | `GET/POST /bookings`, `GET /bookings/:id`, `PATCH /bookings/:id/status`, `GET /bookings/availability`, `/availability-range`, `/my-customers`, hold: `POST /bookings/hold`, `PATCH .../extend`, `DELETE`، waitlist: `/bookings/waitlist` (me / create / delete / accept / decline) |
| time-off | `/time-off/me` (GET/POST/DELETE), `/time-off/me/requests/:id`, `/time-off/requests` (+approve/reject), `/time-off` (همه) |
| blocked-slots | `/blocked-slots/me` (GET/POST/DELETE) |
| holidays | `/holidays` (GET/POST/DELETE) |
| ratings | `POST /ratings`, `GET /ratings/me`, `GET /ratings` (ادمین), `PATCH /ratings/:id/status`, `GET /ratings/public/:barberId` |
| notifications | `/notifications/me`, `/:id/read`, `/read-all` |
| settings | `GET /settings` (عمومی), `PATCH /settings/salon`, `/settings/working-hours/:day`, `/settings/password` |
| reports | `/reports/bookings-summary`, `/reports/dashboard`, `/reports/revenue`, `/reports/revenue/mine` |
| services | CRUD سرویس‌ها |

---

## ۸. مسیرهای فرانت

- **عمومی `(site)`**: `/` (صفحه اصلی)، `/booking`، `/login`، `/register` (فیلدها: نام + موبایل + رمز + تکرار رمز)
- **ادمین `/admin`**: `dashboard`, `barbers`, `bookings`, `customers`, `services`, `holidays`, `leave-requests`, `managers`, `ratings`, `reports`, `settings`
- **آرایشگر `/barber`**: `dashboard`, `bookings`, `customers`, `services`, `schedule`, `time-off`, `block-slots`, `revenue`, `reviews` (منوها بر اساس پرمیشن‌ها نمایش داده می‌شوند و دسترسی مستقیم به URL ممنوع باید پیام عدم دسترسی بدهد)
- **مشتری `/customer`**: `dashboard`, `bookings`, `history`, `profile`

هر پنل `layout.tsx` دارد که نقش را چک می‌کند و در صورت نداشتن دسترسی به `/login` می‌فرستد؛ sidebar برای دسکتاپ و bottom-nav برای موبایل.

### احراز هویت در فرانت
- توکن با `getAuthToken` از `lib/data/mock-session.ts` خوانده می‌شود. **با وجود اسم «mock» این فایل واقعی است** و توکن JWT واقعی را نگه می‌دارد؛ حذفش نکن (یا اگر عوضش می‌کنی، همه‌ی صفحه‌ها را با هم عوض کن).
- `lib/auth-context.tsx` و `lib/hooks/use-current-barber.ts` به همین session وصل‌اند.

---

## ۹. قراردادهای UI / UX

- فارسی‌محور، RTL، فونت Vazirmatn؛ معماری برای چندزبانه‌شدن بعدی باز نگه داشته شده.
- الگوی مشترک پنل ادمین: **جستجو** (آیکون جستجو + دکمه‌ی X برای پاک‌کردن) روی لیست/گرید، و ویرایش درجا با دکمه‌های **«ذخیره / لغو»** که تا وقتی مقدار با مقدار ذخیره‌شده فرق نکرده غیرفعال می‌مانند (ذخیره‌ی خودکار با هر تغییر ممنوع).
- جدول‌ها: `components/ui/data-table.tsx` (wrapper روی @tanstack/react-table v8) + `standard-table*`. روی موبایل جدول‌ها به **کارت** تبدیل می‌شوند (prop `renderMobileCard`، نوار رنگی کنار کارت بر اساس وضعیت).
- در `/admin/barbers` فقط روی موبایل: بخش‌های «دسترسی‌های آرایشگر» و «خدماتی که این آرایشگر انجام می‌دهد» آکاردئون‌اند.
- فیلتر تاریخ در `/admin/bookings`: دکمه‌های امروز/فردا/این‌هفته/همه + تقویم شمسی، صفحه‌بندی ۵/۱۰/۱۵ و ریست به صفحه ۱ با هر تغییر فیلتر.
- پیام خطای لاگین فعلاً یکی است: «شماره موبایل یا رمز عبور اشتباه است».

---

## ۱۰. راه‌اندازی محیط توسعه (لوکال)

```powershell
# 1) دیتابیس
cd D:\workarea\barberShop\barberShop\server
docker compose up -d

# 2) بک‌اند (پورت 4010)
npm install
npx prisma migrate dev       # ساخت/آپدیت جدول‌ها
npm run seed                 # (یا خودکار با migrate reset)
npm run dev

# 3) فرانت (ریشه‌ی پروژه، پورت 3000)
cd ..
npm install
npm run dev
```

متغیرهای `server/.env`: `DATABASE_URL` (مثلاً `postgresql://barbershop:***@localhost:5433/barbershop?schema=public`)، `JWT_SECRET`، `PORT`.
فرانت: `NEXT_PUBLIC_API_URL` (پیش‌فرض `http://localhost:4010/api`). فرانت فایل `.env` ندارد.

### اکانت‌های seed (فقط dev — روی پروداکشن حتماً عوض شوند)
| نقش | موبایل | رمز |
|---|---|---|
| ADMIN | 09120000001 | admin123 |
| BARBER (علی محمدی، همه‌ی پرمیشن‌های اصلی) | 09120000002 | barber123 |
| CUSTOMER | 09120000003 | customer123 |

seed علاوه بر این‌ها دو سرویس (اصلاح مو، اصلاح و فرم ریش)، `SalonSettings` و `WorkingHours` هفت روز (جمعه تعطیل، پنج‌شنبه تا ۱۸ و بقیه تا ۲۰) را می‌سازد. فقط **یک** آرایشگر ساخته می‌شود؛ بقیه را از پنل ادمین بساز.

### ریست دیتای تست
```powershell
# بک‌اند را Ctrl+C کن، بعد:
cd server
npx prisma migrate reset     # پاک‌کردن کل دیتا + migrate + seed
```
اگر به‌جای migrate از `db push` استفاده شده: `npx prisma db push --force-reset`.
قبل از اجرا روی سرور حتماً `DATABASE_URL` را چک کن که به دیتابیس درست اشاره می‌کند.

---

## ۱۱. دیپلوی

- فرانت: `npm run build` سپس `npm run start`. چون `NEXT_PUBLIC_*` موقع **build** داخل کد گذاشته می‌شود، `NEXT_PUBLIC_API_URL` باید **قبل از build** روی سرور ست شود.
- بک‌اند: `npm run build` (tsc + tsc-alias) سپس `npm start` (`node dist/server.js`). ⚠️ تأیید نشده: ابزار نگه‌دارنده‌ی پروسه روی سرور (pm2/systemd/...) و reverse proxy.
- فایل‌های خروجی خودکار نباید در گیت باشند: `.next`, `node_modules`, `tsconfig.tsbuildinfo`, `public/sw.js.map` (و اگر ردیابی می‌شوند `public/sw.js`, `public/workbox-*.js`). فایل‌های `.env` هم هرگز کامیت نمی‌شوند.

---

## ۱۲. بدهی‌های فنی و نکات شناخته‌شده

1. **فایل‌های mock باقی‌مانده در `lib/data/`** که هنوز استفاده می‌شوند:
   - `services.ts` ← لیست ثابت سرویس‌های صفحه اصلی (`app/(site)/page.tsx`) + `SERVICE_ICONS` که پنل ادمین هم استفاده می‌کند
   - `barbers.ts` ← `app/barber/page.tsx`
   - `customer.ts` ← `app/customer/profile/page.tsx` (`currentCustomer`)
   - `customer-session.ts`, `admin-session.ts` ← layoutهای پنل‌ها ⚠️ تأیید نشده که واقعی‌اند یا mock
   - `bookings.ts` ← فقط تایپ `BookingStatus` برای `status-badge.tsx`
   - مرحله‌ی بعدی پاکسازی: وصل‌کردن این صفحه‌ها به API واقعی (`listBarbers()`, `getSettingsApi()`, ...).
   - (فایل‌های مرده‌ی `appointments`, `availability`, `barber-permissions`, `barber-session`, `holidays`, `mock-accounts`, `salon-settings`, `time-off` قبلاً حذف شده‌اند.)
2. `NotificationType` در `lib/api.ts` فقط ۴ مقدار دارد ولی enum دیتابیس ۶ مقدار دارد (`BOOKING_REMINDER` و `SLOT_WAITLIST_OFFER` کم است). کد فرانتی که روی `type` سوییچ می‌کند باید اصلاح شود.
3. صفحه‌ی `/register` ساخته شده؛ پیام خطای لاگین هنوز به «کاربر پیدا نشد» و «رمز اشتباه» تفکیک نشده.
4. پنل آرایشگر ممکن است هنوز صفحه‌های ناقص داشته باشد ⚠️ تأیید نشده.
5. فاز‌بندی قدیمی (Foundation → Booking → Panels → Service tracking → Reviews → Notifications → Integrations مثل واتساپ/SMS): بخش زیادی تا نوتیفیکیشن و push انجام شده؛ **SMS/WhatsApp هنوز نیست**.
6. کامنت‌های فارسی داخل فایل‌ها در PowerShell با `type` خراب (mojibake) نمایش داده می‌شوند؛ خود فایل‌ها UTF-8 و سالم‌اند.
7. بعد از هر تغییر `schema.prisma`: `npx prisma migrate dev --name <name>` و سپس ریستارت بک‌اند.

---

## ۱۳. قراردادهای کاری با AI

- کد کامل و آماده‌ی copy-paste (نه diff جزئی)؛ توضیح مرحله‌به‌مرحله.
- برای شناخت وضعیت واقعی پروژه، از کاربر خروجی دستورهای PowerShell گرفته می‌شود (`dir`, `type`, `Select-String`, `Get-ChildItem -Recurse ...`).
- مسیرها ویندوزی‌اند؛ دستورها PowerShell.
- قبل از حذف فایل، با `tsc --noEmit` یا grep چک شود وابستگی‌ای نیست، و ترجیحاً اول به پوشه‌ی موقت منتقل شود.
- کامیت‌ها کوچک و با پیشوند `chore:` / `feat:` / `fix:` ؛ از `git add -A` کورکورانه استفاده نشود.

---

## ۱۴. متن آماده برای شروع چت جدید با AI

> این پروژه یک PWA رزرو نوبت آرایشگاه است (فرانت Next.js 14 + TypeScript + Tailwind + shadcn، بک‌اند جدا در `server/` با Express + Prisma + PostgreSQL در Docker روی پورت 5433، API روی `localhost:4010/api`). UI فارسی و RTL است. چهار نقش دارد: ADMIN، MANAGER، BARBER، CUSTOMER؛ پرمیشن‌های آرایشگر Booleanهای جدا روی `BarberProfile` هستند. اسلات‌ها یک‌ساعته‌اند و availability سمت سرور حساب می‌شود. لطفاً قبل از هر کاری فایل `PROJECT_OVERVIEW.md` ریپو را بخوان. من کد کامل و copy-paste-ready و راهنمایی مرحله‌به‌مرحله می‌خواهم، دستورها برای PowerShell روی ویندوز.
