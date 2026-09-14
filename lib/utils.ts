import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function toPersianDigits(input: string) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return input.replace(/[0-9]/g, (d) => persianDigits[Number(d)]);
}

export function formatToman(value: number) {
  return `${toPersianDigits(value.toLocaleString("en-US"))} تومان`;
}
