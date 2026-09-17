// اجرا: npx tsx src/scripts/inspect-working-hours.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.workingHours.findMany();
  console.log("=== working_hours تو دیتابیس ===");
  console.table(
    rows.map((r) => ({
      day: r.day,
      isOpen: r.isOpen,
      openTime: r.openTime,
      closeTime: r.closeTime,
    }))
  );

  // چک تطبیق getUTCDay() با Weekday enum، برای ۷ روز آینده
  console.log("\n=== تطبیق تاریخ واقعی با weekday (۷ روز آینده) ===");
  const WEEKDAY_BY_JS_DAY: Record<number, string> = {
    0: "SUNDAY",
    1: "MONDAY",
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY",
    5: "FRIDAY",
    6: "SATURDAY",
  };
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const weekday = WEEKDAY_BY_JS_DAY[d.getUTCDay()];
    const row = rows.find((r) => r.day === weekday);
    console.log(
      `${dateStr}  →  ${weekday.padEnd(10)}  isOpen=${row?.isOpen}  (${row?.openTime}-${row?.closeTime})`
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());