"use client";

import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/backgrounds/bg-dark.css";
import "react-multi-date-picker/styles/colors/green.css";

interface JalaliDatePickerProps {
  value: DateObject | null;
  onChange: (date: DateObject | null) => void;
  placeholder?: string;
  minDate?: DateObject | Date;
  maxDate?: DateObject | Date;
  // برای غیرفعال/خاکستری‌کردن روزهای بدون ظرفیت تو تقویم رزرو
  mapDays?: (args: { date: DateObject }) => Record<string, unknown> | void;
}

export function JalaliDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  minDate,
  maxDate,
  mapDays,
}: JalaliDatePickerProps) {
  return (
    <DatePicker
      calendar={persian}
      locale={persian_fa}
      value={value}
      onChange={(date) => onChange(date as DateObject | null)}
      calendarPosition="bottom-right"
      className="bg-dark green"
      inputClass="jalali-input"
      placeholder={placeholder}
      minDate={minDate ?? new Date()}
      maxDate={maxDate}
      mapDays={mapDays}
    />
  );
}