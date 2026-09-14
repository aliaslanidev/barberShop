export type BarberType = "professional" | "regular";

export interface Barber {
  id: string;
  name: string;
  barberType: BarberType;
  bio: string;
  initials: string;
  serviceIds: string[];
}

export const barbers: Barber[] = [
  {
    id: "ali",
    name: "علی محمدی",
    barberType: "professional",
    bio: "بیش از ۱۰ سال تجربه در اصلاح مو و فرم ریش.",
    initials: "ع.م",
    serviceIds: ["haircut", "beard", "color"],
  },
  {
    id: "reza",
    name: "رضا کریمی",
    barberType: "regular",
    bio: "متخصص اصلاح مو و پاکسازی پوست.",
    initials: "ر.ک",
    serviceIds: ["haircut", "facial"],
  },
  {
    id: "hamed",
    name: "حامد رستمی",
    barberType: "professional",
    bio: "استایلیست رنگ و مدل‌های مدرن.",
    initials: "ح.ر",
    serviceIds: ["haircut", "color", "beard"],
  },
  {
    id: "mehdi",
    name: "مهدی اکبری",
    barberType: "regular",
    bio: "متخصص اصلاح و فرم ریش.",
    initials: "م.ا",
    serviceIds: ["beard", "facial"],
  },
];

export function getBarberById(id: string) {
  return barbers.find((b) => b.id === id);
}

export function getBarbersByService(serviceId: string) {
  return barbers.filter((b) => b.serviceIds.includes(serviceId));
}

export function getServicesByBarber(barberId: string) {
  return barbers.find((b) => b.id === barberId)?.serviceIds ?? [];
}