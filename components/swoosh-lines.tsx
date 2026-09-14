import { useId } from "react";

type SwooshLinesProps = {
  className?: string;
  rings?: number;
};

export function SwooshLines({
  className,
  rings = 9,
}: SwooshLinesProps) {
  const uid = useId();

  const gradientId = `swoosh-gradient-${uid}`;
  const glowId = `swoosh-glow-${uid}`;

  const lines = Array.from({ length: rings }, (_, i) => i);

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
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor="hsl(var(--primary))"
            stopOpacity="0.05"
          />

          <stop
            offset="18%"
            stopColor="hsl(var(--primary))"
            stopOpacity="0.65"
          />

          <stop
            offset="48%"
            stopColor="hsl(var(--primary))"
            stopOpacity="0.95"
          />

          <stop
            offset="78%"
            stopColor="hsl(var(--accent))"
            stopOpacity="0.8"
          />

          <stop
            offset="100%"
            stopColor="hsl(var(--accent))"
            stopOpacity="0.05"
          />
        </linearGradient>

        {/* =====================================================
            Glow
        ====================================================== */}
        <filter
          id={glowId}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feGaussianBlur
            stdDeviation="3"
            result="blur"
          />

          <feMerge>
            <feMergeNode
              in="blur"
              opacity="0.5"
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
      >
        {lines.map((index) => {
          /*
           * فاصله بین ۹ خط
           */
          const spacing = 30;

          /*
           * فاصله عمودی ابتدای خطوط
           */
          const y = index * spacing;

          /*
           * فاصله افقی خطوط
           */
          const x = index * spacing;

          /*
           * نقطه شروع از بالای صفحه
           */
          const startX = 760 + x;
          const startY = 20 + y;

          /*
           * انتهای بخش عمودی اول
           */
          const firstDownY = 280 + y;

          /*
           * ارتفاع مسیر افقی
           */
          const horizontalY = 350 + y;

          /*
           * محل خط در سمت چپ
           */
          const leftX = 40 + x;

          /*
           * شعاع گوشه‌ها
           */
          const radius = 70;

          /*
           * تا پایین صفحه ادامه پیدا می‌کند
           */
          const bottomY = 1380;

          /*
           * شفافیت هر خط
           */
          const opacity = 0.85 - index * 0.065;

          /*
           * ضخامت خط اول کمی بیشتر
           */
          const strokeWidth =
            index === 0 ? 2.2 : 1.35;

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
