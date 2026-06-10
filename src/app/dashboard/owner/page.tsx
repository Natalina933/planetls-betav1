"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  FileText,
  MessageSquareText,
  Receipt,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { AsyncState } from "@/components/ui";
import { DashboardLayout, DashboardLoadingScreen, DashboardPanel, MetricDonut } from "@/components/dashboard";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import type { CurrentUser } from "@/app/components/hooks/useCurrentUser";
import { takeFirst } from "../shared";
import type { DashboardUserIdentity } from "../shared";
import { formatDateValue, formatEuroAmountLabel } from "@/app/utils/formatters";
import {
  FirstLoginOnboardingPopup,
  OnboardingPromptCard,
  shouldShowDashboardReminder,
  shouldShowFirstLoginPopup,
  type OnboardingActionStatus,
  type OnboardingPath,
} from "@/features/onboarding-assistant";
import { getOwnerHousingStatusLabel, useOwnerDashboardData } from "./useOwnerDashboardData";
import {
  OWNER_DASHBOARD_CONFIG,
  OWNER_NAV_ITEMS,
  OWNER_QUICK_ACTIONS,
} from "@/features/owner-dashboard";
import {
  getTravelerMissionGuestName,
  getTravelerMissionStatusLabel,
  isTravelerMission,
} from "./missions/travelerMissionSummary";
import styles from "./page.module.scss";

const DAY_MS = 24 * 60 * 60 * 1000;

function getRealPartnerName(name: string | null | undefined) {
  const trimmed = name?.trim();
  return trimmed || null;
}

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
      return "Date confirmée";
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

export default function OwnerDashboardPage() {
  const { user, loading: userLoading, isAuthenticated } = useCurrentUser() as {
    user: (DashboardUserIdentity & Pick<CurrentUser, "id" | "availability_hours" | "service_area" | "service_radius_km">) | null;
    loading: boolean;
    isAuthenticated: boolean;
  };
  const {
    properties,
    missions,
    quotes,
    invoices,
    conversations,
    loading,
    error,
    activeCount,
    draftCount,
    ongoingMissions,
    pendingInvoices,
    latestQuotes,
    latestInvoices,
    averageRating,
    unreadConversationCount,
    ownerActivationProgress,
  } = useOwnerDashboardData(isAuthenticated);

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

  const ownerName = user?.firstName || user?.username || OWNER_DASHBOARD_CONFIG.profileName;

  const todayMissions = useMemo(
    () =>
      ongoingMissions.filter((mission) => {
        const date = getDateTime(mission.scheduled_start);
        return date ? isSameLocalDay(date, new Date()) : false;
      }),
    [ongoingMissions],
  );

  const upcomingWeekMissions = useMemo(
    () => ongoingMissions.filter((mission) => isWithinNextDays(mission.scheduled_start, 7)),
    [ongoingMissions],
  );
  const travelerMissions = useMemo(
    () => ongoingMissions.filter((mission) => isTravelerMission(mission)),
    [ongoingMissions],
  );
  const latestTravelerMission = travelerMissions[0] ?? null;

  const quoteAwaitingCount = useMemo(
    () => quotes.filter((quote) => quote.status !== "accepted" && quote.status !== "rejected").length,
    [quotes],
  );
  const pendingInvoiceTotal = useMemo(
    () =>
      pendingInvoices.reduce((sum, invoice) => sum + (typeof invoice.balance_amount === "number" ? invoice.balance_amount : 0), 0),
    [pendingInvoices],
  );
  const quoteAwaitingTotal = useMemo(
    () =>
      quotes.reduce((sum, quote) => {
        if (quote.status === "accepted" || quote.status === "rejected") return sum;
        return sum + (typeof quote.total_amount === "number" ? quote.total_amount : 0);
      }, 0),
    [quotes],
  );

  const ownerShortcuts = useMemo(
    () => [
      { label: "Logements", href: "/dashboard/owner/logements", badgeCount: draftCount },
      { label: "Missions", href: "/dashboard/owner/planning", badgeCount: ongoingMissions.length },
      { label: "Messages", href: "/dashboard/owner/messages", badgeCount: unreadConversationCount },
      { label: "Devis", href: "/dashboard/owner/devis", badgeCount: quoteAwaitingCount },
      { label: "Factures", href: "/dashboard/owner/factures", badgeCount: pendingInvoices.length },
    ],
    [draftCount, ongoingMissions.length, pendingInvoices.length, quoteAwaitingCount, unreadConversationCount],
  );

  const ownerQuickActions = useMemo(
    () => [
      {
        ...OWNER_QUICK_ACTIONS[0],
        completed: properties.length > 0,
        completedLabel: "Terminé",
      },
      {
        ...OWNER_QUICK_ACTIONS[1],
        completed: ongoingMissions.length > 0 || unreadConversationCount > 0,
        completedLabel: "En place",
      },
      {
        ...OWNER_QUICK_ACTIONS[2],
        completed: ongoingMissions.length > 0,
        completedLabel: "Déjà lancé",
      },
    ],
    [ongoingMissions.length, properties.length, unreadConversationCount],
  );

  const propertyCards = useMemo(
    () =>
      properties.map((property) => {
        const equipment = Array.isArray(property.infos?.equipements)
          ? property.infos.equipements.map((item) => item.trim()).filter(Boolean)
          : [];
        const propertyMissions = ongoingMissions.filter(
          (mission) => String(mission.property_id ?? "") === String(property.id),
        );
        const partnerNames = Array.from(
          new Set(
            propertyMissions
              .map((mission) => getRealPartnerName(mission.concierge_name))
              .filter((name): name is string => Boolean(name)),
          ),
        );
        const nextMission = [...propertyMissions]
          .filter((mission) => Boolean(mission.scheduled_start))
          .sort((left, right) => {
            const leftTime = getDateTime(left.scheduled_start)?.getTime() ?? Number.MAX_SAFE_INTEGER;
            const rightTime = getDateTime(right.scheduled_start)?.getTime() ?? Number.MAX_SAFE_INTEGER;
            return leftTime - rightTime;
          })[0];

        return {
          id: property.id,
          name: property.nom_logement || `Logement #${property.id}`,
          city: property.ville || "Ville à préciser",
          status: getOwnerHousingStatusLabel(property.statut),
          statusTone:
            property.statut === "active" || property.statut === "published"
              ? styles.statusGood
              : styles.statusWarn,
          partner: partnerNames[0] || "Aucune conciergerie associée",
          missionCount: propertyMissions.length,
          equipmentCount: equipment.length,
          equipmentPreview: equipment.slice(0, 3).join(", "),
          nextMissionLabel: nextMission
            ? formatDateValue(nextMission.scheduled_start, {
                day: "2-digit",
                month: "short",
              })
            : "Aucune mission planifiée",
          href: `/dashboard/owner/logements/${property.id}`,
        };
      }),
    [ongoingMissions, properties],
  );

  const partnerRows = useMemo(() => {
    const byPartner = new Map<
      string,
      {
        name: string;
        properties: Set<string>;
        missions: number;
        nextDate: string | null;
      }
    >();

    for (const mission of ongoingMissions) {
      const name = getRealPartnerName(mission.concierge_name);
      if (!name) continue;

      const property = properties.find((item) => String(item.id) === String(mission.property_id ?? ""));
      const propertyName = property?.nom_logement || property?.ville || "Logement à préciser";
      const current = byPartner.get(name) ?? {
        name,
        properties: new Set<string>(),
        missions: 0,
        nextDate: null,
      };
      current.properties.add(propertyName);
      current.missions += 1;
      if (mission.scheduled_start) {
        const nextTime = getDateTime(current.nextDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const missionTime = getDateTime(mission.scheduled_start)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        if (missionTime < nextTime) current.nextDate = mission.scheduled_start;
      }
      byPartner.set(name, current);
    }

    return Array.from(byPartner.values()).map((item) => ({
      ...item,
      propertyList: Array.from(item.properties).slice(0, 3).join(", "),
      nextMissionLabel: item.nextDate
        ? formatDateValue(item.nextDate, {
            day: "2-digit",
            month: "short",
          })
        : "Aucune date planifiée",
    }));
  }, [ongoingMissions, properties]);

  const healthCards = useMemo(
    () => [
      {
        label: "Logements prêts",
        value: properties.length > 0 ? `${activeCount}/${properties.length}` : "0",
        detail:
          properties.length === 0
            ? "Ajoutez votre premier logement pour lancer le suivi."
            : draftCount > 0
              ? `${draftCount} fiche(s) restent à finaliser.`
              : "Toutes les fiches sont exploitables.",
        tone: draftCount > 0 ? styles.statusWarn : styles.statusGood,
      },
      {
        label: "Missions ouvertes",
        value: `${ongoingMissions.length}`,
        detail:
          ongoingMissions.length > 0
            ? `${todayMissions.length} intervention(s) à suivre aujourd'hui.`
            : "Aucune intervention en attente.",
        tone: ongoingMissions.length > 0 ? styles.statusInfo : styles.statusGood,
      },
      {
        label: "Conciergeries actives",
        value: `${partnerRows.length}`,
        detail:
          partnerRows.length > 0
            ? `${partnerRows[0].name} est actuellement rattachée à votre parc.`
            : "Aucune conciergerie rattachée pour le moment.",
        tone: partnerRows.length > 0 ? styles.statusInfo : styles.statusWarn,
      },
    ],
    [activeCount, draftCount, ongoingMissions.length, partnerRows, properties.length, todayMissions.length],
  );

  const dashboardDonuts = useMemo(
    () => [
      {
        label: "Logements prêts",
        value: properties.length > 0 ? `${activeCount}/${properties.length}` : "0",
        detail: draftCount > 0 ? `${draftCount} à finaliser` : "Parc exploitable",
        percent: properties.length > 0 ? Math.round((activeCount / properties.length) * 100) : 0,
      },
      {
        label: "Missions",
        value: `${ongoingMissions.length}`,
        detail: todayMissions.length > 0 ? `${todayMissions.length} aujourd'hui` : "Aucune urgence",
        percent: Math.min(100, ongoingMissions.length * 18),
      },
      {
        label: "Conciergeries",
        value: `${partnerRows.length}`,
        detail: partnerRows.length > 0 ? "Partenaires actifs" : "À rattacher",
        percent:
          properties.length > 0 ? Math.min(100, Math.round((partnerRows.length / properties.length) * 100)) : 0,
      },
      {
        label: "Flux à arbitrer",
        value: `${quoteAwaitingCount + pendingInvoices.length + unreadConversationCount}`,
        detail: `${quoteAwaitingCount} devis · ${pendingInvoices.length} facture(s)`,
        percent: Math.min(100, (quoteAwaitingCount + pendingInvoices.length + unreadConversationCount) * 18),
      },
    ],
    [
      activeCount,
      draftCount,
      ongoingMissions.length,
      partnerRows.length,
      pendingInvoices.length,
      properties.length,
      quoteAwaitingCount,
      todayMissions.length,
      unreadConversationCount,
    ],
  );

  const businessSignals = useMemo(
    () => [
      {
        label: "Missions aujourd'hui",
        value: `${todayMissions.length}`,
        detail: todayMissions.length > 0 ? "Des interventions méritent votre suivi." : "Aucune mission datée aujourd'hui.",
        href: "/dashboard/owner/planning",
      },
      {
        label: "Messages non lus",
        value: `${unreadConversationCount}`,
        detail: unreadConversationCount > 0 ? "Des réponses attendent votre arbitrage." : "La messagerie est à jour.",
        href: "/dashboard/owner/messages",
      },
      {
        label: "Devis à arbitrer",
        value: `${quoteAwaitingCount}`,
        detail:
          quoteAwaitingCount > 0
            ? `${formatEuroAmountLabel(quoteAwaitingTotal)} potentiellement à valider.`
            : "Aucun devis en attente pour le moment.",
        href: "/dashboard/owner/devis",
      },
      {
        label: "Factures à vérifier",
        value: `${pendingInvoices.length}`,
        detail:
          pendingInvoices.length > 0
            ? `${formatEuroAmountLabel(pendingInvoiceTotal)} à surveiller.`
            : "Aucun point financier urgent.",
        href: "/dashboard/owner/factures",
      },
    ],
    [
      pendingInvoiceTotal,
      pendingInvoices.length,
      quoteAwaitingCount,
      quoteAwaitingTotal,
      todayMissions.length,
      unreadConversationCount,
    ],
  );

  const priorityMoment = useMemo(() => {
    const latestQuote = latestQuotes[0];
    if (latestQuote) {
      return {
        eyebrow: "Priorité du moment",
        title: `Devis ${latestQuote.quote_number || "à revoir"}`,
        detail: `${getQuoteStatusLabel(latestQuote.status)} · ${formatEuroAmountLabel(
          latestQuote.total_amount,
        )}${latestQuote.valid_until ? ` · valable jusqu'au ${formatDateValue(latestQuote.valid_until, { day: "2-digit", month: "short" })}` : ""}.`,
        helper: "C'est l'arbitrage métier le plus direct à traiter pour débloquer une prochaine action.",
        primaryHref: "/dashboard/owner/devis",
        primaryLabel: "Voir les devis",
        secondaryHref: "/dashboard/owner/demandes",
        secondaryLabel: "Créer une mission",
      };
    }

    if (unreadConversationCount > 0) {
      return {
        eyebrow: "Priorité du moment",
        title: `${unreadConversationCount} message(s) attendent votre lecture`,
        detail: "La coordination avec votre conciergerie ou vos prestataires demande une réponse rapide.",
        helper: "Répondre vite évite les frictions et garde les opérations fluides.",
        primaryHref: "/dashboard/owner/messages",
        primaryLabel: "Ouvrir la messagerie",
        secondaryHref: "/dashboard/owner/concierges",
        secondaryLabel: "Trouver une conciergerie",
      };
    }

    if (draftCount > 0) {
      return {
        eyebrow: "Priorité du moment",
        title: "Des logements restent à finaliser",
        detail: `${draftCount} fiche(s) incomplète(s) limitent votre lecture opérationnelle du parc.`,
        helper: "Une fiche complète rend les missions, le planning et les arbitrages plus fiables.",
        primaryHref: "/dashboard/owner/logements",
        primaryLabel: "Finaliser les logements",
        secondaryHref: "/dashboard/owner/logements/create",
        secondaryLabel: "Ajouter un logement",
      };
    }

    return {
      eyebrow: "Activité du moment",
      title: "Votre parc est calme aujourd'hui",
      detail: "Aucune mission critique ni message prioritaire n'appelle votre attention immédiate.",
      helper: "Profitez-en pour enrichir vos logements, préparer vos demandes ou rechercher un partenaire.",
      primaryHref: "/dashboard/owner/logements",
      primaryLabel: "Voir mes logements",
      secondaryHref: "/dashboard/owner/concierges",
      secondaryLabel: "Trouver une conciergerie",
    };
  }, [draftCount, latestQuotes, unreadConversationCount]);

  const recentHighlights = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      detail: string;
      href: string;
      label: string;
    }> = [];

    const latestQuote = latestQuotes[0];
    if (latestQuote) {
      items.push({
        id: `quote-${latestQuote.id}`,
        label: "Devis",
        title: latestQuote.quote_number || "Devis récent",
        detail: `${getQuoteStatusLabel(latestQuote.status)} · ${formatEuroAmountLabel(latestQuote.total_amount)}`,
        href: "/dashboard/owner/devis",
      });
    }

    const latestConversation = [...conversations]
      .filter((conversation) => Boolean(conversation.last_message_at))
      .sort((left, right) => {
        const leftTime = getDateTime(left.last_message_at)?.getTime() ?? 0;
        const rightTime = getDateTime(right.last_message_at)?.getTime() ?? 0;
        return rightTime - leftTime;
      })[0];

    if (latestConversation) {
      items.push({
        id: `conversation-${latestConversation.id}`,
        label: "Message",
        title: latestConversation.subject || latestConversation.counterpart_name || "Nouvelle conversation",
        detail:
          latestConversation.unread_count && latestConversation.unread_count > 0
            ? `${latestConversation.unread_count} message(s) non lus`
            : "Dernier échange disponible",
        href: "/dashboard/owner/messages",
      });
    }

    const nextMission = [...ongoingMissions]
      .filter((mission) => Boolean(mission.scheduled_start))
      .sort((left, right) => {
        const leftTime = getDateTime(left.scheduled_start)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const rightTime = getDateTime(right.scheduled_start)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return leftTime - rightTime;
      })[0];

    if (nextMission) {
      items.push({
        id: `mission-${nextMission.id}`,
        label: "Mission",
        title: nextMission.title || "Mission à suivre",
        detail: `${getMissionStatusLabel(nextMission.status)} · ${formatDateValue(nextMission.scheduled_start, {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        href: `/dashboard/owner/missions/${nextMission.id}`,
      });
    }

    const latestInvoice = latestInvoices[0];
    if (latestInvoice) {
      items.push({
        id: `invoice-${latestInvoice.id}`,
        label: "Facture",
        title: latestInvoice.invoice_number || "Facture récente",
        detail: `${getInvoiceStatusLabel(latestInvoice.status)} · ${formatEuroAmountLabel(latestInvoice.balance_amount)}`,
        href: "/dashboard/owner/factures",
      });
    }

    return takeFirst(items, 4);
  }, [conversations, latestInvoices, latestQuotes, ongoingMissions]);

  const missionSnapshot = useMemo(
    () =>
      takeFirst(ongoingMissions, 4).map((mission) => ({
        id: mission.id,
        title: mission.title || "Mission à préciser",
        partner: getRealPartnerName(mission.concierge_name) || "Aucune conciergerie rattachée",
        date: formatDateValue(mission.scheduled_start, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        amount: formatEuroAmountLabel(mission.amount),
        status: getMissionStatusLabel(mission.status),
        href: `/dashboard/owner/missions/${mission.id}`,
      })),
    [ongoingMissions],
  );

  const financeCards = useMemo(
    () => [
      {
        label: "Devis à valider",
        value: `${quoteAwaitingCount}`,
        detail:
          quoteAwaitingCount > 0
            ? `${formatEuroAmountLabel(quoteAwaitingTotal)} en attente d'arbitrage.`
            : "Aucun devis en attente.",
      },
      {
        label: "Factures à régler",
        value: `${pendingInvoices.length}`,
        detail:
          pendingInvoices.length > 0
            ? `${formatEuroAmountLabel(pendingInvoiceTotal)} à surveiller.`
            : "Aucune facture ouverte.",
      },
      {
        label: "Dernière facture",
        value: latestInvoices[0]?.invoice_number || "Aucune",
        detail:
          latestInvoices.length > 0
            ? `${getInvoiceStatusLabel(latestInvoices[0].status)} · ${formatEuroAmountLabel(
                latestInvoices[0].balance_amount,
              )}`
            : "Aucun règlement récent consolidé.",
      },
    ],
    [latestInvoices, pendingInvoiceTotal, pendingInvoices.length, quoteAwaitingCount, quoteAwaitingTotal],
  );

  const activityItems = useMemo(
    () => [
      ...takeFirst(propertyCards, 2).map((property) => ({
        id: `property-${property.id}`,
        title: property.name,
        description: `${property.city} · ${property.status}`,
        href: property.href,
        statusLabel: property.partner === "Aucune conciergerie associée" ? "Logement" : property.partner,
        actionLabel: "Voir",
      })),
      ...takeFirst(missionSnapshot, 2).map((mission) => ({
        id: `mission-${mission.id}`,
        title: mission.title,
        description: `${mission.date} · ${mission.status}`,
        href: mission.href,
        statusLabel: mission.partner,
        actionLabel: "Suivre",
      })),
    ],
    [missionSnapshot, propertyCards],
  );

  const strategyNotes = useMemo(
    () => [
      {
        title: "Cap logements",
        text:
          draftCount > 0
            ? "Le gain le plus concret reste de rendre chaque logement complet et activable sans friction."
            : "Votre base logement est saine. Vous pouvez investir l'effort sur la coordination et la rentabilité.",
      },
      {
        title: "Cap missions",
        text:
          ongoingMissions.length > 0
            ? "Les prochaines missions doivent rester très lisibles pour éviter que le propriétaire se sente hors du terrain."
            : "Un tableau de bord calme doit surtout aider à anticiper la prochaine demande, pas à remplir du vide.",
      },
      {
        title: "Cap finance",
        text:
          quoteAwaitingCount + pendingInvoices.length > 0
            ? "Regrouper devis et factures dans un même regard réduit la charge mentale au moment de décider."
            : "Le financier est sous contrôle, la page peut donc pousser davantage les usages opérationnels.",
      },
    ],
    [draftCount, ongoingMissions.length, pendingInvoices.length, quoteAwaitingCount],
  );

  const handleCloseFirstLogin = () => {
    if (user?.id) {
      window.localStorage.setItem(`owner-onboarding-first-login-seen:${user.id}`, "1");
    }
    setFirstLoginOpen(false);
  };



  const onboardingPath: OnboardingPath = "business+";
  const [firstLoginOpen, setFirstLoginOpen] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const actionStatus = useMemo<Record<string, OnboardingActionStatus>>(() => ({
    "configure-packs": properties.length > 0 ? "done" : "todo",
    "set-pricing": latestQuotes.length > 0 ? "done" : "todo",
    "prepare-docs": latestInvoices.length > 0 ? "done" : "todo",
  }), [latestInvoices.length, latestQuotes.length, properties.length]);

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

  const showDashboardReminder = shouldShowDashboardReminder(onboardingPath, {
    firstLogin: false,
    completionState: "in_progress",
    actionStatus,
  }) && !reminderDismissed;

  const handleCloseFirstLogin = () => {
    if (user?.id) {
      window.localStorage.setItem(`owner-onboarding-first-login-seen:${user.id}`, "1");
    }
    setFirstLoginOpen(false);
  };

  if (userLoading || !isAuthenticated) {
    return <DashboardLoadingScreen label="Chargement de votre espace propriétaire..." />;
  }

  return (
    <DashboardLayout
      persona="owner"
      title={OWNER_DASHBOARD_CONFIG.title}
      subtitle={error || OWNER_DASHBOARD_CONFIG.defaultSubtitle}
      navTitle={OWNER_DASHBOARD_CONFIG.navTitle}
      navItems={OWNER_NAV_ITEMS}
      stats={[
        {
          label: "Logements",
          value: `${properties.length}`,
          hint: activeCount > 0 ? `${activeCount} actif(s), ${draftCount} à finaliser` : "Ajoutez votre premier logement",
          trend: activeCount > 0 ? "Parc suivi" : "À lancer",
          progress: properties.length > 0 ? Math.round((activeCount / properties.length) * 100) : 0,
        },
        {
          label: "Missions ouvertes",
          value: `${ongoingMissions.length}`,
          hint: todayMissions.length > 0 ? `${todayMissions.length} à suivre aujourd'hui` : "Aucune urgence du jour",
          trend: ongoingMissions.length > 0 ? "En cours" : "Calme",
          progress: Math.min(100, ongoingMissions.length * 20),
        },
        {
          label: "Conciergeries",
          value: `${partnerRows.length}`,
          hint: partnerRows.length > 0 ? "Partenaires reliés à vos logements" : "Aucun partenaire rattaché",
          trend: partnerRows.length > 0 ? "En place" : "À trouver",
          progress: properties.length > 0 ? Math.min(100, Math.round((partnerRows.length / properties.length) * 100)) : 0,
        },
        {
          label: "Flux à arbitrer",
          value: `${quoteAwaitingCount + pendingInvoices.length + unreadConversationCount}`,
          hint: `${quoteAwaitingCount} devis, ${pendingInvoices.length} facture(s), ${unreadConversationCount} message(s)`,
          trend: quoteAwaitingCount + pendingInvoices.length + unreadConversationCount > 0 ? "Action" : "Sous contrôle",
          progress: Math.min(100, (quoteAwaitingCount + pendingInvoices.length + unreadConversationCount) * 18),
        },
      ]}
      actions={ownerQuickActions}
      activity={activityItems}
      notifications={[
        {
          id: "n1",
          title:
            quoteAwaitingCount > 0
              ? `${quoteAwaitingCount} devis attend(ent) votre arbitrage.`
              : "Aucun devis urgent à valider.",
          level: quoteAwaitingCount > 0 ? "warning" : "info",
          href: "/dashboard/owner/devis",
        },
        {
          id: "n2",
          title:
            unreadConversationCount > 0
              ? `${unreadConversationCount} message(s) demandent une réponse.`
              : "Aucun nouveau message prioritaire.",
          level: unreadConversationCount > 0 ? "danger" : "info",
          href: "/dashboard/owner/messages",
        },
      ]}
      shortcuts={ownerShortcuts}
      showBottomNav={false}
      hideHeader
      profile={{
        name: ownerName,
        subtitle: loading ? "Chargement..." : `${properties.length} bien(s) suivi(s)`,
        badge: averageRating ? `${averageRating.toFixed(1)} / 5` : "Profil actif",
      }}
    >
      <FirstLoginOnboardingPopup path={onboardingPath} open={firstLoginOpen} onClose={handleCloseFirstLogin} />

      {showDashboardReminder ? (
        <OnboardingPromptCard path={onboardingPath} actionStatus={actionStatus} onDismiss={() => setReminderDismissed(true)} />
      ) : null}

      <DashboardPanel title="Vue d’ensemble">
        <AsyncState loading={loading} error={error}>
          <p>
            {activeCount} logement(s) actif(s) sur {properties.length}, avec {ongoingMissions.length} opération(s)
            ouverte(s) et {pendingInvoices.length} facture(s) à surveiller.
          </p>
          <p>
            {properties[0]
              ? `Bien le plus récent: ${properties[0].nom_logement || "Logement sans nom"} à ${
                  properties[0].ville || "ville à préciser"
                }.`
              : "Aucun bien publié pour le moment."}
          </p>
          <Link href="/dashboard/owner/logements/overview">Ouvrir la vue synthèse des logements</Link>
        </AsyncState>
      </DashboardPanel>

      <DashboardPanel title="Pilotage stratégique">
        <AsyncState loading={loading} error={error}>
          <p>
            {draftCount > 0
              ? `${draftCount} fiche(s) logement restent à finaliser avant de fiabiliser la lecture business.`
              : "Le parc est structuré pour un pilotage plus serein."}
          </p>
          <p>
            {averageRating
              ? `Satisfaction moyenne à ${averageRating.toFixed(1)} / 5, avec ${unreadConversationCount} message(s) non lu(s) côté conciergerie.`
              : `Aucune note consolidée pour l’instant, mais ${unreadConversationCount} message(s) méritent une revue rapide.`}
          </p>
          <p>
            {pendingInvoices.length > 0
              ? "Priorité recommandée: sécuriser les règlements en attente avant d’ouvrir de nouvelles demandes."
              : "Priorité recommandée: arbitrer les prochaines actions avec votre conciergerie pour améliorer la performance du parc."}
          </p>
        </AsyncState>
      </DashboardPanel>

      <DashboardPanel title="Reporting de gestion">
        <AsyncState loading={loading} error={error}>
          {latestInvoices.length > 0 ? (
            <p>
              Dernière facture: {latestInvoices[0].invoice_number || "sans numéro"} · solde{" "}
              {formatEuroAmountLabel(latestInvoices[0].balance_amount)}.
            </p>
          ) : (
            <p>Aucune facture récente.</p>
          )}
          {latestQuotes.length > 0 ? (
            <p>
              Dernier devis: {latestQuotes[0].quote_number || "sans numéro"} ·{" "}
              {formatEuroAmountLabel(latestQuotes[0].total_amount)}.
            </p>
          ) : (
            <p>Aucun devis récent.</p>
          )}
          {ongoingMissions.length > 0 ? (
      <section className={styles.sectionBlock} aria-labelledby="owner-welcome-title">
        <div className={styles.heroPanel}>
          <div className={styles.heroCopy}>
            <span className={styles.heroBadge}>Cockpit propriétaire</span>
            <h1 id="owner-welcome-title">
              {getGreetingLabel()} {ownerName}, voici l'état de votre parc.
            </h1>
            <p>
              Vous gérez {properties.length} logement(s), {ongoingMissions.length} mission(s) ouverte(s),{" "}
              {partnerRows.length} conciergerie(s) active(s) et {quoteAwaitingCount + pendingInvoices.length} flux
              financiers ou contractuels à arbitrer.
            </p>
          </div>
          <div className={styles.heroMetrics} aria-label="Synthèse propriétaire">
            <article className={styles.heroMetric}>
              <span>Logements</span>
              <strong>{properties.length}</strong>
              <small>{activeCount} actif(s)</small>
            </article>
            <article className={styles.heroMetric}>
              <span>Missions</span>
              <strong>{ongoingMissions.length}</strong>
              <small>{todayMissions.length} aujourd&apos;hui</small>
            </article>
            <article className={styles.heroMetric}>
              <span>Messages</span>
              <strong>{unreadConversationCount}</strong>
              <small>non lus</small>
            </article>
            <article className={styles.heroMetric}>
              <span>Voyageurs transmis</span>
              <strong>{travelerMissions.length}</strong>
              <small>
                {latestTravelerMission
                  ? getTravelerMissionStatusLabel(latestTravelerMission.status)
                  : "aucun sejour"}
              </small>
            </article>
          </div>
          <div className={styles.heroActions}>
            <Link href="/dashboard/owner/logements" className={styles.primaryLink}>
              Voir mes logements
            </Link>
            <Link href="/dashboard/owner/demandes" className={styles.secondaryLink}>
              Créer une mission
            </Link>
            <Link href="/dashboard/owner/concierges" className={styles.secondaryLink}>
              Trouver une conciergerie
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.dashboardDonutRail} aria-label="Indicateurs propriétaires">
        {dashboardDonuts.map((donut) => (
          <MetricDonut
            key={donut.label}
            label={donut.label}
            value={donut.value}
            detail={donut.detail}
            percent={donut.percent}
            className={styles.dashboardDonutCard}
          />
        ))}
      </section>

      <section className={styles.sectionBlock} aria-labelledby="owner-health-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Santé du parc</span>
          <h2 id="owner-health-title">Voir en 5 secondes si tout va bien</h2>
          <p>Une lecture courte pour savoir si vos logements, missions et partenaires sont sous contrôle.</p>
        </div>
        <div className={styles.healthGrid}>
          {dashboardDonuts.slice(0, 3).map((donut) => (
            <MetricDonut
              key={`health-${donut.label}`}
              label={donut.label}
              value={donut.value}
              detail={donut.detail}
              percent={donut.percent}
              className={styles.dashboardDonutCard}
            />
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="owner-priority-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Priorités</span>
          <h2 id="owner-priority-title">Le moment métier à traiter maintenant</h2>
        </div>
        <div className={styles.priorityLayout}>
          <article className={styles.priorityHero}>
            <span className={styles.priorityBadge}>{priorityMoment.eyebrow}</span>
            <strong>{priorityMoment.title}</strong>
            <p>{priorityMoment.detail}</p>
            <small>{priorityMoment.helper}</small>
            <div className={styles.priorityActions}>
              <Link href={priorityMoment.primaryHref} className={styles.primaryLink}>
                {priorityMoment.primaryLabel}
              </Link>
              <Link href={priorityMoment.secondaryHref} className={styles.secondaryLink}>
                {priorityMoment.secondaryLabel}
              </Link>
            </div>
          </article>

          <div className={styles.signalList}>
            {businessSignals.map((signal) => (
              <Link key={signal.label} href={signal.href} className={styles.signalCard}>
                <div className={styles.signalTop}>
                  <span>{signal.label}</span>
                  <strong>{signal.value}</strong>
                </div>
                <p>{signal.detail}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="owner-activity-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Activité récente</span>
          <h2 id="owner-activity-title">Les dernières informations utiles</h2>
        </div>
        <DashboardPanel title="Fil d'activité">
          <AsyncState loading={loading} error={error}>
            <div className={styles.timelineList}>
              {recentHighlights.map((item) => (
                <Link key={item.id} href={item.href} className={styles.timelineRow}>
                  <span className={styles.timelineLabel}>{item.label}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <ArrowRight size={16} />
                </Link>
              ))}
              {recentHighlights.length === 0 ? (
                <Link href="/dashboard/owner/demandes" className={styles.emptyCard}>
                  Aucune actualite forte pour le moment. Creez une mission ou ajoutez un logement.
                </Link>
              ) : null}
            </div>
          </AsyncState>
        </DashboardPanel>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="owner-properties-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Mes logements</span>
          <h2 id="owner-properties-title">Le cœur de votre activité quotidienne</h2>
          <p>Chaque carte rassemble l'état du logement, la conciergerie en face et la prochaine action utile.</p>
        </div>
        <div className={styles.propertyGrid}>
          {propertyCards.length > 0 ? (
            propertyCards.map((property) => (
              <article key={property.id} className={styles.propertyCard}>
                <div className={styles.propertyHead}>
                  <div>
                    <span className={styles.propertyIcon}>
                      <Building2 size={18} />
                    </span>
                    <strong>{property.name}</strong>
                    <p>{property.city}</p>
                  </div>
                  <span className={`${styles.inlineStatus} ${property.statusTone}`}>{property.status}</span>
                </div>

                <div className={styles.propertyStats}>
                  <div>
                    <span>Conciergerie</span>
                    <strong>{property.partner}</strong>
                  </div>
                  <div>
                    <span>Prochaine mission</span>
                    <strong>{property.nextMissionLabel}</strong>
                  </div>
                  <div>
                    <span>Missions ouvertes</span>
                    <strong>{property.missionCount}</strong>
                  </div>
                  <div>
                    <span>Équipements</span>
                    <strong>{property.equipmentCount}</strong>
                  </div>
                </div>

                <p className={styles.propertyNote}>
                  {property.equipmentPreview || "Aucun equipement renseigne pour ce logement."}
                </p>

                <div className={styles.propertyActions}>
                  <Link href={property.href} className={styles.primaryLink}>
                    Voir le logement
                  </Link>
                  <Link href="/dashboard/owner/planning" className={styles.secondaryLink}>
                    Voir le planning
                  </Link>
                  <Link href="/dashboard/owner/demandes" className={styles.secondaryLink}>
                    Créer une mission
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <Link href="/dashboard/owner/logements/create" className={styles.emptyCard}>
              Ajoutez votre premier logement pour recentrer ce tableau de bord sur votre parc.
            </Link>
          )}
        </div>
      </section>

      <section className={`${styles.sectionBlock} ${styles.panelGrid}`} aria-label="Missions et conciergeries">
        <DashboardPanel title="Missions récentes">
          <AsyncState loading={loading} error={error}>
            <div className={styles.missionList}>
              {missionSnapshot.length > 0 ? (
                missionSnapshot.map((mission) => (
                  <Link key={mission.id} href={mission.href} className={styles.missionRow}>
                    <div className={styles.missionRowTop}>
                      <span className={styles.inlineStatus}>{mission.status}</span>
                      <span className={styles.missionAmount}>{mission.amount}</span>
                    </div>
                    <strong>{mission.title}</strong>
                    <p>{mission.partner}</p>
                    <small>{mission.date}</small>
                  </Link>
                ))
              ) : (
                <Link href="/dashboard/owner/demandes" className={styles.emptyCard}>
                  Vous n&apos;avez aucune mission active. Creez votre premiere mission.
                </Link>
              )}
            </div>
          </AsyncState>
        </DashboardPanel>

        <DashboardPanel title="Ma conciergerie">
          <AsyncState loading={loading} error={error}>
            <div className={styles.conciergeList}>
              {partnerRows.length > 0 ? (
                partnerRows.map((partner) => (
                  <Link
                    key={partner.name}
                    href="/dashboard/owner/conciergerie/partenaires"
                    className={styles.conciergeCard}
                  >
                    <div className={styles.conciergeTop}>
                      <span className={styles.partnerAvatar}>{partner.name.charAt(0).toUpperCase()}</span>
                      <div>
                        <strong>{partner.name}</strong>
                        <p>{partner.propertyList || "Logement à préciser"}</p>
                      </div>
                    </div>
                    <div className={styles.conciergeMeta}>
                      <span>{partner.missions} mission(s)</span>
                      <span>Prochaine date: {partner.nextMissionLabel}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <Link href="/dashboard/owner/concierges" className={styles.emptyCard}>
                  Aucune conciergerie associée. Trouver une conciergerie.
                </Link>
              )}
            </div>
          </AsyncState>
        </DashboardPanel>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="owner-finance-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Finances</span>
          <h2 id="owner-finance-title">Les flux à arbitrer sans chercher l'information</h2>
        </div>
        <div className={styles.financeLayout}>
          {financeCards.map((card) => (
            <article key={card.label} className={styles.financeCard}>
              <span className={styles.financeLabel}>{card.label}</span>
              <strong className={styles.financeValue}>{card.value}</strong>
              <p>{card.detail}</p>
            </article>
          ))}
          <DashboardPanel title="Acces financier">
            <div className={styles.financeActions}>
              <Link href="/dashboard/owner/devis" className={styles.financeAction}>
                <FileText size={16} />
                <div>
                  <strong>Voir les devis</strong>
                  <p>Suivre les montants et vos arbitrages.</p>
                </div>
              </Link>
              <Link href="/dashboard/owner/factures" className={styles.financeAction}>
                <Receipt size={16} />
                <div>
                  <strong>Voir les factures</strong>
                  <p>Vérifier les soldes, statuts et règlements.</p>
                </div>
              </Link>
              <Link href="/dashboard/owner/messages" className={styles.financeAction}>
                <MessageSquareText size={16} />
                <div>
                  <strong>Contacter la conciergerie</strong>
                  <p>Débloquer rapidement un devis ou un paiement.</p>
                </div>
              </Link>
            </div>
          </DashboardPanel>
        </div>
      </section>

      <details className={styles.disclosureBlock}>
        <summary className={styles.disclosureSummary}>
          <div>
            <span className={styles.sectionEyebrow}>Analyses avancées</span>
            <strong>Ouvrir les éléments secondaires du cockpit</strong>
            <p>Cette zone conserve les lectures de fond sans alourdir le cœur du tableau de bord.</p>
          </div>
        </summary>
        <div className={styles.disclosureContent}>
          <section className={styles.panelGrid}>
            <DashboardPanel title="Notes de pilotage">
              <AsyncState loading={loading} error={error}>
                <div className={styles.noteList}>
                  {strategyNotes.map((note) => (
                    <article key={note.title} className={styles.noteCard}>
                      <div className={styles.noteTitleRow}>
                        <Sparkles size={15} />
                        <strong>{note.title}</strong>
                      </div>
                      <p>{note.text}</p>
                    </article>
                  ))}
                </div>
              </AsyncState>
            </DashboardPanel>

            <DashboardPanel title="Progression propriétaire">
              <AsyncState loading={loading} error={error}>
                <div className={styles.storyBlock}>
                  <p>
                    Parcours global: {ownerActivationProgress.completedCount}/{ownerActivationProgress.totalCount} jalons
                    valides ({ownerActivationProgress.percentage}%).
                  </p>
                  <p>
                    Jalons restants:{" "}
                    {ownerActivationProgress.missingItems.length > 0
                      ? ownerActivationProgress.missingItems.join(", ")
                      : "aucun, parcours complet."}
                  </p>
                  <Link href="/dashboard/owner/demandes" className={styles.panelLink}>
                    Continuer le parcours owner
                  </Link>
                </div>
              </AsyncState>
            </DashboardPanel>
          </section>
        </div>
      </details>

      <details className={styles.disclosureBlock}>
        <summary className={styles.disclosureSummary}>
          <div>
            <span className={styles.sectionEyebrow}>Parcours & options</span>
            <strong>Parcours business+ et future logique business++</strong>
            <p>La couche onboarding reste disponible sans polluer la lecture métier du quotidien.</p>
          </div>
        </summary>
        <div className={styles.disclosureContent}>
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
      </details>
    </DashboardLayout>
  );
}
