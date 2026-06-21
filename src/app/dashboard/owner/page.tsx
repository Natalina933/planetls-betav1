"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BellRing,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  Home,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { DashboardLoadingScreen } from "@/components/dashboard";
import { DashboardHomeIcon } from "@/components/ui/PublicIcon";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import type { CurrentUser } from "@/app/components/hooks/useCurrentUser";
import { formatDateValue, formatEuroAmountLabel } from "@/app/utils/formatters";
import {
  FirstLoginOnboardingPopup,
  shouldShowFirstLoginPopup,
  type OnboardingActionStatus,
  type OnboardingPath,
} from "@/features/onboarding-assistant";
import {
  UnifiedPropertyPortfolio,
  UnifiedRoleDashboard,
  type UnifiedPropertyItem,
} from "@/app/components/dashboard/unified";
import { DashboardEmptyState, DashboardStatusBadge, getDashboardMissionPaceMeta } from "@/app/components/dashboard/saas";
import { useOwnerDashboardData } from "./useOwnerDashboardData";
import styles from "./OwnerUnifiedDashboard.module.scss";

const DAY_MS = 24 * 60 * 60 * 1000;

type ActionQueueItem = {
  id: string;
  label: string;
  detail: string;
  href: string;
  tone: "info" | "warning" | "success";
  icon: "home" | "request" | "invoice" | "message" | "quote";
  kicker: string;
};

type QuoteRow = {
  id: string;
  title: string;
  status: string;
  amount: string;
  date: string;
  concierge: string;
  isRejected: boolean;
};

function getDateTime(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isWithinNextDays(value: string | null | undefined, days: number) {
  const date = getDateTime(value);
  if (!date) return false;
  const now = new Date();
  const max = new Date(now.getTime() + days * DAY_MS);
  return date >= now && date <= max;
}

function getGreetingLabel() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

function getQuoteStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "accepted":
      return "Accepté";
    case "rejected":
      return "Refusé";
    case "sent":
      return "Envoyé";
    case "expired":
      return "Expiré";
    default:
      return "À arbitrer";
  }
}

function getMissionStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "assigned":
      return "Assignée";
    case "accepted":
      return "Acceptée";
    case "to_schedule":
      return "À planifier";
    case "date_requested":
      return "Date demandée";
    case "date_proposed":
      return "Date proposée";
    case "date_confirmed":
    case "scheduled":
      return "Planifiée";
    case "in_progress":
      return "En cours";
    case "completed":
      return "Terminée";
    default:
      return "À suivre";
  }
}

function getPartnerName(name: string | null | undefined) {
  const trimmed = name?.trim();
  return trimmed || "Conciergerie à préciser";
}

function getMetadataString(metadata: Record<string, unknown> | null | undefined, keys: string[]) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function isTravelerMission(metadata: Record<string, unknown> | null | undefined) {
  return getMetadataString(metadata, ["mission_kind", "kind"]) === "traveler_stay";
}

export default function OwnerDashboardPage() {
  const { user, loading: userLoading, isAuthenticated } = useCurrentUser() as {
    user:
      | (CurrentUser & {
          availability_hours?: string | null;
          service_area?: string | null;
          service_radius_km?: number | null;
        })
      | null;
    loading: boolean;
    isAuthenticated: boolean;
  };
  const {
    properties,
    missions,
    quotes,
    requestsCount,
    activeCount,
    draftCount,
    ongoingMissions,
    pendingInvoices,
    latestQuotes,
    latestInvoices,
    averageRating,
    unreadConversationCount,
    serviceRequests,
  } = useOwnerDashboardData(isAuthenticated, { missionLimit: 24 });

  const onboardingPath: OnboardingPath = "business+";
  const [firstLoginOpen, setFirstLoginOpen] = useState(false);

  const actionStatus = useMemo<Record<string, OnboardingActionStatus>>(
    () => ({
      "configure-packs": properties.length > 0 ? "done" : "todo",
      "set-pricing": latestQuotes.length > 0 ? "done" : "todo",
      "prepare-docs": latestInvoices.length > 0 ? "done" : "todo",
    }),
    [latestInvoices.length, latestQuotes.length, properties.length],
  );

  useEffect(() => {
    if (!user?.id) return;
    const seenFlag = window.localStorage.getItem(`owner-onboarding-first-login-seen:${user.id}`);
    const shouldOpen = shouldShowFirstLoginPopup({
      firstLogin: !seenFlag,
      completionState: "in_progress",
      actionStatus,
    });
    setFirstLoginOpen(shouldOpen);
  }, [actionStatus, user?.id]);

  const ownerName = user?.firstName || user?.username || "Propriétaire";
  const greetingTitle = `${getGreetingLabel()} ${ownerName}`;

  const sortedUpcomingMissions = useMemo(
    () =>
      [...ongoingMissions].sort((left, right) => {
        const leftTime = getDateTime(left.scheduled_start)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const rightTime = getDateTime(right.scheduled_start)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return leftTime - rightTime;
      }),
    [ongoingMissions],
  );

  const travelerMissions = useMemo(
    () => missions.filter((mission) => isTravelerMission(mission.metadata)),
    [missions],
  );

  const todayMissionCount = useMemo(
    () =>
      sortedUpcomingMissions.filter((mission) => {
        const date = getDateTime(mission.scheduled_start);
        return date ? isSameLocalDay(date, new Date()) : false;
      }).length,
    [sortedUpcomingMissions],
  );

  const nextWeekMissionCount = useMemo(
    () => sortedUpcomingMissions.filter((mission) => isWithinNextDays(mission.scheduled_start, 7)).length,
    [sortedUpcomingMissions],
  );

  const arrivalsTodayCount = useMemo(
    () =>
      travelerMissions.filter((mission) => {
        const date = getDateTime(mission.scheduled_start);
        return date ? isSameLocalDay(date, new Date()) : false;
      }).length,
    [travelerMissions],
  );

  const arrivalsWeekCount = useMemo(
    () => travelerMissions.filter((mission) => isWithinNextDays(mission.scheduled_start, 7)).length,
    [travelerMissions],
  );

  const departuresWeekCount = useMemo(
    () => travelerMissions.filter((mission) => isWithinNextDays(mission.scheduled_end, 7)).length,
    [travelerMissions],
  );

  const missionPaceMeta = useMemo(() => getDashboardMissionPaceMeta(todayMissionCount), [todayMissionCount]);

  const quoteAwaitingCount = useMemo(
    () => quotes.filter((quote) => quote.status !== "accepted" && quote.status !== "rejected").length,
    [quotes],
  );

  const quoteAwaitingTotal = useMemo(
    () =>
      quotes.reduce((sum, quote) => {
        if (quote.status === "accepted" || quote.status === "rejected") return sum;
        return sum + (typeof quote.total_amount === "number" ? quote.total_amount : 0);
      }, 0),
    [quotes],
  );

  const conciergeByHousingId = useMemo(() => {
    const partners = new Map<string, string>();

    serviceRequests.forEach((request) => {
      const housingId = request.property_housing_id;
      const conciergeName = request.selected_concierge_name?.trim();
      if (housingId === null || housingId === undefined || !conciergeName) return;
      if (!partners.has(String(housingId))) partners.set(String(housingId), conciergeName);
    });

    return partners;
  }, [serviceRequests]);

  const propertyItems = useMemo<UnifiedPropertyItem[]>(
    () =>
      properties.slice(0, 8).map((property, index) => {
        const propertyMissions = sortedUpcomingMissions.filter(
          (mission) => String(mission.property_id ?? "") === String(property.id),
        );
        const propertyTravelerMissions = travelerMissions.filter(
          (mission) => String(mission.property_id ?? "") === String(property.id),
        );
        const nextMission = propertyMissions[0];
        const nextArrival = [...propertyTravelerMissions]
          .filter((mission) => Boolean(mission.scheduled_start))
          .sort((left, right) => {
            const leftTime = getDateTime(left.scheduled_start)?.getTime() ?? Number.MAX_SAFE_INTEGER;
            const rightTime = getDateTime(right.scheduled_start)?.getTime() ?? Number.MAX_SAFE_INTEGER;
            return leftTime - rightTime;
          })[0];
        const isActive = property.statut === "active" || property.statut === "published";
        const tonalCycle: UnifiedPropertyItem["tone"][] = ["soft", "gold", "clay", "ink"];
        const tone =
          propertyMissions.length > 0 ? tonalCycle[index % tonalCycle.length] : isActive ? "soft" : "neutral";

        return {
          id: String(property.id),
          name: property.nom_logement || `Logement #${property.id}`,
          location: property.ville || "Ville à préciser",
          status: isActive ? "Actif" : "À finaliser",
          eyebrow: "Bien saisonnier",
          imageSrc: property.photo_principale || null,
          imageAlt: property.nom_logement || `Logement ${property.id}`,
          icon: isActive ? <Home size={18} /> : <ShieldCheck size={18} />,
          tone,
          note:
            Array.isArray(property.infos?.equipements) && property.infos.equipements.length > 0
              ? property.infos.equipements.slice(0, 3).join(", ")
              : "Fiche, équipements et informations opérationnelles à consolider.",
          href: `/dashboard/owner/logements/${property.id}`,
          nextArrival: nextArrival
            ? formatDateValue(nextArrival.scheduled_start, {
                day: "2-digit",
                month: "short",
              }) || "À préciser"
            : "Aucune",
          nextMission: nextMission
            ? formatDateValue(nextMission.scheduled_start, {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }) || "Planifiée"
            : "Aucune",
          concierge:
            conciergeByHousingId.get(String(property.id)) ?? getPartnerName(nextMission?.concierge_name),
          metrics: [
            {
              label: "Missions",
              value: `${propertyMissions.length}`,
            },
            {
              label: "Voyageurs",
              value: `${propertyTravelerMissions.length}`,
            },
          ],
          actions: [
            {
              id: "view",
              label: "Voir",
              href: `/dashboard/owner/logements/${property.id}`,
            },
            {
              id: "edit",
              label: "Modifier",
              href: `/dashboard/owner/logements/${property.id}`,
            },
            {
              id: "contact",
              label: "Contacter concierge",
              href: "/dashboard/owner/messages",
            },
          ],
        };
      }),
    [conciergeByHousingId, properties, sortedUpcomingMissions, travelerMissions],
  );

  const timelineMissions = useMemo(
    () =>
      sortedUpcomingMissions.slice(0, 6).map((mission) => ({
        id: mission.id,
        title: mission.title || "Mission",
        status: getMissionStatusLabel(mission.status),
        partner: getPartnerName(mission.concierge_name),
        property:
          properties.find((property) => String(property.id) === String(mission.property_id ?? ""))?.nom_logement ||
          "Logement à préciser",
        date:
          formatDateValue(mission.scheduled_start, {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }) || "Date à confirmer",
      })),
    [properties, sortedUpcomingMissions],
  );

  const travelerRows = useMemo(
    () =>
      [...travelerMissions]
        .filter((mission) => Boolean(mission.scheduled_start))
        .sort((left, right) => {
          const leftTime = getDateTime(left.scheduled_start)?.getTime() ?? Number.MAX_SAFE_INTEGER;
          const rightTime = getDateTime(right.scheduled_start)?.getTime() ?? Number.MAX_SAFE_INTEGER;
          return leftTime - rightTime;
        })
        .slice(0, 4)
        .map((mission) => ({
          id: mission.id,
          title: mission.title || "Séjour voyageur",
          property:
            properties.find((property) => String(property.id) === String(mission.property_id ?? ""))?.nom_logement ||
            "Logement à préciser",
          arrival:
            formatDateValue(mission.scheduled_start, {
              day: "2-digit",
              month: "short",
            }) || "À préciser",
        })),
    [properties, travelerMissions],
  );

  const quoteRows = useMemo<QuoteRow[]>(
    () =>
      quotes.slice(0, 4).map((quote) => ({
        id: quote.id,
        title: quote.quote_number || "Devis",
        status: getQuoteStatusLabel(quote.status),
        amount: formatEuroAmountLabel(quote.total_amount),
        date:
          formatDateValue(quote.updated_at || quote.created_at, {
            day: "2-digit",
            month: "short",
          }) || "Sans date",
        concierge:
          getMetadataString(quote.metadata, ["concierge_name", "partner_name", "conciergeName"]) ||
          "Conciergerie partenaire",
        isRejected: quote.status === "rejected",
      })),
    [quotes],
  );

  const actionQueue = useMemo(
    () =>
      [
        draftCount > 0
          ? {
              id: "drafts",
              label: "Finaliser vos fiches logement",
              detail: `${draftCount} logement(s) à compléter`,
              href: "/dashboard/owner/logements",
              tone: "warning",
              icon: "home",
              kicker: "Parc",
            }
          : null,
        quoteAwaitingCount > 0
          ? {
              id: "quotes",
              label: "Arbitrer vos devis reçus",
              detail: `${quoteAwaitingCount} devis en attente`,
              href: "/dashboard/owner/devis",
              tone: "info",
              icon: "quote",
              kicker: "Devis",
            }
          : null,
        pendingInvoices.length > 0
          ? {
              id: "invoices",
              label: "Vérifier vos factures",
              detail: `${pendingInvoices.length} facture(s) à surveiller`,
              href: "/dashboard/owner/factures",
              tone: "warning",
              icon: "invoice",
              kicker: "Finance",
            }
          : null,
        unreadConversationCount > 0
          ? {
              id: "messages",
              label: "Répondre à vos messages",
              detail: `${unreadConversationCount} message(s) non lus`,
              href: "/dashboard/owner/messages",
              tone: "info",
              icon: "message",
              kicker: "Messagerie",
            }
          : null,
        requestsCount > 0
          ? {
              id: "requests",
              label: "Suivre vos demandes en cours",
              detail: `${requestsCount} demande(s) ouverte(s)`,
              href: "/dashboard/owner/demandes",
              tone: "success",
              icon: "request",
              kicker: "Demandes",
            }
          : null,
      ].filter((item): item is ActionQueueItem => item !== null),
    [draftCount, pendingInvoices.length, quoteAwaitingCount, requestsCount, unreadConversationCount],
  );

  if (userLoading || !isAuthenticated) {
    return <DashboardLoadingScreen label="Chargement de votre espace propriétaire..." />;
  }

  return (
    <div className="theme-owner">
      <UnifiedRoleDashboard
        role="owner"
        title={greetingTitle}
        subtitle="Voici l'état de vos locations aujourd'hui."
        experienceBadge={averageRating ? `${averageRating.toFixed(1)} / 5` : "Pilotage premium"}
        statusLabel={draftCount > 0 ? `${draftCount} fiche(s) à finaliser` : "Parc sous contrôle"}
        actions={[
          {
            id: "properties",
            label: "Mes logements",
            href: "/dashboard/owner/logements",
            tone: "primary",
          },
          {
            id: "travelers",
            label: "Séjours voyageurs",
            href: "/dashboard/owner/missions/voyageurs",
            tone: "secondary",
          },
          {
            id: "profile",
            label: "Mon profil",
            href: "/dashboard/owner/settings",
            tone: "ghost",
          },
        ]}
        kpis={[
          {
            id: "properties",
            label: "Logements actifs",
            value: `${activeCount}`,
            detail: `${properties.length} logement(s) au total`,
            icon: <DashboardHomeIcon size={22} />,
            statusLabel: draftCount > 0 ? `${draftCount} à revoir` : "Stable",
            statusTone: draftCount > 0 ? "warning" : "success",
            href: "/dashboard/owner/logements",
          },
          {
            id: "missions",
            label: "Missions à venir",
            value: `${nextWeekMissionCount}`,
            detail: todayMissionCount > 0 ? `${todayMissionCount} aujourd'hui` : "Aucune aujourd'hui",
            icon: <CalendarDays size={18} />,
            statusLabel: missionPaceMeta.label,
            statusTone: missionPaceMeta.tone,
            statusIcon: missionPaceMeta.icon,
            statusIconOnly: missionPaceMeta.level === "calm",
            statusText: missionPaceMeta.label,
            href: "/dashboard/owner/planning",
          },
          {
            id: "travelers",
            label: "Voyageurs attendus",
            value: `${arrivalsWeekCount}`,
            detail: arrivalsTodayCount > 0 ? `${arrivalsTodayCount} arrivée(s) aujourd'hui` : "Aucune arrivée aujourd'hui",
            icon: <Users size={18} />,
            statusLabel: departuresWeekCount > 0 ? `${departuresWeekCount} départs` : "Aucun départ",
            statusTone: arrivalsWeekCount > 0 ? "info" : "success",
            href: "/dashboard/owner/missions/voyageurs",
          },
          {
            id: "quotes",
            label: "Devis reçus",
            value: `${quoteAwaitingCount}`,
            detail:
              quoteAwaitingCount > 0
                ? `${formatEuroAmountLabel(quoteAwaitingTotal)} à arbitrer`
                : "Aucun devis en attente",
            icon: <FileCheck2 size={18} />,
            statusLabel: quoteAwaitingCount > 0 ? "Action requise" : "À jour",
            statusTone: quoteAwaitingCount > 0 ? "warning" : "success",
            href: "/dashboard/owner/devis",
          },
          {
            id: "requests",
            label: "Demandes en cours",
            value: `${requestsCount}`,
            detail: unreadConversationCount > 0 ? `${unreadConversationCount} message(s) non lus` : "Suivi stable",
            icon: <ClipboardList size={18} />,
            statusLabel: unreadConversationCount > 0 ? "Messages à lire" : "Coordination OK",
            statusTone: unreadConversationCount > 0 ? "info" : "success",
            href: "/dashboard/owner/demandes",
          },
        ]}
        leftPrimary={
          <section className={styles.contentBlock}>
            <div className={styles.blockHeader}>
              <h3>Prochaines missions</h3>
              <p>Les interventions à surveiller, dans leur ordre d'arrivée.</p>
            </div>
            {timelineMissions.length > 0 ? (
              <div className={styles.timelineList}>
                {timelineMissions.slice(0, 5).map((mission) => (
                  <Link key={mission.id} href="/dashboard/owner/planning" className={styles.timelineRow}>
                    <span className={styles.timelineDot}>
                      <CalendarDays size={16} />
                    </span>
                    <div className={styles.timelineCopy}>
                      <div className={styles.timelineTopline}>
                        <strong>{mission.title}</strong>
                        <DashboardStatusBadge label={mission.status} tone="info" className={styles.timelineBadge} />
                      </div>
                      <span>{mission.property}</span>
                      <small>{mission.partner}</small>
                    </div>
                    <time>{mission.date}</time>
                  </Link>
                ))}
              </div>
            ) : (
              <DashboardEmptyState
                title="Aucune mission planifiée"
                copy="Vos prochaines interventions apparaîtront ici dès qu'elles seront programmées."
              />
            )}
          </section>
        }
        leftSecondary={
          <section className={styles.contentBlock}>
            <div className={styles.blockHeader}>
              <h3>Mes logements</h3>
              <p>Des cartes plus compactes pour voir plusieurs biens, leurs arrivées et leur prochaine mission d'un coup.</p>
            </div>
            <UnifiedPropertyPortfolio
              items={propertyItems}
              emptyHref="/dashboard/owner/logements/create"
              emptyLabel="Ajoutez votre premier logement pour activer le cockpit propriétaire."
            />
          </section>
        }
        mainSections={[]}
        sidebarSections={[
          {
            id: "priorities",
            title: "À traiter maintenant",
            subtitle: "Les actions utiles, sans liste interminable.",
            content:
              actionQueue.length > 0 ? (
                <div className={styles.actionQueue}>
                  {actionQueue.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`${styles.actionQueueRow} ${styles[`actionQueueRow${item.tone.charAt(0).toUpperCase()}${item.tone.slice(1)}`]}`}
                    >
                      <span className={styles.actionQueueIcon}>
                        {item.icon === "home" ? (
                          <Home size={18} />
                        ) : item.icon === "request" ? (
                          <ClipboardList size={18} />
                        ) : item.icon === "invoice" ? (
                          <Wallet size={18} />
                        ) : item.icon === "quote" ? (
                          <CircleDollarSign size={18} />
                        ) : (
                          <BellRing size={18} />
                        )}
                      </span>
                      <div className={styles.actionQueueBody}>
                        <small>{item.kicker}</small>
                        <strong>{item.label}</strong>
                        <span>{item.detail}</span>
                      </div>
                      <span className={styles.actionQueueArrow}>
                        <ChevronRight size={16} />
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState title="Rien d'urgent" copy="Votre tableau est à jour pour le moment." />
              ),
          },
          {
            id: "travellers",
            title: "Séjours à venir",
            subtitle: "Les repères voyageurs de la semaine.",
            content: (
              <>
                <div className={styles.travelerSummaryGrid}>
                  <article className={styles.summaryStatCard}>
                    <span>Arrivées aujourd'hui</span>
                    <strong>{arrivalsTodayCount}</strong>
                  </article>
                  <article className={styles.summaryStatCard}>
                    <span>Cette semaine</span>
                    <strong>{arrivalsWeekCount}</strong>
                  </article>
                  <article className={styles.summaryStatCard}>
                    <span>Départs</span>
                    <strong>{departuresWeekCount}</strong>
                  </article>
                </div>
                {travelerRows.length > 0 ? (
                  <div className={styles.miniList}>
                    {travelerRows.slice(0, 3).map((traveler) => (
                      <Link key={traveler.id} href="/dashboard/owner/missions/voyageurs" className={styles.miniRow}>
                        <div>
                          <strong>{traveler.title}</strong>
                          <span>{traveler.property}</span>
                        </div>
                        <small>{traveler.arrival}</small>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </>
            ),
          },
          {
            id: "quotes-list",
            title: "Dernier devis",
            subtitle: "Le devis le plus récent, accessible en un clic.",
            content: (
              <div className={`${styles.sideCompactBlock} ${styles.quoteBoard}`}>
                {quoteRows.length > 0 ? (
                  quoteRows.slice(0, 1).map((quote) =>
                    quote.isRejected ? (
                      <article key={quote.id} className={`${styles.quoteRow} ${styles.quoteRowCompact} ${styles.quoteRowDisabled}`}>
                        <div className={styles.quoteHeaderLine}>
                          <div className={styles.quoteIdentity}>
                            <span className={styles.quoteIcon}>
                              <CircleDollarSign size={16} />
                            </span>
                            <div>
                              <strong>{quote.title}</strong>
                            </div>
                          </div>
                        </div>
                        <div className={styles.quoteInfoGrid}>
                          <div className={styles.quoteInfoCell}>
                            <small>Conciergerie</small>
                            <strong>{quote.concierge}</strong>
                          </div>
                          <div className={styles.quoteInfoCell}>
                            <small>Montant</small>
                            <strong>{quote.amount}</strong>
                          </div>
                          <div className={styles.quoteInfoCell}>
                            <small>Date</small>
                            <strong>{quote.date}</strong>
                          </div>
                          <div className={styles.quoteInfoCell}>
                            <small>Statut</small>
                            <strong>{quote.status}</strong>
                          </div>
                        </div>
                        <div className={styles.quoteFooter}>
                          <span className={styles.inlineActionDisabled}>Sélection indisponible</span>
                        </div>
                      </article>
                    ) : (
                      <Link key={quote.id} href="/dashboard/owner/devis" className={`${styles.quoteRow} ${styles.quoteRowCompact} ${styles.quoteRowLink}`}>
                        <div className={styles.quoteHeaderLine}>
                          <div className={styles.quoteIdentity}>
                            <span className={styles.quoteIcon}>
                              <CircleDollarSign size={16} />
                            </span>
                            <div>
                              <strong>{quote.title}</strong>
                            </div>
                          </div>
                          <span className={styles.quoteHeaderArrow}>
                            <ChevronRight size={16} />
                          </span>
                        </div>
                        <div className={styles.quoteInfoGrid}>
                          <div className={styles.quoteInfoCell}>
                            <small>Conciergerie</small>
                            <strong>{quote.concierge}</strong>
                          </div>
                          <div className={styles.quoteInfoCell}>
                            <small>Montant</small>
                            <strong>{quote.amount}</strong>
                          </div>
                          <div className={styles.quoteInfoCell}>
                            <small>Date</small>
                            <strong>{quote.date}</strong>
                          </div>
                          <div className={styles.quoteInfoCell}>
                            <small>Statut</small>
                            <strong>{quote.status}</strong>
                          </div>
                        </div>
                        <div className={styles.quoteFooter}>
                          <DashboardStatusBadge label={quote.status} tone="warning" />
                        </div>
                      </Link>
                    ),
                  )
                ) : (
                  <DashboardEmptyState
                    title="Aucun devis récent"
                    copy="Les derniers devis reçus apparaîtront ici pour une lecture rapide."
                  />
                )}
              </div>
            ),
          },
        ]}
        disclosures={[]}
      />

      <FirstLoginOnboardingPopup
        path={onboardingPath}
        open={firstLoginOpen}
        onClose={() => {
          setFirstLoginOpen(false);
          if (user?.id) {
            window.localStorage.setItem(`owner-onboarding-first-login-seen:${user.id}`, "1");
          }
        }}
      />
    </div>
  );
}
