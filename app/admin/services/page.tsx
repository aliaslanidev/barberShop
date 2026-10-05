"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2, X, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { StatusCard } from "@/components/ui/status-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  listServices,
  createServiceApi,
  updateServiceApi,
  deleteServiceApi,
  ApiError,
  type ApiService,
} from "@/lib/api";
import { getAuthToken } from "@/lib/data/mock-session";
// نگاشت آیکون فقط یه ثابت فرانتی‌ه (نه CRUD)، بی‌خطر از فایل قبلی import می‌شه
import { SERVICE_ICONS, type ServiceIconKey } from "@/lib/data/services";

const serviceSchema = z.object({
  title: z.string().min(2, "عنوان باید حداقل ۲ حرف باشد"),
  desc: z.string().min(5, "توضیحات باید حداقل ۵ حرف باشد"),
  priceValue: z.coerce.number().min(1000, "قیمت باید حداقل ۱٬۰۰۰ تومان باشد"),
  icon: z.enum(
    Object.keys(SERVICE_ICONS) as [ServiceIconKey, ...ServiceIconKey[]],
  ),
});
type ServiceFormValues = z.infer<typeof serviceSchema>;
type ServiceEditDraft = {
  title: string;
  desc: string;
  icon: ServiceIconKey;
  priceValue: number;
};

const ICON_LABELS: Record<ServiceIconKey, string> = {
  scissors: "قیچی",
  sparkles: "درخشش",
  droplet: "قطره",
  palette: "پالت رنگ",
};

function formatPriceLabel(priceValue: number) {
  return `از ${priceValue.toLocaleString("fa-IR")} تومان`;
}

function getServiceIcon(icon: string): LucideIcon {
  return SERVICE_ICONS[icon as ServiceIconKey] ?? SERVICE_ICONS.scissors;
}

function isServiceIconKey(icon: string): icon is ServiceIconKey {
  return Object.prototype.hasOwnProperty.call(SERVICE_ICONS, icon);
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<ApiService[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ApiService | null>(null);
  const [editDraft, setEditDraft] = useState<ServiceEditDraft | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function refresh() {
    try {
      const data = await listServices();
      setServices(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در دریافت خدمات");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const visibleServices = (services ?? []).filter(
    (s) =>
      !searchQuery.trim() ||
      s.title.includes(searchQuery.trim()) ||
      s.desc.includes(searchQuery.trim()),
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { title: "", desc: "", priceValue: 0, icon: "scissors" },
  });

  async function onCreateSubmit(values: ServiceFormValues) {
    const token = getAuthToken();
    if (!token) {
      toast.error("ابتدا دوباره وارد حساب کاربری شوید");
      return;
    }
    try {
      await createServiceApi(values, token);
      await refresh();
      toast.success(`سرویس «${values.title}» اضافه شد`);
      reset();
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ساخت سرویس");
    }
  }

  function handleStartEditing(service: ApiService) {
    setEditingService(service);
    setEditDraft({
      title: service.title,
      desc: service.desc,
      icon: isServiceIconKey(service.icon) ? service.icon : "scissors",
      priceValue: service.priceValue,
    });
  }

  function handleCancelEditing() {
    setEditingService(null);
    setEditDraft(null);
  }

  async function handleSaveService() {
    if (!editingService || !editDraft) return;
    const token = getAuthToken();
    if (!token) {
      toast.error("ابتدا دوباره وارد حساب کاربری شوید");
      return;
    }

    const validation = serviceSchema.safeParse(editDraft);
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "اطلاعات سرویس معتبر نیست");
      return;
    }

    if (
      editDraft.title === editingService.title &&
      editDraft.desc === editingService.desc &&
      editDraft.icon === editingService.icon &&
      editDraft.priceValue === editingService.priceValue
    ) {
      handleCancelEditing();
      return;
    }

    setIsSavingEdit(true);
    try {
      await updateServiceApi(editingService.id, validation.data, token);
      await refresh();
      handleCancelEditing();
      toast.success(`سرویس «${validation.data.title}» به‌روزرسانی شد`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ذخیره‌ی سرویس");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDelete(service: ApiService) {
    const token = getAuthToken();
    if (!token) return;
    try {
      await deleteServiceApi(service.id, token);
      await refresh();
      toast.success(`سرویس «${service.title}» حذف شد`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در حذف سرویس");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        در حال دریافت خدمات...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full min-w-0 sm:flex-1">
          <h1 className="whitespace-nowrap text-xl font-bold">خدمات و قیمت‌گذاری</h1>
          <p className="text-sm text-muted-foreground">
            افزودن و مدیریت خدمات سالن
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full min-w-0 sm:w-72">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              placeholder="جستجوی سرویس"
              className="pl-9 pr-9"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="پاک کردن جستجو"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="w-full shrink-0 gap-2 sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                سرویس جدید
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>افزودن سرویس جدید</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان سرویس</Label>
                  <Input id="title" placeholder="مثلاً اصلاح مو" {...register("title")} />
                  {errors.title && (
                    <p className="text-xs text-red-400">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc">توضیحات</Label>
                  <Textarea
                    id="desc"
                    placeholder="توضیح کوتاه درباره‌ی سرویس"
                    {...register("desc")}
                  />
                  {errors.desc && (
                    <p className="text-xs text-red-400">{errors.desc.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceValue">قیمت (تومان)</Label>
                  <Input id="priceValue" type="number" {...register("priceValue")} />
                  {errors.priceValue && (
                    <p className="text-xs text-red-400">{errors.priceValue.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>آیکون</Label>
                  <Select
                    defaultValue="scissors"
                    onValueChange={(value: string) =>
                      setValue("icon", value as ServiceIconKey)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب آیکون" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(SERVICE_ICONS) as ServiceIconKey[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {ICON_LABELS[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    افزودن سرویس
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {visibleServices.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            سرویسی با این عنوان یافت نشد
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleServices.map((service) => {
            const Icon = getServiceIcon(service.icon);
            return (
              <StatusCard
                key={service.id}
                tone="success"
                showTint={false}
                accentClassName="bg-primary"
                className="bg-[#0e110f]"
                contentClassName="space-y-4 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="font-bold">{service.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {service.desc}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 sm:shrink-0">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(service)}
                      aria-label={`حذف سرویس ${service.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEditing(service)}
                    >
                      <Pencil className="h-4 w-4" />
                      ویرایش
                    </Button>
                  </div>
                </div>

                <div className="space-y-1 border-t border-border pt-3">
                  <Label htmlFor={`price-${service.id}`} className="text-xs">
                    قیمت (تومان) — {formatPriceLabel(service.priceValue)}
                  </Label>
                  <div className="font-bold">
                    {service.priceValue.toLocaleString("fa-IR")}
                  </div>
                </div>
              </StatusCard>
            );
          })}
        </div>
      )}

      <Dialog
        open={editingService !== null}
        onOpenChange={(open) => {
          if (!open && !isSavingEdit) handleCancelEditing();
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto bg-[#0e110f] shadow-2xl sm:max-w-lg">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle>ویرایش سرویس</DialogTitle>
          </DialogHeader>
          {editDraft && (
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border border-border/80 bg-secondary/40 p-3">
                <Label htmlFor="edit-service-title">عنوان سرویس</Label>
                <Input
                  id="edit-service-title"
                  value={editDraft.title}
                  disabled={isSavingEdit}
                  onChange={(e) =>
                    setEditDraft({ ...editDraft, title: e.target.value })
                  }
                />
                {editDraft.title.trim().length < 2 && (
                  <p className="text-xs text-red-400">
                    عنوان باید حداقل ۲ حرف باشد
                  </p>
                )}
              </div>
              <div className="space-y-2 rounded-lg border border-border/80 bg-secondary/40 p-3">
                <Label htmlFor="edit-service-desc">توضیحات</Label>
                <Textarea
                  id="edit-service-desc"
                  value={editDraft.desc}
                  disabled={isSavingEdit}
                  onChange={(e) =>
                    setEditDraft({ ...editDraft, desc: e.target.value })
                  }
                />
                {editDraft.desc.trim().length < 5 && (
                  <p className="text-xs text-red-400">
                    توضیحات باید حداقل ۵ حرف باشد
                  </p>
                )}
              </div>
              <div className="space-y-2 rounded-lg border border-border/80 bg-secondary/40 p-3">
                <Label htmlFor="edit-service-price">قیمت (تومان)</Label>
                <Input
                  id="edit-service-price"
                  type="number"
                  min={1000}
                  value={editDraft.priceValue}
                  disabled={isSavingEdit}
                  onChange={(e) =>
                    setEditDraft({
                      ...editDraft,
                      priceValue: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2 rounded-lg border border-border/80 bg-secondary/40 p-3">
                <Label>آیکون</Label>
                <Select
                  value={editDraft.icon}
                  disabled={isSavingEdit}
                  onValueChange={(value: string) => {
                    if (isServiceIconKey(value)) {
                      setEditDraft({ ...editDraft, icon: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب آیکون" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SERVICE_ICONS) as ServiceIconKey[]).map(
                      (key) => (
                        <SelectItem key={key} value={key}>
                          {ICON_LABELS[key]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSavingEdit}
                  onClick={handleCancelEditing}
                >
                  لغو
                </Button>
                <Button
                  type="button"
                  disabled={
                    isSavingEdit ||
                    !serviceSchema.safeParse(editDraft).success
                  }
                  onClick={handleSaveService}
                >
                  {isSavingEdit ? "در حال ثبت..." : "ثبت"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}