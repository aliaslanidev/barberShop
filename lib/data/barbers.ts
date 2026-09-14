export type BarberType = "professional" | "regular";

export type BarberPermissions = {
  manage_services: boolean;
  manage_pricing: boolean;
  manage_schedule: boolean;
  manage_time_off: boolean;
  block_slots: boolean;
  cancel_own_bookings: boolean;
};

export interface Barber {
  id: string;
  name: string;
  barberType: BarberType;
  bio: string;
  initials: string;
  serviceIds: string[];
  // --- فیلدهای مربوط به پنل ادمین ---
  mobile?: string;
  permissions: BarberPermissions;
  isActive: boolean;
}

const REGULAR_DEFAULT_PERMISSIONS: BarberPermissions = {
  manage_services: false,
  manage_pricing: false,
  manage_schedule: false,
  manage_time_off: false,
  block_slots: false,
  cancel_own_bookings: false,
};

const PROFESSIONAL_DEFAULT_PERMISSIONS: BarberPermissions = {
  manage_services: true,
  manage_pricing: true,
  manage_schedule: true,
  manage_time_off: true,
  block_slots: true,
  cancel_own_bookings: false,
};

function defaultPermissionsFor(type: BarberType): BarberPermissions {
  return type === "professional"
    ? { ...PROFESSIONAL_DEFAULT_PERMISSIONS }
    : { ...REGULAR_DEFAULT_PERMISSIONS };
}

export let barbers: Barber[] = [
  {
    id: "ali",
    name: "علی محمدی",
    barberType: "professional",
    bio: "بیش از ۱۰ سال تجربه در اصلاح مو و فرم ریش.",
    initials: "ع.م",
    serviceIds: ["haircut", "beard", "color"],
    mobile: "09121111111",
    permissions: defaultPermissionsFor("professional"),
    isActive: true,
  },
  {
    id: "reza",
    name: "رضا کریمی",
    barberType: "regular",
    bio: "متخصص اصلاح مو و پاکسازی پوست.",
    initials: "ر.ک",
    serviceIds: ["haircut", "facial"],
    mobile: "09122222222",
    permissions: defaultPermissionsFor("regular"),
    isActive: true,
  },
  {
    id: "hamed",
    name: "حامد رستمی",
    barberType: "professional",
    bio: "استایلیست رنگ و مدل‌های مدرن.",
    initials: "ح.ر",
    serviceIds: ["haircut", "color", "beard"],
    mobile: "09123333333",
    permissions: defaultPermissionsFor("professional"),
    isActive: true,
  },
  {
    id: "mehdi",
    name: "مهدی اکبری",
    barberType: "regular",
    bio: "متخصص اصلاح و فرم ریش.",
    initials: "م.ا",
    serviceIds: ["beard", "facial"],
    mobile: "09124444444",
    permissions: defaultPermissionsFor("regular"),
    isActive: true,
  },
];

// --- توابع قبلی (استفاده‌شده در سایت عمومی/بوکینگ) — بدون تغییر ------------

export function getBarberById(id: string) {
  return barbers.find((b) => b.id === id);
}

export function getBarbersByService(serviceId: string) {
  return barbers.filter((b) => b.serviceIds.includes(serviceId));
}

export function getServicesByBarber(barberId: string) {
  return barbers.find((b) => b.id === barberId)?.serviceIds ?? [];
}

// --- توابع جدید مدیریتی (برای پنل ادمین) ------------------------------------

export function getAllBarbers(): Barber[] {
  return barbers;
}

export function createBarber(data: {
  name: string;
  mobile: string;
  barberType: BarberType;
  bio?: string;
  initials?: string;
  serviceIds?: string[];
}): Barber {
  const newBarber: Barber = {
    id: `barber-${Date.now()}`,
    name: data.name,
    barberType: data.barberType,
    bio: data.bio ?? "",
    initials: data.initials ?? data.name.slice(0, 2),
    serviceIds: data.serviceIds ?? [],
    mobile: data.mobile,
    permissions: defaultPermissionsFor(data.barberType),
    isActive: true,
  };

  barbers = [...barbers, newBarber];
  return newBarber;
}

export function updateBarber(
  id: string,
  data: Partial<
    Pick<Barber, "name" | "mobile" | "isActive" | "bio" | "serviceIds">
  >
): Barber | undefined {
  let updated: Barber | undefined;

  barbers = barbers.map((b) => {
    if (b.id !== id) return b;
    updated = { ...b, ...data };
    return updated;
  });

  return updated;
}

// طبق مستند: تغییر نوع باربر توسط ادمین، پرمیشن‌ها رو خودکار override نمی‌کنه
// مگر اینکه صراحتاً بخوایم ریست کنیم.
export function setBarberType(
  id: string,
  barberType: BarberType,
  resetPermissionsToDefault: boolean = false
): Barber | undefined {
  let updated: Barber | undefined;

  barbers = barbers.map((b) => {
    if (b.id !== id) return b;
    updated = {
      ...b,
      barberType,
      permissions: resetPermissionsToDefault
        ? defaultPermissionsFor(barberType)
        : b.permissions,
    };
    return updated;
  });

  return updated;
}

export function updateBarberPermissions(
  id: string,
  permissions: Partial<BarberPermissions>
): Barber | undefined {
  let updated: Barber | undefined;

  barbers = barbers.map((b) => {
    if (b.id !== id) return b;
    updated = { ...b, permissions: { ...b.permissions, ...permissions } };
    return updated;
  });

  return updated;
}

export function deleteBarber(id: string): boolean {
  const before = barbers.length;
  barbers = barbers.filter((b) => b.id !== id);
  return barbers.length < before;
}