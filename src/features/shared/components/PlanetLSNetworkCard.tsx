"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ArrowRight, UserRound } from "lucide-react";
import styles from "./PlanetLSNetworkCard.module.scss";

export type PlanetLSNetworkProfessional = {
  id: string;
  displayName: string;
  roleLabel: string;
  city?: string | null;
  serviceArea?: string | null;
  avatarUrl?: string | null;
  services?: string[];
  profileHref: string;
};

export type PlanetLSNetworkIndicator = {
  value: string | number;
  label: string;
  detail: string;
};

export type PlanetLSNetworkContent = {
  eyebrow: string;
  title: string;
  description: string;
  exploreLabel: string;
  exploreHref: string;
  featuredLabel: string;
  profileLinkLabel: string;
};

type PlanetLSNetworkCardProps = {
  content: PlanetLSNetworkContent;
  professional?: PlanetLSNetworkProfessional | null;
  indicators?: PlanetLSNetworkIndicator[];
  loading?: boolean;
  error?: string | null;
  emptyMessage: string;
  urgentMissions?: Array<{ id: string; displayText: string; href: string }>;
};

function ProfessionalAvatar({ src }: { src?: string | null }) {
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    setImageSrc(src);
  }, [src]);

  return (
    <span className={styles.avatar} aria-hidden="true">
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="56px"
          unoptimized
          onError={() => setImageSrc(null)}
        />
      ) : (
        <UserRound size={25} strokeWidth={1.5} />
      )}
    </span>
  );
}

export function PlanetLSNetworkCard({
  content,
  professional,
  indicators = [],
  loading = false,
  error,
  emptyMessage,
  urgentMissions = [],
}: PlanetLSNetworkCardProps) {
  const titleId = useId();
  const allServices = professional?.services?.filter(Boolean) ?? [];
  const services = allServices.slice(0, 3);
  const additionalServices = allServices.length - services.length;
  const location = [professional?.city, professional?.serviceArea]
    .filter((value, index, values): value is string => Boolean(value?.trim()) && values.indexOf(value) === index)
    .join(" · ");

  // Service categories for the network
  const categories = [
    {
      key: "conciergerie",
      label: "Conciergerie & accueil",
      description: "Accueil & gestion des séjours",
      href: "/dashboard/owner/concierges?categories=Accueil",
    },
    {
      key: "menage",
      label: "Ménage & linge",
      description: "Nettoyage, linge et remises à neuf",
      href: "/dashboard/owner/concierges?categories=Ménage,Linge",
    },
    {
      key: "maintenance",
      label: "Maintenance & dépannage",
      description: "Réparation, entretien, urgences",
      href: "/dashboard/owner/concierges?categories=Maintenance",
    },
  ];

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <header className={styles.header}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>{content.eyebrow}</span>
          <h2 id={titleId}>{content.title}</h2>
          <p className={styles.description}>{content.description}</p>
        </div>
        <Link className={styles.exploreLink} href={content.exploreHref}>
          {content.exploreLabel}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </header>

      <div className={styles.urgentTicker} aria-live="polite">
        <div className={styles.tickerContent}>
          {(urgentMissions?.length > 0 ? urgentMissions : [
            { id: "test-1", displayText: "⚠️  Ménage à terminer - Appartement A - Aujourd'hui", href: "/dashboard/owner/missions" },
            { id: "test-2", displayText: "⚠️  Dépannage serrure - 12 Rue de Paris - 15:30", href: "/dashboard/owner/missions" },
            { id: "test-3", displayText: "⚠️  Check-out urgent - La Villa - Demain", href: "/dashboard/owner/missions" },
          ]).map((mission) => (
            <Link
              key={mission.id}
              href={mission.href}
              className={styles.tickerItem}
            >
              {mission.displayText}
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.categories}>
        {categories.map((category) => (
          <article key={category.key} className={styles.category}>
            <span className={styles.categoryIcon} aria-hidden="true">
              <span className={styles.iconPlaceholder} />
            </span>
            <div className={styles.categoryContent}>
              <h3>{category.label}</h3>
              <p>{category.description}</p>
              <Link className={styles.categoryLink} href={category.href}>
                Découvrir
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.featured}>
        <span className={styles.featuredLabel}>{content.featuredLabel}</span>
        {loading ? (
          <p className={styles.message} role="status">Chargement des profils…</p>
        ) : error ? (
          <p className={styles.error} role="alert">{error}</p>
        ) : professional ? (
          <article className={styles.professional}>
            <div className={styles.professionalIdentity}>
              <ProfessionalAvatar src={professional.avatarUrl} />
              <div className={styles.identityText}>
                <div className={styles.nameLine}>
                  <h3>{professional.displayName}</h3>
                  <span className={styles.role}>{professional.roleLabel}</span>
                </div>
                {location ? <p className={styles.meta}>{location}</p> : null}
              </div>
            </div>
            {services.length > 0 ? (
              <ul className={styles.services} aria-label="Services proposés">
                {services.map((service) => (
                  <li key={service}>{service}</li>
                ))}
                {additionalServices > 0 ? (
                  <li className={styles.moreServices}>+{additionalServices}</li>
                ) : null}
              </ul>
            ) : null}
            <div className={styles.profileFooter}>
              <Link className={styles.profileLink} href={professional.profileHref}>
                {content.profileLinkLabel}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </article>
        ) : (
          <p className={styles.message}>{emptyMessage}</p>
        )}
      </div>
    </section>
  );
}
