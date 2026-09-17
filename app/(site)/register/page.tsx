"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Phone, Lock, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

const registerSchema = z
  .object({
    name: z.string().min(2, "نام را وارد کنید"),
    mobile: z
      .string()
      .min(1, "شماره موبایل را وارد کنید")
      .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست (مثال: 09123456789)"),
    password: z.string().min(4, "رمز عبور باید حداقل ۴ کاراکتر باشد"),
    confirmPassword: z.string().min(4, "تکرار رمز عبور را وارد کنید"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمز عبور و تکرار آن یکسان نیستند",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterFormValues) {
    setIsSubmitting(true);
    try {
      await registerUser(values.name, values.mobile, values.password);
      toast.success("ثبت‌نام با موفقیت انجام شد");
      router.push("/customer/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError("mobile", { message: "این شماره موبایل قبلاً ثبت شده است" });
        } else {
          toast.error(err.message);
        }
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
            <h1 className="text-xl font-bold">ساخت حساب کاربری</h1>
            <p className="text-sm text-muted-foreground">
              برای رزرو نوبت ثبت‌نام کنید
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">نام و نام خانوادگی</Label>
              <div className="relative">
                <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="نام شما"
                  className="pr-9"
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <span className="text-xs text-destructive">
                  {errors.name.message}
                </span>
              )}
            </div>

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

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">تکرار رمز عبور</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  dir="ltr"
                  placeholder="••••••••"
                  className="pl-9 pr-9 text-left"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? "مخفی کردن رمز" : "نمایش رمز"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>

            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "در حال ثبت‌نام..." : "ثبت‌نام"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            حساب کاربری دارید؟{" "}
            <Link href="/login" className="text-primary hover:underline">
              وارد شوید
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}