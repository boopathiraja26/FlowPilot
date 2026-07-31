import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
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
        },
      },
    },
  },
  plugins: [],
};

export default config;
