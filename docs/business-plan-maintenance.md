# Maintenance du Business Plan PlanetLS

Date de reference : 2026-08-07

## Objectif

Le Business Plan PlanetLS ne doit pas devenir un document decoratif ou obsolete.

Le `Business Impact Check` sert a detecter, apres chaque evolution importante du projet, si certaines parties du Business Plan doivent etre relues, mises a jour ou simplement marquees `A actualiser`.

Ce mecanisme ne modifie jamais automatiquement une hypothese strategique, un prix, un cout, un KPI business ou un chiffre de marche sans validation humaine.

Il sert a :

- signaler le changement ;
- identifier les sections concernees ;
- proposer la mise a jour ;
- marquer la donnee `A actualiser` ou `A valider` si necessaire ;
- consigner la verification dans la documentation de pilotage.

## Sources de verite concernees

- `docs/master-plan-planetls.md`
- `src/app/dashboard/admin/(business)/pilotage/business-plan-reference.ts`
- `src/app/dashboard/admin/(business)/pilotage/businessPlanData.ts`
- `docs/business-plan-data-model.md`
- `docs/business-plan-financial-model.md`

## Quand declencher un Business Impact Check

Le controle est obligatoire apres toute evolution importante touchant au moins un des cas suivants :

- nouvelle fonctionnalite ;
- suppression de fonctionnalite ;
- changement d'abonnement ;
- changement de tarif ;
- nouveau persona ;
- nouvelle source de revenu ;
- nouvelle integration IA ;
- nouveau service marketplace ;
- changement d'architecture significatif ;
- nouveau cout recurrent.

Le controle est aussi recommande lorsqu'une evolution :

- change la promesse commerciale percue ;
- modifie le parcours principal d'un segment prioritaire ;
- invalide une hypothese de validation marche ;
- introduit un nouveau risque ou en reduit un de facon significative.

## Zones du Business Plan potentiellement impactees

Le `Business Impact Check` doit verifier explicitement si l'evolution touche :

- proposition de valeur ;
- roadmap ;
- modele economique ;
- tarification ;
- couts ;
- revenus ;
- marche ;
- concurrence ;
- risques ;
- KPI.

## Regle fondamentale

Une evolution produit ne vaut pas validation business.

Exemples :

- une nouvelle fonctionnalite ne prouve pas a elle seule une meilleure proposition de valeur ;
- un nouveau simulateur ne remplace pas des KPI reels ;
- un changement d'architecture n'autorise pas a modifier automatiquement un cout recurrent non confirme ;
- un nouveau module IA ne prouve ni un revenu additionnel, ni un avantage concurrentiel durable.

## Processus Business Impact Check

### Etape 1 - Identifier la nature du changement

Documenter le changement avec :

- type de changement ;
- perimetre code ou produit ;
- date ;
- preuve locale `fichiers, migration, page, route, composant, offre, doc` ;
- raison du changement.

### Etape 2 - Evaluer le niveau d'impact

Utiliser 4 niveaux simples :

- `Aucun`
- `Faible`
- `Moyen`
- `Fort`

Questions de tri :

- Ce changement modifie-t-il ce que PlanetLS promet ?
- Ce changement modifie-t-il ce qui est vendu ou a quel prix ?
- Ce changement modifie-t-il la structure de couts ou de revenus ?
- Ce changement change-t-il la cible prioritaire ou un segment de marche ?
- Ce changement rend-il une hypothese plus credible, plus faible ou obsolete ?
- Ce changement cree-t-il un nouveau risque ou reduit-il un risque existant ?
- Ce changement impose-t-il de nouveaux KPI ou rend-il certains KPI obsoletes ?

### Etape 3 - Mapper les sections impactees

Pour chaque evolution importante, marquer les sections du Business Plan touchees.

Format recommande :

```md
Business Impact Check
- Changement : ...
- Type : ...
- Impact global : Faible / Moyen / Fort
- Sections concernees :
  - Proposition de valeur
  - Tarification
  - Risques
- Action recommandee :
  - Marquer `A actualiser`
  - Ouvrir une revue humaine
  - Attendre validation terrain avant modification de fond
```

### Etape 4 - Choisir l'action autorisee

Actions autorisees sans validation humaine supplementaire :

- ajouter une note de changement dans le Master Plan ;
- signaler qu'une section est possiblement impactee ;
- marquer une donnee `A actualiser` ;
- marquer une donnee `A valider` ;
- ajouter une proposition de mise a jour ;
- consigner les preuves et les fichiers concernes.

Actions interdites sans validation humaine :

- changer automatiquement une hypothese de prix ;
- changer automatiquement un chiffre de marche ;
- changer automatiquement une projection financiere definitive ;
- presenter comme `Valide` une hypothese seulement parce qu'une fonctionnalite a ete codee ;
- remplacer un KPI `A mesurer` par une estimation non verifiee ;
- modifier un cout recurrent sans element concret ou contrat confirme.

### Etape 5 - Consigner la revue

Apres chaque changement important :

1. ajouter la trace de l'evolution dans `docs/master-plan-planetls.md` ;
2. indiquer si un `Business Impact Check` a ete fait ;
3. noter les sections du Business Plan concernees ;
4. preciser l'action recommandee ;
5. indiquer si une mise a jour du referentiel business est requise maintenant ou plus tard.

## Matrice de correspondance

### 1. Nouvelle fonctionnalite

Verifier :

- proposition de valeur ;
- roadmap ;
- KPI ;
- risques ;
- marche si la fonctionnalite vise un nouveau cas d'usage ;
- concurrence si elle change le positionnement.

Action frequente :

- marquer `Solution`, `Proposition de valeur`, `Roadmap` ou `Produit` en `A actualiser` si le discours n'est plus complet.

### 2. Suppression de fonctionnalite

Verifier :

- proposition de valeur ;
- roadmap ;
- risques ;
- concurrence ;
- KPI si un indicateur dependait de cette fonction.

Action frequente :

- marquer les sections narratives qui promettent encore cette capacite.

### 3. Changement d'abonnement

Verifier :

- modele economique ;
- tarification ;
- revenus ;
- proposition de valeur ;
- KPI business ;
- risques commerciaux.

Action frequente :

- marquer `Modele economique`, `Tarification`, `Previsions financieres` et `Canvas` en `A actualiser`.

### 4. Changement de tarif

Verifier :

- tarification ;
- revenus ;
- couts si le prix est lie a un niveau de service ;
- hypotheses de conversion ;
- risque de refus prix.

Action frequente :

- ne pas remplacer un ancien prix de reference sans validation ;
- ajouter une proposition de mise a jour et garder trace du prix precedent si utile.

### 5. Nouveau persona

Verifier :

- personas ;
- proposition de valeur ;
- marche ;
- acquisition ;
- roadmap ;
- risques ;
- concurrence.

Action frequente :

- marquer `Personas / segments clients`, `Marche`, `Go-To-Market` et `Canvas` en `A actualiser`.

### 6. Nouvelle source de revenu

Verifier :

- modele economique ;
- revenus ;
- couts ;
- previsions financieres ;
- risques juridiques ou operationnels ;
- KPI.

Action frequente :

- ouvrir une revue humaine sur `revenu reel`, `revenu hypothetique` ou `revenu a valider`.

### 7. Nouvelle integration IA

Verifier :

- strategie IA ;
- proposition de valeur ;
- couts ;
- risques ;
- concurrence ;
- KPI d'usage.

Action frequente :

- marquer `Strategie IA`, `Couts`, `Risques`, `Proposition de valeur` en `A actualiser`.

### 8. Nouveau service marketplace

Verifier :

- marche ;
- proposition de valeur ;
- revenus ;
- couts ;
- risques ;
- concurrence ;
- KPI de liquidite.

Action frequente :

- ajouter une revue sur la densite locale, la desintermediation et le support operationnel.

### 9. Changement d'architecture significatif

Verifier :

- couts ;
- roadmap ;
- risques ;
- KPI si l'architecture change la capacite de mesure ;
- proposition de valeur uniquement si l'impact est visible pour l'utilisateur.

Action frequente :

- marquer `Risques`, `Roadmap` et `Previsions financieres` si de nouveaux couts recurrences apparaissent.

### 10. Nouveau cout recurrent

Verifier :

- couts ;
- marge brute ;
- previsions financieres ;
- modele economique ;
- score financier ;
- besoin d'ajuster certains seuils KPI.

Action frequente :

- ne pas modifier les projections definitives sans revue humaine ;
- ajouter le cout comme `A valider` si le montant n'est pas encore stabilise.

## Regles de marquage dans le referentiel Business Plan

Dans `business-plan-reference.ts`, utiliser de preference :

- `validated` si l'information reste stable et encore juste ;
- `to_validate` si le changement ouvre une question business mais n'invalide pas encore la donnee ;
- `outdated` si le contenu visible ne correspond plus clairement a la realite du projet ;
- `draft` si une nouvelle idee ou un nouveau bloc apparait sans cadre assez solide.

Ne pas changer la `value` strategique par reflexe.

Avant de toucher la `value`, verifier qu'au moins un des elements suivants existe :

- preuve produit ou code claire ;
- donnee reelle ;
- decision explicite ;
- arbitrage humain formule.

## Resultat attendu du Business Impact Check

Chaque revue doit produire au minimum :

- `impacte / non impacte` ;
- sections concernees ;
- statut propose `A actualiser` ou `A valider` si besoin ;
- justification courte ;
- prochaine action.

## Template operationnel

```md
## Business Impact Check

- Date :
- Evolution :
- Type :
- Perimetre :
- Impact global : Aucun / Faible / Moyen / Fort

- Sections du Business Plan concernees :
  - Proposition de valeur :
  - Roadmap :
  - Modele economique :
  - Tarification :
  - Couts :
  - Revenus :
  - Marche :
  - Concurrence :
  - Risques :
  - KPI :

- Action autorisee immediate :
  - Signaler la modification
  - Marquer `A actualiser`
  - Marquer `A valider`
  - Proposer une mise a jour

- Action interdite sans validation humaine :
  - ...

- Prochaine action :
- Proprietaire recommande :
- Preuves :
```

## Integration recommandee dans le flux de developpement

Quand une mission modifie le produit ou son economie potentielle :

1. faire le changement technique ;
2. relire les fichiers modifies ;
3. executer le `Business Impact Check` ;
4. mettre a jour le `Master Plan` si le changement est significatif ;
5. si necessaire, marquer les blocs Business Plan concernes `A actualiser` ou `A valider` ;
6. ne mettre a jour les hypotheses, prix, projections ou messages strategiques qu'apres arbitrage humain.

## Ce que ce systeme ne fait pas

Le `Business Impact Check` ne :

- remplace pas une decision produit ou finance ;
- ne valide pas un marche ;
- ne transforme pas une hypothese en fait ;
- ne remplace pas un reporting financier reel ;
- n'impose pas de nouvelle base de donnees.

Son role est d'eviter l'obsolescence silencieuse du Business Plan et de rendre visibles les parties qui doivent etre relues.

