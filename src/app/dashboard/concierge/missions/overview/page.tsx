"use client";

import { useMemo } from "react";
import SimpleOverviewWorkspace from "@/app/dashboard/_components/SimpleOverviewWorkspace";
import { buildConciergeMissionsCompletion } from "@/app/dashboard/shared";
import { useConciergeOverviewData } from "../../useConciergeOverviewData";

export default function ConciergeMissionsOverviewPage() {
  const { profile, requests, conversations } = useConciergeOverviewData();
  const completion = useMemo(
    () =>
      buildConciergeMissionsCompletion({
        profile,
        requestCount: requests.length,
        messageCount: conversations.length,
      }),
    [conversations.length, profile, requests.length],
  );

  return (
    <SimpleOverviewWorkspace
      tone="concierge"
      eyebrow="Pilotage des missions"
      title="Vue d'ensemble des missions"
      description="Cette vue rassemble uniquement l'état de vos missions. Les sous-rubriques servent ensuite à gérer le planning, les demandes, les urgences et vos services, sans redondance."
      chips={["Vue synthèse", "Planning, demandes, urgences", "Services & disponibilités"]}
      actions={[
        { label: "Ouvrir le planning", href: "/dashboard/concierge/planning", variant: "primary" },
        {
          label: "Configurer mes services",
          href: "/dashboard/concierge/profile?tab=missions",
          variant: "secondary",
        },
      ]}
      completion={{
        title: "Missions",
        description:
          "Complétez cette catégorie pour structurer votre organisation terrain et recevoir des demandes qualifiées.",
        percentage: completion.percentage,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        missingItems: completion.missingItems,
        actionLabel: "Configurer mes missions",
        actionHref: "/dashboard/concierge/profile?tab=missions",
      }}
    />
  );
}
