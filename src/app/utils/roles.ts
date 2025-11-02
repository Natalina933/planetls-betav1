// src/app/utils/roles.ts (Version Corrigée)

export const categoryToRole = (
  cat: string | null | undefined
): string | null => {
  const c = (cat || "").trim().toLowerCase(); // Propriétaire

  if (c === "proprietaire_pro") return "owner_pro";
  if (c.startsWith("proprietaire")) return "owner"; // Concierge
  if (c === "concierge_pro") return "concierge_pro";
  if (c.startsWith("concierge")) return "concierge"; // Prestataire (Rôles en base: provider / provider_pro) // Mappe la catégorie 'artisan' ou 'service' vers le code DB 'provider'

  if (c === "provider_pro") return "provider_pro"; // Ajout/Vérification
  if (c === "provider") return "provider";
  if (c === "artisan_pro" || c === "service_pro") return "provider_pro";
  if (c.startsWith("artisan") || c.startsWith("service")) return "provider"; // Admin
  if (c === "admin") return "admin";
  if (c === "super_admin") return "super_admin"; // Rôle inconnu

  return null;
};
