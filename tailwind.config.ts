import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "accent-emerald": "#4A7C59",       // Military green - primary accent
        "accent-soft": "#6B9E7A",           // Lighter military green - hover
        "crypto-green": "#3FC97A",          // Bright green for profit/positive only
        "crypto-dark": "#0A0E0C",           // Dark with slight green tint (military)
        "surface-graphite": "#111916",      // Dark surface, subtle green undertone
        "crypto-ink": "#060A08",            // Deepest dark
      },
      boxShadow: {
        glow: "0 0 28px rgba(74, 124, 89, 0.15)",
        card: "0 18px 38px rgba(4, 8, 6, 0.48)",
      },
      backgroundImage: {
        "emerald-gradient": "linear-gradient(135deg, #4A7C59 0%, #6B9E7A 100%)",
        "hero-radial": "radial-gradient(circle at top, rgba(74, 124, 89, 0.14), transparent 38%)",
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
