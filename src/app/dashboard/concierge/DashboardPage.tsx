"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CloudSun,
  DoorOpen,
  Euro,
  FileText,
  GripVertical,
  Home,
  MessageSquareText,
  Radio,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { DashboardLoadingScreen } from "@/components/dashboard";
import { AsyncState } from "@/components/ui";
import { DashboardHomeIcon } from "@/components/ui/PublicIcon";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { formatCurrencyAmount, formatDateValue } from "@/app/utils/formatters";
import type { CurrentUser } from "@/app/components/hooks/useCurrentUser";
import {
  UnifiedPropertyPortfolio,
  UnifiedRoleDashboard,
  UnifiedSpotlightList,
  UnifiedStatStack,
  type UnifiedPropertyItem,
  type UnifiedSpotlightItem,
  type UnifiedStatItem,
} from "@/app/components/dashboard/unified";
import { DashboardEmptyState, DashboardStatusBadge, getDashboardMissionPaceMeta } from "@/app/components/dashboard/saas";
import { useConciergeDashboardData, type ConciergeDashboardRequest } from "./useConciergeDashboardData";
import ConciergeDashboardModeControls from "./ConciergeDashboardModeControls";
import {
  CONCIERGE_OPERATING_MODE_CONFIG,
  CONCIERGE_WIDGET_STORAGE_KEY,
  DEFAULT_CONCIERGE_DASHBOARD_PREFERENCES,
  DEFAULT_CONCIERGE_WIDGETS,
  parseConciergeWidgets,
  type ConciergeDashboardPreferences,
  type ConciergeWidgetId,
} from "./dashboardModes";
import {
  buildAvailabilityHoursWithInspirationLibrary,
  buildYoutubeSearchUrl,
  parseConciergeInspirationLibrary,
} from "./inspirationVideos";
import styles from "./Dashboard.module.scss";

function getDateTime(value: string | Date | null | undefined) {
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

function isWithinNextDays(value: string | Date | null | undefined, days: number) {
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
  if (status === "pret") return "Prêt";
  if (status === "menage") return "Ménage";
  if (status === "arrivee") return "Arrivée du jour";
  if (status === "depart") return "Départ du jour";
  return "À suivre";
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

type ActivityWeatherTone = "good" | "warn" | "info";

function getActivityWeather({
  todayPlanningCount,
  urgentCount,
  unreadConversationCount,
  quotesToSendCount,
  pendingValidationCount,
}: {
  todayPlanningCount: number;
  urgentCount: number;
  unreadConversationCount: number;
  quotesToSendCount: number;
  pendingValidationCount: number;
}) {
  const pressureScore =
    todayPlanningCount * 12 +
    urgentCount * 18 +
    unreadConversationCount * 6 +
    quotesToSendCount * 8 +
    pendingValidationCount * 10;
  const score = Math.min(100, Math.max(8, pressureScore));

  if (urgentCount > 0 || score >= 70) {
    return {
      label: "Orage operationnel",
      detail: "Prioriser urgences, messages et validations avant les actions commerciales.",
      tone: "warn" as ActivityWeatherTone,
      score,
      icon: TriangleAlert,
    };
  }

  if (todayPlanningCount > 0 || unreadConversationCount > 0 || quotesToSendCount > 0) {
    return {
      label: "Ciel actif",
      detail: "Le flux est vivant mais reste pilotable depuis le cockpit.",
      tone: "info" as ActivityWeatherTone,
      score,
      icon: CloudSun,
    };
  }

  return {
    label: "Temps clair",
    detail: "Aucun point bloquant detecte, bon moment pour preparer la suite.",
    tone: "good" as ActivityWeatherTone,
    score,
    icon: CheckCircle2,
  };
}
function ConciergeInspirationPanel({
  availabilityHours,
}: {
  availabilityHours?: string | null;
}) {
  const library = useMemo(() => parseConciergeInspirationLibrary(availabilityHours), [availabilityHours]);
  const [videoDraft, setVideoDraft] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [filter, setFilter] = useState("");
  const [videos, setVideos] = useState(library.videos.map((item) => item.sourceUrl));
  const [searches, setSearches] = useState(library.searches);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setVideos(library.videos.map((item) => item.sourceUrl));
    setSearches(library.searches);
  }, [library]);

  const filteredVideos = useMemo(() => {
    const hydrated = parseConciergeInspirationLibrary(
      buildAvailabilityHoursWithInspirationLibrary(availabilityHours, { videos, searches }),
    ).videos;
    const normalizedFilter = filter.trim().toLowerCase();
    if (!normalizedFilter) return hydrated;

    return hydrated.filter((video) => {
      const searchHaystack = `${video.sourceUrl} ${video.kind}`.toLowerCase();
      return searchHaystack.includes(normalizedFilter);
    });
  }, [availabilityHours, filter, searches, videos]);

  const persistLibrary = async (nextVideos: string[], nextSearches: string[]) => {
    setSaving(true);
    setFeedback("");

    try {
      const response = await fetch("/api/profiles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          availability_hours: buildAvailabilityHoursWithInspirationLibrary(availabilityHours, {
            videos: nextVideos,
            searches: nextSearches,
          }),
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'enregistrer la bibliotheque d'inspiration.");
      }

      setVideos(nextVideos);
      setSearches(nextSearches);
      setVideoDraft("");
      setSearchDraft("");
      setFeedback("Bibliotheque video mise a jour.");
      window.dispatchEvent(new Event("user-profile-updated"));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Erreur de sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const addVideos = async () => {
    const nextVideos = Array.from(
      new Set(
        [...videos, ...videoDraft.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)],
      ),
    );

    await persistLibrary(nextVideos, searches);
  };

  const addSearch = async () => {
    const nextSearches = Array.from(new Set([...searches, searchDraft.trim()].filter(Boolean)));
    await persistLibrary(videos, nextSearches);
  };

  const removeVideo = async (sourceUrl: string) => {
    await persistLibrary(
      videos.filter((item) => item !== sourceUrl),
      searches,
    );
  };

  const removeSearch = async (query: string) => {
    await persistLibrary(
      videos,
      searches.filter((item) => item !== query),
    );
  };

  return (
    <div className={styles.inspirationShell}>
      <div className={styles.inspirationIntro}>
        <span className={styles.sectionEyebrow}>Inspiration concierge</span>
        <h3>Bibliotheque YouTube et Shorts</h3>
        <p>
          Ajoutez vos liens au fil de l&apos;eau, gardez des recherches pretes et faites vivre votre veille visuelle
          directement depuis le dashboard.
        </p>
      </div>

      <div className={styles.inspirationLayout}>
        <article className={styles.inspirationManager}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Ajout progressif</span>
              <h4>Alimenter la bibliotheque</h4>
            </div>
            <Link href="/dashboard/concierge/profile?tab=fiche#Videos_d_inspiration" className={styles.inlineLink}>
              Ouvrir la fiche
            </Link>
          </div>

          <div className={styles.inspirationForms}>
            <label className={styles.inspirationField}>
              <span>Liens YouTube ou Shorts</span>
              <textarea
                rows={5}
                value={videoDraft}
                onChange={(event) => setVideoDraft(event.target.value)}
                placeholder={"https://www.youtube.com/shorts/h7PTdVaD15I\nhttps://youtu.be/XXXXXXXXXXX"}
              />
            </label>
            <button
              type="button"
              className={styles.primaryLink}
              onClick={addVideos}
              disabled={saving || videoDraft.trim().length === 0}
            >
              {saving ? "Enregistrement..." : "Ajouter ces videos"}
            </button>

            <label className={styles.inspirationField}>
              <span>Recherche a memoriser</span>
              <div className={styles.searchDraftRow}>
                <input
                  type="text"
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="ex : check-in airbnb luxe"
                />
                <button
                  type="button"
                  className={styles.secondaryLink}
                  onClick={addSearch}
                  disabled={saving || searchDraft.trim().length === 0}
                >
                  Memoriser
                </button>
              </div>
            </label>

            {feedback ? <p className={styles.inspirationFeedback}>{feedback}</p> : null}
          </div>
        </article>

        <article className={styles.inspirationLibrary}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Bibliotheque active</span>
              <h4>{filteredVideos.length} video(s) visibles</h4>
            </div>
            <label className={styles.inspirationSearchBox}>
              <Search size={16} />
              <input
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Rechercher dans la bibliotheque"
              />
            </label>
          </div>

          {searches.length > 0 ? (
            <div className={styles.searchPresetList}>
              {searches.map((query) => (
                <div key={query} className={styles.searchPresetCard}>
                  <a href={buildYoutubeSearchUrl(query)} target="_blank" rel="noreferrer">
                    {query}
                  </a>
                  <button type="button" onClick={() => removeSearch(query)} disabled={saving}>
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {filteredVideos.length > 0 ? (
            <div className={styles.inspirationVideoGrid}>
              {filteredVideos.map((video) => (
                <article key={video.id} className={styles.inspirationVideoCard}>
                  <a
                    href={video.watchUrl}
                    target="_blank"
                  rel="noreferrer"
                  className={styles.inspirationThumbLink}
                >
                  <div className={styles.inspirationEmbedWrap}>
                    {/* The YouTube thumbnail host is not managed through next/image in this project yet. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                      alt={`Apercu YouTube ${video.id}`}
                      loading="lazy"
                      />
                      <span className={styles.inspirationPlayBadge}>Lecture</span>
                    </div>
                  </a>
                  <div className={styles.inspirationVideoMeta}>
                    <span>{video.kind === "short" ? "Short YouTube" : "Video YouTube"}</span>
                    <div className={styles.inspirationVideoActions}>
                      <a href={video.watchUrl} target="_blank" rel="noreferrer">
                        Ouvrir
                      </a>
                      <button type="button" onClick={() => removeVideo(video.sourceUrl)} disabled={saving}>
                        Retirer
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="Aucune video visible"
              copy="Ajoutez des liens YouTube ou enregistrez quelques recherches pour enrichir votre veille."
            />
          )}
        </article>
      </div>
    </div>
  );
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
    planningEvents,
    plannedNow,
    housings,
    conversations,
    quotes,
    kpis,
  } = useConciergeDashboardData(isAuthenticated);

  const conciergeName = user?.firstName || user?.company_name || user?.username || "Christa";
  const [dashboardPreferences, setDashboardPreferences] = useState<ConciergeDashboardPreferences>(
    DEFAULT_CONCIERGE_DASHBOARD_PREFERENCES,
  );
  const [syncedOperatingMode, setSyncedOperatingMode] = useState(dashboardPreferences.operatingMode);
  const [widgets, setWidgets] = useState(DEFAULT_CONCIERGE_WIDGETS);

  useEffect(() => {
    try {
      const savedWidgets = window.localStorage.getItem(CONCIERGE_WIDGET_STORAGE_KEY);
      if (savedWidgets) setWidgets(parseConciergeWidgets(savedWidgets));
    } catch {
      setWidgets(DEFAULT_CONCIERGE_WIDGETS);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CONCIERGE_WIDGET_STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  useEffect(() => {
    if (syncedOperatingMode === dashboardPreferences.operatingMode) return;
    const nextWidgets = CONCIERGE_OPERATING_MODE_CONFIG[dashboardPreferences.operatingMode].widgetDefaults;
    setWidgets({ ...nextWidgets });
    setSyncedOperatingMode(dashboardPreferences.operatingMode);

    try {
      window.localStorage.setItem(CONCIERGE_WIDGET_STORAGE_KEY, JSON.stringify(nextWidgets));
    } catch {
      // Widget preferences should never block the dashboard.
    }
  }, [dashboardPreferences.operatingMode, syncedOperatingMode]);

  const handleDashboardPreferencesChange = useCallback((preferences: ConciergeDashboardPreferences) => {
    setDashboardPreferences(preferences);
  }, []);

  const operatingModeConfig = CONCIERGE_OPERATING_MODE_CONFIG[dashboardPreferences.operatingMode];
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
  const housingActionsCount = useMemo(
    () => housings.filter((housing) => housing.statut !== "pret").length,
    [housings],
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

  const todayPlanningCount = useMemo(
    () => planningEvents.filter((event) => isSameLocalDay(event.start, new Date())).length,
    [planningEvents],
  );

  const weekPlanningCount = useMemo(
    () => planningEvents.filter((event) => isWithinNextDays(event.start, 7)).length,
    [planningEvents],
  );


  const missionPaceMeta = useMemo(() => getDashboardMissionPaceMeta(todayPlanningCount), [todayPlanningCount]);

  const propertyItems = useMemo<UnifiedPropertyItem[]>(
    () =>
      housings.slice(0, 4).map((housing, index) => {
        const relatedMission = missionRows.find(
          (mission) => String(mission.property_id ?? "") === String(housing.id) && !isMissionClosed(mission.status),
        );
        const toneCycle: UnifiedPropertyItem["tone"][] = ["soft", "accent", "gold", "ink"];

        return {
          id: String(housing.id),
          name: housing.nom_logement || `Logement #${housing.id}`,
          location: housing.ville || "Ville a preciser",
          status: getHousingStatusLabel(housing.statut),
          note: relatedMission?.title || "Aucune intervention ouverte pour le moment.",
          href: `/dashboard/concierge/logements/${housing.id}`,
          icon: <DashboardHomeIcon size={22} />,
          tone: toneCycle[index % toneCycle.length],
          metrics: [
            {
              label: "Prochain moment",
              value: relatedMission?.scheduled_start
                ? (formatDateValue(relatedMission.scheduled_start, {
                    day: "2-digit",
                    month: "short",
                  }) || "Planifie")
                : "Libre",
            },
            {
              label: "Focus",
              value: relatedMission ? "Mission ouverte" : "RAS",
            },
          ],
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

  const activityItems = useMemo<UnifiedSpotlightItem[]>(() => {
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
        meta: getActivityDateLabel(conversation.last_message_at),
        href: conversation.id
          ? `/dashboard/concierge/messages?conversation=${encodeURIComponent(conversation.id)}`
          : "/dashboard/concierge/messages",
        icon: <MessageSquareText size={16} />,
        tone:
          typeof conversation.unread_count === "number" && conversation.unread_count > 0
            ? ("warning" as const)
            : ("neutral" as const),
      }));

    const requestItems = requests.slice(0, 2).map((request) => ({
      id: `request-${request.recipient_id}`,
      label: isQuoteToSend(request) ? "Devis a envoyer" : "Demande",
      title: request.title,
      detail: request.property_name || request.city || "Logement a preciser",
      meta: getActivityDateLabel(request.updated_at || request.created_at || request.desired_date),
      href: getRequestHref(request),
      icon: isQuoteToSend(request) ? <FileText size={16} /> : <CalendarClock size={16} />,
      tone: request.urgency ? ("warning" as const) : ("accent" as const),
    }));

    return [...messageItems, ...requestItems].slice(0, 4);
  }, [conversations, requests]);

  const priorityItems = useMemo<UnifiedSpotlightItem[]>(() => {
    const items: UnifiedSpotlightItem[] = [];

    if (priorityRequest) {
      items.push({
        id: `priority-${priorityRequest.recipient_id}`,
        label: priorityRequest.urgency ? "Urgence" : "Point du jour",
        title: priorityRequest.property_name || priorityRequest.title,
        detail: `${priorityRequest.title} · ${priorityRequest.city || "Ville a preciser"}`,
        meta: priorityRequest.desired_date ? `A ${formatTime(priorityRequest.desired_date)}` : "Horaire a confirmer",
        href: getRequestHref(priorityRequest),
        icon: (() => {
          const PriorityIcon = getPriorityIcon(priorityRequest);
          return <PriorityIcon size={16} />;
        })(),
        tone: priorityRequest.urgency ? "warning" : "accent",
      });
    }

    if (quotesToSend[0]) {
      items.push({
        id: `quote-${quotesToSend[0].recipient_id}`,
        label: "Devis",
        title: quotesToSend[0].title,
        detail: quotesToSend[0].property_name || "Proposition commerciale a envoyer",
        meta: quotesToSend[0].budget_max
          ? formatCurrencyAmount(quotesToSend[0].budget_max, { currency: "EUR", emptyLabel: "Budget a preciser" })
          : "Budget a preciser",
        href: getRequestHref(quotesToSend[0]),
        icon: <Euro size={16} />,
        tone: "success",
      });
    }

    if (todayPlanning[0]) {
      items.push({
        id: `planning-${String(todayPlanning[0].bookingId ?? todayPlanning[0].title ?? "event")}`,
        label: "Planning",
        title: String(todayPlanning[0].title || "Mission du jour"),
        detail: todayPlanning[0].type === "reminder" ? "Intervention urgente" : "Mission planifiee",
        meta: formatTime(todayPlanning[0].start),
        href: "/dashboard/concierge/planning",
        icon: <Clock3 size={16} />,
        tone: "neutral",
      });
    }

    if (urgentMissionCount > 0) {
      items.push({
        id: "urgent-missions",
        label: "Terrain",
        title: `${urgentMissionCount} urgence(s) mission`,
        detail: "Des interventions terrain meritent une verification rapide.",
        meta: "Alertes concierge",
        href: "/dashboard/concierge/alertes",
        icon: <ShieldAlert size={16} />,
        tone: "warning",
      });
    }

    return items.slice(0, 4);
  }, [priorityRequest, quotesToSend, todayPlanning, urgentMissionCount]);

  const healthCards = useMemo(
    () => [
      {
        label: "Demandes recues",
        value: `${ownerRequestsToHandle}`,
        detail:
          ownerRequestsToHandle > 0
            ? "Des proprietaires attendent une reponse ou une qualification."
            : "Aucune demande a traiter immediatement.",
        href: "/dashboard/concierge/demandes",
        tone: "info",
      },
      {
        label: operatingModeConfig.kpiLabels.quotes,
        value: `${quotesToSend.length}`,
        detail:
          quotesToSend.length > 0
            ? "Des opportunites commerciales sont prêtes a etre envoyees."
            : "Aucun devis urgent a envoyer.",
        href: "/dashboard/concierge/billing",
        tone: "good",
      },
      {
        label: "Missions a valider",
        value: `${pendingValidationCount}`,
        detail:
          pendingValidationCount > 0
            ? "Certaines dates ou confirmations bloquent la suite."
            : "Le planning est sous controle.",
        href: "/dashboard/concierge/planning",
        tone: "warn",
      },
      {
        label: "Messages non lus",
        value: `${unreadConversationCount}`,
        detail:
          unreadConversationCount > 0
            ? "Des echanges proprietaires attendent une lecture rapide."
            : "Messagerie a jour.",
        href: "/dashboard/concierge/messages",
        tone: "info",
      },
    ],
    [operatingModeConfig.kpiLabels.quotes, ownerRequestsToHandle, pendingValidationCount, quotesToSend.length, unreadConversationCount],
  );

  const revenueCards = useMemo(
    () => [
      {
        label: "Revenus a venir",
        value: formatCurrencyAmount(projectedRevenue, {
          currency: "EUR",
          emptyLabel: "0 EUR",
        }),
        detail:
          projectedRevenue > 0
            ? "Projection issue des devis et demandes deja qualifiees."
            : "Aucun revenu previsionnel consolide pour l'instant.",
      },
      {
        label: "Missions realisees",
        value: `${monthCompletedRevenue}`,
        detail: "Volume de missions terminees remonte par le cockpit.",
      },
      {
        label: "Arrivées du jour",
        value: `${todayArrivals}`,
        detail: "Voyageurs a coordonner aujourd'hui sur le terrain.",
      },
      {
        label: "Paiements a recevoir",
        value: `${quotes.filter((quote) => (quote.status ?? "").trim().toLowerCase() === "accepted").length}`,
        detail: "Dossiers commerciaux susceptibles de se transformer en encaissement.",
      },
    ],
    [monthCompletedRevenue, projectedRevenue, quotes, todayArrivals],
  );

  const financeStats = useMemo<UnifiedStatItem[]>(
    () => [
      {
        label: "CA a venir",
        value: formatCurrencyAmount(projectedRevenue, { currency: "EUR", emptyLabel: "0 EUR" }),
        detail: "Projection devis + demandes qualifiees",
        icon: <Euro size={16} />,
        tone: "accent",
      },
      {
        label: "Devis",
        value: `${quotesToSend.length}`,
        detail: quotesToSend.length > 0 ? "À envoyer ou finaliser" : "À jour",
        icon: <FileText size={16} />,
        tone: "soft",
      },
      {
        label: "Paiements",
        value: `${quotes.filter((quote) => (quote.status ?? "").trim().toLowerCase() === "accepted").length}`,
        detail: "Dossiers a encaisser",
        icon: <Euro size={16} />,
        tone: "neutral",
      },
    ],
    [projectedRevenue, quotes, quotesToSend.length],
  );

  const operationsStats = useMemo<UnifiedStatItem[]>(
    () => [
      {
        label: "Planning du jour",
        value: `${todayPlanningCount}`,
        detail:
          todayPlanningCount > 0
            ? `${todayPlanningCount} aujourd'hui · ${weekPlanningCount} semaine`
            : "Journée calme · vision semaine disponible",
        icon: <Clock3 size={16} />,
        tone: "accent",
      },
      {
        label: "Logements à suivre",
        value: `${housingActionsCount}`,
        detail: housingActionsCount > 0 ? "Ménages, départs ou arrivées" : "Parc prêt",
        icon: <Home size={16} />,
        tone: "soft",
      },
      {
        label: "Urgences",
        value: `${urgentMissionCount + urgentRequests.length}`,
        detail: "Terrain + demandes proprietaires",
        icon: <TriangleAlert size={16} />,
        tone: "neutral",
      },
    ],
    [housingActionsCount, todayPlanningCount, urgentMissionCount, urgentRequests.length, weekPlanningCount],
  );

  const activityWeather = useMemo(
    () =>
      getActivityWeather({
        todayPlanningCount,
        urgentCount: urgentMissionCount + urgentRequests.length,
        unreadConversationCount,
        quotesToSendCount: quotesToSend.length,
        pendingValidationCount,
      }),
    [pendingValidationCount, quotesToSend.length, todayPlanningCount, unreadConversationCount, urgentMissionCount, urgentRequests.length],
  );
  const ActivityWeatherIcon = activityWeather.icon;

  const notificationItems = useMemo<UnifiedSpotlightItem[]>(() => {
    const items: UnifiedSpotlightItem[] = [];

    if (unreadConversationCount > 0) {
      items.push({
        id: "notification-messages",
        label: "Messages",
        title: `${unreadConversationCount} message(s) non lus`,
        detail: "A traiter pour eviter de bloquer devis ou missions.",
        meta: "Messagerie",
        href: "/dashboard/concierge/messages",
        icon: <MessageSquareText size={16} />,
        tone: "warning",
      });
    }

    if (urgentRequests.length > 0) {
      items.push({
        id: "notification-requests",
        label: "Demandes urgentes",
        title: `${urgentRequests.length} demande(s) prioritaires`,
        detail: "Demandes proprietaires a qualifier rapidement.",
        meta: "Demandes",
        href: "/dashboard/concierge/demandes",
        icon: <BellRing size={16} />,
        tone: "warning",
      });
    }

    if (pendingValidationCount > 0) {
      items.push({
        id: "notification-validation",
        label: "Validation",
        title: `${pendingValidationCount} mission(s) a confirmer`,
        detail: "Dates ou confirmations a verrouiller dans le planning.",
        meta: "Planning",
        href: "/dashboard/concierge/planning",
        icon: <CheckCircle2 size={16} />,
        tone: "accent",
      });
    }

    if (quotesToSend.length > 0) {
      items.push({
        id: "notification-quotes",
        label: "Devis",
        title: `${quotesToSend.length} devis a envoyer`,
        detail: "Opportunites commerciales pretes a avancer.",
        meta: "Revenus",
        href: "/dashboard/concierge/billing",
        icon: <Euro size={16} />,
        tone: "success",
      });
    }

    return items.slice(0, 4);
  }, [pendingValidationCount, quotesToSend.length, unreadConversationCount, urgentRequests.length]);

  const missionFocusItems = useMemo(
    () =>
      missionRows
        .filter((mission) => !isMissionClosed(mission.status))
        .slice(0, 4)
        .map((mission) => ({
          id: mission.id,
          title: mission.title || "Mission concierge",
          status: mission.priority === "urgent" ? "Urgente" : mission.status || "A planifier",
          dateLabel: mission.scheduled_start ? formatDateValue(mission.scheduled_start, { day: "2-digit", month: "short" }) : "Date a caler",
          timeLabel: mission.scheduled_start ? formatTime(mission.scheduled_start) : "--:--",
          href: "/dashboard/concierge/planning",
        })),
    [missionRows],
  );

  const widgetControls: Array<{ id: ConciergeWidgetId; label: string; detail: string; icon: LucideIcon }> = [
    { id: "operations", label: operatingModeConfig.planningLabel, detail: "Jour + demandes", icon: CalendarClock },
    { id: "notifications", label: "Notifications", detail: "Messages + alertes", icon: BellRing },
    { id: "missions", label: operatingModeConfig.kpiLabels.missions, detail: "Focus terrain", icon: Radio },
    { id: "revenues", label: operatingModeConfig.revenueLabel, detail: "Devis + paiements", icon: Euro },
    { id: "reports", label: "Rapports", detail: operatingModeConfig.shortLabel, icon: FileText },
    { id: "inspiration", label: "Inspiration", detail: "Bibliotheque video", icon: Sparkles },
  ];

  const activeWidgetCount = Object.values(widgets).filter(Boolean).length;
  const widgetTotalCount = Object.keys(DEFAULT_CONCIERGE_WIDGETS).length;

  const modeActivityScore = useMemo(() => {
    const urgencyWeight = dashboardPreferences.operatingMode === "airbnb_cohost" ? 24 : dashboardPreferences.operatingMode === "provider" ? 22 : 18;
    const missionWeight = dashboardPreferences.operatingMode === "provider" ? 11 : 8;
    const arrivalWeight = dashboardPreferences.operatingMode === "airbnb_cohost" ? 16 : 7;
    const commercialWeight = dashboardPreferences.operatingMode === "conciergerie" ? 10 : 8;
    const score =
      todayArrivals * arrivalWeight +
      openMissionCount * missionWeight +
      (urgentMissionCount + urgentRequests.length) * urgencyWeight +
      quotesToSend.length * commercialWeight +
      unreadConversationCount * 5 +
      pendingValidationCount * 7 +
      (projectedRevenue > 0 ? 12 : 0);

    return Math.min(100, Math.max(5, score));
  }, [
    dashboardPreferences.operatingMode,
    openMissionCount,
    pendingValidationCount,
    projectedRevenue,
    quotesToSend.length,
    todayArrivals,
    unreadConversationCount,
    urgentMissionCount,
    urgentRequests.length,
  ]);

  const reportCards = useMemo(
    () => [
      {
        label: "Mode actif",
        value: operatingModeConfig.shortLabel,
        detail: operatingModeConfig.description,
      },
      {
        label: "Score d'activite",
        value: `${modeActivityScore}%`,
        detail: "Calcul pondere selon le mode metier choisi.",
      },
      {
        label: operatingModeConfig.revenueLabel,
        value: formatCurrencyAmount(projectedRevenue, { currency: "EUR", emptyLabel: "0 EUR" }),
        detail: operatingModeConfig.statDetails.revenueDetail,
      },
      {
        label: "Risque operationnel",
        value: `${urgentMissionCount + urgentRequests.length + pendingValidationCount}`,
        detail: "Urgences, validations et arbitrages qui peuvent ralentir l'exploitation.",
      },
    ],
    [modeActivityScore, operatingModeConfig, pendingValidationCount, projectedRevenue, urgentMissionCount, urgentRequests.length],
  );
  const quickActions = [
    {
      label: "Ajouter un logement",
      href: "/dashboard/concierge/logements/create",
      icon: Home,
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
    <div className="theme-concierge">
      <UnifiedRoleDashboard
        role="concierge"
        title={`${getGreetingLabel()} ${conciergeName}, voici votre cockpit ${operatingModeConfig.shortLabel.toLowerCase()} du jour.`}
        subtitle={`${operatingModeConfig.dashboardLead} ${housings.length} actif(s), ${openMissionCount} mission(s), ${todayArrivals} moment(s) du jour et ${quotesToSend.length} opportunite(s) a traiter.`}
        experienceBadge={user?.years_experience ? `${user.years_experience} ans d'experience` : operatingModeConfig.badge}
        statusLabel={urgentMissionCount + urgentRequests.length > 0 ? "Points chauds a surveiller" : "Activite sous controle"}
        actions={[
          {
            id: "planning",
            label: "Voir le planning",
            href: "/dashboard/concierge/planning",
            tone: "primary",
          },
          {
            id: "requests",
            label: "Ouvrir les demandes",
            href: "/dashboard/concierge/demandes",
            tone: "secondary",
          },
          {
            id: "billing",
            label: "Devis et factures",
            href: "/dashboard/concierge/billing",
            tone: "ghost",
          },
        ]}
        kpis={[
          {
            id: "housings",
            label: "Logements",
            value: `${housings.length}`,
            detail: housingActionsCount > 0 ? `${housingActionsCount} logement(s) à suivre` : `${housings.length} logement(s) prêt(s)`,
            icon: <DashboardHomeIcon size={26} />,
            statusLabel: housingActionsCount > 0 ? `${housingActionsCount} actif(s) a verifier` : operatingModeConfig.statDetails.portfolioStable,
            statusTone: housingActionsCount > 0 ? "warning" : "success",
          },
          {
            id: "missions",
            label: operatingModeConfig.kpiLabels.missions,
            value: `${openMissionCount}`,
            detail: todayPlanningCount > 0 ? `${todayPlanningCount} element(s) aujourd'hui` : "Aucun element aujourd'hui",
            icon: <CalendarClock size={18} />,
            statusLabel: pendingValidationCount > 0 ? `${pendingValidationCount} mission(s) à valider` : missionPaceMeta.label,
            statusTone: pendingValidationCount > 0 ? "warning" : missionPaceMeta.tone,
            statusIcon: pendingValidationCount > 0 ? undefined : missionPaceMeta.icon,
            statusIconOnly: pendingValidationCount === 0 && missionPaceMeta.level === "calm",
            statusText: pendingValidationCount > 0 ? `${pendingValidationCount} mission(s) à valider` : missionPaceMeta.label,
          },
          {
            id: "arrivals",
            label: operatingModeConfig.kpiLabels.arrivals,
            value: `${todayArrivals}`,
            detail: todayArrivals > 0 ? `${todayArrivals} arrivée(s) à coordonner` : "0 arrivée aujourd'hui",
            icon: <DoorOpen size={18} />,
            statusLabel: todayArrivals > 0 ? `${todayArrivals} arrivée(s) terrain` : "Arrivées calmes",
            statusTone: todayArrivals > 0 ? "info" : "default",
          },
          {
            id: "quotes",
            label: operatingModeConfig.kpiLabels.quotes,
            value: `${quotesToSend.length}`,
            detail: quotesToSend.length > 0 ? `${quotesToSend.length} devis à envoyer` : "Aucun devis à envoyer",
            icon: <FileText size={18} />,
            statusLabel: quotesToSend.length > 0 ? `${quotesToSend.length} devis à envoyer` : "Devis à jour",
            statusTone: quotesToSend.length > 0 ? "warning" : "success",
          },
        ]}
        leftPrimary={
          <div className={styles.primaryGrid}>
            <article className={styles.priorityHeroCard}>
              <div className={styles.priorityTop}>
                <DashboardStatusBadge
                  label={priorityRequest?.urgency ? operatingModeConfig.priorityLabel : todayArrivals > 0 ? operatingModeConfig.kpiLabels.arrivals : "Point d'attention"}
                  tone={priorityRequest?.urgency ? "danger" : todayArrivals > 0 ? "warning" : "info"}
                />
                <span className={styles.priorityIcon}>
                  <PriorityIcon size={22} />
                </span>
              </div>
              <div className={styles.priorityCopy}>
                <strong>{priorityRequest?.property_name || priorityRequest?.title || "Aucune urgence terrain detectee"}</strong>
                <p>
                  {priorityRequest
                    ? `${priorityRequest.title} · ${priorityRequest.city || "Ville a preciser"}`
                    : "Votre tableau de bord ne detecte pas de mission bloquante a cet instant."}
                </p>
              </div>
              <div className={styles.priorityMeta}>
                <span>
                  <Clock3 size={14} />
                  {priorityRequest?.desired_date ? `Check-in a ${formatTime(priorityRequest.desired_date)}` : "Horaire a confirmer"}
                </span>
                <span>
                  <UsersRound size={14} />
                  Voyageur ou proprietaire a coordonner
                </span>
              </div>
              <p className={styles.priorityNote}>
                {priorityRequest
                  ? `Action attendue : ${getRequestActionLabel(priorityRequest).toLowerCase()}.`
                  : "Surveiller les demandes, le planning et les urgences terrain."}
              </p>
              <div className={styles.actionRow}>
                <Link
                  href={priorityRequest ? getRequestHref(priorityRequest) : "/dashboard/concierge/planning"}
                  className={styles.primaryLink}
                >
                  {priorityRequest?.mission_id ? "Voir mission" : "Voir la demande"}
                </Link>
                <Link
                  href={priorityRequest ? getConversationHref(priorityRequest) : "/dashboard/concierge/messages"}
                  className={styles.secondaryLink}
                >
                  Contacter proprietaire
                </Link>
              </div>
            </article>

            <div className={styles.sideStack}>
              <section className={`${styles.contentBlock} ${styles.modeSelectorCard}`}>
                <div className={styles.blockHeader}>
                  <h3>Mode co-hote</h3>
                  <p>Statistiques, widgets et rapports s'adaptent au modele choisi.</p>
                </div>
                <ConciergeDashboardModeControls
                  experienceLevel={user?.experience_level}
                  onPreferencesChange={handleDashboardPreferencesChange}
                />
              </section>

              <section className={styles.contentBlock}>
                <div className={styles.blockHeader}>
                  <h3>Radar rapide</h3>
                  <p>{operatingModeConfig.dashboardLead}</p>
                </div>
                <UnifiedSpotlightList items={priorityItems} emptyLabel="Aucun point prioritaire." />
              </section>

              <section className={`${styles.contentBlock} ${styles.activityWeatherCard}`}>
                <div className={styles.weatherHeader}>
                  <span className={`${styles.weatherIcon} ${styles[activityWeather.tone]}`}>
                    <ActivityWeatherIcon size={22} />
                  </span>
                  <div>
                    <h3>Meteo d&apos;activite</h3>
                    <p>{activityWeather.detail}</p>
                  </div>
                </div>
                <div className={styles.weatherGauge} aria-label={`Pression operationnelle ${activityWeather.score}%`}>
                  <span style={{ width: `${activityWeather.score}%` }} />
                </div>
                <div className={styles.weatherStats}>
                  <span>{activityWeather.label}</span>
                  <strong>{activityWeather.score}%</strong>
                </div>
              </section>
              <section className={styles.contentBlock}>
                <div className={styles.blockHeader}>
                  <h3>Sante {operatingModeConfig.shortLabel.toLowerCase()}</h3>
                  <p>{operatingModeConfig.statDetails.missionDetail}</p>
                </div>
                <div className={styles.healthGrid}>
                  {healthCards.map((card) => (
                    <Link key={card.label} href={card.href} className={styles.healthCard}>
                      <div className={styles.healthTop}>
                        <span className={`${styles.healthDot} ${styles[card.tone]}`} />
                        <span className={styles.healthLabel}>{card.label}</span>
                      </div>
                      <strong className={styles.healthValue}>{card.value}</strong>
                      <p>{card.detail}</p>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>
        }
        leftSecondary={
          <section className={styles.contentBlock}>
            <div className={styles.blockHeader}>
              <h3>Mes logements</h3>
              <p>Le parc suivi sans ouvrir chaque fiche.</p>
            </div>
            <UnifiedPropertyPortfolio
              items={propertyItems}
              emptyHref="/dashboard/concierge/logements/create"
              emptyLabel="Ajoutez votre premier logement pour alimenter ce cockpit concierge."
            />
          </section>
        }
        mainSections={[
          {
            id: "operations",
            title: operatingModeConfig.planningLabel,
            subtitle: `${operatingModeConfig.planningLabel}, ${operatingModeConfig.demandLabel.toLowerCase()} et rythme terrain dans la meme lecture.`,
            content: (
              <div className={styles.dualGrid}>
                <article className={styles.panelCard}>
                  <div className={styles.panelHeader}>
                    <div>
                      <span className={styles.panelEyebrow}>{operatingModeConfig.planningLabel}</span>
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
                      <DashboardEmptyState
                        title="Aucun creneau aujourd'hui"
                        copy="Ouvrez le planning complet pour preparer la suite de la semaine."
                      />
                    )}
                  </div>
                </article>

                <article className={styles.panelCard}>
                  <div className={styles.panelHeader}>
                    <div>
                      <span className={styles.panelEyebrow}>{operatingModeConfig.demandLabel}</span>
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
                            <DashboardStatusBadge
                              label={request.urgency ? "Urgente" : isQuoteToSend(request) ? "Devis" : "À répondre"}
                              tone={request.urgency ? "danger" : isQuoteToSend(request) ? "success" : "info"}
                            />
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
                          <div className={styles.actionRow}>
                            <Link href={getRequestHref(request)} className={styles.primaryLink}>
                              Repondre
                            </Link>
                            <Link href={getRequestHref(request)} className={styles.secondaryLink}>
                              Proposer un devis
                            </Link>
                            <Link href={getConversationHref(request)} className={styles.ghostLink}>
                              Discuter
                            </Link>
                          </div>
                        </article>
                      ))}
                      {requests.length === 0 ? (
                        <DashboardEmptyState
                          title="Aucune demande active"
                          copy="Le cockpit ne remonte aucune demande proprietaire urgente pour le moment."
                        />
                      ) : null}
                    </div>
                  </AsyncState>
                </article>
              </div>
            ),
          },
          {
            id: "activity",
            title: "Activite recente",
            subtitle: "Messages, demandes et points qui viennent de bouger.",
            content: <UnifiedSpotlightList items={activityItems} emptyLabel="Aucune activite recente exploitable pour l'instant." />,
          },
          {
            id: "notifications",
            title: "Centre de notifications",
            subtitle: "Messages, validations et alertes commerciales dans une file actionnable.",
            content: (
              <UnifiedSpotlightList
                items={notificationItems}
                emptyLabel={operatingModeConfig.statDetails.notificationEmpty}
              />
            ),
          },
          {
            id: "missions",
            title: "Missions terrain",
            subtitle: "Le prochain travail operationnel visible sans quitter le cockpit.",
            content: (
              <div className={styles.missionFocusGrid}>
                {missionFocusItems.length > 0 ? (
                  missionFocusItems.map((mission) => (
                    <Link key={mission.id} href={mission.href} className={styles.missionFocusCard}>
                      <span className={styles.missionFocusTime}>{mission.timeLabel}</span>
                      <div>
                        <strong>{mission.title}</strong>
                        <p>{mission.dateLabel}</p>
                      </div>
                      <DashboardStatusBadge
                        label={mission.status}
                        tone={mission.status === "Urgente" ? "danger" : "info"}
                      />
                    </Link>
                  ))
                ) : (
                  <DashboardEmptyState
                    title="Aucune mission ouverte"
                    copy="Les prochaines missions apparaitront ici des qu'elles seront planifiees."
                  />
                )}
              </div>
            ),
          },
          {
            id: "revenues",
            title: operatingModeConfig.revenueLabel,
            subtitle: operatingModeConfig.statDetails.revenueDetail,
            content: (
              <div className={styles.financeGrid}>
                {revenueCards.map((card) => (
                  <article key={card.label} className={styles.financeCard}>
                    <span className={styles.financeLabel}>{card.label}</span>
                    <strong className={styles.financeValue}>{card.value}</strong>
                    <p>{card.detail}</p>
                  </article>
                ))}
              </div>
            ),
          },
          {
            id: "inspiration",
            title: "Bibliotheque d'inspiration",
            subtitle: "Vos videos YouTube et Shorts restent visibles au coeur du cockpit concierge.",
            content: <ConciergeInspirationPanel availabilityHours={user?.availability_hours} />,
          },
          {
            id: "reports",
            title: operatingModeConfig.reportTitle,
            subtitle: operatingModeConfig.reportSubtitle,
            content: (
              <div className={styles.reportGrid}>
                {reportCards.map((card) => (
                  <article key={card.label} className={styles.reportCard}>
                    <span className={styles.reportLabel}>{card.label}</span>
                    <strong>{card.value}</strong>
                    <p>{card.detail}</p>
                  </article>
                ))}
              </div>
            ),
          },          {
            id: "widgets",
            title: "Widgets personnalisables",
            subtitle: `${activeWidgetCount}/${widgetTotalCount} widgets actifs pour composer votre cockpit ${operatingModeConfig.shortLabel.toLowerCase()}.`,
            content: (
              <div className={styles.widgetGrid}>
                {widgetControls.map((widget) => {
                  const Icon = widget.icon;
                  const enabled = widgets[widget.id];
                  return (
                    <button
                      key={widget.id}
                      type="button"
                      className={styles.widgetToggle}
                      data-enabled={enabled ? "true" : "false"}
                      aria-pressed={enabled}
                      onClick={() => setWidgets((current) => ({ ...current, [widget.id]: !current[widget.id] }))}
                    >
                      <GripVertical size={16} aria-hidden="true" />
                      <Icon size={20} aria-hidden="true" />
                      <span>
                        <strong>{widget.label}</strong>
                        <small>{widget.detail}</small>
                      </span>
                    </button>
                  );
                })}
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
        ].filter((section) => {
          if (section.id === "operations") return widgets.operations;
          if (section.id === "notifications") return widgets.notifications;
          if (section.id === "missions") return widgets.missions;
          if (section.id === "revenues") return widgets.revenues;
          if (section.id === "inspiration") return widgets.inspiration;
          return true;
        })}
        sidebarSections={[
          {
            id: "finance",
            title: "Finance concierge",
            subtitle: "Projection, devis et paiements a recevoir",
            content: <UnifiedStatStack items={financeStats} />,
          },
          {
            id: "ops",
            title: "Controle terrain",
            subtitle: "Cadence operationnelle du jour",
            content: <UnifiedStatStack items={operationsStats} />,
          },
          {
            id: "alerts",
            title: "Urgences terrain",
            subtitle: "Ce qui peut degrader l'exploitation si vous tardez",
            content: (
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
            ),
          },
        ]}
      />
    </div>
  );
}
