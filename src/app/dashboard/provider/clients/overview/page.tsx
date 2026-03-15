"use client";

import { CompletionStatusCard } from "@/components/dashboard";
import { buildProviderClientsCompletion } from "@/app/dashboard/shared";
import { useProviderDashboardData } from "../../useProviderDashboardData";
import CategoryOverviewPage from "@/app/dashboard/_components/CategoryOverviewPage";

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
      eyebrow="Relation client"
      title="Vue d'ensemble des clients"
      description="Regroupez vos clients et leurs conversations avant d'ouvrir la gestion détaillée du portefeuille."
      chips={["Vue synthèse", "Suivi clients", "Conversations"]}
      actions={[
        { label: "Voir les clients", href: "/dashboard/provider/clients", variant: "primary" },
        { label: "Ouvrir les messages", href: "/dashboard/provider/messages", variant: "secondary" },
      ]}
      metrics={[
        { label: "Clients", value: String(clients.length), hint: "Portefeuille actuel" },
        { label: "Messages", value: String(conversations.length), hint: "Échanges disponibles" },
        { label: "Complétion", value: `${completion.percentage}%`, hint: `${completion.completedCount}/${completion.totalCount} repères validés` },
      ]}
      cards={[
        { title: "Suivi clients", text: "Gérez les fiches clients et gardez les informations importantes bien organisées.", actions: [{ label: "Ouvrir les clients", href: "/dashboard/provider/clients", variant: "primary" }] },
        { title: "Conversations clients", text: "Reprenez les échanges clients depuis la messagerie dédiée au provider.", actions: [{ label: "Ouvrir les messages", href: "/dashboard/provider/messages", variant: "secondary" }] },
      ]}
    >
      <CompletionStatusCard
        title="Clients"
        description="Complétez cette catégorie pour structurer votre portefeuille client et garder les échanges accessibles."
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
