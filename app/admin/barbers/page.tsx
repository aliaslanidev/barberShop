"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, Search, ShieldAlert, Trash2, Users, X } from "lucide-react";

import {
  listBarbers,
  createBarberApi,
  updateBarberApi,
  updateBarberPermissionsApi,
  deleteBarberApi,
  listServices,
  getBarberFutureBookingsApi,
  updateBarberAccountStatusApi,
  ApiError,
  type ApiBarber,
  type ApiBarberPermissions,
  type ApiService,
  type ApiFutureBooking,
} from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";
import { getCurrentAdmin } from "@/lib/data/admin-session";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverPortal,
} from "@radix-ui/react-popover";

const OPTIONAL_PERMISSIONS: { key: keyof ApiBarberPermissions; label: string }[] = [
  { key: "manageServices", label: "فعال/غیرفعال‌کردن سرویس‌های خودش" },
  { key: "managePricing", label: "مدیریت قیمت" },
  { key: "manageSchedule", label: "مدیریت زمان‌بندی" },
  { key: "manageTimeOff", label: "مدیریت مرخصی" },
  { key: "blockSlots", label: "بلاک کردن اسلات" },
  { key: "cancelOwnBookings", label: "کنسل کردن نوبت تاییدشده" },
  { key: "viewCustomers", label: "دیدن لیست مشتری‌ها" },
];

const createBarberSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ حرف باشد"),
  mobile: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست (مثال: 09123456789)"),
  password: z.string().min(4, "رمز عبور باید حداقل ۴ کاراکتر باشد"),
  bio: z.string().optional(),
});
type CreateBarberValues = z.infer<typeof createBarberSchema>;

const editBarberSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ حرف باشد"),
  mobile: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست (مثال: 09123456789)"),
  bio: z.string().optional(),
  newPassword: z
    .string()
    .min(4, "رمز جدید باید حداقل ۴ کاراکتر باشد")
    .optional()
    .or(z.literal("")),
});
type EditBarberValues = z.infer<typeof editBarberSchema>;

const PERMISSIONS_BOX_MIN_HEIGHT = "min-h-[350px]";

function sameIdSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((id) => setB.has(id));
}

function formatDateFa(iso: string) {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AdminBarbersPage() {
  // مدیر سالن (manager) فقط اجازه‌ی مشاهده داره؛ ساخت/ویرایش/حذف/تغییر
  // پرمیشن/فعال‌سازی فقط برای ادمین اصلی (تصمیم پروژه — بخش ۶ فایل کانتکست)
  const admin = getCurrentAdmin();
  const isAdmin = admin?.role === "admin";

  const [barbers, setBarbers] = useState<ApiBarber[]>([]);
  const [services, setServices] = useState<ApiService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [draftPermissions, setDraftPermissions] = useState<ApiBarberPermissions | null>(null);
  const [draftServiceIds, setDraftServiceIds] = useState<string[] | null>(null);
  const [isSavingServices, setIsSavingServices] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ==================== غیرفعال‌سازی کامل حساب (فاز تکمیلی ۱.۲) ====================
  const [isCheckingFutureBookings, setIsCheckingFutureBookings] = useState(false);
  const [isSubmittingAccountStatus, setIsSubmittingAccountStatus] = useState(false);
  const [futureBookingsModalOpen, setFutureBookingsModalOpen] = useState(false);
  const [futureBookings, setFutureBookings] = useState<ApiFutureBooking[]>([]);
  const [futureBookingsBarber, setFutureBookingsBarber] = useState<ApiBarber | null>(null);

  // مودال دلیل غیرفعال‌سازی (جایگزین window.prompt)
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [reasonBarber, setReasonBarber] = useState<ApiBarber | null>(null);
  const [reasonValue, setReasonValue] = useState("");

  const selectedBarber = barbers.find((b) => b.id === selectedBarberId) ?? null;

  async function refresh() {
    try {
      const [barbersData, servicesData] = await Promise.all([listBarbers(), listServices()]);
      setBarbers(barbersData);
      setServices(servicesData);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در دریافت اطلاعات");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const found = barbers.find((b) => b.id === selectedBarberId) ?? null;
    if (found) {
      setDraftPermissions({
        manageServices: found.manageServices,
        managePricing: found.managePricing,
        manageSchedule: found.manageSchedule,
        manageTimeOff: found.manageTimeOff,
        blockSlots: found.blockSlots,
        cancelOwnBookings: found.cancelOwnBookings,
        viewCustomers: found.viewCustomers,
      });
      setDraftServiceIds(found.services.map((s) => s.serviceId));
    } else {
      setDraftPermissions(null);
      setDraftServiceIds(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBarberId, barbers]);

  const isPermissionsDirty =
    isAdmin &&
    !!selectedBarber &&
    !!draftPermissions &&
    OPTIONAL_PERMISSIONS.some((perm) => draftPermissions[perm.key] !== selectedBarber[perm.key]);

  const isServicesDirty =
    isAdmin &&
    !!selectedBarber &&
    !!draftServiceIds &&
    !sameIdSet(draftServiceIds, selectedBarber.services.map((s) => s.serviceId));

  const visibleBarbers = isTyping
    ? barbers.filter((b) => b.user.name.includes(searchQuery.trim()))
    : barbers;

  useEffect(() => {
    if (!comboOpen) {
      setSearchQuery(selectedBarber?.user.name ?? "");
      setIsTyping(false);
    }
  }, [comboOpen, selectedBarber]);

  function handleClearSearch() {
    setSelectedBarberId(null);
    setSearchQuery("");
    setIsTyping(false);
    setComboOpen(true);
    searchInputRef.current?.focus();
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBarberValues>({
    resolver: zodResolver(createBarberSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: isEditSubmitting },
  } = useForm<EditBarberValues>({
    resolver: zodResolver(editBarberSchema),
  });

  useEffect(() => {
    if (editDialogOpen && selectedBarber) {
      resetEdit({
        name: selectedBarber.user.name,
        mobile: selectedBarber.user.mobile,
        bio: selectedBarber.bio ?? "",
        newPassword: "",
      });
    }
  }, [editDialogOpen, selectedBarber, resetEdit]);

  async function onEditBarber(values: EditBarberValues) {
    if (!selectedBarber || !isAdmin) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      const payload: Record<string, unknown> = {
        name: values.name,
        mobile: values.mobile,
        bio: values.bio ?? "",
      };
      if (values.newPassword) payload.password = values.newPassword;
      await updateBarberApi(selectedBarber.id, payload, token);
      await refresh();
      toast.success("اطلاعات آرایشگر ویرایش شد");
      setEditDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ویرایش آرایشگر");
    }
  }

  async function onCreateBarber(values: CreateBarberValues) {
    if (!isAdmin) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      const created = await createBarberApi(
        { name: values.name, mobile: values.mobile, password: values.password, bio: values.bio, serviceIds: [] },
        token
      );
      await refresh();
      setSelectedBarberId(created.id);
      toast.success("آرایشگر جدید اضافه شد");
      reset();
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ساخت آرایشگر");
    }
  }

  function handlePermissionDraftChange(key: keyof ApiBarberPermissions, value: boolean) {
    if (!isAdmin) return;
    setDraftPermissions((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSavePermissions() {
    if (!selectedBarber || !draftPermissions || !isAdmin) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      await updateBarberPermissionsApi(selectedBarber.id, draftPermissions, token);
      await refresh();
      toast.success("پرمیشن‌ها ذخیره شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ذخیره‌ی پرمیشن‌ها");
    }
  }

  function handleCancelPermissions() {
    if (!selectedBarber) return;
    setDraftPermissions({
      manageServices: selectedBarber.manageServices,
      managePricing: selectedBarber.managePricing,
      manageSchedule: selectedBarber.manageSchedule,
      manageTimeOff: selectedBarber.manageTimeOff,
      blockSlots: selectedBarber.blockSlots,
      cancelOwnBookings: selectedBarber.cancelOwnBookings,
      viewCustomers: selectedBarber.viewCustomers,
    });
  }

  function handleServiceDraftToggle(serviceId: string, checked: boolean) {
    if (!isAdmin) return;
    setDraftServiceIds((prev) => {
      if (!prev) return prev;
      return checked ? [...prev, serviceId] : prev.filter((id) => id !== serviceId);
    });
  }

  async function handleSaveServices() {
    if (!selectedBarber || !draftServiceIds || !isAdmin) return;
    const token = getAuthToken();
    if (!token) return;
    setIsSavingServices(true);
    try {
      await updateBarberApi(selectedBarber.id, { serviceIds: draftServiceIds }, token);
      await refresh();
      toast.success("خدمات این آرایشگر به‌روزرسانی شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ذخیره‌ی خدمات");
    } finally {
      setIsSavingServices(false);
    }
  }

  function handleCancelServices() {
    if (!selectedBarber) return;
    setDraftServiceIds(selectedBarber.services.map((s) => s.serviceId));
  }

  // «پذیرش نوبت جدید» (BarberProfile.isActive) — همون سوییچ قدیمی، فقط
  // لیبلش واضح‌تر شد؛ اثری روی «دسترسی به حساب» نداره.
  async function handleActiveChange(barberId: string, value: boolean) {
    if (!isAdmin) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      await updateBarberApi(barberId, { isActive: value }, token);
      await refresh();
      toast.success(value ? "پذیرش نوبت جدید فعال شد" : "پذیرش نوبت جدید غیرفعال شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت");
    }
  }

  async function handleDelete(barberId: string, name: string) {
    if (!isAdmin) return;
    const confirmed = window.confirm(`آرایشگر «${name}» حذف شود؟ این عمل قابل بازگشت نیست.`);
    if (!confirmed) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      await deleteBarberApi(barberId, token);
      await refresh();
      if (selectedBarberId === barberId) setSelectedBarberId(null);
      toast.success("آرایشگر حذف شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در حذف آرایشگر");
    }
  }

  // ==================== «دسترسی به حساب» (فاز تکمیلی ۱.۲) ====================

  async function handleAccountAccessChange(barber: ApiBarber, nextValue: boolean) {
    if (!isAdmin) return;
    const token = getAuthToken();
    if (!token) return;

    // فعال‌کردن دوباره: مستقیم، بدون مودال (رفع مسدودیت هیچ‌وقت به تایید
    // اضافه نیاز نداره)
    if (nextValue) {
      setIsSubmittingAccountStatus(true);
      try {
        await updateBarberAccountStatusApi(barber.id, { isActive: true }, token);
        await refresh();
        toast.success("دسترسی آرایشگر به حساب فعال شد");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "خطا در فعال‌سازی حساب");
      } finally {
        setIsSubmittingAccountStatus(false);
      }
      return;
    }

    // غیرفعال‌کردن: اول چک کن نوبت آینده داره یا نه
    setIsCheckingFutureBookings(true);
    try {
      const future = await getBarberFutureBookingsApi(barber.id, token);
      if (future.length === 0) {
        // نوبت آینده‌ای نداره → مودال دلیل (اختیاری) رو باز کن
        setReasonBarber(barber);
        setReasonValue("");
        setReasonModalOpen(true);
      } else {
        setFutureBookings(future);
        setFutureBookingsBarber(barber);
        setFutureBookingsModalOpen(true);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در بررسی نوبت‌های آینده");
    } finally {
      setIsCheckingFutureBookings(false);
    }
  }

  // تایید نهایی غیرفعال‌سازی از داخل مودال دلیل (وقتی نوبت آینده‌ای وجود نداره)
  async function handleConfirmDeactivateNoBookings() {
    if (!reasonBarber) return;
    const token = getAuthToken();
    if (!token) return;
    setIsSubmittingAccountStatus(true);
    try {
      await updateBarberAccountStatusApi(
        reasonBarber.id,
        { isActive: false, reason: reasonValue.trim() || undefined },
        token,
      );
      await refresh();
      toast.success("دسترسی آرایشگر به حساب غیرفعال شد");
      setReasonModalOpen(false);
      setReasonBarber(null);
      setReasonValue("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در غیرفعال‌سازی حساب");
    } finally {
      setIsSubmittingAccountStatus(false);
    }
  }

  async function handleDeactivateKeepBookings() {
    if (!futureBookingsBarber) return;
    const token = getAuthToken();
    if (!token) return;
    setIsSubmittingAccountStatus(true);
    try {
      await updateBarberAccountStatusApi(
        futureBookingsBarber.id,
        { isActive: false, cancelFutureBookings: false },
        token,
      );
      await refresh();
      toast.success("حساب غیرفعال شد؛ نوبت‌های موجود دست‌نخورده ماندند");
      setFutureBookingsModalOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در غیرفعال‌سازی حساب");
    } finally {
      setIsSubmittingAccountStatus(false);
    }
  }

  async function handleDeactivateCancelBookings() {
    if (!futureBookingsBarber) return;
    const token = getAuthToken();
    if (!token) return;
    setIsSubmittingAccountStatus(true);
    try {
      await updateBarberAccountStatusApi(
        futureBookingsBarber.id,
        { isActive: false, cancelFutureBookings: true },
        token,
      );
      await refresh();
      toast.success("حساب غیرفعال شد و نوبت‌ها لغو و به مشتریان اطلاع داده شد");
      setFutureBookingsModalOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در غیرفعال‌سازی حساب");
    } finally {
      setIsSubmittingAccountStatus(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        در حال دریافت آرایشگرها...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">مدیریت آرایشگرها</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "یک آرایشگر را انتخاب کنید تا پرمیشن‌هایش را تنظیم کنید"
              : "لیست آرایشگرها (فقط مشاهده)"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Popover open={comboOpen} onOpenChange={setComboOpen}>
            <PopoverAnchor asChild>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  placeholder="جستجوی آرایشگر"
                  className="pl-9 pr-9"
                  onFocus={() => setComboOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsTyping(true);
                    setComboOpen(true);
                  }}
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="پاک کردن جستجو"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </PopoverAnchor>
            <PopoverPortal>
              <PopoverContent
                dir="rtl"
                align="start"
                sideOffset={4}
                className="z-50 w-[--radix-popover-trigger-width] rounded-md border border-border bg-background p-1 text-foreground shadow-lg"
                style={{ backgroundColor: "hsl(var(--background))" }}
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="max-h-64 overflow-y-auto">
                  {visibleBarbers.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                      آرایشگری یافت نشد
                    </p>
                  ) : (
                    visibleBarbers.map((barber) => (
                      <button
                        key={barber.id}
                        type="button"
                        onClick={() => {
                          setSelectedBarberId(barber.id);
                          setComboOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center rounded-md px-3 py-2 text-right text-sm transition-colors hover:bg-secondary",
                          selectedBarberId === barber.id && "bg-secondary font-medium"
                        )}
                      >
                        {barber.user.name}
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </PopoverPortal>
          </Popover>

          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="shrink-0 gap-2">
                  <Plus className="h-4 w-4" />
                  افزودن آرایشگر
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>آرایشگر جدید</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onCreateBarber)} className="flex flex-col gap-4" noValidate>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">نام</Label>
                    <Input id="name" {...register("name")} />
                    {errors.name && (
                      <span className="text-xs text-destructive">{errors.name.message}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="mobile">شماره موبایل</Label>
                    <Input
                      id="mobile"
                      dir="ltr"
                      className="text-left"
                      placeholder="09123456789"
                      {...register("mobile")}
                    />
                    {errors.mobile && (
                      <span className="text-xs text-destructive">{errors.mobile.message}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="password">رمز عبور اولیه</Label>
                    <Input id="password" type="text" dir="ltr" className="text-left" {...register("password")} />
                    {errors.password && (
                      <span className="text-xs text-destructive">{errors.password.message}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="bio">بیوگرافی (اختیاری)</Label>
                    <Input id="bio" {...register("bio")} />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "در حال ثبت..." : "ثبت آرایشگر"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {selectedBarber ? (
        <Card key={selectedBarber.id} className={cn(PERMISSIONS_BOX_MIN_HEIGHT, "flex flex-col")}>
          <CardContent className="flex flex-1 flex-col gap-4 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                  {selectedBarber.initials}
                </div>
                <div>
                  <p className="font-bold">{selectedBarber.user.name}</p>
                  <p dir="ltr" className="text-left text-xs text-muted-foreground">
                    {selectedBarber.user.mobile}
                  </p>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-3">
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="ghost" aria-label="ویرایش آرایشگر">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>ویرایش آرایشگر</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleEditSubmit(onEditBarber)} className="flex flex-col gap-4" noValidate>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit-name">نام</Label>
                          <Input id="edit-name" {...registerEdit("name")} />
                          {editErrors.name && (
                            <span className="text-xs text-destructive">{editErrors.name.message}</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit-mobile">شماره موبایل</Label>
                          <Input
                            id="edit-mobile"
                            dir="ltr"
                            className="text-left"
                            placeholder="09123456789"
                            {...registerEdit("mobile")}
                          />
                          {editErrors.mobile && (
                            <span className="text-xs text-destructive">{editErrors.mobile.message}</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit-bio">بیوگرافی (اختیاری)</Label>
                          <Input id="edit-bio" {...registerEdit("bio")} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit-password">رمز جدید (اختیاری)</Label>
                          <Input
                            id="edit-password"
                            dir="ltr"
                            className="text-left"
                            placeholder="خالی بذار تا تغییر نکنه"
                            {...registerEdit("newPassword")}
                          />
                          {editErrors.newPassword && (
                            <span className="text-xs text-destructive">
                              {editErrors.newPassword.message}
                            </span>
                          )}
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={isEditSubmitting}>
                            {isEditSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(selectedBarber.id, selectedBarber.user.name)}
                    aria-label="حذف آرایشگر"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* وضعیت حساب: دو سوییچ کاملاً جدا — دسترسی به حساب (لاگین) و پذیرش نوبت جدید */}
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">دسترسی به حساب</p>
                  <p className="text-xs text-muted-foreground">
                    غیرفعال یعنی این آرایشگر دیگر نمی‌تواند وارد پنل خود شود
                  </p>
                </div>
                <Switch
                  checked={selectedBarber.user.isActive}
                  onCheckedChange={(v) => handleAccountAccessChange(selectedBarber, v)}
                  disabled={!isAdmin || isCheckingFutureBookings || isSubmittingAccountStatus}
                  aria-label="دسترسی به حساب"
                />
              </div>
              {!selectedBarber.user.isActive && selectedBarber.user.blockedReason && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                  {selectedBarber.user.blockedReason}
                  {selectedBarber.user.blockedAt &&
                    ` — ${formatDateFa(selectedBarber.user.blockedAt)}`}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">پذیرش نوبت جدید</p>
                  <p className="text-xs text-muted-foreground">
                    غیرفعال یعنی مشتری‌های جدید نمی‌توانند از این آرایشگر نوبت بگیرند
                    (مثلاً موقع مرخصی طولانی)
                  </p>
                </div>
                <Switch
                  checked={selectedBarber.isActive}
                  onCheckedChange={(v) => handleActiveChange(selectedBarber.id, v)}
                  disabled={!isAdmin}
                  aria-label="پذیرش نوبت جدید"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2">
              {OPTIONAL_PERMISSIONS.map((perm) => (
                <div
                  key={perm.key}
                  className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 px-3 py-2"
                >
                  <span className="text-sm">{perm.label}</span>
                  <Switch
                    checked={draftPermissions?.[perm.key] ?? false}
                    onCheckedChange={(v) => handlePermissionDraftChange(perm.key, v)}
                    disabled={!isAdmin}
                    aria-label={perm.label}
                  />
                </div>
              ))}
            </div>

            {isAdmin && (
              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!isPermissionsDirty}
                  onClick={handleCancelPermissions}
                >
                  لغو
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!isPermissionsDirty}
                  onClick={handleSavePermissions}
                >
                  ذخیره تغییرات
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <p className="text-sm font-medium">خدماتی که این آرایشگر انجام می‌دهد</p>
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  هنوز هیچ سرویسی تعریف نشده. اول از صفحه‌ی «خدمات» چند سرویس بساز.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 px-3 py-2"
                    >
                      <span className="text-sm">{service.title}</span>
                      <Switch
                        checked={draftServiceIds?.includes(service.id) ?? false}
                        onCheckedChange={(v) => handleServiceDraftToggle(service.id, v)}
                        disabled={!isAdmin}
                        aria-label={service.title}
                      />
                    </div>
                  ))}
                </div>
              )}

              {isAdmin && (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!isServicesDirty}
                    onClick={handleCancelServices}
                  >
                    لغو
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!isServicesDirty || isSavingServices}
                    onClick={handleSaveServices}
                  >
                    {isSavingServices ? "..." : "ذخیره خدمات"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className={cn(PERMISSIONS_BOX_MIN_HEIGHT, "flex items-center justify-center")}>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
            <Users className="h-8 w-8" />
            <p className="text-sm">
              {barbers.length === 0
                ? isAdmin
                  ? "هنوز آرایشگری ثبت نشده. از دکمه‌ی «افزودن آرایشگر» شروع کنید."
                  : "هنوز آرایشگری ثبت نشده."
                : "برای مشاهده، یک آرایشگر را از کادر جستجو انتخاب کنید."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* مودال نوبت‌های آینده — فقط وقتی آرایشگر نوبت CONFIRMED آینده داره */}
      <Dialog open={futureBookingsModalOpen} onOpenChange={setFutureBookingsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {futureBookingsBarber?.user.name} نوبت‌های آینده دارد
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            این آرایشگر {toPersianCount(futureBookings.length)} نوبت تاییدشده‌ی آینده
            دارد. می‌خواهید با این نوبت‌ها چه کنیم؟
          </p>

          <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
            {futureBookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 text-sm last:border-b-0"
              >
                <div>
                  <p className="font-medium">{b.customerName}</p>
                  <p className="text-xs text-muted-foreground">{b.serviceTitle}</p>
                </div>
                <div className="text-left text-xs text-muted-foreground">
                  <p>{formatDateFa(b.date)}</p>
                  <p dir="ltr">{b.time}</p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isSubmittingAccountStatus}
              onClick={handleDeactivateKeepBookings}
            >
              فقط جلوی رزرو جدید گرفته بشود (نوبت‌های موجود دست‌نخورده)
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={isSubmittingAccountStatus}
              onClick={handleDeactivateCancelBookings}
            >
              {isSubmittingAccountStatus
                ? "در حال ثبت..."
                : "نوبت‌ها لغو شوند و به مشتری اطلاع داده شود"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال دلیل غیرفعال‌سازی — جایگزین window.prompt، فقط وقتی نوبت آینده‌ای وجود نداره */}
      <Dialog open={reasonModalOpen} onOpenChange={setReasonModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              دلیل غیرفعال‌کردن حساب «{reasonBarber?.user.name}» (اختیاری)
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="deactivate-reason">دلیل</Label>
            <Input
              id="deactivate-reason"
              value={reasonValue}
              onChange={(e) => setReasonValue(e.target.value)}
              placeholder="مثلاً: درخواست خود آرایشگر"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmittingAccountStatus}
              onClick={() => setReasonModalOpen(false)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDeactivateNoBookings}
              disabled={isSubmittingAccountStatus}
            >
              {isSubmittingAccountStatus ? "در حال ثبت..." : "غیرفعال کن"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function toPersianCount(n: number) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(n).replace(/[0-9]/g, (d) => persianDigits[Number(d)]);
}