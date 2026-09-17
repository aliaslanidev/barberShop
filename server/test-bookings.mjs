// تست خودکار ماژول bookings — اجرا: node test-bookings.mjs
// پیش‌نیاز: قبلش npx tsx src/scripts/seed-working-hours.ts رو یک‌بار اجرا کرده باشی.
const BASE_URL = "http://localhost:4010/api";

let pass = 0;
let fail = 0;

function logResult(name, ok, status, body) {
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${name} — status ${status}`);
  if (!ok) console.log("   body:", JSON.stringify(body));
  ok ? pass++ : fail++;
}

async function req(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* بدنه‌ی خالی */
  }
  return { status: res.status, data };
}

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

async function findOpenDate(barberId) {
  // تا ۱۴ روز جلو می‌گرده تا یه روزی با اسلات خالی پیدا کنه (جمعه‌ها معمولاً تعطیلن)
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = toISODate(d);
    const { data: slots } = await req("GET", `/bookings/availability?barberId=${barberId}&date=${dateStr}`);
    if (Array.isArray(slots) && slots.length > 0) {
      return { dateStr, slot: slots[0] };
    }
  }
  return null;
}

async function main() {
  // ---------- آماده‌سازی: ادمین، یه آرایشگر، یه سرویس ----------
  const adminLogin = await req("POST", "/auth/login", {
    body: { mobile: "09120000001", password: "admin123" },
  });
  logResult("login admin", adminLogin.status === 200, adminLogin.status, adminLogin.data);
  const adminToken = adminLogin.data?.token;

  const barbersList = await req("GET", "/barbers");
  const barber = barbersList.data?.[0];
  logResult("GET /barbers (پیدا کردن یه آرایشگر تست)", !!barber, barbersList.status, barbersList.data);

  const servicesList = await req("GET", "/services");
  const service = servicesList.data?.[0];
  logResult("GET /services (پیدا کردن یه سرویس تست)", !!service, servicesList.status, servicesList.data);

  if (!barber || !service) {
    console.log("\n⚠️ بدون آرایشگر/سرویس نمی‌شه ادامه داد. اول از /admin/barbers و /admin/services یکی بساز.");
    return;
  }

  // ---------- availability ----------
  const openSlot = await findOpenDate(barber.id);
  logResult("پیدا کردن یه تاریخ با اسلات خالی (تا ۱۴ روز جلو)", !!openSlot, 200, openSlot);
  if (!openSlot) {
    console.log("\n⚠️ هیچ اسلات خالی‌ای پیدا نشد — احتمالاً WorkingHours خالیه.");
    console.log("   npx tsx src/scripts/seed-working-hours.ts رو اجرا کن و دوباره تست کن.");
    return;
  }

  // ---------- لاگین به‌عنوان آرایشگر (برای شروع/پایان سرویس) ----------
  const barberLogin = await req("POST", "/auth/login", {
    body: { mobile: barber.user.mobile, password: "barber123" },
  });
  logResult("login barber", barberLogin.status === 200, barberLogin.status, barberLogin.data);
  const barberToken = barberLogin.data?.token;

  // ---------- ثبت‌نام مشتری تست ----------
  const customerMobile = "0911" + Math.floor(1000000 + Math.random() * 8999999);
  const customerReg = await req("POST", "/auth/register", {
    body: { name: "مشتری تست بوکینگ", mobile: customerMobile, password: "test1234" },
  });
  logResult("register customer", customerReg.status === 201, customerReg.status, customerReg.data);
  const customerToken = customerReg.data?.token;

  // ---------- ساخت نوبت ----------
  const created = await req("POST", "/bookings", {
    token: customerToken,
    body: {
      barberId: barber.id,
      serviceId: service.id,
      date: openSlot.dateStr,
      time: openSlot.slot,
      notes: "تست خودکار",
    },
  });
  logResult("POST /bookings", created.status === 201, created.status, created.data);
  const bookingId = created.data?.id;

  // ---------- همون اسلات دیگه نباید تو availability باشه ----------
  const afterCreate = await req(
    "GET",
    `/bookings/availability?barberId=${barber.id}&date=${openSlot.dateStr}`
  );
  const stillThere = afterCreate.data?.includes(openSlot.slot);
  logResult("اسلات رزروشده دیگه تو availability نیست", stillThere === false, afterCreate.status, afterCreate.data);

  // ---------- مشتری لیست نوبت‌های خودش رو می‌بینه ----------
  const customerBookings = await req("GET", "/bookings", { token: customerToken });
  const found = customerBookings.data?.some((b) => b.id === bookingId);
  logResult("GET /bookings (مشتری، باید نوبت خودش رو ببینه)", !!found, customerBookings.status, customerBookings.data);

  // ---------- آرایشگر هم همون نوبت رو تو لیست خودش می‌بینه ----------
  const barberBookings = await req("GET", "/bookings", { token: barberToken });
  const foundForBarber = barberBookings.data?.some((b) => b.id === bookingId);
  logResult("GET /bookings (آرایشگر، باید نوبت رو ببینه)", !!foundForBarber, barberBookings.status, barberBookings.data);

  if (!bookingId) return;

  // ---------- شروع/پایان سرویس ----------
  const start = await req("PATCH", `/bookings/${bookingId}/status`, {
    token: barberToken,
    body: { status: "IN_PROGRESS" },
  });
  logResult("PATCH status -> IN_PROGRESS (آرایشگر)", start.status === 200, start.status, start.data);

  const complete = await req("PATCH", `/bookings/${bookingId}/status`, {
    token: barberToken,
    body: { status: "COMPLETED" },
  });
  logResult("PATCH status -> COMPLETED (آرایشگر)", complete.status === 200, complete.status, complete.data);

  // ---------- تلاش برای لغو یه نوبت تمام‌شده باید رد بشه ----------
  const cancelCompleted = await req("PATCH", `/bookings/${bookingId}/status`, {
    token: customerToken,
    body: { status: "CANCELLED" },
  });
  logResult(
    "PATCH status -> CANCELLED روی نوبت تمام‌شده (باید 400 بده)",
    cancelCompleted.status === 400,
    cancelCompleted.status,
    cancelCompleted.data
  );

  // ---------- ادمین باید همه‌ی نوبت‌ها رو ببینه ----------
  const adminBookings = await req("GET", "/bookings", { token: adminToken });
  logResult("GET /bookings (ادمین، بدون فیلتر)", adminBookings.status === 200, adminBookings.status, adminBookings.data);

  console.log(`\n${pass} موفق، ${fail} ناموفق`);
}

main().catch((err) => {
  console.error("خطای کلی در اجرای تست:", err);
});
