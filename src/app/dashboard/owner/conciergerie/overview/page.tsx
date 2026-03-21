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
      description="Cette vue rassemble uniquement l'etat de votre relation conciergerie. Les sous-rubriques servent ensuite a chercher, suivre et echanger avec les conciergeries, sans redondance."
      chips={["Vue synthese", "Demandes a traiter", "Points en attente"]}
      actions={[
        { label: "Trouver un concierge", href: "/dashboard/owner/concierges", variant: "primary" },
        { label: "Voir les contacts", href: "/dashboard/owner/contacts", variant: "secondary" },
      ]}
      completion={{
        title: "Conciergerie",
        description:
          "Completez cette categorie pour structurer votre recherche, vos relations et vos echanges avec les conciergeries.",
        percentage: completion.percentage,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        missingItems: completion.missingItems,
        actionLabel: "Trouver un concierge",
        actionHref: "/dashboard/owner/concierges",
      }}
      metrics={[
        {
          label: "Echanges suivis",
          value: String(conversations.length),
          hint: "Base de relation actuellement visible",
        },
        {
          label: "Recherche",
          value: completion.missingItems.length === 0 ? "Structuree" : "A renforcer",
          hint: "Maturite du dispositif concierge",
        },
      ]}
      cards={[
        {
          title: "Sante relationnelle",
          text:
            conversations.length > 0
              ? "Des echanges sont deja ouverts. La priorite est de clarifier le suivi concierge, les reponses et les prochaines decisions."
              : "Aucun echange actif detecte. Cette vue doit surtout servir de point de depart pour cadrer votre recherche.",
          actions: [{ label: "Voir les contacts", href: "/dashboard/owner/contacts", variant: "secondary" }],
        },
        {
          title: "Decision recommandee",
          text:
            completion.percentage < 100
              ? "Completez d'abord les elements manquants pour comparer les conciergeries avec plus de confiance."
              : "Vous pouvez maintenant utiliser les pages de suivi pour piloter la qualite de service et la reactivite.",
          actions: [{ label: "Trouver un concierge", href: "/dashboard/owner/concierges", variant: "primary" }],
        },
      ]}
    />
  );
}
