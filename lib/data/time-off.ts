export interface TimeOffEntry {
  id: string;
  barberId: string;
  dateDisplay: string; // فرمت نمایشی جلالی، مثلا "1404/07/01"
}

// TODO: mock. وقتی بک‌اند آماده شد از API میاد
export let timeOffEntries: TimeOffEntry[] = [];

export function getTimeOffByBarber(barberId: string): TimeOffEntry[] {
  return timeOffEntries.filter((e) => e.barberId === barberId);
}

export function getAllTimeOff(): TimeOffEntry[] {
  return timeOffEntries;
}

export function addTimeOff(barberId: string, dateDisplay: string): TimeOffEntry {
  const entry: TimeOffEntry = {
    id: crypto.randomUUID(),
    barberId,
    dateDisplay,
  };
  timeOffEntries = [...timeOffEntries, entry];
  return entry;
}

export function removeTimeOff(id: string): boolean {
  const before = timeOffEntries.length;
  timeOffEntries = timeOffEntries.filter((e) => e.id !== id);
  return timeOffEntries.length < before;
}