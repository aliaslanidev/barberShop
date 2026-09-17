// تست خودکار فاز ۲: auth, services, barbers
// اجرا: node test-phase2.mjs
// نیازمند Node 18+ (fetch توکار). اگه BASE_URL اشتباه بود (404 همه‌جا)،
// یعنی apiRouter زیر مسیر دیگه‌ای mount شده — app.ts رو چک کن.

const BASE_URL = "http://localhost:4010/api";

let pass = 0;
let fail = 0;

function logResult(name, ok, status, body) {
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${name} — status ${status}`);
  if (!ok) {
    console.log("   body:", JSON.stringify(body));
  }
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

async function main() {
  const uniqueMobile = "0912" + Math.floor(1000000 + Math.random() * 8999999);

  // ---------- 1) Register (customer) ----------
  const reg = await req("POST", "/auth/register", {
    body: { name: "تست مشتری", mobile: uniqueMobile, password: "test1234" },
  });
  logResult("register", reg.status === 201 || reg.status === 200, reg.status, reg.data);

  // ---------- 2) Login (seed admin) ----------
  const adminLogin = await req("POST", "/auth/login", {
    body: { mobile: "09120000001", password: "admin123" },
  });
  logResult("login (admin)", adminLogin.status === 200, adminLogin.status, adminLogin.data);
  const adminToken = adminLogin.data?.token ?? adminLogin.data?.accessToken;
  if (!adminToken) {
    console.log("⚠️ توکن ادمین پیدا نشد؛ ساختار پاسخ login رو چک کن:", JSON.stringify(adminLogin.data));
  }

  // ---------- 3) Me ----------
  const me = await req("GET", "/auth/me", { token: adminToken });
  logResult("me (admin)", me.status === 200, me.status, me.data);

  // ---------- 4) Services: list ----------
  const servicesList = await req("GET", "/services");
  logResult("GET /services", servicesList.status === 200, servicesList.status, servicesList.data);

  // ---------- 5) Services: create ----------
  const createdService = await req("POST", "/services", {
    token: adminToken,
    body: {
      title: "تست سرویس",
      desc: "سرویس ساخته‌شده توسط اسکریپت تست",
      priceValue: 200000,
      icon: "scissors",
      featured: false,
    },
  });
  logResult("POST /services", createdService.status === 201 || createdService.status === 200, createdService.status, createdService.data);
  const serviceId = createdService.data?.id;

  // ---------- 6) Services: update ----------
  if (serviceId) {
    const updatedService = await req("PATCH", `/services/${serviceId}`, {
      token: adminToken,
      body: { priceValue: 250000 },
    });
    logResult("PATCH /services/:id", updatedService.status === 200, updatedService.status, updatedService.data);
  }

  // ---------- 7) Services: delete ----------
  if (serviceId) {
    const deletedService = await req("DELETE", `/services/${serviceId}`, { token: adminToken });
    logResult("DELETE /services/:id", deletedService.status === 200 || deletedService.status === 204, deletedService.status, deletedService.data);
  }

  // ---------- 8) Barbers: list ----------
  const barbersList = await req("GET", "/barbers");
  logResult("GET /barbers", barbersList.status === 200, barbersList.status, barbersList.data);

  // ---------- 9) Barbers: create ----------
  const barberMobile = "0913" + Math.floor(1000000 + Math.random() * 8999999);
  const createdBarber = await req("POST", "/barbers", {
    token: adminToken,
    body: {
      name: "آرایشگر تست",
      mobile: barberMobile,
      password: "barbtest123",
      bio: "بیوگرافی تست",
      initials: "آ.ت",
      serviceIds: [],
    },
  });
  logResult("POST /barbers", createdBarber.status === 201 || createdBarber.status === 200, createdBarber.status, createdBarber.data);
  const barberId = createdBarber.data?.id;

  // ---------- 10) Barbers: update ----------
  if (barberId) {
    const updatedBarber = await req("PATCH", `/barbers/${barberId}`, {
      token: adminToken,
      body: { bio: "بیوگرافی ویرایش‌شده" },
    });
    logResult("PATCH /barbers/:id", updatedBarber.status === 200, updatedBarber.status, updatedBarber.data);
  }

  // ---------- 11) Barbers: permissions ----------
  if (barberId) {
    const updatedPerms = await req("PATCH", `/barbers/${barberId}/permissions`, {
      token: adminToken,
      body: { manageServices: true, manageTimeOff: true },
    });
    logResult("PATCH /barbers/:id/permissions", updatedPerms.status === 200, updatedPerms.status, updatedPerms.data);
  }

  // ---------- 12) Barbers: delete ----------
  if (barberId) {
    const deletedBarber = await req("DELETE", `/barbers/${barberId}`, { token: adminToken });
    logResult("DELETE /barbers/:id", deletedBarber.status === 200 || deletedBarber.status === 204, deletedBarber.status, deletedBarber.data);
  }

  console.log(`\n${pass} موفق، ${fail} ناموفق`);
}

main().catch((err) => {
  console.error("خطای کلی در اجرای تست:", err);
});
