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

export async function updateBarberPermissions(id: string, input: UpdatePermissionsInput) {
  await getBarberById(id);
  await prisma.barberProfile.update({ where: { id }, data: input });
  return getBarberById(id);
}

export async function deleteBarber(id: string) {
  const barber = await getBarberById(id);
  await prisma.user.delete({ where: { id: barber.user.id } });
}

// آرایشگر (نه ادمین) قیمت اختصاصی خودش رو برای یه سرویس ست می‌کنه.
// userId از JWT میاد (User.id)، پس اول باید BarberProfile متناظرش رو پیدا کنیم.
export async function updateOwnServicePrice(
  userId: string,
  serviceId: string,
  customPrice: number | null
) {
  const barberProfile = await prisma.barberProfile.findUnique({ where: { userId } });
  if (!barberProfile) throw new AppError("پروفایل آرایشگر پیدا نشد", 404);

  if (!barberProfile.managePricing) {
    throw new AppError("شما اجازه‌ی تعیین قیمت را ندارید", 403);
  }

  const link = await prisma.barberService.findUnique({
    where: { barberId_serviceId: { barberId: barberProfile.id, serviceId } },
  });
  if (!link) throw new AppError("این سرویس برای شما تعریف نشده است", 404);

  await prisma.barberService.update({
    where: { barberId_serviceId: { barberId: barberProfile.id, serviceId } },
    data: { customPrice },
  });

  return getBarberById(barberProfile.id);
}