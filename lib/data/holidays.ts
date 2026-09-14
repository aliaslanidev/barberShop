export interface SalonHoliday {
  id: string;
  dateDisplay: string;
  reason?: string;
}

export let salonHolidays: SalonHoliday[] = [];

export function getAllSalonHolidays(): SalonHoliday[] {
  return salonHolidays;
}

export function addSalonHoliday(dateDisplay: string, reason?: string): SalonHoliday {
  const entry: SalonHoliday = { id: crypto.randomUUID(), dateDisplay, reason };
  salonHolidays = [...salonHolidays, entry];
  return entry;
}

export function removeSalonHoliday(id: string): boolean {
  const before = salonHolidays.length;
  salonHolidays = salonHolidays.filter((h) => h.id !== id);
  return salonHolidays.length < before;
}