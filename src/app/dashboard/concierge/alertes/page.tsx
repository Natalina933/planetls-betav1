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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      try {
        setLoading(true);
        setError(null);
        const [missionsResponse, conversationsResponse, housingResponse, profileResponse] =
          await Promise.all([
            fetch("/api/missions?scope=all&limit=80", { cache: "no-store" }),
            fetch("/api/messages/conversations?role=concierge&limit=80", {
              cache: "no-store",
            }),
            fetch("/api/housing", { cache: "no-store" }),
            fetch("/api/profiles/current", { cache: "no-store" }),
          ]);

        const missionsPayload = await missionsResponse.json();
        const conversationsPayload = await conversationsResponse.json();
        const housingPayload = await housingResponse.json();
        const profilePayload = await profileResponse.json();

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

        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
        setConversations(Array.isArray(conversationsPayload) ? conversationsPayload : []);
        setHousings(Array.isArray(housingPayload) ? housingPayload : []);
        setProfile(profilePayload);
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
            "Centralisez les urgences terrain, les relances proprietaires et les fiches a fiabiliser."
      }
      chips={[
        `${urgentMissions.length} urgence(s)`,
        `${stalledConversations.length} relance(s) a faire`,
        `${draftHousings.length} fiche(s) a fiabiliser`,
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
          label: "Levier PRO",
          value: loading ? "..." : profile?.role === "concierge_pro" ? "Actif" : "Disponible",
          hint: "Visibilite et conversion a renforcer",
        },
      ]}
      actions={[
        { label: "Ouvrir la messagerie", href: "/dashboard/concierge/messages" },
        { label: "Ouvrir le planning", href: "/dashboard/concierge/planning" },
      ]}
      cards={[
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
        {
          title: "4. Optimisation profil et offre",
          text:
            profileSetupAlerts.length > 0
              ? `${profileSetupAlerts.length} optimisation(s) peuvent renforcer votre conversion et votre visibilite.`
              : "Votre profil et votre offre sont deja bien structures.",
          actions: [
            {
              label: "Ameliorer mon profil",
              href: "/dashboard/concierge/profile?tab=fiche",
              variant: "secondary",
            },
          ],
        },
      ]}
      detailSections={[
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
            "Actions moins urgentes, mais tres utiles pour renforcer votre conversion, votre visibilite et votre positionnement premium.",
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
