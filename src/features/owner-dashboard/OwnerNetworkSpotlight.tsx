"use client";

import { useEffect, useState } from "react";
import {
  PlanetLSNetworkCard,
  type PlanetLSNetworkProfessional,
} from "@/features/shared/components/PlanetLSNetworkCard";

type OwnerNetworkProfile = {
  id: string;
  display_name: string;
  city: string | null;
  service_area: string | null;
  avatar_url: string | null;
  image?: string | null;
  services: string[];
  created_at?: string | null;
};

type ConciergeSearchPayload = {
  items?: OwnerNetworkProfile[];
  error?: string;
};

const content = {
  eyebrow: "LE RÉSEAU PLANETLS",
  title: "Des professionnels près de vos logements",
  description: "Conciergerie, ménage, linge ou maintenance : trouvez le bon partenaire selon vos besoins.",
  exploreLabel: "Explorer",
  exploreHref: "/dashboard/owner/concierges",
  featuredLabel: "À DÉCOUVRIR",
  profileLinkLabel: "Voir le profil",
};

function mostRecentProfile(profiles: OwnerNetworkProfile[]) {
  return [...profiles].sort((left, right) => {
    const leftDate = Date.parse(left.created_at ?? "");
    const rightDate = Date.parse(right.created_at ?? "");
    const dateOrder = (Number.isFinite(rightDate) ? rightDate : 0) - (Number.isFinite(leftDate) ? leftDate : 0);
    return dateOrder || left.display_name.localeCompare(right.display_name, "fr") || left.id.localeCompare(right.id);
  })[0] ?? null;
}

async function loadConcierges(city: string | null, signal: AbortSignal) {
  const params = new URLSearchParams({ availableOnly: "0", limit: "48", recentFirst: "1" });
  if (city) params.set("city", city);

  const response = await fetch(`/api/profiles/concierges?${params.toString()}`, {
    cache: "no-store",
    signal,
  });
  const payload = (await response.json()) as ConciergeSearchPayload;

  if (!response.ok) {
    throw new Error(payload.error || "Impossible de charger les profils professionnels.");
  }

  return Array.isArray(payload.items) ? payload.items : [];
}

type OwnerUrgentMission = {
  id: string;
  title: string | null;
  priority?: string | null;
  scheduled_start?: string | null;
  property_name?: string | null;
};

export function OwnerNetworkSpotlight({
  housing,
  urgentMissions = [],
}: {
  housing: Array<{ name: string | null; city: string | null }>;
  urgentMissions?: OwnerUrgentMission[];
}) {
  const [professional, setProfessional] = useState<PlanetLSNetworkProfessional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const city = housing.find((property) => property.city?.trim())?.city?.trim() ?? null;
  const description = housing.length === 1 && housing[0].name?.trim()
    ? `Découvrez les professionnels présents autour de ${housing[0].name.trim()}.`
    : content.description;

  useEffect(() => {
    const controller = new AbortController();

    async function loadFeaturedProfessional() {
      try {
        setLoading(true);
        setError(null);
        const matchingProfiles = await loadConcierges(city, controller.signal);
        const profiles = matchingProfiles.length > 0 || !city
          ? matchingProfiles
          : await loadConcierges(null, controller.signal);
        const selected = mostRecentProfile(profiles);
        setProfessional(selected
          ? {
              id: selected.id,
              displayName: selected.display_name,
              roleLabel: "Concierge",
              city: selected.city,
              serviceArea: selected.service_area,
              avatarUrl: selected.avatar_url || selected.image,
              services: selected.services,
              profileHref: `/concierges/${encodeURIComponent(selected.id)}`,
            }
          : null);
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Impossible de charger les profils professionnels.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadFeaturedProfessional();
    return () => controller.abort();
  }, [city]);

  // Format urgent missions for ticker: "⚠️ Ménage à terminer - Aujourd'hui"
  const formattedUrgentMissions = urgentMissions
    .slice(0, 10) // Limit to 10 missions
    .map((mission) => {
      const title = mission.title || "Mission urgente";
      const date = mission.scheduled_start
        ? new Date(mission.scheduled_start).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })
        : "Aujourd'hui";
      const property = mission.property_name || "";
      const displayText = property ? `${title} - ${property} - ${date}` : `${title} - ${date}`;
      return {
        id: mission.id,
        displayText: `⚠️  ${displayText}`,
        href: `/dashboard/owner/missions/${mission.id}`,
      };
    });

  return (
    <PlanetLSNetworkCard
      content={{ ...content, description }}
      professional={professional}
      loading={loading}
      error={error}
      emptyMessage="Aucun profil professionnel à présenter pour le moment."
      urgentMissions={formattedUrgentMissions}
    />
  );
}
