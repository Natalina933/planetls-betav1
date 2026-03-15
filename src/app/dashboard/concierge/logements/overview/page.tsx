"use client";

import { useMemo } from "react";
import { CompletionStatusCard } from "@/components/dashboard";
import CategoryOverviewPage from "@/app/dashboard/_components/CategoryOverviewPage";
import { buildConciergeHousingCompletion } from "@/app/dashboard/shared";
import { useConciergeOverviewData } from "../../useConciergeOverviewData";

export default function ConciergeHousingOverviewPage() {
  const { housings } = useConciergeOverviewData();
  const completion = useMemo(() => buildConciergeHousingCompletion(housings), [housings]);

  return (
    <CategoryOverviewPage
      tone="concierge"
      eyebrow="Parc logements"
      title="Vue d'ensemble des logements"
      description="Accédez rapidement à la vue globale de votre parc, puis basculez vers le catalogue, la création ou les stocks selon votre besoin."
      chips={["Vue synthèse", "Catalogue logements", "Stocks & équipements"]}
      actions={[
        { label: "Voir tous les logements", href: "/dashboard/concierge/logements", variant: "primary" },
        { label: "Ajouter un logement", href: "/dashboard/concierge/logements/create", variant: "secondary" },
      ]}
      metrics={[
        { label: "Biens suivis", value: String(housings.length), hint: "Logements dans votre parc" },
        {
          label: "Complétion",
          value: `${completion.percentage}%`,
          hint: `${completion.completedCount}/${completion.totalCount} repères renseignés`,
        },
      ]}
      cards={[
        {
          title: "Tous les logements",
          text: "Consultez l'ensemble des logements gérés et ouvrez chaque fiche opérationnelle.",
          actions: [{ label: "Ouvrir le catalogue", href: "/dashboard/concierge/logements", variant: "primary" }],
        },
        {
          title: "Ajouter un logement",
          text: "Créez une nouvelle fiche logement pour préparer un onboarding propre et exploitable.",
          actions: [{ label: "Créer un logement", href: "/dashboard/concierge/logements/create", variant: "secondary" }],
        },
        {
          title: "Stocks & équipements",
          text: "Gardez une vue claire sur les équipements, consommables et besoins de réassort.",
          actions: [{ label: "Voir les stocks", href: "/dashboard/concierge/stocks", variant: "secondary" }],
        },
      ]}
      detailSections={[
        {
          title: "Accès rapides",
          description: "Les trois points d'entrée utiles pour gérer un bien de bout en bout.",
          items: [
            {
              title: "Catalogue des logements",
              description: "Liste complète, consultation et accès aux fiches détaillées.",
              href: "/dashboard/concierge/logements",
              actionLabel: "Ouvrir",
            },
            {
              title: "Création de logement",
              description: "Ajout guidé d'un nouveau bien dans votre espace conciergerie.",
              href: "/dashboard/concierge/logements/create",
              actionLabel: "Créer",
            },
            {
              title: "Stocks & équipements",
              description: "Suivi des équipements et éléments à maintenir disponibles.",
              href: "/dashboard/concierge/stocks",
              actionLabel: "Ouvrir",
            },
          ],
        },
      ]}
    >
      <CompletionStatusCard
        title="Logements"
        description="Complétez cette catégorie pour rendre votre parc exploitable et maintenir chaque bien opérationnel."
        percentage={completion.percentage}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
        missingItems={completion.missingItems}
        actionLabel="Voir les logements"
        actionHref="/dashboard/concierge/logements"
      />
    </CategoryOverviewPage>
  );
}
