"use client";

import CategoryOverviewCompletion from "@/app/dashboard/_components/CategoryOverviewCompletion";
import CategoryOverviewPage from "@/app/dashboard/_components/CategoryOverviewPage";
import { buildProviderFinancesCompletion } from "@/app/dashboard/shared";
import { useProviderDashboardData } from "../../useProviderDashboardData";

export default function ProviderFinancesOverviewPage() {
  const { dashboard } = useProviderDashboardData();
  const clients = dashboard?.clients ?? [];
  const interventions = dashboard?.interventions ?? [];
  const completion = buildProviderFinancesCompletion({
    clients: clients as Record<string, unknown>[],
    interventions: interventions as Record<string, unknown>[],
  });

  return (
    <CategoryOverviewPage
      tone="provider"
      eyebrow="Suivi financier"
      title="Vue d'ensemble des finances"
      description="Regroupez ici les indicateurs utiles avant d'ouvrir les devis et factures de l'espace provider."
      chips={["Vue synthèse", "Budgets", "Devis & factures"]}
      actions={[
        { label: "Voir devis & factures", href: "/dashboard/provider/devis", variant: "primary" },
      ]}
      metrics={[
        { label: "Clients", value: String(clients.length), hint: "Base potentiellement facturable" },
        { label: "Interventions", value: String(interventions.length), hint: "Interventions avec budget possible" },
        {
          label: "Complétion",
          value: `${completion.percentage}%`,
          hint: `${completion.completedCount}/${completion.totalCount} repères validés`,
        },
      ]}
      cards={[
        {
          title: "Devis & factures",
          text: "Accédez à la vue financière dédiée pour suivre vos documents et votre rentabilité.",
          actions: [{ label: "Ouvrir", href: "/dashboard/provider/devis", variant: "primary" }],
        },
      ]}
    >
      <CategoryOverviewCompletion
        title="Finances"
        description="Complétez cette catégorie pour disposer d'une base financière exploitable côté provider."
        percentage={completion.percentage}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
        missingItems={completion.missingItems}
        actionLabel="Voir devis & factures"
        actionHref="/dashboard/provider/devis"
      />
    </CategoryOverviewPage>
  );
}
