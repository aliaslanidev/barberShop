import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordAdmin = await bcrypt.hash("admin123", 10);
  const passwordBarber = await bcrypt.hash("barber123", 10);
  const passwordCustomer = await bcrypt.hash("customer123", 10);

  await prisma.user.upsert({
    where: { mobile: "09120000001" },
    update: {},
    create: {
      mobile: "09120000001",
      name: "مدیر سیستم",
      role: "ADMIN",
      passwordHash: passwordAdmin,
    },
  });

  const barberUser = await prisma.user.upsert({
    where: { mobile: "09120000002" },
    update: {},
    create: {
      mobile: "09120000002",
      name: "علی محمدی",
      role: "BARBER",
      passwordHash: passwordBarber,
      barberProfile: {
        create: {
          bio: "بیش از ۱۰ سال تجربه در اصلاح مو و فرم ریش.",
          initials: "ع.م",
          manageServices: true,
          managePricing: true,
          manageSchedule: true,
          manageTimeOff: true,
          blockSlots: true,
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { mobile: "09120000003" },
    update: {},
    create: {
      mobile: "09120000003",
      name: "مشتری تست",
      role: "CUSTOMER",
      passwordHash: passwordCustomer,
    },
  });

  const haircut = await prisma.service.upsert({
    where: { id: "seed-haircut" },
    update: {},
    create: {
      id: "seed-haircut",
      title: "اصلاح مو",
      desc: "مدل‌های کلاسیک و روز، متناسب با فرم صورت شما.",
      priceValue: 250000,
      icon: "scissors",
      featured: true,
    },
  });

  const beard = await prisma.service.upsert({
    where: { id: "seed-beard" },
    update: {},
    create: {
      id: "seed-beard",
      title: "اصلاح و فرم ریش",
      desc: "خط‌زنی دقیق و مراقبت کامل از ریش با تیغ گرم.",
      priceValue: 180000,
      icon: "sparkles",
    },
  });

  const barberProfile = await prisma.barberProfile.findUnique({
    where: { userId: barberUser.id },
  });

  if (barberProfile) {
    await prisma.barberService.createMany({
      data: [
        { barberId: barberProfile.id, serviceId: haircut.id },
        { barberId: barberProfile.id, serviceId: beard.id },
      ],
      skipDuplicates: true,
    });
  }

  await prisma.salonSettings.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", name: "سالن آرایشی" },
  });

  const weekdays = [
    "SATURDAY",
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ] as const;

  for (const day of weekdays) {
    await prisma.workingHours.upsert({
      where: { day },
      update: {},
      create: {
        day,
        isOpen: day !== "FRIDAY",
        openTime: "09:00",
        closeTime: day === "THURSDAY" ? "18:00" : "20:00",
      },
    });
  }

  console.log("Seed کامل شد ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
