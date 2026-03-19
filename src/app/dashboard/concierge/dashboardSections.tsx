"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  DollarSign,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import DashboardCalendar, {
  type DashboardEvent,
} from "@/components/dashboard/calendar/DashboardCalendar";
import ProfileExperienceBadge from "@/components/ui/ProfileExperienceBadge/ProfileExperienceBadge";
import type { ConciergeOwnerMatch } from "./dashboardClient";
import styles from "./page.module.scss";

type ExperienceLevel = "debutant" | "intermediaire" | "experimente";

interface DashboardHeaderProps {
  isPro: boolean;
  experienceLevel: ExperienceLevel | null;
  yearsExperience: number | null;
  averageRating: number | null;
  ratingsCount: number;
}

interface MatchesSectionProps {
  matches: ConciergeOwnerMatch[];
  matchesLoading: boolean;
  matchesError: string | null;
}

interface DashboardMetricsGridProps {
  isPro: boolean;
  matchCount: number;
  eventsCount: number;
  inProgressCount: number | null;
  totalMissions: number | null;
  avgResponseMinutes: number | null;
}

interface DashboardPlanningSectionProps {
  events: DashboardEvent[];
}

interface ConciergeObjectivesSectionProps {
  isPro: boolean;
  matchCount: number;
  averageRating: number | null;
  eventsCount: number;
}

export function DashboardHeader({
  isPro,
  experienceLevel,
  yearsExperience,
  averageRating,
  ratingsCount,
}: DashboardHeaderProps) {
  return (
    <header className={styles.dashboardHero}>
      <div className={styles.heroTopRow}>
        <div className={styles.heroTitleBlock}>
          <h1>
            <LayoutDashboard className={styles.headerIcon} size={28} />
            Tableau de bord
          </h1>
          <p className={styles.heroLead}>Vue rapide de vos priorités du jour.</p>
        </div>
        <span className={isPro ? styles.proBadge : styles.standardBadge}>
          {isPro ? "PRO" : "Standard"}
        </span>
      </div>

      <div className={styles.heroMetaRow}>
        <div className={styles.profileExperienceBadgeWrapper}>
          <ProfileExperienceBadge
            experienceLevel={experienceLevel}
            yearsExperience={yearsExperience}
            missionsCount={undefined}
            averageRating={averageRating}
          />
        </div>
        <p className={styles.ratingSummary}>
          {typeof averageRating === "number"
            ? `Note moyenne ${averageRating.toFixed(1)} / 5${ratingsCount > 0 ? ` sur ${ratingsCount} avis` : ""}`
            : "Aucun avis client consolidé pour le moment."}
        </p>
      </div>

      <div className={styles.headerActions}>
        <Link
          href={isPro ? "/dashboard/concierge/profile?tab=devis" : "/abonnement/concierge-pro"}
          className={styles.subscriptionLink}
        >
          {isPro ? "Voir mes finances" : "Passer à Concierge PRO"}
        </Link>
      </div>
    </header>
  );
}

export function DashboardMetricsGrid({
  isPro,
  matchCount,
  eventsCount,
  inProgressCount,
  totalMissions,
  avgResponseMinutes,
}: DashboardMetricsGridProps) {
  const metrics = [
    {
      title: "Missions aujourd'hui",
      value: String(eventsCount),
      description: "Créneaux prévus dans votre planning.",
      icon: CalendarClock,
    },
    {
      title: "Missions en cours",
      value: inProgressCount === null ? "--" : String(inProgressCount),
      description:
        totalMissions && totalMissions > 0
          ? `${totalMissions} mission(s) suivie(s) au total.`
          : "Aucune mission historisée pour le moment.",
      icon: Zap,
    },
    {
      title: "Propriétaires compatibles",
      value: String(matchCount),
      description: "Contacts chauds à activer.",
      icon: Target,
    },
    {
      title: isPro ? "Réponse moyenne" : "Finances",
      value: isPro
        ? avgResponseMinutes === null
          ? "--"
          : `${Math.round(avgResponseMinutes)} min`
        : "PRO",
      description: isPro
        ? "Temps moyen de réponse sur vos missions."
        : "Passez à PRO pour le suivi financier avancé.",
      icon: DollarSign,
      locked: !isPro,
    },
  ];

  return (
    <section className={styles.metricsStrip}>
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <article key={metric.title} className={styles.metricCard}>
            <div className={styles.metricHead}>
              <span className={styles.metricIcon}>
                <Icon size={16} />
              </span>
              <p className={styles.metricLabel}>{metric.title}</p>
            </div>
            <strong className={styles.metricValue}>{metric.value}</strong>
            <p className={styles.metricDescription}>{metric.description}</p>
            {metric.locked ? <span className={styles.metricLock}>Accès PRO</span> : null}
          </article>
        );
      })}
    </section>
  );
}

export function ConciergeObjectivesSection({
  isPro,
  matchCount,
  averageRating,
  eventsCount,
}: ConciergeObjectivesSectionProps) {
  const actions = [
    {
      title: "Propriétaires à contacter",
      value: `${matchCount}`,
      detail:
        matchCount > 0
          ? "Profils compatibles détectés dans votre zone."
          : "Aucun contact chaud pour le moment. Affinez votre fiche et votre zone.",
      href: "/dashboard/concierge/recherche",
      action: "Ouvrir la prospection",
      icon: Target,
    },
    {
      title: "Missions à suivre",
      value: `${eventsCount}`,
      detail:
        eventsCount > 0
          ? "Événements planifiés à confirmer et exécuter."
          : "Aucun événement à suivre pour l'instant.",
      href: "/dashboard/concierge/planning",
      action: "Voir le planning",
      icon: CalendarClock,
    },
    {
      title: isPro ? "Devis & factures" : "Offre commerciale",
      value: isPro ? "Prêt" : averageRating ? averageRating.toFixed(1) : "--",
      detail: isPro
        ? "Centralisez vos documents et votre suivi financier."
        : "Renforcez votre offre pour structurer revenus et conversion.",
      href: isPro ? "/dashboard/concierge/profile?tab=devis" : "/abonnement/concierge-pro",
      action: isPro ? "Ouvrir les finances" : "Voir l'offre PRO",
      icon: isPro ? DollarSign : ShieldCheck,
    },
    {
      title: "Fiche à compléter",
      value: "Profil",
      detail: "Zone, services, documents et points forts doivent rester à jour.",
      href: "/dashboard/concierge/profile?tab=fiche",
      action: "Mettre à jour ma fiche",
      icon: MessageSquare,
    },
  ];

  return (
    <section className={styles.dashboardSection}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Priorité du jour</p>
          <h2>Actions immédiates</h2>
        </div>
      </div>
      <div className={styles.priorityGrid}>
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className={styles.priorityCard}>
              <div className={styles.priorityTop}>
                <span className={styles.priorityIcon}>
                  <Icon size={18} />
                </span>
                <span className={styles.priorityValue}>{item.value}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
              <Link href={item.href} className={styles.focusLink}>
                {item.action}
                <ArrowRight size={16} />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function MatchesSection({
  matches,
  matchesLoading,
  matchesError,
}: MatchesSectionProps) {
  const buildMatchHref = (match: ConciergeOwnerMatch) => {
    if (match.listing_source === "housing") {
      return `/dashboard/concierge/logements/${match.listing_id}`;
    }

    return "/dashboard/concierge/recherche";
  };

  return (
    <section className={styles.matchesSection}>
      <div className={styles.matchesHeader}>
        <h2>Propriétaires à activer</h2>
        <Link href="/dashboard/concierge/recherche" className={styles.matchesHeaderAction}>
          Voir tous les profils
        </Link>
      </div>

      {matchesLoading ? <p className={styles.matchesInfo}>Recherche automatique en cours...</p> : null}

      {!matchesLoading && matchesError ? (
        <p className={styles.matchesError}>{matchesError}</p>
      ) : null}

      {!matchesLoading && !matchesError && matches.length === 0 ? (
        <p className={styles.matchesInfo}>
          Aucun propriétaire compatible pour le moment. Affinez votre zone, votre fiche et vos
          services cibles.
        </p>
      ) : null}

      {!matchesLoading && !matchesError && matches.length > 0 ? (
        <>
          <p className={styles.matchesInfo}>
            {matches.length} profil(s) compatible(s) identifiés près de votre zone. Commencez par
            les plus proches et les mieux alignés.
          </p>
          <div className={styles.matchesGrid}>
            {matches.map((match) => (
              <Link key={match.id} href={buildMatchHref(match)} className={styles.matchCardLink}>
                <article className={styles.matchCard}>
                  <div className={styles.matchCardHead}>
                    <h3>{match.title}</h3>
                    <span className={styles.matchScore}>{match.compatibility_score}%</span>
                  </div>
                  <p className={styles.matchMeta}>
                    {match.city ?? "Ville non renseignée"}
                    {typeof match.distance_km === "number" ? ` - ${match.distance_km} km` : ""}
                  </p>
                  <p className={styles.matchMeta}>
                    Compatibilité : {match.compatibility_ratio ?? "n/a"}
                  </p>
                  <p className={styles.matchServices}>
                    Services :{" "}
                    {match.services_wanted.length > 0
                      ? match.services_wanted.slice(0, 3).join(", ")
                      : "non renseignés"}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

export function DashboardPlanningSection({ events }: DashboardPlanningSectionProps) {
  return (
    <section className={styles.dashboardSection}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Planning</p>
          <h2>Planning des missions</h2>
        </div>
      </div>
      <DashboardCalendar events={events} title="" />
    </section>
  );
}
