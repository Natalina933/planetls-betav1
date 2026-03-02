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
import DashboardCard from "@/app/components/dashboard/concierge/DashboardCard";
import ProUpgradeCTA from "@/app/components/dashboard/concierge/ProUpgradeCTA";
import BaseFeaturesList from "@/app/components/dashboard/concierge/BaseFeaturesList";
import ProToolsSection from "@/app/components/dashboard/concierge/ProToolsSection";
import DashboardCalendar, {
  DashboardEvent,
} from "@/app/components/dashboard/calendar/DashboardCalendar";
import ProfileExperienceBadge from "@/app/components/ui/ProfileExperienceBadge/ProfileExperienceBadge";
import type { ConciergeOwnerMatch } from "./dashboardClient";
import styles from "./page.module.scss";

type ExperienceLevel = "debutant" | "intermediaire" | "experimente";

interface DashboardHeaderProps {
  displayName: string;
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
}

interface DashboardToolsSectionProps {
  isPro: boolean;
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

interface ConciergeActionsSectionProps {
  isPro: boolean;
}

export function DashboardHeader({
  displayName,
  isPro,
  experienceLevel,
  yearsExperience,
  averageRating,
  ratingsCount,
}: DashboardHeaderProps) {
  return (
    <header className={styles.dashboardHeader}>
      <div className={styles.headerTopRow}>
        <h1>
          <LayoutDashboard className={styles.headerIcon} size={32} />
          Tableau de bord conciergerie {isPro ? <Zap className="text-yellow-500" /> : null}
        </h1>
        <span className={isPro ? styles.proBadge : styles.standardBadge}>
          {isPro ? "Statut PRO actif" : "Statut Standard"}
        </span>
      </div>

      <p className={styles.subtitle}>
        Bienvenue, {displayName}. Pilotez votre activite par objectifs, priorites terrain et actions immediates.
      </p>

      <div className={styles.headerActions}>
        <Link href="/abonnement/concierge-pro" className={styles.subscriptionLink}>
          {isPro ? "Voir mon abonnement PRO" : "Passer a Concierge PRO"}
        </Link>
        <Link href="/dashboard/concierge/recherche" className={styles.subscriptionLink}>
          Prospecter des proprietaires
        </Link>
      </div>

      <div className={styles.profileExperienceBadgeWrapper}>
        <ProfileExperienceBadge
          experienceLevel={experienceLevel}
          yearsExperience={yearsExperience}
          missionsCount={undefined}
          averageRating={averageRating}
        />
      </div>

      {typeof averageRating === "number" ? (
        <p className={styles.ratingSummary}>
          Satisfaction moyenne : {averageRating.toFixed(1)} / 5
          {ratingsCount > 0 ? ` sur ${ratingsCount} avis` : ""}
        </p>
      ) : (
        <p className={styles.ratingSummary}>Aucun avis client consolide pour le moment.</p>
      )}
    </header>
  );
}

export function ConciergeObjectivesSection({
  isPro,
  matchCount,
  averageRating,
  eventsCount,
}: ConciergeObjectivesSectionProps) {
  const objectives = [
    {
      title: "Developper le portefeuille",
      value: `${matchCount}`,
      detail:
        matchCount > 0
          ? "Proprietaires compatibles a activer en priorite."
          : "Travaillez votre positionnement pour faire remonter de nouveaux profils.",
      href: "/dashboard/concierge/recherche",
      action: "Ouvrir la prospection",
      icon: Target,
    },
    {
      title: "Fluidifier l'execution",
      value: `${eventsCount}`,
      detail:
        eventsCount > 0
          ? "Evenements planifies a suivre pour tenir vos engagements."
          : "Aucun repere agenda pour le moment. Verifiez vos prochaines missions.",
      href: "/dashboard/concierge/planning",
      action: "Voir le planning",
      icon: CalendarClock,
    },
    {
      title: "Securiser la rentabilite",
      value: isPro ? "PRO" : averageRating ? averageRating.toFixed(1) : "--",
      detail: isPro
        ? "Vos outils avances peuvent servir a consolider tarifs, devis et revenus."
        : "Passez en revue votre fiche, vos prix et vos avis pour mieux convertir.",
      href: isPro ? "/dashboard/concierge/billing" : "/abonnement/concierge-pro",
      action: isPro ? "Piloter mes revenus" : "Renforcer mon offre",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className={styles.dashboardSection}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionEyebrow}>1. Objectifs</p>
          <h2>Organisation par objectif</h2>
        </div>
        <Link href="/dashboard/concierge/objectifs" className={styles.sectionAction}>
          Voir mes objectifs
        </Link>
      </div>
      <div className={styles.focusGrid}>
        {objectives.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className={styles.focusCard}>
              <div className={styles.focusCardTop}>
                <span className={styles.focusIconWrap}>
                  <Icon size={18} />
                </span>
                <p className={styles.focusLabel}>{item.title}</p>
              </div>
              <strong className={styles.focusValue}>{item.value}</strong>
              <p className={styles.focusText}>{item.detail}</p>
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
  return (
    <section className={styles.matchesSection}>
      <div className={styles.matchesHeader}>
        <h2>Informations prioritaires</h2>
        <Link href="/dashboard/concierge/recherche" className={styles.matchesHeaderAction}>
          Ouvrir la recherche
        </Link>
      </div>

      {matchesLoading ? (
        <p className={styles.matchesInfo}>Recherche automatique en cours...</p>
      ) : null}

      {!matchesLoading && matchesError ? (
        <p className={styles.matchesError}>{matchesError}</p>
      ) : null}

      {!matchesLoading && !matchesError && matches.length === 0 ? (
        <p className={styles.matchesInfo}>
          Aucun proprietaire compatible pour le moment. Affinez votre zone, votre fiche et vos services cibles.
        </p>
      ) : null}

      {!matchesLoading && !matchesError && matches.length > 0 ? (
        <>
          <p className={styles.matchesInfo}>
            {matches.length} profil(s) compatible(s) ont ete identifies pres de votre zone. Priorisez les contacts les plus proches et les mieux alignes.
          </p>
          <div className={styles.matchesGrid}>
            {matches.map((match) => (
              <article key={match.id} className={styles.matchCard}>
                <div className={styles.matchCardHead}>
                  <h3>{match.title}</h3>
                  <span className={styles.matchScore}>{match.compatibility_score}%</span>
                </div>
                <p className={styles.matchMeta}>
                  {match.city ?? "Ville non renseignee"}
                  {typeof match.distance_km === "number" ? ` - ${match.distance_km} km` : ""}
                </p>
                <p className={styles.matchMeta}>
                  Compatibilite : {match.compatibility_ratio ?? "n/a"}
                </p>
                <p className={styles.matchServices}>
                  Services :{" "}
                  {match.services_wanted.length > 0
                    ? match.services_wanted.slice(0, 3).join(", ")
                    : "non renseignes"}
                </p>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

export function DashboardMetricsGrid({ isPro }: DashboardMetricsGridProps) {
  return (
    <section className={styles.dashboardSection}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionEyebrow}>2. Vue de pilotage</p>
          <h2>Informations a forte valeur</h2>
        </div>
      </div>
      <div className={styles.dashboardGrid}>
        <DashboardCard
          title="Reservations actives"
          value="12"
          icon={Zap}
          description="Total des sejours en cours."
        />

        <DashboardCard
          title="Demandes de taches"
          value="3"
          icon={MessageSquare}
          description="Nouvelles demandes en attente."
        />

        <DashboardCard
          title="Revenu potentiel"
          value={isPro ? "EUR 14.5k" : "Acces PRO"}
          icon={DollarSign}
          isLocked={!isPro}
          description={
            isPro
              ? "Mois en cours (estimation)."
              : "Statistiques avancees reservees aux comptes PRO."
          }
        />
      </div>
    </section>
  );
}

export function ConciergeActionsSection({ isPro }: ConciergeActionsSectionProps) {
  const actions = [
    {
      title: "Completer la fiche concierge",
      detail: "Affichez clairement votre zone, vos services et vos points forts.",
      href: "/dashboard/concierge/profile?tab=fiche",
      action: "Mettre a jour ma fiche",
    },
    {
      title: "Lancer la prospection",
      detail: "Contactez les proprietaires les plus compatibles depuis votre recherche ciblee.",
      href: "/dashboard/concierge/recherche",
      action: "Voir les opportunites",
    },
    {
      title: isPro ? "Piloter devis et factures" : "Renforcer votre offre commerciale",
      detail: isPro
        ? "Centralisez vos documents et votre suivi financier dans le workspace."
        : "Debloquez plus d'outils pour structurer vos revenus et votre image.",
      href: isPro ? "/dashboard/concierge/billing" : "/abonnement/concierge-pro",
      action: isPro ? "Ouvrir la facturation" : "Voir l'offre PRO",
    },
  ];

  return (
    <section className={styles.dashboardSection}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionEyebrow}>3. Actions a mener</p>
          <h2>Mise en avant des prochaines actions</h2>
        </div>
      </div>
      <div className={styles.focusGrid}>
        {actions.map((item) => (
          <article key={item.title} className={styles.focusCard}>
            <p className={styles.focusLabel}>{item.title}</p>
            <p className={styles.focusText}>{item.detail}</p>
            <Link href={item.href} className={styles.focusLink}>
              {item.action}
              <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export function DashboardToolsSection({ isPro }: DashboardToolsSectionProps) {
  return (
    <section className={styles.dashboardSection}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Outils</p>
          <h2>Fonctionnalites et leviers</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
        <BaseFeaturesList />
        {isPro ? <ProToolsSection /> : <ProUpgradeCTA />}
      </div>
    </section>
  );
}

export function DashboardPlanningSection({ events }: DashboardPlanningSectionProps) {
  return (
    <section className={styles.dashboardSection}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Planning</p>
          <h2>Planification et reservations</h2>
        </div>
      </div>
      <DashboardCalendar events={events} title="" />
    </section>
  );
}
