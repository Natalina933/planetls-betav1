export const CONCIERGE_CARD_COVER_OPTIONS = [
  {
    id: "accueil",
    label: "Accueil voyageurs",
    url: "/images/carousel/planetls-card-header-accueil.png",
  },
  {
    id: "menage",
    label: "Ménage premium",
    url: "/images/carousel/planetls-card-header-menage.png",
  },
  {
    id: "linge",
    label: "Linge et textiles",
    url: "/images/carousel/planetls-card-header-linge.png",
  },
  {
    id: "maintenance",
    label: "Maintenance",
    url: "/images/carousel/planetls-card-header-maintenance.png",
  },
  {
    id: "exterieur",
    label: "Extérieur et piscine",
    url: "/images/carousel/planetls-card-header-exterieur.png",
  },
  {
    id: "photo",
    label: "Photo et staging",
    url: "/images/carousel/planetls-card-header-photo.png",
  },
] as const;

export const CONCIERGE_CARD_COVER_URLS = CONCIERGE_CARD_COVER_OPTIONS.map(
  (option) => option.url,
);
