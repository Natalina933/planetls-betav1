# Atelier des pages PlanetLS

Périmètre : `/design-system/pages`, quatre listes de démonstration et une fiche de logement Propriétaire, sans branchement métier. Ce guide décrit les compositions et leur correspondance avec le site ; il ne remplace pas le Master Plan.

## Deuxième lot — fiche logement Propriétaire

Accès : sélectionner **Propriétaire**, puis **Fiche**. Aucun autre espace ne dispose de fiche. Le bouton de retour revient à la liste Propriétaire et remet le focus sur le sélecteur de modèle. Les boutons de consultation des listes gardent leur simulation du premier lot.

La composition locale `OwnerHousingDetail` réutilise Card/CardBody, Badge, Button, Select, Tabs/TabsList/TabsTrigger/TabsContent, Alert et AsyncState. ButtonLink a été examiné ; le retour est une action locale, donc un Button convient. La vraie fiche utilise `next/image` : ici, un emplacement neutre évite tout emprunt de photo ou appel d’image distant. Aucun composant partagé n’est extrait.

Routes examinées : `/dashboard/owner/logements` (HousingListPage), `/create` (CreateHousingForm), `/overview` (synthèse connectée) et `/[id]` (informations, images, documents, équipements, planning et missions intégrés à la page métier). Ces routes, leurs composants connectés et leurs hooks restent inchangés. Leurs structures inspirent les rubriques, sans importer leurs appels de données.

Fixtures : `ownerDetailFixtures.ts` contient un appartement et une localisation imaginaires, une capacité de deux personnes, une surface inconnue affichée « Non renseignée », un séjour, quatre équipements, deux interventions, deux intitulés de documents sans fichiers et trois événements datés. Aucun montant ni aucune personne réelle. Les onglets changent réellement le contenu local ; les actions et confirmations sont explicitement simulées.

États : normal, chargement, vide, erreur technique, succès, logement incomplet et aucune réservation à venir. Une information à compléter n’empêche pas d’afficher la fiche ; une erreur technique masque les informations non confirmées. Les variantes adaptent également l’activité et la réservation pour éviter les contradictions.

Vérification : TypeScript et ESLint ciblé réussis ; 3 tests architecture/snapshot réussis ; scénario des quatre listes réussi ; nouveau scénario fiche réussi après correction de son assertion sur l’attribut natif `disabled` d’une option. Les sept états, cinq onglets, flèche clavier, Entrée, focus et retour ont été contrôlés. Les quatre largeurs 1600/1366/768/390 px passent sans débordement général ; boutons et onglets d’au moins 44 px de hauteur, emplacement neutre sans déformation. Captures `test-results/page-workshop/owner-detail-*.png`, dont 390 et 1600 relues visuellement. Aucune erreur console ni API métier dans le scénario final. `git diff --check` et encodage UTF-8 sans BOM contrôlés.

Documentation : seules les mentions contradictoires d’Alert ont été corrigées dans DESIGN_SYSTEM.md et le README UI. DashboardCockpit reste proposé. Limites : Chromium local, pas de lecteur d’écran ni de validation exhaustive multithème ; aucune édition, aucun téléchargement ou enregistrement réel. Prochaine petite étape proposée : recueillir les retours sur cette fiche et ajuster sa hiérarchie mobile dans l’atelier. Master Plan non modifié ; aucun commit.

Les sections suivantes conservent le bilan historique du premier lot.

## Avancement constaté avant cette étape

- Implémentés : accueil du Design System, fondations, catalogue visuel, quatre prototypes de dashboards, tokens canoniques `src/styles/tokens/tokens.css`, `DataTable` (table ou cartes mobiles), `TableFilters` et `UnifiedRoleDashboard`. Les composants SaaS ont été centralisés ; les anciens chemins sont des réexports. Le commit `1a2ecc3e` porte la centralisation, `afa940f6` la mise à jour documentaire.
- Partiel : adoption de ces primitives dans les pages métier, harmonisation des styles historiques, validation des prototypes dans tous leurs états. Une présence dans le code ne prouve ni une migration complète ni le bon fonctionnement des données réelles.
- Changements locaux présents : `Alert`, extension explicite d’`AsyncState`, galerie `SharedStatesShowcase`, test `shared-states.spec.ts`, ajustements responsive du prototype Concierge, documentation et configuration des tests. Ils sont préservés et réutilisés sans les réécrire.
- Seulement documenté : `DashboardCockpit`, absent du code ; les lots proposés ne sont pas réputés réalisés. Contradiction préexistante : `DESIGN_SYSTEM.md` et le README UI annoncent encore `Alert` indisponible, alors que son code local et ses exports existent.
- Non commencé avant cette étape : atelier de modèles de pages, quatre listes représentatives dans cet atelier. Après cette étape, Fiche, Planning, Formulaire, Finance et Communication restent des compositions proposées.
- Modifications à préserver : `DESIGN_SYSTEM.md`, `docs/master-plan-planetls.md`, `e2e/dashboard-prototypes.config.ts`, le SCSS Concierge, `visuels/page.tsx`, `AsyncState/*`, `ui/index.ts`, `ui/README.md`, les nouveaux fichiers Alert et SharedStates. Une modification de `src/tests/ui-files.snapshot.json` est apparue pendant le travail ; elle n’a pas été écrite par cette mission et a été conservée.

## Sélection des pages représentatives

| Espace | Première liste réalisée | Autres représentants retenus, non implémentés ici |
| --- | --- | --- |
| Admin | Utilisateurs | Accueil existant, contrôle/alertes, demandes ou missions, fiche utilisateur dans le panneau d’AdminPeopleWorkspace |
| Concierge | Missions du jour | Planning, demandes reçues, devis via billing, fiche mission `[id]` |
| Propriétaire | Logements | Fiche logement `[id]`, réservations via planning, demandes de prestation, factures |
| Artisan | Interventions | Demandes disponibles dans l’accueil, devis, planning, fiche/édition intégrée aux interventions (pas de route `[id]` dédiée repérée) |

## Familles et compositions

L’accueil reste couvert par les quatre anciens prototypes, sans suppression. Les listes/recherches constituent le seul modèle extrait ici, dans la fonction locale `ListPreview`. Suivi d’activité, état vide et erreur sont des sections ou états d’une page, pas des maquettes indépendantes.

| Modèle | Composition proposée | Réutilisation |
| --- | --- | --- |
| ListPage | Titre, explication, action, filtres, résultats, pagination, vide | Implémenté localement : TableFilters, DataTable ou Card, Input, Select, Badge, Button, AsyncState, Alert |
| DetailPage | Retour, identité, statut, informations, historique, actions autorisées | Structure des fiches logement/mission à étudier ; primitives UI, sans importer leurs hooks |
| PlanningPage | Période, filtres, journée/semaine, événements, conflits, mobile | Structure des plannings existants à composer ; pas de calendrier ajouté |
| FormPage | Titre, explications, sections, champs, erreurs, enregistrer/annuler | Input, Select, Textarea, Button, Alert ; convient aussi aux profils/paramètres |
| FinancePage | Synthèse expliquée, période, montants, paiements, détail | Cartes et DataTable ; graphique seulement si une donnée réelle le justifie |
| CommunicationPage | Conversations, participants, messages, pièces jointes, non lus, réponse | Structure des messageries existantes ; pas d’envoi ni de pièces jointes simulés ici |

## Choix du premier lot

L’admin garde un tableau dense et une action de contrôle. Le concierge lit d’abord les horaires. Le propriétaire dispose de cartes plus aérées avec une prochaine étape expliquée. L’artisan retrouve rendez-vous, matériel et preuves avec des boutons tactiles. Ces différences portent sur l’information et les actions, sans dépendre de la couleur.

Les actions principales filtrent réellement les fixtures locales. Les boutons de consultation et de navigation secondaire expliquent leur caractère simulé ; ils n’ouvrent aucune autre page métier. Recherche, statut, réinitialisation et pagination fonctionnent localement. Un changement d’espace remet les filtres et états à zéro. Les données sont manifestement fictives, sans personne ni adresse réelle, et ne sont importées que par l’atelier.

Le sélecteur de largeur limite le cadre à 768 ou 390 px, sans prétendre émuler un viewport. Le mode cartes de DataTable dépend de la largeur réelle du navigateur. Les autres modèles sont visibles mais désactivés pour respecter l’arrêt après quatre prévisualisations.

## Inventaire des routes réelles

L’inventaire ci-dessous relève les pages des quatre espaces dans le code. Les groupes Next.js entre parenthèses ne figurent pas dans les URL. Les composants cités constituent des pistes de réutilisation de structure : les composants métier connectés ne sont pas importés dans l’atelier. « API repérée » signifie branchement statique identifié, pas validation des réponses, des permissions ou de Supabase. Les routes de redirection et pages éditoriales sont distinguées. Les états vide/chargement/erreur sont transversaux.

## Vérifications du premier lot

- `npm run typecheck` : réussi, application et tests Playwright.
- ESLint ciblé sur `pages/`, `navigation.ts`, les deux fichiers `page-workshop` et `design-organization.spec.ts` : réussi.
- `node --experimental-strip-types --test src/tests/design-architecture.test.mts src/tests/ui-snapshots.test.mts` : 3 tests réussis. Imports métier et appels réels interdits dans le Design System ; snapshot UI inchangé par cette mission.
- `node node_modules/@playwright/test/cli.js test --config e2e/page-workshop.config.ts` : 1 scénario réussi couvrant les quatre espaces, cinq états, recherche, filtres, réinitialisation, pagination, navigation Tab/Entrée, focus, taille des actions principales, réduction des mouvements, console et absence d’appels API métier.
- Régression Design System : 9 scénarios distincts validés au total après relances ciblées (5 prototypes/comparaison, 2 navigation/redirections, 1 références visuelles, 1 états partagés). Premier passage : 7 réussis, 2 échecs. Le test de navigation a été actualisé pour la quatrième rubrique et limité aux sept groupes de premier niveau, sans compter le détail imbriqué des nouveaux états locaux. Le signal d’hydratation dans un ancien prototype n’a pas été reproduit à la relance sans modification en cours.
- Responsive : les quatre espaces ont passé 1600, 1366, 768 et 390 px, soit 16 captures dans `test-results/page-workshop/`. Pas de débordement horizontal général ; tableau Admin à défilement interne, cartes Concierge/Artisan sur mobile, cartes Propriétaire sur toutes les largeurs. Captures relues, notamment les quatre mobiles et le Propriétaire à 1600 px.
- Contrastes : contrôle des couleurs de texte principal, secondaire et de lien sur surface, surface douce et fond, dans le thème actif : 5,34:1 à 14,81:1. Les statuts portent un libellé explicite. Ce contrôle ciblé ne constitue pas un audit exhaustif de tous les thèmes, lecteurs d’écran et navigateurs.
- `git diff --check` réussi ; fichiers écrits vérifiés en UTF-8 sans BOM ; références des tokens SCSS confirmées. Aucun build complet, test Supabase ou test métier complet nécessaire pour ce périmètre isolé.

Fichiers propres à cette étape : cinq fichiers dans `src/app/design-system/pages/`, lien ajouté dans `_components/navigation.ts`, nouveau scénario et configuration `e2e/page-workshop.*`, adaptation de `e2e/design-organization.spec.ts`. Les composants UI partagés et les pages métier ne sont pas modifiés par cette étape.

Limites : validation navigateur Chromium locale, pas de déploiement ; actions de consultation et navigation secondaire simulées ; cinq autres modèles non implémentés ; données et permissions des routes inventoriées non auditées en exécution. Aucun changement Supabase : vérification RLS sans objet pour les fixtures. Prochaine petite étape recommandée, après validation visuelle par l’utilisatrice : une seule fiche de logement Propriétaire dans l’atelier.

Pilotage : Master Plan volontairement non modifié selon la demande explicite, malgré la règle générale du projet. Ses changements locaux antérieurs sont conservés. Aucun statut ni priorité déplacé, aucun commit créé.

Classement des familles déduit de la fonction et de la composition ; traçage des imports limité à deux niveaux.

| Espace | Route | Fonction | Type de page | Données réelles | Composants réutilisables |
| --- | --- | --- | --- | --- | --- |
| Admin | `/dashboard/admin/modele-financier` | Modèle financier | Page financière | Contenu éditorial / hypothèses, pas de résultats réels | DashboardLayout, DashboardPanel; Card, CardBody, CardHeader |
| Admin | `/dashboard/admin/personas` | Personas | Documentation / ressources | Documents locaux lus côté serveur | DashboardLayout |
| Admin | `/dashboard/admin/pilotage` | Pilotage économique | Suivi d’activité | API repérée : `/api/admin/overview`, `/api/admin/operations`, `/api/kpis/overview` | DashboardLayout, DashboardPanel; Card, CardBody, CardHeader |
| Admin | `/dashboard/admin/pilotage/personas` | Pilotage économique · personas | Redirection | Redirection ; pas de données propres | Composition locale ; primitives UI à réutiliser |
| Admin | `/dashboard/admin/artisans` | Artisans | Liste et recherche | API repérée : `/api/admin/overview`, `/api/admin/users/`, `/api/provider/profile-documents` | AdminPeopleWorkspace |
| Admin | `/dashboard/admin/conciergeries` | Conciergeries | Liste et recherche | API repérée : `/api/admin/overview`, `/api/admin/users/`, `/api/provider/profile-documents` | AdminPeopleWorkspace |
| Admin | `/dashboard/admin/controle` | Contrôle de plateforme | Suivi d’activité | API repérée : `/api/admin/control-tower` | DashboardLayout, DashboardPanel; Tabs, TabsContent, TabsList, TabsTrigger |
| Admin | `/dashboard/admin/demandes` | Demandes de prestation | Liste et recherche | API repérée : `/api/admin/operations` | DashboardLayout, DashboardPanel |
| Admin | `/dashboard/admin/missions` | Missions | Liste et recherche | API repérée : `/api/admin/operations` | DashboardLayout, DashboardPanel |
| Admin | `/dashboard/admin/proprietaires` | Propriétaires | Liste et recherche | API repérée : `/api/admin/overview`, `/api/admin/users/`, `/api/provider/profile-documents` | AdminPeopleWorkspace |
| Admin | `/dashboard/admin/utilisateurs` | Gestion des utilisateurs | Liste et recherche | API repérée : `/api/admin/overview`, `/api/admin/users/`, `/api/provider/profile-documents` | AdminPeopleWorkspace |
| Admin | `/dashboard/admin/decisions-architecture` | Décisions d’architecture | Documentation / ressources | Documents locaux lus côté serveur | Composition locale ; primitives UI à réutiliser |
| Admin | `/dashboard/admin/design` | Accès au Design System | Redirection | Redirection ; pas de données propres | Composition locale ; primitives UI à réutiliser |
| Admin | `/dashboard/admin/developpement` | Pilotage technique | Suivi d’activité | Documents locaux lus côté serveur | Composition locale ; primitives UI à réutiliser |
| Admin | `/dashboard/admin/developpement/personas` | Pilotage technique · personas | Redirection | Redirection ; pas de données propres | Composition locale ; primitives UI à réutiliser |
| Admin | `/dashboard/admin` | Accueil | Accueil dashboard | API repérée : `/api/admin/operations`, `/api/admin/overview`, `/api/admin/control-tower` | DashboardEmptyState; UnifiedRoleDashboard, UnifiedSpotlightList, UnifiedStatStack, type UnifiedSpotlightItem,; Badge |
| Concierge | `/dashboard/concierge/alertes` | Alertes | Suivi d’activité | API repérée : `/api/missions`, `/api/messages/conversations`, `/api/housing` | DashboardOperationalPage, type OperationalDetailSection |
| Concierge | `/dashboard/concierge/billing` | Devis et facturation | Page financière | API repérée : `/api/quotes`, `/api/invoices`, `/api/services/service_pricing` | TariffBillingDesk; ConciergeWorkspacePage |
| Concierge | `/dashboard/concierge/contacts` | Contacts | Liste et recherche | API repérée : `/api/messages/conversations`, `/api/profiles/housing/owners` | ConciergeWorkspacePage |
| Concierge | `/dashboard/concierge/contract-templates` | Modèles de contrat | Documentation / ressources | API repérée : `/api/services/contract-templates` | ContractTemplateManager |
| Concierge | `/dashboard/concierge/decoration-ai` | Assistant décoration | Liste et recherche | API repérée : `/api/concierge/decoration-assistant` | Composition locale ; primitives UI à réutiliser |
| Concierge | `/dashboard/concierge/demandes` | Demandes de prestation | Liste et recherche | API repérée : `/api/service-request-recipients/`, `/api/service-requests` | ServiceRequestCard, type ServiceRequestCardTone, type ServiceRequestFact, type ServiceRequestMilestone; ConciergeWorkspacePage |
| Concierge | `/dashboard/concierge/equipe` | Équipe | Formulaire / paramètres | API repérée : `/api/profiles/current`, `/api/missions`, `/api/concierge/team` | Composition locale ; primitives UI à réutiliser |
| Concierge | `/dashboard/concierge/fiche` | Zone d’intervention | Formulaire / paramètres | API repérée : `/api/concierge/intervention-zone` | DashboardPanel |
| Concierge | `/dashboard/concierge/finances/overview` | Synthèse financière · overview | Page financière | API repérée : `/api/invoices`, `/api/profiles/current`, `/api/service-requests` | SimpleOverviewWorkspace |
| Concierge | `/dashboard/concierge/finances/simulation` | Synthèse financière · simulation | Page financière | Simulation locale, hypothèses saisies | ConciergeWorkspacePage; styles |
| Concierge | `/dashboard/concierge/logements/create` | Logements · create | Formulaire / paramètres | API repérée : `/api/profiles/housing/owners`, `/api/housing`, `/api/profiles/housing/from-quote` | LogementCreateModal |
| Concierge | `/dashboard/concierge/logements/overview` | Logements · overview | Suivi d’activité | API repérée : `/api/profiles/current`, `/api/service-requests`, `/api/messages/conversations` | SimpleOverviewWorkspace |
| Concierge | `/dashboard/concierge/logements` | Logements | Liste et recherche | API repérée : `/api/housing`, `/api/service-requests`, `/api/profiles/public/` | HousingListPage |
| Concierge | `/dashboard/concierge/logements/[id]` | Logements · [id] | Fiche détaillée | API repérée : `/api/housing/`, `/api/profiles/current`, `/api/quotes` | LogementPage |
| Concierge | `/dashboard/concierge/maintenance` | Maintenance | Formulaire / paramètres | API repérée : `/api/missions`, `/api/concierge/maintenance`, `/api/profiles/providers` | Composition locale ; primitives UI à réutiliser |
| Concierge | `/dashboard/concierge/messages` | Messagerie | Messages | API repérée : `/api/messages/conversations`, `/api/messages/conversations/` | ConversationFilters; ConciergeWorkspacePage |
| Concierge | `/dashboard/concierge/missions/overview` | Missions · overview | Suivi d’activité | API repérée : `/api/profiles/current`, `/api/service-requests`, `/api/messages/conversations` | DashboardOperationalPage, DashboardPanel |
| Concierge | `/dashboard/concierge/missions` | Missions | Liste et recherche | API repérée : `/api/missions` | ConciergeWorkspacePage; Input, Select; styles |
| Concierge | `/dashboard/concierge/missions/[id]` | Missions · [id] | Fiche détaillée | API repérée : `/api/missions/` | MissionDetailClient |
| Concierge | `/dashboard/concierge/objectifs` | Objectifs d’activité | Suivi d’activité | API repérée : `/api/missions`, `/api/housing` | ConciergeWorkspacePage |
| Concierge | `/dashboard/concierge` | Accueil | Accueil dashboard | API repérée : `/api/profiles`, `/api/profiles/current`, `/api/service-requests` | Composition locale ; primitives UI à réutiliser |
| Concierge | `/dashboard/concierge/planning` | Calendrier et réservations | Planning / calendrier | API repérée : `/api/missions`, `/api/concierge/optimized-routes/optimize`, `/api/concierge/optimized-routes` | DashboardOperationalPage, DashboardPanel, type OperationalDetailSection; DashboardCalendar, DashboardEvent |
| Concierge | `/dashboard/concierge/pricing` | Grille tarifaire | Page financière | API repérée : `/api/services/pricing-packages`, `/api/pricing`, `/api/services/services-catalog` | PricingGridManager; OfferInfoCard |
| Concierge | `/dashboard/concierge/profile` | Profil concierge | Formulaire / paramètres | API repérée : `/api/profiles/current` | DashboardLoadingScreen; ConciergeProfileFeature |
| Concierge | `/dashboard/concierge/proprietaires/overview` | Propriétaires · overview | Suivi d’activité | API repérée : `/api/profiles/current`, `/api/service-requests`, `/api/messages/conversations` | SimpleOverviewWorkspace |
| Concierge | `/dashboard/concierge/recherche` | Recherche de partenaires | Liste et recherche | API repérée : `/api/search/owner-listings`, `/api/messages/conversations` | Composition locale ; primitives UI à réutiliser |
| Concierge | `/dashboard/concierge/sejours` | Séjours | Planning / calendrier | API repérée : `/api/concierge/stays`, `/api/reservations/` | DashboardOperationalPage; AsyncState |
| Concierge | `/dashboard/concierge/services-packages` | Offres de services | Liste et recherche | API repérée : `/api/services/services-catalog`, `/api/services/packages`, `/api/services/pricing-packages` | ServicePackageManager; OfferInfoCard; OfferMetricCard |
| Concierge | `/dashboard/concierge/settings` | Paramètres du profil | Formulaire / paramètres | API repérée : `/api/profiles/current`, `/api/billing/history` | ConciergeWorkspacePage |
| Concierge | `/dashboard/concierge/stocks` | Stocks et Équipements | Liste et recherche | API repérée : `/api/housing`, `/api/missions` | ConciergeWorkspacePage |
| Concierge | `/dashboard/concierge/urgences` | Urgences | Liste et recherche | API repérée : `/api/urgent-missions`, `/api/urgent-missions/` | DashboardOperationalPage, DashboardPanel |
| Propriétaire | `/dashboard/owner/alertes` | Alertes | Suivi d’activité | API repérée : `/api/missions`, `/api/invoices`, `/api/quotes` | OwnerWorkspacePage |
| Propriétaire | `/dashboard/owner/conciergerie/overview` | Conciergerie · overview | Suivi d’activité | API repérée : `/api/profiles/current`, `/api/housing`, `/api/missions` | SimpleOverviewWorkspace; useCurrentUser |
| Propriétaire | `/dashboard/owner/conciergerie` | Conciergerie | Liste et recherche | API repérée : `/api/service-requests`, `/api/housing`, `/api/quotes` | OwnerWorkspacePage; Button, ButtonLink, Checkbox, Input, Select, Textarea |
| Propriétaire | `/dashboard/owner/conciergerie/partenaires` | Conciergerie · partenaires | Liste et recherche | API repérée : `/api/quotes`, `/api/service-requests` | ButtonLink, Input, Select |
| Propriétaire | `/dashboard/owner/concierges` | Recherche de concierges | Liste et recherche | Branchement non confirmé dans les imports examinés | OwnerConciergesPage as OwnerConciergesFeaturePage |
| Propriétaire | `/dashboard/owner/contacts` | Contacts | Liste et recherche | API repérée : `/api/messages/conversations` | OwnerWorkspacePage |
| Propriétaire | `/dashboard/owner/demandes` | Demandes de prestation | Liste et recherche | API repérée : `/api/service-requests`, `/api/housing`, `/api/quotes` | Button, ButtonLink, Input, Select, ServiceCatalogPicker, Textarea; OwnerJourneyRail; ServiceRequestCard |
| Propriétaire | `/dashboard/owner/devis` | Devis | Page financière | API repérée : `/api/quotes`, `/api/service-requests`, `/api/service-requests/` | SearchBar, StatsCard, Tag; EmptyState; OwnerJourneyRail, OwnerQuoteResponseCard, OwnerQuotesComparisonTable, OwnerRequestSummaryCard, |
| Propriétaire | `/dashboard/owner/documents` | Documents | Liste et recherche | API repérée : `/api/quotes`, `/api/invoices`, `/api/quotes/` | Composition locale ; primitives UI à réutiliser |
| Propriétaire | `/dashboard/owner/factures` | Factures | Page financière | API repérée : `/api/billing/invoices/`, `/api/invoices`, `/api/invoices/` | Composition locale ; primitives UI à réutiliser |
| Propriétaire | `/dashboard/owner/finances/overview` | Synthèse financière · overview | Page financière | API repérée : `/api/profiles/current`, `/api/housing`, `/api/missions` | SimpleOverviewWorkspace; useCurrentUser |
| Propriétaire | `/dashboard/owner/litiges` | Litiges | Liste et recherche | API repérée : `/api/disputes`, `/api/disputes/` | Composition locale ; primitives UI à réutiliser |
| Propriétaire | `/dashboard/owner/logements/create` | Logements · create | Formulaire / paramètres | API repérée : `/api/housing/photos`, `/api/housing` | CreateHousingForm |
| Propriétaire | `/dashboard/owner/logements/overview` | Logements · overview | Suivi d’activité | API repérée : `/api/profiles/current`, `/api/housing`, `/api/missions` | DashboardSectionShell, MetricDonut; useCurrentUser |
| Propriétaire | `/dashboard/owner/logements` | Logements | Liste et recherche | API repérée : `/api/housing`, `/api/service-requests`, `/api/profiles/public/` | HousingListPage |
| Propriétaire | `/dashboard/owner/logements/[id]` | Logements · [id] | Fiche détaillée | API repérée : `/api/inspections/`, `/api/inspections`, `/api/housing/` | Avatar; HousingPurchaseNeedsPanel |
| Propriétaire | `/dashboard/owner/messages` | Messagerie | Messages | API repérée : `/api/messages/conversations`, `/api/messages/conversations/` | ConversationFilters, DashboardSectionShell; Button, ButtonLink, Textarea |
| Propriétaire | `/dashboard/owner/mission-urgente` | Demande urgente | Formulaire / paramètres | API repérée : `/api/urgent-missions` | OwnerWorkspacePage |
| Propriétaire | `/dashboard/owner/missions/new` | Missions · new | Redirection | Redirection ; pas de données propres | Composition locale ; primitives UI à réutiliser |
| Propriétaire | `/dashboard/owner/missions/overview` | Missions · overview | Suivi d’activité | API repérée : `/api/profiles/current`, `/api/housing`, `/api/missions` | OwnerWorkspacePage; DashboardPanel, MetricDonut; AsyncState |
| Propriétaire | `/dashboard/owner/missions` | Missions | Liste et recherche | API repérée : `/api/profiles/current`, `/api/housing`, `/api/missions` | Composition locale ; primitives UI à réutiliser |
| Propriétaire | `/dashboard/owner/missions/voyageurs` | Missions · voyageurs | Liste et recherche | API repérée : `/api/owner/reservations`, `/api/housing`, `/api/service-requests` | Button, ButtonLink, Input, Select, Textarea; ServiceRequestCard, type ServiceRequestCardTone, type ServiceRequestFact, type ServiceRequestMilestone |
| Propriétaire | `/dashboard/owner/missions/[id]` | Missions · [id] | Fiche détaillée | API repérée : `/api/missions/` | MissionDetailClient |
| Propriétaire | `/dashboard/owner/objectifs` | Objectifs d’activité | Suivi d’activité | API repérée : `/api/profiles/current`, `/api/profiles` | Composition locale ; primitives UI à réutiliser |
| Propriétaire | `/dashboard/owner` | Accueil | Accueil dashboard | API repérée : `/api/profiles/current`, `/api/housing`, `/api/missions` | DashboardLoadingScreen; DashboardHomeIcon; useCurrentUser |
| Propriétaire | `/dashboard/owner/planning` | Calendrier et réservations | Planning / calendrier | API repérée : `/api/owner/reservations` | OwnerPlanningPage |
| Propriétaire | `/dashboard/owner/reglement` | Règlement | Formulaire / paramètres | Branchement non confirmé dans les imports examinés | OwnerWorkspacePage |
| Propriétaire | `/dashboard/owner/settings` | Paramètres du profil | Formulaire / paramètres | API repérée : `/api/profiles/current`, `/api/profiles/avatar`, `/api/profiles` | EditableUnifiedProfilePage |
| Propriétaire | `/dashboard/owner/stocks` | Stocks et Équipements | Liste et recherche | API repérée : `/api/housing`, `/api/housing/` | DashboardSectionShell, MetricDonut |
| Artisan | `/dashboard/provider/alertes` | Alertes | Suivi d’activité | API repérée : `/api/provider/alerts`, `/api/provider/interventions`, `/api/provider/alerts/` | ActionPanel; SectionHeader; WorkflowStatusBadge |
| Artisan | `/dashboard/provider/clients/overview` | Clients · overview | Suivi d’activité | API repérée : `/api/provider/clients`, `/api/provider/interventions`, `/api/provider/alerts` | SimpleOverviewWorkspace |
| Artisan | `/dashboard/provider/clients` | Clients | Liste et recherche | API repérée : `/api/provider/clients`, `/api/provider/clients/` | ActionPanel; SectionHeader; WorkflowStatusBadge |
| Artisan | `/dashboard/provider/devis` | Devis | Page financière | API repérée : `/api/quotes`, `/api/quotes/`, `/api/invoices/from-quote` | WorkflowStatusBadge; ProviderWorkspacePage |
| Artisan | `/dashboard/provider/finances/overview` | Synthèse financière · overview | Page financière | API repérée : `/api/provider/clients`, `/api/provider/interventions`, `/api/provider/alerts` | SimpleOverviewWorkspace |
| Artisan | `/dashboard/provider/interventions/overview` | Interventions · overview | Suivi d’activité | API repérée : `/api/provider/clients`, `/api/provider/interventions`, `/api/provider/alerts` | SimpleOverviewWorkspace |
| Artisan | `/dashboard/provider/interventions` | Interventions | Liste et recherche | API repérée : `/api/provider/interventions`, `/api/provider/clients`, `/api/provider/interventions/` | Button, ButtonLink, Input, Select, Textarea |
| Artisan | `/dashboard/provider/messages` | Messagerie | Messages | API repérée : `/api/provider/messages`, `/api/provider/messages/`, `/api/provider/clients` | ConversationFilters, DashboardSectionShell; Button, ButtonLink, Input, Select, Textarea |
| Artisan | `/dashboard/provider/objectifs` | Objectifs d’activité | Suivi d’activité | Contenu éditorial / hypothèses, pas de résultats réels | ProviderWorkspacePage |
| Artisan | `/dashboard/provider/outils` | Ressources et outils | Documentation / ressources | Contenu éditorial / hypothèses, pas de résultats réels | ProviderWorkspacePage |
| Artisan | `/dashboard/provider` | Accueil | Accueil dashboard | API repérée : `/api/provider/clients`, `/api/provider/interventions`, `/api/provider/alerts` | ProviderDashboard |
| Artisan | `/dashboard/provider/planning` | Calendrier et réservations | Planning / calendrier | API repérée : `/api/provider/interventions` | WorkflowStatusBadge; ButtonLink, TabButton; DashboardSectionShell |
| Artisan | `/dashboard/provider/settings` | Paramètres du profil | Formulaire / paramètres | API repérée : `/api/profiles/current`, `/api/profiles/avatar`, `/api/profiles` | EditableUnifiedProfilePage |
