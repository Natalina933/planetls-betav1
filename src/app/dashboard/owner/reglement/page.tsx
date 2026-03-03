import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

export default function OwnerReglementPage() {
  return (
    <OwnerWorkspacePage
      eyebrow="Paiements"
      title="Reglements et paiements"
      description="Retrouvez ici la vision de vos paiements, des méthodes de règlement et du suivi administratif associé."
      chips={["Paiements", "Factures", "Abonnements", "Historique"]}
      actions={[
        { label: "Voir mes factures", href: "/dashboard/owner/factures" },
        { label: "Voir les documents", href: "/dashboard/owner/documents" },
      ]}
      metrics={[
        {
          label: "Vue règlements",
          value: "En préparation",
          hint: "Cette brique accueillera le suivi des paiements effectifs",
        },
        {
          label: "Source principale",
          value: "Factures",
          hint: "Le pilotage actif passe deja par le suivi facture",
        },
      ]}
      cards={[
        {
          title: "1. Paiements centralises",
          text: "Cette page est destinée à consolider factures, règlements reçus et futurs flux de paiement.",
        },
        {
          title: "2. Suivi administratif",
          text: "Elle pourra aussi exposer les coordonnées de facturation et les méthodes de paiement enregistrées.",
        },
        {
          title: "3. Prochaine etape",
          text: "La base de paiement deja presente permettra d'y connecter ensuite des parcours plus complets.",
        },
      ]}
    />
  );
}
