import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

// اعلان‌ها فقط در صندوق ورودی داخل برنامه ثبت می‌شوند.
export async function notifyUser(
  userId: string,
  data: { type: NotificationType; title: string; body: string; link?: string },
) {
  return prisma.notification.create({
    data: { userId, type: data.type, title: data.title, body: data.body, link: data.link },
  });
}

export async function notifyUserSafely(
  userId: string,
  data: { type: NotificationType; title: string; body: string; link?: string },
  context: string,
) {
  try {
    return await notifyUser(userId, data);
  } catch (error) {
    console.error(`ثبت اعلان ناموفق بود (${context})`, { userId, error });
    return null;
  }
}

export async function notifyAdminsSafely(
  data: { type: NotificationType; title: string; body: string; link?: string },
  context: string,
) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] }, isActive: true },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) => notifyUserSafely(admin.id, data, context)),
    );
  } catch (error) {
    console.error(`ارسال اعلان به مدیران ناموفق بود (${context})`, error);
  }
}

export async function listMyNotifications(userId: string) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { notifications, unreadCount };
}

export async function markNotificationRead(userId: string, id: string) {
  await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
}
