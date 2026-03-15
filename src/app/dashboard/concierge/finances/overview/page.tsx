"use client";

import { useMemo } from "react";
import SimpleOverviewWorkspace from "@/app/dashboard/_components/SimpleOverviewWorkspace";
import { buildConciergeFinancesCompletion } from "@/app/dashboard/shared";
import { useConciergeOverviewData } from "../../useConciergeOverviewData";

export default function ConciergeFinancesOverviewPage() {
  const { billing, pricingRows, packages } = useConciergeOverviewData();
  const completion = useMemo(
    () =>
      buildConciergeFinancesCompletion({
        billingEventsCount: Array.isArray(billing?.events) ? billing.events.length : 0,
        pricingRowsCount: pricingRows.length,
        packagesCount: packages.length,
      }),
    [billing?.events, packages.length, pricingRows.length],
  );

  return (
    <SimpleOverviewWorkspace
      tone="concierge"
      eyebrow="Pilotage financier"
      title="Vue d'ensemble des finances"
      description="Cette vue rassemble uniquement l'état de vos finances. Les sous-rubriques servent ensuite à gérer la facturation, les tarifs et les packs, sans redondance."
      chips={["Vue synthèse", "Devis & factures", "Tarifs & packs"]}
      actions={[
        { label: "Ouvrir la facturation", href: "/dashboard/concierge/billing", variant: "primary" },
        { label: "Voir mes tarifs", href: "/dashboard/concierge/pricing", variant: "secondary" },
        { label: "Ouvrir les packs", href: "/dashboard/concierge/services-packages", variant: "secondary" },
      ]}
      completion={{
        title: "Finances",
        description:
          "Complétez cette catégorie pour structurer vos revenus, vos tarifs et vos offres commercialisables.",
        percentage: completion.percentage,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        missingItems: completion.missingItems,
        actionLabel: "Ouvrir la facturation",
        actionHref: "/dashboard/concierge/billing",
      }}
    />
  );
}
