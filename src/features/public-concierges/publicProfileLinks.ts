export type PublicProfileLinks = {
  website?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  facebook?: string | null;
};

export type PublicProfileLinkItem = {
  key: "website" | "linkedin" | "instagram" | "facebook";
  label: string;
  href: string;
};

const PUBLIC_PROFILE_LINK_DEFINITIONS: Array<{
  key: PublicProfileLinkItem["key"];
  label: string;
}> = [
  { key: "website", label: "Site web" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
];

export function normalizePublicProfileUrl(url?: string | null) {
  if (!url) return "";

  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return `https://${trimmed}`;
}

export function getPublicProfileLinks(
  links: PublicProfileLinks,
): PublicProfileLinkItem[] {
  return PUBLIC_PROFILE_LINK_DEFINITIONS.flatMap((definition) => {
    const href = normalizePublicProfileUrl(links[definition.key]);

    return href
      ? [
          {
            key: definition.key,
            label: definition.label,
            href,
          },
        ]
      : [];
  });
}
