import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import { notifyUser } from "@/modules/notifications/notifications.service";
import type {
  CreateTimeOffInput,
  LeaveRequestStatusQuery,
} from "@/modules/time-off/time-off.schema";

function parseDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function dateRangeForDay(dateStr: string): { gte: Date; lt: Date } {
  const start = parseDateOnly(dateStr);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { gte: start, lt: end };
}

async function assertNoConfirmedBooking(barberId: string, dateStr: string) {
  const { gte, lt } = dateRangeForDay(dateStr);
  const existing = await prisma.booking.findFirst({
    where: { barberId, date: { gte, lt }, status: { not: "CANCELLED" } },
  });
  if (existing) {
    throw new AppError(
      "این روز نوبت تاییدشده دارد؛ ابتدا نوبت‌ها را لغو یا هماهنگ کنید",
      409
    );
  }
}

export async function listOwnTimeOff(userId: string) {
  const barberProfile = await prisma.barberProfile.findUnique({ where: { userId } });
  if (!barberProfile) throw new AppError("پروفایل آرایشگر پیدا نشد", 404);

  const [timeOffs, leaveRequests] = await Promise.all([
    prisma.timeOff.findMany({ where: { barberId: barberProfile.id }, orderBy: { date: "asc" } }),
    prisma.leaveRequest.findMany({
      where: { barberId: barberProfile.id },
      orderBy: { date: "asc" },
    }),
  ]);

  return { timeOffs, leaveRequests };
}

// اگه پرمیشن manageTimeOff داشته باشه: مستقیم TimeOff می‌سازه.
// وگرنه: یه LeaveRequest با وضعیت PENDING می‌سازه که باید ادمین تاییدش کنه.
export async function createOwnTimeOff(userId: string, input: CreateTimeOffInput) {
  const barberProfile = await prisma.barberProfile.findUnique({
    where: { userId },
    include: { user: { select: { name: true } } },
  });
  if (!barberProfile) throw new AppError("پروفایل آرایشگر پیدا نشد", 404);

  if (barberProfile.manageTimeOff) {
    await assertNoConfirmedBooking(barberProfile.id, input.date);

    const timeOff = await prisma.timeOff.upsert({
      where: { barberId_date: { barberId: barberProfile.id, date: parseDateOnly(input.date) } },
      update: {},
      create: { barberId: barberProfile.id, date: parseDateOnly(input.date) },
    });
    return { type: "TIME_OFF" as const, timeOff };
  }

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      barberId: barberProfile.id,
      date: parseDateOnly(input.date),
      reason: input.reason,
      status: "PENDING",
    },
  });

  // نوتیف برای همه‌ی ادمین/مدیرها: درخواست مرخصی جدید برای تایید
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "MANAGER"] } },
    select: { id: true },
  });
  await Promise.all(
    admins.map((a) =>
      notifyUser(a.id, {
        type: "LEAVE_REQUEST_STATUS",
        title: "درخواست مرخصی جدید",
        body: `${barberProfile.user.name} یک درخواست مرخصی برای ${input.date} ثبت کرد`,
        link: "/admin/leave-requests",
      }).catch(() => {})
    )
  );

  return { type: "LEAVE_REQUEST" as const, leaveRequest };
}

export async function deleteOwnTimeOff(userId: string, id: string) {
  const barberProfile = await prisma.barberProfile.findUnique({ where: { userId } });
  if (!barberProfile) throw new AppError("پروفایل آرایشگر پیدا نشد", 404);
  if (!barberProfile.manageTimeOff) {
    throw new AppError("شما اجازه‌ی حذف مستقیم مرخصی را ندارید", 403);
  }

  const timeOff = await prisma.timeOff.findUnique({ where: { id } });
  if (!timeOff || timeOff.barberId !== barberProfile.id) {
    throw new AppError("مرخصی پیدا نشد", 404);
  }
  await prisma.timeOff.delete({ where: { id } });
}

export async function cancelOwnLeaveRequest(userId: string, id: string) {
  const barberProfile = await prisma.barberProfile.findUnique({ where: { userId } });
  if (!barberProfile) throw new AppError("پروفایل آرایشگر پیدا نشد", 404);

  const request = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!request || request.barberId !== barberProfile.id) {
    throw new AppError("درخواست مرخصی پیدا نشد", 404);
  }
  if (request.status !== "PENDING") {
    throw new AppError("فقط درخواست در انتظار تایید قابل لغو است", 400);
  }
  await prisma.leaveRequest.delete({ where: { id } });
}

// ==================== سمت ادمین ====================

// مرخصی‌های ثبت‌شده‌ی همه‌ی آرایشگرها (برای صفحه‌ی تعطیلات ادمین)
export async function listAllTimeOff() {
  return prisma.timeOff.findMany({
    include: {
      barber: { include: { user: { select: { id: true, name: true, mobile: true } } } },
    },
    orderBy: { date: "asc" },
  });
}

export async function listLeaveRequests(query: LeaveRequestStatusQuery) {
  return prisma.leaveRequest.findMany({
    where: query.status ? { status: query.status } : undefined,
    include: { barber: { include: { user: { select: { id: true, name: true, mobile: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveLeaveRequest(id: string, adminUserId: string) {
  const request = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!request) throw new AppError("درخواست مرخصی پیدا نشد", 404);
  if (request.status !== "PENDING") {
    throw new AppError("این درخواست قبلاً بررسی شده است", 400);
  }

  await assertNoConfirmedBooking(request.barberId, request.date.toISOString().slice(0, 10));

  const [, updated] = await prisma.$transaction([
    prisma.timeOff.upsert({
      where: { barberId_date: { barberId: request.barberId, date: request.date } },
      update: {},
      create: { barberId: request.barberId, date: request.date },
    }),
    prisma.leaveRequest.update({
      where: { id },
      data: { status: "APPROVED", reviewedBy: adminUserId },
    }),
  ]);

  const barberProfile = await prisma.barberProfile.findUnique({
    where: { id: request.barberId },
    select: { userId: true },
  });
  if (barberProfile) {
    notifyUser(barberProfile.userId, {
      type: "LEAVE_REQUEST_STATUS",
      title: "مرخصی تایید شد",
      body: `درخواست مرخصی شما برای ${request.date.toISOString().slice(0, 10)} تایید شد`,
      link: "/barber/time-off",
    }).catch(() => {});
  }

  return updated;
}

export async function rejectLeaveRequest(id: string, adminUserId: string) {
  const request = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!request) throw new AppError("درخواست مرخصی پیدا نشد", 404);
  if (request.status !== "PENDING") {
    throw new AppError("این درخواست قبلاً بررسی شده است", 400);
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: { status: "REJECTED", reviewedBy: adminUserId },
  });

  const barberProfile = await prisma.barberProfile.findUnique({
    where: { id: request.barberId },
    select: { userId: true },
  });
  if (barberProfile) {
    notifyUser(barberProfile.userId, {
      type: "LEAVE_REQUEST_STATUS",
      title: "مرخصی رد شد",
      body: `درخواست مرخصی شما برای ${request.date.toISOString().slice(0, 10)} رد شد`,
      link: "/barber/time-off",
    }).catch(() => {});
  }

  return updated;
}