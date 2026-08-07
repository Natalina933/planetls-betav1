import {
  getPublicProfileLinks,
  normalizePublicProfileUrl,
  type PublicProfileLinks,
} from "./publicProfileLinks.ts";

export type PublicProfileCtaKey =
  | "contact_platform"
  | "visit_website"
  | "view_linkedin"
  | "view_instagram"
  | "view_facebook";

export type PublicProfileCta = {
  key: PublicProfileCtaKey;
  label: string;
  description: string;
  href: string;
  variant: "primary" | "secondary";
  external: boolean;
};

type PublicProfileCtaInput = PublicProfileLinks & {
  contactHref?: string | null;
};

export function getPublicProfileCtas(input: PublicProfileCtaInput): PublicProfileCta[] {
  const ctas: PublicProfileCta[] = [];
  const contactHref =
    typeof input.contactHref === "string" && input.contactHref.trim().startsWith("/")
      ? input.contactHref.trim()
      : normalizePublicProfileUrl(input.contactHref);

  if (contactHref) {
    ctas.push({
      key: "contact_platform",
      label: "Contacter via PlanetLS",
      description: "Déclenche un échange qualifié depuis la plateforme.",
      href: contactHref,
      variant: "primary",
      external: false,
    });
  }

  const linkMap = {
    website: {
      key: "visit_website" as const,
      label: "Visiter le site",
      description: "Consulter la vitrine, les offres et les informations publiques.",
    },
    linkedin: {
      key: "view_linkedin" as const,
      label: "Voir LinkedIn",
      description: "Consulter la présence professionnelle et le positionnement.",
    },
    instagram: {
      key: "view_instagram" as const,
      label: "Voir Instagram",
      description: "Découvrir l'univers visuel et les réalisations récentes.",
    },
    facebook: {
      key: "view_facebook" as const,
      label: "Voir Facebook",
      description: "Consulter les actualités et la présence locale.",
    },
  };

  getPublicProfileLinks(input).forEach((link) => {
    const config = linkMap[link.key];
    ctas.push({
      key: config.key,
      label: config.label,
      description: config.description,
      href: link.href,
      variant: ctas.length === 0 ? "primary" : "secondary",
      external: true,
    });
  });

  return ctas;
}
