"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";

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
};

type HousingRow = {
  id: number;
  statut: string | null;
};

function olderThanThreeDays(value: string | null) {
  if (!value) return true;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() - time > 3 * 24 * 60 * 60 * 1000;
}

export default function ConciergeAlertesPage() {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [housings, setHousings] = useState<HousingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      try {
        setLoading(true);
        setError(null);
        const [missionsResponse, conversationsResponse, housingResponse] = await Promise.all([
          fetch("/api/missions?scope=all&limit=80", { cache: "no-store" }),
          fetch("/api/messages/conversations?role=concierge&limit=80", { cache: "no-store" }),
          fetch("/api/housing", { cache: "no-store" }),
        ]);

        const missionsPayload = await missionsResponse.json();
        const conversationsPayload = await conversationsResponse.json();
        const housingPayload = await housingResponse.json();

        if (!missionsResponse.ok) {
          throw new Error(missionsPayload?.error || "Impossible de charger les missions.");
        }
        if (!conversationsResponse.ok) {
          throw new Error(conversationsPayload?.error || "Impossible de charger les conversations.");
        }
        if (!housingResponse.ok) {
          throw new Error(housingPayload?.error || "Impossible de charger les logements.");
        }

        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
        setConversations(Array.isArray(conversationsPayload) ? conversationsPayload : []);
        setHousings(Array.isArray(housingPayload) ? housingPayload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger les alertes.");
      } finally {
        setLoading(false);
      }
    }

    loadAlerts();
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

  return (
    <ConciergeWorkspacePage
      eyebrow="Vigilance"
      title="Alertes concierge"
      description={
        loading
          ? "Analyse des points de vigilance..."
          : error || "Centralisez les urgences terrain, les relances proprietaires et les logements a finaliser."
      }
      chips={[`${urgentMissions.length} urgence(s)`, `${stalledConversations.length} relance(s) a faire`]}
      metrics={[
        {
          label: "Urgences",
          value: loading ? "..." : String(urgentMissions.length),
        },
        {
          label: "Relances",
          value: loading ? "..." : String(stalledConversations.length),
        },
        {
          label: "Brouillons",
          value: loading ? "..." : String(draftHousings.length),
        },
      ]}
      actions={[
        { label: "Messagerie", href: "/dashboard/concierge/messages" },
        { label: "Planning", href: "/dashboard/concierge/planning" },
      ]}
      cards={[
        {
          title: "Urgences terrain",
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
          title: "Relances proprietaires",
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
          title: "Logements a finaliser",
          text:
            draftHousings.length > 0
              ? `${draftHousings.length} logement(s) restent en brouillon ou inactifs et peuvent freiner votre acquisition.`
              : "Tous vos logements sont actifs ou publies.",
          actions: [
            {
              label: "Verifier mes logements",
              href: "/dashboard/concierge/logements",
              variant: "secondary",
            },
          ],
        },
      ]}
    />
  );
}
