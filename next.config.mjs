/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  ...(isDev ? { allowedDevOrigins: ["*.loca.lt"] } : {}),
  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
    ],
  },
  ...(isDev
    ? {
        experimental: {
          serverActions: {
            allowedOrigins: ["*.loca.lt"],
          },
        },
      }
    : {}),
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|css|js)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://cdn.plyr.io https://connect.facebook.net https://plausible.io https://s.tradingview.com; style-src 'self' 'unsafe-inline' https://cdn.plyr.io; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; frame-src https://www.youtube-nocookie.com https://www.youtube.com https://s.binance.com https://s.tradingview.com; connect-src 'self' https://vyeouffsgdjoclblodmy.supabase.co https://www.google-analytics.com https://plausible.io https://cdn.plyr.io; media-src 'self' https:;" },
        ],
      },
    ];
  },
};

export default nextConfig;
