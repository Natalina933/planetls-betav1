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
  nom?: string | null;
};

type CurrentProfile = {
  city?: string | null;
  service_area?: string | null;
  hourly_rate?: number | null;
  monthly_rate?: number | null;
  role?: string | null;
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
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      try {
        setLoading(true);
        setError(null);
        const [missionsResponse, conversationsResponse, housingResponse, profileResponse] = await Promise.all([
          fetch("/api/missions?scope=all&limit=80", { cache: "no-store" }),
          fetch("/api/messages/conversations?role=concierge&limit=80", { cache: "no-store" }),
          fetch("/api/housing", { cache: "no-store" }),
          fetch("/api/profiles/current", { cache: "no-store" }),
        ]);

        const missionsPayload = await missionsResponse.json();
        const conversationsPayload = await conversationsResponse.json();
        const housingPayload = await housingResponse.json();
        const profilePayload = await profileResponse.json();

        if (!missionsResponse.ok) throw new Error(missionsPayload?.error || "Impossible de charger les missions.");
        if (!conversationsResponse.ok) throw new Error(conversationsPayload?.error || "Impossible de charger les conversations.");
        if (!housingResponse.ok) throw new Error(housingPayload?.error || "Impossible de charger les logements.");
        if (!profileResponse.ok) throw new Error(profilePayload?.error || "Impossible de charger le profil.");

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

  const urgentMissionItems = useMemo(
    () =>
      urgentMissions.slice(0, 5).map((mission) => ({
        title: mission.title || "Mission urgente",
        meta: mission.status || "Statut non renseigné",
        description: "Intervention prioritaire à confirmer ou traiter rapidement.",
        href: "/dashboard/concierge/profile?tab=missions",
        actionLabel: "Traiter la mission",
        tone: "warning" as const,
      })),
    [urgentMissions],
  );

  const stalledConversationItems = useMemo(
    () =>
      stalledConversations.slice(0, 5).map((conversation) => ({
        title: conversation.counterpart_name || "Propriétaire",
        meta: conversation.last_message_at ? "Plus de 3 jours sans réponse" : "Aucune date récente",
        description: "Une relance rapide peut aider à garder la relation commerciale active.",
        href: `/dashboard/concierge/messages?conversation=${conversation.id}`,
        actionLabel: "Relancer",
        tone: "warning" as const,
      })),
    [stalledConversations],
  );

  const draftHousingItems = useMemo(
    () =>
      draftHousings.slice(0, 5).map((housing) => ({
        title: housing.nom || `Logement #${housing.id}`,
        meta: housing.statut || "brouillon",
        description: "Compléter les informations ou activer ce bien pour ne pas freiner l'acquisition.",
        href: `/dashboard/concierge/logements/${housing.id}`,
        actionLabel: "Finaliser la fiche",
      })),
    [draftHousings],
  );

  const profileSetupAlerts = useMemo(() => {
    const items = [];

    if (!profile?.city && !profile?.service_area) {
      items.push({
        title: "Zone d'intervention incomplète",
        meta: "Optimisation",
        description:
          "Sans zone claire, votre profil est moins rassurant et moins visible dans les parcours propriétaires.",
        href: "/dashboard/concierge/profile?tab=fiche",
        actionLabel: "Compléter ma fiche",
        tone: "warning" as const,
      });
    }

    if (
      typeof profile?.hourly_rate !== "number" &&
      typeof profile?.monthly_rate !== "number"
    ) {
      items.push({
        title: "Aucun repère tarifaire",
        meta: "Optimisation",
        description:
          "Définir au moins un tarif de base aide à convertir plus vite les propriétaires et clarifie votre offre.",
        href: "/dashboard/concierge/profile?tab=tarifs",
        actionLabel: "Configurer mes tarifs",
        tone: "warning" as const,
      });
    }

    if (profile?.role !== "concierge_pro") {
      items.push({
        title: "Badge PRO non actif",
        meta: "Levier premium",
        description:
          "Le statut PRO renforce la confiance et augmente votre valeur perçue dans les recherches propriétaires.",
        href: "/abonnement/concierge-pro",
        actionLabel: "Voir l'offre PRO",
      });
    }

    return items;
  }, [profile?.city, profile?.hourly_rate, profile?.monthly_rate, profile?.role, profile?.service_area]);

  return (
    <ConciergeWorkspacePage
      eyebrow="Vigilance"
      title="Alertes concierge"
      description={
        loading
          ? "Analyse des points de vigilance..."
          : error || "Centralisez les urgences terrain, les relances propriétaires et les logements à finaliser."
      }
      chips={[
        `${urgentMissions.length} urgence(s)`,
        `${stalledConversations.length} relance(s) à faire`,
        `${draftHousings.length} fiche(s) à fiabiliser`,
      ]}
      metrics={[
        {
          label: "Urgences",
          value: loading ? "..." : String(urgentMissions.length),
          hint: "Missions priorité urgente à absorber",
        },
        {
          label: "Relances",
          value: loading ? "..." : String(stalledConversations.length),
          hint: "Conversations qui refroidissent",
        },
        {
          label: "Brouillons",
          value: loading ? "..." : String(draftHousings.length),
          hint: "Biens ou profils à finaliser",
        },
        {
          label: "Sans badge PRO",
          value: loading ? "..." : profile?.role === "concierge_pro" ? "0" : "1",
          hint: "Levier de visibilité encore disponible",
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
              : "Aucune urgence mission détectée pour le moment.",
          actions: [
            {
              label: "Voir les missions",
              href: "/dashboard/concierge/profile?tab=missions",
              variant: "primary",
            },
          ],
        },
        {
          title: "Relances propriétaires",
          text:
            stalledConversations.length > 0
              ? `${stalledConversations.length} conversation(s) n'ont pas bougé depuis plus de 3 jours.`
              : "Aucune conversation en souffrance détectée.",
          actions: [
            {
              label: "Ouvrir la messagerie",
              href: "/dashboard/concierge/messages",
              variant: "secondary",
            },
          ],
        },
        {
          title: "Logements à finaliser",
          text:
            draftHousings.length > 0
              ? `${draftHousings.length} logement(s) restent en brouillon ou inactifs et peuvent freiner votre acquisition.`
              : "Tous vos logements sont actifs ou publiés.",
          actions: [
            {
              label: "Vérifier mes logements",
              href: "/dashboard/concierge/logements",
              variant: "secondary",
            },
          ],
        },
        {
          title: "Optimisation profil & offre",
          text:
            profileSetupAlerts.length > 0
              ? `${profileSetupAlerts.length} optimisation(s) peuvent renforcer votre conversion et votre visibilité.`
              : "Votre profil et votre offre sont déjà bien structurés.",
          actions: [
            {
              label: "Améliorer mon profil",
              href: "/dashboard/concierge/profile?tab=fiche",
              variant: "secondary",
            },
          ],
        },
      ]}
      detailSections={[
        {
          title: "Urgences à traiter",
          description:
            "Les missions prioritaires doivent rester visibles pour limiter les oublis et tenir le niveau de service.",
          emptyText:
            loading
              ? "Chargement des urgences."
              : error || "Aucune urgence terrain détectée.",
          items: urgentMissionItems,
        },
        {
          title: "A suivre - relances propriétaires",
          description:
            "Conversations à reprendre pour ne pas laisser refroidir une opportunité ou une demande active.",
          emptyText:
            loading
              ? "Analyse des conversations."
              : error || "Aucune relance urgente à faire.",
          items: stalledConversationItems,
        },
        {
          title: "A suivre - fiches logement à finaliser",
          description:
            "Biens encore inactifs ou incomplets qui méritent une vérification rapide avant mise en avant.",
          emptyText:
            loading
              ? "Vérification des logements en cours."
              : error || "Tous vos logements sont déjà actifs ou publiés.",
          items: draftHousingItems,
        },
        {
          title: "Optimisation",
          description:
            "Actions moins urgentes, mais très utiles pour renforcer votre conversion, votre visibilité et votre positionnement premium.",
          emptyText:
            loading
              ? "Analyse des optimisations."
              : error || "Aucune optimisation prioritaire détectée.",
          items: profileSetupAlerts,
        },
      ]}
    />
  );
}
