"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check, User, Scissors, ChevronRight, ChevronLeft } from "lucide-react";
import type { DateObject } from "react-multi-date-picker";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { cn } from "@/lib/utils";

import { services, getServiceById } from "@/lib/data/services";
import {
  barbers,
  getBarberById,
  getBarbersByService,
  getServicesByBarber,
} from "@/lib/data/barbers";
import { getAvailableSlots } from "@/lib/data/availability";

// -------------------------------------------------------------
// TODO: این کل فلو mock هست. وقتی بک‌اند آماده شد:
// - availability باید از API بیاد نه از lib/data/availability
// - authGate باید به یک سیستم auth واقعی (session/JWT) وصل بشه
// - onSubmit نهایی باید به /api/bookings پست بشه
// -------------------------------------------------------------

type EntryPath = "barber" | "service";
type Step = "entry" | "pick" | "date" | "time" | "notes" | "auth" | "confirm";

const STEP_ORDER: Step[] = [
  "entry",
  "pick",
  "date",
  "time",
  "notes",
  "auth",
  "confirm",
];

const authSchema = z.object({
  name: z.string().min(3, "نام باید حداقل ۳ حرف باشد"),
  phone: z
    .string()
    .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست (مثلاً ۰۹۱۲xxxxxxx)"),
});
type AuthValues = z.infer<typeof authSchema>;

function toPersianDigits(input: string) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return input.replace(/[0-9]/g, (d) => persianDigits[Number(d)]);
}

export default function BookingPage() {
  const [step, setStep] = useState<Step>("entry");
  const [entryPath, setEntryPath] = useState<EntryPath | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [date, setDate] = useState<DateObject | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // mock auth state — در پروژه‌ی واقعی از session/context میاد
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { name: "", phone: "" },
  });

  const dateKey = date ? date.format("YYYY-MM-DD") : null;

  const availableSlots = useMemo(() => {
    if (!selectedBarberId || !dateKey) return [];
    return getAvailableSlots(selectedBarberId, dateKey);
  }, [selectedBarberId, dateKey]);

  const servicesToShow = useMemo(() => {
    if (entryPath === "barber" && selectedBarberId) {
      const ids = getServicesByBarber(selectedBarberId);
      return services.filter((s) => ids.includes(s.id));
    }
    return services;
  }, [entryPath, selectedBarberId]);

  const barbersToShow = useMemo(() => {
    if (entryPath === "service" && selectedServiceId) {
      return getBarbersByService(selectedServiceId);
    }
    return barbers;
  }, [entryPath, selectedServiceId]);

  const selectedService = selectedServiceId
    ? getServiceById(selectedServiceId)
    : null;
  const selectedBarber = selectedBarberId
    ? getBarberById(selectedBarberId)
    : null;

  function goNext() {
    const idx = STEP_ORDER.indexOf(step);
    if (step === "auth" && isLoggedIn) {
      setStep("confirm");
      return;
    }
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
  }

  function goBack() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }

  function canProceed() {
    if (step === "entry") return entryPath !== null;
    if (step === "pick")
      return entryPath === "barber"
        ? selectedServiceId !== null
        : selectedBarberId !== null;
    if (step === "date") return date !== null;
    if (step === "time") return time !== null;
    return true;
  }

  function handleAuthSubmit(values: AuthValues) {
    setCustomerName(values.name);
    setIsLoggedIn(true);
    setStep("confirm");
  }

  async function handleFinalConfirm() {
    // TODO: اتصال به API واقعی رزرو وقتی بک‌اند آماده شد
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success("نوبت شما ثبت شد", {
      description: `${selectedService?.title} با ${selectedBarber?.name} — ${date?.format("YYYY/MM/DD")} ساعت ${time ? toPersianDigits(time) : ""}`,
    });
    setStep("entry");
    setEntryPath(null);
    setSelectedServiceId(null);
    setSelectedBarberId(null);
    setDate(null);
    setTime(null);
    setNotes("");
  }

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <main className="container max-w-xl py-14 md:py-20">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold md:text-3xl">رزرو نوبت</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          مرحله {toPersianDigits(String(stepIndex + 1))} از{" "}
          {toPersianDigits(String(STEP_ORDER.length))}
        </p>
        <div className="mt-4 flex gap-1.5">
          {STEP_ORDER.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= stepIndex ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>
      </div>

      {step === "entry" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            می‌خوای اول آرایشگرت رو انتخاب کنی یا سرویس مورد نظرت رو؟
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setEntryPath("barber")}
              className={cn(
                "flex flex-col items-center gap-3 rounded-xl border p-6 text-center transition-colors",
                entryPath === "barber"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <User className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">اول آرایشگر</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryPath("service")}
              className={cn(
                "flex flex-col items-center gap-3 rounded-xl border p-6 text-center transition-colors",
                entryPath === "service"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <Scissors className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">اول سرویس</span>
            </button>
          </div>
        </div>
      )}

      {step === "pick" && entryPath === "barber" && (
        <div className="space-y-3">
          <Label>انتخاب آرایشگر</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {barbersToShow.map((b) => {
              const isSelected = selectedBarberId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBarberId(b.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-4 text-right transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {b.initials}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{b.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {b.serviceIds.length} سرویس
                    </span>
                  </span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>

          {selectedBarberId && (
            <div className="mt-6 space-y-3">
              <Label>انتخاب سرویس</Label>
              <div className="grid grid-cols-2 gap-3">
                {servicesToShow.map((s) => {
                  const isSelected = selectedServiceId === s.id;
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedServiceId(s.id)}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-xl border p-4 text-right transition-colors",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/40",
                      )}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium">{s.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {step === "pick" && entryPath === "service" && (
        <div className="space-y-3">
          <Label>انتخاب سرویس</Label>
          <div className="grid grid-cols-2 gap-3">
            {servicesToShow.map((s) => {
              const isSelected = selectedServiceId === s.id;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedServiceId(s.id)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border p-4 text-right transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium">{s.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.price}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedServiceId && (
            <div className="mt-6 space-y-3">
              <Label>انتخاب آرایشگر</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {barbersToShow.map((b) => {
                  const isSelected = selectedBarberId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBarberId(b.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-4 text-right transition-colors",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/40",
                      )}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {b.initials}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium">
                          {b.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {b.serviceIds.length} سرویس
                        </span>
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {step === "date" && (
        <div className="space-y-2">
          <Label>تاریخ نوبت</Label>
          <JalaliDatePicker
            value={date}
            onChange={(newDate) => {
              setDate(newDate);
              setTime(null);
            }}
            placeholder="انتخاب تاریخ"
          />
        </div>
      )}

      {step === "time" && (
        <div className="space-y-3">
          <Label>ساعت نوبت</Label>
          {availableSlots.length === 0 ? (
            <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              برای این تاریخ ساعت خالی برای این آرایشگر وجود ندارد. لطفاً تاریخ
              دیگری انتخاب کنید.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {availableSlots.map((slot) => {
                const isSelected = time === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={cn(
                      "rounded-lg border py-2.5 text-xs font-medium transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {toPersianDigits(slot)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === "notes" && (
        <div className="space-y-2">
          <Label htmlFor="notes">توضیحات (اختیاری)</Label>
          <Textarea
            id="notes"
            placeholder="نکته‌ی خاصی هست که بخواید بگید؟"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}

      {step === "auth" && !isLoggedIn && (
        <form onSubmit={handleSubmit(handleAuthSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            برای تکمیل رزرو، لطفاً اطلاعاتتون رو وارد کنید.
          </p>
          <div className="space-y-2">
            <Label htmlFor="name">نام و نام خانوادگی</Label>
            <Input
              id="name"
              placeholder="مثلاً علی محمدی"
              {...register("name")}
            />
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            ادامه
          </Button>
        </form>
      )}

      {step === "confirm" && (
        <div className="space-y-6">
          <div className="space-y-3 rounded-xl border border-border bg-card p-5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">آرایشگر</span>
              <span className="font-medium">{selectedBarber?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">سرویس</span>
              <span className="font-medium">{selectedService?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">تاریخ</span>
              <span className="font-medium">{date?.format("YYYY/MM/DD")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ساعت</span>
              <span className="font-medium">
                {time ? toPersianDigits(time) : ""}
              </span>
            </div>
            {notes && (
              <div className="flex justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">توضیحات</span>
                <span className="font-medium">{notes}</span>
              </div>
            )}
            {customerName && (
              <div className="flex justify-between border-t border-border pt-3">
                <span className="text-muted-foreground">نام</span>
                <span className="font-medium">{customerName}</span>
              </div>
            )}
          </div>
          <Button onClick={handleFinalConfirm} size="lg" className="w-full">
            ثبت نهایی نوبت
          </Button>
        </div>
      )}

      {step !== "auth" && step !== "confirm" && (
        <div className="mt-8 flex gap-3">
          {stepIndex > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="gap-1"
            >
              <ChevronRight className="h-4 w-4" />
              قبلی
            </Button>
          )}
          <Button
            type="button"
            onClick={goNext}
            disabled={!canProceed()}
            className="flex-1 gap-1"
          >
            بعدی
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </main>
  );
}
