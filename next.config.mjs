/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["*.loca.lt"],
  experimental: {
    serverActions: {
      allowedOrigins: ["*.loca.lt"],
    },
  },
};

export default nextConfig;
