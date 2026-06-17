"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BellRing,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileText,
  Home,
  RefreshCcw,
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
  DashboardOnboardingSummary,
  FirstLoginOnboardingPopup,
  OnboardingPromptCard,
  shouldShowDashboardReminder,
  shouldShowFirstLoginPopup,
  type OnboardingActionStatus,
  type OnboardingPath,
} from "@/features/onboarding-assistant";
import {
  UnifiedPropertyPortfolio,
  UnifiedRoleDashboard,
  UnifiedStatStack,
  type UnifiedPropertyItem,
  type UnifiedStatItem,
} from "@/app/components/dashboard/unified";
import { DashboardEmptyState, DashboardStatusBadge, getDashboardMissionPaceMeta } from "@/app/components/dashboard/saas";
import { useOwnerDashboardData } from "./useOwnerDashboardData";
import styles from "./OwnerUnifiedDashboard.module.scss";

const DAY_MS = 24 * 60 * 60 * 1000;

type DashboardActivityItem = {
  id: string;
  kind: "quote" | "mission" | "message" | "invoice";
  title: string;
  detail: string;
  date: Date | null;
  dateLabel: string;
  href?: string;
};

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

function getInvoiceStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "paid":
      return "Réglée";
    case "canceled":
      return "Annulée";
    case "overdue":
      return "En retard";
    default:
      return "À vérifier";
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
    conversations,
    requestsCount,
    activeCount,
    draftCount,
    ongoingMissions,
    pendingInvoices,
    latestQuotes,
    latestInvoices,
    averageRating,
    unreadConversationCount,
    ownerActivationProgress,
  } = useOwnerDashboardData(isAuthenticated, { missionLimit: 24 });

  const onboardingPath: OnboardingPath = "business+";
  const [firstLoginOpen, setFirstLoginOpen] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);

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

  const showDashboardReminder =
    shouldShowDashboardReminder(onboardingPath, {
      firstLogin: false,
      completionState: "in_progress",
      actionStatus,
    }) && !reminderDismissed;

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

  const pendingInvoiceTotal = useMemo(
    () =>
      pendingInvoices.reduce(
        (sum, invoice) => sum + (typeof invoice.balance_amount === "number" ? invoice.balance_amount : 0),
        0,
      ),
    [pendingInvoices],
  );

  const distinctPartners = useMemo(
    () =>
      Array.from(
        new Set(
          sortedUpcomingMissions
            .map((mission) => mission.concierge_name?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [sortedUpcomingMissions],
  );

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
          concierge: getPartnerName(nextMission?.concierge_name),
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
    [properties, sortedUpcomingMissions, travelerMissions],
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

  const financeStats = useMemo<UnifiedStatItem[]>(
    () => [
      {
        label: "Devis",
        value: `${quoteAwaitingCount}`,
        icon: <CircleDollarSign size={16} />,
        tone: "accent",
        detail:
          quoteAwaitingCount > 0
            ? `${formatEuroAmountLabel(quoteAwaitingTotal)} à arbitrer`
            : "Aucun en attente",
      },
      {
        label: "Factures",
        value: `${pendingInvoices.length}`,
        icon: <Wallet size={16} />,
        tone: "soft",
        detail:
          pendingInvoices.length > 0
            ? `${formatEuroAmountLabel(pendingInvoiceTotal)} à surveiller`
            : "Aucun point urgent",
      },
      {
        label: "Demandes",
        value: `${requestsCount}`,
        icon: <ClipboardList size={16} />,
        tone: "neutral",
        detail: requestsCount > 0 ? "Demandes en cours" : "Aucune demande ouverte",
      },
    ],
    [pendingInvoiceTotal, pendingInvoices.length, quoteAwaitingCount, quoteAwaitingTotal, requestsCount],
  );

  const operationsStats = useMemo<UnifiedStatItem[]>(
    () => [
      {
        label: "Partenaires",
        value: `${distinctPartners.length}`,
        icon: <Users size={16} />,
        tone: "soft",
        detail: distinctPartners[0] ? distinctPartners[0] : "Aucun relié",
      },
      {
        label: "Aujourd'hui",
        value: `${todayMissionCount}`,
        icon: <Clock3 size={16} />,
        tone: "accent",
        detail: nextWeekMissionCount > 0 ? `${nextWeekMissionCount} cette semaine` : "Semaine légère",
      },
      {
        label: "Activation",
        value: `${ownerActivationProgress.percentage}%`,
        icon: <ShieldCheck size={16} />,
        tone: "neutral",
        detail:
          ownerActivationProgress.missingItems.length > 0
            ? `${ownerActivationProgress.missingItems.length} jalon(x) restant(s)`
            : "Parcours complet",
      },
    ],
    [distinctPartners, nextWeekMissionCount, ownerActivationProgress.missingItems.length, ownerActivationProgress.percentage, todayMissionCount],
  );

  const recentActivity = useMemo<DashboardActivityItem[]>(() => {
    const items: DashboardActivityItem[] = [];

    latestQuotes.forEach((quote) => {
      const isRejected = quote.status === "rejected";
      items.push({
        id: `quote-${quote.id}`,
        kind: "quote",
        title: quote.quote_number || "Devis reçu",
        detail: `${getQuoteStatusLabel(quote.status)} · ${formatEuroAmountLabel(quote.total_amount)}`,
        date: getDateTime(quote.updated_at || quote.created_at),
        dateLabel:
          formatDateValue(quote.updated_at || quote.created_at, {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }) || "Sans date",
        href: isRejected ? undefined : "/dashboard/owner/devis",
      });
    });

    sortedUpcomingMissions.slice(0, 3).forEach((mission) => {
      items.push({
        id: `mission-${mission.id}`,
        kind: "mission",
        title: mission.title || "Mission créée",
        detail: `${getMissionStatusLabel(mission.status)} · ${getPartnerName(mission.concierge_name)}`,
        date: getDateTime(mission.updated_at || mission.created_at || mission.scheduled_start),
        dateLabel:
          formatDateValue(mission.updated_at || mission.created_at || mission.scheduled_start, {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }) || "Sans date",
        href: "/dashboard/owner/planning",
      });
    });

    conversations
      .filter((conversation) => Boolean(conversation.last_message_at))
      .slice(0, 3)
      .forEach((conversation) => {
        items.push({
          id: `message-${conversation.id}`,
          kind: "message",
          title: conversation.subject || conversation.counterpart_name || "Message reçu",
          detail: conversation.last_message_preview || "Nouvel échange dans votre messagerie",
          date: getDateTime(conversation.last_message_at),
          dateLabel:
            formatDateValue(conversation.last_message_at, {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }) || "Sans date",
          href: "/dashboard/owner/messages",
        });
      });

    latestInvoices.forEach((invoice) => {
      items.push({
        id: `invoice-${invoice.id}`,
        kind: "invoice",
        title: invoice.invoice_number || "Facture mise à jour",
        detail: `${getInvoiceStatusLabel(invoice.status)} · ${formatEuroAmountLabel(invoice.balance_amount)}`,
        date: getDateTime(invoice.updated_at || invoice.created_at),
        dateLabel:
          formatDateValue(invoice.updated_at || invoice.created_at, {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }) || "Sans date",
        href: "/dashboard/owner/factures",
      });
    });

    return items
      .sort((left, right) => (right.date?.getTime() ?? 0) - (left.date?.getTime() ?? 0))
      .slice(0, 8);
  }, [conversations, latestInvoices, latestQuotes, sortedUpcomingMissions]);

  const onboardingDisclosure = (
    <div className={styles.disclosureStack}>
      {showDashboardReminder ? (
        <OnboardingPromptCard
          path={onboardingPath}
          actionStatus={actionStatus}
          onDismiss={() => setReminderDismissed(true)}
        />
      ) : null}
      <DashboardOnboardingSummary
        role="owner"
        availabilityHours={user?.availability_hours}
        serviceArea={user?.service_area}
        serviceRadiusKm={user?.service_radius_km}
      />
    </div>
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
          <div className={styles.primaryGrid}>
            <section className={styles.contentBlock}>
              <div className={styles.blockHeader}>
                <h3>Missions à venir</h3>
                <p>Une timeline compacte pour visualiser les prochaines interventions sans quitter l'accueil.</p>
              </div>
              {timelineMissions.length > 0 ? (
                <div className={styles.timelineList}>
                  {timelineMissions.map((mission) => (
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

            <div className={styles.sideStack}>
              <section className={styles.contentBlock}>
                <div className={styles.blockHeader}>
                  <h3>Voyageurs</h3>
                  <p>Arrivées et départs à surveiller en priorité cette semaine.</p>
                </div>
                <div className={styles.travelerSummaryGrid}>
                  <article className={styles.summaryStatCard}>
                    <span>Arrivées aujourd'hui</span>
                    <strong>{arrivalsTodayCount}</strong>
                  </article>
                  <article className={styles.summaryStatCard}>
                    <span>Arrivées semaine</span>
                    <strong>{arrivalsWeekCount}</strong>
                  </article>
                  <article className={styles.summaryStatCard}>
                    <span>Départs semaine</span>
                    <strong>{departuresWeekCount}</strong>
                  </article>
                </div>
                {travelerRows.length > 0 ? (
                  <div className={styles.miniList}>
                    {travelerRows.map((traveler) => (
                      <Link key={traveler.id} href="/dashboard/owner/missions/voyageurs" className={styles.miniRow}>
                        <div>
                          <strong>{traveler.title}</strong>
                          <span>{traveler.property}</span>
                        </div>
                        <small>{traveler.arrival}</small>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <DashboardEmptyState
                    title="Aucun séjour programmé"
                    copy="Les séjours voyageurs créeront automatiquement vos prochains repères d'arrivée et de départ."
                  />
                )}
              </section>

              <section className={styles.contentBlock}>
                <div className={styles.blockHeader}>
                  <h3>Actions à effectuer</h3>
                  <p>Les points qui demandent votre attention immédiate.</p>
                </div>
                {actionQueue.length > 0 ? (
                  <div className={styles.actionQueueWrap}>
                    <div className={styles.actionQueueIntro}>
                      <div>
                        <strong>{actionQueue.length} action(s) à traiter</strong>
                        <span>Priorité de pilotage propriétaire</span>
                      </div>
                      <span className={styles.actionQueueCount}>{actionQueue.length}</span>
                    </div>
                    <div className={styles.actionQueue}>
                    {actionQueue.map((item) => (
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
                  </div>
                ) : (
                  <DashboardEmptyState
                    title="Rien d'urgent"
                    copy="Votre tableau est propre pour le moment. Les prochaines alertes utiles remonteront ici."
                  />
                )}
              </section>
            </div>
          </div>
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
            id: "quotes-list",
            title: "Derniers devis",
            subtitle: "Lecture courte et accès direct au détail.",
            content: (
              <div className={`${styles.sideCompactBlock} ${styles.quoteBoard}`}>
                {quoteRows.length > 0 ? (
                  quoteRows.map((quote) =>
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
          {
            id: "recent-activity",
            title: "Activité récente",
            subtitle: "Flux compact avec accès direct au détail.",
            content: (
              <div className={styles.sideCompactBlock}>
                {recentActivity.length > 0 ? (
                  recentActivity.map((item) =>
                    item.href ? (
                      <Link key={item.id} href={item.href} className={`${styles.activityRow} ${styles.activityRowCompact}`}>
                        <span className={styles.activityIcon} data-kind={item.kind}>
                          {item.kind === "quote" ? (
                            <FileText size={16} />
                          ) : item.kind === "mission" ? (
                            <CalendarDays size={16} />
                          ) : item.kind === "invoice" ? (
                            <RefreshCcw size={16} />
                          ) : (
                            <BellRing size={16} />
                          )}
                        </span>
                        <div className={styles.activityCopy}>
                          <strong>{item.title}</strong>
                          <span>{item.detail}</span>
                        </div>
                        <small>{item.dateLabel}</small>
                      </Link>
                    ) : (
                      <article key={item.id} className={`${styles.activityRow} ${styles.activityRowCompact} ${styles.activityRowDisabled}`}>
                        <span className={styles.activityIcon} data-kind={item.kind}>
                          {item.kind === "quote" ? (
                            <FileText size={16} />
                          ) : item.kind === "mission" ? (
                            <CalendarDays size={16} />
                          ) : item.kind === "invoice" ? (
                            <RefreshCcw size={16} />
                          ) : (
                            <BellRing size={16} />
                          )}
                        </span>
                        <div className={styles.activityCopy}>
                          <strong>{item.title}</strong>
                          <span>{item.detail}</span>
                        </div>
                        <small>{item.dateLabel}</small>
                      </article>
                    ),
                  )
                ) : (
                  <DashboardEmptyState
                    title="Aucune activité récente"
                    copy="Les nouveaux mouvements de votre espace remonteront ici au fil de l'eau."
                  />
                )}
              </div>
            ),
          },
          {
            id: "finance",
            title: "Lecture financière",
            subtitle: "Montants, devis et factures sans bruit visuel.",
            content: <UnifiedStatStack items={financeStats} />,
          },
          {
            id: "operations",
            title: "Contrôle terrain",
            subtitle: "Partenaires, cadence et niveau de préparation du parc.",
            content: <UnifiedStatStack items={operationsStats} />,
          },
        ]}
        disclosures={[
          {
            id: "onboarding",
            label: "Parcours & options",
            summary: "Onboarding et rappels secondaires",
            content: onboardingDisclosure,
          },
        ]}
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
