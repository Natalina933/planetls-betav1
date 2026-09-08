// Réservé à l’atelier : identités, lieux et activités entièrement fictifs.
export type Space = "admin" | "concierge" | "owner" | "provider";
export type DemoRow = { id: string; title: string; context: string; detail: string; status: string; attention?: boolean };
export type Example = {
  label: string; title: string; description: string; action: string; rowAction: string;
  labels: [string, string, string]; navigation: string[]; explanation: string; empty: string; rows: DemoRow[];
};
export const examples: Record<Space, Example> = {
  admin: {
    label: "Admin", title: "Liste des utilisateurs", description: "Vérifiez les accès et repérez les comptes qui nécessitent un contrôle.",
    action: "Examiner les comptes à vérifier", rowAction: "Examiner", labels: ["Compte", "Espace", "Dernière activité"],
    navigation: ["Utilisateurs", "Contrôle", "Demandes", "Missions"],
    explanation: "Un tableau compact conserve les rôles, l’activité et les statuts côte à côte. Le contrôle des accès est prioritaire. Sur mobile, le tableau défile dans sa propre zone.",
    empty: "Aucun compte à afficher. Revenez à la liste complète pour poursuivre le contrôle.",
    rows: [
      { id: "demo-a1", title: "Compte Démo Alpha", context: "Concierge", detail: "7 sept. 2026 · 09 h", status: "À vérifier", attention: true },
      { id: "demo-a2", title: "Compte Démo Bêta", context: "Propriétaire", detail: "7 sept. 2026 · 08 h", status: "Actif" },
      { id: "demo-a3", title: "Compte Démo Gamma", context: "Artisan", detail: "6 sept. 2026 · 17 h", status: "Actif" },
      { id: "demo-a4", title: "Compte Démo Delta", context: "Concierge", detail: "5 sept. 2026 · 10 h", status: "À vérifier", attention: true },
    ],
  },
  concierge: {
    label: "Concierge", title: "Missions du jour", description: "Lundi 7 septembre 2026 — une journée fictive, organisée par horaire de passage.",
    action: "Voir les missions à préparer", rowAction: "Préparer", labels: ["Horaire", "Mission et logement", "À prévoir"],
    navigation: ["Journée", "Missions", "Demandes reçues", "Devis"],
    explanation: "L’horaire vient en premier, suivi du logement et du matériel à prévoir. Les lignes deviennent des cartes horaires sur mobile pour préparer chaque passage.",
    empty: "Aucune mission prévue dans cette vue. Votre journée de démonstration est libre.",
    rows: [
      { id: "demo-c1", title: "09 h – 10 h", context: "Ménage · Logement Démo A", detail: "Kit de linge à récupérer", status: "À préparer", attention: true },
      { id: "demo-c2", title: "11 h – 12 h", context: "Contrôle · Logement Démo B", detail: "Clés disponibles", status: "Confirmé" },
      { id: "demo-c3", title: "14 h – 15 h", context: "Accueil · Logement Démo C", detail: "Guide d’arrivée prêt", status: "Confirmé" },
      { id: "demo-c4", title: "16 h – 17 h", context: "Inventaire · Logement Démo D", detail: "Liste du matériel à relire", status: "À préparer", attention: true },
    ],
  },
  owner: {
    label: "Propriétaire", title: "Mes logements", description: "Retrouvez vos logements et les informations à compléter pour préparer les prochains séjours.",
    action: "Voir les logements à compléter", rowAction: "Consulter", labels: ["Logement", "Description", "Prochaine étape"],
    navigation: ["Logements", "Réservations", "Prestations", "Factures"],
    explanation: "Les logements disposent de cartes aérées et d’une prochaine étape expliquée. Le vocabulaire décrit ce que vous pouvez faire, sans indicateurs techniques.",
    empty: "Aucun logement dans cette vue. La liste complète vous permet de retrouver vos biens fictifs.",
    rows: [
      { id: "demo-o1", title: "Logement Démo A", context: "Appartement fictif · 2 personnes", detail: "Ajoutez les consignes d’accès pour accueillir sereinement.", status: "À compléter", attention: true },
      { id: "demo-o2", title: "Logement Démo B", context: "Maison fictive · 4 personnes", detail: "Tout est prêt pour le prochain séjour de démonstration.", status: "Prêt" },
      { id: "demo-o3", title: "Logement Démo C", context: "Studio fictif · 2 personnes", detail: "Les informations utiles sont disponibles.", status: "Prêt" },
      { id: "demo-o4", title: "Logement Démo D", context: "Maison fictive · 6 personnes", detail: "Complétez la liste des équipements.", status: "À compléter", attention: true },
    ],
  },
  provider: {
    label: "Artisan", title: "Mes interventions", description: "Préparez vos passages, retrouvez le matériel et les preuves attendues.",
    action: "Voir les interventions à préparer", rowAction: "Voir les consignes", labels: ["Intervention", "Rendez-vous", "Matériel et preuves"],
    navigation: ["Interventions", "Demandes disponibles", "Devis", "Planning"],
    explanation: "Chaque intervention rassemble le rendez-vous, le matériel et les photos attendues. Sur mobile, les cartes et les boutons larges facilitent la consultation sur le terrain.",
    empty: "Aucune intervention dans cette vue. Vous pouvez revenir aux exemples disponibles.",
    rows: [
      { id: "demo-p1", title: "Serrure · Logement Démo A", context: "7 sept. · 09 h", detail: "Cylindre de test · photo après pose", status: "À préparer", attention: true },
      { id: "demo-p2", title: "Volet · Logement Démo B", context: "7 sept. · 11 h", detail: "Outils de réglage · photo du volet", status: "Confirmé" },
      { id: "demo-p3", title: "Robinet · Logement Démo C", context: "7 sept. · 14 h", detail: "Joint de test · compte rendu", status: "Confirmé" },
      { id: "demo-p4", title: "Éclairage · Logement Démo D", context: "8 sept. · 09 h", detail: "Ampoule de test · photo finale", status: "À préparer", attention: true },
    ],
  },
};

export const models = [
  ["Liste", "Titre, description, action, filtres, résultats, tableau ou cartes, pagination et état vide."],
  ["Fiche", "Retour, identité, statut, informations principales, historique et actions autorisées."],
  ["Planning", "Période, filtres, journée ou semaine, événements, conflits et lecture mobile."],
  ["Formulaire", "Explications, sections, champs libellés, erreurs, enregistrement et annulation."],
  ["Finance", "Synthèse expliquée, période, montants, paiements et détail. Graphique uniquement si les données le justifient."],
  ["Communication", "Conversations, participants, messages, pièces jointes, non lus et réponse."],
] as const;
