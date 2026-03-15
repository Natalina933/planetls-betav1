"use client";

import CategoryOverviewCompletion from "@/app/dashboard/_components/CategoryOverviewCompletion";
import CategoryOverviewPage from "@/app/dashboard/_components/CategoryOverviewPage";
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
    <CategoryOverviewPage
      tone="provider"
      eyebrow="Pilotage terrain"
      title="Vue d'ensemble des interventions"
      description="Gardez ici l'essentiel de vos interventions avant d'ouvrir le planning, les alertes ou les messages associés."
      chips={["Vue synthèse", "Planning", "Alertes & messages"]}
      actions={[
        { label: "Voir les interventions", href: "/dashboard/provider/interventions", variant: "primary" },
      ]}
      metrics={[
        { label: "Interventions", value: String(interventions.length), hint: "Volume total" },
        { label: "Alertes", value: String(alerts.length), hint: "Points à surveiller" },
        {
          label: "Complétion",
          value: `${completion.percentage}%`,
          hint: `${completion.completedCount}/${completion.totalCount} repères validés`,
        },
      ]}
      cards={[
        {
          title: "Planning d'intervention",
          text: "Retrouvez le déroulé des interventions et les points à surveiller au quotidien.",
          actions: [{ label: "Ouvrir", href: "/dashboard/provider/interventions", variant: "primary" }],
        },
        {
          title: "Messages",
          text: "Gardez les échanges liés aux interventions accessibles depuis cette catégorie.",
          actions: [{ label: "Voir les messages", href: "/dashboard/provider/messages", variant: "secondary" }],
        },
      ]}
    >
      <CategoryOverviewCompletion
        title="Interventions"
        description="Complétez cette catégorie pour structurer votre organisation terrain et suivre vos missions sans zone floue."
        percentage={completion.percentage}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
        missingItems={completion.missingItems}
        actionLabel="Voir les interventions"
        actionHref="/dashboard/provider/interventions"
      />
    </CategoryOverviewPage>
  );
}
