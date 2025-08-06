import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Active le mode strict React
  swcMinify: true, // Utilise le minifieur SWC (plus rapide)
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
    formats: ["image/webp", "image/avif"], // Formats d’images supportés
  },
  experimental: {
    scrollRestoration: true, // Restauration de la position de défilement
  },
  i18n: {
    locales: ["fr", "en"],
    defaultLocale: "fr",
  },
  // Ajoute d'autres options selon tes besoins
};

export default nextConfig;