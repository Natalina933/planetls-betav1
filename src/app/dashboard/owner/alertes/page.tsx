import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

export default function OwnerAlertesPage() {
  return (
    <OwnerWorkspacePage
      eyebrow="Alertes"
      title="Alertes et points d'attention"
      description="Une vue prévue pour concentrer les urgences, échéances et actions prioritaires à traiter sur vos biens."
      chips={["Urgences", "Retards", "Factures", "Interventions"]}
      actions={[
        { label: "Voir le planning", href: "/dashboard/owner/planning" },
        { label: "Voir les factures", href: "/dashboard/owner/factures" },
      ]}
      cards={[
        {
          title: "Retards d'intervention",
          text: "Les prochaines versions pourront faire remonter ici les missions en attente, dépassées ou non confirmées.",
        },
        {
          title: "Suivi financier",
          text: "Les factures à régler ou les devis en attente de validation auront aussi leur place dans cette vue.",
        },
        {
          title: "Pilotage simplifié",
          text: "L'objectif est de fournir un cockpit prioritaire pour agir sans parcourir chaque module un par un.",
        },
      ]}
    />
  );
}
