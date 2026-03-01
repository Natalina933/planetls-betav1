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
          text: "Suivez les demandes en attente de validation et les relances a effectuer.",
        },
        {
          title: "Factures emises",
          text: "Retrouvez ici vos factures, leur statut et les paiements a suivre.",
        },
        {
          title: "Marge et rentabilite",
          text: "Cette zone servira a comparer le chiffre facture, les couts engages et la rentabilite par intervention.",
        },
      ]}
    />
  );
}
