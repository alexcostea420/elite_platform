import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "accent-emerald": "#69E08F",
        "accent-soft": "#CFFFE0",
        "crypto-green": "#3FC97A",
        "crypto-dark": "#06110D",
        "surface-graphite": "#0D1713",
        "crypto-ink": "#030806"
      },
      boxShadow: {
        glow: "0 0 28px rgba(105, 224, 143, 0.22)",
        card: "0 18px 38px rgba(4, 12, 9, 0.48)"
      },
      backgroundImage: {
        "emerald-gradient": "linear-gradient(135deg, #57C97A 0%, #CFFFE0 100%)",
        "hero-radial": "radial-gradient(circle at top, rgba(105, 224, 143, 0.18), transparent 38%)"
      },
      fontFamily: {
        display: ["var(--font-orbitron)"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
