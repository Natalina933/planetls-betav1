"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { ButtonLink } from "@/components/ui";
import { ConciergePreviewCard } from "@/features/public-concierges";
import { EmptyState } from "@/features/shared/components/EmptyState";
import styles from "./ProfilesDisplay.module.scss";

export interface Profile {
  id: string;
  name: string;
  type: string;
  photo?: string;
  services?: string[];
  available?: boolean;
  created_at?: string;
}

interface ProfilesDisplayProps {
  visibleProfiles: Profile[];
  onHover?: (id: string) => void;
  onLeave?: () => void;
}

const categoriesMap: Record<string, { label: string; description: string }> = {
  proprietaire: {
    label: "Proprietaire",
    description: "Proprietaires locaux, engages et a l'ecoute",
  },
  concierge: {
    label: "Conciergerie",
    description: "Concierges de quartier, service sur-mesure",
  },
  artisan: {
    label: "Artisan",
    description: "Artisans passionnes, savoir-faire local",
  },
};

function getProfileHref(profile: Profile) {
  if (profile.type === "concierge" && profile.id.trim()) {
    return `/concierges/${profile.id}`;
  }
  return "/parcours";
}

export default function ProfilesDisplay({
  visibleProfiles,
  onHover,
  onLeave,
}: ProfilesDisplayProps) {
  const searchParams = useSearchParams();
  const category = searchParams.get("filter") ?? "concierge";
  const location = searchParams.get("location") ?? "non precisee";

  return (
    <div className={styles.profilesDisplay}>
      {visibleProfiles.length > 0 ? (
        <ul className={styles.profileList}>
          {visibleProfiles.map((profile) => {
            const { id, name, type, photo, services = [], available, created_at } = profile;

            const categoryInfo = categoriesMap[type] ?? {
              label: type,
              description: "Professionnel local",
            };

            return (
              <li
                key={`${id}-${name}`}
                className={`${styles.profileItem} ${styles[type]}`}
                onMouseEnter={() => onHover?.(id)}
                onMouseLeave={() => onLeave?.()}
              >
                <ConciergePreviewCard
                  id={id}
                  displayName={`${name} (${categoryInfo.label})`}
                  city={location}
                  serviceArea={categoryInfo.description}
                  services={services}
                  badgeLabel={available ? "Disponible" : "Indisponible"}
                  badgeVariant={available ? "success" : "danger"}
                  yearsExperience={
                    created_at ? new Date().getFullYear() - new Date(created_at).getFullYear() : null
                  }
                  className={styles.profileCard}
                  primaryAction={
                    <ButtonLink href="/login" variant="outline" size="sm">
                      Contacter
                    </ButtonLink>
                  }
                  secondaryAction={
                    <ButtonLink href={getProfileHref(profile)} variant="primary" size="sm">
                      Voir profil
                    </ButtonLink>
                  }
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          title={`Aucun profil trouvé pour ${category} à ${location}.`}
          description="Élargissez la recherche ou connectez-vous pour créer une alerte pertinente."
          primaryAction={
            <ButtonLink href="/map-list?filter=concierge" variant="secondary" size="sm">
              Elargir la recherche
            </ButtonLink>
          }
          secondaryAction={
            <ButtonLink href="/login" variant="primary" size="sm">
              Se connecter pour creer une alerte
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
