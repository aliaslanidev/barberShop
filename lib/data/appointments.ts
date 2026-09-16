export type ServiceSessionStatus =
  | "upcoming"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Appointment {
  id: string;
  barberId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  date: string; // فرمت ISO: YYYY-MM-DD
  time: string;
  status: ServiceSessionStatus;
}

// --- کمک‌تابع‌های تاریخ (فقط برای ساخت داده‌ی موک نسبت به «امروز») ---------

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(base: Date, days: number): Date {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + days);
  return copy;
}

const now = new Date();

const TODAY = toISODate(now);
const TOMORROW = toISODate(addDays(now, 1));
const DAY_AFTER_TOMORROW = toISODate(addDays(now, 2));
const IN_FOUR_DAYS = toISODate(addDays(now, 4));
const YESTERDAY = toISODate(addDays(now, -1));
const TWO_DAYS_AGO = toISODate(addDays(now, -2));
const LAST_WEEK = toISODate(addDays(now, -6));

// TODO: mock. وقتی بک‌اند آماده شد، این‌ها باید از API بر اساس barberId و بازه‌ی تاریخ بیان
export let appointments: Appointment[] = [
  // --- امروز ---
  { id: "a1", barberId: "ali", serviceId: "haircut", customerName: "امیر رضایی", customerPhone: "09121112233", date: TODAY, time: "09:00", status: "completed" },
  { id: "a2", barberId: "ali", serviceId: "beard", customerName: "سینا نوری", customerPhone: "09121112244", date: TODAY, time: "10:00", status: "in_progress" },
  { id: "a3", barberId: "ali", serviceId: "color", customerName: "بهزاد صالحی", customerPhone: "09121112255", date: TODAY, time: "11:00", status: "upcoming" },
  { id: "a4", barberId: "ali", serviceId: "haircut", customerName: "کیوان مرادی", customerPhone: "09121112266", date: TODAY, time: "14:00", status: "upcoming" },
  { id: "a5", barberId: "reza", serviceId: "facial", customerName: "نیما اکبری", customerPhone: "09121112277", date: TODAY, time: "10:00", status: "upcoming" },

  // --- فردا ---
  { id: "a6", barberId: "ali", serviceId: "haircut", customerName: "حسین کریمی", customerPhone: "09121112288", date: TOMORROW, time: "09:30", status: "upcoming" },
  { id: "a7", barberId: "reza", serviceId: "beard", customerName: "علی جعفری", customerPhone: "09121112299", date: TOMORROW, time: "11:30", status: "upcoming" },
  { id: "a8", barberId: "ali", serviceId: "color", customerName: "مهدی توکلی", customerPhone: "09121112300", date: TOMORROW, time: "16:00", status: "upcoming" },

  // --- روزهای بعدی همین هفته ---
  { id: "a9", barberId: "reza", serviceId: "haircut", customerName: "رضا احمدی", customerPhone: "09121112311", date: DAY_AFTER_TOMORROW, time: "10:00", status: "upcoming" },
  { id: "a10", barberId: "ali", serviceId: "facial", customerName: "پویا شریفی", customerPhone: "09121112322", date: IN_FOUR_DAYS, time: "13:00", status: "upcoming" },

  // --- تاریخچه (گذشته) ---
  { id: "a11", barberId: "ali", serviceId: "haircut", customerName: "فرهاد قاسمی", customerPhone: "09121112333", date: YESTERDAY, time: "09:00", status: "completed" },
  { id: "a12", barberId: "reza", serviceId: "beard", customerName: "آرمین صادقی", customerPhone: "09121112344", date: YESTERDAY, time: "12:00", status: "cancelled" },
  { id: "a13", barberId: "ali", serviceId: "color", customerName: "کامران رستمی", customerPhone: "09121112355", date: TWO_DAYS_AGO, time: "15:00", status: "completed" },
  { id: "a14", barberId: "reza", serviceId: "facial", customerName: "شاهین یوسفی", customerPhone: "09121112366", date: LAST_WEEK, time: "10:30", status: "completed" },
];

export function getTodayAppointments(barberId: string) {
  return appointments
    .filter((a) => a.barberId === barberId && a.date === TODAY)
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function getBarberCustomers(barberId: string) {
  const map = new Map<string, string>();
  appointments
    .filter((a) => a.barberId === barberId)
    .forEach((a) => map.set(a.customerPhone, a.customerName));
  return Array.from(map.entries()).map(([phone, name]) => ({ name, phone }));
}

// --- توابع جدید مدیریتی (برای پنل ادمین) ------------------------------------

export function getAllAppointments(): Appointment[] {
  return appointments;
}

export function cancelAppointment(id: string): Appointment | undefined {
  let updated: Appointment | undefined;
  appointments = appointments.map((a) => {
    if (a.id !== id) return a;
    updated = { ...a, status: "cancelled" };
    return updated;
  });
  return updated;
}

export function updateAppointmentStatus(
  id: string,
  status: ServiceSessionStatus
): Appointment | undefined {
  let updated: Appointment | undefined;
  appointments = appointments.map((a) => {
    if (a.id !== id) return a;
    updated = { ...a, status };
    return updated;
  });
  return updated;
}