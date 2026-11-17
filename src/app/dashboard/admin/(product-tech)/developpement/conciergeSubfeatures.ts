import type { ConciergeSubfeature, SubfeatureSpace } from "./conciergeSubfeatureTypes";

const root = "src/app/dashboard/concierge/";
const api = "src/app/api/";
const tests = "src/tests/";
const report = "Rapport de conversation DEV-DASHBOARD-05D du 15 novembre 2026";
const commonLimit = "Évaluation historique 05D : aucun test exécuté dans cet inventaire, aucune validation actuelle ni preuve de production.";

type Seed = {
  number: number;
  parent: string;
  name: string;
  description: string;
  state: ConciergeSubfeature["implementation"]["state"];
  related: SubfeatureSpace[];
  routes: string[];
  files: string[];
  remaining: string[];
  dependencies?: number[];
};

// Identifiants permanents : ne pas renuméroter après tri, déplacement ou retrait.
// Les parents et leurs priorités ne sont pas recopiés comme fiches ou compteurs.
const seeds: Seed[] = [
  { number: 1, parent: "PLS-DEV-004", name: "Cockpit et alertes", state: "partial",
    description: "Synthétiser missions, demandes, logements, devis et messages ; préférences de widgets locales.", related: ["Propriétaires", "Artisans / Prestataires"],
    routes: ["/dashboard/concierge", "/dashboard/concierge/alertes"], files: [root + "DashboardPage.tsx", root + "useConciergeDashboardData.ts", tests + "concierge-alerts-stocks.test.mts"],
    remaining: ["Vérifier les parcours réels et erreurs de chargement", "Qualifier les limites des agrégations sans revendiquer les workflows affichés"], dependencies: [5, 8, 16] },
  { number: 2, parent: "PLS-DEV-004", name: "Synthèse CRM propriétaires", state: "implemented",
    description: "Afficher conversations et indicateurs de relation propriétaire ; complétude limitée à la synthèse.", related: ["Propriétaires"],
    routes: ["/dashboard/concierge/contacts"], files: [root + "contacts/page.tsx", "src/app/lib/ownerCrm.ts", tests + "owner-crm.test.mts"],
    remaining: ["Qualifier la persistance des actions CRM", "Recetter les autorisations et la vue de synthèse"] },
  { number: 3, parent: "PLS-DEV-004", name: "Synthèse financière", state: "partial",
    description: "Agréger les factures et présenter les calculs de commission en distinguant les exemples des données réelles.", related: ["Propriétaires"],
    routes: ["/dashboard/concierge/finances/overview", "/dashboard/concierge/billing"], files: [root + "finances/overview/page.tsx", "src/app/lib/financialManagement.ts", tests + "financial-management.test.mts"],
    remaining: ["Distinguer l'exemple 950 € / 20 % des données réelles", "Valider les agrégations de factures"] },
  { number: 4, parent: "PLS-DEV-004", name: "Autres surfaces du dashboard — périmètre à qualifier", state: "not_assessed",
    description: "Qualifier séparément logements, équipe, recherche, profil, messagerie et services avant toute évaluation.", related: ["Propriétaires", "Artisans / Prestataires"],
    routes: ["/dashboard/concierge/logements", "/dashboard/concierge/equipe", "/dashboard/concierge/recherche", "/dashboard/concierge/profile", "/dashboard/concierge/messages"], files: [root],
    remaining: ["Définir des périmètres fonctionnels distincts", "Recueillir des preuves propres à chaque périmètre"] },
  { number: 5, parent: "PLS-DEV-009", name: "Consultation et modification des séjours", state: "implemented",
    description: "Consulter les séjours et modifier une réservation via les API dédiées.", related: ["Propriétaires"],
    routes: ["/dashboard/concierge/sejours", "/api/concierge/stays", "/api/reservations/[id]"], files: [root + "sejours/page.tsx", api + "concierge/stays/route.ts", tests + "reservations-api-contract.test.mts"],
    remaining: ["Vérifier persistance réelle et refus inter-comptes", "Recetter les états de consultation et modification"] },
  { number: 6, parent: "PLS-DEV-009", name: "Planning et navigation", state: "implemented",
    description: "Consulter les missions dans cinq modes de planning et naviguer entre les périodes.", related: ["Propriétaires", "Artisans / Prestataires"],
    routes: ["/dashboard/concierge/planning"], files: [root + "planning/page.tsx", root + "planning/planningNavigation.ts", tests + "concierge-planning-navigation.test.mts"],
    remaining: ["Exécuter les tests ciblés de navigation", "Recetter le planning sur desktop et mobile"] },
  { number: 7, parent: "PLS-DEV-009", name: "Séjour → interventions → facture", state: "partial",
    description: "Enchaîner acceptation continue ou ponctuelle, interventions opérationnelles, facturation et reprises.", related: ["Propriétaires", "Artisans / Prestataires"],
    routes: ["/api/service-request-recipients/[id]/respond", "/api/service-requests/[id]/select"], files: [tests + "concierge-operational-workflow.test.mts", tests + "stay-ponctuel-service-request.test.mts"],
    remaining: ["Prouver concurrence et reprise réelles sur base représentative", "Valider les effets persistants et la chaîne complète"], dependencies: [5, 8, 16] },
  { number: 8, parent: "PLS-DEV-009", name: "Missions, affectation et preuves", state: "partial",
    description: "Affecter et suivre les missions avec leurs preuves ; la checklist reste référencée dans une fiche séparée.", related: ["Propriétaires", "Artisans / Prestataires"],
    routes: ["/dashboard/concierge/missions", "/api/missions/[id]"], files: [root + "missions/page.tsx", api + "missions/[id]/route.ts", tests + "reservation-mission-assignment.test.mts", tests + "mission-proof-authorization.test.mts"],
    remaining: ["Vérifier la chaîne avec participants réels", "Valider Storage, permissions et base appliquée"], dependencies: [9] },
  { number: 9, parent: "PLS-DEV-015", name: "Checklists quotidiennes et de mission", state: "partial",
    description: "Persister les tâches quotidiennes et les éléments de checklist d'une mission, sans les assimiler à des gabarits.", related: ["Artisans / Prestataires"],
    routes: ["/api/concierge/daily-checklist", "/api/missions/[id]"], files: [root + "ConciergeTodayPanel.tsx", api + "concierge/daily-checklist/route.ts", tests + "mission-checklist-persistence-contract.test.mts"],
    remaining: ["Confirmer les migrations réellement appliquées", "Exécuter les contrôles RLS et le parcours de checklist"] },
  { number: 10, parent: "PLS-DEV-015", name: "Gabarits réutilisables de routines", state: "not_started",
    description: "Créer et réutiliser des routines sans ressaisie ; aucun flux dédié identifié dans le périmètre 05D.", related: ["Artisans / Prestataires"],
    routes: ["/dashboard/concierge/planning"], files: [root + "planning/"],
    remaining: ["Définir le modèle de gabarit et la duplication contrôlée", "Prévoir responsabilités, preuves et usage mobile"], dependencies: [9] },
  { number: 11, parent: "PLS-DEV-020", name: "Proposition et sauvegarde d'une tournée", state: "partial",
    description: "Optimiser une sélection de missions et sauvegarder une tournée et ses étapes.", related: ["Artisans / Prestataires"],
    routes: ["/dashboard/concierge/planning", "/api/concierge/optimized-routes/optimize", "/api/concierge/optimized-routes"], files: [root + "planning/OptimizedRoutePlanner.tsx", root + "planning/routeOptimization.ts", root + "planning/routeProvider.ts", api + "concierge/optimized-routes/route.ts"],
    remaining: ["Confirmer données géographiques, permissions et restitution", "Vérifier la reprise après échec des insertions successives"] },
  { number: 12, parent: "PLS-DEV-020", name: "Parcours terrain « Ma journée »", state: "partial",
    description: "Organiser les étapes du jour, les confirmer et signaler retards ou incidents ; les panneaux existants ne prouvent pas le parcours complet.", related: ["Artisans / Prestataires"],
    routes: ["/dashboard/concierge/planning"], files: [root + "ConciergeTodayPanel.tsx", root + "planning/page.tsx"],
    remaining: ["Définir réordonnancement et confirmation des étapes", "Relier retards et incidents sans déplacement automatique imposé"], dependencies: [6, 11, 18] },
  { number: 13, parent: "PLS-DEV-021", name: "Compte rendu vocal avec validation humaine", state: "not_started",
    description: "Dicter, structurer puis valider un rapport avant toute persistance ; aucun raccordement identifié dans 05D.", related: ["Propriétaires", "Artisans / Prestataires", "Sécurité et infrastructure"],
    routes: ["/dashboard/concierge/missions", "/dashboard/concierge/sejours"], files: [root + "missions/", root + "sejours/"],
    remaining: ["Définir dictée, proposition et validation humaine", "Relier rapport, photos, mission ou séjour et notification propriétaire"], dependencies: [5, 8] },
  { number: 14, parent: "PLS-DEV-030", name: "Inventaire et circulation des clés", state: "not_started",
    description: "Tracer accès, détenteurs, remises et restitutions ; un champ ponctuel key_handover_type ne constitue pas le cycle canonique.", related: ["Propriétaires", "Artisans / Prestataires", "Sécurité et infrastructure"],
    routes: ["/dashboard/concierge/logements", "/api/urgent-missions"], files: [root + "logements/", api + "urgent-missions/route.ts"],
    remaining: ["Définir inventaire, détenteurs et bordereaux signés", "Prévoir incidents, révocation et blocages d'activation ou clôture"] },
  { number: 15, parent: "PLS-DEV-032", name: "Confirmation des prestations gratuites", state: "implemented",
    description: "Confirmer explicitement une ligne gratuite, la sauvegarder puis demander l'envoi du devis.", related: ["Propriétaires"],
    routes: ["/dashboard/concierge/billing", "/api/quotes/[id]", "/api/quotes/[id]/status"], files: ["src/app/components/tariffs/TariffBillingDesk.tsx", "src/features/concierge-commercial/server/quoteSendGuard.ts", tests + "tariff-billing-free-price.test.mts", tests + "quote-send-guard.test.mts"],
    remaining: ["Exécuter les tests actuels d'interface et serveur", "Valider sauvegarde et envoi sur le parcours réel"], dependencies: [16] },
  { number: 16, parent: "PLS-DEV-032", name: "Envoi et réception du devis bout en bout", state: "partial",
    description: "Prouver le parcours propriétaire → professionnel → devis → envoi → réception.", related: ["Propriétaires"],
    routes: ["/api/quotes/[id]/status", "/dashboard/concierge/billing"], files: [api + "quotes/[id]/status/route.ts", tests + "stay-ponctuel-service-request.test.mts"],
    remaining: ["Recetter le parcours navigateur complet", "Requalifier les anciens échecs séjour sans les présumer encore actuels"] },
  { number: 17, parent: "PLS-OPS-001", name: "Stocks et consommables", state: "partial",
    description: "Passer des besoins indicatifs calculés depuis logements et missions à un inventaire réel et traçable.", related: ["Propriétaires", "Artisans / Prestataires"],
    routes: ["/dashboard/concierge/stocks"], files: [root + "stocks/page.tsx", root + "stocks/stocksHelpers.ts", tests + "concierge-alerts-stocks.test.mts"],
    remaining: ["Définir quantités, mouvements et seuils persistés", "Valider les responsabilités et permissions de gestion du stock"] },
  { number: 18, parent: "PLS-OPS-002", name: "Urgences et maintenance", state: "partial",
    description: "Qualifier, affecter et suivre une urgence ou un incident avec transitions et médias.", related: ["Propriétaires", "Artisans / Prestataires", "Administration"],
    routes: ["/dashboard/concierge/urgences", "/dashboard/concierge/maintenance", "/api/urgent-missions/[id]/accept", "/api/concierge/maintenance"], files: [root + "urgences/page.tsx", root + "maintenance/page.tsx", api + "concierge/maintenance/route.ts", tests + "maintenance-persistence-contract.test.mts", tests + "maintenance-workflow.test.mts"],
    remaining: ["Unifier qualification et information du propriétaire", "Prouver prévention des abus et clôture complète"], dependencies: [8] },
  { number: 19, parent: "PLS-BIZ-002", name: "Rémunération flexible et règlements", state: "not_started",
    description: "Définir les modèles et périodicités de rémunération ; les calculs et simulations ne prouvent pas le workflow métier.", related: ["Propriétaires", "Administration"],
    routes: ["/dashboard/admin/pilotage", "/dashboard/admin/modele-financier", "/dashboard/concierge/billing"], files: ["src/app/lib/financialManagement.ts", tests + "financial-management.test.mts"],
    remaining: ["Définir assiettes, modèles et périodicités", "Qualifier les impacts contractuels et fiscaux et l'articulation facture/paiement"] },
];

export const conciergeSubfeatures: ConciergeSubfeature[] = seeds.map(seed => {
  const id = `PLS-SF-CON-${String(seed.number).padStart(3, "0")}` as const;
  const observationId = `${id}-05D`;
  return {
    id, parentMasterPlanId: seed.parent, name: seed.name, description: seed.description,
    recordType: seed.number === 4 ? "scope_to_qualify" : "feature",
    primarySpace: "Conciergerie", relatedSpaces: seed.related,
    implementation: { state: seed.state, rationale: `Évaluation historique 05D. ${seed.description}`, evidenceIds: [observationId] },
    validation: { state: "not_assessed", targetScope: [seed.description], criteria: [], limitations: [commonLimit, "Critères d'acceptation actuels à définir ; aucun résultat historique promu en validation actuelle."] },
    routes: seed.routes, files: seed.files,
    evidence: [{ id: observationId, kind: "code_review", source: report, description: seed.description,
      observedAt: "2026-11-15", executedAt: null, commit: null, environment: null,
      result: "unknown", provenance: "historical_report", scope: [seed.name], limitations: [commonLimit, "Les chemins associés sont des points d'inspection, pas des preuves d'achèvement."] }],
    dependencies: (seed.dependencies ?? []).map(n => `PLS-SF-CON-${String(n).padStart(3, "0")}`),
    remainingWork: seed.remaining,
    unknowns: ["Commit exact de l'évaluation 05D inconnu", "Résultats actuels des tests et recette du périmètre non établis", ...(seed.state === "not_started" ? ["Absence d'implémentation limitée au périmètre examiné dans 05D"] : [])],
    nextAction: seed.remaining[0],
    assessment: { source: report, assessedAt: "2026-11-15", assessedCommit: null },
  };
});

// Résultats rapportés : dates de passage inconnues conservées à null.
const historicalRuns = [
  { number: 7, result: "100 tests ciblés réussis, zéro échec", source: "docs/master-plan-planetls.md — CONCIERGE-03B, 26 octobre 2026", date: null, scope: "Campagne CONCIERGE-03B incluant le workflow opérationnel", limit: "Résultat agrégé ; concurrence et RLS réelles non validées par cette campagne." },
  { number: 9, result: "Campagnes 4/4 et 8/8 PASS", source: "docs/master-plan-planetls.md — preuves de checklist citées dans 05D", date: null, scope: "Campagnes incluant les contrats statiques de checklist", limit: "Résultats agrégés de plusieurs fichiers ; aucune preuve d'exécution des RLS." },
  { number: 15, result: "10/10 PASS", source: "docs/master-plan-planetls.md — LOT 6/6B, 10 octobre 2026 ; src/tests/quote-send-guard.test.mts", date: "2026-10-10", scope: "Garde-fou serveur d'envoi du devis uniquement", limit: "Ne valide ni l'interface actuelle ni le parcours complet de réception." },
  { number: 16, result: "Campagne 74/74 PASS", source: "docs/master-plan-planetls.md — campagne incluant stay-ponctuel-service-request citée dans 05D", date: null, scope: "Campagne incluant les tests séjour ponctuel", limit: "Ne prouve pas le parcours navigateur complet ; anciens échecs à requalifier." },
] as const;

for (const run of historicalRuns) {
  const item = conciergeSubfeatures[run.number - 1];
  item.evidence.push({ id: `${item.id}-historical-tests`, kind: run.number === 9 ? "static_test" : run.number === 15 ? "unit_test" : "handler_test",
    source: run.source, description: run.result, observedAt: null, executedAt: run.date, commit: null,
    environment: null, result: "passed", provenance: "historical_report", scope: [run.scope], limitations: [run.limit, commonLimit] });
}
