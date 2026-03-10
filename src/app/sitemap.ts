import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://planetls.fr";
  const lastModified = new Date();

  const publicRoutes = [
    "/",
    "/home",
    "/login",
    "/complete-registration",
    "/abonnement/concierge-pro",
    "/concierge",
    "/owner",
    "/provider",
    "/parcours",
    "/about",
    "/contact",
    "/mission-urgente",
    "/planning",
    "/map-list",
  ];

  return publicRoutes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
  }));
}
