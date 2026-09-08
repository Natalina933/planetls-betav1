# PlanetLS - Audit du Design System Existant

*Date : 8 septembre 2026*
*Phase : PHASE 1 - Audit initial*

---

## Table des matières

1. [Résumé Exécutif](#résumé-exécutif)
2. [Architecture Actuelle](#architecture-actuelle)
3. [Tokens CSS](#tokens-css)
4. [Composants UI](#composants-ui)
5. [Pages Publiques](#pages-publiques)
6. [Dashboards](#dashboards)
7. [Animations](#animations)
8. [Incohérences Identifiées](#incohérences-identifiées)
9. [Problèmes de Performance](#problèmes-de-performance)
10. [Dette Technique](#dette-technique)

---

## Résumé Exécutif

### État Global

PlanetLS possède déjà un **Design System substantiel et bien structuré** avec :

- ✅ **Tokens CSS centralisés** dans `src/styles/tokens/tokens.css`
- ✅ **Primitives UI complètes** dans `src/components/ui/`
- ✅ **Documentation technique** dans `DESIGN_SYSTEM.md` et `src/components/ui/README.md`
- ✅ **Architecture claire** avec séparation des responsabilités
- ✅ **Thèmes variés** (owner-dashboard, art-deco, beaucoup, etc.)

### Points Forts

1. **Système de tokens mature** avec variables `--ds-*` canoniques
2. **Compatibilité ascendante** via alias `--ui-*` et `--dash-*`
3. **Composants bien documentés** avec API claire
4. **Approche progressive** de migration
5. **Respect des principes d'accessibilité** existants

### Principaux Défis

1. **Incohérences visuelles** entre pages publiques et dashboards
2. **Doublons de tokens** et valeurs locales non harmonisées
3. **Animations non standardisées** avec Framer Motion utilisé de manière ponctuelle
4. **Performance à optimiser** sur les images et animations
5. **Responsive à unifier** selon les breakpoints standardisés

---

## Architecture Actuelle

### Structure des Fichiers

```
src/
├── styles/
│   ├── tokens/
│   │   ├── tokens.css          # Source de vérité des tokens --ds-*
│   │   ├── colors.ts           # Export TypeScript des couleurs
│   │   ├── spacing.ts          # Export TypeScript des espacements
│   │   ├── typography.ts       # Export TypeScript de la typographie
│   │   ├── shadows.ts          # Export TypeScript des ombres
│   │   ├── index.ts            # API publique TypeScript
│   │   └── profileVisualKit.ts # Références visuelles
│   ├── _variables.scss         # Point d'entrée de compatibilité
│   ├── _animations.scss        # Animations CSS de base
│   ├── _base.scss              # Styles de base
│   ├── _layout.scss            # Layout de base
│   ├── _mixins.scss            # Mixins SCSS
│   └── globals.scss             # Fichier global principal
│
src/components/
├── ui/                         # Primitives UI officielles
│   ├── Button, Card, Badge, Input, Select, etc.
│   ├── dashboard/              # Composants dashboard
│   └── README.md               # Documentation complète
│
app/
├── design-system/             # Atelier de démonstration
├── home/                      # Page d'accueil publique
├── parcours/                  # Page de choix de parcours
├── dashboard/                 # Dashboards par rôle
└── landing-page/              # Page de landing
```

### Hiérarchie des Tokens

```css
/* Structure actuelle dans tokens.css */

:root {
  /* Tokens canoniques --ds-* */
  --ds-color-primary: #b88746;
  --ds-color-secondary: #6f532f;
  --ds-color-accent: #3f7f83;
  --ds-color-background: #fffdf9;
  /* ... */
  
  /* Alias de compatibilité --ui-* */
  --ui-color-primary: var(--ds-color-primary);
  /* ... */
  
  /* Alias de compatibilité --dash-* */
  --dash-bg-page: var(--ds-color-background);
  /* ... */
}

/* Thème owner-dashboard */
[data-owner-dashboard] {
  --pls-primary: #16775b;
  --pls-bg: #f7f8f7;
  /* Mappage vers tokens DS */
  --ds-color-primary: var(--pls-primary);
  /* ... */
}

/* Thème art-deco */
[data-theme="art-deco"] {
  --ds-color-primary: #d4af37;
  --ds-radius-sm: 4px;
  /* ... */
}
```

### Flux de Chargement

1. `globals.scss` importe `_variables.scss`
2. `_variables.scss` importe `tokens/tokens.css`
3. `tokens.css` définit tous les tokens canoniques et alias
4. Les thèmes spécifiques surchargent les tokens dans leurs sélecteurs

---

## Tokens CSS

### Palette de Couleurs Principale

#### Tokens Canoniques (--ds-*)

| Token | Valeur | Usage |
|-------|--------|-------|
| `--ds-color-primary` | `#b88746` | Couleur principale (doré) |
| `--ds-color-primary-hover` | `#9a6f34` | Survol de la couleur principale |
| `--ds-color-secondary` | `#6f532f` | Couleur secondaire (brun) |
| `--ds-color-accent` | `#3f7f83` | Couleur d'accent (vert-teal) |
| `--ds-color-background` | `#fffdf9` | Fond principal (crème) |
| `--ds-color-surface` | `#ffffff` | Surface élevée |
| `--ds-color-surface-soft` | `#f8f3ea` | Surface douce |
| `--ds-color-surface-muted` | `#efe6d6` | Surface atténuée |
| `--ds-color-text-primary` | `#2f261f` | Texte principal |
| `--ds-color-text-secondary` | `#6f6257` | Texte secondaire |
| `--ds-color-text-muted` | `#8a7966` | Texte atténué |

#### Tokens de Statut

| Token | Valeur | Usage |
|-------|--------|-------|
| `--ds-color-success` | `#3b7d6a` | Succès |
| `--ds-color-warning` | `#8c4b1f` | Attention |
| `--ds-color-error` | `#af3f3f` | Erreur |
| `--ds-color-info` | `#476ca0` | Information |

#### Tokens Art Déco (Spécifiques)

| Token | Valeur | Usage |
|-------|--------|-------|
| `--ds-artdeco-surface` | `#fffdf8` | Surface Art Déco |
| `--ds-artdeco-ink` | `#182633` | Encre Art Déco |
| `--ds-artdeco-gold` | `#b99545` | Or Art Déco |
| `--ds-artdeco-ornament` | `rgba(185, 149, 69, 0.36)` | Ornement Art Déco |

### Typographie

#### Polices

```css
--ds-font-ui: "Montserrat", "Segoe UI", sans-serif;
--ds-font-body: "Open Sans", "Segoe UI", sans-serif;
--ds-font-heading: var(--ds-font-ui);
--ds-font-artdeco: Georgia, serif;
```

#### Tailles de Texte

| Token | Valeur | Usage |
|-------|--------|-------|
| `--ds-text-sm` | `0.875rem` | Petit texte |
| `--ds-text-base` | `1rem` | Texte de base |
| `--ds-text-xl` | `1.25rem` | Texte grand |
| `--ds-text-display` | `clamp(1.6rem, 3vw, 2.7rem)` | Affichage responsive |
| `--ds-text-platform-headline` | `clamp(1.5rem, 3vw, 2.5rem)` | Titre de plateforme |
| `--ds-text-metric` | `1.75rem` | Métriques |

### Espacements

#### Échelle de Base

| Token | Valeur | Usage |
|-------|--------|-------|
| `--ds-space-1` | `0.25rem` | Espacement 1 |
| `--ds-space-2` | `0.5rem` | Espacement 2 |
| `--ds-space-3` | `0.75rem` | Espacement 3 |
| `--ds-space-4` | `1rem` | Espacement 4 |
| `--ds-space-5` | `1.5rem` | Espacement 5 |
| `--ds-space-6` | `2rem` | Espacement 6 |
| `--ds-space-7` | `3rem` | Espacement 7 |
| `--ds-space-8` | `4rem` | Espacement 8 |
| `--ds-space-page` | `clamp(1rem, 2vw, 2rem)` | Padding de page |
| `--ds-space-section` | `clamp(1.25rem, 2.8vw, 2.5rem)` | Gap de section |

### Rayons et Ombres

#### Rayons

| Token | Valeur | Usage |
|-------|--------|-------|
| `--ds-radius-sm` | `8px` | Rayon petit |
| `--ds-radius-md` | `12px` | Rayon moyen |
| `--ds-radius-lg` | `18px` | Rayon grand |
| `--ds-radius-xl` | `24px` | Rayon extra-grand |
| `--ds-radius-pill` | `999px` | Rayon pilule |

#### Ombres

| Token | Valeur | Usage |
|-------|--------|-------|
| `--ds-shadow-sm` | `0 8px 20px rgba(26, 37, 48, 0.07)` | Ombre petite |
| `--ds-shadow-md` | `0 16px 34px rgba(26, 37, 48, 0.1)` | Ombre moyenne |
| `--ds-shadow-lg` | `0 22px 46px rgba(26, 37, 48, 0.14)` | Ombre grande |
| `--ds-shadow-focus` | `0 0 0 3px rgba(184, 135, 70, 0.2)` | Ombre de focus |

### Animations (Tokens Motion)

#### Tokens Existants

```css
--ds-motion-fast: 140ms ease;
--ds-motion-base: 200ms ease;
--ds-motion-slow: 280ms ease;
--ds-ease-premium: cubic-bezier(0.2, 0.8, 0.2, 1);
```

#### À Ajouter (selon le brief)

```css
/* Tokens motion recommandés */
--motion-fast: 160ms;
--motion-normal: 320ms;
--motion-slow: 700ms;
--motion-ease: cubic-bezier(.22, .61, .36, 1);
```

### Tokens Spécifiques à la Home

```css
[data-home-heritage] {
  --home-bg: #f8f3e9;
  --home-bg-soft: #fcf9f3;
  --home-paper: #fffdf8;
  --home-cream: #f4ead9;
  --home-green: #416b59;
  --home-green-dark: #294b3e;
  --home-green-soft: #e5eee8;
  --home-sage: #91a997;
  --home-gold: #b68a43;
  --home-gold-dark: #8d662c;
  --home-gold-soft: #e4cfaa;
  --home-gold-pale: #f6eddd;
  --home-brown: #6b4e38;
  --home-brown-dark: #402f25;
  --home-text: #292823;
  --home-text-secondary: #68645c;
  --home-text-muted: #918b81;
  --home-border: #dfd3bf;
  --home-border-soft: #ebe3d7;
  --home-max-width: 1280px;
}
```

### Tokens Spécifiques Owner Dashboard

```css
[data-owner-dashboard] {
  --pls-primary: #16775b;           /* Vert PlanetLS */
  --pls-primary-hover: #11654c;
  --pls-primary-soft: #eaf7f1;
  --pls-primary-light: #f4fbf8;
  --pls-beige: #f7f0e7;
  --pls-beige-soft: #fbf7f2;
  --pls-bg: #f7f8f7;
  --pls-bg-soft: #fafbfa;
  /* ... */
}
```

---

## Composants UI

### Primitives Officielles (src/components/ui/)

#### Boutons

- **Button** - Bouton principal avec variants : `primary | secondary | outline | ghost | paper | dark`
- **ButtonLink** - Lien stylisé comme un bouton
- **UILink** - Lien UI standard

#### Cartes

- **Card** - Carte générique avec sizes : `small | large`, tones : `elevated | outlined | soft | dark`
- **CardHeader, CardBody, CardFooter** - Sous-composants de carte

#### Badges et Tags

- **Badge** - Badge de statut avec variants : `neutral | gold | dark | success | warning | danger | info | progress`
- **Tag** - Tag de catégorie avec variants : `default | category | status`

#### Champs de Saisie

- **Input** - Champ de texte avec variants : `default | soft | dark`
- **Select** - Sélecteur avec variants : `default | soft | dark`
- **Textarea** - Zone de texte avec variants : `default | soft | dark`
- **Checkbox** - Case à cocher
- **SearchBar** - Barre de recherche

#### Conteneurs

- **Container** - Conteneur principal
- **Section** - Section de page
- **SectionIntro** - Introduction de section

#### Autres

- **Avatar** - Avatar utilisateur (sm: 32px, md: 48px, lg: 72px)
- **Loader** - Chargeur (sm: 20px, md: 32px, lg: 48px)
- **Alert** - Alerte avec API : `tone`, `title`, `children`, `action`, `announcement`
- **Tabs, TabsList, TabsTrigger, TabsContent** - Onglets
- **AsyncState** - États asynchrones (loading, vide, erreur)
- **DataTable** - Tableau de données
- **TableFilters** - Filtres de tableau

### Composants Dashboard (src/components/ui/dashboard/)

- **DashboardMetricCard** - Carte de métrique pour dashboard
- **DashboardStatusBadge** - Badge de statut dashboard
- **DashboardEmptyState** - État vide dashboard
- **DashboardSection** - Section dashboard

### Composants Spécialisés

- **ArtDecoTimeline** - Timeline Art Déco
- **ArtDecoWorkspace** - Espace de travail Art Déco
- **ArtDecoMarketplaceShowcase** - Vitrine marketplace Art Déco
- **PlatformHeadline** - Titre de plateforme standardisé
- **PublicIcon, WorkspaceRoleIcon, ServiceCategoryIcon** - Icônes spécialisées

### Composants Legacy

- `src/app/components/common/*` - À migrer vers `src/components/ui/`
- `src/app/components/dashboard/Sidebar/Sidebar.tsx` - Sidebar dashboard
- `src/app/components/dashboard/DashboardLayout/DashboardLayout.tsx` - Layout dashboard

---

## Pages Publiques

### Page d'Accueil (HomePage)

**Fichier** : `src/app/home/HomePage.tsx`  
**Styles** : `src/app/home/HomePage.module.scss`

#### Structure

```
HomePage/
├── Hero (avec image immersive)
├── Section "Un quotidien mieux organisé" (3 étapes)
├── Section Storytelling "Votre logement a une histoire"
├── Section Services (masquée par défaut)
├── Section VideoIntro
├── Section Profils (3 cartes)
├── Section Professionnels
├── Section Réseau
├── Section Conciergeries recommandées
├── Section "Notre façon de faire" (valeurs)
├── Section Journal (guides)
├── Section Outils
├── CTA Final
└── Footer
```

#### Tokens Utilisés

- Utilise `[data-home-heritage]` avec tokens `--home-*`
- Typographie : `Cormorant Garamond` pour titres, `Inter` pour corps
- Couleurs : Palette crème/vert/brun/doré

#### Points Forts

- Design immersif avec image hero
- Hiérarchie claire avec titres serif
- Sections bien structurées
- Responsive bien implémenté

#### Problèmes Identifiés

1. **Valeurs locales** : Beaucoup de couleurs en dur (#294b3e, #f4ead9, etc.)
2. **Incohérences** : Mix de tokens `--home-*` et valeurs hex directes
3. **Animations limitées** : Peu d'animations subtiles
4. **Performance** : Images à optimiser (WebP/AVIF)

### Page Parcours

**Fichier** : `src/app/parcours/page.tsx`  
**Styles** : `src/app/parcours/page.module.scss`

#### Structure

```
ParcoursPage/
├── Hero (2 colonnes : copie + panel visuel)
│   ├── Copie principale avec CTA
│   └── Panel avec illustration et métriques
└── Section "Entrez par votre vrai besoin"
    └── Grille de 3 cartes (Propriétaire, Concierge, Artisans)
```

#### Style

- Background : Gradient radial + linéaire
- Cartes : `border-radius: 28px`, `backdrop-filter: blur(10px)`
- Typographie : Couleurs sombres (#2f2415, #5f4e38)

#### Problèmes Identifiés

1. **Effet blur coûteux** : `backdrop-filter: blur(10px)` sur toutes les cartes
2. **Valeurs locales** : Couleurs en dur (#8b6a2d, #584321, etc.)
3. **Responsive** : Breakpoint à 900px et 720px (non aligné sur échelle standard)

---

## Dashboards

### Dashboard Propriétaire

**Fichier** : `src/app/dashboard/owner/page.tsx`  
**Composant** : `OwnerDashboardView` dans `src/features/owner-dashboard/`

#### Structure

- Utilise `DashboardLoadingScreen` pendant le chargement
- `OwnerDashboardView` compose les données et l'interface
- `FirstLoginOnboardingPopup` pour l'onboarding

#### Tokens

- Utilise `[data-owner-dashboard]` avec palette verte
- `--pls-primary: #16775b` (vert PlanetLS)
- Background : `#f7f8f7` (gris clair)

### Dashboard Concierge

**Fichier** : `src/app/dashboard/concierge/page.tsx`  
**Composant** : Similaire au propriétaire avec données spécifiques

### Dashboard Artisan (Provider)

**Fichier** : `src/app/dashboard/provider/page.tsx`

---

## Animations

### Dépendances

- **Framer Motion** : Présent dans `package.json` (`^12.23.0`)

### Utilisation Actuelle

#### Composants avec Framer Motion

1. **HowItWorksSection** (`src/app/components/layout/Home/HowItWorksSection/HowItWorksSection.tsx`)
   - Animations de reveal au scroll
   - Effets de fade et slide

2. **ShopSection** (`src/app/components/layout/Home/ShopSection/ShopSection.tsx`)
   - Animations de cartes

3. **TrustSection** (`src/app/components/layout/Home/TrustSection/TrustSection.tsx`)
   - Animations d'icônes et de texte

#### Animations CSS Natif

Dans `_animations.scss` :

```scss
@keyframes ui-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ui-pop {
  from {
    transform: scale(0.98);
  }
  to {
    transform: scale(1);
  }
}
```

### Tokens Motion Existants

```css
--ds-motion-fast: 140ms ease;
--ds-motion-base: 200ms ease;
--ds-motion-slow: 280ms ease;
--ds-ease-premium: cubic-bezier(0.2, 0.8, 0.2, 1);
```

### Respect de prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --ds-motion-fast: 1ms linear;
    --ds-motion-base: 1ms linear;
    --ds-motion-slow: 1ms linear;
  }
}
```

### Problèmes Identifiés

1. **Utilisation ponctuelle** : Framer Motion utilisé seulement dans quelques composants
2. **Pas de standardisation** : Pas de pattern cohérent pour les animations
3. **Pas d'IntersectionObserver** pour le reveal au scroll (utilisé dans CompleteRegistrationPage)
4. **Animations coûteuses** : Certaines animations pourraient être optimisées

---

## Incohérences Identifiées

### 1. Incohérences de Couleurs

#### Problème

- **Home Page** : Utilise `--home-*` tokens + valeurs hex en dur
- **Parcours Page** : Utilise couleurs hex en dur (#8b6a2d, #584321, etc.)
- **Owner Dashboard** : Utilise `--pls-*` tokens avec palette verte
- **Tokens globaux** : `--ds-color-primary: #b88746` (doré)

#### Impact

- Difficulté à maintenir la cohérence visuelle
- Plusieurs palettes coexistent sans mapping clair
- Risque de dérive visuelle

#### Solution Proposée

- **Unifier sur les tokens `--ds-*`**
- Créer un mapping clair entre les palettes
- Migrer progressivement les valeurs locales

### 2. Incohérences de Typographie

#### Problème

- **Home Page** : `Cormorant Garamond` pour titres, `Inter` pour corps
- **Parcours Page** : Polices par défaut (Inter pour UI, Open Sans pour body)
- **Tokens** : `--ds-font-ui: Montserrat`, `--ds-font-body: Open Sans`

#### Impact

- Plusieurs polices serif différentes
- Pas de cohérence entre pages

#### Solution Proposée

- Standardiser sur :
  - Serif : `Cormorant Garamond` (éditorial) ou `Georgia` (fallback)
  - Sans-serif : `Montserrat` (UI) ou `Inter` (corps)
- Limiter à 2-3 polices maximum

### 3. Incohérences de Rayons

#### Problème

- **Home Page** : `border-radius: 22px` pour cartes
- **Parcours Page** : `border-radius: 28px` pour cartes
- **Tokens** : `--ds-radius-lg: 18px`, `--ds-radius-xl: 24px`

#### Impact

- Cartes avec des rayons différents
- Apparence non uniforme

#### Solution Proposée

- Standardiser sur l'échelle des tokens :
  - Cards : `--ds-radius-lg` (18px) ou `--ds-radius-xl` (24px)
  - Boutons : `--ds-radius-md` (12px) ou `--ds-radius-pill` (999px)

### 4. Incohérences d'Espacements

#### Problème

- **Home Page** : `padding: 82px 40px`, `gap: 28px`, `margin: 26px 0`
- **Parcours Page** : `padding: 40px`, `gap: 24px`, `gap: 18px`
- **Tokens** : `--ds-space-6: 2rem` (32px), `--ds-space-section: clamp(1.25rem, 2.8vw, 2.5rem)`

#### Impact

- Rythme vertical non cohérent
- Difficulté à maintenir l'alignement

#### Solution Proposée

- Utiliser **uniquement** l'échelle `--ds-space-*`
- Échelle recommandée : 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px

### 5. Incohérences d'Ombres

#### Problème

- **Home Page** : `box-shadow: none` ou `0 1px 3px rgb(23 33 29 / 3%)`
- **Parcours Page** : `box-shadow: 0 20px 60px rgba(83, 62, 28, 0.08)`
- **Tokens** : `--ds-shadow-sm`, `--ds-shadow-md`, `--ds-shadow-lg`

#### Impact

- Ombres de profondeur différentes
- Incohérence visuelle

#### Solution Proposée

- Standardiser sur les tokens `--ds-shadow-*`
- Éviter les ombres lourdes (comme dans Parcours)

---

## Problèmes de Performance

### 1. Images Non Optimisées

#### Problème

- Beaucoup d'images en JPG/PNG au lieu de WebP/AVIF
- Pas de `sizes` défini sur toutes les images
- Pas de `loading="lazy"` systématique

#### Impact

- LCP (Largest Contentful Paint) mauvaise
- Poids initial élevé

#### Solution

- Convertir toutes les images en **WebP** (fallback AVIF)
- Définir `sizes` sur chaque `<Image />`
- Utiliser `loading="lazy"` pour images hors viewport
- Utiliser `priority` seulement pour images hero

### 2. Effets CSS Coûteux

#### Problème

- **Parcours Page** : `backdrop-filter: blur(10px)` sur toutes les cartes
- Animations Framer Motion sans optimisation
- Pas d'utilisation d'IntersectionObserver pour le lazy loading

#### Impact

- Consommation GPU élevée
- Ralentissement sur mobiles

#### Solution

- **Éviter `backdrop-filter`** ou limiter son usage
- Préférer les ombres CSS aux effets blur
- Utiliser `will-change: transform, opacity` pour les animations
- Implémenter IntersectionObserver pour reveal au scroll

### 3. Polices Non Optimisées

#### Problème

- Plusieurs polices chargées (Montserrat, Open Sans, Inter, Georgia, Cormorant Garamond)
- Pas de `font-display: swap` systématique
- Pas de préchargement des polices

#### Impact

- FOUT (Flash of Unstyled Text)
- Poids supplémentaire

#### Solution

- Limiter à **2 polices maximum** :
  - Serif : Georgia (système) ou Cormorant Garamond
  - Sans-serif : Inter ou Montserrat
- Utiliser `next/font` pour le chargement
- Pré-charger les polices critiques
- `font-display: swap` pour toutes les polices

### 4. JavaScript Coûteux

#### Problème

- Framer Motion chargé même pour les pages sans animation
- Pas de code splitting pour les animations
- IntersectionObserver créé manuellement (non optimisé)

#### Impact

- JS bundle plus gros
- INP (Interaction to Next Paint) affectée

#### Solution

- Charger Framer Motion **dynamiquement** (`next/dynamic`)
- Utiliser des animations CSS quand possible
- Standardiser sur IntersectionObserver natif

---

## Dette Technique

### 1. Migration des Tokens

- **État** : Tokens `--ds-*` existent mais pas partout utilisés
- **Action** : Migrer toutes les valeurs locales vers les tokens
- **Priorité** : Haute
- **Effort** : Moyen

### 2. Unification des Styles

- **État** : Chaque page a ses propres styles locaux
- **Action** : Créer des composants partagés pour les sections courantes
- **Priorité** : Moyenne
- **Effort** : Élevé

### 3. Optimisation des Images

- **État** : Images non optimisées
- **Action** : Convertir en WebP/AVIF, ajouter sizes, lazy loading
- **Priorité** : Haute
- **Effort** : Faible

### 4. Standardisation des Animations

- **État** : Animations ponctuelles, pas de pattern cohérent
- **Action** : Créer un système d'animation standardisé
- **Priorité** : Moyenne
- **Effort** : Moyen

### 5. Accessibilité

- **État** : `prefers-reduced-motion` partiellement implémenté
- **Action** : Auditer et corriger tous les problèmes d'accessibilité
- **Priorité** : Moyenne
- **Effort** : Moyen

### 6. Responsive

- **État** : Breakpoints non standardisés (760px, 768px, 900px, 1000px, etc.)
- **Action** : Standardiser sur 1600, 1366, 1024, 768, 390px
- **Priorité** : Moyenne
- **Effort** : Faible

---

## Recommandations Prioritaires

### 1. Action Immédiate (P0)

- [ ] **Corriger les problèmes de performance critiques**
  - Convertir images hero en WebP
  - Supprimer `backdrop-filter: blur()` ou le remplacer
  - Ajouter `sizes` sur toutes les images

### 2. Court Terme (P1)

- [ ] **Finaliser la migration des tokens**
  - Remplacer toutes les valeurs locales par `--ds-*`
  - Créer un mapping clair entre les palettes
  - Harmoniser les couleurs de la Home et Parcours

- [ ] **Standardiser les animations**
  - Créer les tokens motion manquants
  - Implémenter prefers-reduced-motion partout
  - Utiliser IntersectionObserver pour reveal

### 3. Moyen Terme (P2)

- [ ] **Optimiser les polices**
  - Limiter à 2 polices maximum
  - Utiliser next/font
  - Pré-charger les polices critiques

- [ ] **Unifier le responsive**
  - Standardiser sur 1600, 1366, 1024, 768, 390px
  - Vérifier tous les breakpoints existants

### 4. Long Terme (P3)

- [ ] **Créer des composants partagés**
  - HeroSection
  - FeatureSection
  - CardGrid
  - CTASection

- [ ] **Améliorer l'accessibilité**
  - Audit complet WCAG
  - Corriger les problèmes identifiés

---

## Conclusion

PlanetLS possède une **excellente base** avec un Design System bien structuré. Les principaux défis sont :

1. **L'harmonisation** des styles existants vers les tokens canoniques
2. **L'optimisation** des performances (images, animations, polices)
3. **La standardisation** des animations et du responsive
4. **La création** de composants partagés pour éviter la duplication

La **PHASE 2** (Design System) devrait se concentrer sur :
- La mise à jour des tokens selon le brief UX/UI
- La création des règles globales
- L'optimisation des performances

La **PHASE 3** (Home) sera alors une application concrète de ces règles.
