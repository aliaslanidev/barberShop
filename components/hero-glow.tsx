"use client";

import { useEffect, useRef, useState } from "react";

import { SwooshLines } from "./swoosh-lines";

export function HeroGlow() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mouse, setMouse] = useState({
    x: 0,
    y: 0,
  });

  const rafRef = useRef<number | null>(null);

  const latestMouse = useRef({
    x: 0,
    y: 0,
  });

  /*
   * =====================================================
   * DESKTOP DETECTION
   * =====================================================
   *
   * فقط Desktop واقعی:
   *
   * min-width: 768px
   * hover: hover
   * pointer: fine
   *
   * موبایل و PWA موبایل:
   * بدون انیمیشن
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(min-width: 768px) and (hover: hover) and (pointer: fine)"
    );

    const updateDeviceType = () => {
      setIsDesktop(mediaQuery.matches);
    };

    updateDeviceType();

    mediaQuery.addEventListener(
      "change",
      updateDeviceType
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        updateDeviceType
      );
    };
  }, []);

  /*
   * =====================================================
   * SCROLL
   * =====================================================
   */

  useEffect(() => {
    if (!isDesktop) {
      setScrollY(0);
      return;
    }

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, [isDesktop]);

  /*
   * =====================================================
   * MOUSE
   * =====================================================
   */

  useEffect(() => {
    if (!isDesktop) {
      setMouse({
        x: 0,
        y: 0,
      });

      return;
    }

    const handleMouseMove = (
      e: MouseEvent
    ) => {
      const {
        innerWidth,
        innerHeight,
      } = window;

      latestMouse.current = {
        x:
          (e.clientX / innerWidth) *
            2 -
          1,

        y:
          (e.clientY / innerHeight) *
            2 -
          1,
      };

      /*
       * فقط یک state update در هر frame
       */
      if (rafRef.current === null) {
        rafRef.current =
          requestAnimationFrame(() => {
            setMouse(
              latestMouse.current
            );

            rafRef.current = null;
          });
      }
    };

    window.addEventListener(
      "mousemove",
      handleMouseMove,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      if (rafRef.current !== null) {
        cancelAnimationFrame(
          rafRef.current
        );

        rafRef.current = null;
      }
    };
  }, [isDesktop]);

  /*
   * =====================================================
   * ANIMATION VALUES
   * =====================================================
   *
   * Desktop:
   * مقدار واقعی Mouse + Scroll
   *
   * Mobile:
   * همه چیز صفر
   */
  const animationScrollY =
    isDesktop
      ? scrollY
      : 0;

  const animationMouseX =
    isDesktop
      ? mouse.x
      : 0;

  const animationMouseY =
    isDesktop
      ? mouse.y
      : 0;

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
          MAIN ATMOSPHERIC GLOW
      ====================================================== */}

      <div
        className="
          absolute
          left-1/2
          top-[250px]

          h-[300px]
          w-[300px]

          -translate-x-1/2
          -translate-y-1/2

          rounded-full

          bg-accent/10
          blur-[100px]

          md:h-[480px]
          md:w-[480px]

          md:bg-accent/14
          md:blur-[140px]
        "
        style={{
          transform: `
            translate(
              calc(
                -50% +
                ${animationMouseX * 24}px
              ),
              calc(
                -50% +
                ${
                  animationScrollY *
                    0.08 +
                  animationMouseY *
                    22
                }px
              )
            )
          `,

          transition:
            "transform 0.45s cubic-bezier(.22,1,.36,1)",
        }}
      />

      {/* =====================================================
          SECOND GREEN GLOW
      ====================================================== */}

      <div
        className="
          absolute

          left-[34%]
          top-[430px]

          h-[220px]
          w-[220px]

          -translate-x-1/2
          -translate-y-1/2

          rounded-full

          bg-primary/8
          blur-[90px]

          md:h-[360px]
          md:w-[360px]

          md:bg-primary/10
          md:blur-[125px]
        "
        style={{
          transform: `
            translate(
              calc(
                -50% +
                ${animationMouseX * -18}px
              ),
              calc(
                -50% +
                ${
                  animationScrollY *
                    0.12 +
                  animationMouseY *
                    -18
                }px
              )
            )
          `,

          transition:
            "transform 0.55s cubic-bezier(.22,1,.36,1)",
        }}
      />

      {/* =====================================================
          THIRD SUBTLE GLOW
      ====================================================== */}

      <div
        className="
          absolute

          left-[68%]
          top-[580px]

          h-[180px]
          w-[180px]

          -translate-x-1/2
          -translate-y-1/2

          rounded-full

          bg-primary/5
          blur-[85px]

          md:h-[300px]
          md:w-[300px]

          md:bg-accent/6
          md:blur-[120px]
        "
        style={{
          transform: `
            translate(
              calc(
                -50% +
                ${animationMouseX * 12}px
              ),
              calc(
                -50% +
                ${
                  animationScrollY *
                    0.1 +
                  animationMouseY * 14
                }px
              )
            )
          `,

          transition:
            "transform 0.65s cubic-bezier(.22,1,.36,1)",
        }}
      />

      {/* =====================================================
          FLOWING LINES
      ====================================================== */}

      <div
        className="
          absolute
          left-1/2
          top-0

          h-full
          w-[900px]

          -translate-x-1/2

          md:w-[1250px]

          lg:w-[1450px]
        "
      >
        <SwooshLines
          className="
            h-full
            w-full
          "
          rings={7}
          scrollY={
            animationScrollY
          }
          mouseX={
            animationMouseX
          }
          mouseY={
            animationMouseY
          }
        />
      </div>

      {/* =====================================================
          VERY SUBTLE VIGNETTE
      ====================================================== */}

      <div
        className="
          absolute
          inset-0

          bg-[radial-gradient(
            ellipse_at_center,
            transparent_20%,
            hsl(var(--background)/0.18)_70%,
            hsl(var(--background)/0.55)_100%
          )]
        "
      />
    </div>
  );
}