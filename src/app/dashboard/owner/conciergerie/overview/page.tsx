"use client";

import SimpleOverviewWorkspace from "@/app/dashboard/_components/SimpleOverviewWorkspace";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { buildOwnerConciergeCompletion } from "@/app/dashboard/shared";
import { useOwnerDashboardData } from "../../useOwnerDashboardData";

export default function OwnerConciergerieOverviewPage() {
  const { isAuthenticated } = useCurrentUser();
  const { conversations } = useOwnerDashboardData(isAuthenticated);
  const completion = buildOwnerConciergeCompletion({
    requestsCount: conversations.length,
    conversations: conversations as Record<string, unknown>[],
  });

  return (
    <SimpleOverviewWorkspace
      tone="owner"
      eyebrow="Relation conciergerie"
      title="Vue d'ensemble de la conciergerie"
      description="Cette vue rassemble uniquement l'état de votre relation conciergerie. Les sous-rubriques servent ensuite à chercher, suivre et échanger avec les conciergeries, sans redondance."
      chips={["Vue synthèse", "Recherche concierge", "Contacts & suivi"]}
      actions={[
        { label: "Trouver un concierge", href: "/dashboard/owner/concierges", variant: "primary" },
        { label: "Voir les contacts", href: "/dashboard/owner/contacts", variant: "secondary" },
      ]}
      completion={{
        title: "Conciergerie",
        description:
          "Complétez cette catégorie pour structurer votre recherche, vos relations et vos échanges avec les conciergeries.",
        percentage: completion.percentage,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        missingItems: completion.missingItems,
        actionLabel: "Trouver un concierge",
        actionHref: "/dashboard/owner/concierges",
      }}
    />
  );
}
