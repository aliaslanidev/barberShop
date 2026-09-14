export interface SalonInfo {
  name: string;
  address: string;
  phone: string;
}

export type WeekDay =
  | "شنبه"
  | "یکشنبه"
  | "دوشنبه"
  | "سه‌شنبه"
  | "چهارشنبه"
  | "پنجشنبه"
  | "جمعه";

export interface WorkingHoursEntry {
  day: WeekDay;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

// TODO: mock. وقتی بک‌اند آماده شد از API میاد
export let salonInfo: SalonInfo = {
  name: "سالن آرایشی",
  address: "",
  phone: "",
};

export let workingHours: WorkingHoursEntry[] = [
  { day: "شنبه", isOpen: true, openTime: "09:00", closeTime: "20:00" },
  { day: "یکشنبه", isOpen: true, openTime: "09:00", closeTime: "20:00" },
  { day: "دوشنبه", isOpen: true, openTime: "09:00", closeTime: "20:00" },
  { day: "سه‌شنبه", isOpen: true, openTime: "09:00", closeTime: "20:00" },
  { day: "چهارشنبه", isOpen: true, openTime: "09:00", closeTime: "20:00" },
  { day: "پنجشنبه", isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "جمعه", isOpen: false, openTime: "09:00", closeTime: "18:00" },
];

export function getSalonInfo(): SalonInfo {
  return salonInfo;
}

export function updateSalonInfo(data: Partial<SalonInfo>): SalonInfo {
  salonInfo = { ...salonInfo, ...data };
  return salonInfo;
}

export function getWorkingHours(): WorkingHoursEntry[] {
  return workingHours;
}

export function updateWorkingHours(
  day: WeekDay,
  data: Partial<Omit<WorkingHoursEntry, "day">>
): WorkingHoursEntry[] {
  workingHours = workingHours.map((w) =>
    w.day === day ? { ...w, ...data } : w
  );
  return workingHours;
}