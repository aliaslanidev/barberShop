import Image from "next/image";
import Link from "next/link";

import {
  Instagram,
  MapPin,
  Phone,
  Scissors,
  Sparkles,
  UserRound,
  Droplets,
  Brush,
  Crown,
  Quote,
  ShieldCheck,
  Sparkle,
  Timer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { services } from "@/lib/data/services";
import { HeroGlow } from "@/components/hero-glow";

import mullet from "../../public/images/mullet.png";
import buzzCut from "../../public/images/buzz-cut.png";
import classic from "../../public/images/classic.png";
import frenchCrop from "../../public/images/french-crop.jpg.png";
import sidePart from "../../public/images/side-part.png";

/* =====================================================
   Stats
===================================================== */

const stats = [
  {
    value: "۱۲+",
    label: "سال سابقه",
  },
  {
    value: "۴۰۰۰+",
    label: "مشتری راضی",
  },
  {
    value: "۶",
    label: "آرایشگر متخصص",
  },
];

/* =====================================================
   Gallery
===================================================== */

const galleryImages = [
  {
    src: mullet,
    name: "مولت",
  },
  {
    src: frenchCrop,
    name: "فرنچ کراپ",
  },
  {
    src: buzzCut,
    name: "بازکات",
  },
  {
    src: classic,
    name: "کلاسیک",
  },
  {
    src: sidePart,
    name: "ساید پارت",
  },
];

/* =====================================================
   Service Icons
===================================================== */

const serviceIcons = [Scissors, UserRound, Sparkles, Brush, Droplets, Crown];

/* =====================================================
   About Principles
===================================================== */

const principles = [
  {
    icon: Timer,
    title: "وقت‌شناسی",
    desc: "نوبت شما سر ساعت شروع می‌شود.",
  },
  {
    icon: ShieldCheck,
    title: "بهداشت کامل",
    desc: "ابزار استریل برای هر مشتری.",
  },
  {
    icon: Sparkle,
    title: "مشاوره رایگان",
    desc: "انتخاب مدل متناسب با فرم صورت.",
  },
];

/* =====================================================
   Home
===================================================== */

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* =====================================================
          Global Decorative Background
      ====================================================== */}

      <HeroGlow />

      {/* =====================================================
          All Page Content
      ====================================================== */}

      <div className="relative z-10">
        {/* =====================================================
            Hero
        ====================================================== */}

        <section className="relative overflow-hidden">
          <div
            className="
              container
              relative
              z-20
              flex
              flex-col
              items-center
              gap-6
              py-24
              text-center
            "
          >
            <span className="text-sm text-primary">
              تجربه‌ای متفاوت از آرایش مردانه
            </span>

            <h1
              className="
                max-w-2xl
                text-4xl
                font-bold
                leading-[1.5]
                md:text-5xl
              "
            >
              استایلی که مطمئن قدم برمی‌داری
            </h1>

            <p
              className="
                max-w-md
                leading-8
                text-muted-foreground
              "
            >
              از اصلاح مو تا مراقبت پوست، همه‌چیز با دست استادکارانی که به
              جزئیات اهمیت می‌دهند.
            </p>

            <div className="mt-4 flex gap-4">
              <Button size="lg" asChild>
                <Link href="/booking">رزرو آنلاین نوبت</Link>
              </Button>

              <Button
                size="lg"
                className="
                  border
                  border-rust
                  bg-rust
                  text-white
                  hover:bg-rust/90
                "
                asChild
              >
                <a href="#services">مشاهده خدمات</a>
              </Button>
            </div>
          </div>
        </section>

        {/* =====================================================
            Stats
        ====================================================== */}

        <section
          className="
            border-y
            border-border
            bg-gradient-to-l
            from-[#071a16]
            via-[#171022]
            to-[#090909]
          "
        >
          <div
            className="
              container
              grid
              grid-cols-3
              divide-x
              divide-x-reverse
              divide-primary/20
              py-10
              text-center
            "
          >
            {stats.map((s) => (
              <div key={s.label}>
                <div
                  className="
                    text-2xl
                    font-bold
                    text-primary
                    md:text-3xl
                  "
                >
                  {s.value}
                </div>

                <div
                  className="
                    mt-1
                    text-sm
                    text-muted-foreground
                  "
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================
            Services
        ====================================================== */}

        <section id="services" className="container scroll-mt-24 py-20">
          <h2 className="mb-10 inline-flex items-center gap-3">
            <span className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              خدمات سالن
            </span>
            <span className="h-px w-8 bg-primary" />
          </h2>

          <div
            className="
              grid
              gap-5
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            {services.map((s, index) => {
              const ServiceIcon = serviceIcons[index % serviceIcons.length];

              return (
                <Card
                  key={s.title}
                  className="
                    group
                    relative
                    flex
                    h-full
                    flex-col
                    border
                    border-primary/10
                    bg-[linear-gradient(135deg,hsl(150_12%_9%_/_0.95),hsl(150_8%_5%_/_0.98))]
                    shadow-[0_10px_35px_rgba(0,0,0,0.25)]
                    backdrop-blur-md
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:border-primary/30
                    hover:shadow-[0_15px_45px_rgba(79,240,174,0.08)]
                  "
                >
                  {/* Green Glow */}

                  <div
                    className="
                      pointer-events-none
                      absolute
                      -right-16
                      -top-16
                      h-32
                      w-32
                      rounded-full
                      bg-primary/10
                      blur-3xl
                    "
                  />

                  {/* Featured */}

                  {s.featured && (
                    <span
                      className="
                        absolute
                        -top-2.5
                        right-6
                        z-20
                        rounded-full
                        bg-rust
                        px-3
                        py-0.5
                        text-xs
                        font-medium
                        text-white
                        shadow-[0_4px_15px_rgba(0,0,0,0.3)]
                      "
                    >
                      محبوب‌ترین
                    </span>
                  )}

                  <CardContent
                    className="
                      relative
                      z-10
                      flex
                      h-full
                      flex-col
                      gap-3
                      p-6
                    "
                  >
                    {/* Title + Icon */}

                    <div
                      className="
                        flex
                        items-center
                        gap-3
                      "
                    >
                      <div
                        className="
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          border
                          border-primary/15
                          bg-primary/10
                          text-primary
                          transition-all
                          duration-300
                          group-hover:scale-105
                          group-hover:border-primary/30
                          group-hover:bg-primary/15
                        "
                      >
                        <ServiceIcon className="h-5 w-5" strokeWidth={1.8} />
                      </div>

                      <h3
                        className="
                          text-lg
                          font-medium
                          text-foreground
                        "
                      >
                        {s.title}
                      </h3>
                    </div>

                    {/* Description */}

                    <p
                      className="
                        text-sm
                        leading-7
                        text-muted-foreground
                      "
                    >
                      {s.desc}
                    </p>

                    {/* Price */}

                    <span
                      className="
                        mt-auto
                        pt-3
                        text-sm
                        font-semibold
                        text-primary
                      "
                    >
                      {s.price}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            Gallery
        ====================================================== */}

        <section id="gallery" className="container scroll-mt-24 pb-20">
          <h2 className="mb-10 inline-flex items-center gap-3">
            <span className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              گالری
            </span>
            <span className="h-px w-8 bg-primary" />
          </h2>

          <div
            className="
              grid
              grid-cols-5
              gap-4
            "
          >
            {galleryImages.map((image) => (
              <div
                key={image.name}
                className="
                  overflow-hidden
                  rounded-lg
                  bg-black
                "
              >
                <div
                  className="
                    relative
                    aspect-square
                    overflow-hidden
                  "
                >
                  <Image
                    src={image.src}
                    alt={image.name}
                    fill
                    className="
                      object-cover
                      transition-transform
                      duration-300
                      ease-out
                      hover:scale-110
                    "
                    sizes="20vw"
                  />
                </div>

                <div
                  className="
                    flex
                    h-11
                    items-center
                    justify-center
                    bg-black
                    text-sm
                    font-medium
                    text-white
                  "
                >
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================
    About
====================================================== */}

        <section
          id="about"
          className="
    relative
    overflow-hidden
    scroll-mt-24
    border-y
    border-border
    bg-[#070808]
  "
        >
          {/* Soft Glow */}

          <div
            className="
      pointer-events-none
      absolute
      left-[-10%]
      top-1/2
      h-[420px]
      w-[420px]
      -translate-y-1/2
      rounded-full
      bg-[radial-gradient(circle,hsl(158_87%_62%_/_0.10)_0%,transparent_70%)]
      blur-3xl
    "
          />

          <div
            className="
      container
      relative
      z-10
      flex
      flex-col
      gap-12
      py-24
    "
          >
            {/* ---------- Text ---------- */}

            <div className="flex flex-col gap-6">
              <h2 className="mb-10 inline-flex items-center gap-3">
                <span className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                  درباره ما
                </span>
                <span className="h-px w-8 bg-primary" />
              </h2>

              <h2
                className="
          max-w-2xl
          text-3xl
          font-bold
          leading-[1.6]
          md:text-4xl
        "
              >
                جایی که اصلاح مو،
                <span className="text-primary"> یک مهارت </span>
                است نه یک عادت
              </h2>

              <p
                className="
          max-w-xl
          leading-8
          text-muted-foreground
        "
              >
                دوازده سال است که پشت این صندلی‌ها ایستاده‌ایم. تیم ما تکنیک‌های
                کلاسیک را با نگاه امروزی ترکیب می‌کند تا نتیجه فقط در روز اول
                خوب نباشد؛ تا هفته‌ها فرم خودش را نگه دارد.
              </p>
            </div>

            {/* ---------- Principles Row ---------- */}

            <div
              className="
        grid
        gap-8
        border-t
        border-border
        pt-10
        sm:grid-cols-3
      "
            >
              {principles.map((p) => {
                const PrincipleIcon = p.icon;

                return (
                  <div key={p.title} className="flex flex-col gap-3">
                    <div
                      className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-lg
                border
                border-primary/15
                bg-primary/10
                text-primary
              "
                    >
                      <PrincipleIcon className="h-4 w-4" strokeWidth={1.8} />
                    </div>

                    <div className="font-medium">{p.title}</div>

                    <div className="text-sm leading-6 text-muted-foreground">
                      {p.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================
            CTA
        ====================================================== */}

        <section
          id="contact"
          className="
            container
            scroll-mt-24
            flex
            flex-col
            items-center
            gap-5
            py-20
            text-center
          "
        >
          <h2
            className="
              text-2xl
              font-bold
              md:text-3xl
            "
          >
            همین حالا نوبت بگیرید
          </h2>

          <p className="max-w-md text-muted-foreground">
            برای رزرو نوبت با ما تماس بگیرید یا از فرم رزرو آنلاین استفاده کنید.
          </p>

          <Button size="lg" asChild>
            <Link href="/booking">رزرو نوبت</Link>
          </Button>
        </section>

        {/* =====================================================
            Footer
        ====================================================== */}

        <footer className="border-t border-border">
          <div
            className="
              container
              flex
              flex-col
              items-center
              justify-between
              gap-4
              py-8
              text-sm
              text-muted-foreground
              md:flex-row
            "
          >
            <span>© تمامی حقوق محفوظ است.</span>

            <div
              className="
                flex
                flex-wrap
                items-center
                justify-center
                gap-6
              "
            >
              {/* Instagram */}

              <a
                href="#"
                className="
                  flex
                  items-center
                  gap-2
                  transition-colors
                  duration-200
                  hover:text-primary
                "
              >
                <Instagram className="h-4 w-4" strokeWidth={1.8} />

                <span>اینستاگرام</span>
              </a>

              {/* Phone */}

              <a
                href="tel:+989000000000"
                className="
                  flex
                  items-center
                  gap-2
                  transition-colors
                  duration-200
                  hover:text-primary
                "
              >
                <Phone className="h-4 w-4" strokeWidth={1.8} />

                <span>تلفن تماس</span>
              </a>

              {/* Address */}

              <a
                href="#"
                className="
                  flex
                  items-center
                  gap-2
                  transition-colors
                  duration-200
                  hover:text-primary
                "
              >
                <MapPin className="h-4 w-4" strokeWidth={1.8} />

                <span>آدرس</span>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
