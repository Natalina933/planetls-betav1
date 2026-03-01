import ProviderWorkspacePage from "../_components/ProviderWorkspacePage";

export default function ProviderPlanningPage() {
  return (
    <ProviderWorkspacePage
      eyebrow="Organisation"
      title="Planning"
      description="Organisez vos rendez-vous, vos chantiers et vos echeances depuis un planning unique."
      chips={["Agenda", "Echeances", "Coordination"]}
      actions={[
        { label: "Voir les interventions", href: "/dashboard/provider/interventions" },
        { label: "Voir les clients", href: "/dashboard/provider/clients" },
      ]}
      cards={[
        {
          title: "Semaine en cours",
          text: "Le planning mettra en avant les visites, interventions et livraisons les plus urgentes.",
        },
        {
          title: "Charge par jour",
          text: "Visualisez rapidement les jours les plus charges pour mieux repartir vos interventions.",
        },
        {
          title: "Coordination equipes",
          text: "Cette vue servira a synchroniser les disponibilites, les rendez-vous et les validations terrain.",
        },
      ]}
    />
  );
}
