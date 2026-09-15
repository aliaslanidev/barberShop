"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2, Users, X } from "lucide-react";

import {
  getAllBarbers,
  createBarber,
  updateBarber,
  updateBarberPermissions,
  deleteBarber,
  type Barber,
  type BarberPermissions,
} from "@/lib/data/barbers";

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

const OPTIONAL_PERMISSIONS: { key: keyof BarberPermissions; label: string }[] = [
  { key: "manage_services", label: "مدیریت خدمات" },
  { key: "manage_pricing", label: "مدیریت قیمت" },
  { key: "manage_schedule", label: "مدیریت زمان‌بندی" },
  { key: "manage_time_off", label: "مدیریت مرخصی" },
  { key: "block_slots", label: "بلاک کردن اسلات" },
  { key: "cancel_own_bookings", label: "کنسل کردن نوبت تاییدشده" },
];

const createBarberSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ حرف باشد"),
  mobile: z
    .string()
    .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست (مثال: 09123456789)"),
  bio: z.string().optional(),
});

type CreateBarberValues = z.infer<typeof createBarberSchema>;

const editBarberSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ حرف باشد"),
  mobile: z
    .string()
    .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست (مثال: 09123456789)"),
  bio: z.string().optional(),
});

type EditBarberValues = z.infer<typeof editBarberSchema>;

// ارتفاع مشترک باکس پرمیشن‌ها، چه در حالت خالی و چه وقتی آرایشگر انتخاب شده
const PERMISSIONS_BOX_MIN_HEIGHT = "min-h-[350px]";

export default function AdminBarbersPage() {
  const [barbers, setBarbers] = useState<Barber[]>(() => getAllBarbers());
  // پیش‌فرض هیچ آرایشگری انتخاب نشده
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [draftPermissions, setDraftPermissions] =
    useState<BarberPermissions | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedBarber = barbers.find((b) => b.id === selectedBarberId) ?? null;

  // با انتخاب یا تغییر آرایشگر، یک نسخه‌ی پیش‌نویس از پرمیشن‌ها می‌سازیم
  // تا تغییرات سوییچ‌ها فوراً ذخیره نشن و منتظر «ذخیره» بمونن
  useEffect(() => {
    const found = barbers.find((b) => b.id === selectedBarberId) ?? null;
    setDraftPermissions(found ? { ...found.permissions } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBarberId]);

  const isPermissionsDirty =
    !!selectedBarber &&
    !!draftPermissions &&
    OPTIONAL_PERMISSIONS.some(
      (perm) => draftPermissions[perm.key] !== selectedBarber.permissions[perm.key]
    );

  const visibleBarbers = isTyping
    ? barbers.filter((b) => b.name.includes(searchQuery.trim()))
    : barbers;

  useEffect(() => {
    if (!comboOpen) {
      setSearchQuery(selectedBarber?.name ?? "");
      setIsTyping(false);
    }
  }, [comboOpen, selectedBarber]);

  function refresh() {
    setBarbers([...getAllBarbers()]);
  }

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
        name: selectedBarber.name,
        mobile: selectedBarber.mobile ?? "",
        bio: selectedBarber.bio ?? "",
      });
    }
  }, [editDialogOpen, selectedBarber, resetEdit]);

  function onEditBarber(values: EditBarberValues) {
    if (!selectedBarber) return;
    updateBarber(selectedBarber.id, values);
    refresh();
    toast.success("اطلاعات آرایشگر ویرایش شد");
    setEditDialogOpen(false);
  }

  function onCreateBarber(values: CreateBarberValues) {
    createBarber(values);
    const updated = getAllBarbers();
    setBarbers(updated);
    const created = updated.find((b) => b.mobile === values.mobile);
    if (created) setSelectedBarberId(created.id);
    toast.success("آرایشگر جدید اضافه شد");
    reset();
    setDialogOpen(false);
  }

  function handlePermissionDraftChange(
    key: keyof BarberPermissions,
    value: boolean
  ) {
    setDraftPermissions((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function handleSavePermissions() {
    if (!selectedBarber || !draftPermissions) return;
    updateBarberPermissions(selectedBarber.id, draftPermissions);
    refresh();
    toast.success("پرمیشن‌ها ذخیره شد");
  }

  function handleCancelPermissions() {
    if (!selectedBarber) return;
    setDraftPermissions({ ...selectedBarber.permissions });
  }

  function handleActiveChange(barberId: string, value: boolean) {
    updateBarber(barberId, { isActive: value });
    refresh();
    toast.success(value ? "آرایشگر فعال شد" : "آرایشگر غیرفعال شد");
  }

  function handleDelete(barberId: string, name: string) {
    const confirmed = window.confirm(
      `آرایشگر «${name}» حذف شود؟ این عمل قابل بازگشت نیست.`
    );
    if (!confirmed) return;
    deleteBarber(barberId);
    const updated = getAllBarbers();
    setBarbers(updated);
    if (selectedBarberId === barberId) {
      setSelectedBarberId(null);
    }
    toast.success("آرایشگر حذف شد");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">مدیریت آرایشگرها</h1>
          <p className="text-sm text-muted-foreground">
            یک آرایشگر را انتخاب کنید تا پرمیشن‌هایش را تنظیم کنید
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
                          selectedBarberId === barber.id &&
                            "bg-secondary font-medium"
                        )}
                      >
                        {barber.name}
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </PopoverPortal>
          </Popover>

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
              <form
                onSubmit={handleSubmit(onCreateBarber)}
                className="flex flex-col gap-4"
                noValidate
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">نام</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && (
                    <span className="text-xs text-destructive">
                      {errors.name.message}
                    </span>
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
                    <span className="text-xs text-destructive">
                      {errors.mobile.message}
                    </span>
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
        </div>
      </div>

      {selectedBarber ? (
        <Card
          key={selectedBarber.id}
          className={cn(PERMISSIONS_BOX_MIN_HEIGHT, "flex flex-col")}
        >
          <CardContent className="flex flex-1 flex-col gap-4 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                  {selectedBarber.initials}
                </div>
                <div>
                  <p className="font-bold">{selectedBarber.name}</p>
                  <p dir="ltr" className="text-left text-xs text-muted-foreground">
                    {selectedBarber.mobile ?? "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {selectedBarber.isActive ? "فعال" : "غیرفعال"}
                  </span>
                  <Switch
                    checked={selectedBarber.isActive}
                    onCheckedChange={(v) =>
                      handleActiveChange(selectedBarber.id, v)
                    }
                    aria-label="فعال/غیرفعال"
                  />
                </div>
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label="ویرایش آرایشگر"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>ویرایش آرایشگر</DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={handleEditSubmit(onEditBarber)}
                      className="flex flex-col gap-4"
                      noValidate
                    >
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="edit-name">نام</Label>
                        <Input id="edit-name" {...registerEdit("name")} />
                        {editErrors.name && (
                          <span className="text-xs text-destructive">
                            {editErrors.name.message}
                          </span>
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
                          <span className="text-xs text-destructive">
                            {editErrors.mobile.message}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="edit-bio">بیوگرافی (اختیاری)</Label>
                        <Input id="edit-bio" {...registerEdit("bio")} />
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
                  onClick={() =>
                    handleDelete(selectedBarber.id, selectedBarber.name)
                  }
                  aria-label="حذف آرایشگر"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
                    onCheckedChange={(v) =>
                      handlePermissionDraftChange(perm.key, v)
                    }
                    aria-label={perm.label}
                  />
                </div>
              ))}
            </div>

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
          </CardContent>
        </Card>
      ) : (
        <Card
          className={cn(
            PERMISSIONS_BOX_MIN_HEIGHT,
            "flex items-center justify-center"
          )}
        >
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
            <Users className="h-8 w-8" />
            <p className="text-sm">
              {barbers.length === 0
                ? "هنوز آرایشگری ثبت نشده. از دکمه‌ی «افزودن آرایشگر» شروع کنید."
                : "برای مشاهده و تنظیم پرمیشن‌ها، یک آرایشگر را از کادر جستجو انتخاب کنید."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}