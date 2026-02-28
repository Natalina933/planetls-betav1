import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

export default function OwnerContactsPage() {
  return (
    <OwnerWorkspacePage
      eyebrow="Contacts"
      title="Mes contacts"
      description="Gardez sous la main vos interlocuteurs operationnels pour la gestion locative saisonniere."
      chips={["Concierges", "Prestataires", "Urgences"]}
      actions={[
        { label: "Messagerie", href: "/dashboard/owner/messages" },
        { label: "Planning", href: "/dashboard/owner/planning" },
      ]}
      cards={[
        {
          title: "Reseau operationnel",
          text: "Cette page servira a lister vos concierges, artisans et contacts de confiance relies a vos logements.",
        },
        {
          title: "Fiche contact",
          text: "Nous pourrons y ajouter le telephone, l'email, la zone d'intervention et le type de missions pris en charge.",
        },
        {
          title: "Priorite produit",
          text: "La prochaine iteration pourra relier automatiquement les contacts aux conversations et aux logements concernes.",
        },
      ]}
    />
  );
}
