import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],

  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],

  theme: {
    container: {
      center: true,

      padding: "1.5rem",

      screens: {
        "2xl": "1200px",
      },
    },

    extend: {
      /* ========================================
         Typography
      ======================================== */

      fontFamily: {
        sans: [
          "var(--font-yekan-bakh)",
          "Tahoma",
          "sans-serif",
        ],
      },

      /* ========================================
         Colors
      ======================================== */

      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },

        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // اضافه شد — SelectContent/PopoverContent/DropdownMenuContent
        // و هر کامپوننت دیگه‌ای که از کلاس bg-popover استفاده می‌کنه
        // بدون این mapping اصلاً رنگی نمی‌گیره (کلاس نامعتبر و بی‌اثر می‌مونه)
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        purple: "#b515f3",
        rust: "#d16427",
        violet: "#6e3094",
      },

      /* ========================================
         Border Radius
      ======================================== */

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },

  plugins: [require("tailwindcss-animate")],
};

export default config;