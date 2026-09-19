"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

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

export default function AdminSettingsPage() {
  // تنظیمات کلی سالن فقط در اختیار ادمین اصلیه؛ مدیر سالن حتی با زدن
  // مستقیم URL هم نباید ببینتش (تصمیم پروژه — لینکش هم از سایدبار/بات‌نو
  // برای مدیر سالن مخفیه، این یه لایه‌ی محافظتی دومه)
  const admin = getCurrentAdmin();
  const isAdmin = admin?.role === "admin";

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSalon, setIsSavingSalon] = useState(false);
  const [savingDay, setSavingDay] = useState<ApiWeekday | null>(null);

  // --- اطلاعات سالن ---
  const [salon, setSalon] = useState<ApiSalonSettings>({ name: "", address: "", phone: "" });

  // --- ساعات کاری ---
  const [hours, setHours] = useState<ApiWorkingHours[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }
    getSettingsApi()
      .then((data) => {
        setSalon(data.salon);
        setHours(data.workingHours);
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

  // هر تغییر (روشن/خاموش یا ساعت) بلافاصله ذخیره می‌شه — نیازی به دکمه‌ی
  // «ذخیره» جدا نیست، چون endpoint به‌ازای هر روز جداگانه‌ست
  async function handleHourChange(
    day: ApiWeekday,
    data: Partial<{ isOpen: boolean; openTime: string; closeTime: string }>,
  ) {
    const token = getAuthToken();
    if (!token) return;
    setSavingDay(day);
    try {
      const updated = await updateWorkingHoursApi(day, data, token);
      setHours((prev) => prev.map((h) => (h.day === day ? updated : h)));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ذخیره‌ی ساعت کاری");
    } finally {
      setSavingDay(null);
    }
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

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <h2 className="font-semibold">اطلاعات سالن</h2>

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
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="salon-address">آدرس</Label>
              <Input
                id="salon-address"
                value={salon.address}
                onChange={(e) => setSalon((s) => ({ ...s, address: e.target.value }))}
              />
            </div>
          </div>

          <Button onClick={handleSaveSalon} disabled={isSavingSalon} className="self-start">
            {isSavingSalon ? "..." : "ذخیره اطلاعات سالن"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-4 p-4">
            <h2 className="font-semibold">ساعات کاری</h2>
            <p className="text-xs text-muted-foreground">هر تغییر بلافاصله ذخیره می‌شود.</p>

            <div className="flex flex-col gap-3">
              {hours.map((h) => (
                <div
                  key={h.day}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <span className="w-16 shrink-0 text-sm font-medium">
                    {WEEKDAY_LABELS[h.day]}
                  </span>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={h.isOpen}
                      disabled={savingDay === h.day}
                      onCheckedChange={(checked) => handleHourChange(h.day, { isOpen: checked })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {h.isOpen ? "باز" : "تعطیل"}
                    </span>
                  </div>

                  {h.isOpen && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        dir="ltr"
                        className="w-28"
                        value={h.openTime}
                        disabled={savingDay === h.day}
                        onChange={(e) => handleHourChange(h.day, { openTime: e.target.value })}
                      />
                      <span className="text-sm text-muted-foreground">تا</span>
                      <Input
                        type="time"
                        dir="ltr"
                        className="w-28"
                        value={h.closeTime}
                        disabled={savingDay === h.day}
                        onChange={(e) => handleHourChange(h.day, { closeTime: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 p-4">
            <h2 className="font-semibold">تغییر رمز عبور</h2>

            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="current-password">رمز عبور فعلی</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    dir="ltr"
                    className="pr-10"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
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
                    className="pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
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
                    className="pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
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
          </CardContent>
        </Card>
      </div>
    </main>
  );
}