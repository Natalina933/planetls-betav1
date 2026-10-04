"use client";

import { useEffect, useState } from "react";
import type { PublicProfileCtaKey } from "@/features/public-concierges/publicProfileCtas";
import { OwnerConciergeProfileView } from "./OwnerConciergeProfileView";
import styles from "./OwnerConciergeProfileView.module.scss";
type PublicReview = {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
};

export type PublicProfilePayload = {
  profile: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    image: string | null;
    company_name: string | null;
    city: string | null;
    country: string | null;
    service_area: string | null;
    service_radius_km: number | null;
    intervention_zones?: { latitude: number; longitude: number }[];
    experience_level: string | null;
    years_experience: number | null;
    hourly_rate: number | null;
    monthly_rate: number | null;
    role: string | null;
    website: string | null;
    linkedin: string | null;
    instagram: string | null;
    facebook: string | null;
    services: string[];
  };
  reviews: PublicReview[];
  stats: {
    average_rating: number | null;
    reviews_count: number;
  };
};

async function trackPublicProfileCta(
  profileId: string,
  ctaKey: PublicProfileCtaKey,
  href: string,
  source: string,
) {
  try {
    await fetch(`/api/profiles/public/${encodeURIComponent(profileId)}/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ctaKey,
        href,
        source,
      }),
      keepalive: true,
    });
  } catch (err) {
    console.warn("[public-profile] CTA tracking failed", err);
  }
}

export default function PublicConciergeProfilePage({
  params,
  ownerReturnTo,
}: {
  params: Promise<{ id: string }>;
  ownerReturnTo?: string;
}) {
  const [data, setData] = useState<PublicProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const resolvedParams = await params;
        const response = await fetch(`/api/profiles/public/${resolvedParams.id}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger le profil concierge.");
        }

        if (!cancelled) {
          setData(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Impossible de charger le profil concierge.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [params, retry]);

  const profile = data?.profile;
  const view = <OwnerConciergeProfileView data={data} loading={loading} error={error}
    returnTo={ownerReturnTo || "/home#concierges-recommandes"} publicView={!ownerReturnTo}
    onRetry={() => setRetry((value) => value + 1)}
    onTrack={(key, href, source) => { if (profile) void trackPublicProfileCta(profile.id, key, href, source); }} />;
  return ownerReturnTo ? view : <main className={styles.publicPage}>{view}</main>;
}
