"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Avatar, Badge, ButtonLink, Card, CardBody, CardFooter, CardHeader, Tag } from "@/components/ui";
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
                <Card variant="small" interactive className={styles.profileCard}>
                  <CardHeader className={styles.cardHeader}>
                    <Avatar src={photo || null} name={name} alt={`Avatar de ${name}, ${type}`} size="lg" />
                    <Badge variant={available ? "success" : "danger"}>
                      {available ? "Disponible" : "Indisponible"}
                    </Badge>
                  </CardHeader>

                  <CardBody className={styles.profileDetails}>
                    <h4>
                      {name} <span className={styles.categoryLabel}>({categoryInfo.label})</span>
                    </h4>
                    <p className={styles.categoryDescription}>{categoryInfo.description}</p>

                    <div className={styles.services}>
                      {services.length > 0 ? (
                        <>
                          {services.slice(0, 3).map((srv, index) => (
                            <Tag key={`${name}-${srv}-${index}`} tone="category" className={styles.serviceTag}>
                              {srv}
                            </Tag>
                          ))}
                          {services.length > 3 && <Tag className={styles.more}>+{services.length - 3}</Tag>}
                        </>
                      ) : (
                        <span className={styles.serviceNone}>Aucun service renseigne</span>
                      )}
                    </div>

                    <p className={styles.location}>Secteur : {location}</p>
                    {created_at && (
                      <p className={styles.experience}>
                        Membre depuis {new Date(created_at).getFullYear()}
                      </p>
                    )}
                  </CardBody>

                  <CardFooter className={styles.actions}>
                    <ButtonLink href="/login" variant="outline" size="sm">
                      Contacter
                    </ButtonLink>
                    <ButtonLink href={getProfileHref(profile)} variant="primary" size="sm">
                      Voir profil
                    </ButtonLink>
                  </CardFooter>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        <div>
          <p className={styles.noResultAlert}>Aucun profil trouve pour {category} a {location}.</p>
          <div className={styles.actions}>
            <ButtonLink href="/map-list?filter=concierge" variant="secondary" size="sm">
              Elargir la recherche
            </ButtonLink>
            <ButtonLink href="/login" variant="primary" size="sm">
              Se connecter pour creer une alerte
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
