# Design System PlanetLS

## Compositions de pages — PLS-DS-001, étape 3

Imports directs : `PageHeader/PageHeader`, `StatsCard/MetricGroup`, `StatsCard/StatsCard` et `dashboard/QuickActions/QuickActions`.

`PageHeader` expose `title`, `description`, `eyebrow`, `breadcrumb`, `quote` et `action` (contenu fourni par la page), avec `variant="plain" | "illustrated"`. Utiliser une seule fois pour le h1 de page ; une introduction de section utilise plutôt `Section` ou `CardHeader`. Le fil d’Ariane fournit ses liens, sans nav imbriquée.

`MetricGroup` accueille des enfants libres et les attributs HTML de section ; fournir un nom accessible (`aria-label` ou `aria-labelledby`). `StatsCard layout="summary"` présente valeur, libellé h2 et aide, avec une icône décorative fournie par la page. Réserver progression, tendance et tons au layout historique `standard`. Le composant ne transforme pas un zéro ou une erreur en absence de donnée.

`QuickActions variant="shortcuts"` présente des liens avec `label`, `href`, `description` et `icon` facultatifs. `showHeader={false}` masque facultativement l’introduction du bloc ; Documents/Devis la conservent. Le défaut `steps` conserve badges, étapes et état terminé. Les classes d’ajustement restent locales, sans duplication de la composition.

La référence validée est utilisée directement dans les en-têtes Documents et Devis. Ne pas imposer ce bandeau au Dashboard, à l’état du parc Logements ou aux espaces plus denses. Conserver les sections, filtres et états existants tant que leur migration n’est pas explicitement engagée.

## Layout et animations — phase 2

Utiliser les imports directs pour distinguer `layout/Section` de l’ancien composant `ui/Section` :

```tsx
import { HeroSection } from "@/components/ui/layout/HeroSection/HeroSection";
import { Section, StorySection } from "@/components/ui/layout/Section/Section";
import { ButtonLink } from "@/components/ui";

<HeroSection
  backgroundImage="/images/hero-warmv2.jpg"
  backgroundImageAlt="Un intérieur lumineux"
  title="Prenez soin de votre logement"
  animated={false}
  actions={<ButtonLink href="/parcours">Découvrir PlanetLS</ButtonLink>}
/>
<Section variant="soft" title="Une gestion plus simple">
  <p>Les informations utiles au même endroit.</p>
</Section>
```

`HeroSection` : variantes `immersive`, `centered`, `split` ; `rightContent` pour le split ; `overlay` accepte `dark`, `light`, `gold`, `none` ou un gradient CSS. `title` génère un h1 : ne pas multiplier les titres principaux d’une page. Sans `minHeight`, les règles responsive s’appliquent ; une valeur explicite les remplace. `priority` est réservé au visuel principal au-dessus de la ligne de flottaison. `children` est optionnel. `HomeHero` et `SimpleHero` sont des raccourcis.

`Section` : variantes `default`, `soft`, `muted`, `transparent`, `gold`, `green`. `title` génère un h2. `maxWidth`, `paddingY`, `paddingX`, `gap` remplacent explicitement les valeurs responsive ; sinon les styles du composant s’appliquent. `ornament` active le motif existant ou une URL personnalisée. `StorySection` reçoit `textContent`, `visualContent` et `order` (`text-first` ou `visual-first`) ; l’ordre du DOM suit l’ordre demandé, y compris sur mobile.

```tsx
import {
  useReveal,
  useStaggeredReveal,
  useParallax,
} from "@/components/ui/motion";

// Dans un composant client : appliquer ref et className sur le même élément.
const reveal = useReveal({ animation: "reveal-down" });
const cascade = useStaggeredReveal(2, 100);
const decor = useParallax(0.1);
// <div ref={reveal.ref} className={reveal.className}>Contenu</div>
// <div ref={cascade.ref} className={cascade.className}>Contenu suivant</div>
// <div ref={decor.ref} style={decor.style} aria-hidden="true">Décor</div>
```

Les reveals n’occultent pas le contenu initial. Le délai en cascade est plafonné à 2 secondes et annulé au démontage. La réduction des animations interrompt les délais et mouvements ; le parallax se limite à 48 px et aux éléments décoratifs. Les classes CSS globales sont gérées par les hooks : ne pas ajouter manuellement une classe masquant le contenu.

Validation reproductible : `npm run lint`, `npm run typecheck`, `npm run build`, puis `npx playwright test --config e2e/home-heritage.config.ts`. Cette suite vérifie le socle et la Home avec API simulées, pas les permissions d’une base réelle.

## Sources et responsabilites

- `/design-system` est l’accueil de l’atelier : liens vers les fondations, le catalogue visuel et les maquettes. `DESIGN_SYSTEM.md` porte les règles générales ; ce README sert de guide pratique des composants disponibles.
- `/design-system/visuels` est l'atelier visuel : apercus, variantes, exemples par espace et inventaire des assets. Il ne fixe pas une API differente de celle de ce document.
- `/design-system/admin-dashboard` est un prototype historique de composition admin, avec donnees fictives uniquement.
- Ce README est la documentation technique des imports, APIs publiques et regles de migration. En cas de divergence, les types TypeScript et les composants exportes sont la preuve d'implementation.
- Les nouveaux composants utilisent uniquement les tokens `--ds-*` définis dans `src/styles/tokens/tokens.css`, également disponibles via `@/styles/tokens` en TypeScript. L’organisation et les règles de contribution sont décrites dans `DESIGN_SYSTEM.md` à la racine.
- `--ui-*` et `--dash-*` sont des alias de compatibilite : ils restent en place pour les ecrans existants, mais ne doivent plus etre choisis pour un nouveau developpement.
- Polices canoniques : Cormorant Garamond/Georgia pour les titres, Inter/Segoe UI pour l’interface et le corps (`--ds-font-heading`, `--ds-font-ui`, `--ds-font-body`). Le chargement de polices reste inchangé dans ce lot.
- Icones officielles : `lucide-react`. `react-icons` reste supporte uniquement dans les ecrans non migres.

## Composants officiels

- Primitives : `Button`, `ButtonLink`, `UILink`, `Card`, `Badge`, `Input`, `Select`, `Textarea`, `Checkbox`, `Tabs`, `TabButton`, `Tag`, `Avatar`, `Loader`, `AsyncState`, `Container`, `Section`, `SectionIntro`, `SearchBar`, `DataTable` et `TableFilters`.
- Composants de repertoire : `PublicIcon`, `WorkspaceRoleIcon`, `ServiceCategoryIcon`, `ServiceCatalogPicker` et `ShowcaseFlipCard`. Ils sont officiels, mais specialises : ne pas les substituer a une primitive generique.
- Dashboard réutilisable : `DashboardMetricCard`, `DashboardStatusBadge`, `DashboardEmptyState` et `DashboardSection` vivent dans `src/components/ui/dashboard/saas/`. Les anciens chemins `src/app/components/dashboard/saas/` les réexportent pour compatibilité. `UnifiedRoleDashboard` reste dans `src/app/components/dashboard/unified/UnifiedRoleDashboard.tsx`.
- Tables disponibles : `src/components/ui/DataTable/DataTable.tsx` et `src/components/ui/TableFilters/TableFilters.tsx`, exportés par `@/components/ui` ; contrat pratique détaillé ci-dessous.
- `Alert` est disponible dans le code local sous `src/components/ui/Alert`, exporté par `@/components/ui`. API : `tone` (`info | success | warning | danger`), `title`, `children`, `action`, `announcement` (`off | polite | assertive`) et `className`. Les états explicites d’`AsyncState` le réutilisent.
- `DashboardCockpit` (lot D) reste seulement proposé et indisponible ; son contrat cible est décrit dans `DESIGN_SYSTEM.md`.
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
- Layout actif : `src/app/dashboard/layout.tsx` compose la navigation existante, notamment `src/app/components/dashboard/Sidebar/Sidebar.tsx`. Le composant distinct `src/components/dashboard/DashboardLayout/DashboardLayout.tsx` ne doit pas lui être substitué automatiquement. La composition des dashboards réels reste `UnifiedRoleDashboard`.
- Etats asynchrones : `AsyncState` est le composant officiel pour les etats loading, vide et erreur. Le contenu doit rester specifique au contexte metier ; ne pas masquer une erreur serveur sous un etat vide.
- Alertes et confirmations : reutiliser `Badge` pour le niveau de severite et les composants de dialogue deja presents dans le parcours concerne. Il n'existe pas encore de modale generique officielle dans `src/components/ui`.
- Filtres et pagination : `TableFilters` est disponible pour composer les contrôles, le compteur et la réinitialisation ; `Select`, `Tabs` ou `TabButton` peuvent fournir ces contrôles. Aucune pagination générique n’est publiée ; recherche, tri, pagination et filtres métier restent pilotés par le parcours.
- Responsive : les tableaux conservent un conteneur a defilement horizontal sur mobile. Les grilles de KPI passent a une colonne ou deux selon la largeur, sans masquer les informations prioritaires.
- Table + filtres : `DataTable` fournit caption, colonnes, identifiants de lignes, alignement et action principale. `TableFilters` recoit des controles composes par la page et affiche resultats, filtres actifs et reinitialisation. Recherche, periode, tri, pagination et selection sont optionnels et restent pilotes par le parcours metier.
- Table responsive : le defilement horizontal est la regle par defaut pour preserver colonnes et actions. Le mode `responsiveStrategy="cards"` est une exception documentee, reservee aux listes dont chaque ligne peut etre comprise sans l'alignement de colonnes.
- Exemples reels : proprietaire (`/dashboard/owner`), concierge (`/dashboard/concierge`) et artisan (`/dashboard/provider`) restent les sources de comportement. Les prototypes sous `/design-system/*` ne sont jamais des preuves de flux metier.

## Regles visuelles figees

- Card `small`: largeur max 320px, usage map/suggestions/resultats compacts.
- Card `large`: largeur max 520px, usage profils/resultats detailles.
- Avatars: `sm` 32px, `md` 48px, `lg` 72px.
- Loader: `sm` 20px, `md` 32px, `lg` 48px.
- Espacements : utiliser `--ds-space-*` pour les nouveaux styles ; `--ui-space-*` reste un alias de compatibilité.
- Layout page: `Container` pour la largeur, `Section` pour le rythme vertical.
- Badges statuts: `Badge`.
- Labels/categories: `Tag`.
- Actions UI: `Button`, `ButtonLink` ou `UILink`.
- Champs saisie: `Input | Select | Textarea | Checkbox`.
- Recherche simple: `SearchBar`.

## Variants autorises

- `Button` et `ButtonLink` : `primary | secondary | outline | ghost | danger | success | paper | dark`. Primaire vert, secondaire neutre bordé, ghost discret, danger rouge, succès pour une confirmation positive ; les trois variantes historiques restent disponibles. Toutes les couleurs sont pilotées par `--ds-action-*` dans `tokens.css`.
- `Container` : `compact` 1220 px, `standard` 1280 px, `large` 1400 px. Compatibilité : `sm` 640 px, `md` 840 px, `lg` 1120 px (défaut inchangé), `xl` alias standard, `full` sans plafond. Choisir le rythme interne séparément via `Section` ; ne pas assimiler densité et largeur.
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
- Documentés mais spécialisés : `DashboardMetricCard`, `DashboardStatusBadge` et `DashboardEmptyState` vivent dans `src/components/ui/dashboard/saas/` ; ils restent les composants cibles des dashboards, distincts des primitives de `@/components/ui`.
- Contrat table disponible : `DataTable` et `TableFilters` sont montrés dans les démonstrations. Leur présence ne signifie pas que les tableaux et filtres des pages métier ont été migrés. Modales, confirmations et pagination restent des implémentations de parcours.

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
- Étape 5 : ce bilan décrit la migration historique ; les règles générales actuelles sont maintenues dans `DESIGN_SYSTEM.md` et les API disponibles dans ce README.

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
