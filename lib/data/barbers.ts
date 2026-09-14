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
  bio: string;
  initials: string;
  serviceIds: string[];
  // --- فیلدهای مربوط به پنل ادمین ---
  mobile?: string;
  permissions: BarberPermissions;
  isActive: boolean;
}

// پرمیشن‌های پیش‌فرض برای آرایشگر تازه‌ساخته‌شده: همه غیرفعال.
// ادمین باید صراحتاً هرکدوم رو فعال کنه — هیچ مقداردهی خودکاری بر اساس «نوع» وجود نداره.
const EMPTY_PERMISSIONS: BarberPermissions = {
  manage_services: false,
  manage_pricing: false,
  manage_schedule: false,
  manage_time_off: false,
  block_slots: false,
  cancel_own_bookings: false,
};

export let barbers: Barber[] = [
  {
    id: "ali",
    name: "علی محمدی",
    bio: "بیش از ۱۰ سال تجربه در اصلاح مو و فرم ریش.",
    initials: "ع.م",
    serviceIds: ["haircut", "beard", "color"],
    mobile: "09121111111",
    // پرمیشن‌های گسترده — انتخاب صریح ادمین برای این آرایشگر، نه نتیجه‌ی یک «نوع».
    permissions: {
      manage_services: true,
      manage_pricing: true,
      manage_schedule: true,
      manage_time_off: true,
      block_slots: true,
      cancel_own_bookings: false,
    },
    isActive: true,
  },
  {
    id: "reza",
    name: "رضا کریمی",
    bio: "متخصص اصلاح مو و پاکسازی پوست.",
    initials: "ر.ک",
    serviceIds: ["haircut", "facial"],
    mobile: "09122222222",
    // بدون هیچ پرمیشن اختیاری — کاملاً تحت کنترل سالن.
    permissions: { ...EMPTY_PERMISSIONS },
    isActive: true,
  },
  {
    id: "hamed",
    name: "حامد رستمی",
    bio: "استایلیست رنگ و مدل‌های مدرن.",
    initials: "ح.ر",
    serviceIds: ["haircut", "color", "beard"],
    mobile: "09123333333",
    permissions: {
      manage_services: true,
      manage_pricing: true,
      manage_schedule: true,
      manage_time_off: true,
      block_slots: true,
      cancel_own_bookings: false,
    },
    isActive: true,
  },
  {
    id: "mehdi",
    name: "مهدی اکبری",
    bio: "متخصص اصلاح و فرم ریش.",
    initials: "م.ا",
    serviceIds: ["beard", "facial"],
    mobile: "09124444444",
    // نمونه‌ی حالت بینابین: فقط اجازه‌ی تعیین مرخصی خودش رو داره، نه بقیه‌چیزها.
    permissions: {
      ...EMPTY_PERMISSIONS,
      manage_time_off: true,
    },
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
  bio?: string;
  initials?: string;
  serviceIds?: string[];
  // ادمین می‌تونه همون لحظه‌ی ساخت، پرمیشن‌های دلخواه رو مشخص کنه؛
  // اگه ندی، آرایشگر بدون هیچ پرمیشن اختیاری ساخته می‌شه.
  permissions?: Partial<BarberPermissions>;
}): Barber {
  const newBarber: Barber = {
    id: `barber-${Date.now()}`,
    name: data.name,
    bio: data.bio ?? "",
    initials: data.initials ?? data.name.slice(0, 2),
    serviceIds: data.serviceIds ?? [],
    mobile: data.mobile,
    permissions: { ...EMPTY_PERMISSIONS, ...data.permissions },
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