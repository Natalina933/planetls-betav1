"use client";

import CategoryOverviewCompletion from "@/app/dashboard/_components/CategoryOverviewCompletion";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { buildOwnerHousingCompletion } from "@/app/dashboard/shared";
import { useOwnerDashboardData } from "../../useOwnerDashboardData";
import CategoryOverviewPage from "@/app/dashboard/_components/CategoryOverviewPage";

export default function OwnerHousingOverviewPage() {
  const { isAuthenticated } = useCurrentUser();
  const { properties, activeCount } = useOwnerDashboardData(isAuthenticated);
  const completion = buildOwnerHousingCompletion(properties as Record<string, unknown>[]);

  return (
    <CategoryOverviewPage
      tone="owner"
      eyebrow="Patrimoine"
      title="Vue d'ensemble des logements"
      description="Retrouvez votre parc immobilier avant d'ouvrir le catalogue, la création ou les documents associés."
      chips={["Vue synthèse", "Catalogue logements", "Documents & stocks"]}
      actions={[
        { label: "Voir les logements", href: "/dashboard/owner/logements" },
        { label: "Ajouter un logement", href: "/dashboard/owner/logements/create", variant: "primary" },
      ]}
      metrics={[
        { label: "Logements", value: String(properties.length), hint: "Biens présents dans l'espace" },
        { label: "Actifs", value: String(activeCount), hint: "Biens déjà exploitables" },
        {
          label: "Complétion",
          value: `${completion.percentage}%`,
          hint: `${completion.completedCount}/${completion.totalCount} repères validés`,
        },
      ]}
      cards={[
        {
          title: "Tous les logements",
          text: "Consultez chaque bien, son statut et les détails utiles à l'exploitation.",
          actions: [{ label: "Ouvrir", href: "/dashboard/owner/logements", variant: "primary" }],
        },
        {
          title: "Ajouter un logement",
          text: "Créez une nouvelle fiche bien pour lancer un onboarding propre côté owner.",
          actions: [{ label: "Créer", href: "/dashboard/owner/logements/create", variant: "secondary" }],
        },
        {
          title: "Documents et stocks",
          text: "Gardez vos documents et suivis transverses accessibles depuis la catégorie logements.",
          actions: [{ label: "Voir les documents", href: "/dashboard/owner/documents", variant: "secondary" }],
        },
      ]}
    >
      <CategoryOverviewCompletion
        title="Logements"
        description="Complétez cette catégorie pour disposer d'un parc bien structuré et exploitable."
        percentage={completion.percentage}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
        missingItems={completion.missingItems}
        actionLabel="Voir les logements"
        actionHref="/dashboard/owner/logements"
      />
    </CategoryOverviewPage>
  );
}
