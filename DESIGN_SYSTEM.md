# Design System PlanetLS

L’atelier possède une seule entrée : `/design-system`. La barre latérale admin **Design & maquettes** y conduit via `/dashboard/admin/design`, qui conserve sa garde admin avant redirection. L’atelier reste une bibliothèque de démonstration publique, sans données privées.

## Navigation

| Page | Contenu |
| --- | --- |
| `/design-system` | Accueil court : trois rubriques |
| `/design-system/fondations` | Palette, typographies, espacements, primitives et exemple Art déco repliable |
| `/design-system/visuels` | Sept rubriques repliables de composants, illustrations et références |
| `/design-system/dashboards` | Comparaison des quatre maquettes |
| `/design-system/{admin,owner,concierge,provider}-dashboard` | Maquettes interactives : données fictives, aucun enregistrement |

Les adresses antérieures des maquettes sont conservées. Le layout partage une seule navigation, avec menu mobile et indication de la page active. Le bandeau public et la carte de recherche ne sont pas montés dans l’atelier.

Les idées Art déco reprises dans les quatre maquettes utilisent un rendu partagé, `app/design-system/_dashboards/RoleFollowUp.tsx`, et des contenus par rôle dans `roleFollowUpData.ts`. Modifier les styles communs une seule fois ; modifier les fixtures du rôle concerné pour ses parcours, offres, preuves attendues et échanges contextualisés. Le propriétaire compare des prestations ; le concierge prépare ses passages ; le prestataire précise ses devis et comptes rendus ; l’administrateur examine les dossiers et traces de décision. Les boutons changent un aperçu ou affichent un retour de simulation, sans envoi ni sauvegarde.

## Architecture

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

Définir la valeur une seule fois dans `src/styles/tokens/tokens.css`, sous un nom sémantique `--ds-*`. Ajouter si nécessaire une variante de thème dans `tokens/themes`, puis une référence `var(--ds-...)` dans le module TypeScript correspondant. Les exports TS ne recopient pas les valeurs hexadécimales : ils suivent ainsi le thème et les réglages d’accessibilité actifs.

```tsx
import { colors, spacing, typography } from "@/styles/tokens";

<div style={{ color: colors.textPrimary, gap: spacing[4], fontFamily: typography.body }} />
```

En SCSS : `padding: var(--ds-space-4); color: var(--ds-color-text-primary);`. Les tokens CSS ne s’utilisent pas comme nombres pour les calculs JavaScript ou les media queries. Conserver les breakpoints Sass centralisés pour ces dernières. Le projet utilise SCSS ; aucun système Tailwind supplémentaire n’est ajouté.

**Pas de variable en dur, tout passe par les tokens** pour les nouveaux styles partagés. Les anciens styles de pages contiennent encore des valeurs locales : les harmoniser au fil des refontes, après comparaison visuelle, plutôt que modifier silencieusement toutes les apparences. Les palettes historiques distinctes sont identifiées comme compatibilité ; cette réorganisation ne prétend pas terminer leur convergence graphique.

## Ajouter un composant

`src/components/ui/ArtDecoWorkspace/ArtDecoWorkspace.tsx` contient les blocs partagés `ArtDecoLiveDashboard`, `ArtDecoSmartSearch` et `ArtDecoQuotes`. L’exemple des fondations utilise les mêmes composants que les maquettes. Les résultats de recherche et les propositions de devis propres à chaque rôle se modifient dans `app/design-system/_dashboards/roleWorkspaceData.ts`. La recherche filtre uniquement ces fixtures ; les repères sont illustratifs et les actions de devis restent des prévisualisations sans sauvegarde.

Le planning visuel de l’exemple Art déco et des quatre maquettes utilise `src/components/ui/ArtDecoTimeline/ArtDecoTimeline.tsx`. Les props décrivent les repères, intitulés, statuts et détails propres au rôle. Son SCSS et les tokens `--ds-artdeco-*` définissent le rendu commun : modifier cette source plutôt que recopier un planning dans chaque page.

Le titre de présentation « Une plateforme premium pour orchestrer la location saisonnière » est défini une seule fois par `PLATFORM_HEADLINE_TEXT` dans `src/components/ui/PlatformHeadline/PlatformHeadline.tsx`. Réutiliser `<PlatformHeadline />` (h2 par défaut, prop `as` pour adapter le niveau) pour partager texte et rendu entre pages. Modifier `--ds-text-platform-headline` dans `tokens.css` pour sa taille commune. Ne pas recopier le texte ni ajouter de surcharge locale de taille.

Avant de créer une primitive, chercher dans `components/ui` et réutiliser Button, Card, Input, DataTable, etc. Une nouvelle primitive reçoit des props typées, ses styles utilisent les tokens, et ses états clavier, chargement, vide et erreur sont démontrés dans l’atelier. Ajouter son export public et sa documentation dans `src/components/ui/README.md`.

Pour une composition métier, utiliser `components/features/<rôle>` et composer les primitives UI. Garder les accès aux données, autorisations et transitions dans les hooks/services existants. La page canonique peut devenir un simple point de composition, comme `app/dashboard/provider/page.tsx`. Ne jamais importer `components/features`, une route métier ou un client API depuis `app/design-system`. Les démos utilisent leurs propres fixtures ; la bibliothèque d’icônes lit seulement des assets et catalogues SQL statiques du dépôt.

## Vérifier

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
$env:PROTOTYPE_BROWSER_CHANNEL = 'msedge'
npx.cmd playwright test --config e2e/dashboard-prototypes.config.ts
```

Les tests navigateur utilisent le serveur déjà ouvert sur `127.0.0.1:3000`, sans compte ni mutation. Ils contrôlent la navigation, les alias, les quatre résolutions, les états de démonstration et les interactions. `src/tests/design-architecture.test.mts` contrôle les imports directs des démos et la résolution des tokens. Un build isolé peut utiliser `NEXT_DIST_DIR` ; exécuter ensuite `npx.cmd next typegen` avec le répertoire habituel pour remettre les types de routes générés en cohérence avec le serveur local.
