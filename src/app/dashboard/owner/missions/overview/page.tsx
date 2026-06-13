"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Euro,
  FileText,
  MessageSquareText,
  ShieldAlert,
} from "lucide-react";
import OwnerWorkspacePage from "../../_components/OwnerWorkspacePage";
import { DashboardPanel, MetricDonut } from "@/components/dashboard";
import { AsyncState } from "@/components/ui";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { formatDateValue, formatEuroAmountLabel } from "@/app/utils/formatters";
import {
  getTravelerMissionPropertyId,
  isTravelerMission,
} from "../travelerMissionSummary";
import { useOwnerDashboardData } from "../../useOwnerDashboardData";
import styles from "./page.module.scss";

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

function isSameMonth(value: string | null | undefined, now: Date) {
  const date = getDateTime(value);
  if (!date) return false;
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function getGreetingLabel() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

function getMissionStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "draft":
      return "Demande envoyée";
    case "assigned":
      return "Prise en charge";
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
    case "canceled":
      return "Annulée";
    default:
      return "À suivre";
  }
}

function getMissionTypeLabel(mission: {
  title: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const actions = Array.isArray(mission.metadata?.actions)
    ? mission.metadata.actions.filter((item): item is string => typeof item === "string")
    : [];
  const title = (mission.title || "").toLowerCase();

  if (actions.includes("checkin") || title.includes("check-in")) return "Check-in";
  if (actions.includes("checkout") || title.includes("check-out")) return "Check-out";
  if (actions.includes("cleaning") || title.includes("menage")) return "Ménage";
  if (actions.includes("linen") || title.includes("linge")) return "Linge";
  if (actions.includes("maintenance") || title.includes("serrure") || title.includes("maintenance")) return "Maintenance";
  if (actions.includes("quality_check") || title.includes("inspection") || title.includes("controle")) return "Inspection";
  if (actions.includes("emergency") || title.includes("urgence")) return "Urgence";
  if (isTravelerMission(mission)) return "Séjour voyageur";
  return "Intervention";
}

function getMissionUrgencyLevel(mission: {
  priority?: string | null;
  metadata?: Record<string, unknown> | null;
  title: string | null;
}) {
  const issueFlag = typeof mission.metadata?.issue_flag === "string" ? mission.metadata.issue_flag : "";
  const title = (mission.title || "").toLowerCase();
  if (mission.priority === "urgent" || issueFlag === "urgent" || title.includes("urgence")) return "critical";
  if (mission.priority === "high" || issueFlag === "incident" || issueFlag === "watch") return "watch";
  return "normal";
}

function getPropertyLabel(
  properties: Array<{ id: number; nom_logement: string | null; ville: string | null }>,
  propertyId: string | number | null | undefined,
) {
  const property = properties.find((item) => String(item.id) === String(propertyId ?? ""));
  return property?.nom_logement || property?.ville || "Logement à préciser";
}

function getMissionPropertyLabel(
  properties: Array<{ id: number; nom_logement: string | null; ville: string | null }>,
  mission: { property_id?: string | number | null; metadata?: Record<string, unknown> | null },
) {
  return getPropertyLabel(properties, mission.property_id ?? getTravelerMissionPropertyId(mission));
}

function sumMissionAmounts<T extends { amount: number | null }>(missions: T[]) {
  return missions.reduce((sum, mission) => sum + (mission.amount ?? 0), 0);
}

function getQuoteHref(quoteId: string, requestId?: string | null) {
  const params = new URLSearchParams({ quote: quoteId });
  if (requestId) params.set("request", requestId);
  return `/dashboard/owner/devis?${params.toString()}`;
}

function getInvoiceHref(invoiceId: string) {
  return `/dashboard/owner/factures?invoice=${encodeURIComponent(invoiceId)}`;
}

function getConversationHref(conversationId: string) {
  return `/dashboard/owner/messages?conversation=${encodeURIComponent(conversationId)}`;
}

function getTimelineBucketLabel(date: Date, now: Date) {
  if (isSameLocalDay(date, now)) return "Aujourd'hui";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameLocalDay(date, yesterday)) return "Hier";
  return "Cette semaine";
}

export default function OwnerMissionsOverviewPage() {
  const { isAuthenticated, user } = useCurrentUser();
  const {
    properties,
    missions,
    quotes,
    conversations,
    ongoingMissions,
    completedMissions,
    pendingInvoices,
    loading,
    error,
  } = useOwnerDashboardData(isAuthenticated);

  const ownerName = user?.firstName || user?.username || "Nathalie";
  const now = new Date();
  const missionConversations = conversations.filter((conversation) => conversation.source === "mission");
  const unansweredMissionThreads = missionConversations.filter((conversation) => (conversation.unread_count ?? 0) > 0);
  const pendingQuotes = quotes.filter((quote) => quote.status !== "accepted" && quote.status !== "rejected");
  const plannedMissions = ongoingMissions.filter((mission) => isWithinNextDays(mission.scheduled_start, 7));
  const urgentMissions = ongoingMissions.filter((mission) => getMissionUrgencyLevel(mission) !== "normal");
  const travelerSensitiveMissions = ongoingMissions.filter((mission) => isTravelerMission(mission));
  const missionsWithoutSchedule = ongoingMissions.filter(
    (mission) =>
      !mission.scheduled_start ||
      mission.status === "to_schedule" ||
      mission.status === "date_requested" ||
      mission.status === "date_proposed",
  );

  const decisionCards = [
    ...pendingQuotes.map((quote) => ({
      id: `quote-${quote.id}`,
      tone: "warning" as const,
      label: "Devis à valider",
      title: quote.quote_number || "Devis reçu",
      detail: `Montant ${formatEuroAmountLabel(quote.total_amount, "-")}. Une décision propriétaire est nécessaire.`,
      href: getQuoteHref(quote.id, quote.service_request_id ?? null),
      action: "Voir devis",
    })),
    ...pendingInvoices.map((invoice) => ({
      id: `invoice-${invoice.id}`,
      tone: "info" as const,
      label: "Facture à confirmer",
      title: invoice.invoice_number || "Facture opérationnelle",
      detail: `Solde à vérifier : ${formatEuroAmountLabel(invoice.balance_amount, "-")}.`,
      href: getInvoiceHref(invoice.id),
      action: "Voir facture",
    })),
    ...unansweredMissionThreads.map((conversation) => ({
      id: `conversation-${conversation.id}`,
      tone: "danger" as const,
      label: "Question sans réponse",
      title: conversation.subject || conversation.counterpart_name || "Conversation mission",
      detail: conversation.last_message_preview || "Une conciergerie attend votre retour.",
      href: getConversationHref(conversation.id),
      action: "Répondre",
    })),
    ...missionsWithoutSchedule.map((mission) => ({
      id: `mission-${mission.id}`,
      tone: "warning" as const,
      label: "Mission à cadrer",
      title: mission.title || getMissionTypeLabel(mission),
      detail: `${getMissionPropertyLabel(properties, mission)} · ${getMissionStatusLabel(mission.status)}.`,
      href: `/dashboard/owner/missions/${mission.id}`,
      action: "Voir mission",
    })),
  ].slice(0, 6);

  const latestOpenMission = urgentMissions[0] || missionsWithoutSchedule[0] || ongoingMissions[0] || null;
  const latestPendingQuote = pendingQuotes[0] ?? null;
  const totalOpenBudget = sumMissionAmounts(ongoingMissions);
  const thisMonthMissions = missions.filter((mission) =>
    isSameMonth(mission.scheduled_start || mission.created_at || mission.updated_at, now),
  );
  const maintenanceBudget = sumMissionAmounts(
    thisMonthMissions.filter((mission) => getMissionTypeLabel(mission) === "Maintenance"),
  );
  const cleaningBudget = sumMissionAmounts(
    thisMonthMissions.filter((mission) => {
      const type = getMissionTypeLabel(mission);
      return type === "Ménage" || type === "Linge";
    }),
  );

  const propertyRows = properties
    .map((property) => {
      const propertyMissions = missions.filter(
        (mission) => String(mission.property_id ?? getTravelerMissionPropertyId(mission)) === String(property.id),
      );
      const activeMissions = propertyMissions.filter((mission) => mission.status !== "completed" && mission.status !== "canceled");
      const lastCompleted = [...propertyMissions]
        .filter((mission) => mission.status === "completed")
        .sort(
          (left, right) =>
            (getDateTime(right.updated_at || right.scheduled_end || right.scheduled_start)?.getTime() ?? 0) -
            (getDateTime(left.updated_at || left.scheduled_end || left.scheduled_start)?.getTime() ?? 0),
        )[0];
      const nextMission = [...activeMissions]
        .filter((mission) => Boolean(mission.scheduled_start))
        .sort(
          (left, right) =>
            (getDateTime(left.scheduled_start)?.getTime() ?? Number.MAX_SAFE_INTEGER) -
            (getDateTime(right.scheduled_start)?.getTime() ?? Number.MAX_SAFE_INTEGER),
        )[0];
      return {
        id: property.id,
        name: property.nom_logement || `Logement #${property.id}`,
        city: property.ville || "Ville a preciser",
        activeCount: activeMissions.length,
        state: activeMissions.some((mission) => getMissionUrgencyLevel(mission) !== "normal") ? "À surveiller" : "Sous contrôle",
        lastIntervention: lastCompleted
          ? `${getMissionTypeLabel(lastCompleted)} du ${formatDateValue(lastCompleted.scheduled_start, {
              day: "2-digit",
              month: "short",
            })}`
          : "Aucune intervention terminée",
        nextIntervention: nextMission
          ? `${getMissionTypeLabel(nextMission)} du ${formatDateValue(nextMission.scheduled_start, {
              day: "2-digit",
              month: "short",
            })}`
          : "Aucune intervention planifiée",
      };
    })
    .filter((property) => property.activeCount > 0)
    .slice(0, 4);

  const recentActivity = [
    ...pendingQuotes.slice(0, 3).map((quote) => ({
      id: `activity-quote-${quote.id}`,
      date: getDateTime(quote.updated_at || quote.created_at || quote.valid_until),
      label: "Devis reçu",
      title: quote.quote_number || "Devis à arbitrer",
      href: getQuoteHref(quote.id, quote.service_request_id ?? null),
    })),
    ...ongoingMissions.slice(0, 4).map((mission) => ({
      id: `activity-mission-${mission.id}`,
      date: getDateTime(mission.updated_at || mission.created_at || mission.scheduled_start),
      label:
        mission.status === "accepted"
          ? "Prestataire affecté"
          : mission.status === "in_progress"
            ? "Mission en cours"
            : "Mission créée",
      title: mission.title || getMissionTypeLabel(mission),
      href: `/dashboard/owner/missions/${mission.id}`,
    })),
    ...completedMissions.slice(0, 2).map((mission) => ({
      id: `activity-completed-${mission.id}`,
      date: getDateTime(mission.updated_at || mission.scheduled_end || mission.scheduled_start),
      label: "Intervention terminée",
      title: mission.title || getMissionTypeLabel(mission),
      href: `/dashboard/owner/missions/${mission.id}`,
    })),
    ...unansweredMissionThreads.slice(0, 2).map((conversation) => ({
      id: `activity-conversation-${conversation.id}`,
      date: getDateTime(conversation.last_message_at),
      label: "Réponse conciergerie reçue",
      title: conversation.subject || conversation.counterpart_name || "Conversation mission",
      href: getConversationHref(conversation.id),
    })),
  ]
    .filter((item) => item.date)
    .sort((left, right) => (right.date?.getTime() ?? 0) - (left.date?.getTime() ?? 0))
    .slice(0, 8);

  const activityGroups = ["Aujourd'hui", "Hier", "Cette semaine"].map((label) => ({
    label,
    items: recentActivity.filter((item) => item.date && getTimelineBucketLabel(item.date, now) === label),
  }));

  const missionRows = ongoingMissions.slice(0, 6).map((mission) => ({
    id: mission.id,
    title: mission.title || getMissionTypeLabel(mission),
    type: getMissionTypeLabel(mission),
    property: getMissionPropertyLabel(properties, mission),
    status: getMissionStatusLabel(mission.status),
    date:
      formatDateValue(mission.scheduled_start, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) || "Date a confirmer",
    owner: mission.concierge_name || "Responsable a preciser",
    cost: formatEuroAmountLabel(mission.amount, "-"),
    href: `/dashboard/owner/missions/${mission.id}`,
  }));

  return (
    <div className="dashboard-grid">
      <OwnerWorkspacePage
        eyebrow="Centre opérationnel"
        title={`${getGreetingLabel()} ${ownerName}, voici le pilotage de vos missions.`}
        description={
          loading
            ? "Chargement du centre opérationnel..."
            : error ||
              `Vous avez ${ongoingMissions.length} mission(s) ouverte(s), ${decisionCards.length} point(s) de validation et ${plannedMissions.length} intervention(s) programmée(s).`
        }
        metrics={[
          { label: "Missions ouvertes", value: loading ? "..." : String(ongoingMissions.length) },
          { label: "Validations", value: loading ? "..." : String(decisionCards.length) },
          { label: "Planifiées", value: loading ? "..." : String(plannedMissions.length) },
        ]}
        actions={[
          { label: "Créer une mission", href: "/dashboard/owner/missions/new" },
          { label: "Mission urgente", href: "/dashboard/owner/mission-urgente" },
          { label: "Voir le planning complet", href: "/dashboard/owner/planning" },
          { label: "Comparer plusieurs devis", href: "/dashboard/owner/devis" },
        ]}
        cards={[]}
      >
        <section className={styles.page}>
          <div className={styles.donutGrid}>
            <MetricDonut
              label="Missions ouvertes"
              value={loading ? "..." : String(ongoingMissions.length)}
              percent={Math.min(100, ongoingMissions.length * 18)}
              detail="Interventions actuellement suivies"
            />
            <MetricDonut
              label="Validations"
              value={loading ? "..." : String(decisionCards.length)}
              percent={Math.min(100, decisionCards.length * 25)}
              detail="Devis, factures, messages ou missions à arbitrer"
            />
            <MetricDonut
              label="Planifiées"
              value={loading ? "..." : String(plannedMissions.length)}
              percent={Math.min(100, plannedMissions.length * 20)}
              detail="Interventions programmées sur les prochains jours"
            />
            <MetricDonut
              label="Alertes critiques"
              value={loading ? "..." : String(urgentMissions.length)}
              percent={urgentMissions.length > 0 ? Math.min(100, urgentMissions.length * 30) : 6}
              detail={urgentMissions.length > 0 ? "Certaines missions peuvent impacter un voyageur" : "Aucun incident bloquant"}
            />
          </div>

          <div className={styles.heroGrid}>
            <DashboardPanel title="Priorité du moment" className={styles.heroPanel}>
              {latestPendingQuote ? (
                <div className={styles.priorityCard}>
                  <span className={styles.priorityBadge}>Validation requise</span>
                  <strong>{latestPendingQuote.quote_number || "Devis reçu"}</strong>
                  <p>
                    Montant {formatEuroAmountLabel(latestPendingQuote.total_amount, "-")} · une décision propriétaire est nécessaire.
                  </p>
                  <Link
                    href={getQuoteHref(latestPendingQuote.id, latestPendingQuote.service_request_id ?? null)}
                    className={styles.primaryLink}
                  >
                    Voir le devis
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              ) : latestOpenMission ? (
                <div className={styles.priorityCard}>
                  <span className={styles.priorityBadgeWarning}>
                    {getMissionUrgencyLevel(latestOpenMission) === "critical" ? "À surveiller" : "Action requise"}
                  </span>
                  <strong>{latestOpenMission.title || getMissionTypeLabel(latestOpenMission)}</strong>
                  <p>
                    {getMissionPropertyLabel(properties, latestOpenMission)} · {getMissionStatusLabel(latestOpenMission.status)}.
                  </p>
                  <Link href={`/dashboard/owner/missions/${latestOpenMission.id}`} className={styles.primaryLink}>
                    Voir la mission
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                <div className={styles.priorityCard}>
                  <span className={styles.priorityBadgeSuccess}>Sous controle</span>
                  <strong>Aucune urgence immédiate</strong>
                  <p>Les missions, validations et échanges n'indiquent pas de blocage critique.</p>
                </div>
              )}
            </DashboardPanel>

            <DashboardPanel title="Lecture rapide" className={styles.snapshotPanel}>
              <div className={styles.snapshotList}>
                <article>
                  <Euro size={16} aria-hidden="true" />
                  <div>
                    <strong>{formatEuroAmountLabel(totalOpenBudget, "-")}</strong>
                    <p>Coût des opérations en cours</p>
                  </div>
                </article>
                <article>
                  <MessageSquareText size={16} aria-hidden="true" />
                  <div>
                    <strong>{unansweredMissionThreads.length}</strong>
                    <p>Conciergerie(s) attend(ent) une réponse</p>
                  </div>
                </article>
                <article>
                  <ShieldAlert size={16} aria-hidden="true" />
                  <div>
                    <strong>{travelerSensitiveMissions.length}</strong>
                    <p>Mission(s) pouvant impacter un voyageur</p>
                  </div>
                </article>
                <article>
                  <CalendarClock size={16} aria-hidden="true" />
                  <div>
                    <strong>{completedMissions.length}</strong>
                    <p>Mission(s) terminée(s) visibles</p>
                  </div>
                </article>
              </div>
            </DashboardPanel>
          </div>

          <div className={styles.mainGrid}>
            <DashboardPanel title="Centre de validation" className={styles.validationPanel}>
              <AsyncState loading={loading} error={error}>
                <div className={styles.validationList}>
                  {decisionCards.length > 0 ? (
                    decisionCards.map((card) => (
                      <Link key={card.id} href={card.href} className={`${styles.validationCard} ${styles[card.tone]}`}>
                        <div className={styles.validationTop}>
                          <span>{card.label}</span>
                          {card.tone === "danger" ? <AlertTriangle size={16} aria-hidden="true" /> : <FileText size={16} aria-hidden="true" />}
                        </div>
                        <strong>{card.title}</strong>
                        <p>{card.detail}</p>
                        <span className={styles.validationAction}>
                          {card.action}
                          <ArrowRight size={14} aria-hidden="true" />
                        </span>
                      </Link>
                    ))
                  ) : (
                    <p className={styles.emptyText}>Aucune validation importante en attente.</p>
                  )}
                </div>
              </AsyncState>
            </DashboardPanel>

            <DashboardPanel title="Analyse financière" className={styles.financePanel}>
              <div className={styles.financeList}>
                <article>
                  <span>Missions réalisées</span>
                  <strong>{completedMissions.length}</strong>
                </article>
                <article>
                  <span>Budget maintenance</span>
                  <strong>{formatEuroAmountLabel(maintenanceBudget, "-")}</strong>
                </article>
                <article>
                  <span>Budget ménage</span>
                  <strong>{formatEuroAmountLabel(cleaningBudget, "-")}</strong>
                </article>
                <article>
                  <span>Total operations du mois</span>
                  <strong>{formatEuroAmountLabel(sumMissionAmounts(thisMonthMissions), "-")}</strong>
                </article>
              </div>
            </DashboardPanel>
          </div>

          <div className={styles.contentGrid}>
            <DashboardPanel title="Missions en cours" className={styles.missionsPanel}>
              <AsyncState loading={loading} error={error}>
                <div className={styles.missionTable}>
                  {missionRows.length > 0 ? (
                    missionRows.map((mission) => (
                      <Link key={mission.id} href={mission.href} className={styles.missionRow}>
                        <div className={styles.missionMain}>
                          <strong>{mission.title}</strong>
                          <p>{mission.property}</p>
                        </div>
                        <span>{mission.type}</span>
                        <span>{mission.status}</span>
                        <span>{mission.date}</span>
                        <span>{mission.owner}</span>
                        <span>{mission.cost}</span>
                      </Link>
                    ))
                  ) : (
                    <p className={styles.emptyText}>Aucune mission active pour le moment.</p>
                  )}
                </div>
              </AsyncState>
            </DashboardPanel>

            <DashboardPanel title="Vue par logement" className={styles.propertyPanel}>
              <AsyncState loading={loading} error={error}>
                <div className={styles.propertyList}>
                  {propertyRows.length > 0 ? (
                    propertyRows.map((property) => (
                      <Link key={property.id} href={`/dashboard/owner/logements/${property.id}`} className={styles.propertyCard}>
                        <div className={styles.propertyTop}>
                          <div>
                            <strong>{property.name}</strong>
                            <p>{property.city}</p>
                          </div>
                          <span className={property.state === "Sous contrôle" ? styles.stateGood : styles.stateWarning}>
                            {property.state}
                          </span>
                        </div>
                        <span>Missions actives : {property.activeCount}</span>
                        <span>Dernière intervention : {property.lastIntervention}</span>
                        <span>Prochaine intervention : {property.nextIntervention}</span>
                      </Link>
                    ))
                  ) : (
                    <p className={styles.emptyText}>Aucun logement n'a de mission active pour le moment.</p>
                  )}
                </div>
              </AsyncState>
            </DashboardPanel>
          </div>

          <div className={styles.bottomGrid}>
            <DashboardPanel title="Activité récente" className={styles.timelinePanel}>
              <div className={styles.timelineGroups}>
                {activityGroups.map((group) => (
                  <div key={group.label} className={styles.timelineGroup}>
                    <div className={styles.timelineHeader}>
                      <strong>{group.label}</strong>
                      <span>{group.items.length}</span>
                    </div>
                    {group.items.length > 0 ? (
                      group.items.map((item) => (
                        <Link key={item.id} href={item.href} className={styles.timelineItem}>
                          <span>{item.label}</span>
                          <strong>{item.title}</strong>
                        </Link>
                      ))
                    ) : (
                      <p className={styles.emptyText}>Aucun événement sur cette période.</p>
                    )}
                  </div>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Actions rapides" className={styles.actionsPanel}>
              <div className={styles.actionLinks}>
                <Link href="/dashboard/owner/missions/new" className={styles.primaryLink}>Créer une mission</Link>
                <Link href="/dashboard/owner/mission-urgente" className={styles.secondaryLink}>Mission urgente</Link>
                <Link href="/dashboard/owner/devis" className={styles.secondaryLink}>Comparer des devis</Link>
                <Link href="/dashboard/owner/messages" className={styles.secondaryLink}>Centre de communication</Link>
                <Link href="/dashboard/owner/planning" className={styles.secondaryLink}>Voir le planning complet</Link>
              </div>
            </DashboardPanel>
          </div>
        </section>
      </OwnerWorkspacePage>
    </div>
  );
}
