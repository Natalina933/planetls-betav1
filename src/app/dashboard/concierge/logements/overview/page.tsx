"use client";

import { useMemo } from "react";
import SimpleOverviewWorkspace from "@/app/dashboard/_components/SimpleOverviewWorkspace";
import { buildConciergeHousingCompletion } from "@/app/dashboard/shared";
import { useConciergeOverviewData } from "../../useConciergeOverviewData";

export default function ConciergeHousingOverviewPage() {
  const { housings } = useConciergeOverviewData();
  const completion = useMemo(
    () => buildConciergeHousingCompletion(housings as Record<string, unknown>[]),
    [housings],
  );

  return (
    <SimpleOverviewWorkspace
      tone="concierge"
      eyebrow="Pilotage des logements"
      title="Vue d'ensemble des logements"
      description="Retrouvez ici l'état de votre parc, avant d'ouvrir les fiches, les stocks ou l'ajout de nouveaux biens."
      chips={["Vue synthèse", "Parc géré", "Fiches & équipements"]}
      actions={[{ label: "Voir les logements", href: "/dashboard/concierge/logements", variant: "primary" }]}
      completion={{
        title: "Logements",
        description:
          "Complétez cette catégorie pour disposer d'un parc exploitable, documenté et bien préparé.",
        percentage: completion.percentage,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        missingItems: completion.missingItems,
        actionLabel: "Voir les logements",
        actionHref: "/dashboard/concierge/logements",
      }}
    />
  );
}
