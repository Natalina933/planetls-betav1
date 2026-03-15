"use client";

import CategoryOverviewCompletion from "@/app/dashboard/_components/CategoryOverviewCompletion";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { buildOwnerFinancesCompletion } from "@/app/dashboard/shared";
import { useOwnerDashboardData } from "../../useOwnerDashboardData";
import CategoryOverviewPage from "@/app/dashboard/_components/CategoryOverviewPage";

export default function OwnerFinancesOverviewPage() {
  const { isAuthenticated } = useCurrentUser();
  const { quotes, invoices } = useOwnerDashboardData(isAuthenticated);
  const completion = buildOwnerFinancesCompletion({
    quotes: quotes as Record<string, unknown>[],
    invoices: invoices as Record<string, unknown>[],
  });

  return (
    <CategoryOverviewPage
      tone="owner"
      eyebrow="Suivi financier"
      title="Vue d'ensemble des finances"
      description="Retrouvez vos devis, factures et repères de suivi financier avant d'ouvrir les vues détaillées."
      chips={["Vue synthèse", "Devis", "Factures & règlements"]}
      actions={[
        { label: "Voir les devis", href: "/dashboard/owner/reglement", variant: "primary" },
      ]}
      metrics={[
        { label: "Devis", value: String(quotes.length), hint: "Documents préparés" },
        { label: "Factures", value: String(invoices.length), hint: "Documents disponibles" },
        {
          label: "Complétion",
          value: `${completion.percentage}%`,
          hint: `${completion.completedCount}/${completion.totalCount} repères validés`,
        },
      ]}
      cards={[
        {
          title: "Devis & règlements",
          text: "Gardez vos documents financiers accessibles sans quitter cette catégorie.",
          actions: [{ label: "Ouvrir", href: "/dashboard/owner/reglement", variant: "primary" }],
        },
      ]}
    >
      <CategoryOverviewCompletion
        title="Finances"
        description="Complétez cette catégorie pour suivre clairement vos devis, vos factures et vos règlements."
        percentage={completion.percentage}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
        missingItems={completion.missingItems}
        actionLabel="Voir les devis"
        actionHref="/dashboard/owner/reglement"
      />
    </CategoryOverviewPage>
  );
}
