import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Upgrade la Elite - Acces complet la semnale, analize și comunitate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function UpgradeOpenGraphImage() {
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
            "radial-gradient(circle at top left, rgba(245, 158, 11, 0.16), transparent 28%), linear-gradient(135deg, #09090f 0%, #0f172a 52%, #1a1a2e 100%)",
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
            backgroundSize: "100% 42px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 50,
            left: 56,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 18px",
            borderRadius: 999,
            border: "1px solid rgba(52, 211, 153, 0.35)",
            background: "rgba(16, 185, 129, 0.08)",
            color: "#86efac",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          Upgrade Elite
        </div>
        <div
          style={{
            display: "flex",
            width: "100%",
            padding: "130px 64px 64px",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 860 }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: "-0.04em",
              }}
            >
              Upgrade la Elite
            </div>
            <div
              style={{
                marginTop: 22,
                fontSize: 30,
                lineHeight: 1.32,
                color: "#cbd5e1",
              }}
            >
              Acces complet la semnale, analize și comunitate
            </div>
            <div
              style={{
                marginTop: 28,
                display: "flex",
                gap: 16,
                alignItems: "center",
                fontSize: 23,
                color: "#f59e0b",
                fontWeight: 600,
              }}
            >
              <span>Video premium</span>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
              <span>Discord Elite</span>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
              <span>Execuție reală</span>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
