import ProviderWorkspacePage from "../_components/ProviderWorkspacePage";

export default function ProviderOutilsPage() {
  return (
    <ProviderWorkspacePage
      eyebrow="Operations"
      title="Outils"
      description="Accédez ici aux outils métier, aux ressources utiles et aux automatismes de votre activité."
      chips={["Outils", "Ressources", "Automatisation"]}
      actions={[
        { label: "Voir le planning", href: "/dashboard/provider/planning" },
        { label: "Voir les alertes", href: "/dashboard/provider/alertes" },
      ]}
      cards={[
        {
          title: "Boite a outils",
          text: "Cette zone pourra regrouper vos modeles, checklists, documents type et raccourcis du quotidien.",
        },
        {
          title: "Automatismes",
          text: "Des outils d'assistance pourront aider a accelerer vos devis, suivis et comptes rendus.",
        },
        {
          title: "Pilotage technique",
          text: "Conservez une vue claire sur les outils utilises pour chaque intervention ou type de client.",
        },
      ]}
    />
  );
}
