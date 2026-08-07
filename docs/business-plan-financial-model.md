# Modele financier du Business Plan PlanetLS

## Objectif

Le module `Previsions financieres` du Business Plan PlanetLS fournit un cadre de simulation SaaS sur 5 ans pour comparer plusieurs scenarios sans toucher aux offres de production ni aux donnees Stripe.

Le modele est volontairement separe en trois couches :

1. `Hypotheses`
2. `Calculs`
3. `Resultats`

La source de verite technique des formules est :

- `src/app/dashboard/admin/pilotage/economic-model/financialModel.ts`

La surface de restitution dans le cockpit business est :

- `src/app/dashboard/admin/pilotage/economic-model/FinancialForecastModel.tsx`

## Hypotheses

Chaque scenario `Prudent`, `Central`, `Ambitieux` embarque un bloc d'hypotheses editable localement dans l'interface.

### Clients

- `startingCash` : tresorerie initiale injectee dans la simulation.
- `newFreeClientsYear1` : nouveaux comptes gratuits attendus sur l'annee 1.
- `annualAcquisitionGrowthPct` : croissance annuelle du flux de nouveaux comptes gratuits.
- `freeToPaidConversionPct` : part du stock gratuit convertie en payant chaque mois.
- `monthlyPaidChurnPct` : part des clients payants perdus chaque mois.
- `annualPlanMixPct` : part des clients payants engages sur une formule annuelle.
- `tierMixEssentialPct`, `tierMixProPct`, `tierMixBusinessPct` : repartition du portefeuille payant entre les offres candidates.

### Revenus

- `marketplaceActivePaidPct` : part des clients payants qui utilisent activement la marketplace.
- `marketplaceGmvPerActiveClientMonthly` : GMV mensuel moyen par client payant actif marketplace.
- `marketplaceCommissionPct` : commission retenue sur ce GMV.
- `servicesAttachRatePct` : part des clients payants consommant des services complementaires.
- `servicesRevenuePerClientMonthly` : revenu mensuel additionnel par client concerne.
- `otherRevenueMonthly` : poche libre pour d'autres revenus eventuels.

### Couts

- `developmentMonthly`
- `hostingMonthly`
- `supabaseMonthly`
- `vercelMonthly`
- `aiFixedMonthly`
- `aiVariablePerPaidClientMonthly`
- `paymentFeePct`
- `marketingMonthly`
- `freelancersMonthly`
- `supportFixedMonthly`
- `supportVariablePerPaidClientMonthly`
- `legalMonthly`
- `accountingMonthly`
- `otherSaasMonthly`

Toutes ces valeurs restent des hypotheses de pilotage. Elles ne doivent pas etre presentees comme des couts contractuels ou des donnees comptables reelles tant qu'elles n'ont pas ete consolidees.

## Calculs

Le modele tourne mensuellement sur 5 ans, puis consolide les sorties par annee.

### Acquisition

- `newFreeClients(year)` = `newFreeClientsYear1 * (1 + annualAcquisitionGrowthPct)^(year - 1)`
- `newFreeClients(month)` = `newFreeClients(year) / 12`

### Conversion et retention

- `newPaidClients(month)` = `freeClients * freeToPaidConversionPct`
- `churnedClients(month)` = `paidClients * monthlyPaidChurnPct`
- `freeClients(end)` = `freeClients(start) + newFreeClients - newPaidClients`
- `paidClients(end)` = `paidClients(start) + newPaidClients - churnedClients`

### Prix moyen d'abonnement

Le prix mensuel effectif est calcule depuis :

- les prix des offres candidates `ESSENTIAL`, `PRO`, `BUSINESS`
- leur remise annuelle
- le mix annuel
- le mix de portefeuille par offre

Forme simplifiee :

- `effectiveMonthlyPrice = somme(prix_offre_ajuste * poids_offre)`

avec :

- `prix_offre_ajuste = prix_mensuel * (1 - annualPlanMixPct * remise_annuelle)`

### Revenus

- `subscriptionMrr = paidClients * effectiveMonthlyPrice`
- `marketplaceRevenue = paidClients * marketplaceActivePaidPct * marketplaceGmvPerActiveClientMonthly * marketplaceCommissionPct`
- `servicesRevenue = paidClients * servicesAttachRatePct * servicesRevenuePerClientMonthly`
- `otherRevenue = otherRevenueMonthly`
- `totalRevenue = subscriptionMrr + marketplaceRevenue + servicesRevenue + otherRevenue`

### Couts

#### Couts directs

- `hostingMonthly`
- `supabaseMonthly`
- `vercelMonthly`
- `aiFixedMonthly`
- `paidClients * aiVariablePerPaidClientMonthly`
- `totalRevenue * paymentFeePct`
- `supportFixedMonthly`
- `paidClients * supportVariablePerPaidClientMonthly`

#### Couts operatoires

- `developmentMonthly`
- `marketingMonthly`
- `freelancersMonthly`
- `legalMonthly`
- `accountingMonthly`
- `otherSaasMonthly`

Puis :

- `totalCosts = directCosts + operatingCosts`

### Cash

- `netCashFlow = totalRevenue - totalCosts`
- `burnRate = max(0, -netCashFlow)`
- `cashBalance(end) = cashBalance(start) + netCashFlow`

### KPI

- `MRR` : revenu mensuel de fin de periode tel qu'affiche par le modele
- `ARR = MRR * 12`
- `ARPU = totalRevenue / paidClients`
- `CAC = marketing spend / new paid clients`
- `grossMarginPct = (totalRevenue - directCosts) / totalRevenue`
- `LTV = ARPU * grossMarginPct / monthlyPaidChurnPct`
- `LTV/CAC = LTV / CAC`
- `runwayMonths = cashBalance / averageBurnRate` si le cash et le burn sont positifs et calculables
- `breakEvenMonth` : premier mois ou `totalRevenue >= totalCosts`

## Resultats affiches dans le cockpit

La section `Previsions financieres` expose :

- des cartes KPI de fin de periode
- un comparatif des scenarios `Prudent / Central / Ambitieux`
- un tableau annuel sur 5 ans
- un graphique simple `revenus versus couts`
- une lecture cash / break-even / runway

## Points d'attention

- Le `MRR` affiche ici une lecture de run-rate mensuelle pour le cockpit business. Il inclut les revenus mensuels simules visibles dans la section, pas uniquement l'abonnement SaaS pur.
- Le `CAC` et la `LTV` restent tres sensibles aux hypotheses de conversion, churn, marge et marketing.
- Le `runway` n'est interpretable que si une tresorerie de depart pertinente a ete renseignee.
- Le `break-even` n'est pas une preuve de rentabilite comptable annuelle. C'est un signal mensuel de simulation.

## Gouvernance recommandee

- Utiliser `Central` comme scenario de travail par defaut.
- Garder `Prudent` comme borne basse de resilience.
- Garder `Ambitieux` comme borne haute de traction.
- Reviser les hypotheses a chaque changement d'offre, de canaux d'acquisition, de structure de couts ou de donnees terrain.
- Ne pas dupliquer les formules dans plusieurs composants : toute evolution du modele doit partir de `financialModel.ts`.
