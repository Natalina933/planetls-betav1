import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

export default function OwnerSettingsPage() {
  return (
    <OwnerWorkspacePage
      eyebrow="Parametres"
      title="Parametres du compte"
      description="Préparez ici la gestion de votre profil, de vos préférences de notification et de vos informations administratives."
      chips={["Profil", "Notifications", "Securite", "Coordonnees"]}
      actions={[
        { label: "Tableau de bord", href: "/dashboard/owner" },
        { label: "Mes documents", href: "/dashboard/owner/documents" },
      ]}
      cards={[
        {
          title: "Profil propriétaire",
          text: "Nous pourrons y consolider les informations de compte, les coordonnées de facturation et les préférences métier.",
        },
        {
          title: "Alertes et notifications",
          text: "Le prochain usage sera de choisir quels événements doivent déclencher un email ou une notification in-app.",
        },
        {
          title: "Securite",
          text: "Cette page sera aussi le bon endroit pour exposer le changement de mot de passe et les informations de session.",
        },
      ]}
    />
  );
}
