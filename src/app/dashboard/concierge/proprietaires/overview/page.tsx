"use client";

import { useMemo } from "react";
import { CompletionStatusCard } from "@/components/dashboard";
import CategoryOverviewPage from "@/app/dashboard/_components/CategoryOverviewPage";
import { buildConciergeOwnersCompletion } from "@/app/dashboard/shared";
import { useConciergeOverviewData } from "../../useConciergeOverviewData";

export default function ConciergeOwnersOverviewPage() {
  const { conversations } = useConciergeOverviewData();
  const completion = useMemo(() => buildConciergeOwnersCompletion(conversations), [conversations]);

  return (
    <CategoryOverviewPage
      tone="concierge"
      eyebrow="Relations propriétaires"
      title="Vue d'ensemble des propriétaires"
      description="Centralisez ici la relation commerciale et le suivi des conversations avant d'entrer dans le pipeline ou la messagerie."
      chips={["Vue synthèse", "Relations actives", "Pipeline & messages"]}
      actions={[
        { label: "Voir les relations actives", href: "/dashboard/concierge/contacts", variant: "primary" },
        { label: "Ouvrir le pipeline", href: "/dashboard/concierge/recherche", variant: "secondary" },
      ]}
      metrics={[
        {
          label: "Conversations",
          value: String(conversations.length),
          hint: "Échanges propriétaires recensés",
        },
        {
          label: "Complétion",
          value: `${completion.percentage}%`,
          hint: `${completion.completedCount}/${completion.totalCount} repères activés`,
        },
      ]}
      cards={[
        {
          title: "Relations actives",
          text: "Suivez les propriétaires déjà engagés et reprenez les conversations importantes rapidement.",
          actions: [{ label: "Ouvrir les relations", href: "/dashboard/concierge/contacts", variant: "primary" }],
        },
        {
          title: "Pipeline",
          text: "Travaillez votre acquisition propriétaire et gardez les opportunités chaudes visibles.",
          actions: [{ label: "Voir le pipeline", href: "/dashboard/concierge/recherche", variant: "secondary" }],
        },
        {
          title: "Messages propriétaires",
          text: "Accédez à la messagerie dédiée pour traiter rapidement les échanges prioritaires.",
          actions: [{ label: "Ouvrir les messages", href: "/dashboard/concierge/messages", variant: "secondary" }],
        },
      ]}
      detailSections={[
        {
          title: "Sous-rubriques disponibles",
          description: "Chaque entrée correspond à une étape différente de la relation propriétaire.",
          items: [
            {
              title: "Relations actives",
              description: "Suivi des propriétaires déjà en contact ou en collaboration.",
              href: "/dashboard/concierge/contacts",
              actionLabel: "Ouvrir",
            },
            {
              title: "Pipeline",
              description: "Recherche, prospection et suivi des pistes commerciales.",
              href: "/dashboard/concierge/recherche",
              actionLabel: "Explorer",
            },
            {
              title: "Messages propriétaires",
              description: "Messagerie centralisée pour reprendre les échanges sans friction.",
              href: "/dashboard/concierge/messages",
              actionLabel: "Ouvrir",
            },
          ],
        },
      ]}
    >
      <CompletionStatusCard
        title="Propriétaires"
        description="Complétez cette catégorie pour structurer votre relation commerciale et garder vos échanges visibles."
        percentage={completion.percentage}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
        missingItems={completion.missingItems}
        actionLabel="Ouvrir les relations"
        actionHref="/dashboard/concierge/contacts"
      />
    </CategoryOverviewPage>
  );
}
