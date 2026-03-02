import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

export default function OwnerObjectifsPage() {
  return (
    <OwnerWorkspacePage
      eyebrow="Pilotage proprietaire"
      title="Objectifs de pilotage"
      description="Cadrez vos objectifs de revenus, de qualite de service et de priorisation du parc pour arbitrer plus vite."
      chips={["Revenus cibles", "Occupation", "Qualite percue", "Priorites du parc"]}
      actions={[
        { label: "Prioriser mes logements", href: "/dashboard/owner/logements" },
        { label: "Revenir a la vue prioritaire", href: "/dashboard/owner" },
      ]}
      metrics={[
        {
          label: "Objectif revenus",
          value: "A cadrer",
          hint: "Definir un cap mensuel par logement ou par parc",
        },
        {
          label: "Objectif occupation",
          value: "A suivre",
          hint: "Mesurer les periodes creuses et les arbitrages saisonniers",
        },
        {
          label: "Qualite de service",
          value: "A fiabiliser",
          hint: "Suivre avis, reactivite et continuites de service",
        },
      ]}
      cards={[
        {
          title: "1. Fixer le cap",
          text: "Posez un objectif simple par axe : revenu vise, niveau d'occupation souhaite et qualite d'execution attendue.",
          actions: [{ label: "Voir mes biens", href: "/dashboard/owner/logements", variant: "primary" }],
        },
        {
          title: "2. Organiser par bien",
          text: "Chaque logement doit pouvoir etre rattache a une priorite claire pour arbitrer publication, travaux, conciergerie et budget.",
          actions: [{ label: "Ouvrir mes logements", href: "/dashboard/owner/logements", variant: "secondary" }],
        },
        {
          title: "3. Passer a l'action",
          text: "Transformez vos objectifs en prochaines actions concretes : finaliser un bien, relancer un concierge, valider un devis ou suivre une facture.",
          actions: [{ label: "Retour au dashboard", href: "/dashboard/owner", variant: "secondary" }],
        },
      ]}
      detailSections={[
        {
          title: "Objectifs a clarifier maintenant",
          description:
            "Les priorites les plus utiles pour un proprietaire sont celles qui aident a decider vite, pas celles qui ajoutent du reporting.",
          items: [
            {
              title: "Definir un objectif par logement",
              meta: "Priorite haute",
              description: "Identifier les biens a developper, stabiliser ou remettre a niveau.",
              href: "/dashboard/owner/logements",
              actionLabel: "Prioriser",
              tone: "warning",
            },
            {
              title: "Fixer un niveau de service attendu",
              meta: "Qualite",
              description: "Clarifier ce qui compte le plus : reactivite, satisfaction, qualite terrain.",
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
