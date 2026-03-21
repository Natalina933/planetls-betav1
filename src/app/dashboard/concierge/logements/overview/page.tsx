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
      description="Retrouvez ici l'etat de votre parc, avant d'ouvrir les fiches, les stocks ou l'ajout de nouveaux biens."
      chips={["Vue synthese", "A finaliser", "Points en attente"]}
      actions={[{ label: "Voir les logements", href: "/dashboard/concierge/logements", variant: "primary" }]}
      completion={{
        title: "Logements",
        description:
          "Completez cette categorie pour disposer d'un parc exploitable, documente et bien prepare.",
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
