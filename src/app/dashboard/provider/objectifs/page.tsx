import ProviderWorkspacePage from "../_components/ProviderWorkspacePage";

export default function ProviderObjectifsPage() {
  return (
    <ProviderWorkspacePage
      eyebrow="Pilotage"
      title="Objectifs"
      description="Suivez vos objectifs de charge, de chiffre d'affaires et de qualite d'execution."
      chips={["Revenus", "Charge", "Qualite"]}
      actions={[
        { label: "Voir les devis et factures", href: "/dashboard/provider/devis" },
        { label: "Voir la vue d'ensemble", href: "/dashboard/provider" },
      ]}
      cards={[
        {
          title: "Objectifs d'activite",
          text: "Comparez vos interventions prevues, realisees et facturees pour piloter votre rythme mensuel.",
        },
        {
          title: "Objectifs financiers",
          text: "Cette zone servira a suivre vos montants signes, factures et encaisses.",
        },
        {
          title: "Qualite de service",
          text: "Ajoutez ici des indicateurs de delais, de satisfaction et de taux de reouverture pour fiabiliser l'execution.",
        },
      ]}
    />
  );
}
