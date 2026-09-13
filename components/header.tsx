"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
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
    <header className="border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <span className="text-lg font-bold text-primary">سالن آرایش</span>

        {/* ناوبری دسکتاپ */}
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button size="sm" className="hidden sm:inline-flex">
            رزرو نوبت
          </Button>

          {/* دکمه همبرگر - فقط موبایل */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground md:hidden"
            aria-label={isMenuOpen ? "بستن منو" : "باز کردن منو"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* منوی موبایل */}
      {isMenuOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <nav className="container flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <Button size="sm" className="mt-2 w-full" onClick={() => setIsMenuOpen(false)}>
              رزرو نوبت
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}