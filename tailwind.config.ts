import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          ink: "var(--brand-ink)",
          gold: "var(--brand-gold)",
          "gold-light": "var(--brand-gold-light)",
          "gold-strong": "var(--brand-gold-strong)",
          ivory: "var(--brand-ivory)",
          canvas: "var(--brand-canvas)",
          sand: "var(--brand-sand)",
          muted: "var(--brand-muted)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          muted: "var(--color-surface-muted)",
        },
      },
      boxShadow: {
        "brand-card": "0 10px 30px rgba(38, 41, 31, 0.06)",
        "brand-focus": "0 0 0 3px rgba(182, 138, 85, 0.22)",
      },
    },
  },
  plugins: [],
};
export default config;
