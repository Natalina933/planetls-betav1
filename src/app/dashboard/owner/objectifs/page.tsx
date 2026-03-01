import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

export default function OwnerObjectifsPage() {
  return (
    <OwnerWorkspacePage
      eyebrow="Objectifs"
      title="Objectifs"
      description="Preparez ici le suivi de vos objectifs de revenus, d'occupation et de qualite de service."
      chips={["Revenus", "Occupation", "Qualite", "Croissance"]}
      actions={[
        { label: "Voir mes biens", href: "/dashboard/owner/logements" },
        { label: "Voir la vue d'ensemble", href: "/dashboard/owner" },
      ]}
      cards={[
        {
          title: "Objectifs business",
          text: "Le module pourra suivre le revenu mensuel vise, le taux d'occupation et les priorites de rentabilite.",
        },
        {
          title: "Vision par bien",
          text: "Chaque logement pourra etre rattache a un objectif pour mieux prioriser vos arbitrages operationnels.",
        },
        {
          title: "Aide a la decision",
          text: "Cette couche sera utile plus tard pour comparer vos resultats reels avec vos ambitions de portefeuille.",
        },
      ]}
    />
  );
}
