import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import type { CreateServiceInput, UpdateServiceInput } from "@/modules/services/services.schema";

export function getAllServices() {
  return prisma.service.findMany({ orderBy: { createdAt: "asc" } });
}

export async function getServiceById(id: string) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throw new AppError("سرویس پیدا نشد", 404);
  return service;
}

export function createService(data: CreateServiceInput) {
  return prisma.service.create({ data });
}

export async function updateService(id: string, data: UpdateServiceInput) {
  await getServiceById(id); // 404 اگه وجود نداشت
  return prisma.service.update({ where: { id }, data });
}

export async function deleteService(id: string) {
  await getServiceById(id);
  // نکته‌ی مهم (TODO تو فایل اورجینال هم بود): قبل از حذف واقعی باید چک بشه
  // که این سرویس به نوبت آینده‌ی فعالی وصل نیست. فعلاً به‌خاطر onDelete: Cascade
  // تو مدل BarberService این حذف می‌شه، ولی Booking هایی که بهش وصلن رو
  // Prisma به خاطر رابطه‌ی الزامی رد می‌کنه (خطای FK) — که رفتار درستیه.
  await prisma.service.delete({ where: { id } });
}
