"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Scissors, Sparkles, Droplet, Palette, Check } from "lucide-react";
import type { DateObject } from "react-multi-date-picker";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { cn } from "@/lib/utils";

// این لیست فعلاً ثابته؛ همون خدمات صفحه‌ی اصلیه. بعداً می‌تونه از یه فایل مشترک بیاد.
const services = [
  { title: "اصلاح مو", price: "از ۲۵۰ هزار تومان", icon: Scissors },
  { title: "اصلاح و فرم ریش", price: "از ۱۸۰ هزار تومان", icon: Sparkles },
  { title: "پاکسازی و ماسک صورت", price: "از ۳۰۰ هزار تومان", icon: Droplet },
  { title: "رنگ و هایلایت", price: "از ۴۵۰ هزار تومان", icon: Palette },
] as const;

// TODO: این بازه‌های ساعتی فعلاً پیش‌فرض و ثابتن (هر ساعت یکی، ۹ تا ۲۱).
// بعداً وقتی پنل مدیریت آماده شد، این لیست باید از بک‌اند و بر اساس روز/ظرفیت واقعی بیاد.
const timeSlots = Array.from({ length: 13 }, (_, i) => {
  const hour = 9 + i;
  return `${hour.toString().padStart(2, "0")}:00`;
});

function toPersianDigits(input: string) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return input.replace(/[0-9]/g, (d) => persianDigits[Number(d)]);
}

// نکته: «تاریخ» عمداً بیرون از schema زده نگه داشته شده. کلاس DateObject
// (از react-multi-date-picker) به‌خاطر متدهای زیادش با سیستم تایپ zod +
// react-hook-form تداخل تایپی ایجاد می‌کنه. برای همین با یه useState جدا
// مدیریتش می‌کنیم و قبل از ثبت نهایی دستی چکش می‌کنیم.
const bookingSchema = z.object({
  name: z.string().min(3, "نام باید حداقل ۳ حرف باشد"),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست (مثلاً ۰۹۱۲xxxxxxx)"),
  service: z.string().min(1, "لطفاً یک سرویس انتخاب کنید"),
  time: z.string().min(1, "لطفاً ساعت را انتخاب کنید"),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function BookingPage() {
  const [date, setDate] = useState<DateObject | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: "",
      phone: "",
      service: "",
      time: "",
      notes: "",
    },
  });

  async function onSubmit(values: BookingFormValues) {
    if (!date) {
      setDateError("لطفاً تاریخ را انتخاب کنید");
      return;
    }
    setDateError(null);

    // TODO: اتصال به API واقعی رزرو وقتی بک‌اند آماده شد
    await new Promise((resolve) => setTimeout(resolve, 600));

    toast.success("نوبت شما ثبت شد", {
      description: `${values.service} — ${date.format("YYYY/MM/DD")} ساعت ${toPersianDigits(values.time)}`,
    });

    reset();
    setDate(null);
  }

  return (
    <main className="container max-w-xl py-14 md:py-20">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold md:text-3xl">رزرو نوبت</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          اطلاعاتتون رو وارد کنید تا نوبتتون رو ثبت کنیم.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-9">
        {/* اطلاعات تماس */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">نام و نام خانوادگی</Label>
            <Input id="name" placeholder="مثلاً علی محمدی" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">شماره موبایل</Label>
            <Input
              id="phone"
              placeholder="۰۹xxxxxxxxx"
              inputMode="numeric"
              dir="ltr"
              className="text-right"
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-xs text-red-400">{errors.phone.message}</p>
            )}
          </div>
        </div>

        {/* انتخاب سرویس */}
        <div className="space-y-3">
          <Label>انتخاب سرویس</Label>
          <Controller
            control={control}
            name="service"
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-3">
                {services.map((s) => {
                  const isSelected = field.value === s.title;
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => field.onChange(s.title)}
                      className={cn(
                        "relative flex flex-col items-start gap-2 rounded-xl border p-4 text-right transition-colors",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      {isSelected && (
                        <span className="absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium">{s.title}</span>
                      <span className="text-xs text-muted-foreground">{s.price}</span>
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.service && (
            <p className="text-xs text-red-400">{errors.service.message}</p>
          )}
        </div>

        {/* تاریخ */}
        <div className="space-y-2">
          <Label>تاریخ نوبت</Label>
          <JalaliDatePicker
            value={date}
            onChange={(newDate) => {
              setDate(newDate);
              if (newDate) setDateError(null);
            }}
            placeholder="انتخاب تاریخ"
          />
          {dateError && <p className="text-xs text-red-400">{dateError}</p>}
        </div>

        {/* ساعت */}
        <div className="space-y-3">
          <Label>ساعت نوبت</Label>
          <Controller
            control={control}
            name="time"
            render={({ field }) => (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {timeSlots.map((slot) => {
                  const isSelected = field.value === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => field.onChange(slot)}
                      className={cn(
                        "rounded-lg border py-2.5 text-xs font-medium transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {toPersianDigits(slot)}
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.time && (
            <p className="text-xs text-red-400">{errors.time.message}</p>
          )}
        </div>

        {/* توضیحات */}
        <div className="space-y-2">
          <Label htmlFor="notes">توضیحات (اختیاری)</Label>
          <Textarea
            id="notes"
            placeholder="نکته‌ی خاصی هست که بخواید بگید؟"
            {...register("notes")}
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "در حال ثبت..." : "ثبت نهایی نوبت"}
        </Button>
      </form>
    </main>
  );
}