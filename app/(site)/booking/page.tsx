"use client";

import { useEffect, useMemo, useState } from "react";
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

import {
  listServices,
  listBarbers,
  getAvailability,
  getAvailabilityRange,
  createBookingApi,
  ApiError,
  type ApiService,
  type ApiBarber,
  type ApiSlotStatus,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getAuthToken } from "@/lib/data/mock-session";

type EntryPath = "barber" | "service";
type Step = "entry" | "pick" | "date" | "time" | "notes" | "auth" | "confirm";

const ALL_STEPS: Step[] = ["entry", "pick", "date", "time", "notes", "auth", "confirm"];

const loginSchema = z.object({
  mobile: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
  password: z.string().min(4, "رمز عبور باید حداقل ۴ کاراکتر باشد"),
});
type LoginValues = z.infer<typeof loginSchema>;

const quickRegisterSchema = z.object({
  name: z.string().min(3, "نام باید حداقل ۳ حرف باشد"),
  mobile: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
  password: z.string().min(4, "رمز عبور باید حداقل ۴ کاراکتر باشد"),
});
type QuickRegisterValues = z.infer<typeof quickRegisterSchema>;

function toPersianDigits(input: string) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return input.replace(/[0-9]/g, (d) => persianDigits[Number(d)]);
}

// ⚠️ نکته‌ی مهم: date.format("YYYY-MM-DD") روی یه DateObject شمسی، تاریخ
// شمسی برمی‌گردونه نه میلادی! بک‌اند تاریخ میلادی می‌خواد، پس همیشه از
// toDate() (که Date واقعی میلادی می‌ده) به این تابع رد می‌شه.
function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function BookingPage() {
  const { user, login, register: registerUser } = useAuth();

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [services, setServices] = useState<ApiService[]>([]);
  const [barbers, setBarbers] = useState<ApiBarber[]>([]);

  useEffect(() => {
    Promise.all([listServices(), listBarbers()])
      .then(([s, b]) => {
        setServices(s);
        setBarbers(b);
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "خطا در دریافت اطلاعات");
      })
      .finally(() => setIsLoadingData(false));
  }, []);

  // اگه کاربر از قبل لاگینه، مرحله‌ی auth کلاً حذف می‌شه
  const stepOrder = useMemo(() => (user ? ALL_STEPS.filter((s) => s !== "auth") : ALL_STEPS), [user]);

  const [step, setStep] = useState<Step>("entry");
  const [entryPath, setEntryPath] = useState<EntryPath | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [date, setDate] = useState<DateObject | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isFinalSubmitting, setIsFinalSubmitting] = useState(false);

  const [availableSlots, setAvailableSlots] = useState<ApiSlotStatus[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // روزهایی که تو ۳۰ روز آینده حداقل یه اسلات خالی دارن — برای رنگ‌کردن تقویم
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const CALENDAR_WINDOW_DAYS = 30;
  const calendarMaxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + CALENDAR_WINDOW_DAYS);
    return d;
  }, []);

  useEffect(() => {
    if (!selectedBarberId) {
      setAvailableDates(new Set());
      return;
    }
    setIsLoadingDates(true);
    const from = toISODate(new Date());
    const to = toISODate(calendarMaxDate);
    getAvailabilityRange(selectedBarberId, from, to)
      .then((dates) => setAvailableDates(new Set(dates)))
      .catch(() => setAvailableDates(new Set()))
      .finally(() => setIsLoadingDates(false));
  }, [selectedBarberId, calendarMaxDate]);

  const dateKey = date ? toISODate(date.toDate()) : null;

  useEffect(() => {
    if (!selectedBarberId || !dateKey) {
      setAvailableSlots([]);
      return;
    }
    setIsLoadingSlots(true);
    getAvailability(selectedBarberId, dateKey)
      .then(setAvailableSlots)
      .catch(() => setAvailableSlots([]))
      .finally(() => setIsLoadingSlots(false));
  }, [selectedBarberId, dateKey]);

  const servicesToShow = useMemo(() => {
    if (entryPath === "barber" && selectedBarberId) {
      const barber = barbers.find((b) => b.id === selectedBarberId);
      const ids = new Set(barber?.services.map((s) => s.serviceId) ?? []);
      return services.filter((s) => ids.has(s.id));
    }
    return services;
  }, [entryPath, selectedBarberId, barbers, services]);

  const barbersToShow = useMemo(() => {
    if (entryPath === "service" && selectedServiceId) {
      return barbers.filter((b) => b.services.some((s) => s.serviceId === selectedServiceId));
    }
    return barbers;
  }, [entryPath, selectedServiceId, barbers]);

  const selectedService = selectedServiceId ? services.find((s) => s.id === selectedServiceId) ?? null : null;
  const selectedBarber = selectedBarberId ? barbers.find((b) => b.id === selectedBarberId) ?? null : null;

  const stepIndex = stepOrder.indexOf(step);

  function goNext() {
    const idx = stepOrder.indexOf(step);
    if (idx < stepOrder.length - 1) setStep(stepOrder[idx + 1]);
  }

  function goBack() {
    const idx = stepOrder.indexOf(step);
    if (idx > 0) setStep(stepOrder[idx - 1]);
  }

  function canProceed() {
    if (step === "entry") return entryPath !== null;
    if (step === "pick")
      return entryPath === "barber" ? selectedServiceId !== null : selectedBarberId !== null;
    if (step === "date") return date !== null;
    if (step === "time") return time !== null;
    return true;
  }

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const {
    register: registerQuick,
    handleSubmit: handleQuickRegisterSubmit,
    formState: { errors: quickErrors, isSubmitting: isQuickSubmitting },
  } = useForm<QuickRegisterValues>({ resolver: zodResolver(quickRegisterSchema) });

  async function onLoginSubmit(values: LoginValues) {
    try {
      await login(values.mobile, values.password);
      setStep("confirm");
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.status === 401
            ? "شماره موبایل یا رمز عبور اشتباه است"
            : err.message
          : "مشکلی پیش آمد"
      );
    }
  }

  async function onQuickRegisterSubmit(values: QuickRegisterValues) {
    try {
      await registerUser(values.name, values.mobile, values.password);
      setStep("confirm");
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.status === 409
            ? "این شماره موبایل قبلاً ثبت شده — وارد شوید"
            : err.message
          : "مشکلی پیش آمد"
      );
    }
  }

  async function handleFinalConfirm() {
    const token = getAuthToken();
    if (!token || !selectedBarberId || !selectedServiceId || !dateKey || !time) return;
    setIsFinalSubmitting(true);
    try {
      await createBookingApi(
        {
          barberId: selectedBarberId,
          serviceId: selectedServiceId,
          date: dateKey,
          time,
          notes: notes || undefined,
        },
        token
      );
      toast.success("نوبت شما ثبت شد", {
        description: `${selectedService?.title} با ${selectedBarber?.user.name} — ${date?.format("YYYY/MM/DD")} ساعت ${toPersianDigits(time)}`,
      });
      setStep("entry");
      setEntryPath(null);
      setSelectedServiceId(null);
      setSelectedBarberId(null);
      setDate(null);
      setTime(null);
      setNotes("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ثبت نوبت، دوباره تلاش کنید");
    } finally {
      setIsFinalSubmitting(false);
    }
  }

  if (isLoadingData) {
    return (
      <main className="container max-w-xl py-14 text-center text-sm text-muted-foreground md:py-20">
        در حال بارگذاری...
      </main>
    );
  }

  return (
    <main className="container max-w-xl py-14 md:py-20">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold md:text-3xl">رزرو نوبت</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          مرحله {toPersianDigits(String(stepIndex + 1))} از {toPersianDigits(String(stepOrder.length))}
        </p>
        <div className="mt-4 flex gap-1.5">
          {stepOrder.map((s, i) => (
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
                entryPath === "barber" ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40",
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
                entryPath === "service" ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40",
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
                    isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {b.initials}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{b.user.name}</span>
                    <span className="block text-xs text-muted-foreground">{b.services.length} سرویس</span>
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
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedServiceId(s.id)}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-xl border p-4 text-right transition-colors",
                        isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40",
                      )}
                    >
                      <span className="text-sm font-medium">{s.title}</span>
                      <span className="text-xs text-muted-foreground">
                        از {s.priceValue.toLocaleString("fa-IR")} تومان
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
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedServiceId(s.id)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border p-4 text-right transition-colors",
                    isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  <span className="text-sm font-medium">{s.title}</span>
                  <span className="text-xs text-muted-foreground">
                    از {s.priceValue.toLocaleString("fa-IR")} تومان
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
                        isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40",
                      )}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {b.initials}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium">{b.user.name}</span>
                        <span className="block text-xs text-muted-foreground">{b.services.length} سرویس</span>
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
          {isLoadingDates && (
            <p className="text-xs text-muted-foreground">در حال بررسی روزهای خالی...</p>
          )}
          <JalaliDatePicker
            value={date}
            onChange={(newDate) => {
              setDate(newDate);
              setTime(null);
            }}
            placeholder="انتخاب تاریخ"
            maxDate={calendarMaxDate}
            mapDays={({ date: d }) => {
              const iso = toISODate(d.toDate());
              if (!availableDates.has(iso)) {
                return {
                  disabled: true,
                  style: { opacity: 0.35, textDecoration: "line-through" },
                };
              }
              return {};
            }}
          />
          <p className="text-xs text-muted-foreground">
            روزهای خاکستری/خط‌خورده یعنی این آرایشگر ظرفیت خالی نداره (تعطیل،
            مرخصی یا پر شده). فقط تا {toPersianDigits(String(CALENDAR_WINDOW_DAYS))}{" "}
            روز آینده قابل رزروه.
          </p>
        </div>
      )}

{step === "time" && (
  <div className="space-y-3">
    <Label>ساعت نوبت</Label>
    {isLoadingSlots ? (
      <p className="text-sm text-muted-foreground">در حال بررسی ساعات خالی...</p>
    ) : availableSlots.length === 0 ? (
      <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        برای این تاریخ ساعت خالی برای این آرایشگر وجود ندارد. لطفاً تاریخ
        دیگری انتخاب کنید.
      </p>
    ) : (
      <>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {availableSlots.map(({ time: slot, available }) => {
            const isSelected = time === slot;
            return (
              <button
                key={slot}
                type="button"
                disabled={!available}
                onClick={() => available && setTime(slot)}
                className={cn(
                  "rounded-lg border py-2.5 text-xs font-medium transition-colors",
                  !available
                    ? "cursor-not-allowed border-red-500/40 bg-red-500/10 text-red-400 line-through"
                    : isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40",
                )}
              >
                {toPersianDigits(slot)}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          ساعت‌های قرمز/خط‌خورده یعنی قبلاً رزرو شدن یا بلاک‌شدن.
        </p>
      </>
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

      {step === "auth" && (
        <div className="space-y-4">
          <div className="flex gap-2 rounded-lg bg-secondary p-1">
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className={cn(
                "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                authMode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              ورود
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("register")}
              className={cn(
                "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                authMode === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              ثبت‌نام سریع
            </button>
          </div>

          {authMode === "login" ? (
            <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-mobile">شماره موبایل</Label>
                <Input
                  id="login-mobile"
                  dir="ltr"
                  className="text-left"
                  placeholder="09123456789"
                  {...registerLogin("mobile")}
                />
                {loginErrors.mobile && <p className="text-xs text-red-400">{loginErrors.mobile.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">رمز عبور</Label>
                <Input id="login-password" type="password" dir="ltr" className="text-left" {...registerLogin("password")} />
                {loginErrors.password && <p className="text-xs text-red-400">{loginErrors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoginSubmitting}>
                ورود و ادامه
              </Button>
            </form>
          ) : (
            <form onSubmit={handleQuickRegisterSubmit(onQuickRegisterSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name">نام و نام خانوادگی</Label>
                <Input id="reg-name" placeholder="مثلاً علی محمدی" {...registerQuick("name")} />
                {quickErrors.name && <p className="text-xs text-red-400">{quickErrors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-mobile">شماره موبایل</Label>
                <Input
                  id="reg-mobile"
                  dir="ltr"
                  className="text-left"
                  placeholder="09123456789"
                  {...registerQuick("mobile")}
                />
                {quickErrors.mobile && <p className="text-xs text-red-400">{quickErrors.mobile.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">رمز عبور</Label>
                <Input id="reg-password" type="password" dir="ltr" className="text-left" {...registerQuick("password")} />
                {quickErrors.password && <p className="text-xs text-red-400">{quickErrors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isQuickSubmitting}>
                ثبت‌نام و ادامه
              </Button>
            </form>
          )}
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-6">
          <div className="space-y-3 rounded-xl border border-border bg-card p-5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">آرایشگر</span>
              <span className="font-medium">{selectedBarber?.user.name}</span>
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
              <span className="font-medium">{time ? toPersianDigits(time) : ""}</span>
            </div>
            {notes && (
              <div className="flex justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">توضیحات</span>
                <span className="font-medium">{notes}</span>
              </div>
            )}
            {user && (
              <div className="flex justify-between border-t border-border pt-3">
                <span className="text-muted-foreground">نام</span>
                <span className="font-medium">{user.name}</span>
              </div>
            )}
          </div>
          <Button onClick={handleFinalConfirm} size="lg" className="w-full" disabled={isFinalSubmitting}>
            {isFinalSubmitting ? "در حال ثبت..." : "ثبت نهایی نوبت"}
          </Button>
        </div>
      )}

      {step !== "auth" && step !== "confirm" && (
        <div className="mt-8 flex gap-3">
          {stepIndex > 0 && (
            <Button type="button" variant="outline" onClick={goBack} className="gap-1">
              <ChevronRight className="h-4 w-4" />
              قبلی
            </Button>
          )}
          <Button type="button" onClick={goNext} disabled={!canProceed()} className="flex-1 gap-1">
            بعدی
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </main>
  );
}