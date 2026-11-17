# PlanetLS — Référentiel fonctionnel proposé — PROGRESS-02B

> **État courant — PROGRESS-02B3, 16 novembre 2026 : les neuf décisions métier sont confirmées.** Le §11 définit le périmètre métier actuel et les critères à qualifier ; il prévaut sur les hypothèses contradictoires des §1–10, conservées comme état historique 02B. Les 52 capacités et les 71 parcours gardent leurs identifiants. Les états observés de l'ancien catalogue ne prouvent pas la réalisation du nouveau périmètre. Confirmation métier distincte de validation technique : aucun GO de mise en service et aucune intégration 02C.

## 1. Objet, provenance et limites

Proposition documentaire locale du 16 novembre 2026. Base inspectée : branche `feature/audit-master-plan-planetls`, HEAD `60e50c8b06f59e72d368e604eba1e6449b428289`, avec travaux locaux non commités. Ce HEAD seul ne décrit donc pas les fichiers observés. Empreinte agrégée initiale des 27 fichiers locaux modifiés/non suivis : `6fee68623260d522f8c657331d3e03d234e36414b70f52f0bfb09e2142056733`.

Le rapport PROGRESS-02A n'a pas été retrouvé dans le dépôt. Sa version dans la conversation et les informations transmises pour PROGRESS-02B servent de contexte ; les points sensibles ont été rapprochés du code. Les 71 fiches de parcours ci-dessous reprennent ses identifiants proposés, sans créer d'entrée dans le registre applicatif. Les 22 fiches dites implémentées dans 02A ne deviennent pas automatiquement des capacités implémentées : les nouveaux critères exigent leur propre examen.

Ce document est une proposition de structure et de critères, pas une décision de lancement ni un nouveau Master Plan. Aucun statut, priorité, calcul, composant, API, migration ou donnée distante n'est modifié. Aucun nouveau pourcentage n'est publié. PROGRESS-02C et l'intégration au dashboard ne sont pas engagés.

Les sources de pilotage existantes restent [le Master Plan](master-plan-planetls.md), [le calcul documentaire](../src/app/dashboard/admin/(product-tech)/developpement/spaceProgressData.ts#L85), [l'inventaire des espaces](../src/app/dashboard/admin/(product-tech)/developpement/spaceInventory.ts#L23) et [les 19 fiches Conciergerie historiques](../src/app/dashboard/admin/(product-tech)/developpement/conciergeSubfeatures.ts#L23). Les numéros de ligne servent de repères dans cet état local et peuvent évoluer.

## 2. Modèle de fiche et conventions

### 2.1 Trois objets distincts

- **Chantier documentaire** : identifiant existant `PLS-*` du Master Plan, avec son statut et sa priorité officiels inchangés.
- **Parcours parent** : fiche proposée `PLS-INV-OWN-001`, `PLS-INV-CON-001` ou `PLS-INV-ART-001`. Elle rend une capacité visible dans un usage métier ; elle n'est pas une unité de calcul globale.
- **Capacité élémentaire** : identifiant permanent proposé `PFC-<FAMILLE>-<NN>`. Un changement de nom ne change pas l'identifiant ; une scission future garde une relation de remplacement. Ne jamais réattribuer un identifiant retiré.

Chaque fiche de capacité est la jointure de sa ligne dans le catalogue (§5), des parcours parents qui la référencent (§4), et de ses sources (§3). Ce format évite de recopier le même backend et les mêmes preuves pour chaque rôle.

| Champ de la fiche | Règle de résolution explicite |
|---|---|
| ID, nom, critères d'implémentation | Ligne du catalogue ; critères `ID-I1`, `ID-I2`, etc., dans l'ordre des obligations séparées par des points-virgules |
| Parents et espaces consommateurs | Toutes les lignes du §4 contenant cet ID ; OWN = Propriétaires, CON = Conciergerie, ART = Artisans / Prestataires |
| Périmètre de lancement | Colonne S/A/F de la capacité ; hypothèse non approuvée. Le classement du parent est un cadrage général, pas une surcharge silencieuse du périmètre d'une capacité |
| Responsable technique | Module/backend du dossier de sources ; ce n'est pas l'attribution d'une équipe ou d'une responsabilité humaine |
| État de développement observé | Colonne État ; observation statique du 16 novembre, portée limitée au code et aux limites indiquées |
| Preuves techniques, frontend, API, données, tests | Dossiers S01–S16 cités dans la ligne ; les fichiers ciblés sont des sources, pas une preuve de réussite à eux seuls |
| Critères de validation | Obligations propres de la colonne Validation, `ID-V1`, etc., plus exigences communes V0 ci-dessous |
| État/preuves de validation actuelles | **Non testé pour toutes les capacités et tous les critères proposés** ; date d'exécution, environnement, version exécutée et résultat actuel = non renseignés. Aucun test lancé dans 02B |
| Preuves historiques | Registre H01–H04 et limites associées ; aucune association ne marque un nouveau critère comme réussi |
| Dépendances, incertitudes | Colonnes Dépendances et Limite ; dépendances techniques ne prouvent pas un ordre de réalisation métier approuvé |
| Correspondances Master Plan | Identifiants associés aux dossiers de sources cités, complétés par les rattachements du §6 ; référence de contexte, jamais équivalence d'achèvement |

### 2.2 Périmètres et états indépendants

- **S — Socle proposé** : nécessaire au parcours essentiel retenu, sous réserve d'arbitrage.
- **A — Amélioration après lancement proposée** : utile, hors socle initial envisagé.
- **F — Idée future proposée** : hors engagement de lancement.

Ces hypothèses ne modifient aucune priorité officielle. Notamment le vocal reste historiquement P2 dans le Master Plan, même si son usage est proposé ici hors socle ; aucune rétrogradation automatique en P4.

Développement : **Implémenté** si tous les critères I du périmètre sont démontrés par des preuves techniques précises ; **Partiel** si une partie seulement est établie ; **Non commencé** si aucun flux dédié n'est identifié dans le périmètre examiné ; **Non évalué** si l'observation ne permet pas de décider. Une dépendance ou un test présent ne suffit pas à promouvoir l'état. Un état partiel peut signaler une insuffisance de preuve statique, sans affirmer l'existence d'un défaut d'exécution.

Validation : **Validé**, **Partiellement validé**, **Non testé**, **Échec constaté**, **Preuve obsolète**, **Non applicable avec justification**. L'état est porté par critère et par version cible. Une ancienne preuve dont l'applicabilité est inconnue reste historique à requalifier ; ne pas la dater artificiellement ni déclarer sa péremption sur un délai inventé. Un échec observé conserve sa preuve jusqu'à une nouvelle vérification du même critère.

**V0 — Exigences communes** : pour chaque lecture/écriture privée, vérifier accès autorisé, refus anonyme, tiers et rôle non permis ; pour chaque écriture, vérifier persistance par relecture et comportement après erreur/reprise ; pour chaque UI, vérifier chargement, absence de données, erreur accessible et clavier sur desktop/mobile. Sur Supabase, distinguer tests du handler avec doubles, RLS authentifiée/inter-tenant et chemin serveur privilégié. Documenter les critères non applicables, avec justification approuvée. Ne pas imposer un scénario d'écriture à une simple vue de lecture.

**Enregistrement d'une preuve future** : `evidenceId`, `criterionId`, rôle/parcours, résultat observable et attendu, résultat obtenu, date UTC, environnement/base et profil synthétique, commit/version + empreinte du code local si nécessaire, commande/scénario, chemin du journal ou capture, périmètre, limites et provenance. Jamais de secret ni de donnée personnelle dans le référentiel. Une preuve doit désigner un critère ; un total de tests n'est pas une preuve universelle.

## 3. Dossiers de sources vérifiables

Préfixe des tests : `src/tests/`, extension `.test.mts`, sauf mention E2E. U = unitaire, H = handler avec transport/auth simulés, S = contrat statique, E = scénario navigateur présent. Tous sont non exécutés dans ce lot. Les tables/migrations sont identifiées dans le code ; application distante inconnue.

| Source | Frontend et module technique/API | Données / migrations identifiées | Tests présents et Master Plan |
|---|---|---|---|
| S01 | [LoginPage](../src/app/login/LoginPage.tsx#L197), [inscription serveur](../src/app/api/auth/register/route.ts#L244), [Auth.js](../src/server/auth/authOptions.ts#L254), [gardes](../src/server/auth/roleGuards.ts#L14) ; formulaire `src/app/components/forms/RegistrationForm.js` | Auth Supabase, `profiles`, session Auth.js ; pas de nouvelle table de session présumée | `registration-security`, `business-authorization` (U/H) ; `e2e/registration-owner.spec.ts` (E). PLS-DEV-001, PLS-SEC-005 |
| S02 | [Éditeur partagé](../src/app/components/dashboard/profile/EditableUnifiedProfilePage.tsx#L352), [PATCH profils](../src/app/api/profiles/route.ts#L40), [profil provider](../src/app/api/provider/profile/route.ts#L7), `src/app/dashboard/provider/settings/ProviderDocumentsPanel.tsx` ; API `provider/profile-documents` | `profiles`, documents professionnels privés ; migration `20260719140000_provider_profile_documents.sql` | `profile-editing`, `profile-patch-authorization`, `provider-skills`, `provider-profile-documents-contract` (U/H/S). PLS-DEV-007, PLS-DEV-005 |
| S03 | [Recherche owner](../src/app/dashboard/owner/concierges/useOwnerConciergeSearch.ts#L49), [professionnels](../src/app/api/search/professionals/route.ts#L174), [recherche concierge](../src/app/dashboard/concierge/recherche/searchClient.ts#L77) | `profiles`, logements pour la recherche inverse ; rôles provider/artisan exposés par la recherche | `professional-search-api`, `professional-search-pagination`, `owner-concierges-search` (U/H). PLS-DEV-028 |
| S04 | [Géographie](../src/app/api/profiles/concierges/geographicSearch.ts#L19), `src/app/api/search/professionals/coverage.ts`, [zone concierge](../src/app/api/concierge/intervention-zone/route.ts#L69), [publication](../src/app/lib/conciergePublication.ts#L20) | Zones, rayon, identité et prestations dans `profiles` ; déclaration distincte de la position professionnelle | `owner-concierges-geography`, `concierge-zone-api`, `concierge-publication` (U/H). PLS-DEV-007, PLS-DEV-028 |
| S05 | [Besoins séjour](../src/app/api/_shared/stayNeeds.ts#L9), [catalogue serveur](../src/app/api/services/services-catalog/route.ts#L17), `src/app/dashboard/owner/concierges/OwnerConciergesPageClient.tsx` | `services_catalog`, besoins normalisés et préférences de profil | `stay-needs-catalog`, `provider-catalog-resolution`, `professional-search-matching` (U). PLS-DEV-007, PLS-DEV-008 |
| S06 | [Messages owner](../src/app/dashboard/owner/messages/page.tsx#L117), [client concierge](../src/app/dashboard/concierge/messages/messagesClient.ts#L63), [API commune](../src/app/api/messages/conversations/route.ts#L80), [messages provider](../src/app/api/provider/messages/route.ts#L32), [alertes provider](../src/app/api/provider/alerts/route.ts#L17), `src/app/dashboard/notifications/page.tsx` | `contact_conversations`, `contact_messages` ; silo distinct `provider_conversations`, `provider_messages`, `provider_alerts` ; alertes owner/concierge agrégées | `messages-conversation-api`, `messages-state` (U), `e2e/critical-workspaces.spec.ts` (E accès, pas livraison externe). PLS-DEV-003, PLS-DEV-004, PLS-DEV-005, PLS-DEV-027 |
| S07 | [Bureau devis](../src/app/components/tariffs/TariffBillingDesk.tsx#L844), [garde d'envoi](../src/features/concierge-commercial/server/quoteSendGuard.ts#L23), [quotes](../src/app/api/quotes/route.ts#L307), API `quotes/[id]/status`, `pricing` ; devis owner/provider | `quotes`, `quote_items`, `services_pricing`, `pricing_segments`, règles tarifaires | `quote-send-guard`, `tariff-billing-free-price`, `pricing-pure`, `pricing-grid-manager` (U/H/S). PLS-DEV-008, PLS-DEV-032, PLS-DEV-010 |
| S08 | [Demandes](../src/app/api/service-requests/route.ts#L1459), [sélection](../src/app/api/service-requests/[id]/select/route.ts#L148), [collaborations](../src/app/api/housing-collaborations/route.ts#L24), [résiliation](../src/app/api/_shared/collaborationTermination.ts#L88), partenaires owner et demandes concierge | `service_requests`, destinataires, `housing_collaborations`, contrats, événements ; migration `20260621000100_housing_collaborations.sql` | `housing-collaborations-read`, `collaboration-detail`, `collaboration-termination`, `stay-ponctuel-service-request`, `concierge-operational-workflow` (H/S). PLS-DEV-008, PLS-DEV-009 |
| S09 | [Panneau invitation](../src/app/components/dashboard/concierge/OwnerInvitationPanel.tsx#L125), API `owner-invitations` et renvoi | `owner_invitations`, `owner_invitation_events` ; migration `20260322103000_owner_invitations_and_links.sql` | `housing-invitation-authorization` (H). PLS-DEV-008 |
| S10 | [Séjours owner](../src/app/dashboard/owner/missions/voyageurs/page.tsx#L1340), [réservations owner](../src/app/api/owner/reservations/route.ts#L40), [séjours concierge](../src/app/dashboard/concierge/sejours/page.tsx#L220), API `concierge/reservations`, `reservations/[id]` | `reservations`, `missions`, liens/événements ; migration `20260729153000_reservations_core.sql` | `reservations-api-contract`, `reservation-schedule-changes`, `reservation-planning-engine` (H/U/S). PLS-DEV-009 |
| S11 | [Workflow accepté](../src/app/api/_shared/acceptedQuoteWorkflow.ts#L180), [affectation provider](../src/app/api/missions/[id]/provider-interventions/route.ts#L119), API missions ; vues de missions et planning | `missions`, `mission_events`, `provider_interventions`, métadonnées de liaison, preuves privées ; migration `20260729193000_link_provider_interventions_to_reservations.sql` | `reservation-mission-assignment`, `mission-main-authorization`, `mission-proof-authorization`, `mission-schedule-conflicts` (H/U). PLS-DEV-008, PLS-DEV-009, PLS-DEV-005, PLS-SEC-003 |
| S12 | [Factures owner](../src/app/dashboard/owner/factures/OwnerInvoicesPageClient.tsx#L103), [facture provider](../src/app/api/provider/interventions/[id]/invoice/route.ts#L10), API invoices/from-quote, billing/checkout/sync/webhook | `invoices`, `invoice_items`, événements et Stripe externe ; plusieurs écritures, transaction globale non présumée | `billing-api-shared`, `payment-workflow`, `owner-invoice-presentation` (U/H). PLS-DEV-010, PLS-DEV-005 |
| S13 | [Création logement](../src/app/components/dashboard/housing/CreateHousingForm.tsx#L63), `HousingListPage.tsx`, API housing/[id], housing/photos | `housing`, stockage photos ; relations `properties`/références à qualifier, pas deux logements à compter | `housing-write-guards`, `housing-photo-security-contract` (H/S), `housing-photo-supabase.integration` (intégration non exécutée). PLS-DATA-003, PLS-DATA-004, PLS-SEC-003 |
| S14 | [Checklist](../src/app/api/concierge/daily-checklist/route.ts#L91), [tournées](../src/app/api/concierge/optimized-routes/route.ts#L138), [stocks estimés](../src/app/dashboard/concierge/stocks/stocksHelpers.ts#L30), API concierge/maintenance, panneaux terrain | `concierge_daily_checklist`, checklist de mission, `optimized_routes`, `optimized_route_stops`, `maintenance_incidents`, médias ; aucune table de stock réel déduite des projections | `mission-checklist-persistence-contract`, `concierge-planning-navigation`, `maintenance-workflow`, `maintenance-persistence-contract`, `concierge-alerts-stocks` (S/U/H). PLS-DEV-015, PLS-DEV-020, PLS-DEV-021, PLS-DEV-030, PLS-OPS-001, PLS-OPS-002 |
| S15 | [Clients provider](../src/app/api/provider/clients/route.ts#L45), [interventions](../src/app/api/provider/interventions/route.ts#L52), [compte rendu](../src/app/api/provider/interventions/[id]/route.ts#L75), [planning](../src/app/dashboard/provider/planning/page.tsx#L38), `provider/settings`, `provider/interventions` | Workspace provider ; `provider_intervention_reports` ; migrations `20260301103000_provider_workspace_core.sql`, `20260307120000_enable_rls_provider_workspace.sql`, `20260829162000_provider_intervention_reports.sql` | `provider-skills`, `provider-catalog-resolution` (U), `provider-intervention-report-contract` (S), E critical-workspaces limité à l'accès. PLS-DEV-005, PLS-PRO-001 |
| S16 | [Données owner](../src/app/dashboard/owner/useOwnerDashboardData.ts#L175), [données provider](../src/app/dashboard/provider/useProviderDashboardData.ts#L172), hooks concierge, `contacts/page.tsx`, [finances concierge](../src/app/dashboard/concierge/finances/overview/page.tsx#L23) | Agrégations des sources précédentes ; exemple financier 950 €, préférences locales, aucune nouvelle table de progression | `owner-crm`, `financial-management`, `concierge-alerts-stocks` (U) ; E critical-workspaces. PLS-DEV-003, PLS-DEV-004, PLS-DEV-005, PLS-BIZ-002 |

### Preuves historiques : registre séparé

| ID | Source et résultat rapporté | Association indicative et limites |
|---|---|---|
| H01 | [Master Plan, validation connectée du 25 août 2026](master-plan-planetls.md#mise-à-jour-ciblée---validation-connectée-du-workflow-principal-du-25-août-2026) ; `e2e/owner-concierge-service-request.spec.ts` rapporté PASS | Devis/décision, mission et facture du scénario owner-concierge. Ne prouve pas toutes les variantes, l'artisan ni Stripe réel actuel. Environnement Supabase de l'époque, commit exact de campagne à reconstituer ; aucun critère 02B marqué réussi |
| H02 | [Master Plan](master-plan-planetls.md), section CONCIERGE-03C du 26 octobre 2026 : 122/122 tests ciblés rapportés réussis | Résiliation et suites applicatives avec doubles ; pas une preuve de concurrence/RLS réelle ou livraison externe. Version exacte et journaux à rattacher |
| H03 | [Master Plan](master-plan-planetls.md), section SEC-AUTH-01B2B4C1D du 12 novembre 2026 : fresh 13/13 et existing 14/14, bases synthétiques | Périmètre PostgreSQL isolé, pas HTTP/Storage/production. Journaux et manifeste cités dans le Master Plan ; pas de nouvelle vérification dans 02B. Chantier d'affectation provider toujours ouvert |
| H04 | [Fiches historiques Conciergerie](../src/app/dashboard/admin/(product-tech)/developpement/conciergeSubfeatures.ts#L126) : campagnes 100, 4/4 et 8/8, 10/10, 74/74 rapportées | Dates/commits/environnements parfois inconnus ; le 10/10 du 10 octobre concerne le garde d'envoi serveur, pas toute l'UI. Résultats agrégés, jamais réutilisés comme validation actuelle |

## 4. Parcours parents et hypothèses de lancement

Les suffixes ci-dessous se préfixent avec `PLS-INV-OWN-`, `PLS-INV-CON-` et `PLS-INV-ART-`. Dans les listes de capacités, `AUTH-01` signifie exactement `PFC-AUTH-01`, etc. Les parents ne reçoivent aucun nouveau statut ; les états historiques de 02A ne sont pas recalculés.

### 4.1 Propriétaires — 17 parcours parents

| Parent | Fonctionnalité | Hypothèse | Capacités consommées |
|---|---|---|---|
| OWN-001 | Inscription et connexion | S | AUTH-01, AUTH-02, AUTH-03 |
| OWN-002 | Profil propriétaire | S | PROF-01 |
| OWN-003 | Logements | S | LOG-01, LOG-02, AUTH-03 |
| OWN-004 | Recherche de conciergeries | S | RECH-01, RECH-02, RECH-03 |
| OWN-005 | Recherche d'artisans | S | RECH-01, RECH-02, RECH-03 |
| OWN-006 | Filtres géographiques | S | RECH-02 |
| OWN-007 | Prestations et besoins | S | RECH-03 |
| OWN-008 | Demandes de collaboration | S | COL-01 |
| OWN-009 | Collaborations ponctuelles et continues | S | COL-01, COL-02, COL-04, DEV-03 |
| OWN-010 | Partenaires et historique | S | COL-03 |
| OWN-011 | Séjours | S | SEJ-01, SEJ-02, MIS-02 |
| OWN-012 | Demandes et suivi de missions | S | MIS-01, MIS-03, MIS-07, AUTH-03 |
| OWN-013 | Devis reçus et décisions | S | DEV-03 |
| OWN-014 | Facturation et règlement | S | FAC-01, FAC-02 |
| OWN-015 | Messagerie et alertes | S | MSG-01, NOT-01, NOT-02 |
| OWN-016 | Tableau de bord | S | DASH-01 |
| OWN-017 | Paramètres et sécurité du compte | S | PROF-01, AUTH-03, AUTH-04 |

### 4.2 Conciergerie — 33 parcours parents

| Parent | Fonctionnalité | Hypothèse | Capacités consommées |
|---|---|---|---|
| CON-001 | Inscription et connexion | S | AUTH-01, AUTH-02, AUTH-03 |
| CON-002 | Profil professionnel | S | PROF-01 |
| CON-003 | Prestations et tarifs | S | RECH-03, CON-03 |
| CON-004 | Zone d'intervention | S | CON-02, RECH-02 |
| CON-005 | Publication du profil | S | CON-01 |
| CON-006 | Recherche et visibilité | S | RECH-01, RECH-02, CON-01 |
| CON-007 | Réception des demandes | S | COL-01, DEV-01 |
| CON-008 | Invitations | S | COL-05, COL-01 |
| CON-009 | Préparation et envoi des devis | S | DEV-01, DEV-02 |
| CON-010 | Collaborations continues | S | COL-02, COL-03, COL-04 |
| CON-011 | Collaborations ponctuelles | S | COL-01, COL-03, COL-04 |
| CON-012 | Partenaires/propriétaires | S | COL-03 |
| CON-013 | Logements | S | LOG-01, LOG-02 |
| CON-014 | Réservations | S | SEJ-01 |
| CON-015 | Séjours | S | SEJ-02 |
| CON-016 | Planning | S | MIS-02 |
| CON-017 | Missions, affectation et preuves | S | MIS-01, MIS-03, MIS-07, AUTH-03 |
| CON-018 | Check-in et Check-out | S | RECH-03, MIS-01, SEJ-02 |
| CON-019 | Ménage, linge et courses | S | RECH-03, MIS-01, SEJ-02 |
| CON-020 | Tournées et déplacements | A | CON-04 |
| CON-021 | Clés et accès | S | CON-05 |
| CON-022 | Messagerie et alertes | S | MSG-01, NOT-01, NOT-02 |
| CON-023 | Facturation | S | FAC-01, FAC-02 |
| CON-024 | Tableau de bord | S | DASH-02 |
| CON-025 | Paramètres et sécurité | S | PROF-01, AUTH-03, AUTH-04 |
| CON-026 | Synthèse CRM propriétaires | A | DASH-04 |
| CON-027 | Synthèse financière | A | DASH-05 |
| CON-028 | Checklists quotidiennes et de mission | S | MIS-06 |
| CON-029 | Gabarits réutilisables de routines | A | CON-06 |
| CON-030 | Compte rendu vocal validé par un humain | F | CON-07 |
| CON-031 | Stocks et consommables | A | CON-08 |
| CON-032 | Urgences et maintenance | S | CON-09 |
| CON-033 | Rémunération flexible et périodicités | F | CON-10 |

### 4.3 Artisans / Prestataires — 21 parcours parents

| Parent | Fonctionnalité | Hypothèse | Capacités consommées |
|---|---|---|---|
| ART-001 | Inscription et authentification | S | AUTH-01, AUTH-02, AUTH-03 |
| ART-002 | Profil professionnel | S | PROF-01, PROF-02 |
| ART-003 | Métiers et catégories | S | ART-01 |
| ART-004 | Prestations proposées | S | ART-01, RECH-03 |
| ART-005 | Tarifs | S | PROF-01, DEV-01 |
| ART-006 | Zones d'intervention | S | PROF-01, RECH-02 |
| ART-007 | Disponibilités déclarées | S | ART-02 |
| ART-008 | Visibilité dans la recherche | S | RECH-01, RECH-02 |
| ART-009 | Réception des demandes | S | COL-01, MIS-03, MIS-04 |
| ART-010 | Sollicitation par un propriétaire | S | COL-01, MIS-03 |
| ART-011 | Sollicitation par une conciergerie | S | COL-01, MIS-03 |
| ART-012 | Devis | S | DEV-01, DEV-02, DEV-03 |
| ART-013 | Gestion des clients | S | ART-03 |
| ART-014 | Interventions | S | MIS-04 |
| ART-015 | Planning | S | MIS-02 |
| ART-016 | Comptes rendus | S | MIS-05 |
| ART-017 | Facturation | S | FAC-01, FAC-02 |
| ART-018 | Messagerie | S | MSG-02 |
| ART-019 | Alertes et notifications | S | NOT-01, NOT-02 |
| ART-020 | Tableau de bord | S | DASH-03 |
| ART-021 | Paramètres et sécurité | S | PROF-01, PROF-02, AUTH-03, AUTH-04 |

## 5. Catalogue des capacités élémentaires proposées

Toutes les colonnes I et V sont des obligations vérifiables, pas une déclaration de réussite. Les critères propres à un rôle au §7 complètent obligatoirement les lignes partagées. La validation actuelle reste Non testé, selon §2. Les états de développement sont prudents : une capacité couvrant plusieurs rôles reste partielle si un seul parcours requis manque. Ne pas déduire d'un état partagé que tous ses consommateurs sont au même niveau.

### 5.1 Identité et profils

| ID | Capacité / périmètre | Critères I d'implémentation | État observé / sources | Critères V spécifiques | Dépendances | Limite / incertitude |
|---|---|---|---|---|---|---|
| PFC-AUTH-01 | Inscrire un compte par rôle / S | Associer la catégorie publique au rôle autorisé ; valider l'entrée et créer identité/profil cohérents ; refuser un rôle privilégié fourni par le client | Partiel — S01, S02 | Créer chaque rôle synthétique puis relire profil ; injecter rôles/attributs interdits ; vérifier échec partiel et absence de compte incohérent | — | Variantes concierge/artisan et récupération après échec non prouvées actuellement |
| PFC-AUTH-02 | Ouvrir et fermer une session / S | Authentifier avec Credentials ; appliquer le rôle/statut serveur ; terminer la session et limiter les redirections | Partiel — S01 | Vérifier bons/mauvais identifiants, déconnexion et cookie invalide pour chaque rôle ; vérifier OAuth séparément si retenu | AUTH-01 | Fournisseurs et secrets non contrôlés ; OAuth ne peut pas être réputé validé |
| PFC-AUTH-03 | Autoriser une opération privée / S | Identifier l'acteur serveur ; vérifier rôle, état et participation à l'objet avant données/effets ; refuser les références étrangères | Partiel — S01, S08, S11, S15 | Matrice autorisé/refus par endpoint, tiers et inter-tenant ; RLS directe et parcours privilégié distincts ; aucun effet après refus | AUTH-02 | P0 de liaison mission/intervention provider ouvert ; H03 ne couvre pas tous les endpoints |
| PFC-AUTH-04 | Récupérer et sécuriser l'accès au compte / S | Définir les opérations de récupération retenues ; livrer UI/API, expiration et usage unique des jetons sans divulgation de compte | Non évalué — S01, S02 | Vérifier lien expiré/réutilisé, acteur non autorisé et changement effectif selon politique approuvée | AUTH-02 | Aucun parcours complet établi dans le périmètre lu ; choix email, changement de mot de passe et révocation à arbitrer, pas de MFA présumée |
| PFC-PROF-01 | Lire et modifier les champs autorisés du profil / S | Charger les données du compte ; construire un PATCH limité aux champs du rôle ; sauvegarder sans modifier les attributs d'autorisation | Partiel — S02 | Modifier/recharger par rôle ; tester attributs protégés et compte tiers ; traiter valeurs inconnues et erreurs | AUTH-03 | Champs owner/concierge/provider différents ; tarif horaire et rayon ne prouvent ni grille ni couverture réelle |
| PFC-PROF-02 | Déposer et consulter les justificatifs provider / S | Déposer le document privé ; conserver statut/empreinte ; contrôler téléchargement et décision d'examen | Partiel — S02 | Upload autorisé, type/taille, lien privé expiré, tiers refusé ; décision d'examen reflétée sans divulgation | AUTH-03, PROF-01 | Contrats statiques et migration présents ; Storage/base appliquée non vérifiés |

### 5.2 Recherche, communication et alertes

| ID | Capacité / périmètre | Critères I d'implémentation | État observé / sources | Critères V spécifiques | Dépendances | Limite / incertitude |
|---|---|---|---|---|---|---|
| PFC-RECH-01 | Exécuter et paginer une recherche éligible / S | Appliquer rôle/type et filtres ; renvoyer les seuls champs autorisés ; paginer sans doublon et gérer vide/erreur | Partiel — S03, S04 | Parcourir pages avec filtres et rôles ; comparer résultats au jeu connu ; vérifier absence de champs privés | AUTH-03, RECH-02 | Owner cherche des professionnels ; concierge des logements/propriétaires ; exposition artisan ne prouve pas sollicitation |
| PFC-RECH-02 | Filtrer une couverture géographique / S | Saisir ville/rayon et valider coordonnées ; évaluer la couverture déclarée ; distinguer couvert, hors zone et indéterminé | Partiel — S03, S04 | Tester limites de rayon, zones multiples, donnée absente et géocodeur en erreur ; vérifier messages et filtres conservés | — | Adresse professionnelle et zone d'intervention ne sont pas équivalentes ; formats historiques à qualifier |
| PFC-RECH-03 | Qualifier prestations et besoins / S | Résoudre les prestations du catalogue ; conserver des choix précis ; ne pas convertir métier/famille ambiguë en prestations garanties | Partiel — S05, S07 | Tester sélection/retrait, besoins séjour, valeurs historiques inconnues et catégories ambiguës pour chaque rôle | PROF-01 | Déclaration de compétence distincte de qualification vérifiée ; courses et familles larges à préciser |
| PFC-MSG-01 | Échanger entre owner et concierge / S | Résoudre les participants ; créer/lire la conversation persistée ; envoyer et relire un message avec erreurs explicites | Partiel — S06 | Échange bilatéral, tiers refusé, auteur serveur, reprise après erreur et non-lu cohérent | AUTH-03 | Tests de helpers présents, pas une preuve de livraison ou de temps réel |
| PFC-MSG-02 | Échanger dans le workspace provider / S | Lier la conversation à un client autorisé ; persister messages ; contrôler lecture et auteur | Partiel — S06, S15 | Créer conversation client, envoyer et relire, tester deux providers et références étrangères | AUTH-03, ART-03 | Tables séparées ; correspondance client libre/profil PlanetLS non résolue globalement |
| PFC-NOT-01 | Présenter les alertes propres au rôle / S | Définir leur origine ; afficher statut et action cohérents ; différencier alerte persistée et signal agrégé | Partiel — S06, S16 | Générer un signal connu par rôle ; vérifier compteurs, acquittement lorsqu'il existe et erreur sans faux état rassurant | AUTH-03 | Provider possède un CRUD d'alertes ; automatisation et agrégations ne sont pas un moteur unique |
| PFC-NOT-02 | Distribuer une notification externe / A | Définir canal/événement retenus ; enregistrer tentative et résultat ; reprendre sans duplication selon politique approuvée | Non évalué — S06, S09 | Prouver réception externe, échec puis reprise et absence de doublon ; distinguer boîte applicative et email/push | NOT-01 | Push et livraison externe générale non établis ; l'email d'invitation essentiel reste aussi un critère de COL-05 |

### 5.3 Devis et collaborations

| ID | Capacité / périmètre | Critères I d'implémentation | État observé / sources | Critères V spécifiques | Dépendances | Limite / incertitude |
|---|---|---|---|---|---|---|
| PFC-DEV-01 | Préparer un brouillon de devis / S | Rattacher émetteur/client et demande lorsqu'elle existe ; qualifier lignes, prix et taxes ; persister le brouillon sans émission implicite | Partiel — S07, S08, S15 | Créer/modifier/recharger par émetteur ; distinguer service imprécis, prix absent et prix nul ; refuser références étrangères | AUTH-03, RECH-03 | Le devis provider ne prouve pas une demande artisan entrante |
| PFC-DEV-02 | Confirmer et envoyer un devis / S | Confirmer explicitement une gratuité ; sauvegarder avant envoi ; appliquer le garde serveur et produire un état d'envoi exploitable | Partiel — S07 | Tester ligne non tarifée, gratuité confirmée/révoquée, erreur de sauvegarde et réception par destinataire ; rejeu contrôlé | DEV-01 | UI/gratuité retrouvées ; H04 ne valide que le garde serveur historique, pas l'ensemble du parcours |
| PFC-DEV-03 | Décider sur un devis reçu / S | Autoriser le destinataire ; accepter/refuser sans changer un gagnant déjà attribué ; rendre les effets partiels explicites | Partiel — S07, S08 | Deux décisions concurrentes, refus, devis étranger, réponse après attribution et reprise après effet partiel | DEV-02, AUTH-03 | H01 ancien scénario owner-concierge ; concurrence réelle et variantes provider non prouvées |
| PFC-COL-01 | Solliciter et activer un besoin ponctuel / S | Valider destinataire éligible et lieu ; enregistrer demande/réponse ; relier devis gagnant et suite opérationnelle sans doublon | Partiel — S08, S03, S04 | Owner-concierge puis variantes artisan décidées ; tiers/hors-zone refusés ; relecture des liens et reprise après échec | AUTH-03, RECH-03, RECH-02 | La sélection owner ignore provider ; service-requests vérifie une éligibilité concierge. Flux artisan non démontré |
| PFC-COL-02 | Activer une collaboration continue / S | Persister participants, logement et périmètre ; permettre absence de fin et absence de mission fictive ; ajouter des interventions autorisées ultérieurement | Partiel — S08, S11 | Accepter sans dates, relire la collaboration, ajouter une prestation permise puis refuser prestation hors périmètre et tiers | DEV-03, LOG-01 | Activation distincte du contrat signé ; pas de moteur de facturation récurrente déduit |
| PFC-COL-03 | Consulter partenaires et historique / S | Charger collaborations avec références cohérentes ; conserver identité et dates ; filtrer sans dépendre des seuls devis récents | Partiel — S08, S16 | Ancien devis hors page récente, continue sans fin, ponctuelle terminée, incohérence et refus tiers | AUTH-03 | Projection et tests présents ; conformité de données réelles non vérifiée |
| PFC-COL-04 | Demander et constater une résiliation / S | Calculer préavis/date serveur depuis conditions acceptées ; persister la demande ; interdire nouvelles opérations après prise d'effet sans effacer l'historique | Partiel — S08 | Préavis par défaut/conditions bilatérales, limite UTC, répétition et création concurrente d'intervention ; histoire préservée | COL-03, AUTH-03 | Code 03C présent ; H02 ne prouve pas concurrence SQL ni traitement définitif de toute intervention engagée |
| PFC-COL-05 | Inviter un propriétaire et suivre l'invitation / S | Créer une invitation liée au logement autorisé ; protéger le jeton ; suivre et renvoyer selon les règles existantes | Partiel — S09 | Création, destinataire réel, jeton invalide/expiré, renvoi, tiers refusé et livraison externe constatée | AUTH-03, LOG-01 | Émission serveur distincte de délivrabilité ; ne pas confondre invitation propriétaire et destinataire de demande commerciale |

### 5.4 Logements, séjours et exécution

| ID | Capacité / périmètre | Critères I d'implémentation | État observé / sources | Critères V spécifiques | Dépendances | Limite / incertitude |
|---|---|---|---|---|---|---|
| PFC-LOG-01 | Administrer un logement autorisé / S | Créer/lire/modifier les champs du bien ; contrôler propriétaire/gestionnaire et références ; conserver une identité canonique | Partiel — S13 | CRUD applicable owner/concierge, tiers et relations incohérentes ; relecture sans second bien créé implicitement | AUTH-03 | `housing` et références héritées à distinguer ; suppression non nécessaire à une simple consultation |
| PFC-LOG-02 | Gérer les photos privées/autorisées du logement / S | Valider téléversement et rattachement ; stocker puis présenter l'image selon droits ; traiter échec partiel | Partiel — S13 | Type/taille, logement étranger, accès privé et échec upload/liaison ; contrôler orphelins sur environnement isolé | LOG-01, AUTH-03 | Storage et politiques appliquées non contrôlés |
| PFC-SEJ-01 | Créer et modifier une réservation / S | Valider dates, logement et acteurs ; persister réservation et liens ; recalculer explicitement les effets de changement | Partiel — S10 | Création et déplacement, chevauchement, annulation, rôle refusé et panne intermédiaire | LOG-01, AUTH-03 | Autonomie owner ou concierge principal obligatoire à arbitrer pour le lancement |
| PFC-SEJ-02 | Consulter et organiser les besoins d'un séjour / S | Charger réservation et interventions du périmètre ; distinguer check-in/out, ménage, linge, courses ; conserver le contexte lors d'une demande | Partiel — S10, S05, S11 | Cinq besoins distincts, séjour étranger, état vide, modification et suivi des missions liées | SEJ-01, RECH-03, MIS-01 | Une vue de séjour ne prouve pas l'exécution des prestations |
| PFC-MIS-01 | Créer et faire évoluer une mission / S | Relier source, participants et prestation ; appliquer transitions autorisées ; gérer création/reprise sans doublon identifiable | Partiel — S11, S08 | Ponctuel/continu, transitions interdites, deux appels concurrents, panne après création et relecture des liens | AUTH-03, RECH-03 | Plusieurs écritures REST ; H01 et mocks ne prouvent pas atomicité réelle |
| PFC-MIS-02 | Consulter et naviguer dans un planning / S | Charger seulement les événements autorisés ; afficher les périodes/modes prévus ; naviguer sans perdre dates et filtres | Partiel — S10, S11, S14, S15 | Navigation et fuseaux par rôle, événements limites, absence de dates, vide/erreur et mobile | AUTH-03 | Consultation provider distincte d'un moteur de créneaux ou d'optimisation |
| PFC-MIS-03 | Affecter un artisan à une mission / S | Autoriser l'affectant ; vérifier profil et mission ; persister un lien d'affectation non forgeable et contrôler sa consultation | Partiel — S11, S15 | Owner/concierge autorisés, provider étranger, métadonnées falsifiées, réservation commune et rattachements incohérents | AUTH-03, MIS-01 | P0 ouvert sur `metadata.mission_id` ; présence de l'API ne prouve ni sécurité complète ni accord commercial |
| PFC-MIS-04 | Administrer une intervention provider / S | Créer/éditer une intervention de son périmètre ; appliquer statuts et dates ; distinguer client libre et mission affectée | Partiel — S15, S11 | Création autonome sans séjour, intervention affectée, deux providers, référence client étrangère, reprise et statuts invalides | AUTH-03, ART-03 | API permissive sur certains champs ; statut et liens doivent être qualifiés avant état Implémenté |
| PFC-MIS-05 | Sauvegarder un compte rendu d'intervention / S | Valider le rapport structuré ; rattacher intervention et auteur autorisés ; persister/restituer en signalant un schéma indisponible | Partiel — S15 | Enregistrement/relecture, rapport vide/invalide, tiers, table absente et panne après modification d'intervention | MIS-04, AUTH-03 | Migration et contrats statiques présents ; écriture intervention/rapport non présumée atomique |
| PFC-MIS-06 | Persister une checklist / S | Rattacher tâches au jour/acteur ou à la mission ; sauvegarder/recharger l'état ; contrôler modifications étrangères | Partiel — S14, S11 | Rechargement, date limite, compte tiers, mission étrangère et panne ; RLS réellement appliquée | AUTH-03 | Deux supports distincts ; ni l'un ni l'autre ne vaut gabarit réutilisable |
| PFC-MIS-07 | Déposer et consulter une preuve de mission / S | Contrôler participant et namespace ; vérifier l'objet avant accès signé ; conserver la référence et refuser les incohérences | Partiel — S11 | Preuve absente, objet étranger, référence ambiguë, lien expiré et accès Storage réel autorisé/refusé | MIS-01, AUTH-03 | H03 isolé n'est pas une validation Storage/HTTP intégrée |

### 5.5 Facturation, outils terrain et workspaces

| ID | Capacité / périmètre | Critères I d'implémentation | État observé / sources | Critères V spécifiques | Dépendances | Limite / incertitude |
|---|---|---|---|---|---|---|
| PFC-FAC-01 | Émettre et consulter une facture liée / S | Déterminer émetteur/destinataire et source ; calculer lignes/devise ; créer puis relire sans doublon et produire le document autorisé | Partiel — S12, S07, S15 | Devis et intervention terminée, montant invalide, client externe, panne de ligne, double appel et refus tiers | AUTH-03 | Facture provider utilise les colonnes communes ; adéquation hors plateforme et compensation à prouver |
| PFC-FAC-02 | Régler et synchroniser un paiement / S | Initier le paiement autorisé ; vérifier événements signés ; synchroniser sans fausse facture payée et avec reprise idempotente | Partiel — S12 | Succès/échec/retour interrompu, webhook répété/invalide, acompte/solde si retenus ; cohérence Stripe/base | FAC-01, AUTH-03 | Secrets, environnement Stripe et variantes de paiement non inspectés ; H01 paiement simulé distinct |
| PFC-CON-01 | Calculer l'éligibilité de publication concierge / S | Vérifier rôle/statut, identité, prestations et zone ; appliquer la même éligibilité à la visibilité et à la sollicitation | Partiel — S04, S08 | Profil incomplet/actif/suspendu, zone indéterminée et demande directe contournant l'UI | PROF-01, CON-02, RECH-03 | Fonction dérivée présente ; équivalence de tous les points d'entrée non prouvée actuellement |
| PFC-CON-02 | Déclarer une zone concierge qualifiée / S | Éditer la zone du seul compte autorisé ; distinguer rayon déclaré et valeur historique ; conserver les autres préférences | Partiel — S04 | Sauvegarde/relecture, géocodeur indisponible, rayon historique ambigu et accès tiers | AUTH-03, PROF-01 | Une zone déclarée reste une donnée à qualifier, pas une présence terrain vérifiée |
| PFC-CON-03 | Définir les tarifs par prestation / S | Relier service et segment/règle applicables ; conserver prix explicite et paramètres ; produire un prix de devis traçable | Partiel — S07, S05 | Résolution exacte, règle absente/concurrente, gratuité et suppression d'option sans réinterprétation silencieuse | RECH-03, PROF-01 | Multiples grilles et compatibilités ; pas de taux forfaitaire inventé |
| PFC-CON-04 | Proposer et sauvegarder une tournée / A | Utiliser missions et coordonnées autorisées ; ordonner des étapes ; sauvegarder tournée/étapes avec résultat d'échec explicite | Partiel — S14 | Mission sans coordonnées, accès tiers, panne de sauvegarde d'étape et reprise sans tournée incohérente | MIS-02, RECH-02 | Optimisation, déplacements et parcours « Ma journée » complet ne sont pas équivalents |
| PFC-CON-05 | Tracer le cycle des clés / S | Définir accès/détenteur autorisé ; enregistrer remise et restitution ; gérer perte/révocation et lien avec la mission | Non commencé — S14, S11 | Cycle complet, tiers, perte, fin de collaboration et absence de secret exposé | LOG-01, COL-03, AUTH-03 | Champ `key_handover_type` voisin ; aucun flux canonique complet identifié. Besoin de lancement à arbitrer |
| PFC-CON-06 | Réutiliser un gabarit de routine / A | Définir modèle versionné ; instancier sans ressaisie ; conserver indépendance des instances et droits | Non commencé — S14 | Modifier gabarit sans altérer les tâches historiques ; duplication, tiers et version | MIS-06 | Checklist existante distincte du gabarit ; modèle de persistance à définir |
| PFC-CON-07 | Valider un compte rendu vocal proposé / F | Capturer/transcrire avec consentement ; proposer une structure ; exiger validation humaine avant persistance | Non commencé — S14 | Refus audio, transcription incorrecte, correction humaine et absence d'écriture avant accord | MIS-05, AUTH-03 | Aucun flux raccordé identifié ; données vocales et solution technique non arbitrées |
| PFC-CON-08 | Tenir un stock réel / A | Persister quantité, unité et lieu ; tracer mouvements ; calculer seuils sans remplacer l'inconnu par une estimation réelle | Partiel — S14 | Entrée/sortie, solde concurrent, tiers, seuil et distinction prévision/quantité réelle | LOG-01, AUTH-03 | Prévisions UI existantes ; inventaire et mouvements réels non établis |
| PFC-CON-09 | Prendre en charge une urgence/maintenance / S | Qualifier l'incident ; affecter un acteur autorisé ; suivre transitions/médias jusqu'à clôture et information des participants | Partiel — S14, S11 | Incident, affectation, abus, refus tiers, preuve privée, clôture et reprise après panne | MIS-01, AUTH-03 | Chaîne globale, responsabilités et notification réelle non validées |
| PFC-CON-10 | Appliquer une rémunération flexible / F | Définir assiette et période approuvées ; calculer depuis données traçables ; produire règlement et rapprochement cohérents | Non commencé — S16, S12 | Modèles approuvés, arrondis, périodicité, annulation et rapprochement | FAC-01 | Simulation et calculs présents, aucun moteur complet établi ; arbitrage contractuel/fiscal requis |
| PFC-ART-01 | Déclarer métiers et prestations artisan / S | Conserver les déclarations actuelles et inconnues ; résoudre sans élargir un métier en toutes ses prestations ; ne pas prétendre à une qualification vérifiée | Partiel — S02, S05, S15 | Round-trip, effacement, valeur historique et métier sans prestation précise | PROF-01, RECH-03 | `option` et compétences déclarées distinctes d'une certification |
| PFC-ART-02 | Déclarer des disponibilités artisan / S | Saisir/sauvegarder la disponibilité ; restituer sans inventer de créneau libre ; distinguer déclaration et planning occupé | Partiel — S02, S15 | Sauvegarde/relecture, valeur vide, fuseau et consultation sans fausse promesse de réservation | PROF-01 | Champ déclaratif présent, moteur de réservation de créneaux non établi |
| PFC-ART-03 | Administrer un client provider / S | Créer/lire/modifier le client du provider ; conserver client externe sans logement ; contrôler références lors des usages | Partiel — S15 | CRUD, client libre, deux providers et usage du client par devis/intervention/message | AUTH-03 | Un client libre n'est pas nécessairement un compte owner ; rapprochement non présumé |
| PFC-DASH-01 | Synthétiser l'activité propriétaire / S | Agréger les seules données autorisées ; montrer provenance/périmètre ; distinguer vide, erreur et activité nulle | Partiel — S16 | Jeu de données connu, API en erreur et utilisateur sans données ; liens vers objets corrects | AUTH-03 | Les cartes ne prouvent pas la complétude des workflows sous-jacents |
| PFC-DASH-02 | Synthétiser l'activité concierge / S | Agréger demandes, missions, logements et messages ; conserver une lecture explicite des fallbacks et limites | Partiel — S16 | Données partielles/en erreur, compte vide, droits et liens terrain | AUTH-03 | Fallbacks de lecture et préférences locales à distinguer des données persistées |
| PFC-DASH-03 | Synthétiser l'activité provider / S | Agréger clients, interventions, devis et messages autorisés ; signaler schéma absent et erreurs | Partiel — S16, S15 | Base avec/sans tables attendues, données connues et deux providers | AUTH-03 | Certaines API renvoient vide avec note si table absente ; vide n'est pas preuve de fonctionnement |
| PFC-DASH-04 | Présenter une synthèse CRM propriétaires / A | Relier conversations et propriétaires/logements ; calculer indicateurs de synthèse sans inventer d'actions CRM persistées | Partiel — S16, S06 | Cas propriétaire sans conversation, références anciennes et erreurs de source | MSG-01, LOG-01 | Synthèse existante ; CRM avec actions persistées hors périmètre |
| PFC-DASH-05 | Présenter une synthèse financière / A | Agréger factures réelles ; séparer exemple et résultats réels ; préciser devise, période et formule | Partiel — S16, S12 | Données connues, plusieurs devises, montant inconnu et exemple clairement distinct | FAC-01 | Exemple 950 € toujours présent ; rentabilité réelle non déduite de la démonstration |

## 6. Correspondances avec les suivis existants

Les références Master Plan se résolvent depuis les dossiers S01–S16. Ce sont des relations plusieurs-à-plusieurs, pas une nouvelle hiérarchie de statuts :

- PLS-DEV-001 / PLS-SEC-005 : identité et droits ; les capacités AUTH ne closent pas le chantier de sécurité global.
- PLS-DEV-003/004/005 : workspaces owner/concierge/provider ; ne pas compter le chantier parent et ses capacités dans le même dénominateur.
- PLS-DEV-007 : profils/prestations/confiance ; PLS-DEV-028 : recherche multi-rôle, encore documentée TO_PLAN malgré du code existant.
- PLS-DEV-008 : workflow commercial transversal ; sa clôture historique ne valide pas les nouvelles variantes COL/DEV/MIS.
- PLS-DEV-009 : réservations, séjour, planning, missions ; distinguer consultation, organisation et exécution.
- PLS-DEV-010 : facturation et paiements ; PLS-DEV-032 : devis et confirmation gratuite.
- PLS-DEV-015 : checklist existante versus modèle de routine futur ; PLS-DEV-020 : tournées partiellement codées malgré un statut documentaire IDEA ; PLS-DEV-021 : vocal ; PLS-DEV-030 : clés.
- PLS-OPS-001/002 : stocks/urgences ; PLS-PRO-001 : enrichissement provider, distinct du socle existant ; PLS-BIZ-002 : rémunération flexible.
- PLS-DATA-003/004 et PLS-SEC-003 : logement, références et accès. Aucun statut officiel n'est déduit d'une observation de ce document.

### Correspondance des 19 fiches historiques Conciergerie

| Fiche existante | Capacités proposées / restriction |
|---|---|
| PLS-SF-CON-001 | DASH-02, NOT-01 ; agrégation, pas exécution terrain |
| PLS-SF-CON-002 | DASH-04 ; synthèse CRM seulement |
| PLS-SF-CON-003 | DASH-05 ; exemple financier distinct |
| PLS-SF-CON-004 | PROF-01, LOG-01, MSG-01, RECH-01 ; ancienne fiche de qualification, à ne jamais compter comme capacité supplémentaire |
| PLS-SF-CON-005 | SEJ-02 ; lecture/édition distinctes du workflow complet |
| PLS-SF-CON-006 | MIS-02 ; navigation, pas affectation/optimisation |
| PLS-SF-CON-007 | COL-01, COL-02, MIS-01, FAC-01 ; chaîne à valider |
| PLS-SF-CON-008 | MIS-01, MIS-03, MIS-07 ; sécurité des liens ouverte |
| PLS-SF-CON-009 | MIS-06 ; deux supports de checklist |
| PLS-SF-CON-010 | CON-06 ; gabarit non identifié |
| PLS-SF-CON-011 | CON-04 ; tournée et étapes |
| PLS-SF-CON-012 | MIS-02, CON-04, DASH-02 ; « Ma journée » complet non déduit |
| PLS-SF-CON-013 | CON-07 ; vocal non identifié |
| PLS-SF-CON-014 | CON-05 ; champ de remise ne suffit pas |
| PLS-SF-CON-015 | DEV-02 ; sous-critère de gratuité, pas capacité comptée deux fois |
| PLS-SF-CON-016 | DEV-02, DEV-03 ; réception et décision distinctes |
| PLS-SF-CON-017 | CON-08 ; projection distincte du stock réel |
| PLS-SF-CON-018 | CON-09 ; urgence/maintenance |
| PLS-SF-CON-019 | CON-10 ; rémunération flexible |

## 7. Transversal : critères spécifiques et absence de double comptage

| Famille technique | Consommateurs | Critères de parcours supplémentaires obligatoires |
|---|---|---|
| AUTH — authentification et autorisations | Trois espaces | Création owner/concierge/provider séparément ; rôle réel et statut actif ; matrice acteur/objet pour chaque API, pas un simple test de connexion |
| PROF/ART — profils | Trois espaces | Champs owner ; profil/prestations concierge ; métiers, documents et déclarations provider. Les documents ne s'appliquent pas automatiquement à l'owner |
| RECH — recherche/géographie | Trois espaces | Owner : professionnels et filtres ; concierge : propriétaires/logements ; artisan : exposition éligible. Sollicitation artisan requiert COL-01, pas seulement RECH-01 |
| MSG — messagerie | Trois espaces | MSG-01 owner/concierge et MSG-02 provider sont deux capacités, car tables/participants différents. Aucun échange inter-silos présumé |
| NOT — alertes/notifications | Trois espaces | Source des signaux owner/concierge distincte du CRUD provider ; canal externe à définir, pas une notification UI temporaire |
| DEV — devis | Trois espaces | Owner reçoit/décide ; concierge prépare/envoie ; artisan doit aussi prouver source client et destinataire. Colonnes communes ne prouvent pas un parcours identique |
| COL — collaborations | Trois espaces selon parcours | Ponctuel et continu distincts ; destinataires actuellement qualifiés comme concierges. Choix commercial artisan requis ; aucun contrat durable artisan inventé |
| SEJ/MIS — séjour/missions | Owner/concierge, artisan affecté | Création owner, gestion concierge, exécution artisan et refus tiers. Accès à une intervention ne doit pas conférer arbitrairement accès à une autre mission du même séjour |
| FAC — facturation | Trois espaces | Owner consulte et initie le règlement ; concierge/provider émettent puis consultent le statut de leurs propres factures et rapprochent le règlement. Ne pas imposer à l'émetteur de payer sa propre facture. Client externe provider à vérifier séparément |

Unité globale proposée : **ensemble unique d'IDs de capacité**, jamais somme des fiches par rôle. Chaque capacité partagée a des critères communs et des critères par consommateur requis. Elle est globalement implémentée seulement si tous les critères requis dans le socle approuvé sont satisfaits. La vue d'un espace peut présenter son évaluation de parcours sans promouvoir celle des autres.

Les critères partagés portent un ID unique ; les critères spécifiques se suffixent par le rôle, par exemple `PFC-DEV-02-V1-CON` et `PFC-DEV-02-V1-ART`, uniquement si une obligation métier différente le justifie. Sinon, conserver le même critère et ses liens vers les consommateurs. Ce sont des spécialisations de validation, pas deux capacités techniques inventées. Après approbation, figer les identifiants de critères : toute insertion garde les identifiants existants, sans renumérotation par position. Si une différence technique réelle impose une scission, conserver sa justification, comme pour les deux messageries. Aucun critère dupliqué sous plusieurs parents ne doit grossir le global.

## 8. Questions d'origine — historique 02B, décisions confirmées au §11

| ID | Décision ouverte | Effet sur le futur périmètre |
|---|---|---|
| ARB-01 | Lancement concierge/owner seul ou sollicitation commerciale artisan incluse ? | COL-01 côté ART actuellement non démontré ; ne pas déclarer un lancement trois rôles complet sur la seule API d'intervention |
| ARB-02 | Séjour owner autonome ou concierge principal requis ? | Critères SEJ-01, liens et responsabilités ; éviter de compter cinq modes cibles comme cinq workflows livrés |
| ARB-03 | Clés numériques/physiques indispensables ou procédure externe acceptable au lancement ? | CON-05 socle proposé ; si exclu, documenter procédure et limites, pas un Non applicable de convenance |
| ARB-04 | Quels paiements, factures et clients hors plateforme au lancement ? | FAC-01/02, client provider libre, taxes/devises/acomptes ; pas de moteur récurrent présumé |
| ARB-05 | Quels canaux de notification sont indispensables ? | NOT-02 amélioration proposée ; livraison des invitations retenues reste une obligation de COL-05 |
| ARB-06 | Quelles opérations de récupération/sécurité de compte sont exigées ? | AUTH-04 non évalué ; politique de révocation et récupération à définir |
| ARB-07 | Quels critères terrain et contrats terminés sont indispensables ? | Fin effective, interventions en cours, check-in/out, preuves et clôture ; ne pas assimiler fin documentaire et exécution validée |
| ARB-08 | Quelle base de référence pour le socle et quelles exclusions approuvées ? | Versionner capacités/critères, consommateurs et exclusions ; conserver comparaison historique lors d'un changement |
| ARB-09 | Vocal, tournées, CRM, stocks et rémunération : quel calendrier ? | S/A/F ici hypothétiques ; P2 vocal/tournées et autres priorités officielles restent inchangés |

Le P0 d'affectation provider signalé dans [le Master Plan](master-plan-planetls.md#L13) reste une dépendance de sécurité ouverte. Ne pas le classer en amélioration uniquement pour rendre un indicateur plus favorable. La lecture actuelle confirme la liaison par `metadata.mission_id` et/ou réservation dans S11 ; aucune correction n'est engagée.

## 9. Méthodes de calcul futures — propositions seulement

### 9.1 Développement du socle

Définir une version approuvée `B` du périmètre : IDs des capacités S, consommateurs obligatoires, critères I et exclusions justifiées. Tant que B n'est pas approuvée, afficher « Non évalué — périmètre proposé » ; ne pas publier de pourcentage issu de ce document.

- Dénominateur : cardinal de l'ensemble des capacités élémentaires uniques retenues dans B.
- Numérateur : capacités de B dont tous les critères I communs et spécifiques requis sont démontrés satisfaits.
- Formule future : `numérateur / dénominateur × 100`, uniquement si le dénominateur est non nul et le périmètre approuvé.
- Présenter à côté les nombres partiels, non commencés et non évalués. Aucun coefficient de moitié pour un partiel ; aucun crédit sur la seule présence de code.
- Ne pas publier de taux définitif lorsque des capacités incluses restent non évaluées ; afficher les comptes observés et l'insuffisance de couverture. L'absence de preuve n'est pas automatiquement un développement nul.
- Par espace : dédupliquer les capacités consommées, évaluer les critères propres à cet espace ; global : dédupliquer les IDs et exiger tous les consommateurs requis. Ne jamais moyenner les pourcentages par espace.

### 9.2 Validation du socle

- Dénominateur : ensemble unique des critères V requis dans B, incluant les critères de parcours ; les non applicables ne sont exclus qu'avec justification approuvée et traçable.
- Numérateur : critères avec preuves suffisantes, applicables à la version cible et au périmètre prévu, résultat réussi.
- Même rapport futur, avec numérateur et dénominateur visibles ; afficher séparément non testés, échecs, preuves historiques à requalifier, obsolètes, partiellement couverts et non applicables.
- Une preuve qui couvre plusieurs critères doit les citer ; plusieurs preuves du même critère ne donnent qu'une unité au numérateur. Une réussite de test statique n'établit pas un critère RLS ou navigateur.
- Sans critères approuvés, version cible, couverture connue et preuves suffisantes, afficher « Non évalué ». Une campagne incomplète peut afficher son résultat limité et ses manques, jamais « produit validé ».
- Ne pas compter artificiellement chaque assertion ou fichier de test ; choisir des obligations utilisateur/sécurité observables, stables et relues. Les comptes de critères ne sont pas comparables à ceux des capacités de développement.

### 9.3 Chantiers documentaires clôturés

Maintenir exactement les calculs actuels. [SpaceProgress](../src/app/dashboard/admin/(product-tech)/developpement/spaceProgressData.ts#L85) exclut P4 et compte les statuts COMPLETED du responsable unique ; [MissionControl](../src/app/dashboard/admin/(product-tech)/developpement/missionControl.ts#L218) inclut les lignes P4 et regroupe certaines catégories actives. Les deux périmètres restent explicitement distincts. Aucun calcul ne doit lire ce document à ce stade.

Après validation d'un autre lot seulement, proposer l'intitulé « Chantiers documentaires clôturés » et l'affichage de la fraction exacte. Aucun renommage ou nouveau pourcentage dans 02B. Ne pas convertir les 71 parents, les états 02A ou les capacités de ce document en progression.

## 10. Contrôles documentaires et suite autorisée

Contrôles requis pour ce livrable : unicité des IDs de capacités/parents, absence de référence orpheline, couverture de chaque parent et capacité, validité des codes S/A/F, des sources et des références Master Plan, dépendances résolues et sans cycle, liens locaux et repères de lignes existants, 19 fiches historiques reliées, distinction des deux évaluations, UTF-8 sans BOM et diff sans erreur d'espacement. Le contrôle de présence des sources ne valide pas leur comportement.

La seule exécution autorisée ici est documentaire : lecture, comparaison, validation du contenu et des références. Aucun test applicatif, navigateur, accès distant ou migration requis pour préparer ce document. Le tableau Développement, les inventaires TypeScript et le Master Plan restent inchangés.

Travaux restant à effectuer après validation explicite : arbitrer B ; relire les critères avec les responsables produit/technique ; préciser les preuves et l'état de chaque consommateur ; qualifier les références historiques ; préparer des scénarios isolés et une matrice RLS ; obtenir une preuve actuelle pour chaque critère ; autoriser séparément tout branchement applicatif. La proposition de capacités reste à relire pour éviter une granularité disproportionnée ; ne pas optimiser leur nombre pour améliorer un taux.

### Bilan documentaire de PROGRESS-02B

Les comptes ci-dessous décrivent le classement proposé avant les décisions 02B3. Le classement métier courant et sa différence justifiée sont indiqués au §11 ; ne pas réutiliser ces comptes historiques comme dénominateur actuel.

| Vue de la proposition | Parents | Capacités uniques visibles | S | A | F |
|---|---|---|---|---|---|
| Propriétaires | 17 | 27 | 26 | 1 | 0 |
| Conciergerie | 33 | 42 | 34 | 6 | 2 |
| Artisans / Prestataires | 21 | 26 | 25 | 1 | 0 |
| Global dédupliqué | 71 | 52 | 44 | 6 | 2 |

Les colonnes par espace se recouvrent : elles ne s'additionnent pas. S/A/F sont des hypothèses à approuver, jamais des priorités officielles. Aucun de ces comptes n'exprime un avancement ou une validation.

Un seul fichier ajouté. Les 71 parcours parents sont reliés à un catalogue de capacités uniques ; leurs nombres expriment une couverture de proposition, pas un résultat de développement. Les arbitrages de lancement, la recette et les preuves actuelles restent ouverts. Aucun changement du pilotage officiel ni des calculs existants. Aucun commit, push, déploiement, action Docker ou écriture Supabase.

## 11. Intégration des décisions métier confirmées — PROGRESS-02B3

### 11.1 Autorité, date et portée

Les décisions ARB-01 à ARB-09 ont été explicitement confirmées par la responsable du projet dans la demande PROGRESS-02B3 du **16 novembre 2026**. Leur texte et leurs conséquences sont consignés au [§11 du dossier d'arbitrage](planetls-progress-launch-arbitration.md). Les neuf questions du §8 sont conservées pour traçabilité, mais leurs décisions principales ne sont plus en attente. Les détails de réalisation et preuves manquantes ne rouvrent pas ces décisions.

Le présent §11 est la version documentaire **B3-métier** du périmètre. Ce n'est ni une base de critères mesurables entièrement qualifiée, ni un dénominateur publié, ni une approbation de code. L'absence de développement ne remet pas en question le choix produit ; elle reste un écart à traiter dans un lot autorisé. Aucun statut du Master Plan, état de développement ou résultat de validation applicatif n'est promu.

### 11.2 Décisions, capacités, écarts et critères futurs

Les IDs abrégés de cette table se préfixent par `PFC-`. Les critères ajoutés seront identifiés avec la version `.B3-I<n>` / `.B3-V<n>` et le consommateur lorsque nécessaire, sans écraser les critères historiques I/V du §5. Les obligations listées ci-dessous sont exigées, **non testées**, avec preuves actuelles non établies.

| Décision confirmée le 16 novembre 2026 | Capacités concernées | Périmètre métier décidé et critères d'implémentation à qualifier | Code présent / développement ou preuve manquants | Validation future obligatoire et dépendances |
|---|---|---|---|---|
| ARB-01 — Deux parcours de sollicitation artisan, y compris hors location saisonnière | COL-01, RECH-01, RECH-02, RECH-03, PROF-01, ART-01, ART-03, DEV-01, DEV-02, DEV-03, MIS-03, MIS-04, MIS-05, FAC-01, AUTH-03 | Owner sollicite directement ; concierge sollicite pour le propriétaire avec autorisation appropriée. Distinguer demande, accord, devis et intervention ; ne pas exiger un séjour pour un besoin générique | Recherche et workspace présents ; sélection provider ignorée dans le flux owner et destinataire contrôlé comme concierge. Flux commercial artisan et preuve du mandat non établis | Tester les deux émetteurs, absence de séjour, accord explicite et refus sans mandat ; identité du client avant acceptation ; liens et permissions inter-objets. Dépend de ARB-04 et sécurité provider |
| ARB-02 — Séjours autonomes ou délégués, prestations ponctuelles sans délégation complète | LOG-01, SEJ-01, SEJ-02, COL-01, COL-02, COL-03, MIS-01, MIS-02, MIS-03, AUTH-03 | Les deux modes font partie de la cible ; respecter les modèles continu/ponctuel ; identifier l'acteur responsable et le périmètre délégué | L'API owner exige actuellement concierge et collaboration. L'autonomie ne doit pas être déclarée livrée ni obtenue en rendant simplement un champ facultatif | Scénarios autonome, délégué et aide ponctuelle ; permissions et données selon mode ; aucune délégation implicite ; refus d'un intervenant sur un autre séjour |
| ARB-03 — Accès simplifiés au lancement, numérique avancé reporté | CON-05, LOG-01, COL-03, COL-04, MIS-01, MIS-07, AUTH-03 | Mode d'accès renseigné ; consignes sensibles protégées ; personnes autorisées seulement ; confirmation minimale de remise/restitution si nécessaire ; révocation à la fin de l'autorisation | Champ/consignes ponctuels présents ; aucune chaîne complète de garanties établie. Le suivi numérique avancé n'est pas nécessaire au lancement, mais les garanties minimales le sont | Vérifier secret non public, accès par acteur autorisé et retrait après fin ; preuve de remise/restitution et incident selon le mode. Une procédure pratique ne vaut pas capacité numérique implémentée |
| ARB-04 — Paiement direct des prestations et règlement déclaré/contestable | FAC-01, FAC-02, DEV-01, DEV-03, ART-03, MIS-04, COL-01, COL-02, AUTH-03, NOT-01, NOT-02 | Client contractuel identifié avant acceptation ; quatre circuits au §11.3 ; professionnel déclare réception, client consulte et peut signaler/contester ; historique conservé ; déclaration distincte de preuve bancaire. PlanetLS n'encaisse pas ces prestations au lancement | Factures, statuts et Stripe présents mais ne prouvent pas cette cible. Route de statut facture lue limitée aux rôles concierge/admin ; déclaration provider et contestation client avec historique non établies. Requalification des effets de clôture liés à paid requise | Tester chaque circuit, mandat et refus d'engagement non autorisé ; émetteur seul déclarant, client seul contestant selon droits ; historique/reprises sans perte ; aucune fausse preuve bancaire. Vérifier circuits et obligations applicables avant lancement |
| ARB-05 — Centre intégré, emails essentiels, secondaire dans l'application | NOT-01, NOT-02, MSG-01, MSG-02, COL-05, DEV-02, FAC-01, FAC-02, MIS-01 | Centre de notifications ; emails notamment nouvelles demandes, devis, décisions importantes, changements significatifs de mission, factures et contestations de paiement ; secondaire uniquement applicatif | Alertes/messages et événements existent ; centre cohérent et livraison essentielle fiable non démontrés. Une notification temporaire ou une ligne d'événement ne suffit pas | Matrice événement/destinataire/canal, consultation/acquittement selon conception, réception réelle, confidentialité, délivrabilité, panne et reprise ; liens privés autorisés. Multicanal non essentiel reste différé |
| ARB-06 — Sécurité renforcée, accessible ; MFA administrateurs obligatoire | AUTH-01, AUTH-02, AUTH-03, AUTH-04, PROF-01 | Confirmation email, récupération sûre, modification du mot de passe, gestion/révocation des sessions, lutte contre connexions abusives, vérification renforcée des actions sensibles ; double authentification obligatoire admin. MFA standard progressive | Credentials, configuration OAuth et gardes présents ; prise en charge complète de ces obligations non établie dans les sources lues. Administration ajoutée comme consommateur transversal de sécurité, pas comme 72e parcours ni nouvelle capacité | Tester confirmation, jetons expirés/réutilisés, changement de mot de passe, révocation effective, abus, vérification sensible et MFA admin refusée si absente ; moyens de récupération sûrs ; RLS et identité réelle distincts |
| ARB-07 — Exécution complète, fin sans abandon automatique des interventions engagées | SEJ-01, SEJ-02, MIS-01, MIS-02, MIS-03, MIS-04, MIS-05, MIS-06, MIS-07, COL-02, COL-03, COL-04, CON-09, FAC-01, AUTH-03 | Responsable par intervention ; suivi, justificatifs adaptés, annulations, absences, litiges et historique. Traitement individuel à la fin ; conserver préavis de 30 jours et effet calculé côté serveur. Ni suppression ni abandon automatique | Préavis/lifecycle et chaînes terrain présents partiellement ; traitement complet de chaque intervention et des litiges non prouvé. Détails antérieurs 03C préservés, notamment conditions bilatérales documentées et convention UTC ; pas de changement applicatif implicite | Tester annulation/absence/litige, responsabilité, fin au seuil et intervention engagée ; aucun effacement, abandon ou transfert automatique induit ; concurrence réelle et droits sur preuves. Ne pas confondre déclaration de règlement et preuve de réalisation |
| ARB-08 — Lancement progressif avec les trois espaces | AUTH-03, RECH-01, COL-01, SEJ-01, MIS-03, FAC-01, DASH-01, DASH-02, DASH-03 ; ensemble des capacités du socle | Finaliser essentiels → vérifications fonctionnelles/sécurité → bêta pilote sélectionnée → corrections → ouverture publique progressive sous conditions. Aucune ouverture réelle sans permissions/protection des données suffisantes | Référentiel et dossier présents ; tests actuels, critères détaillés et préparation opérationnelle non qualifiés. Décision de stratégie confirmée, pas GO technique ni autorisation d'inviter des utilisateurs | Version cible, matrice rôles/objets, validations avant pilote et après corrections ; traces des décisions de passage ; exposition des routes et sécurité provider vérifiées |
| ARB-09 — Report des outils avancés sans retrait des essentiels | CON-04, CON-06, CON-07, CON-08, CON-10, DASH-04, DASH-05, NOT-02 ; MIS-02, MIS-07, CON-09 et FAC-01 restent essentiels | V1.1/ultérieur : optimisation avancée, gabarits, stock complet, CRM/synthèses enrichis, multicanal non essentiel. Futur : vocal avancé et rémunération/périodicités complexes. Planning, missions, preuves, notifications nécessaires, sécurité et obligations d'interventions/factures restent au socle | Outils partiels déjà présents conservés. Les classements P2/P4 du Master Plan ne changent pas. Le report concerne le sous-périmètre avancé, pas ses garanties élémentaires | Vérifier que parcours essentiel fonctionne sans dépendance cachée à l'outil reporté ; sécurité de toute surface existante maintenue ; aucune suppression ni dégradation appliquée dans ce lot |

### 11.3 Paiements : matrice confirmée et écarts de code

| Circuit décidé | Client contractuel / destinataire de facture | Professionnel émetteur |
|---|---|---|
| Propriétaire sollicitant directement un artisan | Propriétaire | Artisan |
| Conciergerie pour ses propres prestations | Son client contractuel identifié | Conciergerie |
| Conciergerie intermédiaire autorisée pour le propriétaire | Propriétaire | Artisan |
| Conciergerie commandant en son nom | Conciergerie | Artisan |

Le client contractuel doit être fixé avant acceptation du devis. Une conciergerie ne peut engager financièrement un propriétaire sans autorisation appropriée. Les modalités techniques de preuve du mandat et d'identification d'un client externe restent à concevoir ; les deux parcours de sollicitation ne sont pas remis en attente.

La cible de PFC-FAC-02 est désormais le **suivi déclaratif d'un règlement direct des prestations**, avec consultation, signalement/contestation et historique, pas l'encaissement de ces prestations par PlanetLS. Le code historique de checkout/sync/webhook reste intact et n'est pas une preuve de cette cible. Cette décision ne tranche pas les abonnements propres de PlanetLS ou leur éventuel usage de Stripe, hors arbitrage du paiement des prestations.

Sources d'écart : [statut de facture](../src/app/api/invoices/[id]/status/route.ts#L32), [clôture après paiement](../src/app/api/invoices/[id]/status/route.ts#L50), [contrainte de séjour](../src/app/api/owner/reservations/route.ts#L144), [sélection artisan ignorée](../src/app/dashboard/owner/concierges/OwnerConciergesPageClient.tsx#L897). Ces sources signalent des raccordements ou effets à qualifier, pas une autorisation de correction. La déclaration n'est jamais présentée comme preuve bancaire. Aucun avis de conformité juridique ou financière globale n'est délivré ; vérification des circuits et obligations avant lancement obligatoire.

### 11.4 Classement métier courant et maintien des identifiants

Le catalogue garde **52 capacités**, sans création, suppression ou renumérotation, et **71 parents**. Les codes historiques du §5 sont conservés comme proposition initiale ; le classement cible ci-dessous est la règle documentaire courante :

- **Socle :** les 44 IDs historiquement S, avec leurs critères B3 actualisés, plus PFC-NOT-02 limité aux emails essentiels. PFC-CON-05 reste S pour l'accès simplifié ; son suivi numérique avancé est reporté sans nouvel ID.
- **V1.1 ou ultérieur :** PFC-CON-04, PFC-CON-06, PFC-CON-08, PFC-DASH-04, PFC-DASH-05. Les sous-périmètres avancés de PFC-CON-05 et PFC-NOT-02 restent visibles en feuille de route mais ne sont pas comptés une deuxième fois.
- **Futur :** PFC-CON-07 et PFC-CON-10. Les priorités officielles, notamment P2 du vocal/tournées, ne sont pas modifiées.

Le seul déplacement entre classes de capacité est **PFC-NOT-02 : A historique → S cible pour les emails essentiels**, imposé par ARB-05. Le multicanal secondaire avancé ne devient pas une exigence de lancement. Les 45 capacités du socle, 5 d'amélioration et 2 futures décrivent ce classement cible, pas un dénominateur calculable ni un avancement.

Les rôles consommateurs héritent des §4/7, complétés : autonomie owner dans SEJ-01/02 ; concierge mandataire ou cliente dans COL-01/DEV/FAC ; clients hors séjour dans ART/MIS/FAC ; administration pour les obligations de sécurité AUTH. Ce dernier rattachement est transversal, sans ajout artificiel d'un parcours à l'inventaire 02A.

Les classements généraux des parents restent une trace de 02A. Si une décomposition devient nécessaire (mandat, contestation de règlement, MFA admin, centre de notifications), préparer une proposition motivée avec critères, liens de remplacement et impact sur les comptes avant tout changement structurel ; aucune nouvelle capacité n'est créée ici.

### 11.5 Préparation documentaire de PROGRESS-02C — non exécuté

| Axe | Entrée préparée | Qualification encore nécessaire avant tout affichage |
|---|---|---|
| Développement | Ensemble unique cible des IDs S B3 ; critères historiques plus obligations actualisées ci-dessus | Fixer les sous-périmètres/critères versionnés et les consommateurs ; réexaminer chaque capacité après les décisions. Les observations Partiel/Non commencé/Non évalué du §5 restent historiques, pas un calcul actuel. Aucun coefficient arbitraire |
| Validation | Critères V0 et B3 par rôle, sécurité admin comprise ; traces H01–H04 séparées | Établir matrice de tests, environnement/version, preuves exploitables, limites et statut par critère. Toutes les nouvelles obligations restent Non testées. Pas d'obsolescence inventée sur une date ; historique à requalifier |
| Transversal | IDs PFC uniques et liens de parcours | Dédupliquer globalement ; ne pas compter le volet avancé reporté ou un rôle supplémentaire comme nouvelle capacité. Les mandats et données financières ne sont pas communs par simple existence du backend |
| Chantiers documentaires | Calculs SpaceProgress/MissionControl existants | Calcul inchangé ; intitulé explicite ultérieur seulement dans un lot autorisé. Le Master Plan ne lit pas cette section |
| Lancement | Stratégie progressive trois espaces confirmée | Aucun GO automatique pour bêta ou public ; permissions, données, délivrabilité et circuits financiers réels à vérifier avant utilisateurs réels |

La base métier est confirmée ; le jeu détaillé de critères et de preuves n'est pas suffisamment qualifié pour publier un taux. Ce travail prépare uniquement les entrées documentaires d'un futur lot 02C ; il ne démarre aucune intégration. Les risques provider, les limites de récupération/MFA, l'autonomie owner, la sollicitation artisan et le suivi déclaratif des paiements restent explicites.
