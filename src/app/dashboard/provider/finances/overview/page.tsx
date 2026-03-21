"use client";

import SimpleOverviewWorkspace from "@/app/dashboard/_components/SimpleOverviewWorkspace";
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
    <SimpleOverviewWorkspace
      tone="provider"
      eyebrow="Pilotage financier"
      title="Vue d'ensemble des finances"
      description="Cette vue rassemble uniquement l'etat de vos finances. Les sous-rubriques servent ensuite a suivre vos devis et vos elements facturables, sans redondance."
      chips={["Vue synthese", "A finaliser", "Points en attente"]}
      actions={[{ label: "Voir devis & factures", href: "/dashboard/provider/devis", variant: "primary" }]}
      completion={{
        title: "Finances",
        description:
          "Completez cette categorie pour disposer d'une base financiere exploitable cote provider.",
        percentage: completion.percentage,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        missingItems: completion.missingItems,
        actionLabel: "Voir devis & factures",
        actionHref: "/dashboard/provider/devis",
      }}
    />
  );
}
