import { Scissors, Sparkles, Droplet, Palette, type LucideIcon } from "lucide-react";

export interface Service {
  id: string;
  title: string;
  desc: string;
  price: string;
  priceValue: number;
  icon: LucideIcon;
  featured?: boolean;
}

// آیکون‌های مجاز برای انتخاب هنگام ساخت/ویرایش سرویس در پنل ادمین.
// چون icon یک کامپوننت است نه رشته، از یک نگاشت نام→کامپوننت استفاده می‌کنیم.
export const SERVICE_ICONS = {
  scissors: Scissors,
  sparkles: Sparkles,
  droplet: Droplet,
  palette: Palette,
} as const;

export type ServiceIconKey = keyof typeof SERVICE_ICONS;

export let services: Service[] = [
  {
    id: "haircut",
    title: "اصلاح مو",
    desc: "مدل‌های کلاسیک و روز، متناسب با فرم صورت شما.",
    price: "از ۲۵۰ هزار تومان",
    priceValue: 250000,
    icon: Scissors,
    featured: true,
  },
  {
    id: "beard",
    title: "اصلاح و فرم ریش",
    desc: "خط‌زنی دقیق و مراقبت کامل از ریش با تیغ گرم.",
    price: "از ۱۸۰ هزار تومان",
    priceValue: 180000,
    icon: Sparkles,
  },
  {
    id: "facial",
    title: "پاکسازی و ماسک صورت",
    desc: "پاکسازی عمقی پوست همراه با ماسک اختصاصی.",
    price: "از ۳۰۰ هزار تومان",
    priceValue: 300000,
    icon: Droplet,
  },
  {
    id: "color",
    title: "رنگ و هایلایت",
    desc: "پوشش کامل موی سفید یا افکت‌های رنگی مدرن.",
    price: "از ۴۵۰ هزار تومان",
    priceValue: 450000,
    icon: Palette,
  },
];

// --- توابع قبلی (استفاده‌شده در سایت عمومی/بوکینگ) — بدون تغییر ------------

export function getServiceById(id: string) {
  return services.find((s) => s.id === id);
}

// --- توابع جدید مدیریتی (برای پنل ادمین) ------------------------------------

export function getAllServices(): Service[] {
  return services;
}

function formatPriceLabel(priceValue: number) {
  return `از ${priceValue.toLocaleString("fa-IR")} تومان`;
}

export function createService(data: {
  title: string;
  desc: string;
  priceValue: number;
  icon?: ServiceIconKey;
  featured?: boolean;
}): Service {
  const newService: Service = {
    id: `service-${Date.now()}`,
    title: data.title,
    desc: data.desc,
    priceValue: data.priceValue,
    price: formatPriceLabel(data.priceValue),
    icon: SERVICE_ICONS[data.icon ?? "scissors"],
    featured: data.featured ?? false,
  };

  services = [...services, newService];
  return newService;
}

export function updateService(
  id: string,
  data: Partial<{
    title: string;
    desc: string;
    priceValue: number;
    icon: ServiceIconKey;
    featured: boolean;
  }>
): Service | undefined {
  let updated: Service | undefined;

  services = services.map((s) => {
    if (s.id !== id) return s;
    updated = {
      ...s,
      ...data,
      icon: data.icon ? SERVICE_ICONS[data.icon] : s.icon,
      price: data.priceValue !== undefined ? formatPriceLabel(data.priceValue) : s.price,
    };
    return updated;
  });

  return updated;
}

export function deleteService(id: string): boolean {
  const before = services.length;
  services = services.filter((s) => s.id !== id);
  return services.length < before;
}