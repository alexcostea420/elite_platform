import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Armata de Traderi - Comunitate Elite de Trading Crypto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at top right, rgba(22, 163, 74, 0.18), transparent 34%), linear-gradient(135deg, #0a0a0f 0%, #111827 50%, #1a1a2e 100%)",
          color: "#ffffff",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.1,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "100% 44px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 46,
            left: 54,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 18px",
            borderRadius: 999,
            border: "1px solid rgba(245, 158, 11, 0.35)",
            background: "rgba(245, 158, 11, 0.08)",
            color: "#f59e0b",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
          }}
        >
          Elite
        </div>
        <div
          style={{
            display: "flex",
            width: "100%",
            padding: "120px 64px 64px",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: 820,
            }}
          >
            <div
              style={{
                fontSize: 68,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
              }}
            >
              Armata de Traderi
            </div>
            <div
              style={{
                marginTop: 20,
                fontSize: 32,
                lineHeight: 1.3,
                color: "#9ca3af",
              }}
            >
              Comunitate de Trading Crypto
            </div>
            <div
              style={{
                marginTop: 26,
                display: "flex",
                gap: 16,
                alignItems: "center",
                color: "#86efac",
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              <span>Analize live</span>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
              <span>Context premium</span>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
              <span>Comunitate Elite</span>
            </div>
          </div>
        </div>

        <svg
          height="240"
          style={{
            position: "absolute",
            right: 34,
            bottom: 26,
            opacity: 0.78,
          }}
          viewBox="0 0 420 240"
          width="420"
        >
          <defs>
            <linearGradient id="chartLine" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <g stroke="rgba(255,255,255,0.08)">
            <line x1="0" x2="420" y1="210" y2="210" />
            <line x1="0" x2="420" y1="150" y2="150" />
            <line x1="0" x2="420" y1="90" y2="90" />
            <line x1="60" x2="60" y1="0" y2="240" />
            <line x1="160" x2="160" y1="0" y2="240" />
            <line x1="260" x2="260" y1="0" y2="240" />
            <line x1="360" x2="360" y1="0" y2="240" />
          </g>
          <polyline
            fill="none"
            points="14,184 74,170 126,150 178,160 228,112 282,124 330,78 394,44"
            stroke="url(#chartLine)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="8"
          />
          <g fill="#34d399">
            <circle cx="74" cy="170" r="7" />
            <circle cx="178" cy="160" r="7" />
            <circle cx="282" cy="124" r="7" />
            <circle cx="394" cy="44" r="9" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
