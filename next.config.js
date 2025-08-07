/** @type {import('next').NextConfig} */
const nextConfig = {
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
  async redirects() {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: true, // 308 redirect
      },
    ];
  },
};

module.exports = nextConfig;