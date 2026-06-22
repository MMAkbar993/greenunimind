/* eslint-disable @typescript-eslint/no-require-imports */
import type { Config } from "tailwindcss";
import * as defaultTheme from "tailwindcss/defaultTheme";
import tailwindcssAnimate = require("tailwindcss-animate");

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        figtree: ["Figtree", ...defaultTheme.fontFamily.sans],
        sans: ["DM Sans", ...defaultTheme.fontFamily.sans],
      },
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
        green: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#10B981", // Primary green theme
          700: "#059669",
          800: "#047857",
          900: "#064E3B",
          950: "#022C22",
        },
        // Green Uni Mind Brand Colors (from homepage)
        brand: {
          primary: "#22C55E", // green-500 - main brand color
          "primary-dark": "#059669", // green-700 - darker variant
          "primary-light": "#4ADE80", // green-400 - lighter variant
          secondary: "#10B981", // green-600 - secondary brand
          accent: "#DCFCE7", // green-100 - accent background
          success: "#22C55E",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
          text: {
            primary: "#1F2937", // gray-800
            secondary: "#4B5563", // gray-600
            muted: "#6B7280", // gray-500
          },
          background: {
            primary: "#FFFFFF", // white
            secondary: "#F9FAFB", // gray-50
            accent: "#F0FDF4", // green-50
          }
        },
        purple: {
          400: "#9b87f5",
          500: "#8A74F0",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "float-up-slow": {
          "0%": { transform: "translateY(0) rotate(0)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateY(-100vh) rotate(360deg)", opacity: "0" },
        },
        "float-up-medium": {
          "0%": { transform: "translateY(0) rotate(0)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateY(-100vh) rotate(-360deg)", opacity: "0" },
        },
        "float-up-fast": {
          "0%": { transform: "translateY(0) rotate(0)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateY(-100vh) rotate(720deg)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float-up-slow": "float-up-slow 8s ease-in-out infinite",
        "float-up-medium": "float-up-medium 6s ease-in-out infinite",
        "float-up-fast": "float-up-fast 4s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
