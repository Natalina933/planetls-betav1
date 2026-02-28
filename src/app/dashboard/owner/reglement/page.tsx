import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

export default function OwnerReglementPage() {
  return (
    <OwnerWorkspacePage
      eyebrow="Reglement"
      title="Règlement et paiements"
      description="Retrouvez ici la vision de vos paiements, des méthodes de règlement et du suivi administratif associé."
      chips={["Paiements", "Factures", "Abonnements", "Historique"]}
      actions={[
        { label: "Mes factures", href: "/dashboard/owner/factures" },
        { label: "Concierge PRO", href: "/abonnement/concierge-pro" },
      ]}
      cards={[
        {
          title: "Paiements centralises",
          text: "Cette page est destinée à consolider les factures, règlements reçus et futurs flux de paiement Stripe.",
        },
        {
          title: "Suivi administratif",
          text: "Elle pourra aussi exposer les coordonnées de facturation et les méthodes de paiement enregistrées.",
        },
        {
          title: "Etape suivante",
          text: "La base Stripe posee aujourd'hui permettra d'y connecter ensuite les vrais parcours de paiement.",
        },
      ]}
    />
  );
}
