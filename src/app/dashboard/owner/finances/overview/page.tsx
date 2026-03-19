"use client";

import SimpleOverviewWorkspace from "@/app/dashboard/_components/SimpleOverviewWorkspace";
import { useCurrentUser } from "@/components/hooks/useCurrentUser";
import { buildOwnerFinancesCompletion } from "@/app/dashboard/shared";
import { useOwnerDashboardData } from "../../useOwnerDashboardData";

export default function OwnerFinancesOverviewPage() {
  const { isAuthenticated } = useCurrentUser();
  const { quotes, invoices } = useOwnerDashboardData(isAuthenticated);
  const completion = buildOwnerFinancesCompletion({
    quotes: quotes as Record<string, unknown>[],
    invoices: invoices as Record<string, unknown>[],
  });

  return (
    <SimpleOverviewWorkspace
      tone="owner"
      eyebrow="Pilotage financier"
      title="Vue d'ensemble des finances"
      description="Cette vue rassemble uniquement l'état de vos finances. Les sous-rubriques servent ensuite à suivre vos devis, vos factures et vos règlements, sans redondance."
      chips={["Vue synthèse", "Devis", "Factures & règlements"]}
      actions={[{ label: "Voir les devis", href: "/dashboard/owner/reglement", variant: "primary" }]}
      completion={{
        title: "Finances",
        description:
          "Complétez cette catégorie pour suivre clairement vos devis, vos factures et vos règlements.",
        percentage: completion.percentage,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        missingItems: completion.missingItems,
        actionLabel: "Voir les devis",
        actionHref: "/dashboard/owner/reglement",
      }}
    />
  );
}
