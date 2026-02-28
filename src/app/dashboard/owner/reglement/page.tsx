import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

export default function OwnerReglementPage() {
  return (
    <OwnerWorkspacePage
      eyebrow="Reglement"
      title="Reglement et paiements"
      description="Retrouvez ici la vision de vos paiements, des methodes de reglement et du suivi administratif associe."
      chips={["Paiements", "Factures", "Abonnements", "Historique"]}
      actions={[
        { label: "Mes factures", href: "/dashboard/owner/factures" },
        { label: "Concierge PRO", href: "/abonnement/concierge-pro" },
      ]}
      cards={[
        {
          title: "Paiements centralises",
          text: "Cette page est destinee a consolider les factures, reglements recus et futurs flux de paiement Stripe.",
        },
        {
          title: "Suivi administratif",
          text: "Elle pourra aussi exposer les coordonnees de facturation et les methodes de paiement enregistrees.",
        },
        {
          title: "Etape suivante",
          text: "La base Stripe posee aujourd'hui permettra d'y connecter ensuite les vrais parcours de paiement.",
        },
      ]}
    />
  );
}
