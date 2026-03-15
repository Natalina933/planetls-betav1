"use client";

import { useMemo } from "react";
import CategoryOverviewCompletion from "@/app/dashboard/_components/CategoryOverviewCompletion";
import CategoryOverviewPage from "@/app/dashboard/_components/CategoryOverviewPage";
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
    <CategoryOverviewPage
      tone="concierge"
      eyebrow="Pilotage des missions"
      title="Vue d'ensemble des missions"
      description="Retrouvez ici vos priorités opérationnelles avant d'ouvrir le planning, les urgences ou la configuration de services."
      chips={[
        "Vue synthèse",
        "Planning, demandes, urgences",
        "Services & disponibilités",
      ]}
      actions={[
        { label: "Ouvrir le planning", href: "/dashboard/concierge/planning", variant: "primary" },
        {
          label: "Configurer mes services",
          href: "/dashboard/concierge/profile?tab=missions",
          variant: "secondary",
        },
      ]}
      metrics={[
        { label: "Demandes", value: String(requests.length), hint: "Demandes reçues dans la catégorie" },
        {
          label: "Messages",
          value: String(conversations.length),
          hint: "Conversations propriétaires disponibles",
        },
        {
          label: "Configuration",
          value: `${completion.percentage}%`,
          hint: `${completion.completedCount}/${completion.totalCount} points prêts`,
        },
      ]}
      cards={[
        {
          title: "Vue missions",
          text: "Pilotez les missions à venir, les affectations et les créneaux à surveiller en priorité.",
          actions: [{ label: "Ouvrir la vue missions", href: "/dashboard/concierge/planning", variant: "primary" }],
        },
        {
          title: "Demandes reçues",
          text: "Regroupez les demandes propriétaires à qualifier, relancer ou convertir en mission.",
          actions: [{ label: "Voir les demandes", href: "/dashboard/concierge/demandes", variant: "secondary" }],
        },
        {
          title: "Urgences et messages",
          text: "Gardez les conversations critiques et les interventions urgentes accessibles sans quitter cette catégorie.",
          actions: [
            { label: "Ouvrir les urgences", href: "/dashboard/concierge/urgences", variant: "secondary" },
            { label: "Ouvrir les messages", href: "/dashboard/concierge/messages", variant: "secondary" },
          ],
        },
      ]}
    >
      <CategoryOverviewCompletion
        title="Missions"
        description="Complétez cette catégorie pour structurer votre organisation terrain et recevoir des demandes qualifiées."
        percentage={completion.percentage}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
        missingItems={completion.missingItems}
        actionLabel="Configurer mes missions"
        actionHref="/dashboard/concierge/profile?tab=missions"
      />
    </CategoryOverviewPage>
  );
}
