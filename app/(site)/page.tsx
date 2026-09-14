import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { services } from "@/lib/data/services";
import { HeroGlow } from "@/components/hero-glow";

const stats = [
  {
    value: "+۱۲",
    label: "سال سابقه",
  },
  {
    value: "+۴۰۰۰",
    label: "مشتری راضی",
  },
  {
    value: "۶",
    label: "آرایشگر متخصص",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* =====================================================
          Hero
      ====================================================== */}
      <section className="relative overflow-hidden">
        {/* Decorative background */}
        <HeroGlow />

        {/* Hero content */}
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
            از اصلاح مو تا مراقبت پوست، همه‌چیز با دست استادکارانی که به جزئیات
            اهمیت می‌دهند.
          </p>

          <div className="mt-4 flex gap-4">
            <Button size="lg" asChild>
              <Link href="/booking">رزرو آنلاین نوبت</Link>
            </Button>

            <Button size="lg" variant="outline" asChild>
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
      <section id="services" className="container py-20">
        <h2
          className="
            mb-10
            text-2xl
            font-bold
            md:text-3xl
          "
        >
          خدمات سالن
        </h2>

        <div
          className="
            grid
            gap-5
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >
          {services.map((s) => (
            <Card
              key={s.title}
              className="
                relative
                transition-colors
                hover:border-primary/50
              "
            >
              {s.featured && (
                <span
                  className="
                    absolute
                    -top-2.5
                    right-6
                    rounded-full
                    bg-rust
                    px-3
                    py-0.5
                    text-xs
                    font-medium
                    text-white
                  "
                >
                  محبوب‌ترین
                </span>
              )}

              <CardContent
                className="
                  flex
                  flex-col
                  gap-3
                  p-6
                "
              >
                <h3 className="text-lg font-medium">{s.title}</h3>

                <p
                  className="
                    text-sm
                    leading-7
                    text-muted-foreground
                  "
                >
                  {s.desc}
                </p>

                <span
                  className="
                    mt-2
                    text-sm
                    text-mint
                  "
                >
                  {s.price}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* =====================================================
          Gallery
      ====================================================== */}
      <section id="gallery" className="container pb-20">
        <h2
          className="
            mb-10
            text-2xl
            font-bold
            md:text-3xl
          "
        >
          نمونه‌کارها
        </h2>

        <div
          className="
            grid
            grid-cols-2
            gap-4
            md:grid-cols-4
          "
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="
                flex
                aspect-square
                items-center
                justify-center
                rounded-lg
                border
                border-border
                bg-card
                text-sm
                text-muted-foreground
              "
            >
              تصویر {i + 1}
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
    border-t
    border-border
    bg-gradient-to-r
    from-[#071a16]
    via-[#120d1b]
    to-[#080909]
  "
      >
        <div
          className="
      container
      flex
      flex-col
      gap-4
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
            درباره سالن
          </h2>

          <p
            className="
        mx-auto
        max-w-xl
        leading-8
        text-muted-foreground
      "
          >
            سالن ما محلی برای مردانی است که به ظاهر خود اهمیت می‌دهند. تیم ما با
            سال‌ها تجربه، ترکیبی از تکنیک‌های کلاسیک و مدرن را برای رسیدن به
            بهترین نتیجه به کار می‌گیرد.
          </p>
        </div>
      </section>

      {/* =====================================================
          CTA
      ====================================================== */}
      <section
        id="contact"
        className="
          container
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

          <div className="flex gap-6">
            <span>اینستاگرام</span>
            <span>تلفن تماس</span>
            <span>آدرس</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
