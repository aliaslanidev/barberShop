"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check, CheckCircle2, User, Scissors, ChevronRight, ChevronLeft } from "lucide-react";
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
  createSlotHoldApi,
  extendSlotHoldApi,
  releaseSlotHoldApi,
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

// ردیف BarberService با فیلدهای فاز ۵ (customPrice / isActive)
type BarberServiceLike = {
  serviceId: string;
  customPrice?: number | null;
  isActive?: boolean;
};

// خلاصه‌ی نوبتِ ثبت‌شده برای صفحه‌ی تاییدیه
type ConfirmedBooking = {
  barberName: string;
  serviceTitle: string;
  dateLabel: string;
  time: string;
  price: number | null;
  notes: string;
};

function toPersianDigits(input: string) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return input.replace(/[0-9]/g, (d) => persianDigits[Number(d)]);
}

function formatPrice(value: number) {
  return `${value.toLocaleString("fa-IR")} تومان`;
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
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBooking | null>(null);

  const [availableSlots, setAvailableSlots] = useState<ApiSlotStatus[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // ---------- Slot Hold: نگه‌داری موقت اسلات از لحظه‌ی انتخاب تا تایید نهایی ----------
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null); // timestamp (ms)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // هر بار holdId عوض می‌شه (یا کامپوننت آنماونت می‌شه)، هولدِ قبلی آزاد
  // می‌شه. این cleanup هم مسیر «برگشتن به مرحله‌ی قبل»، هم «ترک صفحه» رو
  // پوشش می‌ده. اگه کاربر کلاً تب رو ببنده، ۵ دقیقه‌ی expiresAt سمت سرور
  // خط دفاع نهاییه.
  useEffect(() => {
    if (!holdId) return;
    const idToRelease = holdId;
    return () => {
      releaseSlotHoldApi(idToRelease).catch(() => {});
    };
  }, [holdId]);

  // شمارش معکوس نمایشی برای مشتری
  useEffect(() => {
    if (!holdExpiresAt) {
      setRemainingSeconds(null);
      return;
    }
    function tick() {
      setRemainingSeconds(Math.max(0, Math.round((holdExpiresAt! - Date.now()) / 1000)));
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt]);

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

  // ---------- قیمت‌ها ----------
  // ردیف‌های فعالِ خدماتِ یک آرایشگر (سرویس‌های غیرفعال‌شده توسط خودش حذف می‌شن)
  function activeRows(barber: ApiBarber): BarberServiceLike[] {
    return (barber.services as unknown as BarberServiceLike[]).filter((r) => r.isActive !== false);
  }

  // قیمت نهایی = قیمت اختصاصی آرایشگر، وگرنه قیمت پیش‌فرض سرویس
  function getPrice(barberId: string, serviceId: string): number | null {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return null;
    const barber = barbers.find((b) => b.id === barberId);
    const row = barber ? activeRows(barber).find((r) => r.serviceId === serviceId) : undefined;
    return row?.customPrice ?? service.priceValue;
  }

  // برای مسیر «اول سرویس»: چون قیمت هر آرایشگر می‌تونه فرق کنه، بازه‌ی قیمت رو نشون می‌دیم
  function getServicePriceLabel(serviceId: string): string {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return "";
    const prices = barbers
      .filter((b) => activeRows(b).some((r) => r.serviceId === serviceId))
      .map((b) => getPrice(b.id, serviceId))
      .filter((p): p is number => p !== null);
    if (prices.length === 0) return formatPrice(service.priceValue);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatPrice(min) : `از ${formatPrice(min)}`;
  }

  const servicesToShow = useMemo(() => {
    if (entryPath === "barber" && selectedBarberId) {
      const barber = barbers.find((b) => b.id === selectedBarberId);
      const ids = new Set(barber ? activeRows(barber).map((r) => r.serviceId) : []);
      return services.filter((s) => ids.has(s.id));
    }
    return services;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryPath, selectedBarberId, barbers, services]);

  const barbersToShow = useMemo(() => {
    if (entryPath === "service" && selectedServiceId) {
      return barbers.filter((b) => activeRows(b).some((r) => r.serviceId === selectedServiceId));
    }
    return barbers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryPath, selectedServiceId, barbers]);

  const selectedService = selectedServiceId ? services.find((s) => s.id === selectedServiceId) ?? null : null;
  const selectedBarber = selectedBarberId ? barbers.find((b) => b.id === selectedBarberId) ?? null : null;
  const selectedPrice =
    selectedBarberId && selectedServiceId ? getPrice(selectedBarberId, selectedServiceId) : null;

  const stepIndex = stepOrder.indexOf(step);

  function refreshSlots() {
    if (selectedBarberId && dateKey) {
      getAvailability(selectedBarberId, dateKey).then(setAvailableSlots).catch(() => {});
    }
  }

  // انتخاب ساعت: به‌جای فقط setTime، یه هولد ۵ دقیقه‌ای روی سرور می‌سازه
  async function handleSelectTime(slot: string) {
    if (!selectedBarberId || !dateKey || time === slot) return;

    const previousHoldId = holdId;
    setTime(null);
    setHoldId(null);
    setHoldExpiresAt(null);

    try {
      const hold = await createSlotHoldApi({ barberId: selectedBarberId, date: dateKey, time: slot });
      setTime(slot);
      setHoldId(hold.id);
      setHoldExpiresAt(new Date(hold.expiresAt).getTime());
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "این ساعت دیگر در دسترس نیست");
      refreshSlots();
    } finally {
      // هولدِ ساعت قبلی (اگه داشتیم) رو آزاد کن — چون useEffect بالا فقط
      // وقتی این اجرا می‌شه که state واقعاً به مقدار جدید ست بشه
      if (previousHoldId) releaseSlotHoldApi(previousHoldId).catch(() => {});
    }
  }

  async function goNext() {
    const idx = stepOrder.indexOf(step);

    // اگه هولدی داریم (یعنی از مرحله‌ی ساعت به بعدیم)، قبل از رفتن به
    // مرحله‌ی بعد، تمدیدش می‌کنیم تا در طول پر کردن فرم از دستش ندیم
    if (holdId && step !== "confirm") {
      try {
        const hold = await extendSlotHoldApi(holdId);
        setHoldExpiresAt(new Date(hold.expiresAt).getTime());
      } catch {
        toast.error("زمان نگه‌داری این ساعت تمام شد، لطفاً دوباره انتخاب کنید");
        setHoldId(null);
        setHoldExpiresAt(null);
        setTime(null);
        setStep("time");
        refreshSlots();
        return;
      }
    }

    if (idx < stepOrder.length - 1) setStep(stepOrder[idx + 1]);
  }

  function goBack() {
    const idx = stepOrder.indexOf(step);
    if (idx <= 0) return;

    // برگشتن از مرحله‌ی ساعت یعنی کاربر می‌خواد ساعت رو عوض کنه —
    // هولد فعلی رو آزاد می‌کنیم
    if (step === "time" && holdId) {
      setHoldId(null);
      setHoldExpiresAt(null);
      setTime(null);
    }

    setStep(stepOrder[idx - 1]);
  }

  function canProceed() {
    if (step === "entry") return entryPath !== null;
    if (step === "pick")
      return entryPath === "barber"
        ? selectedBarberId !== null && selectedServiceId !== null
        : selectedServiceId !== null && selectedBarberId !== null;
    if (step === "date") return date !== null;
    if (step === "time") return time !== null;
    return true;
  }

  // شروع یک رزرو جدید از اول (بعد از صفحه‌ی تاییدیه)
  function resetFlow() {
    setConfirmedBooking(null);
    setStep("entry");
    setEntryPath(null);
    setSelectedServiceId(null);
    setSelectedBarberId(null);
    setDate(null);
    setTime(null);
    setNotes("");
    setHoldId(null);
    setHoldExpiresAt(null);
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
          holdId: holdId ?? undefined,
        },
        token
      );

      // خلاصه‌ی نوبت رو قبل از پاک‌شدن stateها نگه می‌داریم تا صفحه‌ی تاییدیه نشونش بده
      setConfirmedBooking({
        barberName: selectedBarber?.user.name ?? "",
        serviceTitle: selectedService?.title ?? "",
        dateLabel: date?.format("YYYY/MM/DD") ?? "",
        time,
        price: selectedPrice,
        notes,
      });
      // هولد سمت سرور بعد از ثبت موفق پاک شده
      setHoldId(null);
      setHoldExpiresAt(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ثبت نوبت، دوباره تلاش کنید");
      // اسلات از دست رفته (هولد منقضی شده یا کس دیگه‌ای زودتر گرفتتش) —
      // برش‌گردون به مرحله‌ی انتخاب ساعت با لیست به‌روز
      if (err instanceof ApiError && err.status === 409) {
        setHoldId(null);
        setHoldExpiresAt(null);
        setTime(null);
        setStep("time");
        refreshSlots();
      }
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

  // ---------- صفحه‌ی تاییدیه بعد از ثبت موفق ----------
  if (confirmedBooking) {
    return (
      <main className="container max-w-xl py-14 md:py-20">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-9 w-9 text-primary" />
          </span>
          <h1 className="mt-5 text-2xl font-bold md:text-3xl">رزرو شما با موفقیت انجام شد</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            نوبت شما ثبت و تایید شد. منتظر دیدنتون هستیم.
          </p>
        </div>

        <div className="mt-8 space-y-3 rounded-xl border border-border bg-card p-5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">آرایشگر</span>
            <span className="font-medium">{confirmedBooking.barberName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">سرویس</span>
            <span className="font-medium">{confirmedBooking.serviceTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">تاریخ</span>
            <span className="font-medium">{confirmedBooking.dateLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ساعت</span>
            <span className="font-medium">{toPersianDigits(confirmedBooking.time)}</span>
          </div>
          {confirmedBooking.notes && (
            <div className="flex justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">توضیحات</span>
              <span className="font-medium">{confirmedBooking.notes}</span>
            </div>
          )}
          {confirmedBooking.price !== null && (
            <div className="flex justify-between border-t border-border pt-3">
              <span className="text-muted-foreground">هزینه‌ی سرویس</span>
              <span className="font-bold text-primary">{formatPrice(confirmedBooking.price)}</span>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/customer/bookings">مشاهده نوبت‌های من</Link>
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={resetFlow}>
            رزرو نوبت جدید
          </Button>
          <Button asChild variant="ghost" className="flex-1">
            <Link href="/">صفحه‌ی اصلی</Link>
          </Button>
        </div>
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

        {holdId && remainingSeconds !== null && step !== "entry" && step !== "pick" && step !== "date" && (
          <p className="mt-3 text-xs text-primary">
            این ساعت تا{" "}
            {toPersianDigits(
              `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`,
            )}{" "}
            دیگر برای شما نگه داشته شده
          </p>
        )}
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
                  onClick={() => {
                    // عوض‌کردن آرایشگر: سرویس قبلی ممکنه دیگه توسط این آرایشگر ارائه نشه
                    if (selectedBarberId !== b.id) setSelectedServiceId(null);
                    setSelectedBarberId(b.id);
                  }}
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
                    <span className="block text-xs text-muted-foreground">
                      {toPersianDigits(String(activeRows(b).length))} سرویس
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
                  const price = getPrice(selectedBarberId, s.id);
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
                      {price !== null && (
                        <span className="text-xs font-medium text-primary">{formatPrice(price)}</span>
                      )}
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
                  onClick={() => {
                    // عوض‌کردن سرویس: آرایشگر قبلی ممکنه این سرویس رو نداشته باشه
                    if (selectedServiceId !== s.id) setSelectedBarberId(null);
                    setSelectedServiceId(s.id);
                  }}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border p-4 text-right transition-colors",
                    isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  <span className="text-sm font-medium">{s.title}</span>
                  <span className="text-xs font-medium text-primary">{getServicePriceLabel(s.id)}</span>
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
                  const price = getPrice(b.id, selectedServiceId);
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
                        {price !== null && (
                          <span className="block text-xs font-medium text-primary">{formatPrice(price)}</span>
                        )}
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
              // تغییر تاریخ یعنی مشتری داره از اول انتخاب می‌کنه — اگه
              // هولدی از قبل داشت (بعید ولی برای اطمینان) آزادش کن
              if (holdId) {
                setHoldId(null);
                setHoldExpiresAt(null);
              }
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
                      onClick={() => available && handleSelectTime(slot)}
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
                ساعت‌های قرمز/خط‌خورده یعنی قبلاً رزرو شدن، بلاک‌شدن یا همین الان
                توسط یک مشتری دیگر در حال رزرو هستن.
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
            {selectedPrice !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">هزینه‌ی سرویس</span>
                <span className="font-bold text-primary">{formatPrice(selectedPrice)}</span>
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