import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/modules/notifications/notifications.service";

// چند دقیقه قبل از نوبت یادآوری بفرسته (برای تست موقت می‌تونی 1440 بذاری)
const LEAD_MINUTES = 120;
// هر چند وقت یک‌بار چک کنه
const CHECK_INTERVAL_MS = 60_000;
// ایران بدون ساعت تابستانی: UTC+3:30
const TEHRAN_OFFSET_MINUTES = 210;

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

function toPersianDigits(input: string) {
  return input.replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

// date تو دیتابیس فقط «روز» رو نگه می‌داره و time رشته‌ی "14:00" هست؛
// اینجا با هم ترکیبشون می‌کنیم تا زمان واقعی شروع نوبت (به وقت تهران) به‌دست بیاد
function getAppointmentStart(date: Date, time: string): Date {
  const [year, month, day] = date.toISOString().slice(0, 10).split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(
    Date.UTC(year, month - 1, day, hour, minute) - TEHRAN_OFFSET_MINUTES * 60_000,
  );
}

async function runReminderCheck() {
  const now = new Date();

  // بازه‌ی گشاد برای کوئری؛ فیلتر دقیق زمان پایین‌تر تو جاوااسکریپت انجام می‌شه
  const from = new Date(now.getTime() - 36 * 60 * 60_000);
  const to = new Date(now.getTime() + 36 * 60 * 60_000);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED", // نوبت لغوشده/تمام‌شده اصلاً وارد نمی‌شه
      reminderSentAt: null,
      date: { gte: from, lte: to },
    },
    include: {
      barber: { include: { user: { select: { name: true } } } },
      service: { select: { title: true } },
    },
  });

  for (const booking of bookings) {
    const start = getAppointmentStart(booking.date, booking.time);
    const remindAt = new Date(start.getTime() - LEAD_MINUTES * 60_000);

    // هنوز زود است، یا نوبت شروع شده
    if (now < remindAt || now >= start) continue;

    // نوبتی که داخل همین بازه‌ی ۲ ساعته رزرو شده، یادآوری نمی‌خواد
    if (booking.createdAt >= remindAt) continue;

    // «رزرو» کردن یادآوری: فقط یک اجرا می‌تونه reminderSentAt رو از null عوض کنه
    const claimed = await prisma.booking.updateMany({
      where: { id: booking.id, reminderSentAt: null, status: "CONFIRMED" },
      data: { reminderSentAt: now },
    });
    if (claimed.count === 0) continue;

    try {
      await notifyUser(booking.customerId, {
        type: "BOOKING_REMINDER",
        title: "یادآوری نوبت",
        body: `نوبت «${booking.service.title}» شما ساعت ${toPersianDigits(booking.time)} با ${booking.barber.user.name} است.`,
        link: "/customer/bookings",
      });
    } catch (err) {
      console.error("خطا در ارسال یادآوری نوبت", booking.id, err);
      // برای اینکه اجرای بعدی دوباره تلاش کنه
      await prisma.booking
        .update({ where: { id: booking.id }, data: { reminderSentAt: null } })
        .catch(() => {});
    }
  }
}

let running = false;

async function safeRun() {
  if (running) return; // اگه اجرای قبلی هنوز تموم نشده، هم‌پوشانی نداشته باشیم
  running = true;
  try {
    await runReminderCheck();
  } catch (err) {
    console.error("خطا در job یادآوری نوبت", err);
  } finally {
    running = false;
  }
}

export function startReminderJob() {
  void safeRun();
  return setInterval(() => void safeRun(), CHECK_INTERVAL_MS);
}