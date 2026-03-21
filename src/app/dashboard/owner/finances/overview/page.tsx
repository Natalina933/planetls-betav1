"use client";

import SimpleOverviewWorkspace from "@/app/dashboard/_components/SimpleOverviewWorkspace";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
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
      description="Cette vue rassemble uniquement l'etat de vos finances. Les sous-rubriques servent ensuite a suivre vos devis, vos factures et vos reglements, sans redondance."
      chips={["Vue synthese", "A finaliser", "Points en attente"]}
      actions={[
        { label: "Voir les devis", href: "/dashboard/owner/devis", variant: "secondary" },
        { label: "Ouvrir les reglements", href: "/dashboard/owner/reglement", variant: "primary" },
      ]}
      completion={{
        title: "Finances",
        description: "Completez cette categorie pour suivre clairement vos devis, vos factures et vos reglements.",
        percentage: completion.percentage,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        missingItems: completion.missingItems,
        actionLabel: "Ouvrir les reglements",
        actionHref: "/dashboard/owner/reglement",
      }}
      metrics={[
        {
          label: "Devis",
          value: String(quotes.length),
          hint: "Opportunites ou validations en cours",
        },
        {
          label: "Factures",
          value: String(invoices.length),
          hint: "Pieces financieres deja consolidees",
        },
      ]}
      cards={[
        {
          title: "Lecture strategique",
          text:
            invoices.length > 0
              ? "La vue d'ensemble doit servir a arbitrer la sante financiere, puis le reporting detaille prend le relais sur les montants et statuts."
              : "La base financiere est encore legere. Commencez par centraliser devis et reglements pour fiabiliser les decisions.",
          actions: [{ label: "Voir les factures", href: "/dashboard/owner/factures", variant: "secondary" }],
        },
        {
          title: "Decision recommandee",
          text:
            quotes.length > 0
              ? "Priorite: comparer les devis ouverts avec les factures deja engagees pour eviter les angles morts de tresorerie."
              : "Priorite: formaliser les demandes en devis avant d'accelerer les engagements financiers.",
          actions: [{ label: "Voir les devis", href: "/dashboard/owner/devis", variant: "primary" }],
        },
      ]}
    />
  );
}
