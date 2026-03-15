"use client";

import { useMemo } from "react";
import CategoryOverviewCompletion from "@/app/dashboard/_components/CategoryOverviewCompletion";
import CategoryOverviewPage from "@/app/dashboard/_components/CategoryOverviewPage";
import { buildConciergeOwnersCompletion } from "@/app/dashboard/shared";
import { useConciergeOverviewData } from "../../useConciergeOverviewData";

export default function ConciergeOwnersOverviewPage() {
  const { conversations } = useConciergeOverviewData();
  const completion = useMemo(
    () => buildConciergeOwnersCompletion(conversations as Record<string, unknown>[]),
    [conversations],
  );

  return (
    <CategoryOverviewPage
      tone="concierge"
      eyebrow="Relations propriétaires"
      title="Vue d'ensemble des propriétaires"
      description="Suivez ici la relation commerciale et opérationnelle avant d'ouvrir le pipeline ou les conversations dédiées."
      chips={["Vue synthèse", "Relations actives", "Pipeline & messages"]}
      actions={[
        { label: "Voir les contacts", href: "/dashboard/concierge/contacts", variant: "primary" },
      ]}
      metrics={[
        { label: "Conversations", value: String(conversations.length), hint: "Fils disponibles" },
        { label: "Propriétaires", value: String(conversations.length), hint: "Relations actives identifiées" },
        {
          label: "Complétion",
          value: `${completion.percentage}%`,
          hint: `${completion.completedCount}/${completion.totalCount} repères validés`,
        },
      ]}
      cards={[
        {
          title: "Relations actives",
          text: "Gardez un suivi clair des propriétaires déjà engagés avec votre conciergerie.",
          actions: [{ label: "Ouvrir les relations", href: "/dashboard/concierge/contacts", variant: "primary" }],
        },
        {
          title: "Messages propriétaires",
          text: "Accédez rapidement aux échanges utiles sans sortir de cette catégorie.",
          actions: [{ label: "Voir les messages", href: "/dashboard/concierge/messages", variant: "secondary" }],
        },
      ]}
    >
      <CategoryOverviewCompletion
        title="Propriétaires"
        description="Complétez cette catégorie pour structurer vos relations, votre pipeline et vos échanges commerciaux."
        percentage={completion.percentage}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
        missingItems={completion.missingItems}
        actionLabel="Voir les contacts"
        actionHref="/dashboard/concierge/contacts"
      />
    </CategoryOverviewPage>
  );
}
