"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  CircleAlert,
  Clock3,
  Euro,
  FileText,
  MessageSquareText,
  Receipt,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  UserRound,
  Wrench,
} from "lucide-react";
import { DashboardLoadingScreen } from "@/components/dashboard";
import { Alert, ButtonLink } from "@/components/ui";
import { getProviderInterventionHref } from "@/app/dashboard/provider/interventionLinks";
import { formatCurrencyAmount, formatDateValue } from "@/app/utils/formatters";
import { DashboardOnboardingSummary } from "@/features/onboarding-assistant";
import { DashboardEmptyState, getDashboardMissionPaceMeta } from "@/app/components/dashboard/saas";
import {
  UnifiedRoleDashboard,
  UnifiedSpotlightList,
  UnifiedStatStack,
  type UnifiedSpotlightItem,
} from "@/app/components/dashboard/unified";
import { ARTISAN_DASHBOARD_CONFIG } from "@/features/artisan-dashboard";
import {
  useProviderDashboardData,
  type ProviderInterventionItem,
  type ProviderQuoteItem,
} from "@/app/dashboard/provider/useProviderDashboardData";
import { DashboardConfigurationCard, PROVIDER_CONFIGURATION_STEPS, getProviderConfigurationProgress } from "@/features/shared/components";
import styles from "@/app/dashboard/provider/ProviderDashboard.module.scss";

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

function isToday(value: string | null | undefined) {
  const date = getDateTime(value);
  return date ? isSameLocalDay(date, new Date()) : false;
}

function isTomorrow(value: string | null | undefined) {
  const date = getDateTime(value);
  if (!date) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameLocalDay(date, tomorrow);
}

function isWithinNextDays(value: string | null | undefined, days: number) {
  const date = getDateTime(value);
  if (!date) return false;
  const now = new Date();
  const max = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return date >= now && date <= max;
}

function isUpcoming(value: string | null | undefined) {
  const date = getDateTime(value);
  return date !== null && date >= new Date();
}

function getGreetingLabel() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon apres-midi";
  return "Bonsoir";
}

function formatTime(value: string | null | undefined) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getInterventionStatusLabel(status: string | null | undefined) {
  switch ((status ?? "").trim().toLowerCase()) {
    case "accepted":
      return "Acceptée";
    case "in_progress":
      return "En cours";
    case "completed":
      return "Terminée";
    case "cancelled":
    case "canceled":
      return "Annulée";
    default:
      return "À répondre";
  }
}

function getQuoteStatusLabel(status: string | null | undefined) {
  switch ((status ?? "").trim().toLowerCase()) {
    case "accepted":
      return "Accepté";
    case "rejected":
      return "Refusé";
    case "sent":
      return "Envoyé";
    case "expired":
      return "Expiré";
    default:
      return "Brouillon";
  }
}

function isOpenIntervention(status: string | null | undefined) {
  return !["completed", "cancelled", "canceled"].includes((status ?? "").trim().toLowerCase());
}

function isPendingIntervention(status: string | null | undefined) {
  return (status ?? "").trim().toLowerCase() === "pending";
}

function isAcceptedIntervention(status: string | null | undefined) {
  return ["accepted", "in_progress"].includes((status ?? "").trim().toLowerCase());
}

function isCompletedIntervention(status: string | null | undefined) {
  return (status ?? "").trim().toLowerCase() === "completed";
}

function isPendingQuote(status: string | null | undefined) {
  return ["draft", "sent"].includes((status ?? "").trim().toLowerCase());
}

function isAcceptedQuote(status: string | null | undefined) {
  return (status ?? "").trim().toLowerCase() === "accepted";
}

function getClientName(
  clientId: string | null | undefined,
  clientsById: Map<string, { client_name: string | null; company_name: string | null }>,
) {
  if (!clientId) return "Client à préciser";
  const client = clientsById.get(clientId);
  return client?.client_name || client?.company_name || "Client à préciser";
}

const PRIORITY_ICONS = {
  none: CircleAlert,
  security: ShieldAlert,
  cleaning: Sparkles,
  maintenance: Wrench,
  other: TriangleAlert,
};

function getPriorityIconKey(intervention: ProviderInterventionItem | null): keyof typeof PRIORITY_ICONS {
  if (!intervention) return "none";
  const text = `${intervention.title ?? ""} ${intervention.service_label ?? ""}`.toLowerCase();
  if (text.includes("serrure") || text.includes("depannage")) return "security";
  if (text.includes("menage")) return "cleaning";
  if (text.includes("reparation") || text.includes("maintenance")) return "maintenance";
  return "other";
}

function getQuoteClientLabel(quote: ProviderQuoteItem) {
  return (
    quote.owner?.company_name ||
    [quote.owner?.first_name, quote.owner?.last_name].filter(Boolean).join(" ") ||
    "Client"
  );
}

export default function ProviderDashboardPage() {
  const { workspace, dashboard, error, isLoading, displayName } = useProviderDashboardData();

  const providerProgress = useMemo(
    () => getProviderConfigurationProgress(workspace?.profile),
    [workspace?.profile],
  );

  const interventions = useMemo(() => dashboard?.interventions ?? [], [dashboard?.interventions]);
  const clients = useMemo(() => dashboard?.clients ?? [], [dashboard?.clients]);
  const quotes = useMemo(() => dashboard?.quotes ?? [], [dashboard?.quotes]);

  const clientsById = useMemo(
    () =>
      new Map(
        clients.map((client) => [
          client.id,
          {
            client_name: client.client_name,
            company_name: client.company_name,
          },
        ]),
      ),
    [clients],
  );

  const proposedMissions = useMemo(() => interventions.filter((item) => isPendingIntervention(item.status)), [interventions]);
  const acceptedMissions = useMemo(() => interventions.filter((item) => isAcceptedIntervention(item.status)), [interventions]);
  const openMissions = useMemo(() => interventions.filter((item) => isOpenIntervention(item.status)), [interventions]);

  const interventionsToday = useMemo(
    () =>
      acceptedMissions
        .filter((item) => isToday(item.scheduled_start))
        .sort(
          (a, b) =>
            (getDateTime(a.scheduled_start)?.getTime() ?? 0) - (getDateTime(b.scheduled_start)?.getTime() ?? 0),
        ),
    [acceptedMissions],
  );

  const missionPaceMeta = useMemo(() => getDashboardMissionPaceMeta(interventionsToday.length), [interventionsToday.length]);

  const upcomingMissions = useMemo(
    () =>
      openMissions
        .filter((item) => isUpcoming(item.scheduled_start))
        .sort(
          (a, b) =>
            (getDateTime(a.scheduled_start)?.getTime() ?? 0) - (getDateTime(b.scheduled_start)?.getTime() ?? 0),
        ),
    [openMissions],
  );

  const weekCount = useMemo(
    () => acceptedMissions.filter((item) => isWithinNextDays(item.scheduled_start, 7)).length,
    [acceptedMissions],
  );

  const pendingQuotes = useMemo(() => quotes.filter((quote) => isPendingQuote(quote.status)), [quotes]);
  const acceptedQuotes = useMemo(() => quotes.filter((quote) => isAcceptedQuote(quote.status)), [quotes]);
  const invoiceToIssueCount = acceptedQuotes.length;
  const paymentsToReceiveCount = acceptedQuotes.length;

  const expectedRevenue = useMemo(
    () =>
      acceptedMissions.reduce(
        (sum, item) => sum + (typeof item.budget_amount === "number" ? item.budget_amount : 0),
        0,
      ) +
      acceptedQuotes.reduce(
        (sum, quote) => sum + (typeof quote.total_amount === "number" ? quote.total_amount : 0),
        0,
      ),
    [acceptedMissions, acceptedQuotes],
  );

  const realizedRevenue = useMemo(
    () =>
      interventions.reduce((sum, item) => {
        if (!isCompletedIntervention(item.status)) return sum;
        return sum + (typeof item.budget_amount === "number" ? item.budget_amount : 0);
      }, 0),
    [interventions],
  );

  const completedCount = useMemo(
    () => interventions.filter((item) => isCompletedIntervention(item.status)).length,
    [interventions],
  );

  const priorityIntervention = useMemo(() => {
    const urgentToday = openMissions.find((item) => item.priority === "urgent" && isToday(item.scheduled_start));
    if (urgentToday) return urgentToday;
    const proposedToday = proposedMissions.find((item) => isToday(item.scheduled_start));
    if (proposedToday) return proposedToday;
    return openMissions[0] ?? null;
  }, [openMissions, proposedMissions]);

  const recentActivity = useMemo(() => {
    const interventionActivity = interventions
      .filter((item) => item.created_at || item.scheduled_start)
      .slice(0, 3)
      .map((item) => ({
        id: `mission-${item.id}`,
        label: isPendingIntervention(item.status)
          ? "Mission recue"
          : isCompletedIntervention(item.status)
            ? "Mission realisee"
            : "Mission acceptee",
        title: item.title || item.service_label || "Intervention",
        detail: getClientName(item.client_id, clientsById),
        date: formatDateValue(item.scheduled_start || item.created_at, {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          emptyLabel: "Sans date",
        }),
        href: getProviderInterventionHref(item.id),
      }));

    const quoteActivity = quotes.slice(0, 2).map((quote) => ({
      id: `quote-${quote.id}`,
      label: isAcceptedQuote(quote.status) ? "Devis accepte" : "Devis",
      title: quote.quote_number || "Devis fournisseur",
      detail: getQuoteClientLabel(quote),
      date: formatDateValue(quote.accepted_at || quote.sent_at || quote.created_at, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        emptyLabel: "Sans date",
      }),
      href: "/dashboard/provider/devis",
    }));

    return [...interventionActivity, ...quoteActivity].slice(0, 4);
  }, [clientsById, interventions, quotes]);

  const upcomingQuotes = useMemo(() => pendingQuotes.slice(0, 4), [pendingQuotes]);
  const compactPlanning = useMemo(() => upcomingMissions.slice(0, 5), [upcomingMissions]);

  const financeStats = useMemo(
    () => [
      {
        label: "CA réalisé",
        value: formatCurrencyAmount(realizedRevenue, { currency: "EUR", emptyLabel: "0 EUR" }),
        detail: "Missions déjà terminées et valorisées",
      },
      {
        label: "CA prévisionnel",
        value: formatCurrencyAmount(expectedRevenue, { currency: "EUR", emptyLabel: "0 EUR" }),
        detail: "Projection issue des missions et devis acceptés",
      },
      {
        label: "Paiements attendus",
        value: String(paymentsToReceiveCount),
        detail: "Dossiers susceptibles de devenir un encaissement.",
      },
    ],
    [expectedRevenue, paymentsToReceiveCount, realizedRevenue],
  );

  const operationsStats = useMemo(
    () => [
      {
        label: "Aujourd'hui",
        value: String(interventionsToday.length),
        detail: "Interventions déjà positionnées sur la journée.",
      },
      {
        label: "Demain",
        value: String(acceptedMissions.filter((item) => isTomorrow(item.scheduled_start)).length),
        detail: "Charge de demain avant d'accepter autre chose.",
      },
      {
        label: "Semaine",
        value: String(weekCount),
        detail: "Volume confirmé dans les 7 prochains jours.",
      },
    ],
    [acceptedMissions, interventionsToday.length, weekCount],
  );

  const quickActions = [
    { label: "Créer devis", href: "/dashboard/provider/devis", icon: FileText },
    { label: "Déclarer mission terminée", href: "/dashboard/provider/interventions", icon: Wrench },
    { label: "Envoyer facture", href: "/dashboard/provider/devis", icon: Receipt },
    { label: "Contacter client", href: "/dashboard/provider/messages", icon: MessageSquareText },
  ];

  const priorityItems = useMemo<UnifiedSpotlightItem[]>(
    () => [
      {
        id: "missions-pending",
        label: "Missions à répondre",
        title: `${proposedMissions.length} mission(s) attendent une décision`,
        detail: "Accepter, négocier ou refuser avant qu'elles ne se refroidissent.",
        href: "/dashboard/provider/interventions",
        tone: proposedMissions.length > 0 ? "warning" : "neutral",
        icon: <TriangleAlert size={16} />,
      },
      {
        id: "quotes-pending",
        label: "Devis à suivre",
        title: `${pendingQuotes.length} devis en attente`,
        detail: "Brouillons et envois à relancer ou finaliser rapidement.",
        href: "/dashboard/provider/devis",
        tone: pendingQuotes.length > 0 ? "accent" : "neutral",
        icon: <FileText size={16} />,
      },
      {
        id: "invoices",
        label: "Factures",
        title: `${invoiceToIssueCount} facture(s) à émettre`,
        detail: "Les devis acceptés doivent se transformer en factures et paiements.",
        href: "/dashboard/provider/devis",
        tone: invoiceToIssueCount > 0 ? "accent" : "neutral",
        icon: <Receipt size={16} />,
      },
    ],
    [invoiceToIssueCount, pendingQuotes.length, proposedMissions.length],
  );

  const missionItems = useMemo<UnifiedSpotlightItem[]>(
    () =>
      compactPlanning.map((item) => ({
        id: item.id,
        label: getInterventionStatusLabel(item.status),
        title: item.title || item.service_label || "Intervention",
        detail: `${item.location_label || "Lieu à préciser"} · ${getClientName(item.client_id, clientsById)}`,
        meta: `${formatTime(item.scheduled_start)} · ${formatDateValue(item.scheduled_start, {
          day: "2-digit",
          month: "short",
          emptyLabel: "Date à confirmer",
        })}`,
        href: getProviderInterventionHref(item.id),
        tone: item.priority === "urgent" ? "warning" : "accent",
        icon: <Clock3 size={16} />,
      })),
    [clientsById, compactPlanning],
  );

  const quoteItems = useMemo<UnifiedSpotlightItem[]>(
    () =>
      upcomingQuotes.map((quote) => ({
        id: quote.id,
        label: getQuoteStatusLabel(quote.status),
        title: quote.quote_number || "Devis brouillon",
        detail: getQuoteClientLabel(quote),
        meta: formatCurrencyAmount(quote.total_amount, {
          currency: quote.currency || "EUR",
          emptyLabel: "Montant a definir",
        }),
        href: "/dashboard/provider/devis",
        tone: isAcceptedQuote(quote.status) ? "success" : "accent",
        icon: <Euro size={16} />,
      })),
    [upcomingQuotes],
  );

  const activityItems = useMemo<UnifiedSpotlightItem[]>(
    () =>
      recentActivity.map((item) => ({
        id: item.id,
        label: item.label,
        title: item.title,
        detail: item.detail,
        meta: item.date,
        href: item.href,
        tone: item.label.includes("realisee") ? "success" : "neutral",
        icon: <Sparkles size={16} />,
      })),
    [recentActivity],
  );

  if (isLoading) {
    return <DashboardLoadingScreen label="Chargement de votre tableau de bord artisan…" />;
  }

  if (!dashboard?.interventionDataAvailable || !dashboard.quoteDataAvailable) {
    return (
      <section className={styles.sectionBlock}>
        <h1>Tableau de bord artisan</h1>
        <Alert tone="danger" title="Indicateurs temporairement indisponibles" announcement="assertive">
          Les interventions ou les devis n’ont pas pu être chargés. Accédez directement à la page dont vous avez besoin.
        </Alert>
        <div className={styles.priorityActions}>
          <ButtonLink href="/dashboard/provider/planning">Ouvrir mon planning</ButtonLink>
          <ButtonLink href="/dashboard/provider/interventions" variant="secondary">Voir mes interventions</ButtonLink>
          <ButtonLink href="/dashboard/provider/devis" variant="secondary">Voir devis et factures</ButtonLink>
        </div>
      </section>
    );
  }

  const PriorityIcon = PRIORITY_ICONS[getPriorityIconKey(priorityIntervention)];

  return (
    <div className="theme-artisan">
      <UnifiedRoleDashboard
        role="artisan"
        className={styles.providerUnified}
        title={`${getGreetingLabel()} ${displayName || "artisan"}`}
        subtitle={error || `${ARTISAN_DASHBOARD_CONFIG.subtitle} pour ${displayName}.`}
        experienceBadge={workspace?.summary.is_pro ? "Artisan PRO" : "Artisan Standard"}
        experienceBadgeTone={workspace?.summary.is_pro ? "success" : "info"}
        statusLabel={proposedMissions.length > 0 ? `${proposedMissions.length} à traiter` : "Aucune intervention en attente"}
        statusTone={proposedMissions.length > 0 ? "warning" : "success"}
        actions={[
          { id: "planning", label: "Ouvrir mon planning", href: "/dashboard/provider/planning", tone: "primary" },
          { id: "missions", label: "Voir mes interventions", href: "/dashboard/provider/interventions", tone: "secondary" },
          { id: "quotes", label: "Voir devis et factures", href: "/dashboard/provider/devis", tone: "ghost" },
        ]}
        kpis={[
          {
            id: "missions",
            label: "Interventions à venir",
            value: `${upcomingMissions.length}`,
            detail: interventionsToday.length > 0 ? `${interventionsToday.length} aujourd'hui` : "Aucune aujourd'hui",
            icon: <Wrench size={18} />,
            statusLabel: missionPaceMeta.label,
            statusTone: missionPaceMeta.tone,
            statusText: missionPaceMeta.label,
            href: "/dashboard/provider/planning",
          },
          {
            id: "quotes",
            label: "Devis en attente",
            value: `${pendingQuotes.length}`,
            detail: "À suivre ou relancer",
            icon: <FileText size={18} />,
            statusLabel: pendingQuotes.length > 0 ? "Action" : "A jour",
            statusTone: pendingQuotes.length > 0 ? "warning" : "success",
            href: "/dashboard/provider/devis",
          },
          {
            id: "responses",
            label: "Interventions à traiter",
            value: `${proposedMissions.length}`,
            detail: "Demandent une décision",
            icon: <TriangleAlert size={18} />,
            statusLabel: proposedMissions.length > 0 ? "Priorité" : "Stable",
            statusTone: proposedMissions.length > 0 ? "warning" : "success",
            href: "/dashboard/provider/interventions",
          },
          {
            id: "revenue",
            label: "CA previsionnel",
            value: formatCurrencyAmount(expectedRevenue, { currency: "EUR", emptyLabel: "0 EUR" }),
            detail: `${paymentsToReceiveCount} paiement(s) a recevoir`,
            icon: <Euro size={18} />,
            statusLabel: expectedRevenue > 0 ? "Revenus" : "A lancer",
            statusTone: expectedRevenue > 0 ? "info" : "warning",
            href: "/dashboard/provider/devis",
          },
        ]}
        leftPrimary={
          <div className={styles.sectionBlock}>
            <DashboardConfigurationCard
              steps={PROVIDER_CONFIGURATION_STEPS}
              configurationStatus={{
                completed: providerProgress.completed,
                total: providerProgress.total,
                isComplete: providerProgress.isComplete,
                onResume: () => {},
              }}
            />
            <article className={styles.priorityHero}>
              <span className={styles.priorityBadge}>
                {priorityIntervention?.priority === "urgent" ? "Intervention urgente" : "Mission prioritaire"}
              </span>
              <div className={styles.priorityHeader}>
                <div>
                  <strong>{priorityIntervention?.location_label || priorityIntervention?.title || "Aucune urgence detectee"}</strong>
                  <p>{priorityIntervention?.title || priorityIntervention?.service_label || "Votre planning est actuellement stable."}</p>
                </div>
                <span className={styles.priorityIcon}>
                  <PriorityIcon size={24} />
                </span>
              </div>
              <div className={styles.priorityMeta}>
                <span>
                  <Clock3 size={15} />
                  {priorityIntervention?.scheduled_start
                    ? formatDateValue(priorityIntervention.scheduled_start, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", emptyLabel: "Date à confirmer" })
                    : "Date à confirmer"}
                </span>
                <span>
                  <UserRound size={15} />
                  {priorityIntervention ? getClientName(priorityIntervention.client_id, clientsById) : "Client a preciser"}
                </span>
                <span>
                  <Euro size={15} />
                  {formatCurrencyAmount(priorityIntervention?.budget_amount, {
                    currency: priorityIntervention?.currency || "EUR",
                    emptyLabel: "Montant a confirmer",
                  })}
                </span>
              </div>
              <div className={styles.priorityActions}>
                <Link
                  href={
                    priorityIntervention
                      ? getProviderInterventionHref(priorityIntervention.id)
                      : "/dashboard/provider/interventions"
                  }
                  className={styles.primaryLink}
                >
                  {priorityIntervention ? "Voir l’intervention" : "Voir mes interventions"}
                </Link>
                <Link
                  href={
                    priorityIntervention
                      ? `/dashboard/provider/messages?client=${priorityIntervention.client_id ?? ""}`
                      : "/dashboard/provider/messages"
                  }
                  className={styles.secondaryLink}
                >
                  Contacter client
                </Link>
              </div>
            </article>

            <article className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Planning compact</span>
                  <h3>Prochaines interventions</h3>
                </div>
                <Link href="/dashboard/provider/planning" className={styles.inlineLink}>
                  Vue agenda
                </Link>
              </div>
              {missionItems.length > 0 ? (
                <UnifiedSpotlightList items={missionItems} />
              ) : (
                <DashboardEmptyState
                  title="Aucune intervention à venir"
                  copy="Les prochaines interventions apparaîtront ici dès qu’elles seront programmées."
                />
              )}
            </article>
          </div>
        }
        leftSecondary={
          <div className={styles.sectionBlock}>
            <article className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Devis</span>
                  <h3>Ce qui avance commercialement</h3>
                </div>
                <Link href="/dashboard/provider/devis" className={styles.inlineLink}>
                  Ouvrir
                </Link>
              </div>
              <div className={styles.quoteStats}>
                <div>
                  <span>Envoyes / brouillons</span>
                  <strong>{pendingQuotes.length}</strong>
                </div>
                <div>
                  <span>Acceptes</span>
                  <strong>{acceptedQuotes.length}</strong>
                </div>
                <div>
                  <span>Refuses</span>
                  <strong>{quotes.filter((quote) => (quote.status ?? "").trim().toLowerCase() === "rejected").length}</strong>
                </div>
              </div>
              {quoteItems.length > 0 ? (
                <UnifiedSpotlightList items={quoteItems} />
              ) : (
                <DashboardEmptyState
                  title="Aucun devis en attente"
                  copy="Les derniers devis apparaitront ici pour garder le commercial visible."
                />
              )}
            </article>

            <article className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Activité récente</span>
                  <h3>Ce qui a bouge dernierement</h3>
                </div>
              </div>
              {activityItems.length > 0 ? (
                <UnifiedSpotlightList items={activityItems} />
              ) : (
                <DashboardEmptyState
                  title="Aucune activite recente exploitable"
                  copy="Le flux missions et devis sera resume ici des qu'il s'anime."
                />
              )}
            </article>
          </div>
        }
        mainSections={[
          {
            id: "proposals",
            title: "Interventions en attente",
            subtitle: "Consultez le détail pour décider de la suite.",
            content:
              proposedMissions.length > 0 ? (
                <div className={styles.requestList}>
                  {proposedMissions.slice(0, 4).map((item) => (
                    <article key={item.id} className={styles.requestCard}>
                      <div className={styles.requestTop}>
                        <div>
                          <strong>{item.title || item.service_label || "Mission recue"}</strong>
                          <p>{item.location_label || "Logement a preciser"}</p>
                        </div>
                        <span className={styles.inlineStatus}>{getInterventionStatusLabel(item.status)}</span>
                      </div>
                      <div className={styles.requestMeta}>
                        <span>
                          {formatDateValue(item.scheduled_start, {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                            emptyLabel: "Date à confirmer",
                          })}
                        </span>
                        <span>{getClientName(item.client_id, clientsById)}</span>
                        <span>
                          {formatCurrencyAmount(item.budget_amount, {
                            currency: item.currency || "EUR",
                            emptyLabel: "Montant a preciser",
                          })}
                        </span>
                      </div>
                      <div className={styles.requestActions}>
                        <Link href={getProviderInterventionHref(item.id)} className={styles.primaryLink}>
                          Consulter l’intervention
                        </Link>
                        <Link href={`/dashboard/provider/messages?client=${item.client_id ?? ""}`} className={styles.secondaryLink}>
                          Contacter le client
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState
                  title="Aucune mission en attente de réponse"
                  copy="Le cockpit ne remonte pas de nouvelle proposition à traiter pour l'instant."
                />
              ),
          },
          {
            id: "revenues",
            title: "Revenus",
            subtitle: "Le mois en cours, sans ouvrir les pages de facturation.",
            content: (
              <div className={styles.financeGrid}>
                <article className={styles.financeCard}>
                  <span className={styles.financeLabel}>CA realise</span>
                  <strong className={styles.financeValue}>
                    {formatCurrencyAmount(realizedRevenue, { currency: "EUR", emptyLabel: "0 EUR" })}
                  </strong>
                  <p>Montant cumule des missions marquees comme terminees.</p>
                </article>
                <article className={styles.financeCard}>
                  <span className={styles.financeLabel}>CA previsionnel</span>
                  <strong className={styles.financeValue}>
                    {formatCurrencyAmount(expectedRevenue, { currency: "EUR", emptyLabel: "0 EUR" })}
                  </strong>
                  <p>Lecture rapide de ce que les missions et devis acceptes peuvent rapporter.</p>
                </article>
                <article className={styles.financeCard}>
                  <span className={styles.financeLabel}>Missions terminees</span>
                  <strong className={styles.financeValue}>{completedCount}</strong>
                  <p>Indicateur de production pour suivre votre execution terrain.</p>
                </article>
                <article className={styles.financeCard}>
                  <span className={styles.financeLabel}>Delai moyen paiement</span>
                  <strong className={styles.financeValue}>--</strong>
                  <p>Signal prevu quand l'historique paiements sera plus structure.</p>
                </article>
              </div>
            ),
          },
          {
            id: "actions",
            title: "Actions rapides",
            subtitle: "Les gestes frequents sans chercher dans le menu.",
            content: (
              <div className={styles.quickActions}>
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.label} href={action.href} className={styles.quickActionCard}>
                      <Icon size={22} />
                      <span>{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            ),
          },
        ]}
        sidebarSections={[
          {
            id: "priorities",
            title: "Radar rapide",
            subtitle: "Missions, devis et factures a ne pas laisser dormir",
            content: <UnifiedSpotlightList items={priorityItems} emptyLabel="Aucun point prioritaire." />,
          },
          {
            id: "finance",
            title: "Finance provider",
            subtitle: "Projection et encaissements attendus",
            content: <UnifiedStatStack items={financeStats} />,
          },
          {
            id: "ops",
            title: "Controle terrain",
            subtitle: "Cadence operationnelle du jour",
            content: <UnifiedStatStack items={operationsStats} />,
          },
        ]}
        disclosures={[
          {
            id: "journey",
            label: "Parcours et evolution",
            summary: "Onboarding prestataire et extension premium",
            content: (
              <div className={styles.sectionBlock}>
                <div className={styles.financeCard}>
                  <span className={styles.financeLabel}>Compte</span>
                  <strong className={styles.financeValue}>{workspace?.summary.is_pro ? "PRO" : "Standard"}</strong>
                  <p>
                    {workspace?.summary.is_pro
                      ? "Votre compte est deja pret pour des signaux de marge et paiement plus pousses."
                      : "Le cockpit est pret pour evoluer vers une couche premium orientee marge, SLA et paiements."}
                  </p>
                </div>
                <DashboardOnboardingSummary
                  role="provider"
                  availabilityHours={workspace?.profile.availability_hours}
                  serviceArea={workspace?.profile.service_area}
                  serviceRadiusKm={workspace?.profile.service_radius_km}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
