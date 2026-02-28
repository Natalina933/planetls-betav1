import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

export default function OwnerStocksPage() {
  return (
    <OwnerWorkspacePage
      eyebrow="Stocks"
      title="Stocks et consommables"
      description="Anticipez ici le suivi du linge, des produits d'accueil et des consommables necessaires a vos biens."
      chips={["Linge", "Accueil", "Menage", "Consommables"]}
      actions={[
        { label: "Mes logements", href: "/dashboard/owner/logements" },
        { label: "Planning", href: "/dashboard/owner/planning" },
      ]}
      cards={[
        {
          title: "Vision logistique",
          text: "Cette page preparera le suivi des articles critiques pour eviter les oublis avant une arrivee voyageur.",
        },
        {
          title: "Coordination concierge",
          text: "Le stock pourra etre relie aux missions de menage et de preparation pour fluidifier les operations.",
        },
        {
          title: "Valeur produit",
          text: "C'est une brique utile pour professionnaliser la gestion de plusieurs logements sans outils disperses.",
        },
      ]}
    />
  );
}
