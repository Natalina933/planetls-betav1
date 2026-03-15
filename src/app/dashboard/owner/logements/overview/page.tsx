"use client";

import SimpleOverviewWorkspace from "@/app/dashboard/_components/SimpleOverviewWorkspace";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { buildOwnerHousingCompletion } from "@/app/dashboard/shared";
import { useOwnerDashboardData } from "../../useOwnerDashboardData";

export default function OwnerHousingOverviewPage() {
  const { isAuthenticated } = useCurrentUser();
  const { properties } = useOwnerDashboardData(isAuthenticated);
  const completion = buildOwnerHousingCompletion(properties as Record<string, unknown>[]);

  return (
    <SimpleOverviewWorkspace
      tone="owner"
      eyebrow="Pilotage des logements"
      title="Vue d'ensemble des logements"
      description="Retrouvez ici l'état de votre parc, avant d'ouvrir les fiches, les stocks ou l'ajout de nouveaux biens."
      chips={["Vue synthèse", "Parc géré", "Fiches & équipements"]}
      actions={[
        { label: "Voir les logements", href: "/dashboard/owner/logements", variant: "primary" },
        { label: "Ajouter un logement", href: "/dashboard/owner/logements/create", variant: "secondary" },
      ]}
      completion={{
        title: "Logements",
        description: "Complétez cette catégorie pour disposer d'un parc bien structuré et exploitable.",
        percentage: completion.percentage,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        missingItems: completion.missingItems,
        actionLabel: "Voir les logements",
        actionHref: "/dashboard/owner/logements",
      }}
    />
  );
}
