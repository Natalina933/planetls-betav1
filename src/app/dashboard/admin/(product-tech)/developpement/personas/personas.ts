/** Référentiel éditorial canonique. Les évaluations ne sont pas des mesures terrain. */
export const VALIDATION_LEVELS = {
  validated: "✅ Validé terrain",
  to_validate: "🟡 À valider",
  hypothesis: "⚪ Hypothèse",
  future: "🔵 Futur / hors pilote",
} as const;
export const DIGITAL_LEVELS = {
  beginner: { label: "Débutant", rank: 1 },
  intermediate: { label: "Intermédiaire", rank: 2 },
  advanced: { label: "Avancé", rank: 3 },
} as const;
export const SCOPES = { mvp: "MVP", secondary: "SECONDAIRE", future: "FUTUR / P4" } as const;
export const COHORTS = { pilot: "Personas du pilote", secondary: "Personas secondaires", future: "Personas futurs" } as const;
export const COVERAGE_LEVELS = {
  covered: "✅ Couvert", engaged: "🟢 Bien engagé", partial: "🟡 Partiel",
  uncovered: "🔴 Non couvert", unknown: "⚪ Inconnu",
} as const;
export const COLLABORATION_MODES = {
  autonomous: "Autonome", one_off: "Délégation ponctuelle", partial_management: "Délégation de certaines tâches",
  regular: "Délégation régulière", temporary_replacement: "Remplacement temporaire",
  team_management: "Coordination d’équipe", team_member: "Salariée / collaboratrice d’une conciergerie",
  independent_provider: "Prestation indépendante", internal: "Administration et pilotage internes",
  partnership: "Partenariat commercial", guest: "Relation avec l’hôte",
} as const;

export type CoverageLevel = keyof typeof COVERAGE_LEVELS;
export type PersonaScope = keyof typeof SCOPES;
export type PersonaNeed = {
  id: string;
  label: string;
  scope: PersonaScope;
  journeyStep: string;
  plsIds: string[];
  coverage: CoverageLevel;
  assessment: { source: string; reviewedAt: string; note: string } | null;
};
export type ProductPersona = {
  id: string; name: string; role: string; segment: string; context: string;
  image: string | null;
  cohort: keyof typeof COHORTS; scope: PersonaScope;
  collaborationModes: (keyof typeof COLLABORATION_MODES)[];
  digitalLevel: keyof typeof DIGITAL_LEVELS;
  estimatedFrequency: string;
  needs: PersonaNeed[];
  firstValue: string; mainJourney: string[]; currentBreak: string;
  coverage: CoverageLevel;
  validationLevel: keyof typeof VALIDATION_LEVELS;
  validation: { source: string | null; date: string | null; evidenceType: string | null; interviews: number | null; note: string };
  excludedFeatures: string[];
  commercialHypothesis: { offer: string; potential: string; source: string; date: string | null; status: "hypothesis" } | null;
};

const noFieldEvidence = {
  source: null, date: null, evidenceType: null, interviews: null,
  note: "Aucune preuve terrain. Entretiens et observations utilisateurs à documenter ; le code ne valide pas un persona.",
};
function need(id: string, label: string, journeyStep: string, plsIds: string[], coverage: CoverageLevel, source: string, note: string, scope: PersonaScope = "mvp"): PersonaNeed {
  return { id, label, journeyStep, plsIds, coverage, scope, assessment: { source, reviewedAt: "2026-09-05", note } };
}
function commercial(offer: string, potential: string): NonNullable<ProductPersona["commercialHypothesis"]> {
  return { offer, potential, source: "Ancienne présentation Personas du 14 août 2026 ; hypothèse produit sans étude commerciale", date: null, status: "hypothesis" };
}

export const productPersonas: ProductPersona[] = [
  {
    id: "owner-individual", name: "Sophie Martin", image: "/avatars/sophie.png", role: "Propriétaire particulier", segment: "1 à 2 logements",
    context: "Elle loue une résidence secondaire à distance. Selon sa disponibilité, elle gère seule ou délègue tout ou partie des opérations.",
    cohort: "pilot", scope: "mvp", collaborationModes: ["autonomous", "one_off", "partial_management", "regular", "temporary_replacement"],
    digitalLevel: "intermediate", estimatedFrequency: "Quelques fois par semaine et à chaque séjour (estimation)",
    needs: [
      need("stay", "Organiser un séjour, y compris en autonomie", "Créer le logement et le séjour", ["PLS-DEV-009", "PLS-DATA-003"], "partial", "src/app/api/owner/reservations/route.ts", "La création impose concierge_profile_id : l’autonomie complète reste absente."),
      need("delegate", "Choisir le responsable et encadrer ses accès", "Choisir le mode et le responsable", ["PLS-DEV-008", "PLS-DEV-030", "PLS-SEC-003"], "partial", "docs/master-plan-planetls.md", "Demande → devis → mission prouvé pour le flux principal ; modes de collaboration et remise des clés non couverts de bout en bout."),
      need("validate", "Contrôler la preuve et régler la prestation", "Valider puis payer", ["PLS-CAP-006", "PLS-DEV-010"], "partial", "e2e/owner-concierge-service-request.spec.ts", "Scénario existant ; paiement Stripe configuré et preuves terrain à compléter, sans nouveau rejeu métier dans ce lot."),
    ],
    firstValue: "Voir un premier séjour et savoir qui prépare le logement, même si elle souhaite agir seule.",
    mainJourney: ["Créer le logement", "Décrire le séjour ou besoin", "Choisir le mode et le responsable", "Suivre la mission", "Contrôler la preuve", "Valider, payer et conserver l’historique"],
    currentBreak: "En autonomie, la réservation reste dépendante d’une concierge.", coverage: "partial",
    validationLevel: "to_validate", validation: noFieldEvidence,
    excludedFeatures: ["Génération d’images déco", "Assistant éditorial", "PWA complète"],
    commercialHypothesis: commercial("Starter / Gratuit", "★★★ — potentiel supposé"),
  },
  {
    id: "owner-professional", name: "Thomas Leroy", image: "/avatars/marc.png", role: "Propriétaire professionnel", segment: "5 logements ou plus",
    context: "Il suit plusieurs biens et partenaires et veut consolider les informations sans ressaisie.",
    cohort: "secondary", scope: "secondary", collaborationModes: ["partial_management", "regular"],
    digitalLevel: "advanced", estimatedFrequency: "Lecture quotidienne et bilan hebdomadaire (estimation)",
    needs: [
      need("portfolio", "Centraliser son portefeuille sans ressaisie", "Créer ou importer les logements", ["PLS-DEV-003", "PLS-DATA-003"], "partial", "docs/master-plan-planetls.md", "Création de logements existante ; import de portefeuille non disponible selon l’audit transmis, non validé en E2E.", "secondary"),
      need("responsibility", "Identifier le responsable de chaque bien", "Affecter les partenaires", ["PLS-DEV-008", "PLS-SEC-003"], "partial", "docs/master-plan-planetls.md", "Flux de demande existant ; délégations et permissions multi-biens à prouver.", "secondary"),
      need("finance", "Lire des résultats financiers traçables", "Consolider et contrôler", ["PLS-CAP-012", "PLS-DEV-010"], "partial", "docs/master-plan-planetls.md", "La capability finance owner est partielle ; distinguer réel, estimé et démonstration.", "secondary"),
    ],
    firstValue: "Retrouver ses biens et leurs responsables dans une lecture consolidée.",
    mainJourney: ["Créer ou importer le portefeuille", "Relier les partenaires", "Suivre les séjours et missions", "Contrôler dépenses et résultats"],
    currentBreak: "L’import de portefeuille n’est pas disponible ; l’entrée demande de la saisie manuelle.", coverage: "partial",
    validationLevel: "hypothesis", validation: noFieldEvidence,
    excludedFeatures: ["Reporting avancé", "Optimisation automatique du rendement", "Automatisations multi-portefeuilles"],
    commercialHypothesis: commercial("Pro", "★★★★★ — potentiel supposé"),
  },
  {
    id: "concierge-independent", name: "Claire Bernard", image: "/avatars/julie.png", role: "Concierge indépendante", segment: "5 à 15 logements, travaille seule",
    context: "Elle assure personnellement la relation propriétaire, les déplacements et une grande partie des interventions quotidiennes.",
    cohort: "pilot", scope: "mvp", collaborationModes: ["autonomous", "one_off", "regular", "temporary_replacement"],
    digitalLevel: "intermediate", estimatedFrequency: "Plusieurs fois par jour, souvent sur mobile (estimation)",
    needs: [
      need("day", "Savoir quoi faire aujourd’hui", "Lire les séjours et prioriser sa journée", ["PLS-DEV-004", "PLS-DEV-009"], "partial", "docs/master-plan-planetls.md", "Planning et cockpit présents ; continuité séjour → tâches encore à vérifier."),
      need("execution", "Accéder au logement et prouver son travail", "Intervenir et transmettre la preuve", ["PLS-DEV-015", "PLS-DEV-030", "PLS-CAP-006"], "partial", "docs/master-plan-planetls.md", "Checklists et comptes rendus partiels ; gabarits persistants et gestion canonique des clés à planifier."),
      need("requests", "Suivre ses demandes sans perdre les relances", "Qualifier puis suivre la demande", ["PLS-DEV-008", "PLS-DEV-029"], "partial", "docs/master-plan-planetls.md", "Workflow principal prouvé ; orchestration des relances et SLA non livrée."),
    ],
    firstValue: "Identifier sa prochaine intervention avec les consignes et le responsable à contacter.",
    mainJourney: ["Intégrer un logement", "Lire les séjours", "Prioriser sa journée", "Accéder et intervenir", "Transmettre les preuves", "Faire valider et facturer"],
    currentBreak: "La continuité séjour → tâche → accès → preuve reste partielle.", coverage: "partial",
    validationLevel: "to_validate", validation: noFieldEvidence,
    excludedFeatures: ["Optimisation avancée de tournées", "Rapport vocal", "PWA complète", "Assistant éditorial"],
    commercialHypothesis: commercial("Offre à tester auprès des indépendantes", "★★★★ — potentiel supposé"),
  },
  {
    id: "concierge-manager", name: "Nicolas Petit", image: "/avatars/jean.png", role: "Dirigeant de conciergerie", segment: "Équipe, 20 logements ou plus",
    context: "Il coordonne les personnes, répartit la charge et contrôle la qualité sans réaliser lui-même toutes les missions.",
    cohort: "secondary", scope: "secondary", collaborationModes: ["team_management", "regular", "temporary_replacement"],
    digitalLevel: "advanced", estimatedFrequency: "Quotidienne, plusieurs points de contrôle (estimation)",
    needs: [
      need("team", "Donner un accès personnel aux membres", "Inviter puis autoriser chaque membre", ["PLS-CAP-013", "PLS-DEV-001"], "partial", "src/app/api/concierge/team/route.ts", "Le membre est persisté avec linked_profile_id optionnel ; la route ne crée ni compte ni invitation.", "secondary"),
      need("load", "Affecter selon la charge et les disponibilités", "Répartir les missions", ["PLS-CAP-004", "PLS-DEV-009"], "partial", "src/app/api/concierge/team/route.ts", "Capacité et disponibilité présentes ; continuité des affectations et conflits à valider.", "secondary"),
      need("quality", "Contrôler l’exécution et les écarts", "Vérifier les preuves et traiter les incidents", ["PLS-CAP-006", "PLS-DEV-004"], "partial", "docs/master-plan-planetls.md", "Socle de suivi existant ; contrôle complet par responsabilité non prouvé.", "secondary"),
    ],
    firstValue: "Voir qui est responsable de chaque mission et où la charge dépasse les disponibilités.",
    mainJourney: ["Intégrer logements et équipe", "Inviter et autoriser", "Répartir la charge", "Suivre les missions", "Contrôler les preuves et écarts"],
    currentBreak: "Un membre d’équipe peut être créé sans disposer d’un accès personnel complet.", coverage: "partial",
    validationLevel: "hypothesis", validation: noFieldEvidence,
    excludedFeatures: ["Optimisation avancée de tournées", "Pilotage avancé des marges", "Automatisation complète des remplacements"],
    commercialHypothesis: commercial("Business", "★★★★★ — potentiel supposé"),
  },
  {
    id: "team-member", name: "Inès Robert", image: "/avatars/emma.png", role: "Membre d’équipe d’une conciergerie", segment: "Salariée ou collaboratrice terrain",
    context: "Elle exécute les missions de sa conciergerie avec des droits limités. Ce persona ne représente pas un prestataire indépendant.",
    cohort: "secondary", scope: "secondary", collaborationModes: ["team_member"],
    digitalLevel: "beginner", estimatedFrequency: "À chaque mission, sur mobile (estimation)",
    needs: [
      need("access", "Accéder uniquement à ses missions autorisées", "Accepter une invitation et se connecter", ["PLS-CAP-013", "PLS-DEV-001"], "uncovered", "src/app/api/concierge/team/route.ts", "Le parcours invitation → compte → missions autorisées n’est pas complet.", "secondary"),
      need("instructions", "Trouver les consignes et l’accès au logement", "Consulter sa prochaine mission", ["PLS-DEV-009", "PLS-DEV-030"], "partial", "docs/master-plan-planetls.md", "Consignes opérationnelles partielles, gestion des clés encore à planifier.", "secondary"),
      need("proof", "Signaler un blocage et transmettre sa preuve", "Exécuter, signaler puis clôturer", ["PLS-CAP-006"], "partial", "docs/master-plan-planetls.md", "Socle missionnel présent ; il ne prouve pas un parcours connecté propre au membre d’équipe.", "secondary"),
    ],
    firstValue: "Ouvrir sa prochaine mission autorisée, avec horaire, consignes et contact responsable.",
    mainJourney: ["Recevoir une invitation", "Activer son compte", "Voir ses missions autorisées", "Accéder au logement", "Exécuter et signaler", "Transmettre une preuve"],
    currentBreak: "Pas de parcours complet invitation → compte → missions autorisées.", coverage: "partial",
    validationLevel: "hypothesis", validation: noFieldEvidence,
    excludedFeatures: ["Prospection commerciale indépendante", "Facturation de prestataire", "Rapport vocal", "PWA complète"],
    commercialHypothesis: commercial("Accès équipe à cadrer", "★★★★ — ancienne estimation, à requalifier après distinction équipe/prestataire"),
  },
  {
    id: "provider", name: "Karim Benali", image: "/avatars/leo.png", role: "Artisan ou prestataire indépendant", segment: "Indépendant local",
    context: "Il sélectionne ses interventions et facture une prestation indépendante ; il n’est pas assimilé au salarié d’une conciergerie.",
    cohort: "pilot", scope: "mvp", collaborationModes: ["independent_provider", "one_off", "regular"],
    digitalLevel: "intermediate", estimatedFrequency: "À chaque demande et intervention (estimation)",
    needs: [
      need("acquisition", "Recevoir une demande locale qualifiée", "Présenter son métier et accepter une demande", ["PLS-DEV-005", "PLS-DEV-007"], "partial", "docs/master-plan-planetls.md", "Dashboard et profil présents ; acquisition et distribution de missions encore à valider."),
      need("intervention", "Connaître le périmètre et prouver l’intervention", "Intervenir puis transmettre un compte rendu", ["PLS-CAP-006"], "partial", "docs/master-plan-planetls.md", "Checklist et compte rendu existent partiellement ; preuve connectée multi-rôle restante."),
      need("payment", "Identifier le payeur et être réglé", "Faire valider, facturer et recevoir le paiement", ["PLS-DEV-010"], "partial", "docs/master-plan-planetls.md", "Le paiement d’une facture owner ne démontre pas le règlement final du prestataire."),
    ],
    firstValue: "Recevoir une mission locale dont le périmètre, le responsable et le payeur sont explicites.",
    mainJourney: ["Compléter son profil", "Recevoir une demande", "Confirmer périmètre et payeur", "Intervenir", "Fournir la preuve", "Faire valider et être payé"],
    currentBreak: "Acquisition, identité du payeur et règlement final restent à clarifier.", coverage: "partial",
    validationLevel: "to_validate", validation: noFieldEvidence,
    excludedFeatures: ["Marketplace fournisseurs", "Distribution automatique avancée", "PWA complète"],
    commercialHypothesis: commercial("Sur mesure", "★★★ — potentiel supposé"),
  },
  {
    id: "admin", name: "Nathalie", image: "/avatars/Copilot_20250701_194013.png", role: "Administratrice et fondatrice PlanetLS", segment: "Usage interne opérationnel et stratégique",
    context: "Au quotidien, elle traite les alertes et contrôle la plateforme. Comme fondatrice, elle arbitre le produit, les preuves et les priorités.",
    cohort: "pilot", scope: "mvp", collaborationModes: ["internal"], digitalLevel: "advanced", estimatedFrequency: "Quotidienne (usage interne déclaré)",
    needs: [
      need("operations", "Administration : qualifier les alertes réelles", "Lire les signaux et traiter les incidents", ["PLS-DEV-006", "PLS-DEV-011", "PLS-ADM-001"], "partial", "docs/master-plan-planetls.md", "Supervision partielle ; certaines sources techniques restent indisponibles."),
      need("strategy", "Fondatrice : arbitrer à partir de preuves", "Relier besoin, lot et prochaine action", ["PLS-DEV-014", "PLS-BIZ-001"], "partial", "docs/master-plan-planetls.md", "Registre structuré et pilotage disponibles ; hypothèses commerciales encore non observées."),
      need("trust", "Distinguer données réelles et estimations", "Vérifier la provenance des indicateurs", ["PLS-KPI-001", "PLS-ADM-001"], "partial", "docs/master-plan-planetls.md", "Fallback KPI synthétique et contrôles techniques sans backend encore documentés."),
    ],
    firstValue: "Identifier un blocage réel et la prochaine action fondée sur une preuve explicite.",
    mainJourney: ["Lire les signaux sourcés", "Qualifier le risque", "Arbitrer le lot", "Suivre l’action", "Vérifier les preuves"],
    currentBreak: "Le cockpit reste partiellement trompeur lorsque des estimations sont prises pour des observations.", coverage: "partial",
    validationLevel: "to_validate",
    validation: { ...noFieldEvidence, source: "Référentiel Personas antérieur : usage direct du cockpit déclaré", evidenceType: "Déclaration interne non datée", note: "Usage interne reconnu. L’ancien statut Validé ne comportait ni observation datée ni trace vérifiable ; validation formelle à documenter." },
    excludedFeatures: ["Nouveau dashboard métier", "Gouvernance IA avancée", "Prévisions commerciales présentées comme résultats"],
    commercialHypothesis: null,
  },
  {
    id: "local-merchant", name: "Élodie Garcia", image: "/avatars/marie.png", role: "Commerçante / fournisseuse locale", segment: "Produits et services récurrents",
    context: "Elle envisage des partenariats avec les conciergeries, après stabilisation du cœur produit.",
    cohort: "future", scope: "future", collaborationModes: ["partnership"], digitalLevel: "intermediate", estimatedFrequency: "À préciser hors pilote",
    needs: [need("orders", "Recevoir des commandes professionnelles récurrentes", "Présenter l’offre et recevoir une demande", [], "unknown", "Audit Personas transmis ; docs/master-plan-planetls.md", "Aucun lot dédié à une marketplace fournisseurs ; ne pas assimiler les stocks à une marketplace.", "future")],
    firstValue: "Obtenir une demande commerciale qualifiée, si cet usage est confirmé ultérieurement.",
    mainJourney: ["Présenter son offre", "Définir sa zone", "Recevoir une demande", "Convenir des conditions"],
    currentBreak: "Rôle et parcours commercial non cadrés pour le MVP.", coverage: "unknown", validationLevel: "future", validation: noFieldEvidence,
    excludedFeatures: ["Marketplace fournisseurs", "Catalogue et commandes dans le MVP"],
    commercialHypothesis: commercial("Marketplace B2B future", "★★★★ — potentiel supposé"),
  },
  {
    id: "traveler", name: "Voyageur", image: null, role: "Occupant de passage", segment: "Persona futur, bénéficiaire secondaire du séjour",
    context: "Il bénéficie de la préparation et des consignes transmises par son hôte ; aucun espace autonome n’est engagé dans le MVP.",
    cohort: "future", scope: "future", collaborationModes: ["guest"], digitalLevel: "intermediate", estimatedFrequency: "Avant et pendant le séjour (hypothèse)",
    needs: [need("arrival", "Recevoir des consignes d’arrivée fiables", "Recevoir les informations de l’hôte", ["PLS-DEV-009"], "unknown", "docs/master-plan-planetls.md", "Lien au séjour uniquement : ce lot ne promet pas de portail voyageur autonome.", "future")],
    firstValue: "Disposer des bonnes consignes et savoir qui contacter à l’arrivée.",
    mainJourney: ["Recevoir les consignes de l’hôte", "Accéder au logement", "Contacter le responsable en cas de besoin"],
    currentBreak: "Le besoin direct reste hypothétique ; aucun parcours autonome validé.", coverage: "unknown", validationLevel: "future", validation: noFieldEvidence,
    excludedFeatures: ["Espace voyageur autonome dans le MVP", "Compte voyageur obligatoire", "Application dédiée"], commercialHypothesis: null,
  },
];

export function getPersonaPlsIds(persona: ProductPersona): string[] {
  return [...new Set(persona.needs.flatMap((item) => item.plsIds))];
}

export function getValidationEvidence(persona: ProductPersona): string {
  const { source, date, evidenceType, interviews, note } = persona.validation;
  return [source && date ? `${evidenceType ?? "Preuve"} : ${source} (${date})` : "Aucune preuve terrain",
    source && !date ? `Source déclarative : ${source}. Date non documentée.` : null,
    interviews === null ? "Nombre d’entretiens/tests non documenté." : `${interviews} entretien(s)/test(s).`, note].filter(Boolean).join(" ");
}
