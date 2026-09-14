import { SwooshLines } from "./swoosh-lines";

export function HeroGlow() {
  return (
    <div
      aria-hidden="true"
      className="
        pointer-events-none
        absolute
        inset-0
        hidden
        overflow-hidden
        md:block
      "
    >
      {/* Glow مرکزی */}
      <div
        className="
          absolute
          left-1/2
          top-1/2
          h-[420px]
          w-[420px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-accent/15
          blur-[120px]
        "
      />

      {/* Glow دوم */}
      <div
        className="
          absolute
          left-[42%]
          top-[55%]
          h-[300px]
          w-[300px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-primary/10
          blur-[110px]
        "
      />

      {/* Pattern */}
      <div
        className="
          absolute
          left-1/2
          top-1/2
          h-[700px]
          w-[1100px]
          -translate-x-1/2
          -translate-y-1/2
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