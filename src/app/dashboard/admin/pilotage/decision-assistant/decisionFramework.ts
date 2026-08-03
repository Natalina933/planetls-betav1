export type DecisionStep = {
  id: string;
  title: string;
  description: string;
  outputs: string[];
};

export type StrategicQuestion = {
  id: string;
  category: string;
  question: string;
  whyItMatters: string;
};

export type DecisionCriterion = {
  id: string;
  label: string;
  focus: string;
};

export const decisionPrinciples = [
  "Ne jamais valider une idee sans la challenger.",
  "Privilegier creation de valeur, simplicite, rentabilite et execution.",
  "Proteger la qualite de vie de la fondatrice autant que la roadmap.",
  "Reporter une decision quand les donnees sont trop faibles pour trancher proprement.",
];

export const decisionTriggers = [
  "Lancer ou reporter une fonctionnalite.",
  "Choisir un abonnement, un prix ou une commission.",
  "Ajouter une IA, Stripe ou un service externe.",
  "Recruter, ouvrir un marche ou nouer un partenariat.",
];

export const decisionSteps: DecisionStep[] = [
  {
    id: "step-1",
    title: "1. Reformulation",
    description:
      "Clarifier la decision a prendre, son importance, les modules concernes et les hypotheses deja presentes.",
    outputs: ["Decision reformulee", "Perimetre impacte", "Hypotheses a verifier"],
  },
  {
    id: "step-2",
    title: "2. Analyse du projet",
    description:
      "Relire le code, la documentation, la page Pilotage Business et les composants existants avant toute recommendation.",
    outputs: ["Etat reel du produit", "Contraintes techniques", "Dependances existantes"],
  },
  {
    id: "step-3",
    title: "3. Questions strategiques",
    description:
      "Poser uniquement les questions qui debloquent la decision: objectif, budget, temps, risque acceptable et priorite reelle.",
    outputs: ["Questions utiles", "Reponses attendues", "Zones d'incertitude"],
  },
  {
    id: "step-4",
    title: "4. Analyse des reponses",
    description:
      "Identifier criteres prioritaires, contraintes fortes, hypothese non validee, biais cognitifs et informations manquantes.",
    outputs: ["Criteres de decision", "Risques majeurs", "Opportunites reelles"],
  },
  {
    id: "step-5",
    title: "5. Comparaison des options",
    description:
      "Comparer toutes les options realistes sur cout, temps, complexite, impact produit, rentabilite, roadmap et retour arriere.",
    outputs: ["Options notees", "Compromis visibles", "Option reversible ou non"],
  },
  {
    id: "step-6",
    title: "6. Recommendation",
    description:
      "Prendre une position claire, expliciter les compromis et lister les conditions a reunir avant execution.",
    outputs: ["Option recommandee", "Pourquoi les autres sont moins bonnes", "Conditions prealables"],
  },
  {
    id: "step-7",
    title: "7. Test de validation",
    description:
      "Proposer un test court qui limite les risques avant un developpement lourd ou un engagement commercial difficile a annuler.",
    outputs: ["Objectif du test", "Indicateurs", "Criteres de succes et d'abandon"],
  },
  {
    id: "step-8",
    title: "8. Integration au pilotage",
    description:
      "Tracer la decision dans le journal, la roadmap, les hypotheses, les risques, les KPI et les dependances concernees.",
    outputs: ["Memoire strategique", "Roadmap mise a jour", "Risques et hypotheses relies"],
  },
];

export const strategicQuestions: StrategicQuestion[] = [
  {
    id: "question-1",
    category: "Objectif",
    question: "Quel probleme prioritaire essaie-t-on vraiment de resoudre avec cette decision ?",
    whyItMatters: "Evite de lancer une solution elegante a un probleme secondaire.",
  },
  {
    id: "question-2",
    category: "Valeur",
    question: "Quel utilisateur paiera, restera ou gagnera concretement quelque chose si on execute cette option ?",
    whyItMatters: "Recentre la decision sur la valeur et non sur l'enthousiasme produit.",
  },
  {
    id: "question-3",
    category: "Execution",
    question: "Combien de temps, d'energie et de charge mentale cette decision demande-t-elle a la fondatrice ?",
    whyItMatters: "Protege la capacite d'execution et la qualite de vie.",
  },
  {
    id: "question-4",
    category: "Budget",
    question: "Quel budget reeel est disponible pour tester, maintenir et supporter cette option ?",
    whyItMatters: "Evite les choix incompatibles avec la tresorerie ou les ressources reelles.",
  },
  {
    id: "question-5",
    category: "Risque",
    question: "Quel risque accepte-t-on vraiment: perte de temps, dette technique, confusion commerciale ou cout cash ?",
    whyItMatters: "Force a expliciter le type de risque au lieu de le subir.",
  },
  {
    id: "question-6",
    category: "Roadmap",
    question: "Qu'est-ce qu'on repousse ou qu'on complique si on prend cette decision maintenant ?",
    whyItMatters: "Rend visible le cout d'opportunite.",
  },
  {
    id: "question-7",
    category: "Mesure",
    question: "Comment saura-t-on en deux a quatre semaines que cette decision etait bonne ?",
    whyItMatters: "Evite les chantiers sans critere de validation.",
  },
  {
    id: "question-8",
    category: "Retour arriere",
    question: "A quel point cette decision sera-t-elle facile a annuler si elle ne marche pas ?",
    whyItMatters: "Donne plus de poids aux options reversibles quand l'incertitude est forte.",
  },
];

export const decisionCriteria: DecisionCriterion[] = [
  { id: "criterion-1", label: "Creation de valeur", focus: "Impact direct sur une douleur reelle et solvable." },
  { id: "criterion-2", label: "Simplicite", focus: "Lisibilite de l'offre, du parcours et de l'implementation." },
  { id: "criterion-3", label: "Rentabilite", focus: "Effet attendu sur revenus, marge ou efficacite." },
  { id: "criterion-4", label: "Execution", focus: "Temps, energie et focus necessaires a la fondatrice." },
  { id: "criterion-5", label: "Complexite technique", focus: "Charge de build, maintenance, QA et dette." },
  { id: "criterion-6", label: "Impact utilisateurs", focus: "Benefice reel pour les profils prioritaires." },
  { id: "criterion-7", label: "Impact roadmap", focus: "Ce que l'option accelere, bloque ou retarde." },
  { id: "criterion-8", label: "Risque", focus: "Probabilite d'echec, confusion, cout cache ou regression." },
  { id: "criterion-9", label: "Retour arriere", focus: "Facilite a annuler ou corriger la decision." },
  { id: "criterion-10", label: "Qualite de vie", focus: "Niveau de friction humaine et mentale induit." },
];

export const pilotageOutputs = [
  "Journal des decisions",
  "Roadmap et priorites",
  "Hypotheses a tester",
  "Risques et mitigations",
  "KPI a suivre",
  "Fonctionnalites et dependances concernees",
  "Documents de suivi et memoire strategique",
];

export const reusableDecisionComponents = [
  "DecisionAssistant",
  "DecisionCard",
  "DecisionHistory",
  "DecisionComparison",
  "DecisionCriteria",
  "DecisionScore",
  "ValidationExperiment",
  "DecisionRoadmap",
  "DecisionRisk",
  "DecisionSummary",
];
