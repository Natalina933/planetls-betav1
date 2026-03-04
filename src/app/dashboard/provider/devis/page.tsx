import ProviderWorkspacePage from "../_components/ProviderWorkspacePage";

export default function ProviderDevisPage() {
  return (
    <ProviderWorkspacePage
      eyebrow="Finance"
      title="Devis et factures"
      description="Centralisez vos propositions commerciales, vos validations et votre suivi de facturation."
      chips={["Devis", "Factures", "Paiements"]}
      actions={[
        { label: "Voir les clients", href: "/dashboard/provider/clients" },
        { label: "Voir la vue d'ensemble", href: "/dashboard/provider" },
      ]}
      cards={[
        {
          title: "Devis en attente",
          text: "Suivez les demandes en attente de validation et les relances à effectuer.",
        },
        {
          title: "Factures émises",
          text: "Retrouvez ici vos factures, leur statut et les paiements à suivre.",
        },
        {
          title: "Marge et rentabilité",
          text: "Cette zone servira à comparer le chiffre facturé, les coûts engagés et la rentabilité par intervention.",
        },
      ]}
    />
  );
}
