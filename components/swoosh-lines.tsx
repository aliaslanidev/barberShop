"use client";

import { useId } from "react";

type SwooshLinesProps = {
  className?: string;
  rings?: number;
  scrollY?: number;
};

export function SwooshLines({
  className,
  rings = 9,
  scrollY = 0,
}: SwooshLinesProps) {
  const uid = useId();

  const gradientId = `swoosh-gradient-${uid}`;
  const glowId = `swoosh-glow-${uid}`;

  const lines = Array.from({ length: rings }, (_, i) => i);

  /*
   * پیشرفت اسکرول رو به یک بازه محدود (مثلاً 0 تا 1) نگاشت می‌کنیم
   * تا گرادیانت بی‌نهایت رد نشه و رفت‌وبرگشتی حرکت کنه
   */
  const cycle = 900; // هر چند پیکسل اسکرول یک چرخه کامل
  const raw = (scrollY % cycle) / cycle; // 0 -> 1
  const progress =
    raw < 0.5 ? raw * 2 : (1 - raw) * 2; // رفت و برگشت (0 -> 1 -> 0)

  /*
   * جابه‌جایی افقی گرادیانت بین ۰٪ تا ۴۰٪
   */
  const shift = progress * 40;

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
          style={{ transition: "x1 0.2s linear, x2 0.2s linear" }}
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
          transform: `translateY(${scrollY * 0.08}px)`,
          transition: "transform 0.1s linear",
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