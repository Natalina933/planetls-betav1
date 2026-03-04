import ProviderWorkspacePage from "../_components/ProviderWorkspacePage";

export default function ProviderObjectifsPage() {
  return (
    <ProviderWorkspacePage
      eyebrow="Tableau de bord"
      title="Objectifs d'activité"
      description="Cadrez vos objectifs de charge, de chiffre d'affaires et de qualité d'exécution pour arbitrer plus vite."
      chips={["Revenus", "Charge", "Qualité", "Exécution"]}
      actions={[
        { label: "Voir les devis et factures", href: "/dashboard/provider/devis" },
        { label: "Revenir au tableau de bord", href: "/dashboard/provider" },
      ]}
      metrics={[
        {
          label: "Objectif charge",
          value: "À cadrer",
          hint: "Définir le bon niveau de capacité par semaine",
        },
        {
          label: "Objectif revenus",
          value: "À suivre",
          hint: "Croiser signé, facturé et encaissé",
        },
        {
          label: "Qualité d'exécution",
          value: "À fiabiliser",
          hint: "Délais, satisfaction et réouverture",
        },
      ]}
      cards={[
        {
          title: "1. Rythme d'activité",
          text: "Comparez vos interventions prévues, réalisées et facturées pour piloter votre cadence mensuelle.",
        },
        {
          title: "2. Objectifs financiers",
          text: "Cette zone servira à suivre vos montants signés, factures et encaissements.",
        },
        {
          title: "3. Qualité de service",
          text: "Ajoutez ici des indicateurs de délais, de satisfaction et de taux de réouverture pour fiabiliser l'exécution.",
        },
      ]}
    />
  );
}
