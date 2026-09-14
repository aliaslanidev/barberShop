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
      viewBox="0 0 1100 700"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      <defs>
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
          // فاصله بین خطوط
          const spacing = 30;

          // فاصله عمودی
          const y = index * spacing;

          // فاصله افقی
          const x = index * spacing;

          const radius = 70;

          const opacity = 0.85 - index * 0.065;

          const strokeWidth =
            index === 0 ? 2.2 : 1.35;

          return (
            <path
              key={index}
              d={`
                M ${760 + x} ${80 + y}

                L ${760 + x} ${300 + y}

                Q ${760 + x} ${370 + y}
                  ${690 + x} ${370 + y}

                L ${40 + x} ${370 + y}
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