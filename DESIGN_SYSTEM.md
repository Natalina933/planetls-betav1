# Design System PlanetLS

## Compositions communes — 14 septembre 2026

L’étape 3 de `PLS-DS-001` mutualise les structures effectivement identiques de Documents et Devis Propriétaire : bandeau, quatre indicateurs et deux raccourcis. Le Dashboard conserve ses indicateurs verticaux, son agenda et ses actions prioritaires ; Logements conserve son état du parc et ses cartes métier.

- `PageHeader/PageHeader` : titre de page, description, surtitre, fil d’Ariane, citation et emplacement d’action. Variante sobre `plain` par défaut ; `illustrated` reprend le bandeau Propriétaire existant.
- `StatsCard/MetricGroup` : grille de composition sans calcul, quatre colonnes puis deux sous 1100 px. La page fournit un `aria-label` et ses cartes.
- `StatsCard` : variante `layout="summary"` horizontale pour Documents/Devis ; le rendu `standard`, ses tons et sa progression restent compatibles. La page décide des valeurs, des zéros, du chargement et des erreurs.
- `dashboard/QuickActions/QuickActions` : variante `shortcuts` avec liens `ButtonLink`, description et icône facultative ; le parcours guidé `steps` reste le défaut.
- Les classes locales ne gardent que les écarts de Documents : titre 22ch, chiffres et icônes légèrement plus grands, raccourcis de 74 px et padding mobile. Les seuils responsive et contenus existants sont conservés.
- Pour la suite, réutiliser `Section`, `CardHeader/CardFooter`, `TableFilters`, `DataTable`, `AsyncState` et `Alert`. Les filtres instantanés Documents et les filtres appliqués Devis ne partagent pas leur logique. Leurs tableaux/cartes, regroupements, états et modales ne sont pas migrés dans cette étape.

## Fondations consolidées — 14 septembre 2026

La référence principale est l’espace Propriétaire retravaillé. Ce lot consolide le socle CSS/SCSS sans migrer les pages ni modifier leurs contrats métier. Le pilote Concierge décrit dans les notes du 7 septembre est historique.

- `tokens.css` reste la source canonique : palette, backgrounds, états, bordures, rayons, ombres, typographie, espacements et conteneurs. Les façades Sass et alias historiques nécessaires restent compatibles. La palette locale de la fiche logement n’est pas remplacée globalement.
- Actions : `primary` vert, `secondary` neutre bordé, `ghost` discret, `danger` rouge et `success` vert de confirmation. `outline`, `paper` et `dark` restent disponibles avec leurs ornements de thème. Les couleurs viennent de `--ds-action-*`, recalculés aux frontières de thème/dashboard. Le nom historique `--ds-color-primary` garde ses valeurs (laiton public, vert dashboard) ; ne pas le recolorer globalement pour changer les actions.
- Conteneurs : `compact` 1220 px, `standard` 1280 px et `large` 1400 px. La densité concerne les espacements internes. `Container` conserve son défaut `lg` 1120 px et les tailles `sm` 640, `md` 840, `xl` 1280 et `full`. `--ds-layout-max-width` et `--ds-layout-content` référencent `--ds-container-standard`. Les pages locales à 1400 px seront raccordées au token lors de leur lot, sans remplacement massif.
- Typographie : Cormorant Garamond/Georgia pour les titres, Inter/Segoe UI pour l’interface et le corps. Aucun changement du chargement des polices. Les rôles `--ds-text-page-title`, `--ds-text-section-title`, `--ds-text-section-display`, `--ds-text-subtitle` et `--ds-text-secondary` reprennent les dimensions existantes ; les titres Propriétaire locaux restent inchangés.
- Rythme : `--ds-space-container-inline`, `--ds-space-section-stack` et les espacements de section `compact/standard/spacious` nomment les valeurs existantes. `Section` et la typographie globale les consomment sans nouvelle marge globale.
- Nettoyage : six feuilles sans référence retirées ; neuf suffixes invalides accolés à `var(--dash-bg-panel)` corrigés. Les références DS manquantes sont complétées, les doublons de déclaration supprimés en conservant la valeur effective. `components.json`, `cn` et `tailwind-merge` restent hors suppression dans ce lot ; aucune dépendance ajoutée ou retirée.

## Socle de la phase 2 — 9 septembre 2026

Le périmètre courant comprend les tokens, `layout/HeroSection`, `layout/Section`, les hooks de mouvement et leur documentation. La Home réutilise ces composants ; les autres pages migrent progressivement. Les démonstrations sont accessibles dans `/design-system/fondations`, volet **Sections partagées et animations**.

- Palette canonique : crème `--ds-color-background`, surfaces `--ds-color-surface*`, laiton `--ds-color-primary` comme accent et vert `--ds-color-accent`. Les alias `--home-*` référencent les tokens DS ; les surcharges des thèmes restent locales. `--ds-color-text-muted` et le sauge servent aux usages décoratifs ou doivent être contrôlés sur leur fond ; ils ne constituent pas une garantie de contraste AA pour du petit texte.
- Espacements : `--ds-space-0` à `--ds-space-10` correspondent à 0, 4, 8, 12, 16, 24, 32, 48, 64, 96 et 128 px avec une racine de 16 px. Les exports `spacing` couvrent toute l’échelle, sans dupliquer les valeurs CSS.
- Mouvement : 160/320/700 ms (`fast`, `normal`, `slow`), easing `--ds-ease-premium`. L’export `motion` fournit les références CSS. Le hero de la Home reste non animé pour afficher son contenu immédiatement.
- `useReveal` anime une seule entrée ; le HTML reste visible avant hydratation, sans JavaScript ou sans IntersectionObserver. `useStaggeredReveal` partage ce comportement et annule son délai au démontage. `reveal-down`, `reveal-up`, `fade` et `scale` sont disponibles.
- `useParallax` est réservé aux décors : vitesse entre 0 et 1, déplacement plafonné à 48 px, écoute passive et mesures regroupées par frame. Il ne doit pas déplacer un texte, un formulaire ou un CTA. Un changement de `prefers-reduced-motion` arrête le mouvement et remet le décalage à zéro.
- Les ornements sont décoratifs (`alt=""`) ; leur animation est finie. Les réglages d’accessibilité du système sont prioritaires sur les effets visuels.

Les contrats détaillés et exemples d’import sont dans `src/components/ui/README.md`. Une validation technique ne vaut pas certification WCAG ni mesure des Core Web Vitals en production. La migration des polices vers `next/font` et l’optimisation globale des anciens assets ne sont pas incluses dans ce socle ; elles restent à évaluer séparément pour éviter de modifier tous les écrans.

L’atelier possède une seule entrée : `/design-system`. La barre latérale admin **Design & maquettes** y conduit via `/dashboard/admin/design`, qui conserve sa garde admin avant redirection. L’atelier reste une bibliothèque de démonstration publique, sans données privées.

## Navigation

| Page                                                        | Contenu                                                                      |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `/design-system`                                            | Accueil court : trois rubriques                                              |
| `/design-system/fondations`                                 | Palette, typographies, espacements, primitives et exemple Art déco repliable |
| `/design-system/visuels`                                    | Sept rubriques repliables de composants, illustrations et références         |
| `/design-system/dashboards`                                 | Comparaison des quatre maquettes                                             |
| `/design-system/trajets`                                    | Prototype concierge de tournée, trajets, progression et optimisation fictive |
| `/design-system/{admin,owner,concierge,provider}-dashboard` | Maquettes interactives : données fictives, aucun enregistrement              |

Les adresses antérieures des maquettes sont conservées. Le layout partage une seule navigation, avec menu mobile et indication de la page active. Le bandeau public et la carte de recherche ne sont pas montés dans l’atelier.

Les idées Art déco reprises dans les quatre maquettes utilisent un rendu partagé, `app/design-system/_dashboards/RoleFollowUp.tsx`, et des contenus par rôle dans `roleFollowUpData.ts`. Modifier les styles communs une seule fois ; modifier les fixtures du rôle concerné pour ses parcours, offres, preuves attendues et échanges contextualisés. Le propriétaire compare des prestations ; le concierge prépare ses passages ; le prestataire précise ses devis et comptes rendus ; l’administrateur examine les dossiers et traces de décision. Les boutons changent un aperçu ou affichent un retour de simulation, sans envoi ni sauvegarde.

Le prototype `/design-system/trajets` utilise des fixtures dédiées dans `src/app/design-system/trajets/routeTourData.ts`. Sa carte est un mock visuel sans API ni géolocalisation réelle ; la page teste l’état principal, quatre KPI, la progression, une timeline, les retards, l’ordre optimisé et les vues Tournée/Planning. Elle ne remplace aucune page métier et ne lit ni n’écrit Supabase.

## Architecture

PlanetLS possède déjà un Design System substantiel. L’architecture validée le 7 septembre 2026 vise son harmonisation progressive, avec le dashboard Concierge comme pilote ; elle ne demande ni reconstruction ni nouvelle bibliothèque UI.

| Source                                                          | Responsabilité                                                                                                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/styles/tokens/tokens.css`                                  | Source de vérité des tokens modernes `--ds-*` : couleurs sémantiques, typographie, espacements, rayons, ombres, dimensions, focus et transitions             |
| Modules TypeScript de `src/styles/tokens/`                      | Exposent les variables CSS sans recopier leurs valeurs                                                                                                       |
| Sass legacy et anciens thèmes                                   | Compatibilité ; conserver les imports, l’ordre de chargement et les thèmes existants. Les breakpoints restent dans la table Sass de `_legacy-variables.scss` |
| `src/styles/tokens/profileVisualKit.ts`                         | Références visuelles et illustrations de démonstration, pas une deuxième source de tokens. Ses couleurs locales restent à harmoniser                         |
| `src/components/ui/`                                            | Primitives génériques disponibles, alimentées par leurs props                                                                                                |
| `src/components/ui/dashboard/`                                  | Composants partagés de présentation des dashboards                                                                                                           |
| `src/app/components/dashboard/unified/UnifiedRoleDashboard.tsx` | Composition partagée des dashboards réels, conservée avec compatibilité des consommateurs                                                                    |
| Pages Design System et prototypes                               | Documentation des vrais composants et compositions avec fixtures explicites, sans preuve de fonctionnement métier                                            |
| Pages, hooks et services métier                                 | Données, calculs, sélection des priorités, permissions et actions persistantes                                                                               |

Les valeurs locales des pages, les palettes de `profileVisualKit.ts` et les valeurs Sass historiques restent des sources concurrentes à faire converger progressivement. Leur présence dans des dossiers centralisés ne signifie pas que leur harmonisation graphique est terminée.

```text
src/app/design-system/
  layout.tsx                  # Navigation commune
  _components/                # Navigation et compositions de démonstration
  _dashboards/                # Cadre, états et données fictives des maquettes
  fondations/                 # Documentation visuelle du socle
  visuels/                    # Bibliothèque de références
  dashboards/                 # Comparaison
  *-dashboard/                # Quatre prototypes
src/app/{admin,owner,concierge,provider}/
  page.tsx                    # Alias vers le dashboard protégé existant
  dashboard/page.tsx          # Même alias, sans duplication d’écran
src/app/dashboard/            # Parcours canoniques et protections existantes
src/components/ui/            # Primitives génériques
  dashboard/                  # Présentation partagée : cartes, activité, jauges
  WorkflowStatusBadge/        # Présentation d’un statut
src/components/features/
  provider/ProviderDashboard.tsx # Composition du vrai écran prestataire
src/styles/tokens/
  tokens.css                  # Valeurs --ds-* et alias CSS historiques
  colors.ts, spacing.ts       # Références typées aux variables CSS
  typography.ts, shadows.ts
  index.ts                    # API publique TypeScript
  profileVisualKit.ts         # Références visuelles des profils
  _legacy-variables.scss      # Variables Sass historiques conservées
  _legacy-root.scss           # Anciennes propriétés CSS
  themes/                    # Variantes et tokens Sass des thèmes
```

`components/ui` reçoit des données via ses props et n’effectue pas de chargement métier. Les fonctions de présentation existantes (libellés de statuts, niveaux de cadence) sont conservées. Les anciens chemins des composants partagés réexportent leur unique implémentation UI pour éviter de casser les consommateurs. Les anciens fichiers de variables SCSS font seulement `@forward` vers les sources centralisées ; l’ordre de chargement des thèmes est conservé.

Le vrai écran prestataire est extrait dans `components/features/provider`, avec son hook de données et ses styles existants toujours sous `app/dashboard/provider`. Les autres compositions métier restent à leur emplacement actuel : lors de leur prochaine évolution, extraire leur présentation vers `components/features/admin`, `owner` ou `concierge`, en laissant les permissions et chargements serveur dans le parcours canonique. Aucun second dashboard réel n’est créé.

## Ajouter un token

Définir la valeur une seule fois dans `src/styles/tokens/tokens.css`, sous un nom sémantique `--ds-*`, avec ses éventuelles surcharges de thème dans ce même fichier, puis une référence `var(--ds-...)` dans le module TypeScript correspondant. `tokens/themes` conserve les thèmes Sass historiques sans devenir une seconde définition des nouveaux tokens modernes. Les exports TS ne recopient pas les valeurs hexadécimales : ils suivent ainsi le thème et les réglages d’accessibilité actifs.

```tsx
import { colors, spacing, typography } from "@/styles/tokens";

<div
  style={{
    color: colors.textPrimary,
    gap: spacing[4],
    fontFamily: typography.body,
  }}
/>;
```

En SCSS : `padding: var(--ds-space-4); color: var(--ds-color-text-primary);`. Les tokens CSS ne s’utilisent pas comme nombres pour les calculs JavaScript ou les media queries. Conserver les breakpoints Sass centralisés pour ces dernières. Le projet utilise SCSS ; aucun système Tailwind supplémentaire n’est ajouté.

**Pas de variable en dur, tout passe par les tokens** pour les nouveaux styles partagés. Les anciens styles de pages contiennent encore des valeurs locales : les harmoniser au fil des refontes, après comparaison visuelle, plutôt que modifier silencieusement toutes les apparences. Les palettes historiques distinctes sont identifiées comme compatibilité ; cette réorganisation ne prétend pas terminer leur convergence graphique.

## Ajouter un composant

`src/components/ui/ArtDecoWorkspace/ArtDecoWorkspace.tsx` contient les blocs partagés `ArtDecoLiveDashboard`, `ArtDecoSmartSearch` et `ArtDecoQuotes`. L’exemple des fondations utilise les mêmes composants que les maquettes. Les résultats de recherche et les propositions de devis propres à chaque rôle se modifient dans `app/design-system/_dashboards/roleWorkspaceData.ts`. La recherche filtre uniquement ces fixtures ; les repères sont illustratifs et les actions de devis restent des prévisualisations sans sauvegarde.

Le planning visuel de l’exemple Art déco et des quatre maquettes utilise `src/components/ui/ArtDecoTimeline/ArtDecoTimeline.tsx`. Les props décrivent les repères, intitulés, statuts et détails propres au rôle. Son SCSS et les tokens `--ds-artdeco-*` définissent le rendu commun : modifier cette source plutôt que recopier un planning dans chaque page.

Le titre de présentation « Une plateforme premium pour orchestrer la location saisonnière » est défini une seule fois par `PLATFORM_HEADLINE_TEXT` dans `src/components/ui/PlatformHeadline/PlatformHeadline.tsx`. Réutiliser `<PlatformHeadline />` (h2 par défaut, prop `as` pour adapter le niveau) pour partager texte et rendu entre pages. Modifier `--ds-text-platform-headline` dans `tokens.css` pour sa taille commune. Ne pas recopier le texte ni ajouter de surcharge locale de taille.

Avant de créer une primitive, chercher dans `components/ui` et réutiliser Button, Card, Input, DataTable, etc. Une nouvelle primitive reçoit des props typées, ses styles utilisent les tokens, et ses états clavier, chargement, vide et erreur sont démontrés dans l’atelier. Ajouter son export public et sa documentation dans `src/components/ui/README.md`.

Pour une composition métier, utiliser `components/features/<rôle>` et composer les primitives UI. Garder les accès aux données, autorisations et transitions dans les hooks/services existants. La page canonique peut devenir un simple point de composition, comme `app/dashboard/provider/page.tsx`. Ne jamais importer `components/features`, une route métier ou un client API depuis `app/design-system`. Les démos utilisent leurs propres fixtures ; la bibliothèque d’icônes lit seulement des assets et catalogues SQL statiques du dépôt.

## Conventions de nommage

Pour les nouveaux contrats de présentation :

| Identifiant technique | Libellé français                         |
| --------------------- | ---------------------------------------- |
| `admin`               | Administrateur                           |
| `concierge`           | Concierge ou Conciergerie                |
| `owner`               | Propriétaire                             |
| `provider`            | Artisan ou Prestataire selon le contexte |

Les identifiants techniques ne sont pas traduits. Aucun renommage global n’est engagé : `artisan` peut rester un alias historique temporaire, notamment dans `UnifiedRoleDashboard`. Une adaptation à la frontière de présentation préservera les consommateurs existants ; aucune traduction ne doit modifier les rôles, permissions, routes, API ou clés persistées.

Les quatre espaces partagent le même socle. Les variantes portent sur la densité, la hiérarchie, les composants utiles et quelques accents sémantiques : admin structuré et dense, concierge opérationnel, propriétaire pédagogique, artisan lisible sur mobile. Un profil n’impose pas un thème distinct ; succès, attention et erreur conservent le même sens.

## Contrat cible du cockpit — non implémenté dans le lot A

Règle de la première zone : **« 1 urgence réelle ou état calme + 4 KPI maximum + 1 action principale »**. Ordre cible : en-tête court avec date et contexte, situation prioritaire, KPI, action principale, puis sections métier. Sur ordinateur, l’action peut être adjacente à la priorité ; l’ordre de lecture et de tabulation reste cohérent.

`Alert` est disponible dans le code local sous `src/components/ui/Alert`, exporté par `@/components/ui` et utilisé par les états explicites d’`AsyncState`. `DashboardCockpit` reste seulement proposé pour le lot D et n’est pas implémenté. Le cockpit composera les primitives et cartes KPI existantes, avec rôle, densité, en-tête, état explicite, priorité fournie, jusqu’à quatre KPI identifiés et une action principale. Une date de mise à jour n’est affichée que si elle est connue ; les démonstrations signalent leurs fixtures.

| État cible    | Condition et présentation                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `loading`     | Récupération en cours ; aucune affirmation sur l’absence d’urgence                              |
| `error`       | Échec technique connu empêchant de conclure ; expliquer l’indisponibilité                       |
| `empty`       | Chargement réussi, mais aucune donnée pour constituer le cockpit ; proposer un démarrage adapté |
| `calm`        | Sources nécessaires disponibles et absence d’urgence établie par la couche métier               |
| `urgent`      | Une urgence réelle sélectionnée par la couche métier, avec contexte et action                   |
| `unavailable` | Fiabilité ou couverture inconnue ; annoncer une situation non vérifiable                        |

Zéro est une valeur valide à afficher, avec son libellé. Une valeur inconnue n’est pas égale à zéro : afficher « Indisponible » ou « — ». Une erreur technique ne doit jamais devenir silencieusement un état calme. Une alerte métier décrit une situation à traiter ; une erreur technique décrit une impossibilité de connaître la situation. Une urgence connue peut rester visible si une autre source échoue, avec une indication de couverture partielle.

Le composant de présentation ne sélectionne pas lui-même l’urgence : calculs, priorités et choix d’action restent métier. Les erreurs masquées du hook Concierge, le filtrage du planning après limitation et la provenance des arrivées/départs relèvent de lots métier séparés. Tant que les données ne permettent pas de certifier le calme, utiliser un état non vérifiable. Préserver widgets, bibliothèque vidéo et persistance pendant le lot visuel.

## Responsive et accessibilité — critères des lots futurs

Valider à **1600, 1366, 768 et 390 px** : ordre de lecture cohérent, navigation clavier, focus visible, statuts compréhensibles sans dépendre seulement de la couleur et zones tactiles principales d’au moins 44 px. Adapter les KPI sur une à quatre colonnes selon leur lisibilité, garder l’action proche de la priorité sur mobile et éviter tout débordement horizontal général ; le tableau peut défiler dans son propre conteneur. Respecter `prefers-reduced-motion`, y compris pour les déplacements non essentiels. Ces critères ne constituent pas une validation déjà obtenue du futur pilote.

## Migration progressive validée le 7 septembre 2026

Le lot A porte uniquement sur la documentation et les conventions. Cette planification décrit les lots envisagés à l’issue du lot A. Depuis, `Alert` et les états explicites d’`AsyncState` du lot C existent dans les modifications locales ; cela ne vaut pas achèvement des autres lots.

| Lot futur | Périmètre et dépendance                                                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| B         | Tokens et remplacement ciblé des valeurs locales, après A ; aucune migration globale des thèmes                                               |
| C         | États partagés et primitive `Alert` présents dans les modifications locales, avec `AsyncState` ; généralisation métier non déclarée terminée  |
| D         | Composant proposé `DashboardCockpit` dans le prototype Concierge, après B et C                                                                |
| E         | Intégration optionnelle au dashboard Concierge réel après validation de D, sans changer la logique métier ; fiabilité des sources à qualifier |
| F         | Validation responsive et accessibilité complète du pilote, en complément des contrôles visuels de chaque lot                                  |
| G         | Propagation aux autres espaces un par un, après acceptation du pilote                                                                         |

Conserver les comportements existants par défaut pour permettre un retour arrière du pilote sans affecter les autres espaces. Les corrections de planning, réservations et remontée d’erreurs restent séparées ; elles peuvent conditionner la validation opérationnelle complète, même si la présentation est prête.

## Vérifier

Pour un lot exclusivement documentaire : vérifier l’encodage, `git diff --check`, le périmètre des fichiers et les validateurs du Master Plan si celui-ci change. Les commandes applicatives ci-dessous concernent les lots de code ; aucun build complet n’est requis pour le lot A.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
$env:PROTOTYPE_BROWSER_CHANNEL = 'msedge'
npx.cmd playwright test --config e2e/dashboard-prototypes.config.ts
```

Les tests navigateur utilisent le serveur déjà ouvert sur `127.0.0.1:3000`, sans compte ni mutation. Ils contrôlent la navigation, les alias, les quatre résolutions, les états de démonstration et les interactions. `src/tests/design-architecture.test.mts` contrôle les imports directs des démos et la résolution des tokens. Un build isolé peut utiliser `NEXT_DIST_DIR` ; exécuter ensuite `npx.cmd next typegen` avec le répertoire habituel pour remettre les types de routes générés en cohérence avec le serveur local.
