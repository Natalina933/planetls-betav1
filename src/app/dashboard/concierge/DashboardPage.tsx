"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CircleAlert,
  Clock3,
  DoorOpen,
  FileText,
  Home,
  MessageSquareText,
  Plus,
  Send,
  Sparkles,
  TriangleAlert,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { DashboardLoadingScreen } from "@/components/dashboard";
import { AsyncState } from "@/components/ui";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { formatCurrencyAmount, formatDateValue } from "@/app/utils/formatters";
import type { CurrentUser } from "@/app/components/hooks/useCurrentUser";
import { useConciergeDashboardData, type ConciergeDashboardRequest } from "./useConciergeDashboardData";
import styles from "./Dashboard.module.scss";

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

function getGreetingLabel() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon apres-midi";
  return "Bonsoir";
}

function isMissionPendingValidation(status: string | null | undefined) {
  return ["to_schedule", "date_requested", "date_proposed", "date_confirmed"].includes(
    (status ?? "").trim().toLowerCase(),
  );
}

function isMissionClosed(status: string | null | undefined) {
  return ["completed", "cancelled", "canceled", "done"].includes((status ?? "").trim().toLowerCase());
}

function isRequestAwaitingReply(status: string | null | undefined) {
  return ["sent", "viewed", "information_requested", "date_proposed", "interested"].includes(
    (status ?? "").trim().toLowerCase(),
  );
}

function isQuoteToSend(request: ConciergeDashboardRequest) {
  const recipientStatus = (request.recipient_status ?? "").trim().toLowerCase();
  const quoteStatus = (request.quote_status ?? "").trim().toLowerCase();
  if (quoteStatus === "draft") return true;
  return recipientStatus === "interested" && !request.quote_id;
}

function isArrivalRequest(request: ConciergeDashboardRequest) {
  const text = `${request.title} ${request.property_name ?? ""}`.toLowerCase();
  return text.includes("check-in") || text.includes("arrivee") || text.includes("voyageur");
}

function formatTime(value: string | Date | null | undefined) {
  if (!value) return "--:--";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getRequestHref(request: ConciergeDashboardRequest) {
  return `/dashboard/concierge/demandes?recipient=${encodeURIComponent(request.recipient_id)}`;
}

function getConversationHref(request: ConciergeDashboardRequest) {
  if (request.conversation_id) {
    return `/dashboard/concierge/messages?conversation=${encodeURIComponent(request.conversation_id)}`;
  }
  return "/dashboard/concierge/messages";
}

function getRequestActionLabel(request: ConciergeDashboardRequest) {
  if (request.recipient_status === "quoted") return "Ouvrir le devis";
  if (isQuoteToSend(request)) return "Proposer un devis";
  if (request.mission_id) return "Voir la mission";
  return "Repondre";
}

function getPriorityIcon(request: ConciergeDashboardRequest | null): LucideIcon {
  if (!request) return CircleAlert;
  const text = request.title.toLowerCase();
  if (text.includes("check-in") || text.includes("arrivee")) return DoorOpen;
  if (text.includes("menage")) return Sparkles;
  if (text.includes("maintenance") || text.includes("depannage") || text.includes("reparation")) return Wrench;
  return TriangleAlert;
}

function getHousingStatusLabel(status: string) {
  if (status === "pret") return "Pret";
  if (status === "menage") return "Menage";
  if (status === "arrivee") return "Arrivee du jour";
  if (status === "depart") return "Depart du jour";
  return "A suivre";
}

function getActivityDateLabel(value: string | null | undefined) {
  if (!value) return "Sans date";
  return formatDateValue(value, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
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
  const {
    requests,
    requestsLoading,
    requestsError,
    missionRows,
    plannedNow,
    housings,
    conversations,
    quotes,
    kpis,
  } = useConciergeDashboardData(isAuthenticated);

  const conciergeName = user?.firstName || user?.company_name || user?.username || "Christa";

  const todayRequests = useMemo(() => requests.filter((request) => isToday(request.desired_date)), [requests]);
  const todayArrivals = useMemo(() => {
    const housingArrivals = housings.filter((housing) => housing.statut === "arrivee").length;
    const requestArrivals = todayRequests.filter(isArrivalRequest).length;
    return Math.max(housingArrivals, requestArrivals);
  }, [housings, todayRequests]);

  const openMissionCount = useMemo(
    () => missionRows.filter((mission) => !isMissionClosed(mission.status)).length,
    [missionRows],
  );
  const ownerRequestsToHandle = useMemo(
    () => requests.filter((request) => isRequestAwaitingReply(request.recipient_status)).length,
    [requests],
  );
  const quotesToSend = useMemo(() => requests.filter(isQuoteToSend), [requests]);
  const pendingValidationCount = useMemo(
    () => missionRows.filter((mission) => isMissionPendingValidation(mission.status)).length,
    [missionRows],
  );
  const urgentRequests = useMemo(() => requests.filter((request) => request.urgency), [requests]);
  const urgentMissionCount = useMemo(
    () => missionRows.filter((mission) => mission.priority === "urgent" && !isMissionClosed(mission.status)).length,
    [missionRows],
  );
  const unreadConversationCount = useMemo(
    () =>
      conversations.reduce(
        (sum, conversation) => sum + (typeof conversation.unread_count === "number" ? conversation.unread_count : 0),
        0,
      ),
    [conversations],
  );

  const priorityRequest = useMemo(() => {
    const urgentToday = requests.find((request) => request.urgency && isToday(request.desired_date));
    if (urgentToday) return urgentToday;
    const urgent = urgentRequests[0];
    if (urgent) return urgent;
    const arrival = todayRequests.find(isArrivalRequest);
    if (arrival) return arrival;
    return requests[0] ?? null;
  }, [requests, todayRequests, urgentRequests]);

  const todayPlanning = useMemo(
    () => plannedNow.filter((event) => isSameLocalDay(event.start, new Date())).slice(0, 6),
    [plannedNow],
  );

  const propertyRows = useMemo(
    () =>
      housings.slice(0, 4).map((housing) => {
        const relatedMission = missionRows.find(
          (mission) => String(mission.property_id ?? "") === String(housing.id) && !isMissionClosed(mission.status),
        );
        return {
          id: housing.id,
          name: housing.nom_logement || `Logement #${housing.id}`,
          city: housing.ville || "Ville a preciser",
          status: getHousingStatusLabel(housing.statut),
          lastAction: relatedMission?.title || "Aucune intervention ouverte",
          nextMoment: relatedMission?.scheduled_start
            ? formatDateValue(relatedMission.scheduled_start, {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Pas de date planifiee",
          href: `/dashboard/concierge/logements/${housing.id}`,
        };
      }),
    [housings, missionRows],
  );

  const projectedRevenue = useMemo(() => {
    const fromQuotes = quotes.reduce((sum, quote) => {
      const status = (quote.status ?? "").trim().toLowerCase();
      if (status === "accepted" || status === "sent" || status === "draft") {
        return sum + (typeof quote.total_amount === "number" ? quote.total_amount : 0);
      }
      return sum;
    }, 0);

    if (fromQuotes > 0) return fromQuotes;

    return requests.reduce((sum, request) => {
      if (!request.quote_id && !isQuoteToSend(request)) return sum;
      return sum + (typeof request.budget_max === "number" ? request.budget_max : 0);
    }, 0);
  }, [quotes, requests]);

  const monthCompletedRevenue = useMemo(() => {
    const completedMissions = typeof kpis?.completed === "number" ? kpis.completed : 0;
    return completedMissions;
  }, [kpis?.completed]);

  const activityItems = useMemo(() => {
    const messageItems = conversations
      .filter((conversation) => Boolean(conversation.last_message_at))
      .slice(0, 2)
      .map((conversation) => ({
        id: `conversation-${conversation.id}`,
        label: "Message proprietaire",
        title: conversation.subject || conversation.counterpart_name || "Conversation active",
        detail:
          typeof conversation.unread_count === "number" && conversation.unread_count > 0
            ? `${conversation.unread_count} message(s) non lus`
            : "Dernier echange disponible",
        date: getActivityDateLabel(conversation.last_message_at),
        href: conversation.id
          ? `/dashboard/concierge/messages?conversation=${encodeURIComponent(conversation.id)}`
          : "/dashboard/concierge/messages",
      }));

    const requestItems = requests.slice(0, 2).map((request) => ({
      id: `request-${request.recipient_id}`,
      label: isQuoteToSend(request) ? "Devis a envoyer" : "Demande",
      title: request.title,
      detail: request.property_name || request.city || "Logement a preciser",
      date: getActivityDateLabel(request.updated_at || request.created_at || request.desired_date),
      href: getRequestHref(request),
    }));

    return [...messageItems, ...requestItems].slice(0, 4);
  }, [conversations, requests]);

  const healthCards = [
    {
      label: "Missions ouvertes",
      value: `${openMissionCount}`,
      detail:
        todayPlanning.length > 0
          ? `${todayPlanning.length} intervention(s) positionnee(s) aujourd'hui`
          : "Aucune intervention planifiee aujourd'hui",
      tone: openMissionCount > 0 ? "info" : "good",
      href: "/dashboard/concierge/planning",
    },
    {
      label: "Demandes proprietaires",
      value: `${ownerRequestsToHandle}`,
      detail:
        ownerRequestsToHandle > 0
          ? "Des proprietaires attendent une reponse"
          : "La file proprietaire est a jour",
      tone: ownerRequestsToHandle > 0 ? "warn" : "good",
      href: "/dashboard/concierge/demandes",
    },
    {
      label: "Voyageurs du jour",
      value: `${todayArrivals}`,
      detail:
        todayArrivals > 0
          ? "Des arrivees demandent une coordination terrain"
          : "Aucune arrivee signalee aujourd'hui",
      tone: todayArrivals > 0 ? "info" : "good",
      href: "/dashboard/concierge/planning",
    },
    {
      label: "Devis a envoyer",
      value: `${quotesToSend.length}`,
      detail:
        quotesToSend.length > 0
          ? "Des opportunites commerciales sont a convertir"
          : "Aucun devis urgent a produire",
      tone: quotesToSend.length > 0 ? "warn" : "good",
      href: "/dashboard/concierge/billing",
    },
  ] as const;

  const revenueCards = [
    {
      label: "Revenus a venir",
      value: formatCurrencyAmount(projectedRevenue, {
        currency: "EUR",
        emptyLabel: "0 EUR",
      }),
      detail:
        projectedRevenue > 0
          ? "Projection issue des devis et demandes deja qualifiees"
          : "Aucun revenu previsionnel consolide pour l'instant",
    },
    {
      label: "Missions realisees",
      value: `${monthCompletedRevenue}`,
      detail: "Volume de missions terminees remonte par le cockpit",
    },
    {
      label: "Missions en attente de validation",
      value: `${pendingValidationCount}`,
      detail:
        pendingValidationCount > 0
          ? "Des interventions demandent une date ou une confirmation"
          : "Aucune validation en souffrance",
    },
    {
      label: "Messages a traiter",
      value: `${unreadConversationCount}`,
      detail:
        unreadConversationCount > 0
          ? "Des echanges proprietaires demandent une lecture rapide"
          : "Messagerie sous controle",
    },
  ];

  const quickActions = [
    {
      label: "Ajouter un logement",
      href: "/dashboard/concierge/logements/create",
      icon: Plus,
    },
    {
      label: "Creer un devis",
      href: "/dashboard/concierge/billing",
      icon: FileText,
    },
    {
      label: "Creer une mission",
      href: "/dashboard/concierge/demandes",
      icon: CalendarClock,
    },
    {
      label: "Envoyer un message",
      href: "/dashboard/concierge/messages",
      icon: Send,
    },
  ];

  if (loading || !isAuthenticated) {
    return <DashboardLoadingScreen label="Chargement de votre cockpit conciergerie..." />;
  }

  const PriorityIcon = getPriorityIcon(priorityRequest);

  return (
    <main className={styles.dashboard}>
      <section className={styles.heroPanel} aria-labelledby="concierge-dashboard-title">
        <div className={styles.heroCopy}>
          <span className={styles.heroBadge}>Cockpit conciergerie</span>
          <h1 id="concierge-dashboard-title">
            {getGreetingLabel()} {conciergeName}, voici votre activite du jour.
          </h1>
          <p>
            Vous gerez actuellement {housings.length} logement(s), {openMissionCount} mission(s)
            ouverte(s), {todayArrivals} arrivee(s) voyageur(s) aujourd&apos;hui et {quotesToSend.length} devis a envoyer.
          </p>
        </div>

        <div className={styles.heroMetrics} aria-label="Synthese concierge">
          <article className={styles.heroMetric}>
            <span>Logements</span>
            <strong>{housings.length}</strong>
            <small>suivis</small>
          </article>
          <article className={styles.heroMetric}>
            <span>Missions ouvertes</span>
            <strong>{openMissionCount}</strong>
            <small>{todayPlanning.length} aujourd&apos;hui</small>
          </article>
          <article className={styles.heroMetric}>
            <span>Arrivees</span>
            <strong>{todayArrivals}</strong>
            <small>voyageurs du jour</small>
          </article>
          <article className={styles.heroMetric}>
            <span>Devis</span>
            <strong>{quotesToSend.length}</strong>
            <small>a envoyer</small>
          </article>
        </div>

        <div className={styles.heroActions}>
          <Link href="/dashboard/concierge/planning" className={styles.primaryLink}>
            Voir le planning
          </Link>
          <Link href="/dashboard/concierge/demandes" className={styles.secondaryLink}>
            Ouvrir les demandes
          </Link>
          <Link href="/dashboard/concierge/billing" className={styles.secondaryLink}>
            Ouvrir devis et factures
          </Link>
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="health-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Sante de l&apos;activite</span>
          <h2 id="health-title">Voir en quelques secondes ce qui demande votre attention</h2>
          <p>Chaque carte repond a une question metier immediate sans repeter les memes informations.</p>
        </div>
        <div className={styles.healthGrid}>
          {healthCards.map((card) => (
            <Link key={card.label} href={card.href} className={styles.healthCard}>
              <div className={styles.healthTop}>
                <span className={`${styles.healthDot} ${styles[card.tone]}`} />
                <span className={styles.healthLabel}>{card.label}</span>
              </div>
              <strong className={styles.healthValue}>{card.value}</strong>
              <p className={styles.healthDetail}>{card.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="priority-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Priorite du jour</span>
          <h2 id="priority-title">Le point metier a traiter maintenant</h2>
        </div>
        <div className={styles.priorityLayout}>
          <article className={styles.priorityHero}>
            <span className={styles.priorityBadge}>
              {priorityRequest?.urgency ? "Mission urgente" : todayArrivals > 0 ? "Arrivee voyageur" : "Point d'attention"}
            </span>
            <div className={styles.priorityHeader}>
              <span className={styles.priorityIcon}>
                <PriorityIcon size={24} />
              </span>
              <div>
                <strong>{priorityRequest?.property_name || priorityRequest?.title || "Aucune urgence terrain detectee"}</strong>
                <p>
                  {priorityRequest
                    ? `${priorityRequest.title} · ${priorityRequest.city || "Ville a preciser"}`
                    : "Votre tableau de bord ne detecte pas de mission bloquante a cet instant."}
                </p>
              </div>
            </div>
            <div className={styles.priorityMeta}>
              <span>
                <Clock3 size={15} />
                {priorityRequest?.desired_date
                  ? `Check-in prevu a ${formatTime(priorityRequest.desired_date)}`
                  : "Horaire a confirmer"}
              </span>
              <span>
                <UsersRound size={15} />
                Voyageur ou proprietaire a coordonner
              </span>
            </div>
            <p className={styles.priorityNote}>
              {priorityRequest
                ? `Action attendue : ${getRequestActionLabel(priorityRequest).toLowerCase()}.`
                : "Action attendue : surveiller le planning, les demandes proprietaires et les urgences terrain."}
            </p>
            <div className={styles.priorityActions}>
              <Link
                href={priorityRequest ? getRequestHref(priorityRequest) : "/dashboard/concierge/planning"}
                className={styles.primaryLink}
              >
                {priorityRequest?.mission_id ? "Voir mission" : "Voir la demande"}
              </Link>
              <Link
                href={priorityRequest ? getRequestHref(priorityRequest) : "/dashboard/concierge/demandes"}
                className={styles.secondaryLink}
              >
                Confirmer la prise en charge
              </Link>
              <Link
                href={priorityRequest ? getConversationHref(priorityRequest) : "/dashboard/concierge/messages"}
                className={styles.secondaryLink}
              >
                Contacter proprietaire
              </Link>
            </div>
          </article>

          <div className={styles.signalList}>
            <Link href="/dashboard/concierge/demandes" className={styles.signalCard}>
              <div className={styles.signalTop}>
                <span>Proprietaires attendent une reponse</span>
                <strong>{ownerRequestsToHandle}</strong>
              </div>
              <p>Ouvrir les nouvelles demandes, qualifier puis faire avancer les devis utiles.</p>
            </Link>
            <Link href="/dashboard/concierge/planning" className={styles.signalCard}>
              <div className={styles.signalTop}>
                <span>Voyageurs arrivent aujourd&apos;hui</span>
                <strong>{todayArrivals}</strong>
              </div>
              <p>Verifier check-in, menage, acces et coordination terrain avant l&apos;arrivee.</p>
            </Link>
            <Link href="/dashboard/concierge/logements" className={styles.signalCard}>
              <div className={styles.signalTop}>
                <span>Logements a intervenir</span>
                <strong>{housings.filter((housing) => housing.statut !== "pret").length}</strong>
              </div>
              <p>Menages, arrivees et departs visibles sans ouvrir chaque fiche logement.</p>
            </Link>
            <Link href="/dashboard/concierge/billing" className={styles.signalCard}>
              <div className={styles.signalTop}>
                <span>CA a venir</span>
                <strong>{formatCurrencyAmount(projectedRevenue, { currency: "EUR", emptyLabel: "0 EUR" })}</strong>
              </div>
              <p>Projection rapide pour arbitrer les devis, missions et encaissements a suivre.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="operations-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Operations du jour</span>
          <h2 id="operations-title">Planning, demandes et urgences dans la meme lecture</h2>
        </div>

        <div className={styles.dualGrid}>
          <article className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Planning operationnel</span>
                <h3>Aujourd&apos;hui</h3>
              </div>
              <Link href="/dashboard/concierge/planning" className={styles.inlineLink}>
                Vue complete
              </Link>
            </div>
            <div className={styles.timelineList}>
              {todayPlanning.length > 0 ? (
                todayPlanning.map((event, index) => (
                  <Link
                    key={`${event.bookingId ?? event.title}-${index}`}
                    href="/dashboard/concierge/planning"
                    className={styles.timelineRow}
                  >
                    <span className={styles.timelineTime}>{formatTime(event.start)}</span>
                    <div>
                      <strong>{String(event.title || "Mission")}</strong>
                      <p>{event.type === "reminder" ? "Intervention urgente" : "Mission planifiee"}</p>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                ))
              ) : (
                <div className={styles.emptyCard}>Aucun creneau aujourd&apos;hui. Ouvrir le planning complet.</div>
              )}
            </div>
          </article>

          <article className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Demandes proprietaires</span>
                <h3>A traiter</h3>
              </div>
              <Link href="/dashboard/concierge/demandes" className={styles.inlineLink}>
                Voir toutes
              </Link>
            </div>
            <AsyncState loading={requestsLoading} error={requestsError}>
              <div className={styles.requestList}>
                {requests.slice(0, 4).map((request) => (
                  <article key={request.recipient_id} className={styles.requestCard}>
                    <div className={styles.requestTop}>
                      <div>
                        <strong>{request.title}</strong>
                        <p>{request.property_name || request.city || "Logement a preciser"}</p>
                      </div>
                      <span className={styles.inlineStatus}>
                        {request.urgency ? "Urgente" : isQuoteToSend(request) ? "Devis" : "A repondre"}
                      </span>
                    </div>
                    <div className={styles.requestMeta}>
                      <span>{request.owner_name || "Proprietaire"}</span>
                      <span>
                        {request.desired_date
                          ? formatDateValue(request.desired_date, {
                              day: "2-digit",
                              month: "short",
                            })
                          : "Date a definir"}
                      </span>
                    </div>
                    <div className={styles.requestActions}>
                      <Link href={getRequestHref(request)} className={styles.primaryLink}>
                        Repondre
                      </Link>
                      <Link href={getRequestHref(request)} className={styles.secondaryLink}>
                        Proposer un devis
                      </Link>
                      <Link href={getConversationHref(request)} className={styles.ghostLink}>
                        Refuser / discuter
                      </Link>
                    </div>
                  </article>
                ))}
                {requests.length === 0 ? (
                  <div className={styles.emptyCard}>Aucune demande proprietaire active pour le moment.</div>
                ) : null}
              </div>
            </AsyncState>
          </article>
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="activity-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Activite recente</span>
          <h2 id="activity-title">Ce qui vient de bouger</h2>
        </div>
        <div className={styles.timelineList}>
          {activityItems.length > 0 ? (
            activityItems.map((item) => (
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

      <section className={styles.sectionBlock} aria-labelledby="revenues-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Revenus</span>
          <h2 id="revenues-title">Lecture financiere simple et utile</h2>
        </div>
        <div className={styles.financeGrid}>
          {revenueCards.map((card) => (
            <article key={card.label} className={styles.financeCard}>
              <span className={styles.financeLabel}>{card.label}</span>
              <strong className={styles.financeValue}>{card.value}</strong>
              <p>{card.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="housing-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Mes logements</span>
          <h2 id="housing-title">Le parc suivi sans ouvrir chaque fiche</h2>
        </div>
        <div className={styles.propertiesGrid}>
          {propertyRows.length > 0 ? (
            propertyRows.map((property) => (
              <Link key={property.id} href={property.href} className={styles.propertyCard}>
                <div className={styles.propertyHead}>
                  <span className={styles.propertyIcon}>
                    <Building2 size={18} />
                  </span>
                  <div>
                    <strong>{property.name}</strong>
                    <p>{property.city}</p>
                  </div>
                </div>
                <div className={styles.propertyStats}>
                  <div>
                    <span>Statut</span>
                    <strong>{property.status}</strong>
                  </div>
                  <div>
                    <span>Derniere intervention</span>
                    <strong>{property.lastAction}</strong>
                  </div>
                  <div>
                    <span>Prochain moment</span>
                    <strong>{property.nextMoment}</strong>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className={styles.emptyCard}>Aucun logement suivi pour le moment.</div>
          )}
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="quick-actions-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Actions rapides</span>
          <h2 id="quick-actions-title">Acces directs aux gestes frequents</h2>
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

      <section className={styles.sectionBlock} aria-labelledby="alerts-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Urgences terrain</span>
          <h2 id="alerts-title">Ce qui peut degrader l&apos;exploitation si vous tardez</h2>
        </div>
        <div className={styles.alertGrid}>
          <Link href="/dashboard/concierge/alertes" className={styles.alertCard}>
            <TriangleAlert size={20} />
            <div>
              <strong>{urgentMissionCount} urgence(s) mission</strong>
              <p>Interventions prioritaires remontees par le planning.</p>
            </div>
          </Link>
          <Link href="/dashboard/concierge/demandes" className={styles.alertCard}>
            <CircleAlert size={20} />
            <div>
              <strong>{urgentRequests.length} demande(s) urgente(s)</strong>
              <p>Demandes proprietaires qui demandent une reaction rapide.</p>
            </div>
          </Link>
          <Link href="/dashboard/concierge/logements" className={styles.alertCard}>
            <Home size={20} />
            <div>
              <strong>{housings.filter((housing) => housing.statut === "menage").length} logement(s) en menage</strong>
              <p>Points de readiness a verifier avant arrivee ou rotation.</p>
            </div>
          </Link>
          <Link href="/dashboard/concierge/messages" className={styles.alertCard}>
            <MessageSquareText size={20} />
            <div>
              <strong>{unreadConversationCount} message(s) non lus</strong>
              <p>Les echanges proprietaires peuvent bloquer devis ou mission si rien n&apos;avance.</p>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
