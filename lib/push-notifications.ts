import { subscribePushApi, type PushSubscriptionJSON } from "@/lib/api";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// درخواست اجازه از کاربر + subscribe به Web Push + ارسال subscription به سرور.
// اگه مرورگر پشتیبانی نکنه یا کاربر اجازه نده، بی‌سروصدا false برمی‌گردونه.
export async function enablePushNotifications(token: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window))
    return false;

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        vapidPublicKey,
      ) as BufferSource,
    });
  }

  const json = subscription.toJSON() as PushSubscriptionJSON;
  if (!json.endpoint || !json.keys) return false;

  await subscribePushApi(json, token);
  return true;
}

// آیا کاربر الان اجازه‌ی نوتیف داده (برای نشون‌دادن وضعیت تو UI در آینده)
export function getNotificationPermission():
  | NotificationPermission
  | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window))
    return "unsupported";
  return Notification.permission;
}
