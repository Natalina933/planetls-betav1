import { PROFILE_VISUAL_KITS } from "@/app/lib/profileVisualKit";

const ownerKit = PROFILE_VISUAL_KITS.find((kit) => kit.id === "owner");
const conciergeKit = PROFILE_VISUAL_KITS.find((kit) => kit.id === "concierge");
const providerKit = PROFILE_VISUAL_KITS.find((kit) => kit.id === "provider");

export const ADMIN_VISUAL_PRESETS = {
  onboarding: {
    illustrationSrc: ownerKit?.image ?? "/icons/proprio_belle_epoque.png",
    illustrationAlt: "Illustration propriétaire",
    accentColor: ownerKit?.accent ?? "#b88935",
    textureSrc: "/icons/check-gold-light.png",
  },
  missions: {
    illustrationSrc: conciergeKit?.image ?? "/icons/concierges_belle_epoque.png",
    illustrationAlt: "Illustration conciergerie",
    accentColor: conciergeKit?.accent ?? "#2f7a54",
    textureSrc: "/icons/mission-pace-calm-sea.svg",
  },
  messages: {
    illustrationSrc: providerKit?.image ?? "/icons/artisans_belle_epoque.png",
    illustrationAlt: "Illustration artisan",
    accentColor: providerKit?.accent ?? "#3b5f83",
    textureSrc: "/icons/calm-sea.svg",
  },
  alerts: {
    illustrationSrc: conciergeKit?.image ?? "/icons/concierges_belle_epoque.png",
    illustrationAlt: "Illustration signaux de contrôle",
    accentColor: conciergeKit?.accent ?? "#2f7a54",
    textureSrc: "/icons/mission-pace-soft-sea.svg",
  },
  reliability: {
    illustrationSrc: ownerKit?.image ?? "/icons/proprio_belle_epoque.png",
    illustrationAlt: "Illustration qualité opérationnelle",
    accentColor: ownerKit?.accent ?? "#b88935",
    textureSrc: "/icons/check-gold.png",
  },
  activity: {
    illustrationSrc: conciergeKit?.image ?? "/icons/concierges_belle_epoque.png",
    illustrationAlt: "Illustration activité",
    accentColor: conciergeKit?.accent ?? "#2f7a54",
    textureSrc: "/icons/mission-pace-active-sea.svg",
  },
  legend: {
    illustrationSrc: providerKit?.image ?? "/icons/artisans_belle_epoque.png",
    illustrationAlt: "Illustration légende",
    accentColor: providerKit?.accent ?? "#3b5f83",
    textureSrc: "/icons/pentagram-svgrepo-com.svg",
  },
} as const;
