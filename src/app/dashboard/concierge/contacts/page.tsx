"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";

type ConciergeOwnerItem = {
  id: string;
  owner_profile_id: string | null;
  client_name: string;
  company_name: string | null;
  city: string | null;
  status: string | null;
  stage: "client_active" | "client" | "prospect" | "inactive";
  source: "client" | "conversation";
  missions_total: number;
  missions_active: number;
  missions_completed: number;
  latest_mission_id: string | null;
  latest_mission_title: string | null;
  latest_mission_status: string | null;
  conversation_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_conversation_count: number;
  unread_notifications: number;
  notes: string | null;
};

type ConciergeOwnersPayload = {
  summary?: {
    total_clients?: number;
    active_clients?: number;
    attached_owners?: number;
    prospects?: number;
    active_missions?: number;
    unread_notifications?: number;
  };
  items?: ConciergeOwnerItem[];
  note?: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Aucun message recent";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStageLabel(stage: ConciergeOwnerItem["stage"]) {
  if (stage === "client_active") return "Client actif";
  if (stage === "client") return "Client";
  if (stage === "inactive") return "Inactif";
  return "Prospect";
}

function getStageTone(stage: ConciergeOwnerItem["stage"]) {
  if (stage === "client_active") return "success" as const;
  if (stage === "prospect") return "warning" as const;
  return "default" as const;
}

function buildMissionHref(item: ConciergeOwnerItem) {
  if (item.latest_mission_id) {
    return "/dashboard/concierge/missions/overview";
  }
  return "/dashboard/concierge/missions/overview";
}

function buildBillingHref(item: ConciergeOwnerItem) {
  const params = new URLSearchParams({ tab: "devis" });

  if (item.owner_profile_id) {
    params.set("ownerProfileId", item.owner_profile_id);
  }
  if (item.client_name) {
    params.set("ownerLabel", item.client_name);
  }
  if (item.conversation_id) {
    params.set("conversationId", item.conversation_id);
  }
  if (item.latest_mission_id) {
    params.set("missionId", item.latest_mission_id);
  }

  return `/dashboard/concierge/profile?${params.toString()}`;
}

export default function ConciergeContactsPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<ConciergeOwnersPayload>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const loadOwners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/concierge/owners", { cache: "no-store" });
      const nextPayload = (await response.json()) as ConciergeOwnersPayload;

      if (!response.ok) {
        throw new Error(nextPayload?.note || "Impossible de charger vos proprietaires.");
      }

      setPayload(nextPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger vos proprietaires.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOwners();
  }, [loadOwners]);

  const items = useMemo(() => (Array.isArray(payload.items) ? payload.items : []), [payload.items]);
  const summary = payload.summary ?? {};
  const activeClients = useMemo(
    () => items.filter((item) => item.stage === "client_active" || item.stage === "client"),
    [items],
  );
  const prospects = useMemo(() => items.filter((item) => item.stage === "prospect"), [items]);
  const inactive = useMemo(() => items.filter((item) => item.stage === "inactive"), [items]);

  const mutateRelation = useCallback(
    async (item: ConciergeOwnerItem, action: "archive" | "activate") => {
      try {
        setActionBusyId(item.id);
        setActionFeedback(null);

        const response = await fetch(`/api/concierge/owners/${encodeURIComponent(item.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result?.error || "Impossible de mettre a jour la relation.");
        }

        setActionFeedback(
          action === "archive"
            ? `${item.client_name} a ete archive.`
            : `${item.client_name} a ete reactive.`,
        );
        await loadOwners();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de mettre a jour la relation.");
      } finally {
        setActionBusyId(null);
      }
    },
    [loadOwners],
  );

  const createMissionForOwner = useCallback(
    async (item: ConciergeOwnerItem) => {
      if (!item.owner_profile_id) return;

      try {
        setActionBusyId(`mission-${item.id}`);
        setActionFeedback(null);

        const response = await fetch("/api/missions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner_profile_id: item.owner_profile_id,
            title: `Mission - ${item.client_name}`,
            description:
              item.notes ||
              item.last_message_preview ||
              `Mission creee depuis le mini CRM concierge pour ${item.client_name}.`,
            status: "draft",
            priority: item.stage === "prospect" ? "normal" : "high",
          }),
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result?.error || "Impossible de creer la mission.");
        }

        setActionFeedback(`Mission creee pour ${item.client_name}.`);
        await loadOwners();
        router.push("/dashboard/concierge/missions/overview");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de creer la mission.");
      } finally {
        setActionBusyId(null);
      }
    },
    [loadOwners, router],
  );

  return (
    <ConciergeWorkspacePage
      eyebrow="Relation proprietaires"
      title="Relations actives"
      description={
        loading
          ? "Chargement de vos proprietaires et de vos clients rattaches..."
          : error ||
            actionFeedback ||
            payload.note ||
            "Retrouvez ici les proprietaires rattaches automatiquement apres acceptation d'un devis, ainsi que vos prospects encore en conversation."
      }
      chips={[
        `${summary.total_clients ?? items.length} relation(s)`,
        `${summary.active_clients ?? activeClients.length} client(s) actif(s)`,
        `${summary.prospects ?? prospects.length} prospect(s)`,
      ]}
      actions={[
        { label: "Ouvrir la messagerie", href: "/dashboard/concierge/messages" },
        { label: "Voir les missions", href: "/dashboard/concierge/missions/overview" },
        { label: "Trouver de nouveaux proprietaires", href: "/dashboard/concierge/recherche" },
      ]}
      metrics={[
        {
          label: "Relations totales",
          value: loading ? "..." : String(summary.total_clients ?? items.length),
          hint: "Clients rattaches et prospects confondus",
        },
        {
          label: "Clients actifs",
          value: loading ? "..." : String(summary.active_clients ?? activeClients.length),
          hint: "Au moins une mission ou un dossier en cours",
        },
        {
          label: "Prospects",
          value: loading ? "..." : String(summary.prospects ?? prospects.length),
          hint: "Conversation ouverte sans mission convertie",
        },
        {
          label: "Notifications",
          value: loading ? "..." : String(summary.unread_notifications ?? 0),
          hint: "Alertes persistées encore non lues",
        },
      ]}
      cards={
        activeClients.slice(0, 4).length > 0
          ? activeClients.slice(0, 4).map((item) => ({
              title: item.client_name,
              text: `${getStageLabel(item.stage)}${item.city ? ` - ${item.city}` : ""}. ${item.missions_active} mission(s) active(s), ${item.missions_total} mission(s) au total.`,
              actions: item.conversation_id
                ? [
                    {
                      label: "Ouvrir la conversation",
                      href: `/dashboard/concierge/messages?conversation=${item.conversation_id}`,
                      variant: "primary" as const,
                    },
                    {
                      label: item.latest_mission_id ? "Voir la mission" : "Voir les devis",
                      href: item.latest_mission_id ? buildMissionHref(item) : buildBillingHref(item),
                      variant: "secondary" as const,
                    },
                  ]
                : [
                    {
                      label: "Voir les missions",
                      href: "/dashboard/concierge/missions/overview",
                      variant: "primary" as const,
                    },
                    {
                      label: "Voir les devis",
                      href: buildBillingHref(item),
                      variant: "secondary" as const,
                    },
                  ],
              notificationCount: item.unread_notifications || undefined,
            }))
          : [
              {
                title: "Aucun proprietaire rattache",
                text: loading
                  ? "La consolidation est en cours."
                  : error || payload.note || "Les devis acceptes et les conversations proprietaires alimenteront cette vue automatiquement.",
                actions: [
                  {
                    label: "Trouver des proprietaires",
                    href: "/dashboard/concierge/recherche",
                    variant: "primary" as const,
                  },
                ],
              },
            ]
      }
      detailSections={[
        {
          title: "Clients operationnels",
          description: "Proprietaires deja convertis en relation de travail ou rattaches a des missions.",
          emptyText: loading ? "Chargement des clients..." : "Aucun client operationnel pour le moment.",
          items: activeClients.map((item) => ({
            id: item.id,
            title: item.client_name,
            meta: getStageLabel(item.stage),
            tone: getStageTone(item.stage),
            description:
              item.last_message_preview ||
              item.notes ||
              "Relation creee automatiquement a partir d'un devis accepte.",
            facts: [
              item.city || "Ville non renseignee",
              `${item.missions_active} mission(s) active(s)`,
              `${item.missions_completed} mission(s) terminee(s)`,
              item.latest_mission_title
                ? `Derniere mission: ${item.latest_mission_title} (${item.latest_mission_status || "-"})`
                : "Aucune mission recente",
              `Dernier echange: ${formatDate(item.last_message_at)}`,
            ],
            href: item.conversation_id
              ? `/dashboard/concierge/messages?conversation=${item.conversation_id}`
              : "/dashboard/concierge/missions/overview",
            actionLabel: item.conversation_id ? "Voir les messages" : "Voir les missions",
            secondaryActionLabel: item.latest_mission_id ? "Voir la mission" : "Ouvrir les devis",
            secondaryActionHref: item.latest_mission_id ? buildMissionHref(item) : buildBillingHref(item),
            extraActions: [
              {
                label:
                  actionBusyId === `mission-${item.id}` ? "Creation mission..." : "Creer une mission",
                onClick: () => void createMissionForOwner(item),
              },
              {
                label: actionBusyId === item.id ? "Archivage..." : "Archiver",
                onClick: () => void mutateRelation(item, "archive"),
              },
            ],
            notificationCount: item.unread_notifications || undefined,
          })),
        },
        {
          title: "Prospects a convertir",
          description: "Conversations ouvertes qui meritent une relance ou un devis pour devenir des clients.",
          emptyText: loading ? "Chargement des prospects..." : "Aucun prospect en attente.",
          items: prospects.map((item) => ({
            id: item.id,
            title: item.client_name,
            meta: getStageLabel(item.stage),
            tone: getStageTone(item.stage),
            description:
              item.last_message_preview ||
              item.notes ||
              "Conversation ouverte sans conversion en mission pour le moment.",
            facts: [
              item.city || "Ville non renseignee",
              `Dernier echange: ${formatDate(item.last_message_at)}`,
              `${item.missions_total} mission(s) historique(s)`,
            ],
            href: item.conversation_id
              ? `/dashboard/concierge/messages?conversation=${item.conversation_id}`
              : "/dashboard/concierge/recherche",
            actionLabel: item.conversation_id ? "Relancer" : "Voir le pipeline",
            secondaryActionLabel: "Ouvrir les devis",
            secondaryActionHref: buildBillingHref(item),
            extraActions: [
              {
                label:
                  actionBusyId === `mission-${item.id}` ? "Creation mission..." : "Creer une mission",
                onClick: () => void createMissionForOwner(item),
              },
              {
                label: actionBusyId === item.id ? "Archivage..." : "Archiver",
                onClick: () => void mutateRelation(item, "archive"),
              },
            ],
            notificationCount: item.unread_notifications || undefined,
          })),
        },
        {
          title: "Relations a reveiller",
          description: "Clients archives ou inactifs a recontacter quand la charge le permet.",
          emptyText: loading ? "Chargement des relations inactives..." : "Aucune relation inactive.",
          items: inactive.map((item) => ({
            id: item.id,
            title: item.client_name,
            meta: getStageLabel(item.stage),
            description: item.notes || item.last_message_preview || "Relation actuellement en pause.",
            facts: [
              item.city || "Ville non renseignee",
              `${item.missions_total} mission(s) historique(s)`,
              `Dernier echange: ${formatDate(item.last_message_at)}`,
            ],
            href: item.conversation_id
              ? `/dashboard/concierge/messages?conversation=${item.conversation_id}`
              : "/dashboard/concierge/recherche",
            actionLabel: item.conversation_id ? "Reprendre le contact" : "Chercher un nouveau besoin",
            secondaryActionLabel: "Voir les devis",
            secondaryActionHref: buildBillingHref(item),
            extraActions: [
              {
                label: actionBusyId === item.id ? "Reactivation..." : "Reactiver",
                onClick: () => void mutateRelation(item, "activate"),
              },
              ...(item.owner_profile_id
                ? [
                    {
                      label:
                        actionBusyId === `mission-${item.id}`
                          ? "Creation mission..."
                          : "Creer une mission",
                      onClick: () => void createMissionForOwner(item),
                    },
                  ]
                : []),
            ],
          })),
        },
      ]}
    />
  );
}
