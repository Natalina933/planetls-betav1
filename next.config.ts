import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.planetls.com",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
  experimental: {
    scrollRestoration: true,
  },
};

export default nextConfig;