import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

export default function OwnerAlertesPage() {
  return (
    <OwnerWorkspacePage
      eyebrow="Alertes"
      title="Alertes et points d'attention"
      description="Une vue prevue pour concentrer les urgences, echeances et actions prioritaires a traiter sur vos biens."
      chips={["Urgences", "Retards", "Factures", "Interventions"]}
      actions={[
        { label: "Voir le planning", href: "/dashboard/owner/planning" },
        { label: "Voir les factures", href: "/dashboard/owner/factures" },
      ]}
      cards={[
        {
          title: "Retards d'intervention",
          text: "Les prochaines versions pourront faire remonter ici les missions en attente, depassees ou non confirmees.",
        },
        {
          title: "Suivi financier",
          text: "Les factures a regler ou les devis en attente de validation auront aussi leur place dans cette vue.",
        },
        {
          title: "Pilotage simplifie",
          text: "L'objectif est de fournir un cockpit prioritaire pour agir sans parcourir chaque module un par un.",
        },
      ]}
    />
  );
}
