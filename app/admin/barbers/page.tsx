"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import {
  getAllBarbers,
  createBarber,
  updateBarber,
  updateBarberPermissions,
  deleteBarber,
  type Barber,
  type BarberPermissions,
} from "@/lib/data/barbers";

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

export default function AdminBarbersPage() {
  const [barbers, setBarbers] = useState<Barber[]>(() => getAllBarbers());
  const [dialogOpen, setDialogOpen] = useState(false);

  function refresh() {
    setBarbers([...getAllBarbers()]);
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBarberValues>({
    resolver: zodResolver(createBarberSchema),
  });

  function onCreateBarber(values: CreateBarberValues) {
    createBarber(values);
    refresh();
    toast.success("آرایشگر جدید اضافه شد");
    reset();
    setDialogOpen(false);
  }

  function handlePermissionChange(
    barberId: string,
    key: keyof BarberPermissions,
    value: boolean
  ) {
    updateBarberPermissions(barberId, { [key]: value });
    refresh();
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
    refresh();
    toast.success("آرایشگر حذف شد");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">مدیریت آرایشگرها</h1>
          <p className="text-sm text-muted-foreground">
            پرمیشن‌های هر آرایشگر را تک‌به‌تک تنظیم کنید
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
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

      <div className="flex flex-col gap-4">
        {barbers.map((barber) => (
          <Card key={barber.id}>
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                    {barber.initials}
                  </div>
                  <div>
                    <p className="font-bold">{barber.name}</p>
                    <p dir="ltr" className="text-left text-xs text-muted-foreground">
                      {barber.mobile ?? "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {barber.isActive ? "فعال" : "غیرفعال"}
                    </span>
                    <Switch
                      checked={barber.isActive}
                      onCheckedChange={(v) => handleActiveChange(barber.id, v)}
                      aria-label="فعال/غیرفعال"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    // size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(barber.id, barber.name)}
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
                      checked={barber.permissions[perm.key]}
                      onCheckedChange={(v) =>
                        handlePermissionChange(barber.id, perm.key, v)
                      }
                      aria-label={perm.label}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {barbers.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            هنوز آرایشگری ثبت نشده است
          </p>
        )}
      </div>
    </div>
  );
}