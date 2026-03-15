"use client";

import { CompletionStatusCard } from "@/components/dashboard";
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
      eyebrow="Pilotage financier"
      title="Vue d'ensemble des finances"
      description="Retrouvez ici vos devis, vos factures et le suivi des règlements avant d'ouvrir chaque écran détaillé."
      chips={["Vue synthèse", "Devis", "Factures & règlements"]}
      actions={[
        { label: "Voir les factures", href: "/dashboard/owner/factures", variant: "primary" },
        { label: "Voir les devis", href: "/dashboard/owner/devis", variant: "secondary" },
      ]}
      metrics={[
        { label: "Devis", value: String(quotes.length), hint: "Documents commerciaux" },
        { label: "Factures", value: String(invoices.length), hint: "Documents émis" },
        { label: "Complétion", value: `${completion.percentage}%`, hint: `${completion.completedCount}/${completion.totalCount} repères validés` },
      ]}
      cards={[
        { title: "Devis", text: "Suivez les propositions envoyées et celles qui attendent encore une validation.", actions: [{ label: "Ouvrir les devis", href: "/dashboard/owner/devis", variant: "primary" }] },
        { title: "Factures", text: "Gardez vos factures accessibles et suivez leur évolution dans le temps.", actions: [{ label: "Ouvrir les factures", href: "/dashboard/owner/factures", variant: "secondary" }] },
        { title: "Règlements", text: "Contrôlez les règlements et les statuts de paiement depuis une vue dédiée.", actions: [{ label: "Voir les règlements", href: "/dashboard/owner/reglement", variant: "secondary" }] },
      ]}
    >
      <CompletionStatusCard
        title="Finances"
        description="Complétez cette catégorie pour suivre vos documents commerciaux et vos paiements sans angle mort."
        percentage={completion.percentage}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
        missingItems={completion.missingItems}
        actionLabel="Voir les factures"
        actionHref="/dashboard/owner/factures"
      />
    </CategoryOverviewPage>
  );
}
