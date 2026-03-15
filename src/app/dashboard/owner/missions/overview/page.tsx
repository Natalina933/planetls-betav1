"use client";

import SimpleOverviewWorkspace from "@/app/dashboard/_components/SimpleOverviewWorkspace";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { buildOwnerMissionsCompletion } from "@/app/dashboard/shared";
import { useOwnerDashboardData } from "../../useOwnerDashboardData";

export default function OwnerMissionsOverviewPage() {
  const { isAuthenticated } = useCurrentUser();
  const { missions, conversations } = useOwnerDashboardData(isAuthenticated);
  const completion = buildOwnerMissionsCompletion({
    missions: missions as Record<string, unknown>[],
    conversations: conversations as Record<string, unknown>[],
  });

  return (
    <SimpleOverviewWorkspace
      tone="owner"
      eyebrow="Pilotage des missions"
      title="Vue d'ensemble des missions"
      description="Cette vue rassemble uniquement l'état de vos missions. Les sous-rubriques servent ensuite à suivre le planning, les alertes et les échanges liés aux interventions, sans redondance."
      chips={["Vue synthèse", "Planning", "Alertes & messages"]}
      actions={[
        { label: "Voir le planning", href: "/dashboard/owner/planning", variant: "primary" },
        { label: "Ouvrir les messages", href: "/dashboard/owner/messages", variant: "secondary" },
      ]}
      completion={{
        title: "Missions",
        description:
          "Complétez cette catégorie pour garder un pilotage clair de vos interventions et de vos échanges.",
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
