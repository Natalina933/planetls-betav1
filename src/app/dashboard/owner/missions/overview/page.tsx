"use client";

import CategoryOverviewCompletion from "@/app/dashboard/_components/CategoryOverviewCompletion";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { buildOwnerMissionsCompletion } from "@/app/dashboard/shared";
import { useOwnerDashboardData } from "../../useOwnerDashboardData";
import CategoryOverviewPage from "@/app/dashboard/_components/CategoryOverviewPage";

export default function OwnerMissionsOverviewPage() {
  const { isAuthenticated } = useCurrentUser();
  const { missions, conversations, ongoingMissions } = useOwnerDashboardData(isAuthenticated);
  const completion = buildOwnerMissionsCompletion({
    missions: missions as Record<string, unknown>[],
    conversations: conversations as Record<string, unknown>[],
  });

  return (
    <CategoryOverviewPage
      tone="owner"
      eyebrow="Suivi des interventions"
      title="Vue d'ensemble des missions"
      description="Pilotez vos missions avant d'ouvrir le planning, les alertes ou les échanges liés aux interventions."
      chips={["Vue synthèse", "Planning", "Alertes & messages"]}
      actions={[
        { label: "Voir le planning", href: "/dashboard/owner/planning", variant: "primary" },
        { label: "Ouvrir les messages", href: "/dashboard/owner/messages", variant: "secondary" },
      ]}
      metrics={[
        { label: "Missions", value: String(missions.length), hint: "Volume total" },
        { label: "En cours", value: String(ongoingMissions.length), hint: "Interventions actives" },
        {
          label: "Complétion",
          value: `${completion.percentage}%`,
          hint: `${completion.completedCount}/${completion.totalCount} repères validés`,
        },
      ]}
      cards={[
        {
          title: "Planning",
          text: "Suivez la chronologie de vos missions et les points d'attention du moment.",
          actions: [{ label: "Ouvrir le planning", href: "/dashboard/owner/planning", variant: "primary" }],
        },
        {
          title: "Alertes",
          text: "Surveillez les urgences, points bloquants et événements qui demandent un arbitrage rapide.",
          actions: [{ label: "Voir les alertes", href: "/dashboard/owner/alertes", variant: "secondary" }],
        },
        {
          title: "Messages",
          text: "Gardez les conversations liées aux missions accessibles depuis cette catégorie.",
          actions: [{ label: "Ouvrir les messages", href: "/dashboard/owner/messages", variant: "secondary" }],
        },
      ]}
    >
      <CategoryOverviewCompletion
        title="Missions"
        description="Complétez cette catégorie pour garder un pilotage clair de vos interventions et de vos échanges."
        percentage={completion.percentage}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
        missingItems={completion.missingItems}
        actionLabel="Voir le planning"
        actionHref="/dashboard/owner/planning"
      />
    </CategoryOverviewPage>
  );
}
