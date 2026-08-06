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
      eyebrow="Relations propriétaires"
      title="Vue d'ensemble des propriétaires"
      description="Cette vue rassemble uniquement l'état de vos relations propriétaires. Les sous-rubriques servent ensuite à suivre vos contacts, votre prospection et vos échanges, sans redondance."
      chips={["Vue synthese", "Demandes a traiter", "Points en attente"]}
      actions={[
        { label: "Voir les contacts", href: "/dashboard/concierge/contacts", variant: "primary" },
        { label: "Voir les messages", href: "/dashboard/concierge/messages", variant: "secondary" },
      ]}
      completion={{
        title: "Propriétaires",
        description:
          "Complétez cette catégorie pour structurer vos relations, votre prospection et vos échanges commerciaux.",
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
