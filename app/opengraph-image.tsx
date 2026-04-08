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
          background: "linear-gradient(135deg, #080808 0%, #0a1a0f 50%, #080808 100%)",
          color: "#ffffff",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.05,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Green glow */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(11, 102, 35, 0.3), transparent 70%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "60px 80px",
          }}
        >
          {/* Left side - text */}
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 650 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <span style={{ fontSize: 40 }}>🪖</span>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#0B6623",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Armata de Traderi
              </span>
            </div>

            <h1
              style={{
                fontSize: 56,
                fontWeight: 800,
                lineHeight: 1.1,
                margin: 0,
                color: "#ffffff",
              }}
            >
              Comunitate de
              <br />
              <span style={{ color: "#0B6623" }}>Trading Crypto</span>
            </h1>

            <p
              style={{
                fontSize: 22,
                color: "#94a3b8",
                marginTop: 20,
                lineHeight: 1.5,
              }}
            >
              Indicatori exclusivi, sesiuni live, portofoliu de actiuni
              si comunitate activa de investitori.
            </p>

            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 32,
              }}
            >
              {["350+ Membri", "55+ Video-uri", "4+ Ani Experienta"].map((stat) => (
                <div
                  key={stat}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid rgba(11, 102, 35, 0.3)",
                    background: "rgba(11, 102, 35, 0.1)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#0B6623",
                  }}
                >
                  {stat}
                </div>
              ))}
            </div>
          </div>

          {/* Right side - avatar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 340,
              height: 340,
              borderRadius: "50%",
              border: "3px solid rgba(11, 102, 35, 0.3)",
              background: "rgba(11, 102, 35, 0.05)",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://app.armatadetraderi.com/avatar-armata.jpg"
              alt="Armata de Traderi"
              width={320}
              height={320}
              style={{ objectFit: "cover", borderRadius: "50%" }}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #0B6623, #0E7A2B, #0B6623)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
