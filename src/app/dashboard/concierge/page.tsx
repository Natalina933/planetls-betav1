"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.scss";
import {
  DollarSign,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  Zap,
} from "lucide-react";

import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";

import DashboardCard from "@/app/components/dashboard/concierge/DashboardCard";
import ProUpgradeCTA from "@/app/components/dashboard/concierge/ProUpgradeCTA";
import BaseFeaturesList from "@/app/components/dashboard/concierge/BaseFeaturesList";
import ProToolsSection from "@/app/components/dashboard/concierge/ProToolsSection";
import DashboardCalendar, {
  DashboardEvent,
} from "@/app/components/dashboard/calendar/DashboardCalendar";
import ProfileExperienceBadge from "@/app/components/ui/ProfileExperienceBadge/ProfileExperienceBadge";

type ExperienceLevel = "debutant" | "intermediaire" | "experimente";

interface ConciergeUser {
  role?: string | null;
  firstName?: string | null;
  username?: string | null;
  experience_level?: ExperienceLevel | null;
  years_experience?: number | null;
}

interface ConciergeOwnerMatch {
  id: string;
  listing_id: string;
  listing_source: "property" | "housing";
  owner_profile_id: string | null;
  title: string;
  city: string | null;
  services_wanted: string[];
  matched_services: string[];
  compatibility_ratio: string | null;
  compatibility_score: number;
  distance_km: number | null;
}

interface MatchesApiResponse {
  matches?: ConciergeOwnerMatch[];
}

const eventsDemo: DashboardEvent[] = [
  {
    title: "Reservation J-1",
    start: new Date(Date.now() - 86400000),
    end: new Date(Date.now() - 79200000),
    bookingId: "D1",
    type: "booking",
  },
  {
    title: "Check-in Propriete A",
    start: new Date(),
    end: new Date(Date.now() + 3600000),
    bookingId: "C1",
    type: "booking",
  },
  {
    title: "Rappel Nettoyage",
    start: new Date(Date.now() + 172800000),
    end: new Date(Date.now() + 172800000 + 3600000),
    bookingId: "R1",
    type: "reminder",
  },
];

export default function ConciergeDashboardPage() {
  const { user, loading, isAuthenticated } = useCurrentUser() as {
    user: ConciergeUser | null;
    loading: boolean;
    isAuthenticated: boolean;
  };

  const [matches, setMatches] = useState<ConciergeOwnerMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const fetchMatches = async () => {
      try {
        setMatchesLoading(true);
        setMatchesError(null);

        const res = await fetch("/api/concierge/match-owner-requests?limit=6", {
          cache: "no-store",
        });

        if (!res.ok) {
          let errorMessage = "Impossible de charger les proprietaires compatibles";
          try {
            const body = (await res.json()) as { error?: string };
            if (typeof body.error === "string" && body.error.trim()) {
              errorMessage = body.error;
            }
          } catch {
            // keep fallback message
          }
          throw new Error(errorMessage);
        }

        const payload = (await res.json()) as MatchesApiResponse;
        if (!isMounted) return;
        setMatches(Array.isArray(payload.matches) ? payload.matches : []);
      } catch (err) {
        if (!isMounted) return;
        setMatchesError(
          err instanceof Error ? err.message : "Erreur de chargement des matchs",
        );
      } finally {
        if (isMounted) setMatchesLoading(false);
      }
    };

    fetchMatches();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  if (loading || !isAuthenticated) {
    return (
      <div className={styles.dashboardLoadingContainer}>
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="mt-4 text-lg text-gray-600">
          Chargement de votre espace concierge...
        </p>
      </div>
    );
  }

  const isPro = user?.role === "concierge_pro";
  const displayName = user?.firstName || user?.username || "Utilisateur";
  const experienceLevel = user?.experience_level ?? null;
  const yearsExperience = user?.years_experience ?? null;

  return (
    <div className={styles.conciergeDashboardPage}>
      <header className={styles.dashboardHeader}>
        <h1>
          <LayoutDashboard className={styles.headerIcon} size={32} />
          Tableau de Bord Conciergerie {isPro ? <Zap className="text-yellow-500" /> : null}
        </h1>

        <p className={styles.subtitle}>
          Bienvenue, {displayName}. Gerez l&apos;ensemble de vos proprietes et services.
        </p>

        <div className={styles.profileExperienceBadgeWrapper}>
          <ProfileExperienceBadge
            experienceLevel={experienceLevel}
            yearsExperience={yearsExperience}
            missionsCount={undefined}
            averageRating={undefined}
          />
        </div>
      </header>

      <section className={styles.matchesSection}>
        <div className={styles.matchesHeader}>
          <h2>Proprietaires compatibles</h2>
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
            Aucun proprietaire compatible pour le moment. Affinez vos missions et votre zone.
          </p>
        ) : null}

        {!matchesLoading && !matchesError && matches.length > 0 ? (
          <>
            <p className={styles.matchesInfo}>
              Nous avons trouve {matches.length} profil(s) proche(s) de votre zone.
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
                    Compatibilite: {match.compatibility_ratio ?? "n/a"}
                  </p>
                  <p className={styles.matchServices}>
                    Services:{" "}
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

      <div className={styles.dashboardGrid}>
        <DashboardCard
          title="Reservations Actives"
          value="12"
          icon={Zap}
          description="Total des sejours en cours."
        />

        <DashboardCard
          title="Demandes de Taches"
          value="3"
          icon={MessageSquare}
          description="Nouvelles demandes en attente."
        />

        <DashboardCard
          title="Revenu Potentiel"
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

      <section className={styles.dashboardSection}>
        <h2>Fonctionnalites & Outils</h2>
        <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
          <BaseFeaturesList />
          {isPro ? <ProToolsSection /> : <ProUpgradeCTA />}
        </div>
      </section>

      <section className={styles.dashboardSection}>
        <h2>Planification & Reservations</h2>
        <DashboardCalendar events={eventsDemo} title="" />
      </section>
    </div>
  );
}

