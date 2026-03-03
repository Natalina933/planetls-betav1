import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://planetls.fr";

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/home`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/complete-registration`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/abonnement/concierge-pro`,
      lastModified: new Date(),
    },
  ];
}
