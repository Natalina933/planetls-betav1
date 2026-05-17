"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Clock3,
  Home,
  KeyRound,
  MessageSquareWarning,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { DashboardOperationalPage, type OperationalDetailSection } from "@/components/dashboard";
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

const withAction = <T extends { title: string; meta: string; description: string; actionLabel: string; href: string }>(
  items: T[],
): OperationalDetailSection["items"] =>
  items.map((item) => ({
    title: item.title,
    meta: item.meta,
    description: item.description,
    action: { label: item.actionLabel, href: item.href },
  }));

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
            fetch("/api/messages/conversations?role=concierge&limit=80", { cache: "no-store" }),
            fetch("/api/housing", { cache: "no-store" }),
            fetch("/api/profiles/current", { cache: "no-store" }),
          ]);

        const missionsPayload = await missionsResponse.json();
        const conversationsPayload = await conversationsResponse.json();
        const housingPayload = await housingResponse.json();
        const profilePayload = await profileResponse.json();

        if (!missionsResponse.ok) throw new Error(missionsPayload?.error || "Impossible de charger les missions.");
        if (!conversationsResponse.ok) {
          throw new Error(conversationsPayload?.error || "Impossible de charger les conversations.");
        }
        if (!housingResponse.ok) throw new Error(housingPayload?.error || "Impossible de charger les logements.");
        if (!profileResponse.ok) throw new Error(profilePayload?.error || "Impossible de charger le profil.");

        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
        setConversations(Array.isArray(conversationsPayload?.items) ? conversationsPayload.items : []);
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

  const urgentMissionItems = useMemo(() => buildUrgentMissionAlerts(urgentMissions), [urgentMissions]);
  const stalledConversationItems = useMemo(
    () => buildStalledConversationAlerts(stalledConversations),
    [stalledConversations],
  );
  const draftHousingItems = useMemo(() => buildDraftHousingAlerts(draftHousings), [draftHousings]);
  const profileSetupAlerts = useMemo(() => buildProfileSetupAlerts(profile), [profile]);

  const totalAttention =
    urgentMissionItems.length +
    stalledConversationItems.length +
    draftHousingItems.length +
    profileSetupAlerts.length;
  const mainPriority =
    urgentMissionItems[0] || stalledConversationItems[0] || draftHousingItems[0] || profileSetupAlerts[0] || null;

  const detailSections = useMemo(
    () => [
      {
        id: "urgences",
        title: "Urgences à traiter",
        description: "Les missions prioritaires restent visibles pour limiter les oublis et tenir le niveau de service.",
        emptyText: loading ? "Chargement des urgences." : error || "Aucune urgence terrain détectée.",
        items: withAction(urgentMissionItems),
      },
      {
        id: "relances",
        title: "Relances propriétaires",
        description: "Conversations à reprendre pour ne pas laisser refroidir une opportunité ou une demande active.",
        emptyText: loading ? "Analyse des conversations." : error || "Aucune relance urgente à faire.",
        items: withAction(stalledConversationItems),
      },
      {
        id: "fiches",
        title: "Fiches logement à finaliser",
        description: "Biens inactifs ou incomplets qui méritent une vérification rapide avant mise en avant.",
        emptyText: loading ? "Vérification des logements en cours." : error || "Tous vos logements sont déjà actifs.",
        items: withAction(draftHousingItems),
      },
      {
        id: "optimisation",
        title: "Optimisation commerciale",
        description: "Actions utiles pour renforcer votre conversion, votre visibilité et votre positionnement premium.",
        emptyText: loading ? "Analyse des optimisations." : error || "Aucune optimisation prioritaire détectée.",
        items: withAction(profileSetupAlerts),
      },
    ],
    [draftHousingItems, error, loading, profileSetupAlerts, stalledConversationItems, urgentMissionItems],
  );

  const metrics = [
    {
      label: "Priorité",
      value: loading ? "..." : String(totalAttention),
      hint: "Points à regarder avant de lancer la journée",
    },
    {
      label: "Relances",
      value: loading ? "..." : String(stalledConversations.length),
      hint: "Conversations qui refroidissent",
      detailSectionId: "relances",
    },
    {
      label: "Fiches",
      value: loading ? "..." : String(draftHousings.length),
      hint: "Biens à fiabiliser",
      detailSectionId: "fiches",
    },
    {
      label: "Offre",
      value: loading ? "..." : profile?.role === "concierge_pro" ? "Actif" : "À renforcer",
      hint: "Visibilité et conversion",
      detailSectionId: "optimisation",
    },
  ];

  return (
    <DashboardOperationalPage
      tone="concierge"
      badge="Vue opérationnelle"
      title="Centre de vigilance"
      description={
        loading
          ? "Analyse des points de vigilance..."
          : error || "Priorisez les urgences terrain, les relances propriétaires et les fiches à fiabiliser."
      }
      primaryActions={[
        { label: "Ouvrir la messagerie", href: "/dashboard/concierge/messages" },
        { label: "Ouvrir le planning", href: "/dashboard/concierge/planning" },
      ]}
      metrics={metrics}
      focus={{
        title: "Lecture du matin",
        status: totalAttention > 0 ? "À arbitrer" : "Stable",
        statusVariant: totalAttention > 0 ? "gold" : "success",
        icon: <TriangleAlert size={28} />,
        heading: mainPriority ? mainPriority.title : "Aucun point bloquant",
        description: mainPriority
          ? mainPriority.description
          : "Votre espace ne remonte pas de vigilance critique pour le moment.",
        action: mainPriority ? { label: mainPriority.actionLabel, href: mainPriority.href } : undefined,
      }}
      risks={[
        {
          label: "Terrain",
          value: loading ? "..." : urgentMissionItems.length,
          hint: "Urgences et missions sensibles",
          icon: ShieldCheck,
          tone: "danger",
          detailSectionId: "urgences",
        },
        {
          label: "Relation",
          value: loading ? "..." : stalledConversationItems.length,
          hint: "Relances propriétaires",
          icon: MessageSquareWarning,
          tone: "warning",
          detailSectionId: "relances",
        },
        {
          label: "Catalogue",
          value: loading ? "..." : draftHousingItems.length,
          hint: "Logements incomplets",
          icon: Building2,
          tone: "info",
          detailSectionId: "fiches",
        },
        {
          label: "Conversion",
          value: loading ? "..." : profileSetupAlerts.length,
          hint: "Profil, tarifs, statut PRO",
          icon: Sparkles,
          tone: "success",
          detailSectionId: "optimisation",
        },
      ]}
      cadenceTitle="Cadence conseillée"
      cadence={[
        {
          label: "Maintenant",
          icon: Clock3,
          text: "Traiter les urgences terrain et les demandes qui bloquent une mission.",
        },
        {
          label: "Aujourd'hui",
          icon: MessageSquareWarning,
          text: "Relancer les propriétaires silencieux avant que l'opportunité refroidisse.",
        },
        {
          label: "Cette semaine",
          icon: Building2,
          text: "Finaliser les fiches et les repères d'offre qui soutiennent la conversion.",
        },
      ]}
      detailsBadge="Dossiers à suivre"
      detailsTitle="Actions disponibles"
      detailsDescription="Chaque ligne renvoie directement vers l'espace où traiter le point d'attention."
      detailSections={detailSections}
      illustration={{
        mainIcon: Home,
        topRightIcon: KeyRound,
        topLeftIcon: MessageSquareWarning,
      }}
    />
  );
}
