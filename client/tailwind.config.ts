import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Light-first SaaS system colors
        surface: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
          950: "#020617",
        },
        // Dedicated dark tokens for workflow canvas / technical panels
        dark: {
          950: "#06090e",
          900: "#0a0f1d",
          850: "#0f1629",
          800: "#131b2e",
          750: "#18223a",
          700: "#1e293b",
          600: "#334155",
        },
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
          glow: "rgba(37, 99, 235, 0.15)",
        },
        accent: {
          violet: "#8b5cf6",
          cyan: "#06b6d4",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#ef4444",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-glow": "pulseGlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2s linear infinite",
        "flow-dash": "flowDash 1.5s linear infinite",
        "float": "float 5s ease-in-out infinite",
        "glow-soft": "glowSoft 2.5s ease-in-out infinite",
        "fade-up": "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-up-d1": "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards",
        "fade-up-d2": "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards",
        "fade-up-d3": "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards",
        "fade-up-d4": "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards",
        "fade-up-d5": "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards",
        "gradient-shift": "gradientShift 6s ease infinite",
        "float-slow": "floatSlow 8s ease-in-out infinite",
        "float-slower": "floatSlow 12s ease-in-out infinite",
        "glow-cycle": "glowCycle 3s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "typing-cursor": "typingCursor 1s step-end infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 15px 2px rgba(37, 99, 235, 0.25)" },
          "50%": { opacity: "0.85", boxShadow: "0 0 25px 4px rgba(79, 70, 229, 0.15)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        flowDash: {
          "to": { strokeDashoffset: "-20" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
        glowSoft: {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 6px rgba(37, 99, 235, 0.3))" },
          "50%": { opacity: "0.8", filter: "drop-shadow(0 0 12px rgba(79, 70, 229, 0.4))" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "33%": { transform: "translateY(-8px) translateX(4px)" },
          "66%": { transform: "translateY(-4px) translateX(-4px)" },
        },
        glowCycle: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "0.5" },
        },
        typingCursor: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      boxShadow: {
        "subtle": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "card": "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        "card-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
        "card-dark": "0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06)",
        "brand-glow": "0 4px 14px 0 rgba(37, 99, 235, 0.25)",
        "brand-glow-lg": "0 10px 25px -3px rgba(37, 99, 235, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
