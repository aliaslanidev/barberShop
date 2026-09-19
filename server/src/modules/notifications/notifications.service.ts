import { prisma } from "@/lib/prisma";
import { webpush } from "@/lib/webPush";
import type { NotificationType } from "@prisma/client";
import type { SubscribePushInput } from "@/modules/notifications/notifications.schema";

// ثبت نوتیف تو اینباکس دیتابیس + تلاش برای ارسال Push به همه‌ی
// دستگاه‌های ثبت‌شده‌ی همون کاربر. هر جای دیگه‌ی کد (بوکینگ، مرخصی، امتیاز)
// فقط همین یه تابع رو صدا می‌زنه، بدون نگرانی از جزئیات Push.
export async function notifyUser(
  userId: string,
  data: { type: NotificationType; title: string; body: string; link?: string },
) {
  const notification = await prisma.notification.create({
    data: { userId, type: data.type, title: data.title, body: data.body, link: data.link },
  });

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.all(
    subscriptions.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: data.title, body: data.body, link: data.link }),
        )
        .catch(async (err: { statusCode?: number }) => {
          // ۴۰۴/۴۱۰ یعنی این اشتراک دیگه معتبر نیست (کاربر مرورگر/دستگاهش رو عوض کرده یا اجازه رو برداشته)
          if (err.statusCode === 404 || err.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        }),
    ),
  );

  return notification;
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

export async function subscribeToPush(userId: string, input: SubscribePushInput) {
  await prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    create: { userId, endpoint: input.endpoint, p256dh: input.keys.p256dh, auth: input.keys.auth },
    update: { userId, p256dh: input.keys.p256dh, auth: input.keys.auth },
  });
}

export async function unsubscribeFromPush(userId: string, endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
}