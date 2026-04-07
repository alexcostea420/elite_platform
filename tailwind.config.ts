import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "accent-emerald": "#D4A853",       // Gold/amber - primary accent
        "accent-soft": "#F5DEB3",           // Wheat - soft hover
        "crypto-green": "#3FC97A",          // Keep green for profit/positive only
        "crypto-dark": "#0A0D14",           // Darker, more neutral
        "surface-graphite": "#111318",      // Neutral dark, less green tint
        "crypto-ink": "#060810",            // Deep neutral
      },
      boxShadow: {
        glow: "0 0 28px rgba(212, 168, 83, 0.18)",
        card: "0 18px 38px rgba(4, 6, 12, 0.48)",
      },
      backgroundImage: {
        "emerald-gradient": "linear-gradient(135deg, #D4A853 0%, #F5DEB3 100%)",
        "hero-radial": "radial-gradient(circle at top, rgba(212, 168, 83, 0.12), transparent 38%)",
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
