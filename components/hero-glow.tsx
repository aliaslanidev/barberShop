"use client";

import { useEffect, useRef, useState } from "react";

import { SwooshLines } from "./swoosh-lines";

export function HeroGlow() {
  const [scrollY, setScrollY] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 }); // بازه -1 تا 1
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;

      /*
       * نرمال‌سازی موقعیت ماوس نسبت به کل صفحه، بازه -1 تا 1
       */
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = (e.clientY / innerHeight) * 2 - 1;

      setMouse({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="
        pointer-events-none
        absolute
        inset-0
        z-0
        overflow-hidden
      "
    >
      {/* =====================================================
          Central Glow
      ====================================================== */}

      <div
        className="
          absolute
          left-1/2
          top-[260px]
          h-[260px]
          w-[260px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-accent/10
          blur-[90px]

          md:top-[260px]
          md:h-[420px]
          md:w-[420px]
          md:bg-accent/15
          md:blur-[120px]
        "
        style={{
          transform: `translate(calc(-50% + ${mouse.x * 20}px), calc(-50% + ${
            scrollY * 0.15 + mouse.y * 20
          }px))`,
          transition: "transform 0.3s ease-out",
        }}
      />

      {/* =====================================================
          Second Glow
      ====================================================== */}

      <div
        className="
          absolute
          left-[42%]
          top-[380px]
          h-[200px]
          w-[200px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-primary/8
          blur-[80px]

          md:h-[300px]
          md:w-[300px]
          md:bg-primary/10
          md:blur-[110px]
        "
        style={{
          transform: `translate(calc(-50% + ${mouse.x * -15}px), calc(-50% + ${
            scrollY * 0.25 + mouse.y * -15
          }px))`,
          transition: "transform 0.35s ease-out",
        }}
      />

      {/* =====================================================
          Swoosh Lines
      ====================================================== */}

      <div
        className="
          absolute
          left-1/2
          top-0
          h-full
          w-[700px]
          -translate-x-1/2

          md:w-[1100px]
        "
      >
        <SwooshLines
          className="h-full w-full"
          rings={9}
          mouseX={mouse.x}
          mouseY={mouse.y}
        />
      </div>
    </div>
  );
}