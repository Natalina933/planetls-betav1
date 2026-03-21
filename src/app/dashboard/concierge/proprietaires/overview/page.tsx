"use client";

import { useMemo } from "react";
import SimpleOverviewWorkspace from "@/app/dashboard/_components/SimpleOverviewWorkspace";
import { buildConciergeOwnersCompletion } from "@/app/dashboard/shared";
import { useConciergeOverviewData } from "../../useConciergeOverviewData";

export default function ConciergeOwnersOverviewPage() {
  const { conversations } = useConciergeOverviewData();
  const completion = useMemo(
    () => buildConciergeOwnersCompletion(conversations as Record<string, unknown>[]),
    [conversations],
  );

  return (
    <SimpleOverviewWorkspace
      tone="concierge"
      eyebrow="Relations proprietaires"
      title="Vue d'ensemble des proprietaires"
      description="Cette vue rassemble uniquement l'etat de vos relations proprietaires. Les sous-rubriques servent ensuite a suivre vos contacts, votre pipeline et vos echanges, sans redondance."
      chips={["Vue synthese", "Demandes a traiter", "Points en attente"]}
      actions={[
        { label: "Voir les contacts", href: "/dashboard/concierge/contacts", variant: "primary" },
        { label: "Voir les messages", href: "/dashboard/concierge/messages", variant: "secondary" },
      ]}
      completion={{
        title: "Proprietaires",
        description:
          "Completez cette categorie pour structurer vos relations, votre pipeline et vos echanges commerciaux.",
        percentage: completion.percentage,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        missingItems: completion.missingItems,
        actionLabel: "Voir les contacts",
        actionHref: "/dashboard/concierge/contacts",
      }}
    />
  );
}
