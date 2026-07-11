# Sprint 1 - Audit complet de PlanetLS

Date: 2026-07-07

## 1. Synthese executive

PlanetLS est une application Next.js App Router orientee marketplace operationnelle entre proprietaires, conciergeries et prestataires. Le projet est fonctionnellement riche et deja partiellement consolide: dashboards par role, APIs metier, auth NextAuth/Supabase, workflows demandes/devis/factures/missions, design-system interne, tests metier nombreux.

Le principal risque n'est pas l'absence de fondation, mais la coexistence de plusieurs generations d'architecture:

- un ancien socle `src/app/components/*` encore tres utilise;
- un socle plus propre `src/components/ui` et `src/components/dashboard`;
- des modules `src/features/*` plus recents et mieux decoupes;
- des types Supabase partiellement en retard sur les migrations;
- beaucoup de logique client-side dans les layouts et pages dashboard;
- des composants et styles probablement orphelins a confirmer avant suppression.

Decision d'architecture Sprint 1: toute evolution future doit partir de `src/components/ui`, `src/components/dashboard`, `src/features/*`, `src/app/lib/*` et `src/server/*`, en evitant de creer une nouvelle strate parallele.

## 2. Chiffres constates

- Pages App Router: 99 fichiers `page.tsx/jsx/js`.
- Routes API: 100 handlers `route.ts/js`.
- Code TS/TSX: 663 fichiers.
- Code JS/JSX: 30 fichiers.
- Modules SCSS: 247 fichiers.
- Tests: 34 fichiers `*.test.mts`, 132 tests executes.
- Migrations SQL: 59 fichiers dans `database/migrations` et `supabase/migrations`.

Verification:

- `npm run lint`: OK, aucune sortie d'erreur.
- `npm test` dans le sandbox: bloque par `spawn EPERM`.
- `npm test` hors sandbox: 131/132 tests OK. Echec restant: `src/tests/ui-snapshots.test.mts`, snapshot UI des fichiers `src/components/ui/*` desynchronise avec `src/tests/ui-files.snapshot.json`. A ne pas corriger automatiquement pendant cet audit.

## 3. Cartographie du projet

### Racine

- `src/app`: App Router, pages publiques, dashboards, routes API, composants historiques, styles globaux.
- `src/components`: primitives UI et composants dashboard reutilisables plus recents.
- `src/features`: modules metier decoupes par domaine.
- `src/server`: auth serveur, guards, client Supabase serveur, logging, helpers serveur.
- `src/types`: types TypeScript transverses et types Supabase.
- `src/tests`: tests unitaires/metier avec Node test runner.
- `database/migrations` et `supabase/migrations`: migrations SQL, avec recouvrement partiel.
- `docs`: audits, specs et runbooks deja nombreux.
- `scripts`: scripts de verification et preparation de comptes/profils Supabase.

### Pages publiques

- Accueil et contenu: `/`, `/home`, `/about`, `/contact`, `/parcours`, `/cadences`.
- Profils d'offre: `/owner`, `/concierge`, `/provider`.
- Inscription/connexion: `/login`, `/complete-registration`.
- Parcours metier public: `/mission-urgente`, `/planning`, `/map-list`.
- Design system interne: `/design-system`, `/design-system/visuels`.
- Pages experimentales/specialisees: `/premium-owner-dashboard`, `/abonnement/concierge-pro`, `/concierges/[id]`.

### Dashboards par role

- Owner: accueil, logements, concierges, demandes, devis, factures, messages, planning, missions, stocks, objectifs, reglement, settings, alertes, litiges, documents.
- Concierge: accueil, demandes, logements, missions, planning, messages, pricing, services-packages, billing, contacts, alertes, urgences, stocks, objectifs, profil, fiche, recherche, settings.
- Provider/artisan: accueil, clients, interventions, messages, devis, planning, finances, alertes, objectifs, outils, settings.
- Admin: accueil, utilisateurs, proprietaires, conciergeries, artisans, demandes, missions, controle.

### APIs

Familles principales:

- Auth: `auth/login`, `auth/register`, `auth/dev-workspace-login`, NextAuth catch-all.
- Profils: `profiles`, `profiles/current`, `profiles/public`, `profiles/concierges`, `profiles/owners`, avatars, workspaces.
- Housing/logements: `housing`, photos, fiche par id, owners.
- Service requests: `service-requests`, recipients, select, prepare-quote, respond.
- Quotes/invoices/billing: `quotes`, `invoices`, `billing/*`, Stripe sync/webhook.
- Missions: `missions`, files, providers, kpis, urgent missions.
- Concierge: checklist, zone intervention, matching, optimized routes.
- Provider: workspace, clients, interventions, alerts, messages.
- Admin: overview, operations, control-tower, users.
- Services/pricing: catalog, packages, contracts, pricing, segments, scenarios.
- Messages/conversations, inspections/disputes, owner invitations, geocode, KPIs, workflow events.

## 4. Composants reutilisables prioritaires

### UI de base a privilegier

- `src/components/ui/Button`, `ButtonLink`
- `src/components/ui/Input`, `Select`, `Textarea`, `Checkbox`
- `src/components/ui/Card`, `Badge`, `Tag`
- `src/components/ui/Loader`, `AsyncState`, `EmptyState` via `src/features/shared`
- `src/components/ui/SearchBar`
- `src/components/ui/Tabs`, `TabButton`
- `src/components/ui/StatsCard`, `RequestStatusBadge`
- `src/components/ui/ServiceCatalogPicker`, `ServiceCategoryIcon`
- `src/components/ui/PublicIcon`, `WorkspaceRoleIcon`

### Dashboard a privilegier

- `src/components/dashboard/DashboardLayout`
- `DashboardOperationalPage`
- `DashboardPanel`
- `DashboardLoadingScreen`
- `DashboardSectionShell` / `SectionShell`
- `MetricDonut`
- `ConversationFilters`
- `CompletionStatusCard`
- `QuickActions`
- `ActivityFeed`
- `ProfileSummary`
- `ReadabilityControls`

### Composants metier a reutiliser

- `src/features/service-requests/ServiceRequestCard`
- `src/features/service-requests/WorkflowTimeline`
- `src/features/owner-dashboard/OwnerJourney`
- `OwnerRequestSummaryCard`
- `OwnerQuoteResponseCard`
- `OwnerQuotesComparisonTable`
- `src/features/owner-concierges/*` pour recherche et selection conciergerie.
- `src/features/public-concierges/ConciergePreviewCard`
- `src/app/components/tariffs/TariffBillingDesk`
- `src/app/components/dashboard/housing/HousingListPage`, `CreateHousingForm`, `HousingPhotoManager`
- `src/app/components/dashboard/profile/EditableUnifiedProfilePage`, `ProfilePageShell`, `ProfileOverviewWorkspace`
- `src/app/components/dashboard/concierge/PricingGridManager`, `ServicePackageManager`, `ContractTemplateManager`

## 5. Composants a fusionner ou clarifier

- `src/components/ui/*` et `src/app/components/ui/*`: garder `src/components/ui` comme socle atomique; migrer progressivement les composants generiques restants hors `src/app/components/ui`.
- `WorkflowStatusBadge` et `RequestStatusBadge`: conserver deux usages si documentes. `RequestStatusBadge` = workflow commercial; `WorkflowStatusBadge` = statuts generiques facture/planning/mission.
- `ServiceCatalogPicker` et `ServiceCatalogSelector`: converger vers un seul pattern de selection catalogue, avec un wrapper compatibilite si necessaire.
- `InputWithValidation` et `Input`: fusionner les comportements validation/aria dans `Input` ou creer une variante officielle.
- `src/app/components/dashboard/Sidebar` et `src/components/dashboard/Sidebar`: determiner un seul composant cible pour navigation dashboard.
- `DashboardCard`, `DashboardMetricCard`, `StatsCard`, `DashboardPanel`: definir une matrice claire KPI / panel / card metier.
- `OwnerConciergesPageClient` sous `src/app/dashboard/owner/concierges` et feature `src/features/owner-concierges`: la feature doit devenir source principale, la page App Router simple assembleur.
- `ConciergeCard` existe dans `src/app/dashboard/owner/concierges/card` et `src/features/owner-concierges/components`: garder une seule implementation.

## 6. Composants dupliques ou strates concurrentes

- UI atomique: doublons conceptuels entre `src/components/ui` et `src/app/components/ui`.
- Dashboard shell: doublons entre `src/components/dashboard` et `src/app/components/dashboard`.
- Profils: logique repartie entre `src/app/components/dashboard/profile`, `src/features/concierge-profile`, `src/types/profile.ts`, `src/app/lib/profileLocation.ts`.
- Owner/concierge demandes: des pages contiennent encore beaucoup de logique locale malgre l'existence de `ServiceRequestCard`, `WorkflowTimeline`, `commercialWorkflow`, `requestStatus`.
- Statuts: mappings locaux restent presents dans plusieurs pages malgre `missionStatus`, `workflowStatus`, `requestStatus`, `paymentWorkflow`.
- SQL: migrations dupliquees ou proches entre `database/migrations` et `supabase/migrations`.

## 7. Composants probablement inutilises a confirmer

Detection conservatrice par nom de fichier, a ne pas supprimer sans verification manuelle:

- `src/app/components/forms/ContactForm.js`
- `src/app/components/forms/RegistrationForm.js`
- `src/app/components/layout/Footer/FooterLinks.js`
- `src/app/components/layout/ContactInfo.js`
- `src/features/ownerPremiumDashboard/data/mockData.ts`

Usage faible ou mono-reference a surveiller:

- `src/app/components/Filters/CategoriesFilter/CategoriesFilter.jsx`
- `src/app/components/layout/AutocompleteInput/AutocompleteInput.jsx`
- `src/app/components/hooks/useAutoOpen.ts`
- `src/app/components/hooks/useInactivityLogout.ts`
- `src/app/components/ui/MembershipBadge/MembershipBadge.tsx`
- `src/app/components/ui/PolicyBanner/PolicyBanner.tsx`
- `src/app/components/ui/ProgressBar/ProgressBar.tsx`
- `src/app/components/ui/ThemeToggle/ThemeToggle.tsx`
- plusieurs composants dashboard concierge historiques (`DashboardCard`, `MissionsTabLayout`, `ProToolsSection`, etc.).

## 8. Hooks, contextes et stores

Hooks identifies:

- `useCurrentUser`, `useInactivityLogout`, `useAutoOpen`
- `useReadabilityScale`
- `useConciergeDashboardData`, `useConciergeOverviewData`
- `useConciergeMessages`
- `useOwnerDashboardData`, `useOwnerConciergeSearch`
- `useProviderDashboardData`

Contextes:

- `AuthContext.js`
- `LanguageContext.js`
- `NotificationContext.js`
- `SearchPopupContext.tsx`
- `UserTypeContext.tsx`
- `Providers.js`
- `ThemeProvider.tsx`

Stores:

- Aucun store global type Zustand/Redux/Jotai/Recoil detecte.
- L'etat est local React + contexts + hooks fetch + URL/cookies/session.
- Recommandation: ne pas introduire de store global tant que les flux restent separables par role. Preferer hooks domaine + cache SWR eventuel par feature.

## 9. Services et logique metier

Services/helpers centraux a conserver:

- Auth/roles: `src/server/auth/authOptions.ts`, `apiAuth.ts`, `roleGuards.ts`, `businessAuthorization.ts`, `src/proxy.ts`.
- DB: `src/server/db/dbServer.ts`, `src/app/lib/dbClient.ts`, `src/app/lib/dbServer.ts`.
- Workflows: `commercialWorkflow.ts`, `paymentWorkflow.ts`, `missionStatus.ts`, `missionPermissions.ts`, `requestStatus.ts`, `workflowStatus.ts`, `serviceRequestBrief.ts`, `invoiceStatus.ts`.
- Profil et catalogue: `profileLocation.ts`, `profileVisualKit.ts`, `serviceCatalog.ts`, `serviceCategoryIcon.ts`.
- Domaine owner/concierge/provider: helpers sous dashboards et `src/features/*`.

Point d'attention: plusieurs clients Supabase sont crees a module scope avec fallback placeholder. C'est pratique pour le build, mais les surfaces critiques devraient echouer explicitement lorsque la configuration runtime manque.

## 10. Modeles Supabase et types

Tables typees dans `src/types/supabase.generated.ts` ou `src/types/supabase.ts`:

- profils et categories: `profiles`, `categories`, `user_roles`, `user_dashboard_view`
- logements: `housing`, `properties`
- services/pricing: `services_catalog`, `services_pricing`, `services_packages`, `services_package_items`, `pricing_packages`, `pricing_segments`, `pricing_property_rules`, `pricing_strategy_scenarios`, `contract_templates`, `services_contracts`
- missions: `missions`, `mission_events`, `mission_reviews`, `planning_entries`
- conversations: `contact_conversations`, `contact_messages`
- matching: `concierge_owner_matches`
- devis/factures: `quotes`, `quote_items`, `quote_events`, `invoices`, `invoice_items`, `invoice_events`, `stripe_events`
- provider: `provider_clients`, `provider_interventions`, `provider_alerts`, `provider_conversations`, `provider_messages`

Tables presentes en migrations mais absentes ou insuffisamment typees:

- `service_requests`, `service_request_recipients`
- `workflow_events`
- `checkout_inspections`, `checkout_checklist_items`, `inspection_media`, `damage_disputes`, `dispute_evidence_links`, `inspection_events`
- `owner_invitations`, `owner_concierge_links`, `owner_invitation_events`
- `onboarding_events`
- `concierge_daily_checklist`, `concierge_absences`
- `optimized_routes`, `optimized_route_stops`
- `housing_collaborations`

Risque: usage frequent de `asLooseSupabaseClient` pour contourner les types. C'est acceptable temporairement, mais les futures evolutions Supabase doivent commencer par regeneration/alignement des types.

Types TypeScript transverses:

- `certification.ts`, `housing.ts`, `ownerInvitations.ts`, `profile.ts`, `servicePackages.ts`
- `next-auth.d.ts`
- `supabase.ts`, `supabase.generated.ts`, `supabase-provider.ts`

## 11. Incoherences UX

- Les dashboards ont des densites et niveaux de finition differents selon le role. Owner et concierge sont plus riches que provider/admin sur certains parcours.
- Certaines pages sont des cockpits complets, d'autres restent des listes ou pages placeholder.
- La navigation owner a une bottom nav dediee, pas encore generalisee pour concierge/provider.
- Les parcours demande/devis/mission/paiement existent mais la lecture peut varier selon page: statuts, badges, timeline et prochaines actions ne sont pas toujours presentes au meme endroit.
- Plusieurs pages publiques coexistent pour expliquer les profils (`owner`, `concierge`, `provider`, `parcours`, `mission-urgente`) avec risque de redondance narrative.
- `/premium-owner-dashboard` semble une experience demo/premium a part avec mockData; clarifier si reference cible ou prototype.

## 12. Incoherences UI

- Deux bibliotheques UI internes coexistent.
- Modules SCSS tres nombreux, souvent page-specific, avec risque de variations de rayons, ombres, espacements, focus.
- Certains composants historiques utilisent encore des styles locaux au lieu des tokens/mixins `--ds-*`, `--ui-*`, `--dash-*`.
- Badges de statuts et cards KPI ont plusieurs implementations.
- Les composants de formulaires ne partagent pas tous les memes conventions de label, erreur, description, taille et focus.
- Les dashboards utilisent parfois des cards imbriquees ou des surfaces tres decoratives, alors que les pages operationnelles devraient rester denses et scannables.

## 13. Optimisations de performance

- Reduire le client-side au niveau `src/app/dashboard/layout.tsx`: le layout global est `use client` et charge des donnees owner meme si conditionne par role. A terme, isoler le bandeau/bottom nav owner dans un sous-composant owner.
- Introduire SWR ou un cache local de fetch par domaine pour conversations, demandes, factures et KPIs afin d'eviter les fetchs repetes dans navbar/sidebar/pages.
- Eviter les gros imports de composants dashboard dans les pages qui n'en utilisent qu'une partie; conserver les barrel exports mais surveiller les bundles.
- Continuer l'usage `next/image` avec dimensions stables; verifier les images publiques et avatars importes depuis Supabase.
- Centraliser les appels API `cache: "no-store"`: ils sont justifies pour les dashboards, mais certains endpoints de reference/catalogue peuvent etre caches ou memoises.
- Regenerer les types Supabase pour reduire `untypedSupabase`, ce qui evite aussi des transformations defensives en cascade.
- Ajouter analyse bundle ciblee sur `dashboard/owner`, `dashboard/concierge`, `dashboard/provider` avant toute nouvelle grosse dependance.

## 14. Optimisations d'accessibilite

- Bon socle existant: beaucoup de `aria-label`, `role=status`, `role=alert`, `aria-live`, boutons avec labels, modales avec `dialog`.
- A renforcer: focus trap systematique dans toutes les modales/popups historiques.
- Uniformiser les composants interactifs custom: les cards cliquables doivent utiliser lien/bouton natif si possible, sinon `role`, `tabIndex`, `Enter` et `Space`.
- Garantir un label visible ou programmatique pour tous les champs; eviter que `placeholder` soit le seul label.
- Verifier contraste reel des themes `light`, `mucha-dark`, `art-deco`, `sepia`.
- Tester navigation clavier complete sur login, dashboard owner, dashboard concierge, demande/devis/facture, creation logement.
- Ajouter un lien d'evitement vers le contenu principal dans le shell dashboard.

## 15. Ameliorations d'architecture proposees

Priorite P0:

- Documenter la regle: nouveau composant generique dans `src/components`, composant metier dans `src/features`, page App Router comme assembleur.
- Aligner les types Supabase avec toutes les migrations actives.
- Ne jamais s'appuyer uniquement sur `src/proxy.ts` pour l'autorisation; continuer la validation par API via `getApiAuthContext` et guards metier.
- Stabiliser le snapshot UI ou le mettre a jour volontairement apres revue des changements `src/components/ui`.

Priorite P1:

- Migrer les composants generiques restants de `src/app/components/ui` vers `src/components/ui` ou les marquer explicitement comme metier.
- Extraire les fetchs navbar/sidebar en hooks caches par role.
- Transformer les pages les plus longues en assembleurs utilisant des composants feature.
- Centraliser tous les labels/statuts dans `commercialWorkflow`, `requestStatus`, `missionStatus`, `paymentWorkflow`, `workflowStatus`.
- Consolider les migrations dans une source canonique, probablement `supabase/migrations`.

Priorite P2:

- Mettre en place une cartographie automatique des routes/pages/API dans un script d'audit.
- Ajouter quelques tests visuels ou snapshots Playwright pour `/design-system/visuels` et les dashboards critiques.
- Ajouter une matrice responsive/a11y executee par sprint sur 360, 390, 768, 1280 px.

## 16. Regles pour les futures evolutions

- Reutiliser avant de creer.
- Ajouter une abstraction seulement si elle reduit une duplication reelle.
- Garder les pages comme orchestration, pas comme depot de logique metier.
- Regenerer les types Supabase avant tout changement schema.
- Toute action critique doit etre verifiee cote API, pas seulement dans l'UI ou le proxy.
- Toute nouvelle UI doit partir de `src/components/ui` ou enrichir ce socle.
- Toute nouvelle page dashboard doit avoir loading, empty, error, mobile et accessibilite clavier.
- Ne pas supprimer les composants signales inutilises sans recherche d'import, test et validation manuelle du parcours.

## 17. Conclusion

PlanetLS dispose deja d'une base forte pour continuer: les domaines metier sont presents, les tests couvrent beaucoup de logique, et un design-system interne existe. Le Sprint 1 doit servir de gel architectural: stabiliser les conventions, reduire les doubles strates, aligner Supabase/types, puis seulement ensuite construire les nouvelles evolutions.

La prochaine phase ne doit pas chercher a tout refondre. Elle doit consolider progressivement les points de passage: UI primitives, dashboard shell, workflows metier, auth API et types Supabase.
