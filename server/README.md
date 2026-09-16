# Barbershop Backend

بک‌اند Node.js (Express + Prisma + PostgreSQL) برای پروژه‌ی سالن آرایش.
این پروژه جایگزین mock دیتای فرانت (`lib/data/*.ts`, `mock-session.ts`,
`mock-accounts.ts`) می‌شه.

## پیش‌نیاز

- Node.js 18+
- Docker Desktop (برای بالا آوردن Postgres ایزوله‌ی همین پروژه — چون سیستمت
  یه پروژه‌ی دیگه هم با Docker/دیتابیس داره، اینجا از پورت و volume جدا
  استفاده می‌کنیم تا هیچ تداخلی پیش نیاد)

## راه‌اندازی

```bash
cd server
docker compose up -d        # بالا آوردن Postgres ایزوله (پورت 5433، container: barbershop_postgres)
npm install
cp .env.example .env        # مقادیر پیش‌فرض .env از قبل با تنظیمات همین docker-compose ست شدن
# فقط JWT_SECRET رو تو .env با یه رشته‌ی رندوم طولانی عوض کن

npx prisma migrate dev --name init   # ساخت جدول‌ها
npm run seed                          # پر کردن با داده‌ی اولیه (همون اکانت‌های mock)
npm run dev                           # اجرای سرور روی http://localhost:4010
```

اگه پورت 5433 یا 4010 هم با چیزی رو سیستمت تداخل داشت، بگو عوضشون کنیم.

اکانت‌های seed‌شده (دقیقاً همون‌هایی که تو `mock-accounts.ts` بودن):

| نقش    | موبایل      | رمز عبور    |
| ------ | ----------- | ----------- |
| ادمین  | 09120000001 | admin123    |
| آرایشگر| 09120000002 | barber123   |
| مشتری  | 09120000003 | customer123 |

## ساختار پروژه

```
server/
  prisma/
    schema.prisma   # تعریف جدول‌ها (معادل تایپ‌های lib/data)
    seed.ts          # داده‌ی اولیه برای تست
  src/
    config/env.ts    # خواندن متغیرهای محیطی
    lib/prisma.ts     # نمونه‌ی PrismaClient
    middleware/       # requireAuth, requireRole, errorHandler
    utils/            # jwt, password hash, asyncHandler, AppError
    modules/
      auth/           # login, register, me
      services/       # CRUD خدمات
      barbers/        # CRUD آرایشگر + permissions
      bookings/       # (فاز بعدی)
    routes/index.ts    # ترکیب همه‌ی روترها زیر /api
    app.ts / server.ts
```

هر ماژول از سه لایه تشکیل شده: `*.routes.ts` (مسیرها) →
`*.controller.ts` (خوندن body/params و صدا زدن service) →
`*.service.ts` (منطق واقعی + Prisma). همین الگو رو برای ماژول‌های بعدی
(bookings, time-off, holidays, settings, reports) هم تکرار می‌کنیم.

## اتصال به فرانت

تو پروژه‌ی Next، به‌جای فایل‌های `lib/data/*.ts`، یک لایه‌ی `lib/api.ts`
می‌سازیم که با `fetch` به `http://localhost:4000/api/...` وصل می‌شه و
توکن JWT رو (بعد از لاگین، به‌جای `mock-session.ts`) نگه می‌داره —
این قدم بعدیه، وقتی این بک‌اند بالا اومد باهم انجامش می‌دیم.

## نقشه‌ی راه (فازهای بعدی)

1. ماژول `bookings` — یکی‌سازی منطق `bookings.ts` (دید مشتری) و
   `appointments.ts` (دید آرایشگر) روی یک مدل `Booking` واحد + endpoint
   محاسبه‌ی availability واقعی (به‌جای هش تصادفی `availability.ts`).
2. ماژول‌های `time-off`, `holidays`, `settings/working-hours`.
3. ماژول `reports` (aggregate روی Booking برای گزارش‌های ادمین).
4. جایگزینی `mock-session.ts` تو فرانت با یک AuthContext که توکن رو نگه
   می‌داره و به `Authorization: Bearer <token>` می‌فرسته.
5. Rate limiting / helmet برای امنیت پایه قبل از دیپلوی.
