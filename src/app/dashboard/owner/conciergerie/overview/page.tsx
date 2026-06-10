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
      eyebrow="Relation commerciale"
      title="Conciergeries"
      description="Cet espace sert a rechercher un partenaire, suivre vos demandes, echanger avant validation et retrouver vos conciergeries acceptees par logement ou par zone. Les operations terrain restent dans Missions."
      chips={["Recherche", "Demandes", "Partenaires acceptes"]}
      actions={[
        { label: "Rechercher", href: "/dashboard/owner/concierges", variant: "primary" },
        { label: "Demandes", href: "/dashboard/owner/demandes", variant: "secondary" },
      ]}
      completion={{
        title: "Conciergeries",
        description:
          "Completez cette categorie pour structurer votre recherche, vos demandes et vos echanges avec les conciergeries.",
        percentage: completion.percentage,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        missingItems: completion.missingItems,
        actionLabel: "Rechercher",
        actionHref: "/dashboard/owner/concierges",
      }}
      metrics={[
        {
          label: "Discussions",
          value: String(conversations.length),
          hint: "Base de relation actuellement visible",
        },
        {
          label: "Mise en relation",
          value: completion.missingItems.length === 0 ? "Structuree" : "A renforcer",
          hint: "Maturite du dispositif concierge",
        },
      ]}
      cards={[
        {
          title: "Demandes",
          text:
            conversations.length > 0
              ? "Des echanges sont deja ouverts. La priorite est de clarifier les reponses et la prochaine decision partenaire."
              : "Aucun echange actif detecte. Cette vue sert de point de depart pour cadrer votre recherche.",
          actions: [{ label: "Voir les demandes", href: "/dashboard/owner/demandes", variant: "secondary" }],
        },
        {
          title: "Decision recommandee",
          text:
            completion.percentage < 100
              ? "Completez d'abord les elements manquants pour comparer les conciergeries avec plus de confiance."
              : "Vos partenaires acceptes peuvent varier selon les logements et les lieux. Les prochaines operations doivent etre creees depuis Missions.",
          actions: [{ label: "Voir les partenaires", href: "/dashboard/owner/conciergerie/partenaires", variant: "primary" }],
        },
      ]}
    />
  );
}
