import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#b8ceff",
          300: "#8babff",
          400: "#5c80ff",
          500: "#3457ff",
          600: "#1f3ce6",
          700: "#1a2fb4",
          800: "#1a2c8f",
          900: "#1a2a72",
          glow: "rgba(52, 87, 255, 0.15)",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out forwards",
        "scale-in": "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2s linear infinite",
        "flow-dash": "flowDash 1.5s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "node-in": "nodeIn 0.3s ease-out forwards",
        "draw-line": "drawLine 1.5s ease-in-out infinite",
        "pulse-x": "pulseX 2s ease-in-out infinite",
        "pulse-y": "pulseY 2s ease-in-out infinite",
        "glow-soft": "glowSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 0 0 rgba(52, 87, 255, 0.4)" },
          "50%": { opacity: "0.85", boxShadow: "0 0 0 8px rgba(52, 87, 255, 0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        flowDash: {
          "to": { strokeDashoffset: "-20" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        nodeIn: {
          "0%": { opacity: "0", transform: "scale(0.9) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        drawLine: {
          "0%": { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" },
        },
        pulseX: {
          "0%, 100%": { transform: "scaleX(1)" },
          "50%": { transform: "scaleX(1.05)" },
        },
        pulseY: {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(1.05)" },
        },
        glowSoft: {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 8px rgba(52, 87, 255, 0.3))" },
          "50%": { opacity: "0.8", filter: "drop-shadow(0 0 16px rgba(52, 87, 255, 0.6))" },
        },
      },
      boxShadow: {
        "subtle": "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        "card": "0 4px 16px -2px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)",
        "brand-glow": "0 0 20px -2px rgba(52, 87, 255, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
