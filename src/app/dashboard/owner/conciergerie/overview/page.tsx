"use client";

import CategoryOverviewCompletion from "@/app/dashboard/_components/CategoryOverviewCompletion";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { buildOwnerConciergeCompletion } from "@/app/dashboard/shared";
import { useOwnerDashboardData } from "../../useOwnerDashboardData";
import CategoryOverviewPage from "@/app/dashboard/_components/CategoryOverviewPage";

export default function OwnerConciergerieOverviewPage() {
  const { isAuthenticated } = useCurrentUser();
  const { conversations } = useOwnerDashboardData(isAuthenticated);
  const completion = buildOwnerConciergeCompletion({
    requestsCount: conversations.length,
    conversations: conversations as Record<string, unknown>[],
  });

  return (
    <CategoryOverviewPage
      tone="owner"
      eyebrow="Relation conciergerie"
      title="Vue d'ensemble de la conciergerie"
      description="Retrouvez ici vos pistes, vos relations actives et les échanges utiles avant d'ouvrir la recherche ou les contacts."
      chips={["Vue synthèse", "Recherche concierge", "Contacts & suivi"]}
      actions={[
        { label: "Trouver un concierge", href: "/dashboard/owner/concierges", variant: "primary" },
        { label: "Voir les contacts", href: "/dashboard/owner/contacts", variant: "secondary" },
      ]}
      metrics={[
        { label: "Suggestions", value: String(conversations.length), hint: "Pistes ou échanges existants" },
        { label: "Contacts", value: String(conversations.length), hint: "Relations suivies" },
        {
          label: "Complétion",
          value: `${completion.percentage}%`,
          hint: `${completion.completedCount}/${completion.totalCount} repères validés`,
        },
      ]}
      cards={[
        {
          title: "Trouver un concierge",
          text: "Explorez les conciergeries adaptées à vos biens et à votre niveau d'exigence.",
          actions: [{ label: "Ouvrir la recherche", href: "/dashboard/owner/concierges", variant: "primary" }],
        },
        {
          title: "Contacts concierge",
          text: "Gardez vos échanges et vos mises en relation accessibles depuis cette catégorie.",
          actions: [{ label: "Voir les contacts", href: "/dashboard/owner/contacts", variant: "secondary" }],
        },
      ]}
    >
      <CategoryOverviewCompletion
        title="Conciergerie"
        description="Complétez cette catégorie pour structurer votre recherche, vos relations et vos échanges avec les conciergeries."
        percentage={completion.percentage}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
        missingItems={completion.missingItems}
        actionLabel="Trouver un concierge"
        actionHref="/dashboard/owner/concierges"
      />
    </CategoryOverviewPage>
  );
}
