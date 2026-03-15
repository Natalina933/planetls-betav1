"use client";

import { useMemo } from "react";
import CategoryOverviewCompletion from "@/app/dashboard/_components/CategoryOverviewCompletion";
import CategoryOverviewPage from "@/app/dashboard/_components/CategoryOverviewPage";
import { buildConciergeHousingCompletion } from "@/app/dashboard/shared";
import { useConciergeOverviewData } from "../../useConciergeOverviewData";

export default function ConciergeHousingOverviewPage() {
  const { housings } = useConciergeOverviewData();
  const completion = useMemo(
    () => buildConciergeHousingCompletion(housings as Record<string, unknown>[]),
    [housings],
  );

  return (
    <CategoryOverviewPage
      tone="concierge"
      eyebrow="Pilotage des logements"
      title="Vue d'ensemble des logements"
      description="Retrouvez ici l'état de votre parc, avant d'ouvrir les fiches, les stocks ou l'ajout de nouveaux biens."
      chips={["Vue synthèse", "Parc géré", "Fiches & équipements"]}
      actions={[
        { label: "Voir les logements", href: "/dashboard/concierge/logements", variant: "primary" },
      ]}
      metrics={[
        { label: "Logements", value: String(housings.length), hint: "Biens visibles dans votre espace" },
        {
          label: "Complétion",
          value: `${completion.percentage}%`,
          hint: `${completion.completedCount}/${completion.totalCount} repères validés`,
        },
      ]}
      cards={[
        {
          title: "Parc géré",
          text: "Retrouvez les logements suivis, leur état de préparation et les points à compléter.",
          actions: [{ label: "Ouvrir les logements", href: "/dashboard/concierge/logements", variant: "primary" }],
        },
        {
          title: "Équipements & documents",
          text: "Centralisez les éléments utiles à l'exploitation sans quitter la catégorie logements.",
          actions: [{ label: "Voir les fiches", href: "/dashboard/concierge/logements", variant: "secondary" }],
        },
      ]}
    >
      <CategoryOverviewCompletion
        title="Logements"
        description="Complétez cette catégorie pour disposer d'un parc exploitable, documenté et bien préparé."
        percentage={completion.percentage}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
        missingItems={completion.missingItems}
        actionLabel="Voir les logements"
        actionHref="/dashboard/concierge/logements"
      />
    </CategoryOverviewPage>
  );
}
