export const designSections = [
  {
    href: "/design-system",
    title: "Accueil",
    description: "Choisir ce que vous souhaitez examiner.",
  },
  {
    href: "/design-system/fondations",
    title: "Fondations",
    description: "Couleurs, typographies, espacements et composants de base.",
  },
  {
    href: "/design-system/visuels",
    title: "Composants & visuels",
    description: "Icônes, cartes, formulaires et exemples de composition.",
  },
  {
    href: "/design-system/dashboards",
    title: "Maquettes des espaces",
    description:
      "Comparer les quatre tableaux de bord avec des données fictives.",
  },
  {
    href: "/design-system/pages",
    title: "Modèles de pages",
    description: "Explorer quatre listes représentatives et leurs états.",
  },
  {
    href: "/design-system/trajets",
    title: "Trajets & tournée",
    description:
      "Tester la tournée concierge, la carte fictive et l'ordre des missions.",
  },
] as const;

export const designSpaces = [
  {
    id: "admin",
    title: "Administrateur",
    href: "/design-system/admin-dashboard",
  },
  {
    id: "owner",
    title: "Propriétaire",
    href: "/design-system/owner-dashboard",
  },
  {
    id: "concierge",
    title: "Concierge",
    href: "/design-system/concierge-dashboard",
  },
  {
    id: "provider",
    title: "Artisan / prestataire",
    href: "/design-system/provider-dashboard",
  },
] as const;
