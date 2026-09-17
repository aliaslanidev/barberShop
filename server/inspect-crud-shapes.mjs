// فقط برای دیدن شکل دقیق JSON پاسخ‌های services/barbers
// اجرا: node inspect-crud-shapes.mjs
const BASE_URL = "http://localhost:4010/api";

async function show(label, method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  console.log(`\n===== ${label} (status ${res.status}) =====`);
  console.log(JSON.stringify(data, null, 2));
  return data;
}

async function main() {
  const login = await show("LOGIN (admin)", "POST", "/auth/login", {
    mobile: "09120000001",
    password: "admin123",
  });
  const token = login?.token;

  await show("GET /services (list)", "GET", "/services");

  const createdService = await show("POST /services", "POST", "/services", {
    title: "تست شکل سرویس",
    desc: "برای دیدن شکل پاسخ",
    priceValue: 199000,
    icon: "scissors",
    featured: false,
  }, token);

  await show("GET /barbers (list)", "GET", "/barbers");

  const barberMobile = "0914" + Math.floor(1000000 + Math.random() * 8999999);
  const createdBarber = await show("POST /barbers", "POST", "/barbers", {
    name: "تست شکل آرایشگر",
    mobile: barberMobile,
    password: "test1234",
    bio: "بیو تست",
    initials: "ت.آ",
    serviceIds: [],
  }, token);

  const barberId = createdBarber?.id;
  if (barberId) {
    await show("PATCH /barbers/:id/permissions", "PATCH", `/barbers/${barberId}/permissions`, {
      manageServices: true,
      manageTimeOff: true,
    }, token);

    await show("GET /barbers/:id (after permissions)", "GET", `/barbers/${barberId}`);
  }
}

main();
