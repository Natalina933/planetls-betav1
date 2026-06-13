"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
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
import { DashboardLayout, DashboardLoadingScreen } from "@/components/dashboard";
import { AsyncState } from "@/components/ui";
import { formatCurrencyAmount, formatDateValue } from "@/app/utils/formatters";
import { DashboardOnboardingSummary } from "@/features/onboarding-assistant";
import { getDashboardMissionPaceMeta } from "@/app/components/dashboard/saas";
import {
  ARTISAN_DASHBOARD_CONFIG,
  ARTISAN_NAV_ITEMS,
  ARTISAN_SHORTCUTS,
} from "@/features/artisan-dashboard";
import { useProviderDashboardData, type ProviderInterventionItem, type ProviderQuoteItem } from "./useProviderDashboardData";
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
  if (hour < 18) return "Bon après-midi";
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
      return "À répondre";
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
  const {
    workspace,
    dashboard,
    error,
    isLoading,
    displayName,
    locationLabel,
  } = useProviderDashboardData();

  const interventions = dashboard?.interventions ?? [];
  const clients = dashboard?.clients ?? [];
  const quotes = dashboard?.quotes ?? [];

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

  const proposedMissions = useMemo(
    () => interventions.filter((item) => isPendingIntervention(item.status)),
    [interventions],
  );
  const acceptedMissions = useMemo(
    () => interventions.filter((item) => isAcceptedIntervention(item.status)),
    [interventions],
  );
  const openMissions = useMemo(
    () => interventions.filter((item) => isOpenIntervention(item.status)),
    [interventions],
  );
  const interventionsToday = useMemo(
    () =>
      acceptedMissions
        .filter((item) => isToday(item.scheduled_start))
        .sort((a, b) => (getDateTime(a.scheduled_start)?.getTime() ?? 0) - (getDateTime(b.scheduled_start)?.getTime() ?? 0)),
    [acceptedMissions],
  );
  const missionPaceMeta = useMemo(() => getDashboardMissionPaceMeta(interventionsToday.length), [interventionsToday.length]);
  const upcomingMissions = useMemo(
    () =>
      openMissions
        .filter((item) => item.scheduled_start)
        .sort((a, b) => (getDateTime(a.scheduled_start)?.getTime() ?? 0) - (getDateTime(b.scheduled_start)?.getTime() ?? 0)),
    [openMissions],
  );
  const weekCount = useMemo(
    () => acceptedMissions.filter((item) => isWithinNextDays(item.scheduled_start, 7)).length,
    [acceptedMissions],
  );
  const pendingQuotes = useMemo(
    () => quotes.filter((quote) => isPendingQuote(quote.status)),
    [quotes],
  );
  const acceptedQuotes = useMemo(
    () => quotes.filter((quote) => isAcceptedQuote(quote.status)),
    [quotes],
  );
  const invoiceToIssueCount = acceptedQuotes.length;
  const paymentsToReceiveCount = acceptedQuotes.length;

  const expectedRevenue = useMemo(
    () =>
      acceptedMissions.reduce((sum, item) => sum + (typeof item.budget_amount === "number" ? item.budget_amount : 0), 0) +
      acceptedQuotes.reduce((sum, quote) => sum + (typeof quote.total_amount === "number" ? quote.total_amount : 0), 0),
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
    const urgentToday = openMissions.find(
      (item) => item.priority === "urgent" && isToday(item.scheduled_start),
    );
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
        label: isPendingIntervention(item.status) ? "Mission recue" : isCompletedIntervention(item.status) ? "Mission realisee" : "Mission acceptee",
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

  const quickActions = [
    { label: "Creer devis", href: "/dashboard/provider/devis", icon: FileText },
    { label: "Declarer mission terminee", href: "/dashboard/provider/interventions", icon: Wrench },
    { label: "Envoyer facture", href: "/dashboard/provider/devis", icon: Receipt },
    { label: "Contacter client", href: "/dashboard/provider/messages", icon: MessageSquareText },
  ];

  if (isLoading) {
    return <DashboardLoadingScreen label="Chargement de votre cockpit provider..." />;
  }

  const PriorityIcon = getPriorityIcon(priorityIntervention);

  return (
    <DashboardLayout
      persona="artisan"
      title={ARTISAN_DASHBOARD_CONFIG.title}
      subtitle={error || `${ARTISAN_DASHBOARD_CONFIG.subtitle} pour ${displayName}.`}
      navTitle={ARTISAN_DASHBOARD_CONFIG.navTitle}
      navItems={ARTISAN_NAV_ITEMS}
      stats={[
        {
          label: "Missions a venir",
          value: `${acceptedMissions.length}`,
          hint: `${interventionsToday.length} aujourd'hui`,
          trend: missionPaceMeta.label,
          progress: Math.min(100, acceptedMissions.length * 18),
          visual: missionPaceMeta.icon,
          visualLabel: missionPaceMeta.label,
        },
        {
          label: "Devis en attente",
          value: `${pendingQuotes.length}`,
          hint: "À suivre ou relancer",
          trend: pendingQuotes.length > 0 ? "Action" : "À jour",
        },
        {
          label: "Missions a repondre",
          value: `${proposedMissions.length}`,
          hint: "Demandent une decision",
          trend: proposedMissions.length > 0 ? "Priorite" : "Stable",
        },
        {
          label: "CA previsionnel",
          value: formatCurrencyAmount(expectedRevenue, { currency: "EUR", emptyLabel: "0 EUR" }),
          hint: `${paymentsToReceiveCount} paiement(s) a recevoir`,
          trend: expectedRevenue > 0 ? "Revenus" : "A lancer",
        },
      ]}
      actions={[
        { label: "Voir les missions", href: "/dashboard/provider/interventions" },
        { label: "Voir le planning", href: "/dashboard/provider/planning" },
        { label: "Voir devis & factures", href: "/dashboard/provider/devis" },
      ]}
      activity={recentActivity.map((item) => ({
        id: item.id,
        title: item.title,
        description: `${item.detail} · ${item.date}`,
        href: item.href,
        statusLabel: item.label,
        actionLabel: "Ouvrir",
      }))}
      notifications={[
        {
          id: "provider-n1",
          title:
            proposedMissions.length > 0
              ? `${proposedMissions.length} mission(s) necessitent une reponse.`
              : "Aucune mission en attente de reponse.",
          level: proposedMissions.length > 0 ? "warning" : "info",
          href: "/dashboard/provider/interventions",
        },
        {
          id: "provider-n2",
          title:
            invoiceToIssueCount > 0
              ? `${invoiceToIssueCount} facture(s) peuvent etre emises.`
              : "Aucune facture urgente a emettre.",
          level: invoiceToIssueCount > 0 ? "danger" : "info",
          href: "/dashboard/provider/devis",
        },
      ]}
      shortcuts={ARTISAN_SHORTCUTS}
      profile={{
        name: displayName,
        subtitle: locationLabel,
        badge: workspace?.summary.is_pro ? "Artisan PRO" : "Artisan Standard",
      }}
    >
      <section className={styles.sectionBlock} aria-labelledby="provider-hero-title">
        <div className={styles.heroPanel}>
          <div className={styles.heroCopy}>
            <span className={styles.heroBadge}>Cockpit provider</span>
            <h1 id="provider-hero-title">
              {getGreetingLabel()} {displayName || "Julien"}, voici vos prochaines interventions.
            </h1>
            <p>
              Vous avez {acceptedMissions.length} mission(s) a venir, {pendingQuotes.length} devis en attente,{" "}
              {interventionsToday.length} intervention(s) aujourd&apos;hui et {invoiceToIssueCount} facture(s) a envoyer.
            </p>
          </div>

          <div className={styles.heroMetrics} aria-label="Synthese provider">
            <article className={styles.heroMetric}>
              <span>Missions a venir</span>
              <strong>{acceptedMissions.length}</strong>
              <small>confirmees</small>
            </article>
            <article className={styles.heroMetric}>
              <span>Devis en attente</span>
              <strong>{pendingQuotes.length}</strong>
              <small>a suivre</small>
            </article>
            <article className={styles.heroMetric}>
              <span>Aujourd&apos;hui</span>
              <strong>{interventionsToday.length}</strong>
              <small>intervention(s)</small>
            </article>
            <article className={styles.heroMetric}>
              <span>Factures</span>
              <strong>{invoiceToIssueCount}</strong>
              <small>a emettre</small>
            </article>
          </div>

          <div className={styles.heroActions}>
            <Link href="/dashboard/provider/planning" className={styles.primaryLink}>
              Ouvrir mon planning
            </Link>
            <Link href="/dashboard/provider/interventions" className={styles.secondaryLink}>
              Voir mes missions
            </Link>
            <Link href="/dashboard/provider/devis" className={styles.secondaryLink}>
              Voir devis et factures
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="provider-health-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Sante de l&apos;activite</span>
          <h2 id="provider-health-title">Les signaux qui comptent pour intervenir et facturer</h2>
          <p>Le cockpit met d&apos;abord la mission, le revenu et la reponse client au premier plan.</p>
        </div>
        <div className={styles.healthGrid}>
          <Link href="/dashboard/provider/interventions" className={styles.healthCard}>
            <div className={styles.healthTop}>
              <span className={`${styles.healthDot} ${styles.info}`} />
              <span className={styles.healthLabel}>Missions confirmees</span>
            </div>
            <strong className={styles.healthValue}>{acceptedMissions.length}</strong>
            <p className={styles.healthDetail}>Interventions deja acceptees ou en cours d&apos;execution.</p>
          </Link>
          <Link href="/dashboard/provider/devis" className={styles.healthCard}>
            <div className={styles.healthTop}>
              <span className={`${styles.healthDot} ${styles.warn}`} />
              <span className={styles.healthLabel}>Devis a repondre</span>
            </div>
            <strong className={styles.healthValue}>{pendingQuotes.length}</strong>
            <p className={styles.healthDetail}>Opportunites commerciales a envoyer, relancer ou finaliser.</p>
          </Link>
          <Link href="/dashboard/provider/planning" className={styles.healthCard}>
            <div className={styles.healthTop}>
              <span className={`${styles.healthDot} ${styles.info}`} />
              <span className={styles.healthLabel}>Interventions du jour</span>
            </div>
            <strong className={styles.healthValue}>{interventionsToday.length}</strong>
            <p className={styles.healthDetail}>Ce qui doit etre execute aujourd&apos;hui sans perte de temps.</p>
          </Link>
          <Link href="/dashboard/provider/devis" className={styles.healthCard}>
            <div className={styles.healthTop}>
              <span className={`${styles.healthDot} ${styles.good}`} />
              <span className={styles.healthLabel}>Paiements a recevoir</span>
            </div>
            <strong className={styles.healthValue}>{paymentsToReceiveCount}</strong>
            <p className={styles.healthDetail}>Dossiers susceptibles de se transformer en encaissement.</p>
          </Link>
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="provider-priority-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Priorite du jour</span>
          <h2 id="provider-priority-title">La prochaine action terrain ou commerciale</h2>
        </div>
        <div className={styles.priorityLayout}>
          <article className={styles.priorityHero}>
            <span className={styles.priorityBadge}>
              {priorityIntervention?.priority === "urgent" ? "Intervention urgente" : "Mission prioritaire"}
            </span>
            <div className={styles.priorityHeader}>
              <span className={styles.priorityIcon}>
                <PriorityIcon size={24} />
              </span>
              <div>
                <strong>{priorityIntervention?.location_label || priorityIntervention?.title || "Aucune urgence detectee"}</strong>
                <p>{priorityIntervention?.title || priorityIntervention?.service_label || "Votre planning est actuellement stable."}</p>
              </div>
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
                {priorityIntervention
                  ? getClientName(priorityIntervention.client_id, clientsById)
                  : "Client a preciser"}
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
                href={priorityIntervention ? `/dashboard/provider/interventions?intervention=${priorityIntervention.id}` : "/dashboard/provider/interventions"}
                className={styles.primaryLink}
              >
                Voir mission
              </Link>
              <Link
                href={priorityIntervention ? `/dashboard/provider/interventions?intervention=${priorityIntervention.id}` : "/dashboard/provider/interventions"}
                className={styles.secondaryLink}
              >
                Accepter
              </Link>
              <Link
                href={priorityIntervention ? `/dashboard/provider/messages?client=${priorityIntervention.client_id ?? ""}` : "/dashboard/provider/messages"}
                className={styles.secondaryLink}
              >
                Refuser / contacter
              </Link>
            </div>
          </article>

          <div className={styles.signalList}>
            <Link href="/dashboard/provider/planning" className={styles.signalCard}>
              <div className={styles.signalTop}>
                <span>Ou dois-je intervenir ?</span>
                <strong>{interventionsToday.length}</strong>
              </div>
              <p>{interventionsToday.length > 0 ? "Des interventions du jour sont deja positionnees." : "Aucune intervention aujourd'hui."}</p>
            </Link>
            <Link href="/dashboard/provider/planning" className={styles.signalCard}>
              <div className={styles.signalTop}>
                <span>Demain</span>
                <strong>{acceptedMissions.filter((item) => isTomorrow(item.scheduled_start)).length}</strong>
              </div>
              <p>Lecture rapide de la charge de demain avant de prendre d&apos;autres missions.</p>
            </Link>
            <Link href="/dashboard/provider/planning" className={styles.signalCard}>
              <div className={styles.signalTop}>
                <span>Semaine</span>
                <strong>{weekCount}</strong>
              </div>
              <p>Volume d&apos;interventions confirmees dans les 7 prochains jours.</p>
            </Link>
            <Link href="/dashboard/provider/devis" className={styles.signalCard}>
              <div className={styles.signalTop}>
                <span>Revenu prevu</span>
                <strong>{formatCurrencyAmount(expectedRevenue, { currency: "EUR", emptyLabel: "0 EUR" })}</strong>
              </div>
              <p>Estimation issue des missions deja acceptees et des devis deja valides.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="provider-ops-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Mon planning</span>
          <h2 id="provider-ops-title">Quand, ou, pour qui</h2>
        </div>
        <div className={styles.dualGrid}>
          <article className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Agenda compact</span>
                <h3>Prochaines interventions</h3>
              </div>
              <Link href="/dashboard/provider/planning" className={styles.inlineLink}>
                Vue agenda
              </Link>
            </div>
            <div className={styles.timelineList}>
              {compactPlanning.length > 0 ? (
                compactPlanning.map((item) => (
                  <Link key={item.id} href={`/dashboard/provider/interventions?intervention=${item.id}`} className={styles.timelineRow}>
                    <span className={styles.timelineTime}>{formatTime(item.scheduled_start)}</span>
                    <div>
                      <strong>{item.title || item.service_label || "Intervention"}</strong>
                      <p>
                        {item.location_label || "Lieu a preciser"} · {getClientName(item.client_id, clientsById)}
                      </p>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                ))
              ) : (
                <div className={styles.emptyCard}>Aucune mission planifiee pour le moment.</div>
              )}
            </div>
          </article>

          <article className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Missions recues</span>
                <h3>À répondre</h3>
              </div>
              <Link href="/dashboard/provider/interventions" className={styles.inlineLink}>
                Voir toutes
              </Link>
            </div>
            <AsyncState loading={isLoading} error={error}>
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
                      <span>{formatDateValue(item.scheduled_start, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", emptyLabel: "Date a confirmer" })}</span>
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
                {proposedMissions.length === 0 ? (
                  <div className={styles.emptyCard}>Aucune mission en attente de reponse.</div>
                ) : null}
              </div>
            </AsyncState>
          </article>
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="provider-quotes-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Devis</span>
          <h2 id="provider-quotes-title">Ce qui avance commercialement</h2>
        </div>
        <div className={styles.quotesGrid}>
          <article className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Statuts</span>
                <h3>Devis a suivre</h3>
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
          </article>
          <article className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Liste rapide</span>
                <h3>Derniers devis</h3>
              </div>
            </div>
            <div className={styles.quoteList}>
              {upcomingQuotes.length > 0 ? (
                upcomingQuotes.map((quote) => (
                  <Link key={quote.id} href="/dashboard/provider/devis" className={styles.timelineRow}>
                    <span className={styles.timelineLabel}>{getQuoteStatusLabel(quote.status)}</span>
                    <div>
                      <strong>{quote.quote_number || "Devis brouillon"}</strong>
                      <p>{getQuoteClientLabel(quote)}</p>
                    </div>
                    <span className={styles.timelineDate}>
                      {formatCurrencyAmount(quote.total_amount, {
                        currency: quote.currency || "EUR",
                        emptyLabel: "Montant a definir",
                      })}
                    </span>
                  </Link>
                ))
              ) : (
                <div className={styles.emptyCard}>Aucun devis en attente pour le moment.</div>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="provider-revenues-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Revenus</span>
          <h2 id="provider-revenues-title">Ce mois</h2>
        </div>
        <div className={styles.financeGrid}>
          <article className={styles.financeCard}>
            <span className={styles.financeLabel}>CA realise</span>
            <strong className={styles.financeValue}>{formatCurrencyAmount(realizedRevenue, { currency: "EUR", emptyLabel: "0 EUR" })}</strong>
            <p>Montant cumule des missions marquees comme terminees.</p>
          </article>
          <article className={styles.financeCard}>
            <span className={styles.financeLabel}>CA previsionnel</span>
            <strong className={styles.financeValue}>{formatCurrencyAmount(expectedRevenue, { currency: "EUR", emptyLabel: "0 EUR" })}</strong>
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
            <p>Signal prevu pour la version premium une fois l&apos;historique paiements structure.</p>
          </article>
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="provider-activity-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Activite recente</span>
          <h2 id="provider-activity-title">Ce qui a bouge dernierement</h2>
        </div>
        <div className={styles.timelineList}>
          {recentActivity.length > 0 ? (
            recentActivity.map((item) => (
              <Link key={item.id} href={item.href} className={styles.timelineRow}>
                <span className={styles.timelineLabel}>{item.label}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <span className={styles.timelineDate}>{item.date}</span>
              </Link>
            ))
          ) : (
            <div className={styles.emptyCard}>Aucune activite recente exploitable pour l&apos;instant.</div>
          )}
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="provider-actions-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Actions rapides</span>
          <h2 id="provider-actions-title">Les gestes frequents sans chercher dans le menu</h2>
        </div>
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
      </section>

      <details className={styles.disclosureBlock}>
        <summary className={styles.disclosureSummary}>
          <div>
            <span className={styles.sectionEyebrow}>Parcours & evolution</span>
            <strong>Onboarding provider et extension premium</strong>
            <p>Cette zone conserve les aides de progression sans polluer la lecture terrain du cockpit.</p>
          </div>
        </summary>
        <div className={styles.disclosureContent}>
          <div className={styles.signalList}>
            <div className={styles.signalCard}>
              <div className={styles.signalTop}>
                <span>Compte</span>
                <strong>{workspace?.summary.is_pro ? "PRO" : "Standard"}</strong>
              </div>
              <p>
                {workspace?.summary.is_pro
                  ? "Votre compte est deja pret pour des signaux de marge et paiement plus pousses."
                  : "Le cockpit est pret pour evoluer vers une couche premium oriente marge, SLA et paiements."}
              </p>
            </div>
          </div>

          <DashboardOnboardingSummary
            role="provider"
            availabilityHours={workspace?.profile.availability_hours}
            serviceArea={workspace?.profile.service_area}
            serviceRadiusKm={workspace?.profile.service_radius_km}
          />
        </div>
      </details>
    </DashboardLayout>
  );
}
