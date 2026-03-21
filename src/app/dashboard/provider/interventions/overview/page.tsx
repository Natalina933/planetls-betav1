"use client";

import SimpleOverviewWorkspace from "@/app/dashboard/_components/SimpleOverviewWorkspace";
import { buildProviderInterventionsCompletion } from "@/app/dashboard/shared";
import { useProviderDashboardData } from "../../useProviderDashboardData";

export default function ProviderInterventionsOverviewPage() {
  const { dashboard } = useProviderDashboardData();
  const interventions = dashboard?.interventions ?? [];
  const alerts = dashboard?.alerts ?? [];
  const conversations = dashboard?.conversations ?? [];
  const completion = buildProviderInterventionsCompletion({
    interventions: interventions as Record<string, unknown>[],
    alerts: alerts as Record<string, unknown>[],
    conversations: conversations as Record<string, unknown>[],
  });

  return (
    <SimpleOverviewWorkspace
      tone="provider"
      eyebrow="Pilotage des interventions"
      title="Vue d'ensemble des interventions"
      description="Cette vue rassemble uniquement l'etat de vos interventions. Les sous-rubriques servent ensuite a suivre le planning, les alertes et les messages associes, sans redondance."
      chips={["Planning", "Urgences", "Points en attente"]}
      actions={[
        { label: "Voir les interventions", href: "/dashboard/provider/interventions", variant: "primary" },
        { label: "Ouvrir les messages", href: "/dashboard/provider/messages", variant: "secondary" },
      ]}
      completion={{
        title: "Interventions",
        description:
          "Completez cette categorie pour structurer votre organisation terrain et suivre vos missions sans zone floue.",
        percentage: completion.percentage,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        missingItems: completion.missingItems,
        actionLabel: "Voir les interventions",
        actionHref: "/dashboard/provider/interventions",
      }}
      metrics={[
        {
          label: "Interventions",
          value: String(interventions.length),
          hint: "Volume terrain actuellement suivi",
        },
        {
          label: "Alertes",
          value: String(alerts.length),
          hint: "Points de vigilance a traiter",
        },
        {
          label: "Conversations",
          value: String(conversations.length),
          hint: "Messages lies a l'execution",
        },
      ]}
      cards={[
        {
          title: "Sante operationnelle",
          text:
            alerts.length > 0
              ? `${alerts.length} alerte(s) sont ouvertes. Commencez par securiser les dossiers urgents avant de densifier le planning.`
              : "Aucune alerte bloquante pour le moment. Vous pouvez concentrer l'effort sur la qualite d'execution et la marge.",
          actions: [{ label: "Voir les alertes", href: "/dashboard/provider/alertes", variant: "secondary" }],
        },
        {
          title: "Decision recommandee",
          text:
            interventions.length > 0
              ? "Utilisez cette vue comme porte d'entree strategique, puis basculez dans le reporting pour suivre les statuts, delais et messages dossier par dossier."
              : "Structurez d'abord votre base d'interventions pour rendre la lecture planning et reporting reellement exploitable.",
          actions: [{ label: "Ouvrir le planning", href: "/dashboard/provider/planning", variant: "primary" }],
        },
      ]}
      detailSections={[
        {
          title: "Urgences a surveiller",
          description: "Les elements qui meritent une lecture proche avant d'entrer dans l'execution detaillee.",
          items: alerts.slice(0, 3).map((alert, index) => {
            const currentAlert = alert as { id?: string; title?: string; body?: string };
            return {
              id: currentAlert.id || `alert-${index}`,
              title: currentAlert.title || `Alerte ${index + 1}`,
              meta: "A surveiller",
              tone: "warning" as const,
              description: currentAlert.body || "Revue terrain recommandee.",
              href: "/dashboard/provider/alertes",
              actionLabel: "Traiter",
            };
          }),
          emptyText: "Aucune alerte immediate dans cette categorie.",
        },
      ]}
    />
  );
}
