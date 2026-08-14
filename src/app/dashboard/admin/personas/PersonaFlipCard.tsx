"use client";

import Image from "next/image";
import clsx from "clsx";
import { useState } from "react";
import {
  BadgeCheck,
  Building2,
  ChartNoAxesColumn,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react";
import styles from "../pilotage/personas/page.module.scss";

type PersonaTone = "owners" | "concierges" | "providers" | "ecosystem" | "platform";

type PersonaFlipCardProps = {
  name: string;
  role: string;
  image: string;
  imageAlt: string;
  segment: string;
  primaryDevice: string;
  digitalLevel: string;
  status: string;
  dashboardType: string;
  focus: string;
  punchline: string;
  quote?: string;
  visualBadge: string;
  commercialOffer: string;
  potential: string;
  context: string;
  needs: string[];
  goals: string[];
  frustrations: string[];
  priorityFeatures: string[];
  firstValue: string;
  tone: PersonaTone;
  icon: "owner" | "concierge" | "provider" | "team" | "merchant" | "admin" | "traveler";
  backTitle?: string;
  profileLabel: string;
  mainNeed: string;
  platformValue: string;
  potentialLabel: string;
};

function PersonaIcon({ icon }: { icon: PersonaFlipCardProps["icon"] }) {
  if (icon === "owner") return <UserRound size={18} />;
  if (icon === "concierge") return <Building2 size={18} />;
  if (icon === "provider") return <Wrench size={18} />;
  if (icon === "team") return <UsersRound size={18} />;
  if (icon === "merchant") return <Building2 size={18} />;
  if (icon === "admin") return <ShieldCheck size={18} />;
  return <BadgeCheck size={18} />;
}

function getSignalValue(label: string, value: string) {
  if (label === "terrain") {
    if (/mobile/i.test(value)) return 92;
    if (/desktop/i.test(value)) return 58;
    return 74;
  }

  if (label === "digital") {
    if (/expert/i.test(value)) return 92;
    if (/interm/i.test(value)) return 72;
    return 48;
  }

  if (/valid/i.test(value)) return 88;
  if (/cadrer/i.test(value)) return 38;
  return 64;
}

export function PersonaFlipCard({
  name,
  role,
  image,
  imageAlt,
  segment,
  primaryDevice,
  digitalLevel,
  status,
  dashboardType,
  focus,
  punchline,
  quote,
  visualBadge,
  commercialOffer,
  potential,
  context,
  needs,
  goals,
  frustrations,
  priorityFeatures,
  firstValue,
  tone,
  icon,
  backTitle = "Détails",
  profileLabel,
  mainNeed,
  platformValue,
  potentialLabel,
}: PersonaFlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      className={clsx(styles.personaFlipCardButton, flipped && styles.personaFlipCardButtonFlipped)}
      onClick={() => setFlipped((current) => !current)}
      aria-pressed={flipped}
      aria-label={flipped ? `Refermer la fiche ${name}` : `Ouvrir la fiche ${name}`}
    >
      <article className={styles.personaFlipShell} data-tone={tone}>
        <div className={styles.personaFlipInner}>
          <section className={clsx(styles.personaFace, styles.personaFaceFront)}>
            <div className={styles.personaPoster}>
              <div className={styles.personaPosterMedia}>
                <Image src={image} alt={imageAlt} fill sizes="320px" className={styles.personaPosterImage} />
              </div>
              <div className={styles.personaPosterOverlay} />
              <div className={styles.personaPosterTopline}>
                <span className={styles.posterRole}>{role}</span>
                <span className={styles.posterStatus}>{status}</span>
              </div>
              <div className={styles.personaPosterBody}>
                <span className={styles.posterIcon} aria-hidden="true">
                  <PersonaIcon icon={icon} />
                </span>
                <strong>{name}</strong>
                <p>{punchline}</p>
              </div>
            </div>

            <div className={styles.personaCardSummary}>
              <div className={styles.personaCardMeta}>
                <span>{visualBadge}</span>
                <span>{commercialOffer}</span>
                <span>{potentialLabel}</span>
              </div>

              <div className={styles.personaCardInfoGrid}>
                <div className={styles.personaInfoPill}>
                  <strong>Profil</strong>
                  <p>{profileLabel}</p>
                </div>
                <div className={styles.personaInfoPill}>
                  <strong>Besoin principal</strong>
                  <p>{mainNeed}</p>
                </div>
                <div className={styles.personaInfoPill}>
                  <strong>Dashboard</strong>
                  <p>{dashboardType}</p>
                </div>
                <div className={styles.personaInfoPill}>
                  <strong>Focus</strong>
                  <p>{focus}</p>
                </div>
                <div className={styles.personaInfoPill}>
                  <strong>Apport PlanetLS</strong>
                  <p>{platformValue}</p>
                </div>
                <div className={styles.personaInfoPill}>
                  <strong>Potentiel</strong>
                  <p>{potential}</p>
                </div>
              </div>

              <div className={styles.personaCardTags}>
                <span>{segment}</span>
                <span>{primaryDevice}</span>
                <span>{digitalLevel}</span>
                <span>{needs[0]}</span>
              </div>

              <div className={styles.personaScoreboard}>
                <div className={styles.personaSignals}>
                  <div className={styles.personaSignal}>
                    <span>Terrain</span>
                    <div className={styles.personaSignalTrack}>
                      <i style={{ width: `${getSignalValue("terrain", primaryDevice)}%` }} />
                    </div>
                  </div>
                  <div className={styles.personaSignal}>
                    <span>Digital</span>
                    <div className={styles.personaSignalTrack}>
                      <i style={{ width: `${getSignalValue("digital", digitalLevel)}%` }} />
                    </div>
                  </div>
                  <div className={styles.personaSignal}>
                    <span>Maturité</span>
                    <div className={styles.personaSignalTrack}>
                      <i style={{ width: `${getSignalValue("status", status)}%` }} />
                    </div>
                  </div>
                </div>

                <div className={styles.personaInterestRow} aria-hidden="true">
                  <span className={styles.personaInterestBadge}>
                    <MonitorSmartphone size={18} />
                  </span>
                  <span className={styles.personaInterestBadge}>
                    <ChartNoAxesColumn size={18} />
                  </span>
                  <span className={styles.personaInterestBadge}>
                    <Sparkles size={18} />
                  </span>
                  <span className={styles.personaInterestLabel}>Usage, impact, adoption</span>
                </div>
              </div>
            </div>
          </section>

          <section className={clsx(styles.personaFace, styles.personaFaceBack)}>
            <div className={styles.personaBackHeader}>
              <div>
                <span className={styles.familyEyebrow}>{backTitle}</span>
                <strong>{name}</strong>
              </div>
              <span className={styles.backHint}>Cliquer pour revenir</span>
            </div>

            <div className={styles.personaBody}>
              <div className={styles.dashboardChip}>
                <span>Dashboard conseillé</span>
                <strong>{dashboardType}</strong>
              </div>

              <div className={styles.personaBackMetaGrid}>
                <div className={styles.personaInfoPill}>
                  <strong>Profil</strong>
                  <p>{profileLabel}</p>
                </div>
                <div className={styles.personaInfoPill}>
                  <strong>Besoin principal</strong>
                  <p>{mainNeed}</p>
                </div>
                <div className={styles.personaInfoPill}>
                  <strong>Apport PlanetLS</strong>
                  <p>{platformValue}</p>
                </div>
                <div className={styles.personaInfoPill}>
                  <strong>Potentiel payant</strong>
                  <p>{potential}</p>
                </div>
              </div>

              <div className={styles.personaBlock}>
                <strong>Contexte</strong>
                <p>{context}</p>
              </div>

              {quote ? <blockquote>{quote}</blockquote> : null}

              <div className={styles.personaTriptych}>
                <div className={styles.personaListBlock}>
                  <strong>Objectifs</strong>
                  <ul>
                    {goals.slice(0, 4).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.personaListBlock}>
                  <strong>Frustrations</strong>
                  <ul>
                    {frustrations.slice(0, 4).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.personaListBlock}>
                  <strong>Besoins</strong>
                  <ul>
                    {needs.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={styles.personaBlock}>
                <strong>Première valeur attendue</strong>
                <p>{firstValue}</p>
              </div>

              <div className={styles.personaListBlock}>
                <strong>Fonctionnalités prioritaires</strong>
                <ul>
                  {priorityFeatures.slice(0, 4).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      </article>
    </button>
  );
}
