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

export const services: Service[] = [
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

export function getServiceById(id: string) {
  return services.find((s) => s.id === id);
}