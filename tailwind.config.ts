import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "accent-emerald": "#0B6623",       // Forest green - primary accent
        "accent-soft": "#0E7A2B",           // Slightly lighter - hover
        "crypto-green": "#0B6623",          // Same forest green for profit
        "crypto-dark": "#080808",           // Pure dark
        "surface-graphite": "#121212",      // Neutral dark surface
        "crypto-ink": "#050505",            // Deepest dark
      },
      boxShadow: {
        glow: "0 0 28px rgba(11, 102, 35, 0.12)",
        card: "0 18px 38px rgba(0, 0, 0, 0.5)",
      },
      backgroundImage: {
        "emerald-gradient": "linear-gradient(135deg, #0B6623 0%, #0E7A2B 100%)",
        "hero-radial": "radial-gradient(circle at top, rgba(11, 102, 35, 0.08), transparent 38%)",
      },
      fontFamily: {
        display: ["var(--font-orbitron)"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
