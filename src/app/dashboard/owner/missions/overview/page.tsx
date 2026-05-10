"use client";

import SimpleOverviewWorkspace from "@/app/dashboard/_components/SimpleOverviewWorkspace";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { buildOwnerMissionsCompletion } from "@/app/dashboard/shared";
import { formatDateValue, formatEuroAmountLabel } from "@/app/utils/formatters";
import { useOwnerDashboardData } from "../../useOwnerDashboardData";

function getMissionStatusLabel(status: string | null) {
  switch (status) {
    case "pending":
      return "Nouvelle";
    case "assigned":
      return "Assignée";
    case "accepted":
      return "Acceptée";
    case "planned":
      return "Planifiée";
    case "in_progress":
      return "En cours";
    case "provider_intervention":
      return "Intervention artisan";
    case "completed":
      return "Terminée";
    case "validated":
      return "Validée";
    case "canceled":
      return "Annulée";
    default:
      return "A qualifier";
  }
}

function getMissionTone(status: string | null): "default" | "warning" | "success" {
  if (status === "completed" || status === "validated") return "success";
  if (status === "pending" || status === "assigned" || status === "in_progress") return "warning";
  return "default";
}

export default function OwnerMissionsOverviewPage() {
  const { isAuthenticated } = useCurrentUser();
  const {
    missions,
    conversations,
    ongoingMissions,
    completedMissions,
    loading,
    error,
  } = useOwnerDashboardData(isAuthenticated);
  const completion = buildOwnerMissionsCompletion({
    missions: missions as Record<string, unknown>[],
    conversations: conversations as Record<string, unknown>[],
  });
  const missionConversations = conversations.filter((conversation) => conversation.source === "mission");
  const missionBudget = missions.reduce((sum, mission) => sum + (mission.amount ?? 0), 0);
  const latestMissions = missions.slice(0, 5);

  return (
    <SimpleOverviewWorkspace
      tone="owner"
      eyebrow="Centre opérationnel"
      title="Missions confiées à votre concierge"
      description={
        loading
          ? "Chargement des missions..."
          : error ||
            "Une mission commence après acceptation d'un devis. Elle centralise le statut, le logement, les échanges, les documents et les preuves terrain."
      }
      chips={["Après devis accepté", "Suivi terrain", "Preuves & messages"]}
      actions={[
        { label: "Voir le planning", href: "/dashboard/owner/planning", variant: "primary" },
        { label: "Ouvrir les messages", href: "/dashboard/owner/messages", variant: "secondary" },
        { label: "Nouvelle urgence", href: "/dashboard/owner/mission-urgente", variant: "secondary" },
      ]}
      metrics={[
        {
          label: "Missions",
          value: loading ? "..." : String(missions.length),
          hint: "Dossiers opérationnels issus d'un devis accepté.",
        },
        {
          label: "En cours",
          value: loading ? "..." : String(ongoingMissions.length),
          hint: "A suivre avec le concierge ou un intervenant.",
        },
        {
          label: "Validées",
          value: loading ? "..." : String(completedMissions.length),
          hint: "Terminées ou prêtes pour validation propriétaire.",
        },
        {
          label: "Budget",
          value: loading ? "..." : formatEuroAmountLabel(missionBudget, "-"),
          hint: "Montant suivi sur les missions chargées.",
        },
      ]}
      cards={[
        {
          title: "Créer une mission",
          text: "Décrivez le besoin terrain, choisissez le logement, ajoutez consignes, urgence, date et pièces jointes utiles.",
          actions: [{ label: "Mission urgente", href: "/dashboard/owner/mission-urgente", variant: "primary" }],
        },
        {
          title: "Suivre l'exécution",
          text: "Consultez la planification, les changements de statut, les retours concierge et les éventuelles interventions artisan.",
          actions: [{ label: "Voir le planning", href: "/dashboard/owner/planning", variant: "secondary" }],
        },
        {
          title: "Centraliser les preuves",
          text: "Les photos, documents, commentaires et validations doivent rester attachés à la mission concernée.",
          actions: [{ label: "Documents", href: "/dashboard/owner/documents", variant: "ghost" }],
        },
      ]}
      detailSections={[
        {
          title: "Missions actives",
          description: "La demande concierge est terminée : ces dossiers sont désormais des opérations à suivre.",
          emptyText: "Aucune mission active pour le moment.",
          items: latestMissions.map((mission) => ({
            id: mission.id,
            title: mission.title || "Mission sans titre",
            meta: getMissionStatusLabel(mission.status),
            tone: getMissionTone(mission.status),
            description: `Début prévu : ${formatDateValue(mission.scheduled_start, {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}`,
            facts: [
              `Statut ${getMissionStatusLabel(mission.status)}`,
              `Budget ${formatEuroAmountLabel(mission.amount, "-")}`,
            ],
            href: "/dashboard/owner/planning",
            actionLabel: "Ouvrir",
          })),
        },
        {
          title: "Échanges liés aux missions",
          description: "Les conversations doivent rester rattachées au dossier opérationnel pour éviter la perte d'information.",
          emptyText: "Aucun échange mission à traiter.",
          items: missionConversations.slice(0, 4).map((conversation) => ({
            id: conversation.id,
            title: conversation.subject || conversation.counterpart_name || "Conversation mission",
            meta: conversation.unread_count ? `${conversation.unread_count} non lu(s)` : "A jour",
            tone: conversation.unread_count ? "warning" : "success",
            description: conversation.last_message_preview || "Dernier échange à consulter dans la messagerie.",
            facts: [
              conversation.counterpart_name || "Interlocuteur",
              `Dernier message ${formatDateValue(conversation.last_message_at, {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}`,
            ],
            notificationCount: conversation.unread_count,
            href: "/dashboard/owner/messages",
            actionLabel: "Lire",
          })),
        },
      ]}
      completion={{
        title: "Missions",
        description:
          "Complétez cette catégorie pour garder un pilotage clair de vos interventions, échanges, documents et validations.",
        percentage: completion.percentage,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        missingItems: completion.missingItems,
        actionLabel: "Voir le planning",
        actionHref: "/dashboard/owner/planning",
      }}
    />
  );
}
