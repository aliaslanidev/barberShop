import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import { hashPassword } from "@/utils/password";
import type {
  CreateManagerInput,
  UpdateManagerInput,
} from "@/modules/managers/managers.schema";

// passwordHash هیچ‌وقت به فرانت برنمی‌گرده؛ فقط فیلدهای عمومی انتخاب می‌شن.
const managerSelect = {
  id: true,
  name: true,
  mobile: true,
  role: true,
  createdAt: true,
} as const;

export async function getAllManagers() {
  return prisma.user.findMany({
    where: { role: "MANAGER" },
    select: managerSelect,
    orderBy: { createdAt: "asc" },
  });
}

export async function getManagerById(id: string) {
  const manager = await prisma.user.findFirst({
    where: { id, role: "MANAGER" },
    select: managerSelect,
  });
  if (!manager) throw new AppError("مدیر سالن پیدا نشد", 404);
  return manager;
}

export async function createManager(input: CreateManagerInput) {
  const exists = await prisma.user.findUnique({ where: { mobile: input.mobile } });
  if (exists) throw new AppError("این شماره موبایل قبلاً ثبت شده است", 409);

  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: { name: input.name, mobile: input.mobile, passwordHash, role: "MANAGER" },
    select: managerSelect,
  });
}

export async function updateManager(id: string, input: UpdateManagerInput) {
  await getManagerById(id);

  if (input.mobile) {
    const exists = await prisma.user.findFirst({
      where: { mobile: input.mobile, NOT: { id } },
    });
    if (exists) throw new AppError("این شماره موبایل قبلاً ثبت شده است", 409);
  }

  const data: { name?: string; mobile?: string; passwordHash?: string } = {};
  if (input.name) data.name = input.name;
  if (input.mobile) data.mobile = input.mobile;
  if (input.password) data.passwordHash = await hashPassword(input.password);

  await prisma.user.update({ where: { id }, data });
  return getManagerById(id);
}

export async function deleteManager(id: string) {
  await getManagerById(id);
  await prisma.user.delete({ where: { id } });
}