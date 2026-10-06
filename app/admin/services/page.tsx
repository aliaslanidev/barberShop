"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, X, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { StatusCard } from "@/components/ui/status-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  StandardTablePageHeading,
  StandardTablePanel,
  StandardTableSearch,
} from "@/components/ui/standard-table-layout";
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
  listAdminServicesApi,
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
  const [updatingServiceId, setUpdatingServiceId] = useState<string | null>(null);

  async function refresh() {
    const token = getAuthToken();
    if (!token) {
      toast.error("ابتدا دوباره وارد حساب کاربری شوید");
      setIsLoading(false);
      return;
    }
    try {
      const data = await listAdminServicesApi(token);
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

  function handleSearchChange(value: string) {
    setSearchQuery(value);
  }

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

  async function handleServiceStatusChange(
    service: ApiService,
    isActive: boolean,
  ) {
    const token = getAuthToken();
    if (!token) {
      toast.error("ابتدا دوباره وارد حساب کاربری شوید");
      return;
    }
    setUpdatingServiceId(service.id);
    try {
      await updateServiceApi(service.id, { isActive }, token);
      await refresh();
      toast.success(isActive ? "سرویس فعال شد" : "سرویس غیرفعال شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت سرویس");
    } finally {
      setUpdatingServiceId(null);
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
      <StandardTablePageHeading
        title="خدمات و قیمت‌گذاری"
        description="مدیریت خدمات و قیمت‌های سالن"
      />

      <StandardTablePanel
        toolbar={
          <>
            <StandardTableSearch
              value={searchQuery}
              placeholder="جستجوی سرویس"
              onChange={(event) => handleSearchChange(event.target.value)}
              clearAction={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
                    aria-label="پاک کردن جستجو"
                    className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : undefined
              }
            />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 shrink-0 gap-1.5 px-3">
                <Plus className="h-3.5 w-3.5" />
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
          </>
        }
      >

      {visibleServices.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {searchQuery ? "سرویسی با این عنوان یافت نشد" : "هنوز سرویسی ثبت نشده است"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleServices.map((service) => {
            const Icon = getServiceIcon(service.icon);
            return (
              <StatusCard
                key={service.id}
                tone={service.isActive ? "success" : "neutral"}
                showTint={false}
                accentClassName={
                  service.isActive ? "bg-primary" : "bg-muted-foreground/40"
                }
                className="bg-background/30"
                contentClassName="flex flex-col gap-3 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{service.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {service.desc}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 px-0"
                      onClick={() => handleStartEditing(service)}
                      aria-label={`ویرایش سرویس ${service.title}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-7 w-7 px-0"
                      onClick={() => void handleDelete(service)}
                      aria-label={`حذف سرویس ${service.title}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatPriceLabel(service.priceValue)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {service.isActive ? "فعال" : "غیرفعال"}
                    </span>
                    <Switch
                      checked={service.isActive}
                      disabled={updatingServiceId === service.id}
                      onCheckedChange={(isActive) =>
                        void handleServiceStatusChange(service, isActive)
                      }
                      aria-label={`وضعیت ${service.title}`}
                    />
                  </div>
                </div>
              </StatusCard>
            );
          })}
        </div>
      )}
      </StandardTablePanel>

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