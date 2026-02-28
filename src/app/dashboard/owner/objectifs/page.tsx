import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

export default function OwnerObjectifsPage() {
  return (
    <OwnerWorkspacePage
      eyebrow="Objectifs"
      title="Objectifs de performance"
      description="Préparez ici le suivi de vos objectifs de revenus, d'occupation et de qualité de service."
      chips={["Revenus", "Occupation", "Qualite", "Croissance"]}
      actions={[
        { label: "Mes logements", href: "/dashboard/owner/logements" },
        { label: "Mon tableau de bord", href: "/dashboard/owner" },
      ]}
      cards={[
        {
          title: "Objectifs business",
          text: "Le module pourra suivre le revenu mensuel visé, le taux d'occupation et les priorités de rentabilité.",
        },
        {
          title: "Vision par bien",
          text: "Chaque logement pourra être rattaché à un objectif pour mieux prioriser vos arbitrages opérationnels.",
        },
        {
          title: "Aide a la decision",
          text: "Cette couche sera utile plus tard pour comparer vos résultats réels avec vos ambitions de portefeuille.",
        },
      ]}
    />
  );
}
