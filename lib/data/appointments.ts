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
  time: string;
  status: ServiceSessionStatus;
}

// TODO: mock. وقتی بک‌اند آماده شد، این‌ها باید از API بر اساس barberId و تاریخ امروز بیان
export let appointments: Appointment[] = [
  { id: "a1", barberId: "ali", serviceId: "haircut", customerName: "امیر رضایی", customerPhone: "09121112233", time: "09:00", status: "completed" },
  { id: "a2", barberId: "ali", serviceId: "beard", customerName: "سینا نوری", customerPhone: "09121112244", time: "10:00", status: "in_progress" },
  { id: "a3", barberId: "ali", serviceId: "color", customerName: "بهزاد صالحی", customerPhone: "09121112255", time: "11:00", status: "upcoming" },
  { id: "a4", barberId: "ali", serviceId: "haircut", customerName: "کیوان مرادی", customerPhone: "09121112266", time: "14:00", status: "upcoming" },
  { id: "a5", barberId: "reza", serviceId: "facial", customerName: "نیما اکبری", customerPhone: "09121112277", time: "10:00", status: "upcoming" },
];

export function getTodayAppointments(barberId: string) {
  return appointments
    .filter((a) => a.barberId === barberId)
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