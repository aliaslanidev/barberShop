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
      >
        {lines.map((index) => {
          /*
           * فاصله بین خطوط
           */
          const spacing = 30;

          /*
           * فاصله عمودی
           */
          const y = index * spacing;

          /*
           * فاصله افقی
           */
          const x = index * spacing;

          /*
           * شروع از بالای صفحه
           */
          const startX = 760 + x;
          const startY = 20 + y;

          /*
           * پایان بخش عمودی اول
           */
          const firstDownY = 280 + y;

          /*
           * محل حرکت افقی
           */
          const horizontalY = 350 + y;

          /*
           * موقعیت خط در سمت چپ
           */
          const leftX = 40 + x;

          /*
           * شعاع خم
           */
          const radius = 70;

          /*
           * ادامه تا پایین صفحه
           */
          const bottomY = 1380;

          /*
           * شفافیت خطوط
           */
          const opacity = 0.85 - index * 0.065;

          /*
           * ضخامت
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
