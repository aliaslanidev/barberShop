"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, ShieldAlert, Trash2, UserCog } from "lucide-react";

import {
  listManagersApi,
  createManagerApi,
  updateManagerApi,
  deleteManagerApi,
  updateManagerStatusApi,
  ApiError,
  type ApiManager,
} from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";
import { getCurrentAdmin } from "@/lib/data/admin-session";

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

const createManagerSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ حرف باشد"),
  mobile: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست (مثال: 09123456789)"),
  password: z.string().min(4, "رمز عبور باید حداقل ۴ کاراکتر باشد"),
});
type CreateManagerValues = z.infer<typeof createManagerSchema>;

const editManagerSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ حرف باشد"),
  mobile: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست (مثال: 09123456789)"),
  newPassword: z
    .string()
    .min(4, "رمز جدید باید حداقل ۴ کاراکتر باشد")
    .optional()
    .or(z.literal("")),
});
type EditManagerValues = z.infer<typeof editManagerSchema>;

function formatDateFa(iso: string) {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AdminManagersPage() {
  const admin = getCurrentAdmin();
  const isAdmin = admin?.role === "admin";

  const [managers, setManagers] = useState<ApiManager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<ApiManager | null>(null);
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);

  async function refresh() {
    try {
      const data = await listManagersApi(getAuthToken() ?? "");
      setManagers(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در دریافت اطلاعات");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) refresh();
    else setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateManagerValues>({ resolver: zodResolver(createManagerSchema) });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: isEditSubmitting },
  } = useForm<EditManagerValues>({ resolver: zodResolver(editManagerSchema) });

  useEffect(() => {
    if (editDialogOpen && editingManager) {
      resetEdit({ name: editingManager.name, mobile: editingManager.mobile, newPassword: "" });
    }
  }, [editDialogOpen, editingManager, resetEdit]);

  async function onCreateManager(values: CreateManagerValues) {
    const token = getAuthToken();
    if (!token) return;
    try {
      await createManagerApi(values, token);
      await refresh();
      toast.success("مدیر سالن جدید اضافه شد");
      reset();
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ساخت مدیر سالن");
    }
  }

  async function onEditManager(values: EditManagerValues) {
    if (!editingManager) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      const payload: { name: string; mobile: string; password?: string } = {
        name: values.name,
        mobile: values.mobile,
      };
      if (values.newPassword) payload.password = values.newPassword;
      await updateManagerApi(editingManager.id, payload, token);
      await refresh();
      toast.success("اطلاعات مدیر سالن ویرایش شد");
      setEditDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ویرایش مدیر سالن");
    }
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = window.confirm(`مدیر سالن «${name}» حذف شود؟ این عمل قابل بازگشت نیست.`);
    if (!confirmed) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      await deleteManagerApi(id, token);
      await refresh();
      toast.success("مدیر سالن حذف شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در حذف مدیر سالن");
    }
  }

  // فاز تکمیلی ۱.۲ — غیرفعال‌سازی کامل حساب به‌جای حذف. مدیر سالن نوبت
  // نداره، پس برخلاف آرایشگر نیازی به چک نوبت‌های آینده/مودال نیست.
  async function handleStatusChange(manager: ApiManager, nextValue: boolean) {
    const token = getAuthToken();
    if (!token) return;

    let reason: string | undefined;
    if (!nextValue) {
      const input = window.prompt(
        `دلیل غیرفعال‌کردن حساب «${manager.name}» را وارد کنید (اختیاری):`,
        "",
      );
      if (input === null) return; // انصراف
      reason = input.trim() || undefined;
    }

    setPendingStatusId(manager.id);
    try {
      await updateManagerStatusApi(manager.id, { isActive: nextValue, reason }, token);
      await refresh();
      toast.success(nextValue ? "حساب مدیر سالن فعال شد" : "حساب مدیر سالن غیرفعال شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت حساب");
    } finally {
      setPendingStatusId(null);
    }
  }

  // این صفحه فقط برای ادمین اصلیه؛ اگه مدیر سالن مستقیم URL رو بزنه، همین‌جا جلوش گرفته می‌شه
  // (لینکش هم از قبل تو سایدبار برای مدیر سالن نمایش داده نمی‌شه)
  if (admin && !isAdmin) {
    return (
      <div className="flex items-center justify-center p-10 text-center text-sm text-muted-foreground">
        شما اجازه‌ی دسترسی به این بخش را ندارید. مدیریت مدیران سالن فقط در
        اختیار ادمین اصلی است.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        در حال دریافت مدیران سالن...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">مدیریت مدیران سالن</h1>
          <p className="text-sm text-muted-foreground">
            حساب مدیر سالن (Manager) فقط توسط ادمین اصلی ساخته می‌شود
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="shrink-0 gap-2">
              <Plus className="h-4 w-4" />
              افزودن مدیر سالن
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>مدیر سالن جدید</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onCreateManager)} className="flex flex-col gap-4" noValidate>
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
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "در حال ثبت..." : "ثبت مدیر سالن"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {managers.length === 0 ? (
        <Card className="flex min-h-[200px] items-center justify-center">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
            <UserCog className="h-8 w-8" />
            <p className="text-sm">
              هنوز مدیر سالنی ثبت نشده. از دکمه‌ی «افزودن مدیر سالن» شروع کنید.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {managers.map((manager) => (
            <Card key={manager.id}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold">{manager.name}</p>
                    <p dir="ltr" className="text-left text-xs text-muted-foreground">
                      {manager.mobile}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog
                      open={editDialogOpen && editingManager?.id === manager.id}
                      onOpenChange={(open) => {
                        setEditDialogOpen(open);
                        if (open) setEditingManager(manager);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button type="button" variant="ghost" aria-label="ویرایش مدیر سالن">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>ویرایش مدیر سالن</DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={handleEditSubmit(onEditManager)}
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
                      onClick={() => handleDelete(manager.id, manager.name)}
                      aria-label="حذف مدیر سالن"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* فاز تکمیلی ۱.۲ — غیرفعال‌سازی کامل حساب به‌جای حذف دائمی */}
                <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">دسترسی به حساب</p>
                    <p className="text-xs text-muted-foreground">
                      غیرفعال یعنی این مدیر سالن دیگر نمی‌تواند وارد پنل خود شود
                    </p>
                  </div>
                  <Switch
                    checked={manager.isActive}
                    onCheckedChange={(v) => handleStatusChange(manager, v)}
                    disabled={pendingStatusId === manager.id}
                    aria-label="فعال/غیرفعال"
                  />
                </div>
                {!manager.isActive && manager.blockedReason && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                    {manager.blockedReason}
                    {manager.blockedAt && ` — ${formatDateFa(manager.blockedAt)}`}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}