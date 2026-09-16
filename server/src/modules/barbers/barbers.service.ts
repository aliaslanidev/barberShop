import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import { hashPassword } from "@/utils/password";
import type {
  CreateBarberInput,
  UpdateBarberInput,
  UpdatePermissionsInput,
} from "@/modules/barbers/barbers.schema";

const barberInclude = {
  user: { select: { id: true, name: true, mobile: true } },
  services: { include: { service: true } },
};

export function getAllBarbers() {
  return prisma.barberProfile.findMany({
    include: barberInclude,
    orderBy: { createdAt: "asc" },
  });
}

export async function getBarberById(id: string) {
  const barber = await prisma.barberProfile.findUnique({
    where: { id },
    include: barberInclude,
  });
  if (!barber) throw new AppError("آرایشگر پیدا نشد", 404);
  return barber;
}

// معادل createBarber تو barbers.ts — همزمان User (role=BARBER) و BarberProfile می‌سازه
export async function createBarber(input: CreateBarberInput) {
  const exists = await prisma.user.findUnique({ where: { mobile: input.mobile } });
  if (exists) throw new AppError("این شماره موبایل قبلاً ثبت شده است", 409);

  const passwordHash = await hashPassword(input.password);
  const initials = input.name.slice(0, 2);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      mobile: input.mobile,
      passwordHash,
      role: "BARBER",
      barberProfile: {
        create: {
          bio: input.bio ?? "",
          initials,
          services: input.serviceIds
            ? { create: input.serviceIds.map((serviceId) => ({ serviceId })) }
            : undefined,
        },
      },
    },
    include: { barberProfile: true },
  });

  return getBarberById(user.barberProfile!.id);
}

export async function updateBarber(id: string, input: UpdateBarberInput) {
  const barber = await getBarberById(id);

  if (input.name || input.mobile) {
    await prisma.user.update({
      where: { id: barber.user.id },
      data: { name: input.name, mobile: input.mobile },
    });
  }

  if (input.serviceIds) {
    await prisma.barberService.deleteMany({ where: { barberId: id } });
    await prisma.barberService.createMany({
      data: input.serviceIds.map((serviceId) => ({ barberId: id, serviceId })),
    });
  }

  await prisma.barberProfile.update({
    where: { id },
    data: { bio: input.bio, isActive: input.isActive },
  });

  return getBarberById(id);
}

// معادل updateBarberPermissions
export async function updateBarberPermissions(id: string, input: UpdatePermissionsInput) {
  await getBarberById(id);
  await prisma.barberProfile.update({ where: { id }, data: input });
  return getBarberById(id);
}

export async function deleteBarber(id: string) {
  const barber = await getBarberById(id);
  // با حذف User (به‌خاطر onDelete: Cascade رو رابطه‌ی BarberProfile) پروفایل هم پاک می‌شه
  await prisma.user.delete({ where: { id: barber.user.id } });
}
