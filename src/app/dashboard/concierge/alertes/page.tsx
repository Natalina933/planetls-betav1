"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import {
  buildDraftHousingAlerts,
  buildProfileSetupAlerts,
  buildStalledConversationAlerts,
  buildUrgentMissionAlerts,
  olderThanThreeDays,
} from "./alertesHelpers";
import {
  formatWorkflowNotificationDate,
  getWorkflowNotificationHref,
  getWorkflowNotificationMeta,
  getWorkflowNotificationTone,
  type WorkflowNotificationItem,
} from "@/app/dashboard/notifications/workflowNotificationPresentation";

type MissionRow = {
  id: string;
  title: string | null;
  priority: string | null;
  status: string | null;
};

type ConversationRow = {
  id: string;
  counterpart_name: string | null;
  last_message_at: string | null;
  unread_count?: number;
};

type HousingRow = {
  id: number;
  statut: string | null;
  nom?: string | null;
};

type CurrentProfile = {
  city?: string | null;
  service_area?: string | null;
  hourly_rate?: number | null;
  monthly_rate?: number | null;
  role?: string | null;
};

export default function ConciergeAlertesPage() {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [housings, setHousings] = useState<HousingRow[]>([]);
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [notifications, setNotifications] = useState<WorkflowNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkAllNotificationsRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((current) =>
      current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })),
    );
  }

  useEffect(() => {
    async function loadAlerts() {
      try {
        setLoading(true);
        setError(null);
        const [
          missionsResponse,
          conversationsResponse,
          housingResponse,
          profileResponse,
          notificationsResponse,
        ] = await Promise.all([
          fetch("/api/missions?scope=all&limit=80", { cache: "no-store" }),
          fetch("/api/messages/conversations?role=concierge&limit=80", {
            cache: "no-store",
          }),
          fetch("/api/housing", { cache: "no-store" }),
          fetch("/api/profiles/current", { cache: "no-store" }),
          fetch("/api/notifications?limit=30", { cache: "no-store" }),
        ]);

        const missionsPayload = await missionsResponse.json();
        const conversationsPayload = await conversationsResponse.json();
        const housingPayload = await housingResponse.json();
        const profilePayload = await profileResponse.json();
        const notificationsPayload = await notificationsResponse.json();

        if (!missionsResponse.ok) {
          throw new Error(missionsPayload?.error || "Impossible de charger les missions.");
        }
        if (!conversationsResponse.ok) {
          throw new Error(
            conversationsPayload?.error || "Impossible de charger les conversations.",
          );
        }
        if (!housingResponse.ok) {
          throw new Error(housingPayload?.error || "Impossible de charger les logements.");
        }
        if (!profileResponse.ok) {
          throw new Error(profilePayload?.error || "Impossible de charger le profil.");
        }
        if (!notificationsResponse.ok) {
          throw new Error(
            notificationsPayload?.error || "Impossible de charger les notifications.",
          );
        }

        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
        setConversations(Array.isArray(conversationsPayload?.items) ? conversationsPayload.items : []);
        setHousings(Array.isArray(housingPayload) ? housingPayload : []);
        setProfile(profilePayload);
        setNotifications(Array.isArray(notificationsPayload?.items) ? notificationsPayload.items : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger les alertes.");
      } finally {
        setLoading(false);
      }
    }

    void loadAlerts();
  }, []);

  const urgentMissions = useMemo(
    () => missions.filter((mission) => mission.priority === "urgent"),
    [missions],
  );
  const stalledConversations = useMemo(
    () => conversations.filter((conversation) => olderThanThreeDays(conversation.last_message_at)),
    [conversations],
  );
  const draftHousings = useMemo(
    () => housings.filter((housing) => housing.statut !== "active" && housing.statut !== "published"),
    [housings],
  );
  const unreadWorkflowNotifications = useMemo(
    () => notifications.filter((item) => !item.read_at),
    [notifications],
  );

  const urgentMissionItems = useMemo(
    () => buildUrgentMissionAlerts(urgentMissions),
    [urgentMissions],
  );
  const stalledConversationItems = useMemo(
    () => buildStalledConversationAlerts(stalledConversations),
    [stalledConversations],
  );
  const draftHousingItems = useMemo(
    () => buildDraftHousingAlerts(draftHousings),
    [draftHousings],
  );
  const profileSetupAlerts = useMemo(() => buildProfileSetupAlerts(profile), [profile]);

  return (
    <ConciergeWorkspacePage
      eyebrow="Points d'attention"
      title="Points d'attention"
      description={
        loading
          ? "Analyse des points de vigilance..."
          : error ||
            "Centralisez les urgences terrain, les relances proprietaires, les notifications persistantes et les fiches a fiabiliser."
      }
      chips={[
        `${urgentMissions.length} urgence(s)`,
        `${stalledConversations.length} relance(s) a faire`,
        `${draftHousings.length} fiche(s) a fiabiliser`,
        `${unreadWorkflowNotifications.length} notification(s) persistante(s)`,
      ]}
      metrics={[
        {
          label: "Urgences",
          value: loading ? "..." : String(urgentMissions.length),
          hint: "Missions a priorite urgente a absorber",
        },
        {
          label: "Relances",
          value: loading ? "..." : String(stalledConversations.length),
          hint: "Conversations qui refroidissent",
        },
        {
          label: "Brouillons",
          value: loading ? "..." : String(draftHousings.length),
          hint: "Biens ou profils a finaliser",
        },
        {
          label: "Notifications",
          value: loading ? "..." : String(unreadWorkflowNotifications.length),
          hint: "Evenements produit persistants",
        },
      ]}
      actions={[
        { label: "Ouvrir la messagerie", href: "/dashboard/concierge/messages" },
        { label: "Ouvrir le planning", href: "/dashboard/concierge/planning" },
      ]}
      cards={[
        {
          title: "Notifications persistantes",
          text:
            unreadWorkflowNotifications.length > 0
              ? unreadWorkflowNotifications
                  .slice(0, 3)
                  .map(
                    (item) =>
                      `${item.title || "Notification"} - ${formatWorkflowNotificationDate(item.created_at)}`,
                  )
                  .join(" | ")
              : "Aucune notification persistante non lue pour le moment.",
          notificationCount: unreadWorkflowNotifications.length,
        },
        {
          title: "1. Urgences terrain",
          text:
            urgentMissions.length > 0
              ? `${urgentMissions.length} mission(s) urgente(s) demandent une action rapide.`
              : "Aucune urgence mission detectee pour le moment.",
          actions: [
            {
              label: "Voir les missions",
              href: "/dashboard/concierge/profile?tab=missions",
              variant: "primary",
            },
          ],
        },
        {
          title: "2. Relances proprietaires",
          text:
            stalledConversations.length > 0
              ? `${stalledConversations.length} conversation(s) n'ont pas bouge depuis plus de 3 jours.`
              : "Aucune conversation en souffrance detectee.",
          actions: [
            {
              label: "Ouvrir la messagerie",
              href: "/dashboard/concierge/messages",
              variant: "secondary",
            },
          ],
        },
        {
          title: "3. Logements a finaliser",
          text:
            draftHousings.length > 0
              ? `${draftHousings.length} logement(s) restent en brouillon ou inactifs.`
              : "Tous vos logements sont actifs ou publies.",
        },
      ]}
      detailSections={[
        {
          title: "Notifications produit",
          description:
            "Historique persistant des evenements importants: devis acceptes, missions creees et changements de statut.",
          emptyText: "Aucune notification persistante pour le moment.",
          items: notifications.map((item) => ({
            id: item.id,
            title: item.title || "Notification",
            meta: `${getWorkflowNotificationMeta(item)} - ${formatWorkflowNotificationDate(item.created_at)}`,
            description: item.body || "Aucun detail supplementaire.",
            href: getWorkflowNotificationHref(item, "/dashboard/concierge/alertes"),
            actionLabel: "Ouvrir",
            secondaryActionLabel:
              unreadWorkflowNotifications.length > 0 ? "Tout marquer comme lu" : undefined,
            onSecondaryAction:
              unreadWorkflowNotifications.length > 0
                ? () => {
                    void handleMarkAllNotificationsRead();
                  }
                : undefined,
            tone: getWorkflowNotificationTone(item.notification_type, item.entity_type),
            notificationCount: item.read_at ? undefined : 1,
          })),
        },
        {
          title: "Urgences a traiter",
          description:
            "Les missions prioritaires doivent rester visibles pour limiter les oublis et tenir le niveau de service.",
          emptyText:
            loading
              ? "Chargement des urgences."
              : error || "Aucune urgence terrain detectee.",
          items: urgentMissionItems,
        },
        {
          title: "A suivre - relances proprietaires",
          description:
            "Conversations a reprendre pour ne pas laisser refroidir une opportunite ou une demande active.",
          emptyText:
            loading
              ? "Analyse des conversations."
              : error || "Aucune relance urgente a faire.",
          items: stalledConversationItems,
        },
        {
          title: "A suivre - fiches logement a finaliser",
          description:
            "Biens encore inactifs ou incomplets qui meritent une verification rapide avant mise en avant.",
          emptyText:
            loading
              ? "Verification des logements en cours."
              : error || "Tous vos logements sont deja actifs ou publies.",
          items: draftHousingItems,
        },
        {
          title: "Optimisation",
          description:
            "Actions moins urgentes, mais utiles pour renforcer votre conversion, votre visibilite et votre positionnement premium.",
          emptyText:
            loading
              ? "Analyse des optimisations."
              : error || "Aucune optimisation prioritaire detectee.",
          items: profileSetupAlerts,
        },
      ]}
    />
  );
}
