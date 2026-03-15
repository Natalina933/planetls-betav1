"use client";

import { useMemo } from "react";
import CategoryOverviewCompletion from "@/app/dashboard/_components/CategoryOverviewCompletion";
import CategoryOverviewPage from "@/app/dashboard/_components/CategoryOverviewPage";
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
    <CategoryOverviewPage
      tone="concierge"
      eyebrow="Pilotage financier"
      title="Vue d'ensemble des finances"
      description="Retrouvez vos trois grands leviers financiers : facturation, tarification et packs commercialisables."
      chips={["Vue synthèse", "Devis & factures", "Tarifs & packs"]}
      actions={[
        { label: "Ouvrir la facturation", href: "/dashboard/concierge/billing", variant: "primary" },
        { label: "Voir mes tarifs", href: "/dashboard/concierge/pricing", variant: "secondary" },
      ]}
      metrics={[
        {
          label: "Historique billing",
          value: String(Array.isArray(billing?.events) ? billing.events.length : 0),
          hint: "Événements de facturation disponibles",
        },
        { label: "Tarifs", value: String(pricingRows.length), hint: "Lignes tarifaires configurées" },
        { label: "Packs", value: String(packages.length), hint: "Offres commercialisables" },
      ]}
      cards={[
        {
          title: "Devis & factures",
          text: "Suivez votre abonnement, votre historique Stripe et les éléments de facturation utiles.",
          actions: [{ label: "Ouvrir la facturation", href: "/dashboard/concierge/billing", variant: "primary" }],
        },
        {
          title: "Tarifs",
          text: "Ajustez votre grille tarifaire pour transformer vos services en offre claire et rentable.",
          actions: [{ label: "Voir les tarifs", href: "/dashboard/concierge/pricing", variant: "secondary" }],
        },
        {
          title: "Packs",
          text: "Regroupez vos offres, contrats et tarifs liés pour industrialiser la vente de votre conciergerie.",
          actions: [{ label: "Ouvrir les packs", href: "/dashboard/concierge/services-packages", variant: "secondary" }],
        },
      ]}
    >
      <CategoryOverviewCompletion
        title="Finances"
        description="Complétez cette catégorie pour structurer vos revenus, vos tarifs et vos offres commercialisables."
        percentage={completion.percentage}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
        missingItems={completion.missingItems}
        actionLabel="Ouvrir la facturation"
        actionHref="/dashboard/concierge/billing"
      />
    </CategoryOverviewPage>
  );
}
