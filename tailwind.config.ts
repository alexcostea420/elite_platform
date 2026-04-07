import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "accent-emerald": "#C9A84C",       // Gold/amber - buttons, links, accents
        "accent-soft": "#E0C068",           // Lighter gold - hover states
        "crypto-green": "#3FC97A",          // Bright green for profit/positive only
        "crypto-dark": "#0A0E0C",           // Dark with military green undertone
        "surface-graphite": "#111916",      // Dark surface, subtle military green
        "crypto-ink": "#060A08",            // Deepest dark
      },
      boxShadow: {
        glow: "0 0 28px rgba(201, 168, 76, 0.15)",
        card: "0 18px 38px rgba(4, 8, 6, 0.48)",
      },
      backgroundImage: {
        "emerald-gradient": "linear-gradient(135deg, #C9A84C 0%, #E0C068 100%)",
        "hero-radial": "radial-gradient(circle at top, rgba(74, 124, 89, 0.12), transparent 38%)",
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
