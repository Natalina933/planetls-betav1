# Inventaire fonctionnel des dashboards PlanetLS

Date: 2026-08-06

## Objectif

Ce document sert de cartographie avant toute harmonisation plus large des dashboards `owner`, `concierge`, `provider/artisan` et `admin`.

Il repond a trois questions :

1. Quelles fonctionnalites sont deja vraiment branchees dans le repo ?
2. Quelles fonctionnalites sont seulement partielles, legacy, dormantes ou en preparation ?
3. Quelles briques doivent converger d'abord sur le socle partage `UnifiedRoleDashboard`, et lesquelles doivent rester distinctes ?

## Legende

- `Categorie A` : active et utile maintenant
- `Categorie B` : active mais partielle ou encore heterogene
- `Categorie C` : dormante ou secondaire, avec valeur potentielle
- `Categorie D` : preparee ou planifiee, pas encore prioritaire en integration dashboard
- `Categorie E` : experimentale, legacy non prioritaire ou a ne pas etendre telle quelle

- `Niveau 1` : disponible maintenant
- `Niveau 2` : en preparation ou convergable a court terme
- `Niveau 3` : futur, a traiter apres stabilisation du socle

- `Decision` :
  - `Immediate` : a conserver et integrer dans la convergence en cours
  - `Deferred` : a garder mais pas a harmoniser tout de suite
  - `Not recommended` : a ne pas etendre en l'etat

## Constats transverses

- Les pages d'entree `/dashboard/owner`, `/dashboard/concierge`, `/dashboard/provider` et `/dashboard/admin` convergent deja vers `src/app/components/dashboard/unified/UnifiedRoleDashboard.tsx`.
- La strate legacy reste pourtant active sur plusieurs pages secondaires via `DashboardLayout`, `WorkspacePageShell`, `DashboardWorkspace` et `SimpleOverviewWorkspace`.
- Le repo ne contient pas de systeme centralise de feature flags ; la priorisation passe aujourd'hui par le routage, la composition de page et des fallbacks locaux.
- Plusieurs modules metier recents sont reels mais encore hybrides cote donnees, notamment autour des reservations/sejours, de certaines vues equipe/CRM et des agregations admin.
- Le prototype `/premium-owner-dashboard` reste une reference UX possible, mais pas un socle technique a propager tel quel.

## Socle partage et strates UI

| Fonctionnalite | Profil | Emplacement principal | Categorie | Maturite | Source de donnees | UI existante | Action utilisateur | Blocage actuel | Utilite dashboard | Niveau | Dependances | Decision | Recommandation |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|
| Hero/KPI/rails partages `UnifiedRoleDashboard` | Tous | `src/app/components/dashboard/unified/` | A | N3 | Donnees de chaque role | Oui | Lire, prioriser, naviguer | Quelques duplications de styles et de tableaux | Tres forte | Niveau 1 | Pages role, SCSS modules | Immediate | Continuer la convergence page par page sans fusionner les fetchs metier |
| Listes spotlight et piles de stats partagees | Tous | `UnifiedSpotlightList`, `UnifiedStatStack` | A | N3 | Donnees role-specifiques | Oui | Scanner les priorites | Quelques rendus encore ad hoc | Forte | Niveau 1 | `UnifiedRoleDashboard` | Immediate | Generaliser pour missions, alertes, activite et etats vides |
| Legacy `DashboardLayout` + `DashboardPanel` | Surtout admin | `src/components/dashboard/DashboardLayout/` | B | N3 | Donnees reelles | Oui | Lire et agir | Composition heterogene et maintenance double | Moyenne | Niveau 2 | Pages admin secondaires | Deferred | Garder temporairement pour les pages non migrees, ne plus l'etendre |
| `WorkspacePageShell` / `DashboardWorkspace` | Owner/concierge/provider | `src/app/dashboard/_components/` | C | N2 | Donnees reelles ou derivees | Oui | Parcourir un overview | Surcouche redondante par rapport au socle unifie | Moyenne | Niveau 2 | Pages overview secondaires | Deferred | Remplacer progressivement par des vues secondaires branchees sur le socle partage |
| `SimpleOverviewWorkspace` | Owner/concierge/provider | `src/app/dashboard/*/overview/` | C | N2 | Donnees de synthese | Oui | Lire un resume, ouvrir une page cible | Pattern encore utile mais visuellement a part | Moyenne | Niveau 2 | Workspace legacy | Deferred | Le conserver comme etape de transition, puis le rabattre sur des composants unifies |
| Prototype `/premium-owner-dashboard` | Owner | `src/app/premium-owner-dashboard/` | E | N1 | Mock data | Oui | Demo / inspiration | Pas branche sur donnees reelles | Faible court terme | Niveau 3 | `src/features/ownerPremiumDashboard` | Not recommended | Le traiter comme banque d'idees UX, pas comme base d'integration |

## Owner / Proprietaire

| Fonctionnalite | Profil | Emplacement principal | Categorie | Maturite | Source de donnees | UI existante | Action utilisateur | Blocage actuel | Utilite dashboard | Niveau | Dependances | Decision | Recommandation |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|
| Vue d'ensemble owner unifiee | Owner | `src/app/dashboard/owner/page.tsx` | A | N3 | `housing`, `missions`, `quotes`, `invoices`, `reviews`, `messages`, `service_requests` | Oui | Prioriser, ouvrir sejours/missions/devis | Quelques rails encore specifiques | Tres forte | Niveau 1 | `useOwnerDashboardData.ts` | Immediate | Continuer a enrichir avec briques partagees, sans changer les sources owner |
| Logements / portefeuille | Owner | `owner/logements`, `owner/page.tsx` | A | N3 | `housing` | Oui | Voir et gerer ses biens | Normalisation `housing` / `properties` | Forte | Niveau 1 | API housing | Immediate | Conserver comme module central du cockpit owner |
| Missions owner | Owner | `owner/missions`, `owner/page.tsx` | A | N3 | `missions` | Oui | Suivre les operations | Donnees riches encore en `metadata` | Forte | Niveau 1 | workflow missions | Immediate | Harmoniser l'affichage compact avec le socle partage |
| Sejours voyageurs / reservations partagees | Owner | `owner/missions/voyageurs`, `owner/planning` | A | N3 | `reservations` avec fallbacks legacy | Oui | Creer, suivre, enrichir un sejour | Transition encore mixte `reservation_id` / `metadata` | Tres forte | Niveau 1 | reservations, missions, workflow_events | Immediate | Faire converger ce module vers une lecture plus canonique dans le dashboard principal |
| Planning owner | Owner | `owner/planning` | B | N3 | `/api/owner/reservations`, missions | Oui | Lire le calendrier, ouvrir un sejour | Lecture encore plus mature que l'ecriture secondaire | Forte | Niveau 2 | reservations, planning engine | Deferred | Integrer ensuite ses cartes dans le meme langage visuel que le cockpit |
| Devis et demandes | Owner | `owner/devis`, `owner/demandes` | A | N3 | `quotes`, `service_requests` | Oui | Comparer, accepter, convertir | Lien E2E complet encore a consolider | Forte | Niveau 1 | workflow demande->devis->mission | Immediate | Garder ces entrees visibles dans le hero ou les priorites |
| Concierges / matching | Owner | `owner/concierges`, `owner/conciergerie/overview` | B | N3 | profils, demandes, matching | Oui | Comparer, contacter, choisir | Densite locale et champs legacy | Forte | Niveau 2 | profils publics, demandes | Deferred | Important produit, mais pas premier candidat a la convergence UI du cockpit |
| Finances owner | Owner | `owner/finances`, `owner/invoices` | B | N3 | `invoices` | Oui | Lire paiements et factures | Checkout et visibilite des echecs encore partiels | Moyenne a forte | Niveau 2 | Stripe, invoices | Deferred | Converger apres stabilisation transactionnelle |
| CRM / contacts owner | Owner | helper `ownerCrm.ts`, vues owner/concierge | B | N2 | profils, conversations, invoices, quotes, contracts, documents, incidents | Oui partiel | Consolider la relation | Pas de persistance dediee | Moyenne | Niveau 2 | owner CRM helpers | Deferred | Continuer cote donnees avant d'en faire une brique hero du dashboard |
| Litiges / preuves | Owner | `owner/litiges` | B | N2 | inspections, disputes, signed URLs | Oui | Consulter/exporter un dossier | Validation E2E non prouvee | Moyenne | Niveau 2 | disputes, storage prive | Deferred | Garder hors convergence immediate du cockpit principal |

## Concierge / Conciergerie

| Fonctionnalite | Profil | Emplacement principal | Categorie | Maturite | Source de donnees | UI existante | Action utilisateur | Blocage actuel | Utilite dashboard | Niveau | Dependances | Decision | Recommandation |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|
| Vue d'ensemble concierge unifiee | Concierge | `src/app/dashboard/concierge/DashboardPage.tsx` | A | N3 | requests, missions, KPI, conversations, housings, quotes, owners | Oui | Prioriser la journee, basculer par mode | Densite tres forte, certains modules encore hybrides | Tres forte | Niveau 1 | `useConciergeDashboardData.ts` | Immediate | Reference actuelle la plus avancee pour la convergence progressive |
| Demandes / quotes / activite commerciale | Concierge | `concierge/page.tsx`, `concierge/demandes`, `concierge/devis` | A | N3 | `service_requests`, `quotes` | Oui | Repondre, relancer, convertir | Quelques sources encore fragiles selon densite des donnees | Forte | Niveau 1 | service workflow | Immediate | Conserver dans le cockpit quotidien et harmoniser les listes compactes |
| Planning operationnel / missions | Concierge | `concierge/planning`, `concierge/page.tsx` | A | N3 | `missions`, planning engine | Oui | Affecter, suivre, planifier | Temps de trajet et drag-and-drop encore incomplets | Tres forte | Niveau 1 | missions, planning | Immediate | Priorite forte de convergence secondaire apres les pages d'entree |
| Sejours / reservations | Concierge | `concierge/sejours`, `api/concierge/stays`, `api/concierge/reservations` | A | N3 | `reservations` + fallbacks legacy | Oui | Lire, editer, faire avancer un sejour | Transition encore hybride avec historique metadata | Tres forte | Niveau 1 | reservations, workflow events | Immediate | Aligner ensuite le planning concierge sur la meme chronologie canonique |
| Logements concierge | Concierge | `concierge/logements`, overview | A | N3 | housing/properties | Oui | Superviser le parc | Coexistence de modeles de biens | Forte | Niveau 1 | housing, collaborations | Immediate | A garder central dans la navigation et dans les filtres transverses |
| Proprietaires / CRM | Concierge | `concierge/proprietaires`, helper CRM | B | N2 | profils, conversations, devis, incidents, contrats | Oui partiel | Relire une relation owner | Pas de persistance CRM canonique | Forte | Niveau 2 | owner CRM, messages | Deferred | Valeur forte, mais converger apres la stabilisation des donnees |
| Finances concierge | Concierge | `concierge/finances`, dashboard | B | N3 | missions, quotes, invoices, KPIs | Oui | Lire marge, facturation, tension | Cadrage encore melange entre donnees reelles et lectures derivees | Forte | Niveau 2 | billing, kpis | Deferred | A harmoniser apres les surfaces coeur `journee / planning / sejours` |
| Equipe et affectations | Concierge | planning, equipe, affectation | B | N2 | tables equipe + repli local | Oui partiel | Assigner des personnes | Persistance et migration a consolider | Forte | Niveau 2 | team tables, RLS | Deferred | Important fonctionnellement, mais encore incomplet structurellement |
| Maintenance / incidents / stocks | Concierge | maintenance-related routes/tests | B | N2-N3 | incidents, interventions, workflow | Oui partiel | Declarer, suivre, cloturer | Parfois encore repartis entre modules et `metadata` | Forte | Niveau 2 | incidents, provider interventions | Deferred | A connecter ensuite dans un rail transversal d'alertes |
| Tarification, packs, contrats | Concierge | specs, pages metier, dashboard business | B | N3 | pricing, services, contracts | Oui | Parametrer l'offre | Complexite metier et lisibilite encore a valider | Moyenne a forte | Niveau 2 | pricing v2, contracts | Deferred | Rester role-specifique, sans forcer un composant universel trop tot |
| Assistant decoration | Concierge | page/API/tests dedies | C | N2 | `decoration_ai_reports` | Oui partiel | Produire une recommandation | Table pas appliquee partout, pas d'image reelle | Moyenne | Niveau 3 | AI reports | Deferred | Garder comme module annexe tant que la valeur terrain n'est pas prouvee |

## Provider / Artisan

| Fonctionnalite | Profil | Emplacement principal | Categorie | Maturite | Source de donnees | UI existante | Action utilisateur | Blocage actuel | Utilite dashboard | Niveau | Dependances | Decision | Recommandation |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|
| Vue d'ensemble provider unifiee | Provider | `src/app/dashboard/provider/page.tsx` | A | N3 | workspace, clients, interventions, alerts, messages, quotes, billing | Oui | Voir priorites, accepter, naviguer | Quelques composants encore recents | Tres forte | Niveau 1 | `useProviderDashboardData.ts` | Immediate | Poursuivre la convergence visuelle sans diluer le focus mobile/terrain |
| Interventions / missions | Provider | `provider/interventions`, dashboard | A | N3 | interventions + missions | Oui | Suivre et executer | Paiement encore incomplet | Tres forte | Niveau 1 | provider interventions | Immediate | Conserver comme coeur du cockpit artisan |
| Alertes et priorites terrain | Provider | dashboard | A | N3 | workspace alerts | Oui | Reagir vite | Besoin de plus d'uniformite dans les etats vides/erreurs | Forte | Niveau 1 | provider workspace API | Immediate | Bon candidat a la factorisation des cartes spotlight |
| Messages provider | Provider | dashboard, messages UI | B | N3 | conversations/messages | Oui | Echanger avec donneur d'ordre | QA fermeture/reouverture incomplete | Forte | Niveau 2 | provider messaging | Deferred | Converger apres verification E2E supplementaire |
| Devis / facturation provider | Provider | dashboard, finances | B | N3 | quotes, billing history, invoices | Oui | Lire ses paiements et devis | Paiement final pas entierement prouve | Moyenne a forte | Niveau 2 | billing, Stripe | Deferred | Important mais secondaire apres execution terrain |
| Clients provider | Provider | `provider/clients/overview` | C | N2 | workspace clients | Oui partiel | Voir ses donneurs d'ordre | Vue encore tres overview/legacy | Moyenne | Niveau 2 | workspace shell legacy | Deferred | A rabattre plus tard sur un pattern compact partage |
| Profil metier / documents | Provider | profil provider, migrations docs | B | N3 | `profiles`, `provider_profile_documents` | Oui | Completer son profil, fournir des preuves | Validation admin et vue publique detaillee manquent | Forte | Niveau 2 | profile docs, reviews | Deferred | A garder hors dashboard home tant que le cycle de verification n'est pas complet |
| Mobile-first / navigation mission | Provider | dashboard + bottom nav | A | N3 | Donnees provider | Oui | Aller vite sur terrain | Verif navigateur mobile partielle | Tres forte | Niveau 1 | dashboard layout, bottom nav | Immediate | Preserver cette exigence dans toute convergence future |

## Admin / Administrateur

| Fonctionnalite | Profil | Emplacement principal | Categorie | Maturite | Source de donnees | UI existante | Action utilisateur | Blocage actuel | Utilite dashboard | Niveau | Dependances | Decision | Recommandation |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|
| Vue d'ensemble admin unifiee | Admin | `src/app/dashboard/admin/page.tsx` | A | N3 | `/api/admin/operations`, `/api/admin/overview`, `/api/admin/control-tower`, `/api/kpis/overview` | Oui | Lire priorites, suivre la sante, ouvrir les espaces | Quelques tableaux/detail pages encore sur legacy | Tres forte | Niveau 1 | unified dashboard + endpoints admin | Immediate | Continuer la convergence a partir de cette home |
| Controle admin | Admin | `admin/controle/page.tsx` | B | N3 | control-tower et signaux admin | Oui | Auditer sante, messages, missions, inscriptions | Repose encore sur `DashboardLayout` | Tres forte | Niveau 2 | admin legacy layout | Immediate | Prochain candidat naturel de migration vers le socle partage |
| Pilotage business | Admin | `admin/pilotage/page.tsx` | B | N3 | endpoints admin + project advisor | Oui | Arbitrer acquisition/activation/pricing | Page dense, encore sur `DashboardLayout` | Forte | Niveau 2 | advisor, KPI, business rules | Deferred | Migrer apres `controle`, sans perdre sa structure strategique propre |
| Mission Control developpement | Admin | `admin/developpement` | A | N3 | Master Plan, Git, health cards | Oui | Lire progression, charge, memoire | Beaucoup de contenu, pas un dashboard role `standard` | Forte | Niveau 1 | `missionControl.ts`, master plan parser | Immediate | A traiter comme cockpit specialise, pas comme simple clone des autres homes |
| Admin people / vues role-specifiques | Admin | `AdminPeopleWorkspace.tsx` | B | N3 | profils, users, entites metier | Oui | Filtrer et auditer les comptes | Large surface encore legacy | Forte | Niveau 2 | DashboardLayout, admin data | Deferred | Migrer par morceaux plutot qu'en un seul lot |
| Decisions architecture | Admin | `admin/decisions-architecture` | A | N3 | donnees derivees du Master Plan | Oui | Rechercher des arbitrages | Heuristiques et pas de persistance ADR | Moyenne a forte | Niveau 2 | master plan, decision data | Deferred | Garder comme espace expert, pas comme bloc home prioritaire |
| Centre IA / prompt library | Admin | `admin/pilotage/ai-center`, `docs/ai/` | C | N2-N3 | fichiers Markdown + route admin | Oui | Rechercher et consulter des prompts | Favoris/runs non persistés | Moyenne | Niveau 3 | prompt library server | Deferred | Conserver comme annexe admin utile, pas comme brique de convergence commune |
| Validation schema / inspection operationnelle | Admin | operations/control/developpement | B | N3 | schema distant, health, mission control | Oui | Diagnostiquer des ecarts | Types Supabase encore incomplets | Forte | Niveau 2 | remote schema, tests | Deferred | Valeur forte, mais reste du pilotage expert admin |

## Lecture strategique

### Niveau 1 — disponible maintenant

- Convergence du hero, des KPI et des rails lateraux sur les homes `owner`, `concierge`, `provider`, `admin`.
- Reutilisation accrue de `UnifiedSpotlightList` et `UnifiedStatStack`.
- Priorite metier immediate : `owner` sejours/missions/devis, `concierge` journee/planning/sejours, `provider` interventions/alertes, `admin` overview/controle.

### Niveau 2 — en preparation

- Migration progressive des pages secondaires encore sur `DashboardLayout`, `WorkspacePageShell` et `SimpleOverviewWorkspace`.
- Harmonisation des tableaux compacts, etats vides, cartes de priorites et modules overview.
- Stabilisation des modules data hybrides avant de leur donner une place plus centrale dans les homes.

### Niveau 3 — futur

- Relecture du prototype premium owner comme source d'inspiration seulement.
- Eventuelle unification plus profonde des modules CRM, finances detaillees, IA, risk register et vues admin expertes.
- Eventuel systeme de feature flags type et centralise si le nombre de variantes continue d'augmenter.

## Recommandations finales

1. Continuer dashboard par dashboard, en commencant par les briques communes et les pages d'entree deja partiellement convergentes.
2. Migrer d'abord les surfaces admin secondaires les plus visibles `controle`, puis `pilotage` avant d'attaquer les overviews legacy plus diffuses.
3. Garder la logique metier et les fetchs par role ; seule la couche de composition doit converger.
4. Ne pas etendre `DashboardLayout`, `WorkspacePageShell` ni le prototype `premium-owner-dashboard` comme nouvelles references.
5. Faire preceder chaque nouvelle harmonisation visuelle importante par un controle de la maturite reelle des donnees et des permissions.
