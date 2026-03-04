import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

export default function OwnerObjectifsPage() {
  return (
    <OwnerWorkspacePage
      eyebrow="Tableau de bord"
      title="Objectifs de pilotage"
      description="Cadrez vos objectifs de revenus, de qualité de service et de priorisation du parc pour arbitrer plus vite."
      chips={["Revenus cibles", "Occupation", "Qualité perçue", "Priorités du parc"]}
      actions={[
        { label: "Prioriser mes logements", href: "/dashboard/owner/logements" },
        { label: "Revenir au tableau de bord", href: "/dashboard/owner" },
      ]}
      metrics={[
        {
          label: "Objectif revenus",
          value: "À cadrer",
          hint: "Définir un cap mensuel par logement ou par parc",
        },
        {
          label: "Objectif occupation",
          value: "À suivre",
          hint: "Mesurer les périodes creuses et les arbitrages saisonniers",
        },
        {
          label: "Qualité de service",
          value: "À fiabiliser",
          hint: "Suivre avis, réactivité et continuités de service",
        },
      ]}
      cards={[
        {
          title: "1. Fixer le cap",
          text: "Posez un objectif simple par axe : revenu visé, niveau d'occupation souhaité et qualité d'exécution attendue.",
          actions: [{ label: "Voir mes biens", href: "/dashboard/owner/logements", variant: "primary" }],
        },
        {
          title: "2. Organiser par bien",
          text: "Chaque logement doit pouvoir être rattaché à une priorité claire pour arbitrer publication, travaux, conciergerie et budget.",
          actions: [{ label: "Ouvrir mes logements", href: "/dashboard/owner/logements", variant: "secondary" }],
        },
        {
          title: "3. Passer à l'action",
          text: "Transformez vos objectifs en prochaines actions concrètes : finaliser un bien, relancer un concierge, valider un devis ou suivre une facture.",
          actions: [{ label: "Retour au dashboard", href: "/dashboard/owner", variant: "secondary" }],
        },
      ]}
      detailSections={[
        {
          title: "Objectifs à clarifier maintenant",
          description:
            "Les priorités les plus utiles pour un propriétaire sont celles qui aident à décider vite, pas celles qui ajoutent du reporting.",
          items: [
            {
              title: "Définir un objectif par logement",
              meta: "Priorité haute",
              description: "Identifier les biens à développer, stabiliser ou remettre à niveau.",
              href: "/dashboard/owner/logements",
              actionLabel: "Prioriser",
              tone: "warning",
            },
            {
              title: "Fixer un niveau de service attendu",
              meta: "Qualité",
              description: "Clarifier ce qui compte le plus : réactivité, satisfaction, qualité terrain.",
              href: "/dashboard/owner/conciergerie",
              actionLabel: "Voir ma conciergerie",
            },
            {
              title: "Aligner budget et execution",
              meta: "Finance",
              description: "Croiser devis, factures et interventions pour arbitrer sans angle mort.",
              href: "/dashboard/owner/factures",
              actionLabel: "Ouvrir le suivi financier",
            },
          ],
        },
      ]}
    />
  );
}
