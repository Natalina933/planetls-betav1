---
name: "PlanetLS Design"
description: "Règles de conception, refactorisation et intégration UI/UX pour PlanetLS. À utiliser avant toute modification visuelle d'une page, d'un dashboard ou d'un composant."
---

# PlanetLS — Design Skill

## 1. Objectif

Ce fichier définit la manière dont un agent IA ou un développeur doit
intervenir sur l'interface de PlanetLS.

Il ne constitue PAS une nouvelle source de Design System.

Il ne doit pas :

- créer une deuxième palette de couleurs ;
- définir une nouvelle typographie globale ;
- remplacer les tokens existants ;
- créer un nouveau système de composants parallèle ;
- remplacer les thèmes existants ;
- réinventer les règles métier.

Son rôle est d'expliquer comment utiliser correctement le Design System
PlanetLS existant.

---

# 2. Source de vérité

Avant toute modification visuelle, consulter les sources existantes du projet.

## Source canonique des tokens

La source de vérité principale est :

`src/styles/tokens/tokens.css`

Elle contient notamment les tokens modernes :

`--ds-*`

Les couleurs, backgrounds, états, bordures, rayons, ombres,
typographies, espacements, dimensions, focus et transitions doivent
provenir autant que possible de ces tokens.

Ne jamais recopier une valeur existante dans une nouvelle variable simplement
pour faciliter une implémentation locale.

---

# 3. Ordre de priorité

Lors d'une modification UI, utiliser cet ordre de priorité :

1. logique métier et comportement existants ;
2. `src/styles/tokens/tokens.css` ;
3. composants existants dans `src/components/ui/` ;
4. compositions existantes dans `src/components/ui/dashboard/` ;
5. composants métier existants dans `src/components/features/` ;
6. documentation du Design System ;
7. styles locaux nécessaires à la page.

Un style local ne doit pas devenir une nouvelle source globale de vérité.

---

# 4. Architecture Design System PlanetLS

L'architecture cible est :

```text
src/styles/tokens/
│
├── tokens.css
│   └── source canonique des tokens --ds-*
│
├── colors.ts
├── spacing.ts
├── typography.ts
├── shadows.ts
├── index.ts
│
├── profileVisualKit.ts
│   └── références visuelles, pas source canonique
│
├── _legacy-variables.scss
├── _legacy-root.scss
│
└── themes/
    └── compatibilité et variantes de thèmes

src/components/ui/
│
├── Button
├── Card
├── Input
├── Select
├── Section
├── DataTable
├── TableFilters
├── Alert
├── AsyncState
├── EmptyState
├── StatsCard
├── PageHeader
└── autres primitives

src/components/ui/dashboard/
└── composants de présentation partagés

src/components/features/
├── admin/
├── owner/
├── concierge/
└── provider/

src/app/design-system/
└── démonstrations et prototypes

src/app/dashboard/
└── parcours métier réels