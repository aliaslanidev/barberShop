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
}

export function JalaliDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
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
      minDate={new Date()}
    />
  );
}