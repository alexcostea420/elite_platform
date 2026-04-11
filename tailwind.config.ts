import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "accent-emerald": "#10B981",
        "accent-soft": "#34D399",
        "crypto-green": "#10B981",
        "crypto-dark": "#09090B",
        "surface-graphite": "#111113",
        "crypto-ink": "#09090B",
        // Semantic
        danger: "#EF4444",
        warning: "#F59E0B",
        info: "#3B82F6",
      },
      boxShadow: {
        glow: "0 0 24px rgba(16, 185, 129, 0.1)",
        "glow-strong": "0 0 40px rgba(16, 185, 129, 0.18)",
        card: "0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 8px 30px rgba(0, 0, 0, 0.5), 0 0 1px rgba(16, 185, 129, 0.1)",
      },
      backgroundImage: {
        "emerald-gradient": "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
        "hero-radial": "radial-gradient(circle at top, rgba(16, 185, 129, 0.06), transparent 38%)",
      },
      fontFamily: {
        display: ["var(--font-inter)"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
