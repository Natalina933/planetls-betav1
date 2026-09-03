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
  type LucideIcon,
} from "lucide-react";
import { DashboardLoadingScreen } from "@/components/dashboard";
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
} from "./useProviderDashboardData";
import styles from "./ProviderDashboard.module.scss";

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
      return "Acceptee";
    case "in_progress":
      return "En cours";
    case "completed":
      return "Terminee";
    case "cancelled":
    case "canceled":
      return "Annulee";
    default:
      return "A repondre";
  }
}

function getQuoteStatusLabel(status: string | null | undefined) {
  switch ((status ?? "").trim().toLowerCase()) {
    case "accepted":
      return "Accepte";
    case "rejected":
      return "Refuse";
    case "sent":
      return "Envoye";
    case "expired":
      return "Expire";
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
  if (!clientId) return "Client a preciser";
  const client = clientsById.get(clientId);
  return client?.client_name || client?.company_name || "Client a preciser";
}

function getPriorityIcon(intervention: ProviderInterventionItem | null): LucideIcon {
  if (!intervention) return CircleAlert;
  const text = `${intervention.title ?? ""} ${intervention.service_label ?? ""}`.toLowerCase();
  if (text.includes("serrure") || text.includes("depannage")) return ShieldAlert;
  if (text.includes("menage")) return Sparkles;
  if (text.includes("reparation") || text.includes("maintenance")) return Wrench;
  return TriangleAlert;
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
        .filter((item) => item.scheduled_start)
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
        href: `/dashboard/provider/interventions?intervention=${item.id}`,
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
        label: "CA realise",
        value: formatCurrencyAmount(realizedRevenue, { currency: "EUR", emptyLabel: "0 EUR" }),
        detail: "Missions deja terminees et valorisees.",
      },
      {
        label: "CA previsionnel",
        value: formatCurrencyAmount(expectedRevenue, { currency: "EUR", emptyLabel: "0 EUR" }),
        detail: "Projection issue des missions et devis acceptes.",
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
        detail: "Interventions deja positionnees sur la journee.",
      },
      {
        label: "Demain",
        value: String(acceptedMissions.filter((item) => isTomorrow(item.scheduled_start)).length),
        detail: "Charge de demain avant d'accepter autre chose.",
      },
      {
        label: "Semaine",
        value: String(weekCount),
        detail: "Volume confirme dans les 7 prochains jours.",
      },
    ],
    [acceptedMissions, interventionsToday.length, weekCount],
  );

  const quickActions = [
    { label: "Créer devis", href: "/dashboard/provider/devis", icon: FileText },
    { label: "Declarer mission terminee", href: "/dashboard/provider/interventions", icon: Wrench },
    { label: "Envoyer facture", href: "/dashboard/provider/devis", icon: Receipt },
    { label: "Contacter client", href: "/dashboard/provider/messages", icon: MessageSquareText },
  ];

  const priorityItems = useMemo<UnifiedSpotlightItem[]>(
    () => [
      {
        id: "missions-pending",
        label: "Missions a repondre",
        title: `${proposedMissions.length} mission(s) attendent une decision`,
        detail: "Accepter, negocier ou refuser avant qu'elles ne se refroidissent.",
        href: "/dashboard/provider/interventions",
        tone: proposedMissions.length > 0 ? "warning" : "neutral",
        icon: <TriangleAlert size={16} />,
      },
      {
        id: "quotes-pending",
        label: "Devis a suivre",
        title: `${pendingQuotes.length} devis en attente`,
        detail: "Brouillons et envois a relancer ou finaliser rapidement.",
        href: "/dashboard/provider/devis",
        tone: pendingQuotes.length > 0 ? "accent" : "neutral",
        icon: <FileText size={16} />,
      },
      {
        id: "invoices",
        label: "Factures",
        title: `${invoiceToIssueCount} facture(s) a emettre`,
        detail: "Les devis acceptes doivent se transformer en factures et paiements.",
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
        detail: `${item.location_label || "Lieu a preciser"} · ${getClientName(item.client_id, clientsById)}`,
        meta: `${formatTime(item.scheduled_start)} · ${formatDateValue(item.scheduled_start, {
          day: "2-digit",
          month: "short",
          emptyLabel: "Date a confirmer",
        })}`,
        href: `/dashboard/provider/interventions?intervention=${item.id}`,
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
    return <DashboardLoadingScreen label="Chargement de votre cockpit provider..." />;
  }

  const PriorityIcon = getPriorityIcon(priorityIntervention);

  return (
    <div className="theme-artisan">
      <UnifiedRoleDashboard
        role="artisan"
        title={`${getGreetingLabel()} ${displayName || "artisan"}`}
        subtitle={error || `${ARTISAN_DASHBOARD_CONFIG.subtitle} pour ${displayName}.`}
        experienceBadge={workspace?.summary.is_pro ? "Artisan PRO" : "Artisan Standard"}
        experienceBadgeTone={workspace?.summary.is_pro ? "success" : "info"}
        statusLabel={proposedMissions.length > 0 ? `${proposedMissions.length} mission(s) a repondre` : "Flux terrain sous controle"}
        statusTone={proposedMissions.length > 0 ? "warning" : "success"}
        actions={[
          { id: "planning", label: "Ouvrir mon planning", href: "/dashboard/provider/planning", tone: "primary" },
          { id: "missions", label: "Voir mes missions", href: "/dashboard/provider/interventions", tone: "secondary" },
          { id: "quotes", label: "Voir devis et factures", href: "/dashboard/provider/devis", tone: "ghost" },
        ]}
        kpis={[
          {
            id: "missions",
            label: "Missions a venir",
            value: `${acceptedMissions.length}`,
            detail: interventionsToday.length > 0 ? `${interventionsToday.length} aujourd'hui` : "Aucune aujourd'hui",
            icon: <Wrench size={18} />,
            statusLabel: missionPaceMeta.label,
            statusTone: missionPaceMeta.tone,
            statusText: missionPaceMeta.label,
            href: "/dashboard/provider/interventions",
          },
          {
            id: "quotes",
            label: "Devis en attente",
            value: `${pendingQuotes.length}`,
            detail: "A suivre ou relancer",
            icon: <FileText size={18} />,
            statusLabel: pendingQuotes.length > 0 ? "Action" : "A jour",
            statusTone: pendingQuotes.length > 0 ? "warning" : "success",
            href: "/dashboard/provider/devis",
          },
          {
            id: "responses",
            label: "Missions a repondre",
            value: `${proposedMissions.length}`,
            detail: "Demandent une decision",
            icon: <TriangleAlert size={18} />,
            statusLabel: proposedMissions.length > 0 ? "Priorite" : "Stable",
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
                    ? `Aujourd'hui a ${formatTime(priorityIntervention.scheduled_start)}`
                    : "Date a confirmer"}
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
                      ? `/dashboard/provider/interventions?intervention=${priorityIntervention.id}`
                      : "/dashboard/provider/interventions"
                  }
                  className={styles.primaryLink}
                >
                  Voir mission
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
                  title="Aucune mission planifiee"
                  copy="Les prochaines interventions apparaitront ici des qu'elles seront programmees."
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
            title: "Missions recues",
            subtitle: "Les demandes a accepter, negocier ou refuser rapidement.",
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
                            emptyLabel: "Date a confirmer",
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
                        <Link href={`/dashboard/provider/interventions?intervention=${item.id}`} className={styles.primaryLink}>
                          Accepter
                        </Link>
                        <Link href={`/dashboard/provider/messages?client=${item.client_id ?? ""}`} className={styles.secondaryLink}>
                          Negocier
                        </Link>
                        <Link href={`/dashboard/provider/interventions?intervention=${item.id}`} className={styles.ghostLink}>
                          Refuser
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState
                  title="Aucune mission en attente de reponse"
                  copy="Le cockpit ne remonte pas de nouvelle proposition a traiter pour l'instant."
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
