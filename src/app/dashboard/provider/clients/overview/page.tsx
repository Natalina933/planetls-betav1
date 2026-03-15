"use client";

import CategoryOverviewCompletion from "@/app/dashboard/_components/CategoryOverviewCompletion";
import CategoryOverviewPage from "@/app/dashboard/_components/CategoryOverviewPage";
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
    <CategoryOverviewPage
      tone="provider"
      eyebrow="Relations clients"
      title="Vue d'ensemble des clients"
      description="Gardez un point d'entrée clair sur vos clients, leurs échanges et les suivis à maintenir."
      chips={["Vue synthèse", "Suivi clients", "Conversations"]}
      actions={[
        { label: "Voir les clients", href: "/dashboard/provider/clients", variant: "primary" },
      ]}
      metrics={[
        { label: "Clients", value: String(clients.length), hint: "Base suivie" },
        { label: "Conversations", value: String(conversations.length), hint: "Échanges disponibles" },
        {
          label: "Complétion",
          value: `${completion.percentage}%`,
          hint: `${completion.completedCount}/${completion.totalCount} repères validés`,
        },
      ]}
      cards={[
        {
          title: "Suivi clients",
          text: "Retrouvez les clients actifs et les informations utiles à la relation quotidienne.",
          actions: [{ label: "Ouvrir", href: "/dashboard/provider/clients", variant: "primary" }],
        },
        {
          title: "Conversations clients",
          text: "Gardez les échanges opérationnels accessibles depuis cette catégorie.",
          actions: [{ label: "Voir les messages", href: "/dashboard/provider/messages", variant: "secondary" }],
        },
      ]}
    >
      <CategoryOverviewCompletion
        title="Clients"
        description="Complétez cette catégorie pour disposer d'un suivi client structuré et facilement exploitable."
        percentage={completion.percentage}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
        missingItems={completion.missingItems}
        actionLabel="Voir les clients"
        actionHref="/dashboard/provider/clients"
      />
    </CategoryOverviewPage>
  );
}
