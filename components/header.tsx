"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Home, LogIn, Menu, Scissors, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "خدمات", href: "#services" },
  { label: "گالری", href: "#gallery" },
  { label: "درباره ما", href: "#about" },
  { label: "تماس", href: "#contact" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b border-white/[0.04] bg-[#020b0a] text-white">
      <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6">
        {/* لوگو */}
        <Link
          href="/"
          className="flex items-center gap-3"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="flex h-9 w-9 items-center justify-center text-emerald-400">
            <Scissors size={27} strokeWidth={1.8} />
          </div>

          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">
              سالن <span className="text-emerald-400">آرایش</span>
            </span>
          </div>
        </Link>

        {/* ناوبری دسکتاپ */}
        <nav className="hidden items-center gap-9 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative py-7 text-sm text-gray-400 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* اکشن‌های هدر */}
        <div className="flex items-center gap-3">
          {/* ورود */}
          <Button
            size="sm"
            variant="ghost"
            className="hidden h-10 rounded-full px-4 text-xs text-gray-400 hover:bg-white/[0.04] hover:text-white sm:inline-flex"
            asChild
          >
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              <span>ورود</span>
            </Link>
          </Button>

          {/* رزرو نوبت */}
          <Link
            href="/booking"
            className="hidden rounded-full bg-gradient-to-r from-emerald-300 to-emerald-400 px-6 py-2.5 text-xs font-bold text-[#02100d] transition hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(52,211,153,0.2)] sm:inline-flex"
          >
            رزرو نوبت
          </Link>

          {/* همبرگر موبایل */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] text-emerald-400 transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.04] md:hidden"
            aria-label={isMenuOpen ? "بستن منو" : "باز کردن منو"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* ================= منوی موبایل ================= */}
      {isMenuOpen && (
        <div className="border-t border-white/[0.05] bg-[#020b0a] md:hidden">
          <nav className="mx-auto flex max-w-[1200px] flex-col gap-1 px-6 py-5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-sm text-gray-400 transition hover:bg-white/[0.03] hover:text-emerald-400"
              >
                {link.label}
              </a>
            ))}

            <div className="my-2 h-px bg-white/[0.05]" />

            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-gray-400 transition hover:bg-white/[0.03] hover:text-white"
            >
              <Home className="h-4 w-4 text-emerald-400" />
              صفحه اصلی
            </Link>

            <Link
              href="/login"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-gray-400 transition hover:bg-white/[0.03] hover:text-white"
            >
              <LogIn className="h-4 w-4 text-emerald-400" />
              ورود
            </Link>

            <Link
              href="/booking"
              onClick={() => setIsMenuOpen(false)}
              className="mt-3 flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-emerald-300 to-emerald-400 px-6 py-3 text-sm font-bold text-[#02100d]"
            >
              رزرو نوبت
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
