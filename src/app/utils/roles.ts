const PROVIDER_CATEGORY_KEYS = new Set([
  "artisan",
  "artisan_pro",
  "service",
  "service_pro",
  "provider",
  "provider_pro",
  "commercant",
  "commercant_pro",
  "commerçant",
  "commerçant_pro",
  "photographe",
  "photographe_pro",
  "jardinier",
  "jardinier_pro",
  "reseaux",
  "reseaux_pro",
  "decoration",
  "decoration_pro",
  "decoratrice",
  "decoratrice_pro",
  "electricien",
  "electricien_pro",
  "plombier",
  "plombier_pro",
  "menuisier",
  "menuisier_pro",
  "installateur",
  "installateur_pro",
  "maintenance",
  "maintenance_pro",
  "blanchisseur",
  "blanchisseur_pro",
  "pisciniste",
  "pisciniste_pro",
  "reparateur",
  "reparateur_pro",
]);

export const categoryToRole = (cat: string | null | undefined): string | null => {
  const c = (cat || "").trim().toLowerCase();

  if (c === "proprietaire_pro") return "owner_pro";
  if (c.startsWith("proprietaire")) return "owner";

  if (c === "concierge_pro") return "concierge_pro";
  if (c.startsWith("concierge")) return "concierge";

  if (c === "admin") return "admin";
  if (c === "super_admin") return "super_admin";

  if (PROVIDER_CATEGORY_KEYS.has(c)) {
    return c.endsWith("_pro") ? "provider_pro" : "provider";
  }

  return null;
};
