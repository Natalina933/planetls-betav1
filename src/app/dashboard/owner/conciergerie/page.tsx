import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

export default function OwnerConciergeriePage() {
  return (
    <OwnerWorkspacePage
      eyebrow="Relation concierge"
      title="Ma conciergerie"
      description="Retrouvez ici le suivi de votre partenariat concierge, les services actifs et les points de coordination essentiels."
      chips={["Services actifs", "SLA", "Support", "Documents"]}
      actions={[
        { label: "Voir mes messages", href: "/dashboard/owner/messages" },
        { label: "Voir mes devis", href: "/dashboard/owner/devis" },
      ]}
      cards={[
        {
          title: "Pilotage de la relation",
          text: "Centralisez les informations de votre concierge principal, les disponibilites et les priorites d'intervention.",
        },
        {
          title: "Services engages",
          text: "Check-in, menage, maintenance, linge et urgences pourront etre consolides ici au fil de l'integration.",
        },
        {
          title: "Prochaine etape",
          text: "La prochaine evolution utile sera d'afficher le concierge attribue et les packs de services associes a chaque bien.",
        },
      ]}
    />
  );
}
