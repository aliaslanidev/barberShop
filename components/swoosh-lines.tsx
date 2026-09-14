import { useId } from "react";

type SwooshLinesProps = {
  className?: string;
  /** تعداد خطوط تو در تو — بیشتر = پرتراکم‌تر */
  rings?: number;
};

/**
 * خطوط منحنی نئونی گرادیانی (سبز → بنفش) که هم پشت هیرو
 * و هم داخل کارت «IT'S YOUR STYLE» استفاده می‌شن.
 * از useId استفاده می‌کنه تا اگه چند بار تو صفحه رندر بشه،
 * آی‌دی گرادیان/فیلتر تداخل پیدا نکنه.
 */
export function SwooshLines({ className, rings = 6 }: SwooshLinesProps) {
  const uid = useId();
  const gradId = `swoosh-grad-${uid}`;
  const glowId = `swoosh-glow-${uid}`;
  const indices = Array.from({ length: rings }, (_, i) => i);

  return (
    <svg
      viewBox="0 0 900 620"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="55%" stopColor="hsl(var(--primary))" stopOpacity="0.85" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>

        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {indices.map((i) => (
        <path
          key={i}
          d="M810,55 C620,95 520,190 495,300 C520,410 630,490 850,545"
          transform={`translate(${i * 27} ${-i * 21})`}
          stroke={`url(#${gradId})`}
          strokeWidth={i === 0 ? 2.4 : 1.4}
          strokeOpacity={1 - i * 0.13}
          fill="none"
          strokeLinecap="round"
          filter={`url(#${glowId})`}
        />
      ))}
    </svg>
  );
}