"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  BellRing,
  Building2,
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileText,
  Home,
  KeyRound,
  MapPinned,
  MessageSquareText,
  PiggyBank,
  Settings2,
  ShieldCheck,
  UserRoundSearch,
  Users,
  Wallet,
} from "lucide-react";
import { DashboardLoadingScreen } from "@/components/dashboard";
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
  UnifiedSpotlightList,
  UnifiedStatStack,
  type UnifiedPropertyItem,
  type UnifiedSpotlightItem,
  type UnifiedStatItem,
} from "@/app/components/dashboard/unified";
import { useOwnerDashboardData } from "./useOwnerDashboardData";
import { sidebarConfig } from "@/app/components/dashboard/Sidebar/sidebarconfig";
import styles from "./OwnerUnifiedDashboard.module.scss";

const DAY_MS = 24 * 60 * 60 * 1000;

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
  if (hour < 18) return "Bon apres-midi";
  return "Bonsoir";
}

function getQuoteStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "accepted":
      return "Accepte";
    case "rejected":
      return "Refuse";
    case "sent":
      return "Envoye";
    case "expired":
      return "Expire";
    default:
      return "A arbitrer";
  }
}

function getInvoiceStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "paid":
      return "Reglee";
    case "canceled":
      return "Annulee";
    case "overdue":
      return "En retard";
    default:
      return "A verifier";
  }
}

function getMissionStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "assigned":
      return "Assignee";
    case "accepted":
      return "Acceptee";
    case "to_schedule":
      return "A planifier";
    case "date_requested":
      return "Date demandee";
    case "date_proposed":
      return "Date proposee";
    case "date_confirmed":
    case "scheduled":
      return "Planifiee";
    case "in_progress":
      return "En cours";
    case "completed":
      return "Terminee";
    default:
      return "A suivre";
  }
}

function getPartnerName(name: string | null | undefined) {
  const trimmed = name?.trim();
  return trimmed || "Conciergerie a preciser";
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
    invoices,
    conversations,
    requestsCount,
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

  const ownerName = user?.firstName || user?.username || "Proprietaire";

  const todayMissionCount = useMemo(
    () =>
      ongoingMissions.filter((mission) => {
        const date = getDateTime(mission.scheduled_start);
        return date ? isSameLocalDay(date, new Date()) : false;
      }).length,
    [ongoingMissions],
  );

  const nextWeekMissionCount = useMemo(
    () => ongoingMissions.filter((mission) => isWithinNextDays(mission.scheduled_start, 7)).length,
    [ongoingMissions],
  );

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
          ongoingMissions
            .map((mission) => mission.concierge_name?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [ongoingMissions],
  );

  const propertyItems = useMemo<UnifiedPropertyItem[]>(
    () =>
      properties.slice(0, 6).map((property, index) => {
        const propertyMissions = ongoingMissions.filter(
          (mission) => String(mission.property_id ?? "") === String(property.id),
        );
        const nextMission = [...propertyMissions]
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
          location: property.ville || "Ville a preciser",
          status: isActive ? "Actif" : "A finaliser",
          icon: isActive ? <Home size={18} /> : <KeyRound size={18} />,
          tone,
          note:
            Array.isArray(property.infos?.equipements) && property.infos.equipements.length > 0
              ? property.infos.equipements.slice(0, 3).join(", ")
              : "Infos essentielles ou equipements a completer.",
          href: `/dashboard/owner/logements/${property.id}`,
          metrics: [
            {
              label: "Missions",
              value: `${propertyMissions.length}`,
            },
            {
              label: "Prochain",
              value: nextMission
                ? formatDateValue(nextMission.scheduled_start, {
                    day: "2-digit",
                    month: "short",
                  }) || "Planifie"
                : "Aucune date",
            },
          ],
        };
      }),
    [ongoingMissions, properties],
  );

  const priorityItems = useMemo<UnifiedSpotlightItem[]>(() => {
    const items: UnifiedSpotlightItem[] = [];
    const latestQuote = latestQuotes[0];
    const latestInvoice = latestInvoices[0];
    const latestMission = ongoingMissions[0];

    if (latestQuote) {
      items.push({
        id: `quote-${latestQuote.id}`,
        label: "Devis",
        title: latestQuote.quote_number || "Decision",
        detail: `${getQuoteStatusLabel(latestQuote.status)} · ${formatEuroAmountLabel(latestQuote.total_amount)}`,
        icon: <FileCheck2 size={16} />,
        meta: latestQuote.valid_until
          ? `Jusqu'au ${formatDateValue(latestQuote.valid_until, { day: "2-digit", month: "short" })}`
          : "A regarder",
        href: "/dashboard/owner/devis",
        tone: "accent",
      });
    }

    if (latestInvoice) {
      items.push({
        id: `invoice-${latestInvoice.id}`,
        label: "Facture",
        title: latestInvoice.invoice_number || "Controle",
        detail: `${getInvoiceStatusLabel(latestInvoice.status)} · ${formatEuroAmountLabel(latestInvoice.balance_amount)}`,
        icon: <PiggyBank size={16} />,
        meta: "Point financier",
        href: "/dashboard/owner/factures",
        tone: "neutral",
      });
    }

    if (unreadConversationCount > 0) {
      items.push({
        id: "messages",
        label: "Messages",
        title: `${unreadConversationCount} a lire`,
        detail: "Une reponse rapide garde le terrain fluide.",
        icon: <BellRing size={16} />,
        meta: "Messagerie",
        href: "/dashboard/owner/messages",
        tone: "warning",
      });
    }

    if (latestMission) {
      items.push({
        id: `mission-${latestMission.id}`,
        label: "Mission",
        title: latestMission.title || "Intervention",
        detail: `${getMissionStatusLabel(latestMission.status)} · ${getPartnerName(latestMission.concierge_name)}`,
        icon: <CalendarDays size={16} />,
        meta: latestMission.scheduled_start
          ? formatDateValue(latestMission.scheduled_start, {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }) || "Date a confirmer"
          : "Date a confirmer",
        href: "/dashboard/owner/planning",
        tone: "success",
      });
    }

    return items.slice(0, 4);
  }, [latestInvoices, latestQuotes, ongoingMissions, unreadConversationCount]);

  const topMissionItems = useMemo(
    () =>
      ongoingMissions.slice(0, 3).map((mission) => ({
        id: mission.id,
        title: mission.title || "Mission",
        status: getMissionStatusLabel(mission.status),
        partner: getPartnerName(mission.concierge_name),
        date:
          formatDateValue(mission.scheduled_start, {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }) || "Date a confirmer",
      })),
    [ongoingMissions],
  );

  const quoteListItems = useMemo(
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
      })),
    [quotes],
  );

  const messageListItems = useMemo(
    () =>
      conversations
        .filter((conversation) => Boolean(conversation.last_message_at))
        .slice(0, 4)
        .map((conversation) => ({
          id: conversation.id,
          title: conversation.subject || conversation.counterpart_name || "Message",
          preview: conversation.last_message_preview || "Ouvrir la conversation",
          date:
            formatDateValue(conversation.last_message_at, {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }) || "Sans date",
          unread: typeof conversation.unread_count === "number" ? conversation.unread_count : 0,
        })),
    [conversations],
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
            ? `${formatEuroAmountLabel(quoteAwaitingTotal)} a arbitrer`
            : "Aucun en attente",
      },
      {
        label: "Factures",
        value: `${pendingInvoices.length}`,
        icon: <PiggyBank size={16} />,
        tone: "soft",
        detail:
          pendingInvoices.length > 0
            ? `${formatEuroAmountLabel(pendingInvoiceTotal)} a surveiller`
            : "Aucun point urgent",
      },
      {
        label: "Messages",
        value: `${unreadConversationCount}`,
        icon: <MessageSquareText size={16} />,
        tone: "neutral",
        detail: "Coordination en cours",
      },
    ],
    [pendingInvoiceTotal, pendingInvoices.length, quoteAwaitingCount, quoteAwaitingTotal, unreadConversationCount],
  );

  const partnerStats = useMemo<UnifiedStatItem[]>(
    () => [
      {
        label: "Partenaires",
        value: `${distinctPartners.length}`,
        icon: <UserRoundSearch size={16} />,
        tone: "soft",
        detail: distinctPartners[0] ? distinctPartners[0] : "Aucun relie",
      },
      {
        label: "Aujourd'hui",
        value: `${todayMissionCount}`,
        icon: <Clock3 size={16} />,
        tone: "accent",
        detail: nextWeekMissionCount > 0 ? `${nextWeekMissionCount} cette semaine` : "Semaine legere",
      },
      {
        label: "Parc",
        value: `${activeCount}/${properties.length || 0}`,
        icon: <ShieldCheck size={16} />,
        tone: "neutral",
        detail: draftCount > 0 ? `${draftCount} a finaliser` : "Sous controle",
      },
    ],
    [activeCount, distinctPartners, draftCount, nextWeekMissionCount, properties.length, todayMissionCount],
  );

  const ownerSectionCards = useMemo(() => {
    const sections = sidebarConfig.owner.filter((item) => item.label !== "Tableau de bord");
    const sectionMeta: Record<
      string,
      {
        icon: ReactNode;
        tone: string;
        value: string;
        detail: string;
      }
    > = {
      Logements: {
        icon: <Home size={18} />,
        tone: styles.sectionSage,
        value: `${properties.length}`,
        detail: draftCount > 0 ? `${draftCount} fiche(s) à finaliser` : "Parc prêt",
      },
      Missions: {
        icon: <ClipboardList size={18} />,
        tone: styles.sectionGold,
        value: `${ongoingMissions.length}`,
        detail: todayMissionCount > 0 ? `${todayMissionCount} aujourd'hui` : "Aucune urgence",
      },
      Conciergeries: {
        icon: <Users size={18} />,
        tone: styles.sectionMint,
        value: `${distinctPartners.length}`,
        detail: requestsCount > 0 ? `${requestsCount} demande(s)` : "Recherche disponible",
      },
      Finances: {
        icon: <Wallet size={18} />,
        tone: styles.sectionPaper,
        value: `${quoteAwaitingCount + pendingInvoices.length}`,
        detail: `${quoteAwaitingCount} devis · ${pendingInvoices.length} factures`,
      },
      Profil: {
        icon: <Settings2 size={18} />,
        tone: styles.sectionInk,
        value: `${ownerActivationProgress.percentage}%`,
        detail: "Paramètres et complétude",
      },
    };

    return sections.map((section) => ({
      ...section,
      ...(sectionMeta[section.label] ?? {
        icon: <FileText size={18} />,
        tone: styles.sectionPaper,
        value: "—",
        detail: "Accès rapide",
      }),
    }));
  }, [
    distinctPartners.length,
    draftCount,
    ongoingMissions.length,
    ownerActivationProgress.percentage,
    pendingInvoices.length,
    properties.length,
    quoteAwaitingCount,
    requestsCount,
    todayMissionCount,
  ]);

  const quickVisualCards = useMemo(
    () => [
      {
        id: "ready",
        label: "Prêt",
        value: `${activeCount}`,
        icon: <CheckCircle2 size={18} />,
        tone: styles.softMint,
      },
      {
        id: "today",
        label: "Jour",
        value: `${todayMissionCount}`,
        icon: <Clock3 size={18} />,
        tone: styles.softGold,
      },
      {
        id: "money",
        label: "À valider",
        value: `${quoteAwaitingCount + pendingInvoices.length}`,
        icon: <CircleDollarSign size={18} />,
        tone: styles.softOlive,
      },
      {
        id: "map",
        label: "Biens",
        value: `${properties.length}`,
        icon: <MapPinned size={18} />,
        tone: styles.softPaper,
      },
    ],
    [activeCount, pendingInvoices.length, properties.length, quoteAwaitingCount, todayMissionCount],
  );

  const moodCards = useMemo(
    () => [
      {
        id: "park",
        title: "Parc",
        value: draftCount > 0 ? "A finir" : "Stable",
        detail: draftCount > 0 ? `${draftCount} fiche(s)` : "Tout actif",
        icon: <Building2 size={18} />,
        tone: styles.tileOlive,
      },
      {
        id: "ops",
        title: "Terrain",
        value: nextWeekMissionCount > 0 ? "Cadence" : "Calme",
        detail: `${nextWeekMissionCount} sur 7 jours`,
        icon: <CalendarDays size={18} />,
        tone: styles.tileGold,
      },
      {
        id: "talk",
        title: "Échanges",
        value: unreadConversationCount > 0 ? "Répondre" : "À jour",
        detail: `${unreadConversationCount} message(s)`,
        icon: <MessageSquareText size={18} />,
        tone: styles.tileInk,
      },
    ],
    [draftCount, nextWeekMissionCount, unreadConversationCount],
  );

  const onboardingDisclosure = (
    <div className={styles.disclosureStack}>
      <section className={styles.disclosureIntroCard}>
        <div className={styles.disclosureIntroHeader}>
          <span className={styles.disclosureIntroIcon}>
            <Settings2 size={16} />
          </span>
          <div>
            <strong>Parcours & options</strong>
            <p>Retrouvez ici les réglages, rappels et leviers secondaires qui structurent votre espace propriétaire.</p>
          </div>
        </div>
        <div className={styles.disclosureBulletList}>
          <article>
            <strong>Onboarding</strong>
            <p>Suivez les étapes encore incomplètes pour stabiliser votre parc, vos demandes et vos validations.</p>
          </article>
          <article>
            <strong>Rappels utiles</strong>
            <p>Gardez visibles les points de configuration importants sans les faire remonter dans le tableau principal.</p>
          </article>
          <article>
            <strong>Options de pilotage</strong>
            <p>Centralisez vos paramètres de profil, de zone et de disponibilité dans une lecture plus calme.</p>
          </article>
        </div>
      </section>
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

  const portfolioDisclosure = (
    <div className={styles.progressBlock}>
      <section className={styles.disclosureIntroCard}>
        <div className={styles.disclosureIntroHeader}>
          <span className={styles.disclosureIntroIcon}>
            <ShieldCheck size={16} />
          </span>
          <div>
            <strong>Progression propriétaire</strong>
            <p>Visualisez la maturité réelle de votre parcours business+ et les éléments à renforcer pour fiabiliser l’exploitation.</p>
          </div>
        </div>
        <div className={styles.disclosureBulletList}>
          <article>
            <strong>Jalons business+</strong>
            <p>Chaque jalon validé renforce la qualité des demandes, du parc et des échanges avec vos partenaires.</p>
          </article>
          <article>
            <strong>Maturité du parc</strong>
            <p>Cette lecture vous aide à voir si vos logements, missions et flux financiers sont suffisamment structurés.</p>
          </article>
          <article>
            <strong>Prochaine action</strong>
            <p>Les éléments manquants servent de guide pour savoir quoi finaliser ensuite, sans chercher dans tous les onglets.</p>
          </article>
        </div>
      </section>
      <p>
        Parcours global: {ownerActivationProgress.completedCount}/{ownerActivationProgress.totalCount} jalons valides (
        {ownerActivationProgress.percentage}%).
      </p>
      <p>
        Jalons restants:{" "}
        {ownerActivationProgress.missingItems.length > 0
          ? ownerActivationProgress.missingItems.join(", ")
          : "aucun, parcours complet."}
      </p>
      <Link href="/dashboard/owner/demandes" className={styles.inlineLink}>
        Continuer le parcours owner
      </Link>
    </div>
  );

  if (userLoading || !isAuthenticated) {
    return <DashboardLoadingScreen label="Chargement de votre espace proprietaire..." />;
  }

  return (
    <div className="theme-owner">
      <UnifiedRoleDashboard
        role="owner"
        title={`${getGreetingLabel()} ${ownerName}, votre tableau se lit en un clin d'oeil.`}
        subtitle={
          loading
            ? "Nous consolidons vos logements, missions, devis et messages."
            : error ||
              `Vue rapide de ${properties.length} bien(s), ${ongoingMissions.length} mission(s) et ${quoteAwaitingCount + pendingInvoices.length} point(s) a decider.`
        }
        experienceBadge={averageRating ? `${averageRating.toFixed(1)} / 5` : "Patrimoine actif"}
        statusLabel={draftCount > 0 ? `${draftCount} fiche(s) a finaliser` : "Parc sous controle"}
        actions={[
          {
            id: "properties",
            label: "Mes logements",
            href: "/dashboard/owner/logements",
            tone: "primary",
          },
          {
            id: "request",
            label: "Nouvelle mission",
            href: "/dashboard/owner/demandes",
            tone: "secondary",
          },
          {
            id: "concierge",
            label: "Trouver un partenaire",
            href: "/dashboard/owner/concierges",
            tone: "ghost",
          },
        ]}
        kpis={[
          {
            id: "properties",
            label: "Logements",
            value: `${activeCount}/${properties.length || 0}`,
            detail: draftCount > 0 ? `${draftCount} à revoir` : "Tous actifs",
            icon: <Building2 size={18} />,
          },
          {
            id: "missions",
            label: "Missions",
            value: `${ongoingMissions.length}`,
            detail: todayMissionCount > 0 ? `${todayMissionCount} aujourd'hui` : "Journée calme",
            icon: <CalendarDays size={18} />,
          },
          {
            id: "quotes",
            label: "Arbitrages",
            value: `${quoteAwaitingCount + pendingInvoices.length}`,
            detail: `${quoteAwaitingCount} devis · ${pendingInvoices.length} factures`,
            icon: <CircleDollarSign size={18} />,
          },
          {
            id: "messages",
            label: "Messages",
            value: `${unreadConversationCount}`,
            detail: unreadConversationCount > 0 ? "À lire" : "À jour",
            icon: <MessageSquareText size={18} />,
          },
        ]}
        leftPrimary={
          <div className={styles.primaryGrid}>
            <section className={styles.contentBlock}>
              <div className={styles.blockHeader}>
                <h3>Missions en vue</h3>
              </div>
              {topMissionItems.length > 0 ? (
                <div className={styles.missionHeroList}>
                  {topMissionItems.map((mission) => (
                    <Link key={mission.id} href="/dashboard/owner/planning" className={styles.missionHeroCard}>
                      <div className={styles.missionHeroTop}>
                        <span className={styles.missionHeroIcon}>
                          <CalendarDays size={18} />
                        </span>
                        <span className={styles.missionHeroStatus}>{mission.status}</span>
                      </div>
                      <strong>{mission.title}</strong>
                      <p>{mission.partner}</p>
                      <small>{mission.date}</small>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyListState}>Aucune mission active.</div>
              )}
            </section>

            <section className={styles.contentBlock}>
              <div className={styles.blockHeader}>
                <h3>À traiter</h3>
              </div>
              <UnifiedSpotlightList items={priorityItems} emptyLabel="Aucun point urgent." />
            </section>
          </div>
        }
        leftSecondary={
          <section className={styles.contentBlock}>
            <div className={styles.blockHeader}>
              <h3>Mes logements</h3>
            </div>
            <UnifiedPropertyPortfolio items={propertyItems} />
          </section>
        }
        mainSections={[
          {
            id: "visual-radar",
            title: "Radar rapide",
            subtitle: "4 repères courts, visuels et immédiats.",
            content: (
              <div className={styles.visualGrid}>
                {quickVisualCards.map((card) => (
                  <article key={card.id} className={`${styles.visualCard} ${card.tone}`}>
                    <span className={styles.visualIcon}>{card.icon}</span>
                    <strong>{card.value}</strong>
                    <span>{card.label}</span>
                  </article>
                ))}
              </div>
            ),
          },
          {
            id: "quotes-list",
            title: "Devis",
            subtitle: "Liste courte, lecture rapide.",
            content: (
              <div className={styles.compactList}>
                {quoteListItems.length > 0 ? (
                  quoteListItems.map((quote) => (
                    <Link key={quote.id} href="/dashboard/owner/devis" className={styles.compactRow}>
                      <span className={styles.compactIcon}>
                        <FileCheck2 size={16} />
                      </span>
                      <div className={styles.compactCopy}>
                        <strong>{quote.title}</strong>
                        <span>{quote.status}</span>
                      </div>
                      <div className={styles.compactMeta}>
                        <strong>{quote.amount}</strong>
                        <small>{quote.date}</small>
                      </div>
                      <ChevronRight size={16} />
                    </Link>
                  ))
                ) : (
                  <div className={styles.emptyListState}>Aucun devis.</div>
                )}
              </div>
            ),
          },
          {
            id: "messages-list",
            title: "Messages",
            subtitle: "Liste courte, lecture rapide.",
            content: (
              <div className={styles.compactList}>
                {messageListItems.length > 0 ? (
                  messageListItems.map((message) => (
                    <Link key={message.id} href="/dashboard/owner/messages" className={styles.compactRow}>
                      <span className={styles.compactIcon}>
                        <MessageSquareText size={16} />
                      </span>
                      <div className={styles.compactCopy}>
                        <strong>{message.title}</strong>
                        <span>{message.preview}</span>
                      </div>
                      <div className={styles.compactMeta}>
                        <strong>{message.unread > 0 ? `${message.unread}` : "-"}</strong>
                        <small>{message.date}</small>
                      </div>
                      <ChevronRight size={16} />
                    </Link>
                  ))
                ) : (
                  <div className={styles.emptyListState}>Aucun message récent.</div>
                )}
              </div>
            ),
          },
          {
            id: "owner-spaces",
            title: "Tous vos espaces",
            subtitle: "Le tableau de bord couvre tous les onglets importants de votre sidebar.",
            content: (
              <div className={styles.sectionHubGrid}>
                {ownerSectionCards.map((section) => (
                  <article key={section.label} className={`${styles.sectionHubCard} ${section.tone}`}>
                    <div className={styles.sectionHubTop}>
                      <span className={styles.sectionHubIcon}>{section.icon}</span>
                      <div>
                        <strong>{section.label}</strong>
                        <p>{section.value}</p>
                      </div>
                    </div>
                    <small>{section.detail}</small>
                    <div className={styles.sectionHubLinks}>
                      {section.children?.slice(0, 4).map((child) => (
                        <Link key={child.path} href={child.path} className={styles.sectionHubLink}>
                          <span>{child.label}</span>
                          <ChevronRight size={14} />
                        </Link>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ),
          },
        ]}
        sidebarSections={[
          {
            id: "finance",
            title: "Lecture financiere",
            subtitle: "Montants et arbitrages visibles sans effort.",
            content: <UnifiedStatStack items={financeStats} />,
          },
          {
            id: "operations",
            title: "Controle terrain",
            subtitle: "Rythme, partenaires et niveau de preparation.",
            content: <UnifiedStatStack items={partnerStats} />,
          },
        ]}
        disclosures={[
          {
            id: "onboarding",
            label: "Parcours & options",
            summary: "Onboarding et rappels secondaires",
            content: onboardingDisclosure,
          },
          {
            id: "progress",
            label: "Progression proprietaire",
            summary: "Jalons business+ et maturite du parc",
            content: portfolioDisclosure,
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
