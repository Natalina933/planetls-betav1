"use client";

import SimpleOverviewWorkspace from "@/app/dashboard/_components/SimpleOverviewWorkspace";
import { buildProviderClientsCompletion } from "@/app/dashboard/shared";
import { useProviderDashboardData } from "../../useProviderDashboardData";

export default function ProviderClientsOverviewPage() {
  const { dashboard } = useProviderDashboardData();
  const clients = dashboard?.clients ?? [];
  const conversations = dashboard?.conversations ?? [];
  const completion = buildProviderClientsCompletion({
    clients: clients as Record<string, unknown>[],
    conversations: conversations as Record<string, unknown>[],
  });

  return (
    <SimpleOverviewWorkspace
      tone="provider"
      eyebrow="Relations clients"
      title="Vue d'ensemble des clients"
      description="Cette vue rassemble uniquement l'etat de vos clients. Les sous-rubriques servent ensuite a suivre vos clients et vos conversations, sans redondance."
      chips={["Vue synthese", "Demandes a traiter", "Points en attente"]}
      actions={[
        { label: "Voir les clients", href: "/dashboard/provider/clients", variant: "primary" },
        { label: "Voir les messages", href: "/dashboard/provider/messages", variant: "secondary" },
      ]}
      completion={{
        title: "Clients",
        description:
          "Completez cette categorie pour disposer d'un suivi client structure et facilement exploitable.",
        percentage: completion.percentage,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        missingItems: completion.missingItems,
        actionLabel: "Voir les clients",
        actionHref: "/dashboard/provider/clients",
      }}
    />
  );
}
