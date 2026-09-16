"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import {
  getSalonInfo,
  updateSalonInfo,
  getWorkingHours,
  updateWorkingHours,
  type WeekDay,
} from "@/lib/data/salon-settings";
import { getCurrentAdmin } from "@/lib/data/admin-session";
import { updateAccountPassword } from "@/lib/data/mock-accounts";

export default function AdminSettingsPage() {
  const admin = getCurrentAdmin();

  // --- اطلاعات سالن ---
  const [salon, setSalon] = useState(getSalonInfo());

  function handleSaveSalon() {
    updateSalonInfo(salon);
    toast.success("اطلاعات سالن ذخیره شد");
  }

  // --- ساعات کاری ---
  const [hours, setHours] = useState(getWorkingHours());

  function handleHourChange(
    day: WeekDay,
    data: Partial<{ isOpen: boolean; openTime: string; closeTime: string }>,
  ) {
    const updated = updateWorkingHours(day, data);
    setHours(updated);
  }

  function handleSaveHours() {
    toast.success("ساعات کاری ذخیره شد");
  }

  // --- تغییر رمز ادمین ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChangePassword() {
    if (!admin) {
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

    const result = updateAccountPassword(
      admin.id,
      currentPassword,
      newPassword,
    );

    if (!result.success) {
      toast.error(result.error ?? "خطا در تغییر رمز عبور");
      return;
    }

    toast.success("رمز عبور با موفقیت تغییر کرد");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
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
                onChange={(e) =>
                  setSalon((s) => ({ ...s, name: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="salon-phone">شماره تماس</Label>
              <Input
                id="salon-phone"
                dir="ltr"
                value={salon.phone}
                onChange={(e) =>
                  setSalon((s) => ({ ...s, phone: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="salon-address">آدرس</Label>
              <Input
                id="salon-address"
                value={salon.address}
                onChange={(e) =>
                  setSalon((s) => ({ ...s, address: e.target.value }))
                }
              />
            </div>
          </div>

          <Button onClick={handleSaveSalon} className="self-start">
            ذخیره اطلاعات سالن
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-4 p-4">
            <h2 className="font-semibold">ساعات کاری</h2>

            <div className="flex flex-col gap-3">
              {hours.map((h) => (
                <div
                  key={h.day}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <span className="w-16 shrink-0 text-sm font-medium">
                    {h.day}
                  </span>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={h.isOpen}
                      onCheckedChange={(checked) =>
                        handleHourChange(h.day, { isOpen: checked })
                      }
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
                        onChange={(e) =>
                          handleHourChange(h.day, { openTime: e.target.value })
                        }
                      />
                      <span className="text-sm text-muted-foreground">تا</span>
                      <Input
                        type="time"
                        dir="ltr"
                        className="w-28"
                        value={h.closeTime}
                        onChange={(e) =>
                          handleHourChange(h.day, { closeTime: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button onClick={handleSaveHours} className="self-start">
              ذخیره ساعات کاری
            </Button>
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

              <Button onClick={handleChangePassword} className="self-start">
                تغییر رمز عبور
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}