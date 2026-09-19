"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  listMyNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  type ApiNotification,
} from "@/lib/api";
import { enablePushNotifications, getNotificationPermission } from "@/lib/push-notifications";
import { getAuthToken } from "@/lib/data/mock-session";

const POLL_INTERVAL_MS = 30000;

function timeAgoFa(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "همین الان";
  if (diffMin < 60) return `${diffMin} دقیقه پیش`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} ساعت پیش`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD} روز پیش`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  function refresh() {
    const token = getAuthToken();
    if (!token) return;
    listMyNotificationsApi(token)
      .then((data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {});
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // درخواست اجازه‌ی Push فقط یه‌بار، بعد از اولین باری که کاربر لاگین کرده
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    if (getNotificationPermission() === "default") {
      enablePushNotifications(token).catch(() => {});
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleOpen() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) refresh();
  }

  function handleNotificationClick(n: ApiNotification) {
    if (!n.isRead) {
      const token = getAuthToken();
      if (token) {
        markNotificationReadApi(n.id, token).catch(() => {});
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    }
    setOpen(false);
  }

  async function handleMarkAllRead() {
    const token = getAuthToken();
    if (!token) return;
    await markAllNotificationsReadApi(token).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="اعلان‌ها"
      >
        {unreadCount > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "۹+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-medium">اعلان‌ها</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Check className="h-3 w-3" />
                خواندن همه
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted-foreground">اعلانی وجود ندارد</p>
            ) : (
              notifications.map((n) => {
                const content = (
                  <div
                    className={cn(
                      "flex flex-col gap-0.5 border-b border-border px-4 py-3 text-right transition-colors last:border-b-0 hover:bg-secondary/50",
                      !n.isRead && "bg-primary/5",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium">{n.title}</span>
                      {!n.isRead && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <span className="text-xs leading-6 text-muted-foreground">{n.body}</span>
                    <span className="text-[10px] text-muted-foreground">{timeAgoFa(n.createdAt)}</span>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => handleNotificationClick(n)}>
                    {content}
                  </Link>
                ) : (
                  <button key={n.id} type="button" onClick={() => handleNotificationClick(n)} className="block w-full">
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}