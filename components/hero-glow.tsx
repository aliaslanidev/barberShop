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
        hidden
        overflow-hidden
        md:block
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
          h-[420px]
          w-[420px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-accent/15
          blur-[120px]
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
          h-[300px]
          w-[300px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-primary/10
          blur-[110px]
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
          w-[1100px]
          -translate-x-1/2
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
