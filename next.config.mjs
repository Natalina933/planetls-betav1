const supabaseHostname = (() => {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

  if (!rawUrl) {
    return null;
  }

  try {
    return new URL(rawUrl).hostname;
  } catch {
    return null;
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
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
        source: "/",
        destination: "/home",
        permanent: true,
      },
      {
        source: "/inscription",
        destination: "/complete-registration",
        permanent: true,
      },
      {
        source: "/inscription/service",
        destination: "/complete-registration?category=service",
        permanent: true,
      },
      {
        source: "/register",
        destination: "/complete-registration",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,DELETE,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

if (supabaseHostname) {
  nextConfig.images.remotePatterns.push({
    protocol: "https",
    hostname: supabaseHostname,
  });
}

export default nextConfig;
