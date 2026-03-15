"use client";

import SimpleOverviewWorkspace from "@/app/dashboard/_components/SimpleOverviewWorkspace";
import { buildProviderInterventionsCompletion } from "@/app/dashboard/shared";
import { useProviderDashboardData } from "../../useProviderDashboardData";

export default function ProviderInterventionsOverviewPage() {
  const { dashboard } = useProviderDashboardData();
  const interventions = dashboard?.interventions ?? [];
  const alerts = dashboard?.alerts ?? [];
  const conversations = dashboard?.conversations ?? [];
  const completion = buildProviderInterventionsCompletion({
    interventions: interventions as Record<string, unknown>[],
    alerts: alerts as Record<string, unknown>[],
    conversations: conversations as Record<string, unknown>[],
  });

  return (
    <SimpleOverviewWorkspace
      tone="provider"
      eyebrow="Pilotage des interventions"
      title="Vue d'ensemble des interventions"
      description="Cette vue rassemble uniquement l'état de vos interventions. Les sous-rubriques servent ensuite à suivre le planning, les alertes et les messages associés, sans redondance."
      chips={["Vue synthèse", "Planning", "Alertes & messages"]}
      actions={[
        { label: "Voir les interventions", href: "/dashboard/provider/interventions", variant: "primary" },
        { label: "Ouvrir les messages", href: "/dashboard/provider/messages", variant: "secondary" },
      ]}
      completion={{
        title: "Interventions",
        description:
          "Complétez cette catégorie pour structurer votre organisation terrain et suivre vos missions sans zone floue.",
        percentage: completion.percentage,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        missingItems: completion.missingItems,
        actionLabel: "Voir les interventions",
        actionHref: "/dashboard/provider/interventions",
      }}
    />
  );
}
