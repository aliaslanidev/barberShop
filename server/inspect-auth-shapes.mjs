// فقط برای دیدن شکل دقیق JSON پاسخ‌ها — اجرا: node inspect-auth-shapes.mjs
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
  const mobile = "0912" + Math.floor(1000000 + Math.random() * 8999999);
  await show("REGISTER", "POST", "/auth/register", {
    name: "تست شکل پاسخ",
    mobile,
    password: "test1234",
  });

  const login = await show("LOGIN (admin)", "POST", "/auth/login", {
    mobile: "09120000001",
    password: "admin123",
  });

  const token = login?.token ?? login?.accessToken ?? login?.data?.token;
  await show("ME (admin)", "GET", "/auth/me", null, token);
}

main();
