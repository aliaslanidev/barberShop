"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
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
  getAllServices,
  createService,
  updateService,
  deleteService,
  SERVICE_ICONS,
  type Service,
  type ServiceIconKey,
} from "@/lib/data/services";

const serviceSchema = z.object({
  title: z.string().min(2, "عنوان باید حداقل ۲ حرف باشد"),
  desc: z.string().min(5, "توضیحات باید حداقل ۵ حرف باشد"),
  priceValue: z.coerce.number().min(1000, "قیمت باید حداقل ۱٬۰۰۰ تومان باشد"),
  icon: z.enum(Object.keys(SERVICE_ICONS) as [ServiceIconKey, ...ServiceIconKey[]]),
});
type ServiceFormValues = z.infer<typeof serviceSchema>;

const ICON_LABELS: Record<ServiceIconKey, string> = {
  scissors: "قیچی",
  sparkles: "درخشش",
  droplet: "قطره",
  palette: "پالت رنگ",
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>(() => getAllServices());
  const [dialogOpen, setDialogOpen] = useState(false);
  // ویرایش قیمت به‌صورت inline روی هر کارت انجام می‌شه؛ این state فقط
  // مقدار در حال ویرایش رو نگه می‌داره تا با هر keypress خودِ داده تغییر نکنه.
  const [priceDrafts, setPriceDrafts] = useState<Record<string, number>>({});

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { title: "", desc: "", priceValue: 0, icon: "scissors" },
  });

  function refresh() {
    setServices([...getAllServices()]);
  }

  function onCreateSubmit(values: ServiceFormValues) {
    createService(values);
    refresh();
    toast.success(`سرویس «${values.title}» اضافه شد`);
    reset();
    setDialogOpen(false);
  }

  function getDraftPrice(service: Service) {
    return priceDrafts[service.id] ?? service.priceValue;
  }

  function handleSavePrice(service: Service) {
    const newPrice = getDraftPrice(service);
    updateService(service.id, { priceValue: newPrice });
    refresh();
    toast.success(`قیمت «${service.title}» به‌روزرسانی شد`);
  }

  function handleDelete(service: Service) {
    // TODO: قبل از حذف واقعی، باید چک بشه که این سرویس به نوبت آینده‌ی فعالی وصل نیست.
    deleteService(service.id);
    refresh();
    toast.success(`سرویس «${service.title}» حذف شد`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">خدمات و قیمت‌گذاری</h1>
          <p className="text-sm text-muted-foreground">
            افزودن، ویرایش قیمت و حذف خدمات سالن
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
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
                {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">توضیحات</Label>
                <Textarea id="desc" placeholder="توضیح کوتاه درباره‌ی سرویس" {...register("desc")} />
                {errors.desc && <p className="text-xs text-red-400">{errors.desc.message}</p>}
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
                  onValueChange={(value: string) => setValue("icon", value as ServiceIconKey)}
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

      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Card key={service.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="font-bold">{service.title}</div>
                      <div className="text-xs text-muted-foreground">{service.desc}</div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(service)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`price-${service.id}`} className="text-xs">
                      قیمت (تومان)
                    </Label>
                    <Input
                      id={`price-${service.id}`}
                      type="number"
                      value={getDraftPrice(service)}
                      onChange={(e) =>
                        setPriceDrafts((p) => ({ ...p, [service.id]: Number(e.target.value) }))
                      }
                    />
                  </div>
                  <Button size="sm" onClick={() => handleSavePrice(service)}>
                    ذخیره
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}