import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#00E676",
          foreground: "#0F172A",
          50: "#E8FDF5",
          100: "#B9FCD7",
          200: "#8AFAB9",
          300: "#5BF89B",
          400: "#2CF67D",
          500: "#00E676",
          600: "#00B85E",
          700: "#008A46",
          800: "#005C2E",
          900: "#002E16",
        },
        secondary: {
          DEFAULT: "#2979FF",
          foreground: "#FFFFFF",
          50: "#EBF3FF",
          100: "#C2D9FF",
          200: "#99BFFF",
          300: "#70A5FF",
          400: "#478BFF",
          500: "#2979FF",
          600: "#1A5CCB",
          700: "#124097",
          800: "#0B2763",
          900: "#05102F",
        },
        accent: {
          DEFAULT: "#FFD700",
          foreground: "#0F172A",
          50: "#FFFBEB",
          100: "#FFF3C4",
          200: "#FFEB9D",
          300: "#FFE376",
          400: "#FFDB4F",
          500: "#FFD700",
          600: "#CCAC00",
          700: "#998100",
          800: "#665600",
          900: "#332B00",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: {
          DEFAULT: "#1E293B",
          light: "#334155",
          dark: "#0F172A",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 8px rgba(0, 230, 118, 0.4)",
          },
          "50%": {
            boxShadow: "0 0 20px rgba(0, 230, 118, 0.8)",
          },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-pitch":
          "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
