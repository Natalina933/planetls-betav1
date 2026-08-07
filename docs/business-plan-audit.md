# Audit Business Plan PlanetLS

Date: 2026-08-07

## Perimetre analyse

- `src/app/dashboard/admin/pilotage/page.tsx`
- `src/app/dashboard/admin/pilotage/economic-model/*`
- `src/app/dashboard/admin/pilotage/market-validation/*`
- `src/app/dashboard/admin/pilotage/risk-register/*`
- `src/app/dashboard/admin/pilotage/decision-assistant/*`
- `src/app/dashboard/admin/pilotage/ai-center/*`
- `src/app/dashboard/admin/pilotage/business-strategy/*`
- `src/app/abonnement/concierge-pro/ConciergeProSubscriptionPageClient.tsx`
- `docs/master-plan-planetls.md`
- `docs/ai/contexts/business-context.md`
- `docs/ai/contexts/pilotage-business-context.md`
- `docs/spec-cible-profils-personas-2026-06-19.md`

## Etat actuel

Le "Business Plan" existe surtout dans la page admin `/dashboard/admin/pilotage`, structuree en 5 onglets:

- `Vue d'ensemble`
- `Marche & offre`
- `Finance`
- `Modele economique`
- `Execution & risques`

L'architecture actuelle se partage en trois couches:

1. Donnees live limitees
- `/dashboard/admin/pilotage/page.tsx` charge seulement `api/admin/overview`, `api/admin/operations` et `api/kpis/overview`.
- Ces donnees servent surtout a la traction actuelle, a quelques KPI produit et a des alertes d'execution.

2. Donnees editoriales statiques
- Le coeur du business plan est code en dur dans `page.tsx`, `economic-model/data.ts`, `market-validation/validationData.ts` et `risk-register/riskData.ts`.
- La plupart des tableaux, hypotheses, prix, benchmark, roadmap, tests et risques ne viennent pas d'une source centralisee persistante.

3. Modules annexes partiellement ou non branches
- `EconomicModelTab` est branche.
- `LeanValidationDashboard`, `RiskRegister`, `StrategicDecisionAssistant`, `PromptLibraryCenter`, `BusinessCollapsibleSection` existent mais ne sont pas integres dans `page.tsx`.
- Le dossier `business-strategy` contient une mini-architecture d'edition/simulation plus riche, mais elle n'est pas branchee au cockpit actuel.

## Pages existantes liees au business plan

### Pages actives

- `src/app/dashboard/admin/pilotage/page.tsx`
  Surface principale du business plan et du pilotage business.
- `src/app/abonnement/concierge-pro/ConciergeProSubscriptionPageClient.tsx`
  Source utile pour la seule offre reellement branchee a Stripe (`Concierge Pro`, `29 EUR / mois`).
- `src/app/dashboard/admin/developpement/page.tsx`
  Pas une page business plan, mais elle expose le Master Plan et influence le pilotage strategique global.

### Pages / modules existants mais non exposes comme pages de pilotage completes

- `economic-model/EconomicModelTab.tsx`
- `market-validation/LeanValidationDashboard.tsx`
- `risk-register/RiskRegister.tsx`
- `decision-assistant/StrategicDecisionAssistant.tsx`
- `ai-center/PromptLibraryCenter.tsx`

## Composants deja crees et reutilisables

### Composants reellement reutilises dans la page actuelle

- `DashboardLayout`
- `DashboardPanel`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

### Composants business disponibles mais non branches ou tres peu exploites

- `EconomicModelTab`
- `LeanValidationDashboard`
- `RiskRegister`
- `StrategicDecisionAssistant`
- `PromptLibraryCenter`
- `BusinessCollapsibleSection`

### Composants du dossier `business-strategy` reutilisables

- `StrategySelector`
- `PricingEditor`
- `OfferCard`
- `FeatureMatrix`
- `FinancialSimulator`
- `RevenueChart`
- `BusinessDashboard`
- `BusinessTimeline`
- `DecisionLog`
- `CompetitorComparison`
- `BusinessScore`
- `MetricsCard`

Constat: cette couche `business-strategy` ressemble a un ancien ou futur atelier d'edition. Elle est plus modulaire que `page.tsx`, mais elle n'est pas la source de verite actuelle.

## Donnees deja presentes par theme

| Theme | Etat actuel | Source principale | Fiabilite |
| --- | --- | --- | --- |
| Marche | TAM / SAM / SOM editoriaux, benchmark concurrentiel, axes de positionnement | `page.tsx` | Moyenne |
| Personas | Segment prioritaire conciergeries, profils cibles pricing, documentation personas separee | `page.tsx`, `economic-model/data.ts`, `docs/spec-cible-profils-personas-2026-06-19.md` | Moyenne |
| Concurrence | Tableau benchmark et matrice de capacites | `page.tsx` | Moyenne |
| Proposition de valeur | Vision, offre coeur, messages sur la promesse conciergerie | `page.tsx`, `docs/master-plan-planetls.md` | Bonne |
| Strategie tarifaire | Gamme `29 / 49 / sur devis`, alternatives par strategie, backlog de tests | `page.tsx`, `economic-model/data.ts`, `EconomicModelTab.tsx` | Moyenne |
| Abonnements | Offre Stripe reelle `Concierge Pro` a `29 EUR`, hypotheses d'offres simulees | `ConciergeProSubscriptionPageClient.tsx`, `economic-model/data.ts` | Bonne pour l'offre reelle, moyenne pour le reste |
| Roadmap | Plan 30 jours, 90 jours, 12 mois, timeline business non branchee | `page.tsx`, `validationData.ts`, `business-strategy/*` | Moyenne |
| Projections financieres | Scenarios MRR / ARR et simulations editoriales | `page.tsx`, `EconomicModelTab.tsx`, `business-strategy/*` | Faible a moyenne |
| KPI | Quelques KPI live produit + KPI de validation a `0` / `A mesurer` | API admin/KPI, `validationData.ts` | Bonne pour KPI produit, faible pour KPI business/validation |
| SWOT | Aucun bloc SWOT structure | absent | Nulle |
| Risques | Registre de risques statique detaille | `risk-register/riskData.ts` | Bonne comme cadrage, pas comme registre vivant |
| Strategie commerciale | Go-to-market, scripts d'entretiens, landing variants, priorites 30-90 jours | `page.tsx`, `validationData.ts` | Moyenne |

## Elements fiables

- L'existence d'une offre reellement branchee a Stripe: `Concierge Pro`, `29 EUR / mois`.
- La separation explicite entre `offre reelle`, `hypothese`, `simulation` dans le module `Modele economique`.
- Le cadrage strategique actuel: priorite a une offre B2B simple pour conciergeries avant une logique commission.
- Les donnees live admin/KPI qui permettent de lire une partie de la traction produit reelle.
- Le registre de risques business, suffisamment structure pour servir de base.
- La documentation personas deja presente dans `docs/spec-cible-profils-personas-2026-06-19.md`.

## Elements incomplets

- Le business plan est riche en contenu mais faible en canonisation des donnees.
- Les KPI de validation marche sont prets visuellement, mais non alimentes.
- La concurrence est comparee editorialement, sans dates de mise a jour ni sources rattachees.
- Les projections financieres ne s'appuient pas sur un modele de couts reel ni sur des cohortes reelles.
- La roadmap business existe en plusieurs formes, sans structure unique.
- Les personas sont presentes a la fois en doc, en hypotheses, en profils tarifaires et en segment cible, sans referentiel central.

## Elements a actualiser

- Les benchmarks concurrents et leurs prix, car ils sont sensibles au temps.
- Les hypotheses de segment prioritaire si les retours terrain ont evolue depuis les derniers arbitrages.
- Les scenarios financiers qui parlent encore d'ARR theorique sans CAC, churn et retention reels consolides.
- Les KPI de validation (`Entretiens realises`, `Activation pilote`, `Engagement payant ou fort`, `Prix moyen acceptable`) qui sont encore au stade template.
- La coherence entre l'offre Stripe reelle a `29 EUR` et les cartes simulees `Essentiel / Pro / sur devis`.

## Elements manquants

### Metier / business

- SWOT explicite.
- Projections financieres consolidees avec hypotheses versionnees.
- Vue abonnements canonique regroupant:
  - offre active en production,
  - offres testeables,
  - offres abandonnees,
  - statut de validation.
- Pipeline commercial reel:
  - leads,
  - entretiens,
  - pilotes,
  - conversions,
  - objections,
  - raisons de refus.
- Historique des decisions business centralise au niveau page principale.
- Versionning des hypotheses business.
- Distinction claire entre:
  - donnees observees,
  - suppositions,
  - decisions,
  - prochaines validations.

### Produit / technique

- Structure de donnees centralisee pour tout le business plan.
- Persistance admin pour hypotheses, decisions, risques et tests.
- References de dates/source par bloc de contenu sensible.
- Mecanisme de mise a jour de contenu sans modifier plusieurs fichiers.

## Doublons eventuels

- Le prix et la gamme `29 / 49 / sur devis` sont repetes dans `page.tsx`, `economic-model/data.ts`, `EconomicModelTab.tsx`, `master-plan-planetls.md` et la page d'abonnement.
- La priorite "conciergeries / petites conciergeries" est repetee dans `page.tsx`, `validationData.ts`, `riskData.ts`, `business-context.md` et le Master Plan.
- La logique "abonnement d'abord, commission ensuite" apparait dans plusieurs blocs editoriaux.
- La roadmap existe sous plusieurs formes:
  - plan 30 jours,
  - priorites 90 jours,
  - plan 12 mois,
  - timeline business non branchee.
- Les risques sont presents en synthese dans `page.tsx` et en detail dans `riskData.ts`, sans source centralisee unique visible dans la page.

## Elements obsoletes ou incoherents

- `docs/ai/contexts/pilotage-business-context.md` mentionne `BusinessCollapsibleSection` comme element de la page, alors que ce composant n'est pas utilise par `page.tsx`.
- Le dossier `business-strategy` porte une logique d'edition locale via `localStorage`, alors que le cockpit business actuel raconte plutot une narration executive statique.
- `PromptLibraryCenter`, `LeanValidationDashboard`, `RiskRegister` et `StrategicDecisionAssistant` existent comme modules quasi autonomes mais ne sont pas reels dans le parcours utilisateur actuel du business plan.
- Le business plan principal affiche des KPI live produit, mais les KPI business / validation sont ailleurs et non relies.
- Le theme personas est disperse:
  - docs formelles,
  - profils tarifaires,
  - segment payeur,
  - hypothese de validation,
  sans modele commun.
- Le module `EconomicModelTab` est plus clair sur la gouvernance `reel vs simulation` que le reste de la page. Cette regle n'est pas encore generalisee a tout le business plan.

## Donnees actuellement codees en dur

### Dans `page.tsx`

- scenarios financiers
- benchmark concurrents
- matrice comparative des capacites
- lecture TAM / SAM / SOM
- plan 12 mois
- priorites 90 jours
- grille `Qui paie quoi`
- messages de proposition de valeur
- conclusions de benchmark

### Dans `economic-model/data.ts`

- profils de pricing
- offre de production visible
- strategies de pricing
- journal initial de decisions pricing

### Dans `EconomicModelTab.tsx`

- cartes d'offres simulees
- matrice de fonctionnalites
- scenarios de simulation
- projections narratives
- backlog des tests tarifaires
- notation executive des modeles

### Dans `validationData.ts`

- diagnostic initial
- hypotheses prioritaires
- planning 30 jours
- 13 tests Lean
- scripts d'entretiens
- variants de landing
- KPI de validation
- grille go / test more / pivot
- recommandations d'integration

### Dans `riskData.ts`

- registre complet des risques

## Elements a deplacer dans une structure de donnees centralisee

Priorite haute:

- offre de production et metadonnees abonnement
- hypotheses de pricing
- segments / personas business
- benchmark concurrence
- KPI business et KPI validation
- roadmap business
- risques
- journal des decisions

Priorite moyenne:

- scripts d'entretiens
- landing variants
- backlog des tests tarifaires
- messages de recrutement / relance / pilote
- comparaisons editoriales

Structure cible minimale recommandee:

- `businessPlanMeta`
- `businessPersonas`
- `businessValueProposition`
- `businessCompetitors`
- `businessPricing`
- `businessSubscriptions`
- `businessRoadmap`
- `businessFinancials`
- `businessKpis`
- `businessRisks`
- `businessDecisions`
- `businessValidationPlan`

## Dette technique

- Pas de source de verite unique pour le business plan.
- Trop de contenu sensible au temps est embarque dans les composants React.
- Presence de modules riches mais non branches, ce qui augmente la dette de comprehension.
- `business-strategy` repose sur `localStorage`, donc:
  - non partage,
  - non auditable,
  - non versionne,
  - non administrable.
- Le contenu business depend de plusieurs fichiers sans contrat de donnees commun.
- La page melange:
  - traction produit live,
  - hypotheses business,
  - strategie commerciale,
  - narration board,
  sans typage metier transversal.
- Aucun indicateur n'identifie clairement si une valeur est:
  - observee,
  - estimee,
  - simulee,
  - obsolete.

## Recommandations

1. Conserver l'architecture actuelle de la page `admin/pilotage` et ses 5 onglets.
2. Extraire les donnees editoriales de `page.tsx` et `EconomicModelTab.tsx` vers un referentiel TypeScript unique avant toute refonte UI.
3. Definir un schema de contenu unique pour distinguer `reel`, `simulation`, `hypothese`, `decision`, `a verifier`.
4. Raccorder progressivement les modules existants utiles plutot que recreer de nouvelles surfaces:
   - `RiskRegister`
   - `LeanValidationDashboard`
   - `StrategicDecisionAssistant`
5. Ne pas brancher tout de suite le dossier `business-strategy` en l'etat:
   - trop local,
   - trop editable,
   - pas aligne avec une source admin persistante.
6. Centraliser d'abord les themes critiques:
   - pricing,
   - abonnements,
   - KPI,
   - risques,
   - roadmap,
   - decisions.
7. Ajouter une datation et un statut de fraicheur sur tout contenu business sensible.
8. Introduire ensuite une persistance admin uniquement si la routine de mise a jour devient reelle.

## Ordre de priorite recommande

### P0 Critique

- Centraliser les donnees business aujourd'hui dispersees.
- Clarifier la source de verite entre offre Stripe reelle et offres simulees.
- Rendre explicite partout la difference entre donnee observee et hypothese.

### P1 Prioritaire

- Unifier pricing, abonnements, personas business, risques, roadmap et decisions.
- Rebrancher proprement `RiskRegister` et `LeanValidationDashboard` dans la page existante ou dans sa structure de donnees.
- Alimenter les KPI de validation avec de vraies valeurs ou assumer clairement leur statut vide.

### P2 Important

- Revoir le benchmark concurrence avec date/source.
- Ajouter SWOT, pipeline commercial et historique des apprentissages terrain.
- Preparer un futur stockage admin persistant.

### P3 Confort

- Nettoyer les modules non branches ou les requalifier explicitement comme `atelier`, `archive` ou `future brique`.
- Harmoniser les formulations repetitives entre page, docs et Master Plan.

## Plan de transformation du Business Plan PlanetLS

### P0 Critique

1. Creer un referentiel de donnees business unique sous `src/app/dashboard/admin/pilotage/` ou `src/features/business-plan/`.
2. Y deplacer sans changer l'interface:
   - benchmark,
   - pricing,
   - offre reelle,
   - roadmap,
   - risques,
   - KPI de validation,
   - decisions.
3. Ajouter pour chaque bloc:
   - `sourceType`,
   - `lastReviewedAt`,
   - `confidence`,
   - `status`.

### P1 Prioritaire

4. Faire converger `page.tsx` et `EconomicModelTab.tsx` vers ce referentiel unique.
5. Raccorder le registre des risques au lieu de dupliquer une synthese statique.
6. Raccorder la validation marche de facon modulaire:
   - hypotheses,
   - tests,
   - KPI,
   - go/no-go.
7. Creer un modele canonique `businessPersonas` distinct du document produit de profils.

### P2 Important

8. Ajouter les sections manquantes:
   - SWOT
   - pipeline commercial
   - projections financieres versionnees
   - historique des objections et apprentissages terrain
9. Ajouter un marquage visuel uniforme:
   - `Donnee reelle`
   - `Hypothese`
   - `Simulation`
   - `A actualiser`

### P3 Confort

10. Reevaluer le dossier `business-strategy`:
    - soit comme atelier local a conserver hors parcours principal,
    - soit comme base d'un futur editeur admin persistant.
11. Nettoyer les docs de contexte qui decrivent des composants non reels ou plus branches.
12. Aligner le Master Plan, le cockpit business et les documents annexes sur un meme vocabulaire business.

## Conclusion

L'existant est deja riche et exploitable pour raconter PlanetLS, arbitrer une offre et structurer une discussion business. En revanche, il reste principalement editorial, statique et disperse. Le chantier prioritaire n'est pas une refonte d'interface, mais la centralisation des donnees, la clarification des niveaux de verite et la reduction des doublons entre cockpit, documentation et modules dormants.
