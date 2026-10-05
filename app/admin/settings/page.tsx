"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn, toPersianDigits } from "@/lib/utils";

import { getAuthToken } from "@/lib/data/mock-session";
import { getCurrentAdmin } from "@/lib/data/admin-session";
import {
  getSettingsApi,
  updateSalonInfoApi,
  updateWorkingHoursApi,
  changePasswordApi,
  ApiError,
  type ApiSalonSettings,
  type ApiWorkingHours,
  type ApiWeekday,
} from "@/lib/api";

// ترتیب و برچسب فارسی روزهای هفته — همون ترتیبی که بک‌اند برمی‌گردونه (شنبه تا جمعه)
const WEEKDAY_LABELS: Record<ApiWeekday, string> = {
  SATURDAY: "شنبه",
  SUNDAY: "یکشنبه",
  MONDAY: "دوشنبه",
  TUESDAY: "سه‌شنبه",
  WEDNESDAY: "چهارشنبه",
  THURSDAY: "پنجشنبه",
  FRIDAY: "جمعه",
};

function SettingsSection({
  title,
  summary,
  initialOpen = false,
  hasChanges = false,
  children,
}: {
  title: string;
  summary: string;
  initialOpen?: boolean;
  hasChanges?: boolean;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isDesktop, setIsDesktop] = useState(false);
  const buttonId = useId();
  const contentId = useId();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateDesktopState = () => setIsDesktop(mediaQuery.matches);
    updateDesktopState();
    mediaQuery.addEventListener("change", updateDesktopState);
    return () => mediaQuery.removeEventListener("change", updateDesktopState);
  }, []);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        id={buttonId}
        type="button"
        aria-controls={contentId}
        aria-expanded={isOpen || isDesktop}
        tabIndex={isDesktop ? -1 : undefined}
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-right lg:pointer-events-none"
      >
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold">{title}</span>
          {hasChanges && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300 ring-1 ring-inset ring-amber-500/30">
              ذخیره‌نشده
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          {summary}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-4 w-4 transition-transform duration-200 lg:hidden",
              isOpen && "rotate-180",
            )}
          />
        </span>
      </button>
      <div
        id={contentId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(
          "grid transition-[grid-template-rows,visibility] duration-200 ease-out",
          isOpen
            ? "grid-rows-[1fr]"
            : "invisible grid-rows-[0fr] lg:visible lg:grid-rows-[1fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-border p-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function AdminSettingsPage() {
  // تنظیمات کلی سالن فقط در اختیار ادمین اصلیه؛ مدیر سالن حتی با زدن
  // مستقیم URL هم نباید ببینتش (تصمیم پروژه — لینکش هم از سایدبار/بات‌نو
  // برای مدیر سالن مخفیه، این یه لایه‌ی محافظتی دومه)
  const admin = getCurrentAdmin();
  const isAdmin = admin?.role === "admin";

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSalon, setIsSavingSalon] = useState(false);
  const [isSavingHours, setIsSavingHours] = useState(false);

  // --- اطلاعات سالن ---
  const [salon, setSalon] = useState<ApiSalonSettings>({
    name: "",
    address: "",
    phone: "",
    experienceYears: 12,
  });

  // --- ساعات کاری ---
  const [hours, setHours] = useState<ApiWorkingHours[]>([]);
  const [savedHours, setSavedHours] = useState<ApiWorkingHours[]>([]);
  const [expandedWorkingDay, setExpandedWorkingDay] = useState<ApiWeekday | null>(null);
  const hasUnsavedHours = hours.some((hour) => {
    const savedHour = savedHours.find((saved) => saved.day === hour.day);
    return (
      !savedHour ||
      hour.isOpen !== savedHour.isOpen ||
      hour.openTime !== savedHour.openTime ||
      hour.closeTime !== savedHour.closeTime
    );
  });

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }
    getSettingsApi()
      .then((data) => {
        setSalon(data.salon);
        setHours(data.workingHours);
        setSavedHours(data.workingHours);
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "خطا در دریافت تنظیمات");
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveSalon() {
    const token = getAuthToken();
    if (!token) return;
    setIsSavingSalon(true);
    try {
      const updated = await updateSalonInfoApi(salon, token);
      setSalon(updated);
      toast.success("اطلاعات سالن ذخیره شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ذخیره‌ی اطلاعات سالن");
    } finally {
      setIsSavingSalon(false);
    }
  }

  function handleHourChange(
    day: ApiWeekday,
    data: Partial<{ isOpen: boolean; openTime: string; closeTime: string }>,
  ) {
    setHours((prev) =>
      prev.map((hour) => (hour.day === day ? { ...hour, ...data } : hour)),
    );
  }

  async function handleSaveWorkingHours() {
    const token = getAuthToken();
    if (!token) {
      toast.error("ابتدا وارد حساب کاربری شوید");
      return;
    }

    const changedHours = hours.filter((hour) => {
      const savedHour = savedHours.find((saved) => saved.day === hour.day);
      return (
        !savedHour ||
        hour.isOpen !== savedHour.isOpen ||
        hour.openTime !== savedHour.openTime ||
        hour.closeTime !== savedHour.closeTime
      );
    });
    if (changedHours.length === 0) return;

    setIsSavingHours(true);
    try {
      for (const hour of changedHours) {
        const updated = await updateWorkingHoursApi(
          hour.day,
          {
            isOpen: hour.isOpen,
            openTime: hour.openTime,
            closeTime: hour.closeTime,
          },
          token,
        );
        setSavedHours((prev) =>
          prev.map((saved) => (saved.day === updated.day ? updated : saved)),
        );
      }
      toast.success("ساعات کاری با موفقیت ثبت شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ثبت ساعات کاری");
    } finally {
      setIsSavingHours(false);
    }
  }

  function handleCancelWorkingHours() {
    setHours(savedHours);
  }

  // --- تغییر رمز ادمین ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleChangePassword() {
    const token = getAuthToken();
    if (!token) {
      toast.error("ابتدا وارد حساب کاربری شوید");
      return;
    }
    if (newPassword.length < 4) {
      toast.error("رمز جدید باید حداقل ۴ کاراکتر باشد");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("رمز جدید و تکرار آن یکسان نیستند");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePasswordApi({ currentPassword, newPassword }, token);
      toast.success("رمز عبور با موفقیت تغییر کرد");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در تغییر رمز عبور");
    } finally {
      setIsChangingPassword(false);
    }
  }

  // مدیر سالن اصلاً اجازه‌ی دیدن این صفحه رو نداره — حتی اگه مستقیم URL بزنه
  if (admin && !isAdmin) {
    return (
      <div className="flex items-center justify-center p-10 text-center text-sm text-muted-foreground">
        شما اجازه‌ی دسترسی به این بخش را ندارید. تنظیمات کلی سالن فقط در
        اختیار ادمین اصلی است.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        در حال دریافت اطلاعات...
      </div>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">تنظیمات</h1>
        <p className="text-sm text-muted-foreground">
          اطلاعات سالن، ساعات کاری و امنیت حساب
        </p>
      </div>

      <SettingsSection
        title="اطلاعات سالن"
        summary={salon.name || "نام سالن ثبت نشده"}
        initialOpen
      >
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="salon-name">نام سالن</Label>
              <Input
                id="salon-name"
                value={salon.name}
                onChange={(e) => setSalon((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="salon-phone">شماره تماس</Label>
              <Input
                id="salon-phone"
                dir="ltr"
                value={salon.phone}
                onChange={(e) => setSalon((s) => ({ ...s, phone: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="salon-experience-years">سال سابقه</Label>
              <Input
                id="salon-experience-years"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={salon.experienceYears}
                onChange={(e) =>
                  setSalon((current) => ({
                    ...current,
                    experienceYears: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="salon-address">آدرس</Label>
              <Input
                id="salon-address"
                value={salon.address}
                onChange={(e) => setSalon((s) => ({ ...s, address: e.target.value }))}
              />
            </div>
          </div>

          <Button onClick={handleSaveSalon} disabled={isSavingSalon} className="w-full">
            {isSavingSalon ? "..." : "ذخیره اطلاعات سالن"}
          </Button>
        </div>
      </SettingsSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsSection
          title="ساعات کاری"
          summary={`${toPersianDigits(hours.filter((hour) => hour.isOpen).length)} روز فعال`}
          hasChanges={hasUnsavedHours}
        >
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">
              تغییرات تا زمان ثبت، ذخیره نمی‌شوند.
            </p>

            <div className="flex flex-col gap-2">
              {hours.map((h) => (
                <div key={h.day} className="rounded-lg border border-border px-3">
                  <div className="flex min-h-14 items-center justify-between gap-2">
                    <button
                      type="button"
                      className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 text-right"
                      aria-expanded={expandedWorkingDay === h.day}
                      aria-controls={`working-hours-${h.day}`}
                      onClick={() =>
                        setExpandedWorkingDay((current) =>
                          current === h.day ? null : h.day,
                        )
                      }
                    >
                      <span className="shrink-0 text-sm font-medium">
                        {WEEKDAY_LABELS[h.day]}
                      </span>
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="min-w-0 whitespace-nowrap text-xs text-muted-foreground"
                          dir="rtl"
                        >
                          {h.isOpen ? (
                            <>
                              <bdi dir="ltr">{toPersianDigits(h.openTime)}</bdi>
                              {" تا "}
                              <bdi dir="ltr">{toPersianDigits(h.closeTime)}</bdi>
                            </>
                          ) : (
                            "تعطیل"
                          )}
                        </span>
                        {expandedWorkingDay === h.day ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    </button>
                    <Switch
                      checked={h.isOpen}
                      disabled={isSavingHours}
                      onCheckedChange={(checked) => {
                        if (checked) setExpandedWorkingDay(h.day);
                        else if (expandedWorkingDay === h.day) setExpandedWorkingDay(null);
                        handleHourChange(h.day, { isOpen: checked });
                      }}
                      aria-label={`وضعیت ${WEEKDAY_LABELS[h.day]}`}
                    />
                  </div>

                  {expandedWorkingDay === h.day && (
                    <div id={`working-hours-${h.day}`} className="border-t border-border py-3">
                      {h.isOpen ? (
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`opening-${h.day}`} className="text-xs text-muted-foreground">
                              شروع
                            </Label>
                            <Input
                              id={`opening-${h.day}`}
                              type="time"
                              dir="ltr"
                              value={h.openTime}
                              disabled={isSavingHours}
                              onChange={(e) => handleHourChange(h.day, { openTime: e.target.value })}
                            />
                          </div>
                          <span className="pt-5 text-xs text-muted-foreground">تا</span>
                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`closing-${h.day}`} className="text-xs text-muted-foreground">
                              پایان
                            </Label>
                            <Input
                              id={`closing-${h.day}`}
                              type="time"
                              dir="ltr"
                              value={h.closeTime}
                              disabled={isSavingHours}
                              onChange={(e) => handleHourChange(h.day, { closeTime: e.target.value })}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          این روز تعطیل است؛ برای ثبت ساعت کاری، آن را با کلید وضعیت باز کنید.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancelWorkingHours}
                disabled={!hasUnsavedHours || isSavingHours}
              >
                انصراف
              </Button>
              <Button
                type="button"
                onClick={handleSaveWorkingHours}
                disabled={!hasUnsavedHours || isSavingHours}
              >
                {isSavingHours ? "در حال ثبت..." : "ثبت تغییرات"}
              </Button>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="تغییر رمز عبور"
          summary="امنیت حساب"
        >
          <div className="flex flex-col gap-4">
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="current-password">رمز عبور فعلی</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    dir="ltr"
                    className="h-11 pr-12"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    aria-label={
                      showCurrentPassword
                        ? "مخفی کردن رمز عبور فعلی"
                        : "نمایش رمز عبور فعلی"
                    }
                    className="absolute inset-y-0 right-1 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password">رمز عبور جدید</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    dir="ltr"
                    className="h-11 pr-12"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={
                      showNewPassword
                        ? "مخفی کردن رمز عبور جدید"
                        : "نمایش رمز عبور جدید"
                    }
                    className="absolute inset-y-0 right-1 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-password">تکرار رمز جدید</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    dir="ltr"
                    className="h-11 pr-12"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={
                      showConfirmPassword
                        ? "مخفی کردن تکرار رمز جدید"
                        : "نمایش تکرار رمز جدید"
                    }
                    className="absolute inset-y-0 right-1 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="self-start"
              >
                {isChangingPassword ? "..." : "تغییر رمز عبور"}
              </Button>
            </div>
          </div>
        </SettingsSection>
      </div>
    </main>
  );
}