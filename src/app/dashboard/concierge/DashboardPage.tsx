"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  GripVertical,
  Home,
  MessageSquareText,
  PackagePlus,
  Search,
  Settings2,
  SlidersHorizontal,
  UserRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { DashboardLoadingScreen, ReadabilityControls } from "@/components/dashboard";
import { AsyncState, Badge, Card, CardBody } from "@/components/ui";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { formatDateValue } from "@/app/utils/formatters";
import type { CurrentUser } from "@/app/components/hooks/useCurrentUser";
import { parseOnboardingDetails } from "@/features/onboarding-assistant";
import { useConciergeDashboardData } from "./useConciergeDashboardData";
import ConciergeWelcomeNextStep from "./ConciergeWelcomeNextStep";
import NextStepsPopup from "./NextStepsPopup";
import type { ConciergeOwnerMatch } from "./dashboardClient";
import styles from "./Dashboard.module.scss";

type DashboardMode = "essential" | "expert";
type KpiId = "revenue" | "urgent" | "messages";

const KPI_STORAGE_KEY = "planetls-concierge-kpi-order";

const formatMinutes = (value?: number | null) => {
  if (typeof value !== "number") return "--";
  if (value < 60) return `${Math.round(value)} min`;
  return `${Math.round(value / 60)} h`;
};

const readKpiOrder = (): KpiId[] => {
  if (typeof window === "undefined") return ["revenue", "urgent", "messages"];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KPI_STORAGE_KEY) ?? "[]") as KpiId[];
    const allowed = new Set<KpiId>(["revenue", "urgent", "messages"]);
    const clean = parsed.filter((item): item is KpiId => allowed.has(item));
    return clean.length === 3 ? clean : ["revenue", "urgent", "messages"];
  } catch {
    return ["revenue", "urgent", "messages"];
  }
};

const getMatchHref = (match: ConciergeOwnerMatch) =>
  match.listing_source === "housing" && match.listing_id
    ? `/dashboard/concierge/logements/${match.listing_id}`
    : "/dashboard/concierge/recherche";

export default function DashboardPage() {
  const [mode, setMode] = useState<DashboardMode>("essential");
  const [nextStepsOpen, setNextStepsOpen] = useState(false);
  const [kpiOrder, setKpiOrder] = useState<KpiId[]>(["revenue", "urgent", "messages"]);
  const { user, loading, isAuthenticated } = useCurrentUser() as {
    user:
      | (CurrentUser & {
          experience_level?: string | null;
          years_experience?: number | null;
        })
      | null;
    loading: boolean;
    isAuthenticated: boolean;
  };
  const { matches, matchesLoading, matchesError, kpis, plannedNow } =
    useConciergeDashboardData(isAuthenticated);

  useEffect(() => {
    setKpiOrder(readKpiOrder());
  }, []);

  const onboarding = useMemo(
    () => parseOnboardingDetails(user?.availability_hours),
    [user?.availability_hours],
  );

  const urgentCount = useMemo(
    () => plannedNow.filter((event) => event.type === "reminder").length,
    [plannedNow],
  );
  const isProfileComplete = Boolean(user?.firstName && user?.service_area && user?.service_radius_km);
  const servicesReady = Boolean(matches.length || onboarding.propertyTypes.length || user?.service_radius_km);
  const pricingReady = Boolean(kpis?.avg_response_minutes || mode === "expert");

  const kpiItems = {
    revenue: {
      id: "revenue" as const,
      label: "Revenu jour",
      value: mode === "expert" ? `${kpis?.completed ?? 0}` : "--",
      hint: mode === "expert" ? "missions terminées" : "à connecter",
      delta: mode === "expert" ? "+5%" : "Setup",
      icon: WalletCards,
      tone: "gold",
    },
    urgent: {
      id: "urgent" as const,
      label: "Urgences",
      value: `${urgentCount}`,
      hint: `${plannedNow.length} mission(s) planifiée(s)`,
      delta: urgentCount > 0 ? "Priorite" : "Stable",
      icon: Zap,
      tone: urgentCount > 0 ? "danger" : "success",
    },
    messages: {
      id: "messages" as const,
      label: "Messages",
      value: formatMinutes(kpis?.avg_response_minutes),
      hint: "temps réponse",
      delta: "SLA",
      icon: MessageSquareText,
      tone: "info",
    },
  };

  const rotateKpis = () => {
    const [first, ...rest] = kpiOrder;
    const next = first ? [...rest, first] : kpiOrder;
    setKpiOrder(next);
    window.localStorage.setItem(KPI_STORAGE_KEY, JSON.stringify(next));
  };

  if (loading || !isAuthenticated) {
    return <DashboardLoadingScreen label="Chargement de votre espace conciergerie..." />;
  }

  const profileName = user?.company_name || user?.firstName || user?.username || "Conciergerie";

  return (
    <main className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.identity}>
          <span className={styles.avatar}>
            <UserRound size={24} aria-hidden="true" />
          </span>
          <div>
            <h1>Accueil</h1>
            <p>{profileName}</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <ReadabilityControls />
          <div className={styles.modeSwitch} role="group" aria-label="Mode dashboard">
            <button
              type="button"
              aria-pressed={mode === "essential"}
              onClick={() => setMode("essential")}
            >
              Essentiel
            </button>
            <button type="button" aria-pressed={mode === "expert"} onClick={() => setMode("expert")}>
              Expert
            </button>
          </div>
          <Link href="/dashboard/concierge/alertes" className={styles.iconButton} aria-label="Notifications">
            <Bell size={22} aria-hidden="true" />
            {urgentCount > 0 ? <span className={styles.notificationBadge}>{urgentCount}</span> : null}
          </Link>
        </div>
      </header>

      <section className={styles.todaySection} aria-labelledby="today-title">
        <div className={styles.sectionHeader}>
          <div>
            <Badge variant="gold">Aujourd'hui</Badge>
            <h2 id="today-title">Vue rapide</h2>
          </div>
          <button type="button" className={styles.reorderButton} onClick={rotateKpis}>
            <GripVertical size={18} aria-hidden="true" />
            Réorganiser
          </button>
        </div>

        <div className={styles.kpiGrid}>
          {kpiOrder.map((id) => {
            const item = kpiItems[id];
            const Icon = item.icon;
            return (
              <Card key={item.id} className={`${styles.kpiCard} ${styles[item.tone]}`} tone="soft">
                <CardBody className={styles.kpiBody}>
                  <span className={styles.kpiIcon}>
                    <Icon size={30} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div>
                    <p>
                      {item.label}
                      <span>{item.delta}</span>
                    </p>
                    <strong>{item.value}</strong>
                    <small>{item.hint}</small>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </section>

      <ConciergeWelcomeNextStep availabilityHours={user?.availability_hours} />

      <section className={styles.missionsSection} aria-labelledby="missions-title">
        <div className={styles.sectionHeader}>
          <div>
            <Badge variant="info">Mes missions</Badge>
            <h2 id="missions-title">Proches et utiles</h2>
          </div>
          <Link href="/dashboard/concierge/planning" className={styles.inlineLink}>
            Planning
          </Link>
        </div>

        <AsyncState
          loading={matchesLoading}
          error={matchesError}
          loadingLabel="Chargement des missions proches..."
        >
          <div className={styles.missionRail}>
            {matches.length > 0 ? (
              matches.slice(0, mode === "expert" ? 6 : 3).map((match) => (
                <Link key={match.id} href={getMatchHref(match)} className={styles.missionCard}>
                  <span className={styles.missionIllustration}>
                    <Home size={34} strokeWidth={2.1} aria-hidden="true" />
                  </span>
                  <strong>{match.title}</strong>
                  <span className={styles.statusBadge}>
                    {match.compatibility_score >= 80 ? "Prioritaire" : "A qualifier"}
                  </span>
                  <p>{match.city || "Ville à préciser"}</p>
                  <div className={styles.missionMeta}>
                    <span>{match.compatibility_score}%</span>
                    <span>{match.distance_km ? `${match.distance_km.toFixed(1)} km` : "local"}</span>
                  </div>
                  <span className={styles.missionCta}>Accepter</span>
                </Link>
              ))
            ) : (
              plannedNow.slice(0, 3).map((event, index) => (
                <Link key={`${event.bookingId}-${index}`} href="/dashboard/concierge/planning" className={styles.missionCard}>
                  <span className={styles.missionIllustration}>
                    <CalendarClock size={34} strokeWidth={2.1} aria-hidden="true" />
                  </span>
                  <strong>{String(event.title || "Mission")}</strong>
                  <span className={styles.statusBadge}>
                    {event.type === "reminder" ? "Urgent" : "Planifie"}
                  </span>
                  <p>{formatDateValue(event.start, { day: "2-digit", month: "short", hour: "2-digit" })}</p>
                  <div className={styles.missionMeta}>
                    <span>{event.type === "reminder" ? "urgent" : "prévu"}</span>
                    <span>planning</span>
                  </div>
                  <span className={styles.missionCta}>Voir</span>
                </Link>
              ))
            )}
          </div>
        </AsyncState>
      </section>

      <section className={styles.actionsSection} aria-labelledby="actions-title">
        <div className={styles.sectionHeader}>
          <div>
            <Badge variant="neutral">Actions rapides</Badge>
            <h2 id="actions-title">Faire maintenant</h2>
          </div>
        </div>

        <div className={styles.actionGrid}>
          <Link href="/dashboard/concierge/logements/create" className={styles.actionCard}>
            <PackagePlus size={32} aria-hidden="true" />
            <span>Ajouter un bien</span>
          </Link>
          <Link href="/dashboard/concierge/recherche" className={styles.actionCard}>
            <Search size={32} aria-hidden="true" />
            <span>Trouver propriétaire</span>
          </Link>
          <Link href="/dashboard/concierge/pricing" className={styles.actionCard}>
            <SlidersHorizontal size={32} aria-hidden="true" />
            <span>Tarifs</span>
          </Link>
          <button type="button" className={styles.actionCard} onClick={() => setNextStepsOpen(true)}>
            <Settings2 size={32} aria-hidden="true" />
            <span>Prochaines étapes</span>
          </button>
        </div>
      </section>

      <nav className={styles.bottomNav} aria-label="Navigation concierge">
        <Link href="/dashboard/concierge" aria-current="page">
          <BriefcaseBusiness size={22} aria-hidden="true" />
          Accueil
        </Link>
        <Link href="/dashboard/concierge/logements">
          <Home size={22} aria-hidden="true" />
          Biens
        </Link>
        <Link href="/dashboard/concierge/messages">
          <MessageSquareText size={22} aria-hidden="true" />
          Messages
        </Link>
        <Link href="/dashboard/concierge/profile?tab=fiche">
          <UserRound size={22} aria-hidden="true" />
          Profil
        </Link>
      </nav>

      <NextStepsPopup
        open={nextStepsOpen}
        availabilityHours={user?.availability_hours}
        profileComplete={isProfileComplete}
        servicesReady={servicesReady}
        pricingReady={pricingReady}
        onClose={() => setNextStepsOpen(false)}
      />
    </main>
  );
}
