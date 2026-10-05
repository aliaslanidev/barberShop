import { prisma } from "@/lib/prisma";
import { countSalonCustomers } from "@/modules/users/users.service";

export async function getPublicStats() {
  const [barberCount, customerCount, salon] = await Promise.all([
    prisma.barberProfile.count({
      where: {
        isActive: true,
        user: { isActive: true },
      },
    }),
    countSalonCustomers(),
    prisma.salonSettings.findUnique({
      where: { id: "main" },
      select: { experienceYears: true },
    }),
  ]);

  return { barberCount, customerCount, experienceYears: salon?.experienceYears ?? 12 };
}
