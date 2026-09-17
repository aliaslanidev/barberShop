"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Phone, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

const loginSchema = z.object({
  mobile: z
    .string()
    .min(1, "شماره موبایل را وارد کنید")
    .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست (مثال: 09123456789)"),
  password: z.string().min(4, "رمز عبور باید حداقل ۴ کاراکتر باشد"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// TODO: وقتی پنل مدیر سالن ساخته شد، مسیر مخصوص خودش رو بگیره
const redirectByRole: Record<string, string> = {
  admin: "/admin/dashboard",
  manager: "/admin/dashboard",
  barber: "/barber/dashboard",
  customer: "/customer/dashboard",
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    try {
      const user = await login(values.mobile, values.password);
      toast.success("ورود با موفقیت انجام شد");
      router.push(redirectByRole[user.role] ?? "/");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(
          err.status === 401
            ? "شماره موبایل یا رمز عبور اشتباه است"
            : err.message
        );
      } else {
        toast.error("مشکلی پیش آمد، دوباره تلاش کنید");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-6 p-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-xl font-bold">ورود به حساب کاربری</h1>
            <p className="text-sm text-muted-foreground">
              برای مدیریت نوبت‌های خود وارد شوید
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="mobile">شماره موبایل</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="09123456789"
                  className="pr-9 text-left"
                  {...register("mobile")}
                />
              </div>
              {errors.mobile && (
                <span className="text-xs text-destructive">
                  {errors.mobile.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">رمز عبور</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  placeholder="••••••••"
                  className="pl-9 pr-9 text-left"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-xs text-destructive">
                  {errors.password.message}
                </span>
              )}
            </div>

            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "در حال ورود..." : "ورود"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            حساب کاربری ندارید؟{" "}
            <Link href="/register" className="text-primary hover:underline">
              ثبت‌نام کنید
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}