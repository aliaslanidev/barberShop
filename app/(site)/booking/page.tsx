"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Banknote, BellRing, Check, CheckCircle2, CreditCard, Info, Star, User, Scissors, ChevronRight, ChevronLeft } from "lucide-react";
import type { DateObject } from "react-multi-date-picker";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { cn, toEnglishDigits } from "@/lib/utils";
import { BarberProfileModal, type BarberProfileModalState } from "@/components/barber-profile-modal";

import {
  listServices,
  listBarbers,
  getAvailability,
  getAvailabilityRange,
  createBookingApi,
  createWaitlistApi,
  cancelWaitlistApi,
  getMyWaitlistApi,
  createSlotHoldApi,
  extendSlotHoldApi,
  releaseSlotHoldApi,
  ApiError,
  type ApiService,
  type ApiBarber,
  type ApiSlotStatus,
  type ApiWaitlistRequest,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getAuthToken } from "@/lib/data/mock-session";

type EntryPath = "barber" | "service";
type Step = "entry" | "pick" | "date" | "time" | "notes" | "auth" | "confirm";

const ALL_STEPS: Step[] = ["entry", "pick", "date", "time", "notes", "auth", "confirm"];

const loginSchema = z.object({
  mobile: z.string().transform(toEnglishDigits).pipe(z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست")),
  password: z.string().min(4, "رمز عبور باید حداقل ۴ کاراکتر باشد"),
});
type LoginValues = z.infer<typeof loginSchema>;

const quickRegisterSchema = z.object({
  name: z.string().min(3, "نام باید حداقل ۳ حرف باشد"),
  mobile: z.string().transform(toEnglishDigits).pipe(z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست")),
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
  code: string;
  customerName: string;
  barberName: string;
  serviceTitle: string;
  dateKey: string; // میلادی YYYY-MM-DD
  time: string;
  price: number | null;
  notes: string;
};

// چند دقیقه زودتر باید حاضر بشه (تو اطلاعیه‌ی بعد از رزرو نمایش داده می‌شه)
const ARRIVAL_EARLY_MINUTES = 10;

function toPersianDigits(input: string) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return input.replace(/[0-9]/g, (d) => persianDigits[Number(d)]);
}

// آرایشگری که حسابش غیرفعال شده (مثلاً قطع همکاری) یا پذیرش نوبت جدیدش
// بسته‌ست، هیچ‌جای فرایند رزرو نباید دیده بشه (نه تو انتخاب آرایشگر، نه تو
// لیست آرایشگرهای یک سرویس، نه تو بازه‌ی قیمت).
function isBarberBookable(barber: ApiBarber) {
  return barber.isActive !== false && barber.user.isActive !== false;
}

// معدل امتیاز و تعداد نظرات آرایشگر (عمومی) — ستاره‌ها + عدد + «(۱۲ نظر)»
function RatingBadge({ rating }: { rating: ApiBarber["rating"] | undefined }) {
  if (!rating || rating.count === 0 || rating.average === null) {
    return <span className="text-xs text-muted-foreground">هنوز نظری ثبت نشده</span>;
  }

  const filled = Math.round(rating.average);

  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3 w-3",
              i < filled ? "fill-primary text-primary" : "fill-none text-border",
            )}
          />
        ))}
      </span>
      <span className="font-semibold text-foreground">
        {toPersianDigits(rating.average.toFixed(1)).replace(".", "٫")}
      </span>
      <span>({toPersianDigits(String(rating.count))} نظر)</span>
    </span>
  );
}

// کارت آرایشگر (هر دو مسیر رزرو): آواتار گرادیانی، نام، امتیاز، توضیح کوتاه،
// و پایین کارت قیمت/تعداد سرویس + دکمه‌ی انتخاب
function BarberCard({
  barber,
  selected,
  footerLabel,
  onSelect,
  onOpenProfile,
}: {
  barber: ApiBarber;
  selected: boolean;
  footerLabel: string;
  onSelect: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex cursor-pointer flex-col rounded-2xl border p-4 text-right transition-colors",
        selected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40",
      )}
    >
      <div className="flex items-center gap-3">
<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rust text-sm font-bold text-white">
          {barber.initials}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <span className="block truncate text-sm font-bold">{barber.user.name}</span>
          <RatingBadge rating={barber.rating} />
        </div>
      </div>

      {/* {barber.bio && (
        <p className="mt-3 line-clamp-2 text-xs leading-6 text-muted-foreground">{barber.bio}</p>
      )} */}

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-dashed border-border pt-3">
        <div className="min-w-0">
          <span className="block truncate text-sm font-bold">{footerLabel}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile();
            }}
            className="mt-0.5 text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            مشاهده بیشتر
          </button>
        </div>

        <span
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors",
            selected ? "bg-primary/20 text-primary" : "bg-primary text-primary-foreground",
          )}
        >
          {selected ? (
            <>
              <Check className="h-3.5 w-3.5" />
              انتخاب شد
            </>
          ) : (
            "انتخاب"
          )}
        </span>
      </div>
    </div>
  );
}

// نمایش تاریخ شمسی با نام روز هفته از روی تاریخ میلادی ISO
function formatDateFa(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fa-IR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

function getTehranDateTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return {
    dateKey: `${part("year")}-${part("month")}-${part("day")}`,
    minuteOfDay: Number(part("hour")) * 60 + Number(part("minute")),
  };
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
        // آرایشگر غیرفعال/قطع‌همکاری‌شده از همین‌جا حذف می‌شه تا هیچ‌جای
        // رزرو (انتخاب آرایشگر، لیست آرایشگرهای سرویس، قیمت) دیده نشه
        setBarbers(b.filter(isBarberBookable));
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
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [date, setDate] = useState<DateObject | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [notes, setNotes] = useState("");
  const [pendingWaitlistTime, setPendingWaitlistTime] = useState<string | null>(null);
  const [waitlistRequests, setWaitlistRequests] = useState<ApiWaitlistRequest[]>([]);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isFinalSubmitting, setIsFinalSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBooking | null>(null);

  // مودال «مشاهده بیشتر» پروفایل عمومی آرایشگر (امتیاز + نظرهای تاییدشده)
  const [profileModal, setProfileModal] = useState<BarberProfileModalState | null>(null);

  const [availableSlots, setAvailableSlots] = useState<ApiSlotStatus[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // ---------- Slot Hold: نگه‌داری موقت اسلات از لحظه‌ی انتخاب تا تایید نهایی ----------
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null); // timestamp (ms)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (step !== "time" || user?.role !== "customer") {
      setWaitlistRequests([]);
      return;
    }

    const token = getAuthToken();
    if (!token) return;
    let active = true;
    let hasReportedError = false;
    const load = async () => {
      try {
        const result = await getMyWaitlistApi(token);
        if (active) {
          setWaitlistRequests(result.requests);
          hasReportedError = false;
        }
      } catch (error) {
        if (active && !hasReportedError) {
          hasReportedError = true;
          console.error("خطا در دریافت درخواست‌های صف انتظار", error);
          toast.error(error instanceof ApiError ? error.message : "دریافت وضعیت صف انتظار ناموفق بود");
        }
      }
    };

    void load();
    const interval = window.setInterval(() => void load(), 15_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [step, user?.id, user?.role]);

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
  const tehranNow = getTehranDateTime(now);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(interval);
  }, []);

  function isSlotInPast(slot: string, selectedDateKey = dateKey) {
    if (!selectedDateKey) return false;
    if (selectedDateKey < tehranNow.dateKey) return true;
    if (selectedDateKey > tehranNow.dateKey) return false;
    const [hours, minutes] = slot.split(":").map(Number);
    return hours * 60 + minutes <= tehranNow.minuteOfDay;
  }

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
    return min === max
      ? formatPrice(min)
      : `${min.toLocaleString("fa-IR")} تا ${max.toLocaleString("fa-IR")} تومان`;
  }

  const servicesToShow = useMemo(() => {
    if (entryPath === "barber" && selectedBarberId) {
      const barber = barbers.find((b) => b.id === selectedBarberId);
      const ids = new Set(barber ? activeRows(barber).map((r) => r.serviceId) : []);
      return services.filter((s) => ids.has(s.id));
    }
    if (entryPath === "service") {
      // سرویسی که هیچ آرایشگر فعالی برایش نمونده هم نباید نشان داده بشه
      const offeredIds = new Set(barbers.flatMap((b) => activeRows(b).map((r) => r.serviceId)));
      return services.filter((s) => offeredIds.has(s.id));
    }
    return services;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryPath, selectedBarberId, barbers, services]);

  const barbersToShow = useMemo(() => {
    if (entryPath === "service" && selectedServiceIds.length > 0) {
      return barbers.filter((barber) => {
        const availableServiceIds = new Set(activeRows(barber).map((row) => row.serviceId));
        return selectedServiceIds.every((serviceId) => availableServiceIds.has(serviceId));
      });
    }
    return barbers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryPath, selectedServiceIds, barbers]);

  const selectedServices = selectedServiceIds
    .map((serviceId) => services.find((service) => service.id === serviceId))
    .filter((service): service is ApiService => Boolean(service));
  const selectedBarber = selectedBarberId ? barbers.find((b) => b.id === selectedBarberId) ?? null : null;
  const selectedPrice =
    selectedBarberId && selectedServiceIds.length > 0
      ? selectedServiceIds.reduce((total, serviceId) => total + (getPrice(selectedBarberId, serviceId) ?? 0), 0)
      : null;

  const stepIndex = stepOrder.indexOf(step);

  function refreshSlots() {
    if (selectedBarberId && dateKey) {
      getAvailability(selectedBarberId, dateKey).then(setAvailableSlots).catch(() => {});
    }
  }

  // انتخاب آرایشگر تو مسیر «اول آرایشگر»: سرویس قبلی ممکنه دیگه توسط
  // این آرایشگر ارائه نشه، پس پاک می‌شه
  function pickBarberFirst(barberId: string) {
    if (selectedBarberId !== barberId) setSelectedServiceIds([]);
    setSelectedBarberId(barberId);
  }

  function toggleServiceSelection(serviceId: string) {
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds((current) => current.filter((id) => id !== serviceId));
      if (entryPath === "service") setSelectedBarberId(null);
      return;
    }
    if (selectedServiceIds.length >= 2) {
      toast.info("حداکثر دو سرویس می‌توانید انتخاب کنید");
      return;
    }
    setSelectedServiceIds((current) => [...current, serviceId]);
    if (entryPath === "service") setSelectedBarberId(null);
  }

  // انتخاب ساعت: به‌جای فقط setTime، یه هولد ۵ دقیقه‌ای روی سرور می‌سازه
  async function handleSelectTime(slot: string) {
    if (!selectedBarberId || !dateKey || time === slot) return;
    if (isSlotInPast(slot, dateKey)) {
      toast.error("این ساعت گذشته است؛ لطفاً یک ساعت آینده را انتخاب کنید");
      return;
    }

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
        ? selectedBarberId !== null && selectedServiceIds.length > 0
        : selectedServiceIds.length > 0 && selectedBarberId !== null;
    if (step === "date") return date !== null;
    if (step === "time") return time !== null && !isSlotInPast(time);
    return true;
  }

  // شروع یک رزرو جدید از اول (بعد از صفحه‌ی تاییدیه)
  function resetFlow() {
    setConfirmedBooking(null);
    setStep("entry");
    setEntryPath(null);
    setSelectedServiceIds([]);
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

  async function resumeAfterAuth() {
    if (!pendingWaitlistTime) {
      setStep("confirm");
      return;
    }
    setStep("time");
    const token = getAuthToken();
    if (!token || !selectedBarberId || selectedServiceIds.length === 0 || !dateKey) {
      toast.error("اطلاعات درخواست کامل نیست؛ لطفاً دوباره ساعت را انتخاب کنید");
      setPendingWaitlistTime(null);
      return;
    }
    try {
      await createWaitlistApi(
        {
          barberId: selectedBarberId,
          serviceIds: selectedServiceIds,
          date: dateKey,
          time: pendingWaitlistTime,
        },
        token,
      );
      toast.success("درخواست شما با موفقیت در صف انتظار ثبت شد");
      setPendingWaitlistTime(null);
      const result = await getMyWaitlistApi(token);
      setWaitlistRequests(result.requests);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "ثبت درخواست صف انتظار ناموفق بود");
      setPendingWaitlistTime(null);
    }
  }

  async function handleWaitlistClick(slot: string) {
    if (!selectedBarberId || selectedServiceIds.length === 0 || !dateKey) return;
    if (user && user.role !== "customer") {
      toast.error("ثبت درخواست صف انتظار فقط با حساب مشتری امکان‌پذیر است");
      return;
    }
    if (!user) {
      setPendingWaitlistTime(slot);
      setAuthMode("login");
      setStep("auth");
      toast.info("برای ثبت درخواست صف انتظار ابتدا وارد حساب مشتری شوید");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("نشست شما معتبر نیست؛ لطفاً دوباره وارد شوید");
      return;
    }
    try {
      await createWaitlistApi(
        { barberId: selectedBarberId, serviceIds: selectedServiceIds, date: dateKey, time: slot },
        token,
      );
      toast.success("درخواست شما در صف انتظار ثبت شد");
      const result = await getMyWaitlistApi(token);
      setWaitlistRequests(result.requests);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "ثبت درخواست صف انتظار ناموفق بود");
    }
  }

  async function handleCancelWaitlist(requestId: string) {
    const token = getAuthToken();
    if (!token) return;
    try {
      await cancelWaitlistApi(requestId, token);
      setWaitlistRequests((current) => current.filter((request) => request.id !== requestId));
      toast.info("درخواست صف انتظار لغو شد");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "لغو درخواست ناموفق بود");
    }
  }

  async function onLoginSubmit(values: LoginValues) {
    try {
      await login(values.mobile, values.password);
      await resumeAfterAuth();
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
      await resumeAfterAuth();
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
    if (!token || !selectedBarberId || selectedServiceIds.length === 0 || !dateKey || !time) return;
    if (isSlotInPast(time, dateKey)) {
      toast.error("زمان انتخاب‌شده گذشته است؛ لطفاً ساعت دیگری انتخاب کنید");
      setTime(null);
      setStep("time");
      refreshSlots();
      return;
    }
    setIsFinalSubmitting(true);
    try {
      const booking = await createBookingApi(
        {
          barberId: selectedBarberId,
          serviceIds: selectedServiceIds,
          date: dateKey,
          time,
          notes: notes || undefined,
          holdId: holdId ?? undefined,
        },
        token
      );

      // خلاصه‌ی نوبت رو قبل از پاک‌شدن stateها نگه می‌داریم تا صفحه‌ی پیش‌فاکتور نشونش بده
      toast.success("نوبت شما ثبت شد");
      setConfirmedBooking({
        code: booking.id.slice(-8).toUpperCase(),
        customerName: user?.name ?? "",
        barberName: selectedBarber?.user.name ?? "",
        serviceTitle: selectedServices.map((service) => service.title).join(" + "),
        dateKey,
        time,
        // قیمتی که سرور تو نوبت ذخیره کرده، مرجع اصلیه؛ محاسبه‌ی فرانت فقط جایگزینه
        price: booking.price ?? selectedPrice,
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

  // ---------- صفحه‌ی پیش‌فاکتور و اطلاعیه بعد از ثبت موفق ----------
  if (confirmedBooking) {
    const c = confirmedBooking;
    const notices = [
      `لطفاً ${toPersianDigits(String(ARRIVAL_EARLY_MINUTES))} دقیقه قبل از ساعت ${toPersianDigits(c.time)} در سالن حضور داشته باشید.`,
      "مبلغ سرویس به‌صورت حضوری و پس از انجام کار دریافت می‌شود.",
      "اگر نمی‌توانید در زمان مقرر حاضر شوید، از بخش «نوبت‌های من» نوبت را لغو کنید تا ساعت برای دیگران آزاد شود.",
      "لطفاً کد پیگیری را تا زمان مراجعه نزد خود نگه دارید.",
    ];

    return (
      <main className="container max-w-xl py-14 md:py-20">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-9 w-9 text-primary" />
          </span>
          <h1 className="mt-5 text-2xl font-bold md:text-3xl">رزرو شما با موفقیت انجام شد</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            پیش‌فاکتور و اطلاعیه‌ی نوبت شما در ادامه آمده است.
          </p>
        </div>

        {/* پیش‌فاکتور */}
        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card text-sm">
          <div className="flex items-center justify-between border-b border-border bg-primary/5 px-5 py-3">
            <span className="font-medium">پیش‌فاکتور نوبت</span>
            <span className="text-xs text-muted-foreground">
              کد پیگیری:{" "}
              <span dir="ltr" className="inline-block font-mono font-medium text-foreground">
                {c.code}
              </span>
            </span>
          </div>

          <div className="space-y-3 p-5">
            {c.customerName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">مشتری</span>
                <span className="font-medium">{c.customerName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">آرایشگر</span>
              <span className="font-medium">{c.barberName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">سرویس</span>
              <span className="font-medium">{c.serviceTitle}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">تاریخ</span>
              <span className="font-medium">{formatDateFa(c.dateKey)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ساعت</span>
              <span className="font-medium">{toPersianDigits(c.time)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">روش پرداخت</span>
              <span className="font-medium">نقدی در سالن</span>
            </div>
            {c.notes && (
              <div className="flex justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">توضیحات</span>
                <span className="font-medium">{c.notes}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border bg-primary/5 px-5 py-4">
            <span className="font-medium">مبلغ قابل پرداخت</span>
            <span className="text-base font-bold text-primary">
              {c.price !== null ? formatPrice(c.price) : "—"}
            </span>
          </div>
        </div>

        {/* اطلاعیه */}
        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Info className="h-4 w-4 text-primary" />
            اطلاعیه و نکات مهم
          </p>
          <ul className="list-disc space-y-2 pr-5 text-xs leading-6 text-muted-foreground">
            {notices.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
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
          {barbersToShow.length === 0 && (
            <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              در حال حاضر آرایشگری برای رزرو در دسترس نیست.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {barbersToShow.map((b) => (
              <BarberCard
                key={b.id}
                barber={b}
                selected={selectedBarberId === b.id}
                footerLabel={`${toPersianDigits(String(activeRows(b).length))} سرویس`}
                onSelect={() => pickBarberFirst(b.id)}
                onOpenProfile={() =>
                  setProfileModal({
                    barber: b,
                    onSelect: () => pickBarberFirst(b.id),
                  })
                }
              />
            ))}
          </div>

          {selectedBarberId && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label>انتخاب سرویس (حداکثر دو مورد)</Label>
                <span className="text-xs text-muted-foreground">
                  {toPersianDigits(String(selectedServiceIds.length))} از ۲
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {servicesToShow.map((s) => {
                  const isSelected = selectedServiceIds.includes(s.id);
                  const price = getPrice(selectedBarberId, s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleServiceSelection(s.id)}
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
          <div className="flex items-center justify-between gap-3">
            <Label>انتخاب سرویس (حداکثر دو مورد)</Label>
            <span className="text-xs text-muted-foreground">
              {toPersianDigits(String(selectedServiceIds.length))} از ۲
            </span>
          </div>
          {servicesToShow.length === 0 && (
            <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              در حال حاضر سرویسی برای رزرو در دسترس نیست.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            {servicesToShow.map((s) => {
              const isSelected = selectedServiceIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleServiceSelection(s.id)}
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

          {selectedServiceIds.length > 0 && (
            <div className="mt-6 space-y-3">
              <Label>انتخاب آرایشگر</Label>
              <p className="text-xs text-muted-foreground">
                هر دو سرویس باید نزد آرایشگر انتخابی ارائه شوند؛ مجموع قیمت کنار کارت او نمایش داده می‌شود.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {barbersToShow.map((b) => {
                  const price = selectedServiceIds.reduce(
                    (total, serviceId) => total + (getPrice(b.id, serviceId) ?? 0),
                    0,
                  );
                  return (
                    <BarberCard
                      key={b.id}
                      barber={b}
                      selected={selectedBarberId === b.id}
                      footerLabel={price !== null ? formatPrice(price) : ""}
                      onSelect={() => setSelectedBarberId(b.id)}
                      onOpenProfile={() =>
                        setProfileModal({
                          barber: b,
                          onSelect: () => setSelectedBarberId(b.id),
                        })
                      }
                    />
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
                {availableSlots.map(({ time: slot, available, waitlistable }) => {
                  const isSelected = time === slot;
                  const isPast = isSlotInPast(slot);
                  const isUnavailable = !available || isPast;
                  const waitlistRequest = waitlistRequests.find(
                    (request) =>
                      request.barberId === selectedBarberId &&
                      request.date === dateKey &&
                      request.time === slot,
                  );
                  const hasWaitlistRequest = waitlistRequest?.status === "WAITING";
                  const isWaitlistOfferPending = waitlistRequest?.status === "OFFERED";
                  const canRequestWaitlist = waitlistable && !isPast && !isWaitlistOfferPending;
                  const canManageWaitlist = Boolean(hasWaitlistRequest || canRequestWaitlist);
                  return (
                    <div key={slot} className="min-w-0">
                      <button
                        type="button"
                        disabled={
                          (isUnavailable && !canManageWaitlist) ||
                          Boolean(user && user.role !== "customer" && canManageWaitlist)
                        }
                        onClick={() => {
                          if (!isUnavailable) {
                            void handleSelectTime(slot);
                          } else if (waitlistRequest?.status === "WAITING") {
                            void handleCancelWaitlist(waitlistRequest.id);
                          } else if (canRequestWaitlist) {
                            void handleWaitlistClick(slot);
                          }
                        }}
                        aria-label={
                          hasWaitlistRequest
                            ? `لغو درخواست ساعت ${toPersianDigits(slot)}`
                            : isWaitlistOfferPending
                              ? `پیشنهاد صف انتظار برای ساعت ${toPersianDigits(slot)} ارسال شد`
                              : canRequestWaitlist
                                ? `ثبت درخواست خبرم کن برای ساعت ${toPersianDigits(slot)}`
                                : `ساعت ${toPersianDigits(slot)} در دسترس نیست`
                        }
                        title={
                          hasWaitlistRequest
                            ? "برای لغو درخواست صف انتظار کلیک کنید"
                            : isWaitlistOfferPending
                              ? "پیشنهاد صف انتظار برای شما ارسال شده"
                              : canRequestWaitlist
                                ? "برای ثبت درخواست خبرم کن کلیک کنید"
                                : undefined
                        }
                        className={cn(
                          "flex h-12 w-full items-center justify-center gap-1.5 rounded-lg border px-1.5 text-xs font-medium transition-colors",
                          isUnavailable
                            ? canManageWaitlist
                              ? "border-red-500/40 bg-red-500/10 text-red-400 hover:border-primary/50"
                              : "cursor-not-allowed border-red-500/40 bg-red-500/10 text-red-400"
                            : isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        {toPersianDigits(slot)}
                        {canRequestWaitlist && <BellRing className="h-3 w-3 shrink-0 text-primary" />}
                        {hasWaitlistRequest && <Check className="h-3 w-3 shrink-0 text-primary" />}
                        {isWaitlistOfferPending && <BellRing className="h-3 w-3 shrink-0 text-primary" />}
                      </button>
                      </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                ساعت‌های قرمز یعنی رزرو یا مسدود شده‌اند. آیکون زنگ کنار ساعت
                یعنی می‌توانید برای آزادشدنش درخواست ثبت کنید.
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
          {pendingWaitlistTime && (
            <p className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm leading-6">
              برای ثبت درخواست اطلاع‌رسانی ساعت {toPersianDigits(pendingWaitlistTime)}، وارد حساب مشتری شوید یا ثبت‌نام کنید.
            </p>
          )}
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
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
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
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
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
              <span className="font-medium">{selectedServices.map((service) => service.title).join(" + ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">تاریخ</span>
              <span className="font-medium">{date?.format("YYYY/MM/DD")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ساعت</span>
              <span className="font-medium">{time ? toPersianDigits(time) : ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">روش پرداخت</span>
              <span className="font-medium">نقدی در سالن</span>
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
            <div className="space-y-2 border-t border-border pt-3">
              <p className="font-medium">روش پرداخت</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border border-primary bg-primary/10 p-3">
                  <Banknote className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">پرداخت نقدی</p>
                    <p className="text-xs text-muted-foreground">پرداخت در سالن پس از دریافت خدمات</p>
                  </div>
                  <CheckCircle2 className="mr-auto h-4 w-4 shrink-0 text-primary" />
                </div>
                <div
                  aria-disabled="true"
                  className="flex cursor-not-allowed items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3 opacity-55"
                >
                  <CreditCard className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">پرداخت آنلاین با کارت بانکی</p>
                    <p className="text-xs text-muted-foreground">فعلاً غیرفعال است؛ به‌زودی فعال می‌شود</p>
                  </div>
                </div>
              </div>
            </div>
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

      <BarberProfileModal state={profileModal} onClose={() => setProfileModal(null)} />
    </main>
  );
}