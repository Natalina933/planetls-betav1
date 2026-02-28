import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

export default function OwnerDocumentsPage() {
  return (
    <OwnerWorkspacePage
      eyebrow="Documents"
      title="Mes documents"
      description="Centralisez vos pieces administratives, contrats, devis, factures et documents de logement."
      chips={["Contrats", "Factures", "Guides logement"]}
      actions={[
        { label: "Voir mes factures", href: "/dashboard/owner/factures" },
        { label: "Voir mes devis", href: "/dashboard/owner/devis" },
      ]}
      cards={[
        {
          title: "Archive centralisee",
          text: "Cette zone est prevue pour regrouper contrats, PDF, consignes d'accueil et documents utiles a l'exploitation.",
        },
        {
          title: "Acces rapide",
          text: "Le prochain pas naturel sera de brancher ici les apercus PDF de devis et de factures deja generes par l'API.",
        },
        {
          title: "Vision tout-en-un",
          text: "L'objectif est de reduire les allers-retours entre emails, drive et plateforme pour professionnaliser le suivi.",
        },
      ]}
    />
  );
}
