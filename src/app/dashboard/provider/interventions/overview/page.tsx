"use client";

import { CompletionStatusCard } from "@/components/dashboard";
import { buildProviderInterventionsCompletion } from "@/app/dashboard/shared";
import { useProviderDashboardData } from "../../useProviderDashboardData";
import CategoryOverviewPage from "@/app/dashboard/_components/CategoryOverviewPage";

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
      description="Gardez vos interventions, alertes et messages alignés avant d'ouvrir les écrans de gestion détaillée."
      chips={["Vue synthèse", "Planning", "Alertes & messages"]}
      actions={[
        { label: "Voir les interventions", href: "/dashboard/provider/interventions", variant: "primary" },
        { label: "Voir le planning", href: "/dashboard/provider/planning", variant: "secondary" },
      ]}
      metrics={[
        { label: "Interventions", value: String(interventions.length), hint: "Volume global" },
        { label: "Alertes", value: String(alerts.length), hint: "Points de vigilance" },
        { label: "Complétion", value: `${completion.percentage}%`, hint: `${completion.completedCount}/${completion.totalCount} repères validés` },
      ]}
      cards={[
        { title: "Toutes les interventions", text: "Consultez et gérez vos interventions depuis la vue principale.", actions: [{ label: "Ouvrir", href: "/dashboard/provider/interventions", variant: "primary" }] },
        { title: "Planning", text: "Gardez une lecture calendaire claire des créneaux et des interventions planifiées.", actions: [{ label: "Voir le planning", href: "/dashboard/provider/planning", variant: "secondary" }] },
        { title: "Alertes et messages", text: "Restez réactif sur les priorités terrain et les échanges clients.", actions: [{ label: "Voir les alertes", href: "/dashboard/provider/alertes", variant: "secondary" }, { label: "Voir les messages", href: "/dashboard/provider/messages", variant: "secondary" }] },
      ]}
    >
      <CompletionStatusCard
        title="Interventions"
        description="Complétez cette catégorie pour piloter vos missions terrain avec une vision claire des alertes et des échanges."
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
