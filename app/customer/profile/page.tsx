"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentCustomer } from "@/lib/data/customer";

const profileSchema = z.object({
  name: z.string().min(3, "نام باید حداقل ۳ حرف باشد"),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
});
type ProfileValues = z.infer<typeof profileSchema>;

export default function CustomerProfilePage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: currentCustomer.name, phone: currentCustomer.phone },
  });

  async function onSubmit(values: ProfileValues) {
    // TODO: اتصال به API واقعی وقتی بک‌اند آماده شد
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success("اطلاعات با موفقیت ذخیره شد");
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">پروفایل من</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">نام و نام خانوادگی</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">شماره موبایل</Label>
          <Input id="phone" dir="ltr" className="text-right" {...register("phone")} />
          {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "در حال ذخیره..." : "ذخیره‌ی تغییرات"}
        </Button>
      </form>
    </div>
  );
}