# PlanetLS - Règles Globales UX/UI

*Date : 8 septembre 2026*
*Version : 1.0*
*Phase : PHASE 1 - Règles Globales*

---

## Table des matières

1. [Philosophie de Design](#philosophie-de-design)
2. [Identité Visuelle](#identité-visuelle)
3. [Système de Tokens](#système-de-tokens)
4. [Typographie](#typographie)
5. [Couleurs](#couleurs)
6. [Espacements](#espacements)
7. [Rayons et Ombres](#rayons-et-ombres)
8. [Animations et Motion](#animations-et-motion)
9. [Composants](#composants)
10. [Layout et Grilles](#layout-et-grilles)
11. [Accessibilité](#accessibilité)
12. [Performance](#performance)
13. [Responsive](#responsive)
14. [Nomenclature](#nomenclature)

---

## Philosophie de Design

### Principe Central

> **Le design doit être au service de la compréhension.**

Chaque page doit avoir :
1. **Une intention principale** claire
2. **Une hiérarchie visuelle** forte
3. **Une action principale** évidente
4. **Peu de distractions** 
5. **Des contenus secondaires** accessibles ensuite

### Valeurs

- **Beau** : Élégant, raffiné, attention aux détails
- **Clair** : Lisible, compréhensible, sans ambiguïté
- **Intuitif** : Navigation naturelle, interactions évidentes
- **Chaleureux** : Accueillant, humain, rassurant
- **Moderne** : Actuel, professionnel, innovant
- **Performant** : Rapide, léger, optimisé
- **Responsive** : Adapté à tous les devices
- **Légèrement animé** : Subtile movement, élégant
- **Cohérent** : Uniforme sur toutes les pages

### Identité Unique

**PlanetLS = Sepia 1900 / Belle Époque revisitée + produit numérique moderne**

- Conserver les éléments historiques : crème, ivoire, vert PlanetLS, brun profond
- Ajouter des touches modernes : laiton/doré comme accent
- Utiliser des motifs 1900 **discrètement** comme filigranes
- Les arabesques sont des **filigranes**, pas des bordures partout
- Le doré est un **accent**, pas une couleur dominante

### Ce qu'il faut éviter

- ❌ Sites futuristes génériques
- ❌ Copier microsoft.ai ou d'autres sites
- ❌ Bordures décoratives partout
- ❌ Animations agressives ou gadgets
- ❌ Pages interminables
- ❌ Trop de cartes imbriquées
- ❌ Informations répétées
- ❌ KPI dupliqués

---

## Système de Tokens

### Structure des Tokens

Tous les tokens **doivent** suivre cette structure :

```css
/* Tokens canoniques */
:root {
  /* Couleurs */
  --ds-color-*
  
  /* Typographie */
  --ds-font-*
  --ds-text-*
  --ds-leading-*
  
  /* Espacements */
  --ds-space-*
  
  /* Rayons */
  --ds-radius-*
  
  /* Ombres */
  --ds-shadow-*
  
  /* Animations */
  --ds-motion-*
  --ds-ease-*
  
  /* Layout */
  --ds-layout-*
  --ds-border-*
}
```

### Hiérarchie des Tokens

```
Tokens Sémantiques (--ds-*)
    ↓
Tokens de Composants (--ds-radius-card, --ds-shadow-md)
    ↓
Tokens Spécifiques (--home-*, --pls-*) [à migrer progressivement]
    ↓
Alias de Compatibilité (--ui-*, --dash-*) [à éviter pour le nouveau code]
```

### Règles d'Usage

1. **Toujours** utiliser les tokens `--ds-*` pour le nouveau code
2. **Éviter** les valeurs en dur (hex, rgb, px, rem)
3. **Ne pas** recréer de tokens locaux sans nécessaire
4. **Préférer** les tokens sémantiques aux tokens techniques
5. **Documenter** chaque nouveau token dans ce document

---

## Typographie

### Polices

#### Polices Officielles

| Usage | Police | Fallback | Style |
|-------|--------|----------|-------|
| **Titres éditoriaux** | Cormorant Garamond | Georgia, serif | Élégant, chaleureux |
| **Texte UI** | Inter | "Segoe UI", sans-serif | Moderne, lisible |
| **Texte corps** | Inter | "Segoe UI", sans-serif | Neutre, professionnel |
| **Code/Technique** | "SF Mono" | "Monaco", monospace | Technique |

#### Rationale

- **Cormorant Garamond** : Parfait pour les titres éditoriaux, donne le côté "Belle Époque"
- **Inter** : Excellente lisibilité, moderne, bien supporté
- **Limité à 2 polices** pour optimiser la performance

#### Implémentation

```css
--ds-font-heading: "Cormorant Garamond", Georgia, "Times New Roman", serif;
--ds-font-ui: Inter, "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
--ds-font-body: Inter, "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
--ds-font-mono: "SF Mono", "Monaco", "Courier New", monospace;
```

### Tailles de Texte

#### Échelle Typographique

| Token | Valeur | Usage | Weight | Line Height |
|-------|--------|-------|--------|-------------|
| `--ds-text-xs` | `0.75rem` (12px) | Caption, labels | 500 | 1.5 |
| `--ds-text-sm` | `0.875rem` (14px) | Texte secondaire, méta | 400 | 1.6 |
| `--ds-text-base` | `1rem` (16px) | Texte principal | 400 | 1.7 |
| `--ds-text-lg` | `1.125rem` (18px) | Texte mis en avant | 400 | 1.65 |
| `--ds-text-xl` | `1.25rem` (20px) | Sous-titres | 500 | 1.3 |
| `--ds-text-2xl` | `1.5rem` (24px) | Titres de section | 600 | 1.2 |
| `--ds-text-3xl` | `1.875rem` (30px) | Titres importants | 600 | 1.15 |
| `--ds-text-4xl` | `2.25rem` (36px) | Titres hero | 600 | 1.1 |
| `--ds-text-display` | `clamp(2.5rem, 5vw, 4rem)` | Titres display | 400 | 1.05 |

#### Titres (h1-h6)

```css
h1 { 
  font-family: var(--ds-font-heading);
  font-size: var(--ds-text-display);
  font-weight: 400;
  color: var(--ds-color-text-primary);
  line-height: 1.05;
  letter-spacing: -0.035em;
}

h2 {
  font-family: var(--ds-font-heading);
  font-size: var(--ds-text-3xl);
  font-weight: 600;
  color: var(--ds-color-text-primary);
  line-height: 1.15;
}

h3 {
  font-family: var(--ds-font-heading);
  font-size: var(--ds-text-2xl);
  font-weight: 600;
  color: var(--ds-color-text-primary);
  line-height: 1.2;
}

h4, h5, h6 {
  font-family: var(--ds-font-ui);
  font-weight: 600;
  color: var(--ds-color-text-primary);
}
```

### Styles de Texte Spéciaux

#### Eyebrow/Kicker

```css
--ds-text-eyebrow: 0.75rem;
--ds-text-eyebrow-letter-spacing: 0.19em;
--ds-text-eyebrow-weight: 650;
--ds-text-eyebrow-transform: uppercase;
```

Utilisation :
```css
.eyebrow {
  font-size: var(--ds-text-eyebrow);
  letter-spacing: var(--ds-text-eyebrow-letter-spacing);
  font-weight: var(--ds-text-eyebrow-weight);
  text-transform: var(--ds-text-eyebrow-transform);
  color: var(--ds-color-accent);
}
```

#### Lien

```css
--ds-text-link: var(--ds-text-base);
--ds-text-link-weight: 600;
```

#### Code

```css
--ds-text-code: var(--ds-text-sm);
--ds-text-code-family: var(--ds-font-mono);
```

### Emphasis et Hiérarchie

1. **Titre principal** : Serif, grande taille, couleur primaire
2. **Titre secondaire** : Serif, taille moyenne, couleur primaire
3. **Texte principal** : Sans-serif, taille base, couleur text-primary
4. **Texte secondaire** : Sans-serif, taille base, couleur text-secondary
5. **Texte méta** : Sans-serif, taille sm, couleur text-muted
6. **Em phase/italique** : À utiliser avec parcimonie pour lemphasise

### Règles Typographiques

1. **Ne pas** utiliser la taille pour remplacer la hiérarchie
2. **Limiter** à 3-4 niveaux de titres par page
3. **Éviter** les lignes trop longues (> 65-75 caractères)
4. **Assurer** un contraste suffisant (4.5:1 minimum)
5. **Utiliser** `rem` pour les tailles, pas `px`
6. **Préférer** les `clamp()` pour les tailles responsive

---

## Couleurs

### Palette Principale

#### Couleurs de Marque

| Token | Valeur | Usage | Description |
|-------|--------|-------|-------------|
| `--ds-color-primary` | `#8B6A2D` | Accent principal | Doré/laiton - à utiliser avec parcimonie |
| `--ds-color-primary-hover` | `#6D5422` | Survol | Doré plus foncé |
| `--ds-color-primary-soft` | `#E4CFAA` | Fond doux | Doré très clair |
| `--ds-color-secondary` | `#6B4E38` | Accent secondaire | Brun profond |
| `--ds-color-accent` | `#416B59` | Accent tertiaire | Vert PlanetLS |

#### Couleurs de Fond

| Token | Valeur | Usage |
|-------|--------|-------|
| `--ds-color-background` | `#F8F3E9` | Fond de page | Crème principal |
| `--ds-color-background-soft` | `#FCF9F3` | Fond doux | Crème très clair |
| `--ds-color-surface` | `#FFFFFF` | Surface élevée | Blanc |
| `--ds-color-surface-soft` | `#F8F5EA` | Surface douce | Blanc cassé |
| `--ds-color-surface-muted` | `#EFE7D8` | Surface atténuée | Beige très clair |

#### Couleurs de Texte

| Token | Valeur | Usage | Contrast Ratio |
|-------|--------|-------|----------------|
| `--ds-color-text-primary` | `#292823` | Texte principal | 15.3:1 |
| `--ds-color-text-secondary` | `#68645C` | Texte secondaire | 6.2:1 |
| `--ds-color-text-muted` | `#918B81` | Texte atténué | 4.5:1 |
| `--ds-color-text-inverse` | `#F8F3E9` | Texte sur fond sombre | 15.3:1 |

#### Couleurs de Bordure

| Token | Valeur | Usage |
|-------|--------|-------|
| `--ds-color-border` | `#DFD3BF` | Bordure principale | Douce, discrète |
| `--ds-color-border-strong` | `#B88746` | Bordure forte | Doré |
| `--ds-color-border-soft` | `#EBE3D7` | Bordure douce | Très claire |

### Couleurs de Statut

| Token | Valeur | Usage |
|-------|--------|-------|
| `--ds-color-success` | `#3B7D6A` | Succès |
| `--ds-color-success-soft` | `#E5EEE8` | Fond succès |
| `--ds-color-warning` | `#D98A12` | Attention |
| `--ds-color-warning-soft` | `#FFF6E5` | Fond attention |
| `--ds-color-error` | `#D94A4A` | Erreur |
| `--ds-color-error-soft` | `#FFF0F0` | Fond erreur |
| `--ds-color-info` | `#3D71C7` | Information |
| `--ds-color-info-soft` | `#EEF4FF` | Fond information |

### Palette Art Déco (pour les dashboards)

| Token | Valeur | Usage |
|-------|--------|-------|
| `--ds-artdeco-surface` | `#FFFDF8` | Surface |
| `--ds-artdeco-ink` | `#182633` | Texte |
| `--ds-artdeco-gold` | `#B99545` | Or |
| `--ds-artdeco-line` | `rgba(24, 38, 51, 0.14)` | Ligne |
| `--ds-artdeco-ornament` | `rgba(185, 149, 69, 0.36)` | Ornement |

### Palette Owner Dashboard

| Token | Valeur | Usage |
|-------|--------|-------|
| `--ds-owner-primary` | `#16775B` | Vert principal |
| `--ds-owner-bg` | `#F7F8F7` | Fond |

### Règles d'Usage des Couleurs

1. **Le doré/laiton est un accent** - à utiliser avec parcimonie
2. **Le vert PlanetLS** est la couleur principale pour les dashboards
3. **La palette crème/ivoire** domine les pages publiques
4. **Éviter** les couleurs saturées en grande surface
5. **Assurer** le contraste minimum 4.5:1 pour le texte
6. **Ne pas** utiliser le doré pour le texte long
7. **Préférer** les couleurs de statut pour les indicateurs

### Mapping des Couleurs Existantes

Pour harmoniser les pages existantes :

```css
/* Home Page - Mapping vers tokens globaux */
[data-home-heritage] {
  --home-bg: var(--ds-color-background);
  --home-bg-soft: var(--ds-color-background-soft);
  --home-paper: var(--ds-color-surface);
  --home-cream: var(--ds-color-surface-soft);
  --home-green: var(--ds-color-accent);
  --home-green-dark: var(--ds-color-text-primary);
  --home-green-soft: var(--ds-color-surface-muted);
  --home-gold: var(--ds-color-primary);
  --home-gold-dark: var(--ds-color-primary-hover);
  --home-gold-soft: var(--ds-color-primary-soft);
  --home-brown: var(--ds-color-secondary);
  --home-text: var(--ds-color-text-primary);
  --home-text-secondary: var(--ds-color-text-secondary);
  --home-text-muted: var(--ds-color-text-muted);
  --home-border: var(--ds-color-border);
  --home-border-soft: var(--ds-color-border-soft);
}
```

---

## Espacements

### Échelle d'Espacement

L'échelle officielle PlanetLS :

| Token | Valeur (rem) | Valeur (px) | Usage |
|-------|---------------|--------------|-------|
| `--ds-space-0` | `0` | `0` | Aucun espace |
| `--ds-space-1` | `0.25rem` | `4px` | Micro-espace |
| `--ds-space-2` | `0.5rem` | `8px` | Petit espace |
| `--ds-space-3` | `0.75rem` | `12px` | Espace serre |
| `--ds-space-4` | `1rem` | `16px` | Espace de base |
| `--ds-space-5` | `1.5rem` | `24px` | Espace moyen |
| `--ds-space-6` | `2rem` | `32px` | Espace standard |
| `--ds-space-7` | `3rem` | `48px` | Grand espace |
| `--ds-space-8` | `4rem` | `64px` | Très grand espace |
| `--ds-space-9` | `6rem` | `96px` | Section spacing |
| `--ds-space-10` | `8rem` | `128px` | Hero spacing |

### Espacements Responsives

```css
--ds-space-page: clamp(1rem, 2vw, 2rem);        /* Padding de page */
--ds-space-section: clamp(1.25rem, 2.8vw, 2.5rem); /* Gap entre sections */
--ds-space-card: var(--ds-space-5);              /* Espacement dans cartes */
```

### Règles d'Usage

1. **Toujours** utiliser les tokens `--ds-space-*`
2. **Éviter** les valeurs arbitraires (42px, 17px, etc.)
3. **Préférer** les espacements pairs (4, 8, 12, 16, 24, 32, etc.)
4. **Utiliser** `gap` au lieu de `margin` pour les grilles
5. **Conserver** un rythme vertical cohérent
6. **Ne pas** mélanger rem et px dans le même contexte

### Exemples d'Usage

```css
/* Espacement interne */
.container {
  padding: var(--ds-space-6);
}

/* Gap entre éléments */
.grid {
  gap: var(--ds-space-5);
}

/* Marge externe */
.section {
  margin-bottom: var(--ds-space-8);
}

/* Padding responsive */
.page {
  padding: var(--ds-space-page);
}
```

---

## Rayons et Ombres

### Rayons

| Token | Valeur | Usage |
|-------|--------|-------|
| `--ds-radius-sm` | `4px` | Petits éléments, badges |
| `--ds-radius-md` | `8px` | Boutons, inputs |
| `--ds-radius-lg` | `12px` | Cartes standard |
| `--ds-radius-xl` | `16px` | Grandes cartes, sections |
| `--ds-radius-2xl` | `20px` | Cartes premium |
| `--ds-radius-3xl` | `24px` | Cartes hero, conteneurs |
| `--ds-radius-pill` | `999px` | Boutons pilule, badges |
| `--ds-radius-full` | `50%` | Cercle |

### Règles d'Usage

1. **Cartes** : `--ds-radius-lg` (12px) par défaut
2. **Boutons** : `--ds-radius-md` (8px) par défaut
3. **Inputs** : `--ds-radius-md` (8px)
4. **Badges** : `--ds-radius-pill` (999px)
5. **Sections** : `--ds-radius-xl` (16px) maximum
6. **Éviter** les rayons différents pour des éléments similaires

### Ombres

| Token | Valeur | Usage |
|-------|--------|-------|
| `--ds-shadow-none` | `none` | Aucun ombre |
| `--ds-shadow-sm` | `0 2px 8px rgba(41, 40, 35, 0.06)` | Élévation subtile |
| `--ds-shadow-md` | `0 4px 16px rgba(41, 40, 35, 0.08)` | Élévation standard |
| `--ds-shadow-lg` | `0 8px 24px rgba(41, 40, 35, 0.1)` | Élévation forte |
| `--ds-shadow-xl` | `0 12px 32px rgba(41, 40, 35, 0.12)` | Élévation maximale |
| `--ds-shadow-focus` | `0 0 0 3px rgba(139, 106, 45, 0.2)` | Focus visible |

#### Ombres de Couleur

```css
--ds-shadow-gold: 0 4px 16px rgba(139, 106, 45, 0.15);
--ds-shadow-green: 0 4px 16px rgba(65, 107, 89, 0.15);
```

### Règles d'Usage

1. **Éviter** les ombres lourdes (comme `0 20px 60px` dans Parcours)
2. **Préférer** les ombres subtiles
3. **Utiliser** `--ds-shadow-sm` pour les cartes standard
4. **Réserver** `--ds-shadow-lg` et `--ds-shadow-xl` pour les éléments hero
5. **Ne pas** utiliser d'ombre sur les éléments en 2D pure

---

## Animations et Motion

### Tokens Motion

#### Durée

| Token | Valeur | Usage |
|-------|--------|-------|
| `--ds-motion-instant` | `1ms` | Instantané (reduced motion) |
| `--ds-motion-fast` | `160ms` | Animations rapides |
| `--ds-motion-normal` | `320ms` | Animations standard |
| `--ds-motion-slow` | `700ms` | Animations lentes |

#### Easing

| Token | Valeur | Usage |
|-------|--------|-------|
| `--ds-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Entrée |
| `--ds-ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Sortie |
| `--ds-ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Entrée/Sortie |
| `--ds-ease-premium` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Motion élégant |

### Types d'Animations Autorisées

#### 1. Reveal au Scroll

```css
@keyframes reveal-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: 
    opacity var(--ds-motion-slow) var(--ds-ease-premium),
    transform var(--ds-motion-slow) var(--ds-ease-premium);
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

#### 2. Fade

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade {
  opacity: 0;
  transition: opacity var(--ds-motion-normal) ease;
}

.fade.visible {
  opacity: 1;
}
```

#### 3. Légère Parallax

```css
.parallax {
  will-change: transform;
  transition: transform var(--ds-motion-slow) var(--ds-ease-premium);
}
```

#### 4. Sticky Storytelling

- Utiliser `position: sticky` avec des offsets
- Ajouter des transitions douces

#### 5. Zoom Léger des Images

```css
.image-zoom {
  transition: transform var(--ds-motion-normal) var(--ds-ease-premium);
}

.image-zoom:hover {
  transform: scale(1.02);
}
```

#### 6. Scroll Horizontal Ponctuel

- Utiliser `overflow-x: auto` avec `-ms-overflow-style: -ms-autohiding-scrollbar`
- Ajouter des indications de scroll

#### 7. Hover Doux

```css
.hover-subtle {
  transition: all var(--ds-motion-fast) var(--ds-ease-premium);
}
```

#### 8. Motif 1900 Animé

```css
@keyframes ornament-move {
  0%, 100% { background-position: 0 0; }
  50% { background-position: 20px 10px; }
}

.ornament {
  background: url('/ornements/ornement-right.svg') repeat;
  animation: ornament-move 60s linear infinite;
  opacity: 0.12;
}
```

### Animations Interdites

- ❌ Animations agressives (bounce, shake)
- ❌ Rotations importantes (> 5°)
- ❌ Effets 3D excessifs
- ❌ Animations permanentes inutiles
- ❌ Particules futuristes
- ❌ Animations qui distraient de l'intention principale

### Implémentation Technique

#### 1. IntersectionObserver pour Reveal

```javascript
// Hook personnalisé
function useReveal(ref, threshold = 0.1) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin: '0px 0px -48px 0px' }
    );
    
    const current = ref.current;
    if (current) {
      observer.observe(current);
      return () => observer.unobserve(current);
    }
  }, [ref, threshold]);
}
```

#### 2. Respect de prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --ds-motion-fast: 1ms linear;
    --ds-motion-normal: 1ms linear;
    --ds-motion-slow: 1ms linear;
  }
  
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
```

### Optimisation des Animations

1. **Utiliser** `will-change: transform, opacity` pour les éléments animés
2. **Éviter** `will-change: auto`
3. **Préférer** `transform` et `opacity` à d'autres propriétés
4. **Utiliser** `requestAnimationFrame` pour les animations JS
5. **Éviter** les animations sur trop d'éléments simultanément
6. **Désactiver** les animations quand la page n'est pas visible

---

## Composants

###Hiérarchie des Composants

```
Primitives (src/components/ui/)
    ↓
Composants de Présentation (src/components/ui/dashboard/)
    ↓
Composants Métier (src/features/*/)
    ↓
Pages (src/app/*/)
```

### Primitives UI

#### Boutons

| Variant | Usage | Style |
|---------|-------|-------|
| `primary` | Action principale | Fond doré, texte blanc |
| `secondary` | Action secondaire | Fond transparent, bordure doré |
| `outline` | Action tertiaire | Bordure subtile |
| `ghost` | Action discrète | Transparent, hover visible |
| `paper` | Action sur fond clair | Fond blanc, bordure |
| `dark` | Action sur fond sombre | Fond sombre, texte clair |

#### Cartes

| Size | Largeur Max | Usage |
|------|-------------|-------|
| `small` | 320px | Liste, suggestions |
| `medium` | 400px | Contenu standard |
| `large` | 520px | Contenu détaillé |

| Tone | Usage |
|------|-------|
| `elevated` | Ombre visible |
| `outlined` | Bordure visible |
| `soft` | Fond doux |
| `dark` | Fond sombre |

### Règles de Composition

#### 1. Cartes

- **Rayon** : `--ds-radius-lg` (12px) par défaut
- **Ombre** : `--ds-shadow-sm` par défaut
- **Padding** : `--ds-space-5` (24px) interne
- **Éviter** les cartes dans des cartes
- **Éviter** les bordures décoratives

#### 2. Sections

- **Padding vertical** : `--ds-space-9` (96px) entre sections
- **Padding horizontal** : `--ds-space-page` (responsive)
- **Max-width** : `1280px` pour le contenu
- **Background** : Utiliser les tokens de surface

#### 3. Hero

- **Hauteur minimale** : `720px` (desktop), `600px` (mobile)
- **Background** : Image immersive + overlay
- **Overlay** : Gradient semi-transparent
- **Contenu** : Aligné à gauche ou centré
- **CTA** : Bouton primary + lien secondaire

#### 4. CTA (Call to Action)

- **Bouton primary** : Couleur doré/laiton
- **Bouton secondary** : Transparent avec bordure
- **Lien texte** : Souligné, couleur accent
- **Taille minimale** : 44px de hauteur pour touch

### Règles pour les Dashboards

1. **1 état important** + **4 KPI maximum** + **1 action principale**
2. **Éviter** les animations décoratives
3. **Autoriser** seulement :
   - hover
   - micro-transitions
   - loading states
   - changements de statut

---

## Layout et Grilles

### Layout de Page

#### Structure Standard

```
Page
├── Header (optionnel pour pages publiques)
├── Hero (pour pages publiques)
├── Main
│   ├── Section 1
│   ├── Section 2
│   └── Section N
└── Footer
```

#### Conteneurs

```css
.container {
  width: 100%;
  max-width: var(--ds-layout-max-width, 1280px);
  margin: 0 auto;
  padding: 0 var(--ds-space-page);
}
```

### Grilles

#### Grille de Section

```css
.section-grid {
  display: grid;
  gap: var(--ds-space-6);
}

/* 3 colonnes desktop */
@media (min-width: 1024px) {
  .section-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 2 colonnes tablette */
@media (min-width: 768px) and (max-width: 1023px) {
  .section-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 1 colonne mobile */
@media (max-width: 767px) {
  .section-grid {
    grid-template-columns: 1fr;
  }
}
```

#### Grille Asymétrique

```css
.asymmetrical-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ds-space-8);
  align-items: center;
}

@media (max-width: 768px) {
  .asymmetrical-grid {
    grid-template-columns: 1fr;
    gap: var(--ds-space-6);
  }
}
```

### Espacement des Éléments

#### Dans une Carte

```css
.card {
  padding: var(--ds-space-5);
  gap: var(--ds-space-4);
}
```

#### Entre Composants

```css
/* Vertical */
.component + .component {
  margin-top: var(--ds-space-4);
}

/* Horizontal */
.component + .component {
  margin-left: var(--ds-space-6);
}
```

---

## Accessibilité

### Règles Générales

1. **Contraste** : Minimum 4.5:1 pour le texte, 3:1 pour les grands textes
2. **Focus** : Toujours visible, minimum 3px
3. **Navigation clavier** : Tab order logique
4. **Touches tactiles** : Minimum 44x44px pour les éléments interactifs
5. **Texte alternatif** : Toujours présent pour les images
6. **Sémantique HTML** : Utiliser les bonnes balises
7. **ARIA** : Utiliser quand la sémantique HTML est insuffisante

### Focus Visible

```css
:focus-visible {
  outline: var(--ds-focus-outline, 3px solid var(--ds-color-primary));
  outline-offset: 2px;
}
```

### Motion Réduite

Voir [Animations et Motion](#animations-et-motion)

### Couleurs et Accessibilité

- **Ne pas** utiliser la couleur seule pour transmettre l'information
- **Toujours** avoir un indicateur supplémentaire (icône, texte, motif)
- **Vérifier** le contraste avec des outils (WebAIM Contrast Checker)

---

## Performance

### Règles de Performance

1. **Images** :
   - Format : WebP (fallback AVIF)
   - Dimensions : Toujours définir `width`, `height`, `sizes`
   - Chargement : `loading="lazy"` pour les images hors viewport
   - Priorité : `priority` seulement pour les images LCP

2. **Polices** :
   - Limiter à 2 polices maximum
   - Utiliser `next/font` pour le chargement
   - Pré-charger les polices critiques
   - `font-display: swap` pour toutes les polices

3. **CSS** :
   - Éviter les propriétés coûteuses (`backdrop-filter`, `box-shadow` lourd)
   - Utiliser `will-change` avec parcimonie
   - Minimiser les animations complexes

4. **JavaScript** :
   - Charger les librairies lourdes dynamiquement
   - Utiliser `next/dynamic` pour les composants lourds
   - Éviter les effets de bord dans `useEffect`
   - Utiliser `requestAnimationFrame` pour les animations JS

5. **Animations** :
   - Préférer CSS à JavaScript
   - Utiliser `transform` et `opacity` (GPU-accelerated)
   - Éviter les animations sur trop d'éléments

### Objectifs Performance

| Métrique | Objectif | Priorité |
|----------|----------|----------|
| LCP | < 2.5s | P0 |
| CLS | < 0.1 | P0 |
| INP | < 200ms | P1 |
| Poids initial | < 1.5MB | P1 |
| Temps de chargement | < 3s | P1 |

### Outils de Mesure

- Lighthouse (intégré à Chrome)
- WebPageTest
- Next.js Analytics

---

## Responsive

### Breakpoints Officiels

| Nom | Largeur | Usage |
|-----|---------|-------|
| `xs` | 390px | Mobile petit |
| `sm` | 768px | Tablette portrait |
| `md` | 1024px | Tablette landscape / Desktop petit |
| `lg` | 1366px | Desktop standard |
| `xl` | 1600px | Desktop large |

### Media Queries

```css
/* Mobile first - min-width */

/* >= 768px */
@media (min-width: 768px) { ... }

/* >= 1024px */
@media (min-width: 1024px) { ... }

/* >= 1366px */
@media (min-width: 1366px) { ... }

/* >= 1600px */
@media (min-width: 1600px) { ... }

/* <= 767px (mobile) */
@media (max-width: 767px) { ... }

/* <= 389px (mobile très petit) */
@media (max-width: 389px) { ... }
```

### Règles Responsive

1. **Mobile First** : Toujours commencer par le style mobile
2. **1 Colonne** : Mobile = 1 colonne principale
3. **Navigation simple** : Menu hamburger ou bottom nav sur mobile
4. **CTA lisibles** : Boutons suffisamment grands
5. **Pas d'overflow horizontal** : Toujours vérifier
6. **Images responsive** : Toujours utiliser `sizes`
7. **Typography responsive** : Utiliser `clamp()` quand nécessaire

### Exemples

#### Grille Responsive

```css
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--ds-space-4);
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--ds-space-6);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

#### Texte Responsive

```css
.title {
  font-size: clamp(var(--ds-text-2xl), 4vw, var(--ds-text-4xl));
  line-height: 1.1;
}
```

---

## Nomenclature

### Nommage des Classes CSS

1. **Utiliser** BEM-like pour les composants
   - `.card` - bloc
   - `.card__header` - élément
   - `.card--featured` - modificateur

2. **Utiliser** des noms sémantiques
   - `.primary-cta` - CTA principal
   - `.secondary-action` - Action secondaire
   - `.hero-section` - Section hero

3. **Éviter** les noms génériques
   - ❌ `.div1`, `.box`, `.container2`
   - ✅ `.feature-card`, `.testimonial-item`

### Nommage des Variables

1. **Tokens** : `--ds-{category}-{name}`
   - `--ds-color-primary`
   - `--ds-space-4`
   - `--ds-radius-lg`

2. **Variables locales** : `--{component}-{property}`
   - `--card-bg`
   - `--button-hover`

### Nommage des Composants

1. **PascalCase** pour les composants React
   - `HeroSection`
   - `FeatureCard`
   - `PrimaryButton`

2. **kebab-case** pour les fichiers
   - `hero-section.tsx`
   - `feature-card.module.scss`

3. **Noms descriptifs**
   - ✅ `UserProfileCard`
   - ❌ `Card3`, `Component`

---

## Mise à jour du Master Plan

### Statuts

- ✅ **Design System audit** : Terminé
- ✅ **Règles globales définies** : Terminé
- 🟡 **Tokens mis à jour** : En cours
- ⏸️ **Composants créés** : Reporté à Phase 2
- ⏸️ **Home refactorée** : Reporté à Phase 3

### Priorités

- **P0** : Correction des problèmes de performance critiques
- **P1** : Migration des tokens et harmonisation
- **P2** : Création des nouveaux composants partagés
- **P3** : Optimisation et polissage

### Prochaine Action

Passer à la **PHASE 2** : Mise à jour du Design System avec les nouvelles règles.
