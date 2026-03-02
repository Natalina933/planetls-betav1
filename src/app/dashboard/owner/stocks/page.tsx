import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

export default function OwnerStocksPage() {
  return (
    <OwnerWorkspacePage
      eyebrow="Logistique du parc"
      title="Stocks et consommables"
      description="Anticipez ici le suivi du linge, des produits d'accueil et des consommables necessaires a vos biens."
      chips={["Linge", "Accueil", "Menage", "Consommables"]}
      actions={[
        { label: "Voir mes logements", href: "/dashboard/owner/logements" },
        { label: "Voir le planning", href: "/dashboard/owner/planning" },
      ]}
      metrics={[
        {
          label: "Usage attendu",
          value: "A cadrer",
          hint: "Relier bientot le stock a la cadence des interventions",
        },
        {
          label: "Point de vigilance",
          value: "Rotation",
          hint: "Le linge et les consommables restent les premiers irritants a anticiper",
        },
      ]}
      cards={[
        {
          title: "1. Vision logistique",
          text: "Cette page preparera le suivi des articles critiques pour eviter les oublis avant une arrivee voyageur.",
        },
        {
          title: "2. Coordination concierge",
          text: "Le stock pourra etre relie aux missions de menage et de preparation pour fluidifier les operations.",
        },
        {
          title: "3. Valeur de pilotage",
          text: "C'est une brique utile pour professionnaliser la gestion de plusieurs logements sans outils disperses.",
        },
      ]}
    />
  );
}
