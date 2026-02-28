"use client";

import React, { useEffect, useMemo, useState } from "react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

type OwnerMissionRow = {
  id: string;
  title: string | null;
  status: string | null;
  priority: string | null;
};

type OwnerConversationRow = {
  id: string;
  counterpart_name: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
};

export default function OwnerConciergeriePage() {
  const [missions, setMissions] = useState<OwnerMissionRow[]>([]);
  const [conversations, setConversations] = useState<OwnerConversationRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setError(null);

        const [missionsRes, conversationsRes] = await Promise.all([
          fetch("/api/missions?scope=owner&limit=8", { cache: "no-store" }),
          fetch("/api/messages/conversations?role=owner&limit=8", { cache: "no-store" }),
        ]);

        const missionsPayload = await missionsRes.json();
        const conversationsPayload = await conversationsRes.json();

        if (!missionsRes.ok) {
          throw new Error(missionsPayload?.error || "Impossible de charger les missions.");
        }
        if (!conversationsRes.ok) {
          throw new Error(
            conversationsPayload?.error || "Impossible de charger les conversations.",
          );
        }

        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
        setConversations(Array.isArray(conversationsPayload) ? conversationsPayload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger la conciergerie.");
      }
    }

    loadData();
  }, []);

  const ongoingCount = useMemo(
    () => missions.filter((mission) => mission.status === "accepted" || mission.status === "in_progress").length,
    [missions],
  );

  return (
    <OwnerWorkspacePage
      eyebrow="Relation concierge"
      title="Ma conciergerie"
      description={
        error
          ? error
          : "Retrouvez vos echanges recents et le niveau d'activite actuellement gere par votre concierge."
      }
      chips={[
        `${missions.length} mission(s)`,
        `${ongoingCount} en cours`,
        `${conversations.length} conversation(s)`,
      ]}
      actions={[
        { label: "Voir mes messages", href: "/dashboard/owner/messages" },
        { label: "Voir mon planning", href: "/dashboard/owner/planning" },
      ]}
      cards={[
        {
          title: "Missions recentes",
          text:
            missions.length > 0
              ? missions
                  .slice(0, 3)
                  .map((mission) => `${mission.title || "Mission"} (${mission.status || "-"})`)
                  .join(" • ")
              : "Aucune mission chargee pour le moment.",
        },
        {
          title: "Contacts actifs",
          text:
            conversations.length > 0
              ? conversations
                  .slice(0, 3)
                  .map((conversation) => conversation.counterpart_name || "Contact")
                  .join(" • ")
              : "Aucun contact actif pour le moment.",
        },
        {
          title: "Pilotage",
          text:
            ongoingCount > 0
              ? `${ongoingCount} intervention(s) demandent actuellement un suivi proprietaire.`
              : "Aucune intervention en cours a suivre actuellement.",
        },
      ]}
    />
  );
}
