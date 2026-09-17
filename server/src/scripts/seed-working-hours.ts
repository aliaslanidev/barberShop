// اجرا: npx tsx src/scripts/seed-working-hours.ts
// این جدول (WorkingHours) هنوز endpoint مدیریتی نداره (فاز ۵)، ولی
// availability بهش وابسته‌ست؛ بدون این seed، availability همیشه خالی برمی‌گرده.
// امن برای اجرای چندباره‌ست (upsert روی day که unique هست).

import { PrismaClient, type Weekday } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_HOURS: { day: Weekday; isOpen: boolean; openTime: string; closeTime: string }[] = [
  { day: "SATURDAY", isOpen: true, openTime: "09:00", closeTime: "20:00" },
  { day: "SUNDAY", isOpen: true, openTime: "09:00", closeTime: "20:00" },
  { day: "MONDAY", isOpen: true, openTime: "09:00", closeTime: "20:00" },
  { day: "TUESDAY", isOpen: true, openTime: "09:00", closeTime: "20:00" },
  { day: "WEDNESDAY", isOpen: true, openTime: "09:00", closeTime: "20:00" },
  { day: "THURSDAY", isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "FRIDAY", isOpen: false, openTime: "09:00", closeTime: "18:00" },
];

async function main() {
  for (const row of DEFAULT_HOURS) {
    await prisma.workingHours.upsert({
      where: { day: row.day },
      update: row,
      create: row,
    });
  }
  console.log("ساعات کاری پیش‌فرض ثبت شد ✅");
}

main()
  .catch((err) => {
    console.error("خطا:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());