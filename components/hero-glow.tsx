import { SwooshLines } from "./swoosh-lines";

export function HeroGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] overflow-hidden md:block"
    >
      {/* هاله‌ی بنفش گوشه‌ی بالا-راست، دقیقاً مثل عکس */}
      <div className="absolute -top-24 right-0 h-[420px] w-[420px] rounded-full bg-accent/25 blur-[110px]" />
      {/* هاله‌ی سبز کم‌رنگ سمت پایین-چپ همین ناحیه */}
      <div className="absolute bottom-10 left-10 h-[260px] w-[260px] rounded-full bg-primary/10 blur-[100px]" />

      <SwooshLines className="relative z-10 h-full w-full" rings={6} />
    </div>
  );
}