# Modele de donnees Business Plan PlanetLS

## Objectif

Centraliser les donnees strategiques du Business Plan PlanetLS pour eviter :

- la dispersion entre plusieurs composants et modules ;
- les doublons editoriaux ;
- les statuts incoherents ;
- les donnees importantes codees en dur sans metadata.

Cette architecture doit rester compatible avec l'existant de `/dashboard/admin/pilotage` sans introduire de migration base de donnees non necessaire.

## Choix retenu

La source de verite centralisee est un referentiel TypeScript local :

- fichier canonique : `src/app/dashboard/admin/pilotage/business-plan-reference.ts`
- fichier adaptateur UI compatible : `src/app/dashboard/admin/pilotage/businessPlanData.ts`

Pourquoi ce choix :

- le Business Plan actuel est deja majoritairement local et editorial ;
- les donnees strategiques ne necessitent pas encore d'edition multi-utilisateur temps reel ;
- le projet dispose deja d'un cockpit admin TypeScript fortement couple a ces structures ;
- la solution la plus simple, robuste et evolutive est d'abord un referentiel typed avant toute persistance admin.

## Principe d'architecture

### 1. Couche canonique

`business-plan-reference.ts` contient :

- les types metadata-riches ;
- les statuts de reference ;
- la source de verite metier du Business Plan ;
- les donnees extraites ou reconstruites depuis les modules existants.

Le fichier centralise notamment :

- vision ;
- mission ;
- proposition de valeur ;
- segments clients ;
- personas ;
- problemes clients ;
- solutions ;
- concurrents ;
- avantages concurrentiels ;
- marche ;
- TAM / SAM / SOM ;
- offres ;
- abonnements ;
- tarifs ;
- sources de revenus ;
- hypotheses ;
- KPI ;
- roadmap ;
- risques ;
- SWOT ;
- projections financieres ;
- plan d'action.

### 2. Couche d'adaptation

`businessPlanData.ts` ne doit plus etre considere comme la source metier principale.

Son role devient :

- conserver les types et exports attendus par `page.tsx` ;
- transformer le referentiel canonique vers les tableaux ou listes deja utilises par l'UI ;
- maintenir la compatibilite sans refonte destructive.

## Contrat de donnees

### Type de base

Chaque donnee importante s'appuie sur un contrat commun :

```ts
type BusinessPlanField<T> = {
  value: T;
  source: BusinessPlanSource;
  lastUpdatedAt: string;
  confidence: "low" | "medium" | "high";
  status: "draft" | "to_validate" | "validated" | "outdated";
  comment?: string;
  owner?: string;
};
```

Pour les listes structurees :

```ts
type BusinessPlanEntity<T> = BusinessPlanField<T> & {
  id: string;
};
```

## Semantique des statuts

- `draft` : information encore partielle, non cadree ou seulement narrative.
- `to_validate` : information plausible et exploitable, mais encore a confirmer avec des preuves complementaires.
- `validated` : information assez stable pour servir de reference actuelle.
- `outdated` : information utile historiquement, mais a actualiser avant arbitrage important.

## Semantique du niveau de confiance

- `low` : hypothese, benchmark interne, scenario ou reconstruction fragile.
- `medium` : element coherent avec plusieurs sources internes mais encore incomplet.
- `high` : information appuyee par le Master Plan, une offre de production reelle, ou un module metier deja structure.

## Sources reliees

Le referentiel central ne reinvente pas les donnees. Il s'appuie sur :

- `docs/master-plan-planetls.md`
- `src/app/dashboard/admin/pilotage/economic-model/data.ts`
- `src/app/dashboard/admin/pilotage/market-validation/validationData.ts`
- `src/app/dashboard/admin/pilotage/risk-register/riskData.ts`
- les contenus editoriaux deja presents dans l'ancien `businessPlanData.ts`

## Donnees reelles vs hypotheses vs simulations

Le point critique de gouvernance est de ne plus melanger les natures de donnees.

### Donnees a considerer comme reelles

- mission et vision issues du Master Plan ;
- offre Stripe existante `Conciergerie Pro` ;
- profils prix et structures tarifaires deja documentes dans `economic-model/data.ts` ;
- registre de risques structure ;
- KPI produit deja exposes par l'API admin.

### Donnees a considerer comme hypotheses

- segment payeur dominant final ;
- adoption du palier `49 EUR` ;
- poids futur du `sur devis` ;
- priorisation definitive des personas au-dela de la conciergerie.

### Donnees a considerer comme simulations

- scenarios financiers `Pilote local`, `Traction regionale`, `Portefeuille sur devis` ;
- comparaisons benchmark prix si elles ne sont pas re-verifiees ;
- projection de commission comme source de revenu principale.

## Pourquoi pas une nouvelle base de donnees

Une migration vers Supabase ou une nouvelle table admin n'est pas necessaire a ce stade, parce que :

- le besoin principal est d'abord la coherence et la lisibilite des donnees ;
- il n'existe pas encore de workflow d'edition admin stabilise a brancher ;
- la plupart des donnees restent peu frequemment modifiees ;
- la page actuelle a surtout besoin d'une source unique, pas d'un CMS complet.

Une persistance future ne devra etre envisagee que si au moins un des besoins suivants apparait :

- edition multi-utilisateur ;
- historique d'arbitrage structure ;
- workflow de validation formel ;
- import de donnees business externes ;
- synchronisation avec reporting financier ou CRM.

## Organisation recommandee a court terme

### A garder en source canonique locale

- vision / mission ;
- proposition de valeur ;
- SWOT ;
- hypotheses ;
- plan d'action ;
- benchmark interne ;
- TAM / SAM / SOM si non encore branches a une source externe fiable.

### A faire deriver depuis les modules specialises

- offres et abonnements depuis `economic-model/data.ts` ;
- risques depuis `riskData.ts` ;
- hypotheses de validation depuis `validationData.ts` ;
- indicateurs produits depuis les endpoints KPI et non depuis du texte statique quand c'est possible.

## Regles de gouvernance

- Toute nouvelle donnee strategique doit etre ajoutee d'abord dans `business-plan-reference.ts`.
- `businessPlanData.ts` ne doit pas recreer une nouvelle verite metier.
- Si une information provient d'un module specialise, l'adaptateur UI doit la lire depuis la source canonique ou depuis le module d'origine via le referentiel central.
- Toute donnee sans `source`, `lastUpdatedAt`, `confidence` ou `status` doit etre consideree comme techniquement incomplete.
- Toute evolution importante du projet doit passer par un `Business Impact Check` documente dans `docs/business-plan-maintenance.md` avant de conclure qu'aucune section du Business Plan n'est a relire.

## Dette technique restante

- certaines structures UI gardent encore des tableaux de comparaison purement presentationnels ;
- les KPI business ne sont pas encore tous branches sur des donnees observees ;
- le benchmark concurrence reste un benchmark interne et non un relevé externe date ;
- les scenarios financiers ne sont pas encore modelises comme moteur de calcul canonique ;
- les liens `Annexes` restent en partie documentaires et non data-driven.

## Prochaine etape recommandee

1. Faire evoluer progressivement `page.tsx` pour afficher plus de metadata utiles depuis le referentiel central.
2. Ajouter des helpers de lecture par section pour simplifier les composants du cockpit.
3. Clarifier visuellement dans l'UI la difference entre `reel`, `hypothese` et `simulation`.
4. Ne considerer une persistance admin que lorsque le workflow d'edition sera explicitement defini.
