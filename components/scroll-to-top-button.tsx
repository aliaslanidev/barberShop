"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="بازگشت به بالا"
      className={`
        fixed
        bottom-[calc(4.25rem+env(safe-area-inset-bottom)+1rem)] md:bottom-6
        left-6
        z-50
        flex
        h-11
        w-11
        items-center
        justify-center
        rounded-full
        border
        border-purple
        bg-purple
        text-white
        shadow-lg
        transition-all
        duration-300
        hover:-translate-y-1 hover:brightness-110
        ${isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}
      `}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2} />
    </button>
  );
}