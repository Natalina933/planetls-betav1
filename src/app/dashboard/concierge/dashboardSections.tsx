"use client";

import Link from "next/link";
import {
  DollarSign,
  LayoutDashboard,
  MessageSquare,
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
        Bienvenue, {displayName}. Gérez l&apos;ensemble de vos propriétés et services.
      </p>

      <div className={styles.headerActions}>
        <Link href="/abonnement/concierge-pro" className={styles.subscriptionLink}>
          {isPro ? "Voir mon abonnement PRO" : "Passer à Concierge PRO"}
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
        <p className={styles.ratingSummary}>
          Aucun avis client consolidé pour le moment.
        </p>
      )}
    </header>
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
        <h2>Propriétaires compatibles</h2>
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
          Aucun propriétaire compatible pour le moment. Affinez vos missions et votre zone.
        </p>
      ) : null}

      {!matchesLoading && !matchesError && matches.length > 0 ? (
        <>
          <p className={styles.matchesInfo}>
            Nous avons trouvé {matches.length} profil(s) proche(s) de votre zone.
          </p>
          <div className={styles.matchesGrid}>
            {matches.map((match) => (
              <article key={match.id} className={styles.matchCard}>
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
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

export function DashboardMetricsGrid({ isPro }: DashboardMetricsGridProps) {
  return (
    <div className={styles.dashboardGrid}>
      <DashboardCard
        title="Réservations actives"
        value="12"
        icon={Zap}
        description="Total des séjours en cours."
      />

      <DashboardCard
        title="Demandes de tâches"
        value="3"
        icon={MessageSquare}
        description="Nouvelles demandes en attente."
      />

      <DashboardCard
        title="Revenu potentiel"
        value={isPro ? "EUR 14.5k" : "Accès PRO"}
        icon={DollarSign}
        isLocked={!isPro}
        description={
          isPro
            ? "Mois en cours (estimation)."
            : "Statistiques avancées réservées aux comptes PRO."
        }
      />
    </div>
  );
}

export function DashboardToolsSection({ isPro }: DashboardToolsSectionProps) {
  return (
    <section className={styles.dashboardSection}>
      <h2>Fonctionnalités & outils</h2>
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
      <h2>Planification & réservations</h2>
      <DashboardCalendar events={events} title="" />
    </section>
  );
}
