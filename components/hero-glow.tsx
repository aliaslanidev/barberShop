import { SwooshLines } from "./swoosh-lines";

export function HeroGlow() {
  return (
    <div
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
        />
      </div>
    </div>
  );
}
