import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Diamond,
  Heart,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { services } from "@/lib/data/services";

const stats = [
  { value: "+۱۲", label: "سال سابقه" },
  { value: "+۴۰۰۰", label: "مشتری راضی" },
  { value: "۶", label: "آرایشگر متخصص" },
];

const features = [
  {
    title: "آرایشگران متخصص",
    description: "متخصصانی باتجربه و حرفه‌ای",
    icon: Diamond,
  },
  {
    title: "محیط تمیز و امن",
    description: "ابزارهای بهداشتی و محیطی آرام",
    icon: Heart,
  },
  {
    title: "رزرو آسان",
    description: "رزرو آنلاین بدون انتظار",
    icon: Clock3,
  },
];

const heroFeatures = [
  {
    title: "آرایشگران",
    subtitle: "حرفه‌ای",
    icon: ShieldCheck,
  },
  {
    title: "محصولات",
    subtitle: "با کیفیت",
    icon: Clock3,
  },
  {
    title: "فضایی",
    subtitle: "آرام و مدرن",
    icon: Star,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#071514] text-foreground">

      {/* ========================================
          Background Glow
      ======================================== */}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[35%] top-[-250px] h-[650px] w-[650px] rounded-full bg-emerald-400/[0.035] blur-[140px]" />

        <div className="absolute right-[-150px] top-[350px] h-[600px] w-[600px] rounded-full bg-violet-600/[0.035] blur-[150px]" />

        <div className="absolute left-[-200px] top-[900px] h-[500px] w-[500px] rounded-full bg-emerald-500/[0.025] blur-[140px]" />
      </div>

      {/* ========================================
          HERO
      ======================================== */}

      <section className="relative overflow-hidden border-b border-white/[0.045]">

        {/* Decorative Neon Lines */}

        <div className="pointer-events-none absolute -right-[180px] -top-[80px] hidden h-[650px] w-[850px] md:block">

          <div className="absolute right-0 top-0 h-[600px] w-[800px] rounded-[48%] border border-violet-500/20 rotate-[-24deg]" />

          <div className="absolute right-[35px] top-[30px] h-[550px] w-[750px] rounded-[48%] border border-violet-500/25 rotate-[-24deg]" />

          <div className="absolute right-[70px] top-[60px] h-[500px] w-[700px] rounded-[48%] border border-emerald-400/25 rotate-[-24deg]" />

          <div className="absolute right-[105px] top-[90px] h-[450px] w-[650px] rounded-[48%] border border-emerald-400/40 rotate-[-24deg]" />

          <div className="absolute right-[140px] top-[120px] h-[400px] w-[600px] rounded-[48%] border border-emerald-300/70 rotate-[-24deg] shadow-[0_0_30px_rgba(52,211,153,0.12)]" />

          <div className="absolute right-[320px] top-[280px] h-32 w-32 rounded-full bg-emerald-400/[0.06] blur-3xl" />

        </div>

        <div className="container relative flex min-h-[520px] items-center py-20">

          <div className="max-w-[600px]">

            <p className="mb-5 text-[11px] font-bold tracking-[0.3em] text-primary">
              سالن تخصصی آرایش مردانه
            </p>

            <h1 className="text-5xl font-extrabold leading-[1.15] tracking-tight sm:text-6xl">

              ظاهر خوب،

              <br />

              <span className="bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent">
                حس بهتر
              </span>

            </h1>

            <p className="mt-6 max-w-[480px] text-base leading-8 text-muted-foreground">
              از اصلاح مو تا مراقبت و استایل شخصی؛
              همه‌چیز با دقت و مهارت آرایشگران حرفه‌ای
              برای تجربه‌ای متفاوت.
            </p>

            {/* CTA */}

            <div className="mt-8 flex flex-wrap items-center gap-4">

              <Button
                size="lg"
                asChild
                className="group rounded-full bg-gradient-to-l from-emerald-300 to-emerald-400 px-6 text-[#03100d] hover:shadow-[0_0_35px_rgba(52,211,153,0.18)]"
              >
                <Link href="/booking">
                  رزرو آنلاین نوبت

                  <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/10 transition group-hover:-translate-x-1">
                    <ArrowLeft className="h-4 w-4" />
                  </span>
                </Link>
              </Button>

              <Link
                href="#services"
                className="group flex items-center gap-3 text-sm text-muted-foreground transition hover:text-primary"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/50 text-primary">
                  <ArrowLeft className="h-4 w-4" />
                </span>

                مشاهده خدمات
              </Link>

            </div>

            {/* Hero Features */}

            <div className="mt-12 flex flex-wrap gap-0">

              {heroFeatures.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 border-l border-white/10 px-6 first:pr-0 last:border-l-0"
                  >
                    <Icon
                      className="h-5 w-5 text-primary"
                      strokeWidth={1.5}
                    />

                    <div className="text-xs leading-5 text-muted-foreground">
                      <div>{item.title}</div>
                      <div>{item.subtitle}</div>
                    </div>
                  </div>
                );
              })}

            </div>

          </div>

        </div>

      </section>

      {/* ========================================
          STATS
      ======================================== */}

      <section className="border-b border-white/[0.045] bg-[#091817]">

        <div className="container grid grid-cols-3 divide-x divide-x-reverse divide-white/[0.06] py-9 text-center">

          {stats.map((stat) => (
            <div key={stat.label}>

              <div className="text-2xl font-bold text-primary md:text-3xl">
                {stat.value}
              </div>

              <div className="mt-1 text-xs text-muted-foreground md:text-sm">
                {stat.label}
              </div>

            </div>
          ))}

        </div>

      </section>

      {/* ========================================
          SERVICES
      ======================================== */}

      <section
        id="services"
        className="border-b border-white/[0.045] py-20"
      >

        <div className="container">

          <div className="mb-10 flex items-end justify-between">

            <div>

              <p className="mb-3 text-[10px] font-bold tracking-[0.3em] text-primary">
                خدمات ما
              </p>

              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                بیشتر از یک اصلاح ساده
              </h2>

              <p className="mt-3 max-w-[580px] text-sm leading-7 text-muted-foreground">
                از اصلاح‌های کلاسیک تا استایل‌های مدرن،
                خدمات کاملی برای آراستگی و ظاهر شما ارائه می‌دهیم.
              </p>

            </div>

            <Link
              href="#services"
              className="hidden items-center gap-3 text-xs font-medium text-primary sm:flex"
            >
              مشاهده همه خدمات

              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-primary">
                <ArrowLeft className="h-3.5 w-3.5" />
              </span>

            </Link>

          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {services.map((service, index) => (
              <Card
                key={service.title}
                className={`group relative overflow-hidden border-white/[0.08] bg-[#0a1b19]/80 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-[#0c201e] ${
                  service.featured
                    ? "ring-1 ring-primary/10"
                    : ""
                }`}
              >

                {service.featured && (
                  <span className="absolute right-5 top-4 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] text-primary">
                    محبوب‌ترین
                  </span>
                )}

                <CardContent className="relative flex min-h-[190px] flex-col gap-3 p-6">

                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-primary/15 bg-primary/[0.04] text-primary">
                    {index % 3 === 0 ? (
                      <Scissors className="h-6 w-6" strokeWidth={1.5} />
                    ) : index % 3 === 1 ? (
                      <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />
                    ) : (
                      <Sparkles className="h-6 w-6" strokeWidth={1.5} />
                    )}
                  </div>

                  <h3 className="text-base font-semibold">
                    {service.title}
                  </h3>

                  <p className="text-sm leading-6 text-muted-foreground">
                    {service.desc}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-3">

                    <span className="text-sm font-medium text-primary">
                      {service.price}
                    </span>

                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 text-primary transition group-hover:bg-primary group-hover:text-[#03100d]">
                      <ArrowLeft className="h-3 w-3" />
                    </span>

                  </div>

                </CardContent>

              </Card>
            ))}

          </div>

        </div>

      </section>

      {/* ========================================
          GALLERY
      ======================================== */}

      <section
        id="gallery"
        className="border-b border-white/[0.045] py-20"
      >

        <div className="container">

          <div className="mb-10">

            <p className="mb-3 text-[10px] font-bold tracking-[0.3em] text-primary">
              نمونه‌کارها
            </p>

            <h2 className="text-3xl font-bold md:text-4xl">
              سبک شما، امضای ما
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
              بخشی از استایل‌ها و خدماتی که توسط تیم ما اجرا شده است.
            </p>

          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="group relative aspect-square overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a1b19]"
              >

                <div className="absolute inset-0 flex items-center justify-center">

                  <Scissors
                    className="h-8 w-8 text-primary/20 transition duration-300 group-hover:scale-110 group-hover:text-primary/40"
                    strokeWidth={1}
                  />

                </div>

                <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-[#071514] to-transparent p-4 opacity-0 transition group-hover:opacity-100">

                  <span className="text-xs text-primary">
                    نمونه‌کار {index + 1}
                  </span>

                </div>

              </div>
            ))}

          </div>

        </div>

      </section>

      {/* ========================================
          ABOUT
      ======================================== */}

      <section
        id="about"
        className="border-b border-white/[0.045] py-20"
      >

        <div className="container">

          <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr]">

            {/* Text */}

            <div>

              <p className="mb-3 text-[10px] font-bold tracking-[0.3em] text-primary">
                درباره ما
              </p>

              <h2 className="max-w-[520px] text-3xl font-bold leading-tight md:text-4xl">

                با عشق ساخته شده،
                <br />
                با سبک متمایز شده.

              </h2>

              <p className="mt-5 max-w-[560px] text-sm leading-7 text-muted-foreground">
                سالن ما فقط یک آرایشگاه نیست؛
                فضایی است برای مردانی که به ظاهر،
                استایل و کیفیت اهمیت می‌دهند.
                تیم ما با ترکیب تکنیک‌های کلاسیک و مدرن،
                بهترین تجربه را برای شما ایجاد می‌کند.
              </p>

              <Link
                href="#about"
                className="group mt-7 inline-flex items-center gap-3 rounded-full border border-primary/60 px-5 py-2.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-[#03100d]"
              >
                بیشتر درباره ما

                <ArrowLeft
                  className="h-4 w-4 transition group-hover:-translate-x-1"
                />

              </Link>

            </div>

            {/* Features */}

            <div className="space-y-3">

              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="flex items-center gap-4 rounded-xl border border-white/[0.07] bg-[#0a1b19]/70 p-4"
                  >

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.015]">

                      <Icon
                        className="h-5 w-5 text-primary"
                        strokeWidth={1.5}
                      />

                    </div>

                    <div>

                      <h3 className="text-sm font-semibold">
                        {feature.title}
                      </h3>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {feature.description}
                      </p>

                    </div>

                  </div>
                );
              })}

            </div>

          </div>

          {/* Style Card */}

          <div className="relative mt-12 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a1b19] px-8 py-10 sm:px-12">

            {/* Neon decorative lines */}

            <div className="pointer-events-none absolute -left-20 -top-24 h-[350px] w-[500px] opacity-50">

              <div className="absolute h-full w-full rounded-[50%] border border-violet-500/30 rotate-[-25deg]" />

              <div className="absolute left-8 h-full w-full rounded-[50%] border border-emerald-400/30 rotate-[-25deg]" />

              <div className="absolute left-16 h-full w-full rounded-[50%] border border-violet-500/40 rotate-[-25deg]" />

            </div>

            <div className="relative">

              <p className="text-[10px] font-bold tracking-[0.4em] text-primary">
                فقط یک اصلاح نیست
              </p>

              <p className="mt-1 text-[10px] font-bold tracking-[0.4em] text-primary">
                یک استایل است
              </p>

              <h3 className="mt-5 text-3xl font-bold leading-tight tracking-wide">
                استایل شما
                <br />
                امضای شماست
              </h3>

              <div className="mt-5 h-[2px] w-12 bg-primary" />

            </div>

          </div>

        </div>

      </section>

      {/* ========================================
          CTA
      ======================================== */}

      <section
        id="contact"
        className="py-8"
      >

        <div className="container">

          <div className="flex flex-col items-start gap-5 rounded-2xl border border-primary/20 bg-primary/[0.025] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20">

                <CalendarDays
                  className="h-6 w-6 text-primary"
                  strokeWidth={1.5}
                />

              </div>

              <div>

                <h3 className="text-sm font-semibold">
                  آماده یک تغییر تازه هستید؟
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  همین حالا نوبت خود را رزرو کنید.
                </p>

              </div>

            </div>

            <Button
              asChild
              className="group shrink-0 rounded-full bg-gradient-to-l from-emerald-300 to-emerald-400 px-6 text-xs font-bold text-[#03100d]"
            >

              <Link href="/booking">

                رزرو نوبت

                <ArrowLeft className="mr-3 h-4 w-4 transition group-hover:-translate-x-1" />

              </Link>

            </Button>

          </div>

        </div>

      </section>

      {/* ========================================
          FOOTER
      ======================================== */}

      <footer className="border-t border-white/[0.05]">

        <div className="container flex flex-col items-center justify-between gap-5 py-7 text-sm md:flex-row">

          <span className="font-bold text-foreground">
            سالن <span className="text-primary">آرایش</span>
          </span>

          <nav className="flex gap-6 text-xs text-muted-foreground">

            <a href="#" className="transition hover:text-primary">
              خانه
            </a>

            <a href="#services" className="transition hover:text-primary">
              خدمات
            </a>

            <a href="#about" className="transition hover:text-primary">
              درباره ما
            </a>

            <a href="#gallery" className="transition hover:text-primary">
              نمونه‌کارها
            </a>

            <a href="#contact" className="transition hover:text-primary">
              تماس
            </a>

          </nav>

          <div className="text-xs text-muted-foreground">
            © تمامی حقوق محفوظ است.
          </div>

        </div>

      </footer>

    </main>
  );
}