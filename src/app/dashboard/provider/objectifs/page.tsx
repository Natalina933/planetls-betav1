import ProviderWorkspacePage from "../_components/ProviderWorkspacePage";

export default function ProviderObjectifsPage() {
  return (
    <ProviderWorkspacePage
      eyebrow="Pilotage artisan"
      title="Objectifs d'activite"
      description="Cadrez vos objectifs de charge, de chiffre d'affaires et de qualite d'execution pour arbitrer plus vite."
      chips={["Revenus", "Charge", "Qualite", "Execution"]}
      actions={[
        { label: "Voir les devis et factures", href: "/dashboard/provider/devis" },
        { label: "Revenir a la vue prioritaire", href: "/dashboard/provider" },
      ]}
      metrics={[
        {
          label: "Objectif charge",
          value: "A cadrer",
          hint: "Definir le bon niveau de capacite par semaine",
        },
        {
          label: "Objectif revenus",
          value: "A suivre",
          hint: "Croiser signe, facture et encaisse",
        },
        {
          label: "Qualite execution",
          value: "A fiabiliser",
          hint: "Delais, satisfaction et reouverture",
        },
      ]}
      cards={[
        {
          title: "1. Rythme d'activite",
          text: "Comparez vos interventions prevues, realisees et facturees pour piloter votre cadence mensuelle.",
        },
        {
          title: "2. Objectifs financiers",
          text: "Cette zone servira a suivre vos montants signes, factures et encaisses.",
        },
        {
          title: "3. Qualite de service",
          text: "Ajoutez ici des indicateurs de delais, de satisfaction et de taux de reouverture pour fiabiliser l'execution.",
        },
      ]}
    />
  );
}
