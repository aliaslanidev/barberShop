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
