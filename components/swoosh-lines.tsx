"use client";

import { useId } from "react";

type SwooshLinesProps = {
  className?: string;
  rings?: number;
  scrollY?: number;
  mouseX?: number; // بازه -1 تا 1
  mouseY?: number; // بازه -1 تا 1
};

export function SwooshLines({
  className,
  rings = 9,
  scrollY = 0,
  mouseX = 0,
  mouseY = 0,
}: SwooshLinesProps) {
  const uid = useId();

  const gradientId = `swoosh-gradient-${uid}`;
  const glowId = `swoosh-glow-${uid}`;

  const lines = Array.from({ length: rings }, (_, i) => i);

  /*
   * بخش اسکرولی: یک رفت‌وبرگشت نرم بین ۰ تا ۱
   */
  const cycle = 900; // هر چند پیکسل اسکرول یک چرخه کامل
  const raw = (scrollY % cycle) / cycle;
  const scrollProgress = raw < 0.5 ? raw * 2 : (1 - raw) * 2;

  /*
   * بخش ماوس: از -1..1 به 0..1
   */
  const mouseProgress = (mouseX + 1) / 2;

  /*
   * ترکیب هر دو (وزن‌دهی قابل تنظیم) برای جابه‌جایی گرادیانت
   */
  const combinedProgress =
    scrollProgress * 0.5 + mouseProgress * 0.5;

  const shift = combinedProgress * 40; // بازه ۰ تا ۴۰٪

  /*
   * جابه‌جایی جزئی خود خط‌ها: اسکرول روی Y، ماوس روی X و Y
   */
  const translateX = mouseX * 10;
  const translateY = scrollY * 0.08 + mouseY * 14;

  return (
    <svg
      viewBox="0 0 1100 1400"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* =====================================================
            Gradient
        ====================================================== */}

        <linearGradient
          id={gradientId}
          x1={`${0 + shift}%`}
          y1="0%"
          x2={`${100 + shift}%`}
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor="hsl(var(--primary))"
            stopOpacity="0.04"
          />

          <stop
            offset="18%"
            stopColor="hsl(var(--primary))"
            stopOpacity="0.55"
          />

          <stop
            offset="48%"
            stopColor="hsl(var(--primary))"
            stopOpacity="0.9"
          />

          <stop
            offset="78%"
            stopColor="hsl(var(--accent))"
            stopOpacity="0.7"
          />

          <stop
            offset="100%"
            stopColor="hsl(var(--accent))"
            stopOpacity="0.03"
          />
        </linearGradient>

        {/* =====================================================
            Glow
        ====================================================== */}

        <filter
          id={glowId}
          x="-30%"
          y="-20%"
          width="160%"
          height="140%"
        >
          <feGaussianBlur
            stdDeviation="2.5"
            result="blur"
          />

          <feMerge>
            <feMergeNode
              in="blur"
              opacity="0.45"
            />

            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
        style={{
          transform: `translate(${translateX}px, ${translateY}px)`,
          transition: "transform 0.2s ease-out",
        }}
      >
        {lines.map((index) => {
          const spacing = 30;
          const y = index * spacing;
          const x = index * spacing;

          const startX = 760 + x;
          const startY = 20 + y;
          const firstDownY = 280 + y;
          const horizontalY = 350 + y;
          const leftX = 40 + x;
          const radius = 70;
          const bottomY = 1380;

          const opacity = 0.85 - index * 0.065;
          const strokeWidth = index === 0 ? 2.2 : 1.35;

          return (
            <path
              key={index}
              d={`
                M ${startX} ${startY}

                L ${startX} ${firstDownY}

                Q ${startX} ${horizontalY}
                  ${startX - radius} ${horizontalY}

                L ${leftX + radius} ${horizontalY}

                Q ${leftX} ${horizontalY}
                  ${leftX} ${horizontalY + radius}

                L ${leftX} ${bottomY}
              `}
              strokeWidth={strokeWidth}
              strokeOpacity={opacity}
            />
          );
        })}
      </g>
    </svg>
  );
}