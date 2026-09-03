# Design System PlanetLS - Phase 1

## Sources et responsabilites

- `/design-system` est le referentiel officiel : regles, tokens, composants cibles et liens vers les catalogues.
- `/design-system/visuels` est l'atelier visuel : apercus, variantes, exemples par espace et inventaire des assets. Il ne fixe pas une API differente de celle de ce document.
- `/design-system/admin-dashboard` est un prototype historique de composition admin, avec donnees fictives uniquement.
- Ce README est la documentation technique des imports, APIs publiques et regles de migration. En cas de divergence, les types TypeScript et les composants exportes sont la preuve d'implementation.
- Les nouveaux composants utilisent uniquement les tokens `--ds-*` definis dans `src/app/styles/abstracts/variables.css`.
- `--ui-*` et `--dash-*` sont des alias de compatibilite : ils restent en place pour les ecrans existants, mais ne doivent plus etre choisis pour un nouveau developpement.
- Police cible : `Montserrat` pour l'interface et `Open Sans` pour le contenu. `next/font` est la methode a adopter lors d'un lot dedie de chargement de polices ; aucune migration massive n'est incluse dans la Phase 1.
- Icones officielles : `lucide-react`. `react-icons` reste supporte uniquement dans les ecrans non migres.

## Composants officiels

- Primitives : `Button`, `ButtonLink`, `UILink`, `Card`, `Badge`, `Input`, `Select`, `Textarea`, `Checkbox`, `Tabs`, `TabButton`, `Tag`, `Avatar`, `Loader`, `AsyncState`, `Container`, `Section`, `SectionIntro`, `SearchBar`, `DataTable` et `TableFilters`.
- Composants de repertoire : `PublicIcon`, `WorkspaceRoleIcon`, `ServiceCategoryIcon`, `ServiceCatalogPicker` et `ShowcaseFlipCard`. Ils sont officiels, mais specialises : ne pas les substituer a une primitive generique.
- Dashboard reutilisable : `DashboardMetricCard`, `DashboardStatusBadge`, `DashboardEmptyState` et `UnifiedRoleDashboard` sous `src/app/components/dashboard`.
- Statuts : utiliser `Badge` avec `success | warning | danger | info | neutral` pour un nouvel etat visuel. `gold`, `dark` et `progress` sont des variantes de presentation existantes ; `progress` est utilise par l'atelier visuel et ne porte pas de statut metier. Les badges metier gardent leur mapping existant vers ces variantes.
- KPI : `DashboardMetricCard` devient la cible pour les nouveaux dashboards. `StatsCard` reste officiel hors dashboard lorsque son progress/hint est utile.

## A fusionner progressivement

- `DashboardStatusBadge`, `WorkflowStatusBadge`, `RequestStatusBadge`, `StatusBadge` et les variantes admin restent specialises tant qu'ils portent une logique metier. Leur rendu doit converger vers `Badge` lors des lots metier concernes.
- `DashboardMetricCard`, `StatsCard`, `StatCard` et les cartes locales seront revus pendant les futures refontes de dashboard ; aucune substitution globale ne doit etre faite ici.
- `DashboardEmptyState` et `features/shared/EmptyState` doivent converger vers une API commune avant tout remplacement.

## Legacy / deprecie pour les nouveaux ecrans

- Les styles et tokens `--color-*`, `--spacing-*`, `--radius-*`, `--ui-*` et `--dash-*` ne sont plus des choix de depart pour un nouveau composant.
- Les composants ou styles locaux qui recreent bouton, carte, badge, champ, tableau, topbar ou sidebar sont a eviter pour les nouvelles pages.
- `components.json`, `tailwind-merge` et `src/app/lib/utils.ts` sont des reliques shadcn/Tailwind a auditer dans un lot separe. Ne pas les supprimer sans verifier les imports.

## Regles d'usage

- Tables : en-tete explicite, statut via badge semantique, actions regroupees, etats loading/empty, defilement horizontal sur mobile et pagination seulement au-dela d'un volume justifie.
- Formulaires : label visible, aide ou erreur proche du champ, focus visible, etat disabled lisible et zone cliquable d'au moins 44px quand applicable.
- Layout cible : `DashboardLayout` compose `Sidebar`, `Topbar`, `PageHeader`, `MainContent` et, sur mobile, une navigation adaptee. Les implementations actuelles restent en place jusqu'a leur lot de migration.
- Etats asynchrones : `AsyncState` est le composant officiel pour les etats loading, vide et erreur. Le contenu doit rester specifique au contexte metier ; ne pas masquer une erreur serveur sous un etat vide.
- Alertes et confirmations : reutiliser `Badge` pour le niveau de severite et les composants de dialogue deja presents dans le parcours concerne. Il n'existe pas encore de modale generique officielle dans `src/components/ui`.
- Filtres et pagination : `Select`, `Tabs` ou `TabButton` servent de primitives. Aucun composant de filtre ou de pagination generique n'est officiellement publie ; conserver les implementations metier jusqu'a un lot dedie.
- Responsive : les tableaux conservent un conteneur a defilement horizontal sur mobile. Les grilles de KPI passent a une colonne ou deux selon la largeur, sans masquer les informations prioritaires.
- Table + filtres : `DataTable` fournit caption, colonnes, identifiants de lignes, alignement et action principale. `TableFilters` recoit des controles composes par la page et affiche resultats, filtres actifs et reinitialisation. Recherche, periode, tri, pagination et selection sont optionnels et restent pilotes par le parcours metier.
- Table responsive : le defilement horizontal est la regle par defaut pour preserver colonnes et actions. Le mode `responsiveStrategy="cards"` est une exception documentee, reservee aux listes dont chaque ligne peut etre comprise sans l'alignement de colonnes.
- Exemples reels : proprietaire (`/dashboard/owner`), concierge (`/dashboard/concierge`) et artisan (`/dashboard/provider`) restent les sources de comportement. Les prototypes sous `/design-system/*` ne sont jamais des preuves de flux metier.

## Regles visuelles figees

- Card `small`: largeur max 320px, usage map/suggestions/resultats compacts.
- Card `large`: largeur max 520px, usage profils/resultats detailles.
- Avatars: `sm` 32px, `md` 48px, `lg` 72px.
- Loader: `sm` 20px, `md` 32px, `lg` 48px.
- Espacements: utiliser uniquement `--ui-space-*` ou `--ds-space-*`.
- Layout page: `Container` pour la largeur, `Section` pour le rythme vertical.
- Badges statuts: `Badge`.
- Labels/categories: `Tag`.
- Actions UI: `Button`, `ButtonLink` ou `UILink`.
- Champs saisie: `Input | Select | Textarea | Checkbox`.
- Recherche simple: `SearchBar`.

## Variants autorises

- `Button`: `primary | secondary | outline | ghost | paper | dark`
- `Badge`: `neutral | gold | dark | success | warning | danger | info | progress`
- `Tag`: `default | category | status`
- `Card`: sizes `small | large`, tones `elevated | outlined | soft | dark`
- `Tabs`: `Tabs | TabsList | TabsTrigger | TabsContent`
- `Loader`: `sm | md | lg`
- `Input | Select | Textarea`: `default | soft | dark`
- `Checkbox`: sans variant (version de base DS)
- `DataTable`: colonnes typees, lignes avec identifiant stable, action principale optionnelle, `scroll | cards` sur mobile
- `TableFilters`: controles enfants, compteur de resultats, nombre de filtres actifs, reinitialisation optionnelle

## Couverture connue

- Documentes et utilises : les primitives exportees par `@/components/ui`, dont `AsyncState` pour loading/vide/erreur et `StatsCard` pour les KPI hors dashboard.
- Documentes mais specialises : `DashboardMetricCard`, `DashboardStatusBadge` et `DashboardEmptyState` vivent sous `src/app/components/dashboard` ; ils restent cibles pour les dashboards, mais ne sont pas des primitives de `@/components/ui`.
- Utilises mais non generalises : les tableaux, filtres metier, modales, confirmations et pagination restent des implementations de parcours. Leur API ne doit pas etre copiee comme standard sans lot de consolidation.

## Interdictions

- Pas de nouvelle primitive dans `src/app/components/common/*`.
- Pas de style inline pour boutons/cartes/badges/inputs/tags/avatars.
- Pas de nouveaux variants locaux hors `src/components/ui/*`.

## Mapping migration

- `common/Cards/Card` -> `ui/Card`
- `common/Badge` -> `ui/Badge`
- `common/Avatar` -> `ui/Avatar`
- `common/Inputs/Input` -> `ui/Input`
- `common/Buttons/*` -> `ui/Button` ou `ui/ButtonLink`
- `common/Loader/*` -> `ui/Loader`
- `input[type="checkbox"]` local -> `ui/Checkbox`
- `select` local -> `ui/Select`
- `textarea` local -> `ui/Textarea`

## Statut migration (frozen)

- Etape 1: primitives `common/*` remplacees sur pages trafic prioritaire (`Home`, `Owner Concierges`, `MapWithList`).
- Etape 2: styles inline retires pour primitives boutons/cartes/badges/inputs dans ces zones.
- Etape 3: variants centralises dans `src/components/ui/*`.
- Etape 4: anciens composants `src/app/components/common/*` supprimes (aucun import restant).
- Etape 5: ce document est la reference figee des regles UI.

## Import

```ts
import {
  Button,
  ButtonLink,
  UILink,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Tag,
  Avatar,
  Container,
  Section,
  Input,
  Select,
  Textarea,
  Checkbox,
  SearchBar,
  Loader,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";
```
