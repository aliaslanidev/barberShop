// این فایل فقط شبیه‌سازیه (mock) تا وقتی بک‌اند واقعی وصل بشه.
// منطق واقعی availability (طبق اسکوپ پروژه) باید سمت سرور محاسبه بشه:
// Working Hours + Fixed Slots - Breaks - TimeOff - Holidays - Existing Bookings

export const ALL_TIME_SLOTS = Array.from({ length: 13 }, (_, i) => {
  const hour = 9 + i;
  return `${hour.toString().padStart(2, "0")}:00`;
});

// هش ساده و دترمینیستیک برای اینکه با یه ورودی ثابت (بربر+تاریخ)
// همیشه یه نتیجه‌ی یکسان بگیریم (نه رندوم واقعی هر بار رفرش).
function seededHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * برای یک بربر و تاریخ مشخص، اسلات‌های در دسترس رو برمی‌گردونه.
 * dateKey باید یه رشته‌ی ثابت باشه (مثلاً "1404-07-01") تا نتیجه پایدار بمونه.
 */
export function getAvailableSlots(barberId: string, dateKey: string): string[] {
  const seed = seededHash(`${barberId}-${dateKey}`);
  return ALL_TIME_SLOTS.filter((_, index) => {
    // حدود ۳۰٪ اسلات‌ها رو به‌صورت دترمینیستیک "غیرفعال" می‌کنیم (بلاک‌شده یا رزروشده)
    return (seed + index * 7) % 10 >= 3;
  });
}