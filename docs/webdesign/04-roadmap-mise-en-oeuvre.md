# PlanetLS - Roadmap de Mise en Œuvre UX/UI

*Mise à jour : 9 septembre 2026*
*Version : 1.1*
*Statut : socle validé techniquement ; Home intégrée*

Le périmètre courant de phase 2 est celui confirmé par l’utilisateur : 2.1 tokens, 2.2 `HeroSection` et `Section`, 2.3 hooks d’animation, 2.4 documentation, 2.5 validation. Le Master Plan reste la référence de statut. Les estimations et listes détaillées d’origine ci-dessous constituent le plan initial, pas une preuve de livraison ni une demande d’ajouter tous les composants envisagés.

| Lot courant | État au 9 septembre 2026 | Preuves |
| --- | --- | --- |
| 2.1 Couleurs, motion, alias Home, espacements | ✅ Terminé | `tokens.css`, exports `spacing` et `motion` ; source CSS unique |
| 2.2 HeroSection et Section | ✅ Terminé | Variantes, responsive, ornements décoratifs, ordre de StorySection |
| 2.3 Hooks d’animation | ✅ Terminé | Reveal progressif, cascade nettoyée, parallax borné et arrêt dynamique |
| 2.4 Documentation | ✅ Terminé | `DESIGN_SYSTEM.md`, `src/components/ui/README.md`, exemples dans les fondations |
| 2.5 Validation technique | ✅ Terminé | Cinq tests navigateur réussis ; lint, TypeScript et build réussis (187 pages statiques) |
| Phase 3 Home | 🟡 En cours | Structure intégrée ; recette utilisateur, WCAG complet et performances production restent distincts |

Les composants additionnels imaginés dans le plan initial, la migration globale des polices et le traitement de tous les anciens assets restent hors du socle courant. Les ressources éditoriales non publiées restent affichées « en préparation ».

---

## Vue d'Ensemble

Ce document décrit le **plan de mise en œuvre progressif** de la direction UX/UI PlanetLS, selon les 5 phases définies dans le brief.

**Objectif global** : Transformer PlanetLS en une plateforme **belle, claire, intuitive, chaleureuse, moderne, performante, responsive, légèrement animée et cohérente**.

---

## Phases et Calendrier

| Phase | Période | Périmètre | Statut | Livrables |
|-------|---------|-----------|--------|-----------|
| **PHASE 1** | Semaine 1 | Audit + Règles Globales | ✅ **Terminé** | 01-brief.md, 02-audit-existant.md, 03-regles-globales.md |
| **PHASE 2** | Semaines 2-4 | Design System / Composants Fondamentaux | ✅ Terminé | Socle courant documenté et validé techniquement |
| **PHASE 3** | Semaines 5-7 | Refonte Home | 🟡 En cours | Home intégrée, recette et mesures à compléter |
| **PHASE 4** | Semaines 8-12 | Pages Publiques | ⏸️ **En attente** | Parcours, About, Contact, Landing |
| **PHASE 5** | Semaines 13-16 | Dashboards | ⏸️ **En attente** | Owner, Concierge, Provider dashboards |

---

## PHASE 1 - Audit + Règles Globales ✅

### Objectif
Comprendre l'état actuel et définir les règles qui guideront toute la refonte.

### Sous-Phases

#### 1.1 Audit Complet (TERMINÉ)
- ✅ Audit des tokens CSS existants
- ✅ Inventaire des composants UI
- ✅ Analyse des pages publiques (Home, Parcours, About, Contact)
- ✅ Analyse des dashboards (Owner, Concierge, Provider, Admin)
- ✅ Identification des animations et dépendances
- ✅ Identification des incohérences UI
- ✅ Identification des doublons
- ✅ Identification des causes de lenteur
- ✅ Documentation dans `02-audit-existant.md`

#### 1.2 Règles Globales (TERMINÉ)
- ✅ Définition de la philosophie de design
- ✅ Système de tokens standardisé
- ✅ Règles de typographie
- ✅ Palette de couleurs harmonisée
- ✅ Échelle d'espacement
- ✅ Système d'animation (motion)
- ✅ Règles de composition
- ✅ Règles d'accessibilité
- ✅ Règles de performance
- ✅ Règles responsive
- ✅ Documentation dans `03-regles-globales.md`

### Livrables Phase 1
- [x] `docs/webdesign/01-brief.md` - Brief initial
- [x] `docs/webdesign/02-audit-existant.md` - Audit complet
- [x] `docs/webdesign/03-regles-globales.md` - Règles globales
- [x] `docs/webdesign/04-roadmap-mise-en-oeuvre.md` - Cette roadmap

### Validation Phase 1
- [x] Toutes les incohérences majeures identifiées
- [x] Toutes les règles définies et documentées
- [x] Priorités établies
- [x] Dependances identifiées

---

## PHASE 2 - Design System / Composants Fondamentaux

### Objectif
Mettre à jour le Design System existant avec les nouvelles règles et créer les composants fondamentaux manquant.

### Durée Estimée
**3 semaines** (ou selon disponibilité)

### Tâches par Semaine

#### Semaine 2 : Mise à jour des Tokens

**Priorité : P0-P1**

| Tâche | Description | Effort | Statut |
|-------|-------------|--------|--------|
| 2.1.1 | Mettre à jour `tokens.css` avec les nouvelles couleurs | 4h | ⏸️ |
| 2.1.2 | Harmoniser les tokens `--home-*` avec `--ds-*` | 4h | ⏸️ |
| 2.1.3 | Ajouter les tokens motion manquants | 2h | ⏸️ |
| 2.1.4 | Standardiser l'échelle d'espacement | 4h | ⏸️ |
| 2.1.5 | Harmoniser les rayons et ombres | 2h | ⏸️ |
| 2.1.6 | Créer le mapping complet des couleurs | 4h | ⏸️ |
| 2.1.7 | Mettre à jour les exports TypeScript | 4h | ⏸️ |

**Livrable** : `src/styles/tokens/tokens.css` version 2.0

#### Semaine 3 : Composants Partagés

**Priorité : P1-P2**

| Tâche | Description | Effort | Statut |
|-------|-------------|--------|--------|
| 2.2.1 | Créer `HeroSection` composant réutilisable | 8h | ⏸️ |
| 2.2.2 | Créer `FeatureSection` composant | 8h | ⏸️ |
| 2.2.3 | Créer `CardGrid` composant | 6h | ⏸️ |
| 2.2.4 | Créer `CTASection` composant | 4h | ⏸️ |
| 2.2.5 | Créer `TestimonialSection` composant | 6h | ⏸️ |
| 2.2.6 | Créer `StatsDisplay` composant | 4h | ⏸️ |
| 2.2.7 | Mettre à jour `Button` avec les nouveaux styles | 4h | ⏸️ |
| 2.2.8 | Mettre à jour `Card` avec les nouveaux styles | 4h | ⏸️ |

**Livrable** : Nouveaux composants dans `src/components/ui/`

#### Semaine 4 : Système d'Animation et Performance

**Priorité : P1**

| Tâche | Description | Effort | Statut |
|-------|-------------|--------|--------|
| 2.3.1 | Créer le hook `useReveal` standardisé | 4h | ⏸️ |
| 2.3.2 | Créer le hook `useParallax` | 4h | ⏸️ |
| 2.3.3 | Standardiser `prefers-reduced-motion` | 4h | ⏸️ |
| 2.3.4 | Optimiser les images (WebP/AVIF) | 8h | ⏸️ |
| 2.3.5 | Configurer `next/font` pour les polices | 4h | ⏸️ |
| 2.3.6 | Créer les animations CSS standard | 4h | ⏸️ |
| 2.3.7 | Documenter le système d'animation | 4h | ⏸️ |

**Livrable** : Système d'animation complet et optimisé

#### Semaine 4 (suite) : Documentation et Validation

| Tâche | Description | Effort | Statut |
|-------|-------------|--------|--------|
| 2.4.1 | Mettre à jour `DESIGN_SYSTEM.md` | 4h | ⏸️ |
| 2.4.2 | Mettre à jour `src/components/ui/README.md` | 4h | ⏸️ |
| 2.4.3 | Créer la documentation des nouveaux composants | 4h | ⏸️ |
| 2.4.4 | Valider l'accessibilité des composants | 4h | ⏸️ |
| 2.4.5 | Valider la performance des composants | 4h | ⏸️ |
| 2.4.6 | Lint et tests des composants | 4h | ⏸️ |

**Livrable** : Documentation complète et validée

### Points de Validation Phase 2
- [ ] Tous les tokens mis à jour selon les règles globales
- [ ] Tous les composants partagés créés et documentés
- [ ] Le système d'animation standardisé et accessible
- [ ] Les performances optimisées (images, polices)
- [ ] La documentation mise à jour
- [ ] Les tests passent
- [ ] Le lint passe

---

## PHASE 3 - Refonte Home

### Objectif
Appliquer les nouvelles règles à la page Home pour créer une **expérience immersive, animée et performante**.

### Durée Estimée
**3 semaines**

### Structure Cible

```
Home (Nouvelle Structure)
├── Hero Immersif
│   ├── Image/Video background
│   ├── Overlay avec gradient
│   ├── Contenu principal (titre, sous-titre, CTA)
│   └── Motif 1900 animé (filigrane)
├── Storytelling
│   ├── Section "Une gestion plus simple"
│   └── Étapes illustrées avec animations reveal
├── Comment ça marche
│   ├── Explication claire
│   └── Visuel processus
├── Showcase Produit
│   ├── Capture dashboard
│   └── Fonctionnalités clés
├── 3 Profils
│   ├── Carte Propriétaire
│   ├── Carte Concierge
│   └── Carte Artisan
├── Réseau
│   └── Explication de l'écosystème
├── Conciergeries
│   └── Liste/Grille des conciergeries
├── Guides
│   └── Articles du carnet PlanetLS
├── CTA Final
│   ├── Message fort
│   └── Boutons principaux
└── Footer
    ├── Logo + Tagline
    ├── Navigation
    └── Copyright
```

### Tâches par Semaine

#### Semaine 5 : Conception et Préparation

| Tâche | Description | Effort | Dépendances |
|-------|-------------|--------|-------------|
| 3.1.1 | Finaliser le design de la nouvelle Home | 8h | Phase 2 |
| 3.1.2 | Créer les maquettes (Figma/Code) | 8h | 3.1.1 |
| 3.1.3 | Définir la stratégie d'animation | 4h | 3.1.1 |
| 3.1.4 | Préparer les assets (images, vidéos) | 8h | 3.1.1 |
| 3.1.5 | Optimiser les images WebP/AVIF | 4h | 3.1.4 |

**Livrable** : Maquettes et assets prêts

#### Semaine 6 : Développement Structurel

| Tâche | Description | Effort | Dépendances |
|-------|-------------|--------|-------------|
| 3.2.1 | Créer le layout de base | 4h | Phase 2 |
| 3.2.2 | Implémenter le Hero immersif | 8h | Phase 2, 3.1 |
| 3.2.3 | Implémenter Storytelling | 8h | Phase 2, 3.1 |
| 3.2.4 | Implémenter "Comment ça marche" | 8h | Phase 2, 3.1 |
| 3.2.5 | Implémenter Showcase produit | 4h | Phase 2, 3.1 |

**Livrable** : Structure de base fonctionnelle

#### Semaine 7 : Développement Contenu et Animation

| Tâche | Description | Effort | Dépendances |
|-------|-------------|--------|-------------|
| 3.3.1 | Implémenter les 3 profils | 8h | Phase 2, 3.1 |
| 3.3.2 | Implémenter section Réseau | 4h | Phase 2, 3.1 |
| 3.3.3 | Implémenter section Conciergeries | 8h | Phase 2, 3.1 |
| 3.3.4 | Implémenter section Guides | 4h | Phase 2, 3.1 |
| 3.3.5 | Implémenter CTA final | 4h | Phase 2, 3.1 |
| 3.3.6 | Implémenter Footer | 4h | Phase 2, 3.1 |
| 3.3.7 | Ajouter les animations (reveal, fade, parallax) | 8h | Phase 2, 3.1 |
| 3.3.8 | Ajouter le motif 1900 animé | 4h | Phase 2, 3.1 |

**Livrable** : Home complète avec animations

#### Semaine 7 (suite) : Optimisation et Validation

| Tâche | Description | Effort | Dépendances |
|-------|-------------|--------|-------------|
| 3.4.1 | Optimiser les performances | 8h | 3.3 |
| 3.4.2 | Valider l'accessibilité | 4h | 3.3 |
| 3.4.3 | Valider le responsive (1600, 1366, 1024, 768, 390) | 8h | 3.3 |
| 3.4.4 | Mesurer LCP, CLS, INP | 4h | 3.4.1 |
| 3.4.5 | Lint et tests | 4h | 3.3 |
| 3.4.6 | Recette utilisateur | 4h | 3.4 |

**Livrable** : Home validée, performante et accessible

### Points de Validation Phase 3
- [ ] Design immersif et élégant
- [ ] Hiérarchie visuelle claire
- [ ] Animations subtiles et élégantes
- [ ] Performance optimisée (LCP < 2.5s, CLS < 0.1)
- [ ] Accessibilité validée (WCAG AA)
- [ ] Responsive validé sur tous les breakpoints
- [ ] Cohérent avec les règles globales
- [ ] Tests passent
- [ ] Lint passe

---

## PHASE 4 - Pages Publiques

### Objectif
Appliquer les nouvelles règles à toutes les pages publiques.

### Durée Estimée
**5 semaines** (1 page par semaine environ)

### Pages à Traiter

| Page | Priorité | Complexité | Livraison |
|------|----------|------------|-----------|
| `/parcours` | P0 | Moyenne | Semaine 8 |
| `/about` | P1 | Faible | Semaine 9 |
| `/contact` | P1 | Faible | Semaine 9 |
| `/landing-page` | P2 | Moyenne | Semaine 10 |
| `/concierges` | P2 | Élevée | Semaines 11-12 |
| `/map-list` | P3 | Élevée | Semaines 11-12 |

### Tâches par Page

Pour chaque page, les tâches sont :

1. **Audit** : Vérifier l'état actuel vs règles globales (2h)
2. **Conception** : Définir la nouvelle structure (4h)
3. **Développement** : Implémenter selon les règles (8-16h selon complexité)
4. **Animation** : Ajouter les animations subtiles (4h)
5. **Optimisation** : Optimiser performance et accessibilité (4h)
6. **Validation** : Tests, lint, recette (4h)

### Semaines 8-9 : Pages Simples

**Pages** : `/parcours`, `/about`, `/contact`

| Tâche | Effort | Semaine |
|-------|--------|--------|
| Refonte `/parcours` | 24h | 8 |
| Refonte `/about` | 16h | 9 |
| Refonte `/contact` | 16h | 9 |

### Semaine 10 : Landing Page

| Tâche | Effort | Semaine |
|-------|--------|--------|
| Refonte `/landing-page` | 24h | 10 |

### Semaines 11-12 : Pages Complexes

**Pages** : `/concierges`, `/map-list`

| Tâche | Effort | Semaines |
|-------|--------|---------|
| Refonte `/concierges` | 32h | 11-12 |
| Refonte `/map-list` | 32h | 11-12 |

### Points de Validation Phase 4
- [ ] Toutes les pages publiques refondues
- [ ] Cohérence visuelle entre toutes les pages
- [ ] Animations subtiles et performantes
- [ ] Accessibilité validée sur toutes les pages
- [ ] Responsive validé sur tous les breakpoints
- [ ] Performance optimisée sur toutes les pages
- [ ] Tests passent sur toutes les pages

---

## PHASE 5 - Dashboards

### Objectif
Appliquer les nouvelles règles aux dashboards, en respectant le principe : **1 état important + 4 KPI max + 1 action principale**.

### Durée Estimée
**4 semaines**

### Dashboards à Traiter

| Dashboard | Priorité | Rôle | Complexité |
|-----------|----------|------|------------|
| Concierge | P0 | Concierge | Élevée |
| Owner | P0 | Propriétaire | Élevée |
| Provider | P1 | Artisan | Moyenne |
| Admin | P2 | Administrateur | Élevée |

### Règles Spécifiques Dashboards

1. **Design sobre** : Moins d'animations, plus de clarté
2. **Animations autorisées** : hover, micro-transitions, loading states, changements de statut
3. **Structure** : 1 état urgent/calme + 4 KPI max + 1 action principale
4. **Hiérarchie** : Information la plus importante en haut
5. **Navigation** : Sidebar compacte, header clair
6. **Cartes** : Uniformes, avec rayons et ombres standard

### Tâches par Dashboard

Pour chaque dashboard :

1. **Audit** : Vérifier l'état actuel vs règles (4h)
2. **Conception** : Définir la nouvelle structure (8h)
3. **Composants** : Créer/adapter les composants spécifiques (8h)
4. **Développement** : Implémenter la nouvelle interface (16-24h)
5. **Intégration** : Connecter avec les données existantes (8h)
6. **Optimisation** : Optimiser performance (4h)
7. **Validation** : Tests, lint, recette (4h)

### Semaines 13-14 : Dashboards Principaux

**Dashboards** : Concierge, Owner

| Tâche | Effort | Semaines |
|-------|--------|---------|
| Refonte Dashboard Concierge | 40h | 13-14 |
| Refonte Dashboard Owner | 40h | 13-14 |

### Semaines 15-16 : Dashboards Secondaires

**Dashboards** : Provider, Admin

| Tâche | Effort | Semaines |
|-------|--------|---------|
| Refonte Dashboard Provider | 32h | 15 |
| Refonte Dashboard Admin | 32h | 16 |

### Points de Validation Phase 5
- [ ] Tous les dashboards refondus
- [ ] Respect de la règle "1+4+1" (1 état + 4 KPI + 1 action)
- [ ] Design sobre et professionnel
- [ ] Accessibilité validée
- [ ] Performance optimisée
- [ ] Fonctionnalités existantes préservées
- [ ] Tests passent

---

## Tâches Transversales (Toutes Phases)

### Accessibilité
- [ ] Vérifier le contraste sur tous les éléments
- [ ] Valider la navigation clavier
- [ ] Tester avec les lecteurs d'écran
- [ ] Respecter WCAG AA minimum

### Performance
- [ ] Mesurer LCP, CLS, INP après chaque livraison
- [ ] Optimiser les images (WebP/AVIF)
- [ ] Minimiser le JS
- [ ] Éviter les renders bloquants

### Tests
- [ ] Tests unitaires pour les composants
- [ ] Tests d'intégration pour les pages
- [ ] Tests E2E pour les parcours critiques
- [ ] Tests visuels (régression)

### Documentation
- [ ] Documenter chaque composant
- [ ] Documenter chaque page
- [ ] Mettre à jour le Design System
- [ ] Mettre à jour le Master Plan

---

## Ressources et Outils

### Outils de Design
- **Figma** : Maquettes et prototypes
- **Adobe Color** : Palette de couleurs
- **WebAIM Contrast Checker** : Accessibilité
- **Coolors** : Génération de palette

### Outils de Développement
- **Next.js** : Framework principal
- **TypeScript** : Typage
- **SCSS** : Styles
- **Framer Motion** : Animations (si nécessaire)
- **IntersectionObserver API** : Reveal au scroll
- **Next/Image** : Images optimisées
- **next/font** : Polices optimisées

### Outils de Test
- **Jest** : Tests unitaires
- **Playwright** : Tests E2E
- **Lighthouse** : Performance et accessibilité
- **WebPageTest** : Performance avancée
- **BrowserStack** : Tests cross-browser

### Outils de Monitoring
- **Next.js Analytics** : Performance réelle
- **Sentry** : Erreurs
- **Hotjar** : Comportement utilisateur

---

## Critères de Réussite

### Critères Globaux
- [ ] Design **beau, clair, intuitif, chaleureux, moderne**
- [ ] Expérience **performante et responsive**
- [ ] Animations **subtiles, élégantes, fonctionnelles**
- [ ] Cohérence **visuelle sur toutes les pages**
- [ ] Accessibilité **WCAG AA minimum**

### Critères Techniques
- [ ] **LCP** < 2.5s sur toutes les pages
- [ ] **CLS** < 0.1 sur toutes les pages
- [ ] **INP** < 200ms sur toutes les pages
- [ ] **Poids initial** < 1.5MB
- [ ] **Temps de chargement** < 3s
- [ ] **Score Lighthouse** > 90 (Performance, Accessibilité, SEO, Best Practices)

### Critères Fonctionnels
- [ ] Toutes les fonctionnalités existantes **préservées**
- [ ] Aucune **régression** introduite
- [ ] Tous les **tests passent**
- [ ] Le **lint passe**
- [ ] Le **build réussit**

---

## Risques et Atténuation

### Risques Techniques

| Risque | Probabilité | Impact | Atténuation |
|--------|-------------|--------|-------------|
| Régression fonctionnelle | Moyenne | Élevé | Tests complets, recette utilisateur |
| Performance dégradée | Faible | Élevé | Mesures avant/après, optimisation continue |
| Problèmes de compatibilité | Moyenne | Moyen | Tests cross-browser, polyfills si nécessaire |
| Détérioration de l'accessibilité | Faible | Élevé | Audit accessibilité à chaque phase |

### Risques Organisationnels

| Risque | Probabilité | Impact | Atténuation |
|--------|-------------|--------|-------------|
| Retard sur le calendrier | Moyenne | Moyen | Priorisation flexible, livraisons incrémentales |
| Changement de priorités | Moyenne | Moyen | Validation régulière avec stakeholders |
| Ressources insuffisantes | Faible | Élevé | Planification réaliste, focus sur l'essentiel |

### Risques Design

| Risque | Probabilité | Impact | Atténuation |
|--------|-------------|--------|-------------|
| Incohérence visuelle | Faible | Moyen | Design System centralisé, review systématique |
| Animations trop lourdes | Faible | Moyen | Tests de performance, prefers-reduced-motion |
| Design non intuitive | Faible | Élevé | Tests utilisateurs, itérations |

---

## Validation et Recette

### Processus de Validation

1. **Review de Code** : Pour chaque PR
2. **Tests Automatiques** : Lint, Jest, Playwright
3. **Review Design** : Validation visuelle
4. **Recette Utilisateur** : Tests manuels
5. **Mesures Performance** : Lighthouse, WebPageTest
6. **Validation Accessibilité** : Outils automatisés + manuels

### Checklist de Recette par Page

- [ ] Design conforme aux maquettes
- [ ] Responsive validé (1600, 1366, 1024, 768, 390px)
- [ ] Accessibilité validée (contraste, clavier, screen reader)
- [ ] Performance validée (LCP, CLS, INP)
- [ ] Fonctionnalités existantes préservées
- [ ] Animations subtiles et accessibles
- [ ] Cohérence avec le Design System

---

## Prochaines Étapes

### Préparation initiale de la phase 2 (historique)

1. **Valider** les documents de la PHASE 1
2. **Prioriser** les tâches de la PHASE 2
3. **Assigner** les ressources
4. **Planifier** le kickoff de la PHASE 2
5. **Configurer** l'environnement de travail

### Livrables Immédiats

- [x] **01-brief.md** - Brief initial ✅
- [x] **02-audit-existant.md** - Audit complet ✅
- [x] **03-regles-globales.md** - Règles globales ✅
- [x] **04-roadmap-mise-en-oeuvre.md** - Roadmap ✅

### Actions initialement prévues (historique)

1. **Approuver** les documents de la PHASE 1
2. **Démarrer** la PHASE 2 avec la mise à jour des tokens
3. **Planifier** les revues régulières
4. **Configurer** les outils de monitoring
5. **Préparer** les assets nécessaires

---

## Mise à jour du Master Plan

### Statuts

- ✅ **PHASE 1** : Audit + Règles Globales - **TERMINÉ**
- ✅ **PHASE 2** : Socle Design System courant - **TERMINÉ**
- 🟡 **PHASE 3** : Home - **EN COURS**
- ⏸️ **PHASE 4** : Pages Publiques - **EN ATTENTE**
- ⏸️ **PHASE 5** : Dashboards - **EN ATTENTE**

### Priorités

- **P1** : PHASE 2 (Design System) - Consolidation du socle
- **P1** : PHASE 3 (Home) - Prioritaire après Phase 2
- **P2** : PHASE 4 (Pages Publiques)
- **P3** : PHASE 5 (Dashboards)

### Prochaine Action

**Poursuivre la recette utilisateur, l’audit WCAG complet et les mesures de production de la Home.**

---

## Annexes

### Annexe A : Glossaire

| Terme | Définition |
|-------|------------|
| **Token** | Variable CSS représentant une valeur de design (couleur, espace, etc.) |
| **Primitive** | Composant UI de base (Button, Input, Card) |
| **Composant** | Élément réutilisable composé de primitives |
| **LCP** | Largest Contentful Paint - Temps de chargement du plus gros élément |
| **CLS** | Cumulative Layout Shift - Déplacement cumulé du layout |
| **INP** | Interaction to Next Paint - Temps de réponse aux interactions |
| **FOUT** | Flash of Unstyled Text - Texte non stylé pendant le chargement |
| **WCAG** | Web Content Accessibility Guidelines - Normes d'accessibilité |

### Annexe B : Références

- [Brief Initial](01-brief.md)
- [Audit Existant](02-audit-existant.md)
- [Règles Globales](03-regles-globales.md)
- [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md)
- [src/components/ui/README.md](../../src/components/ui/README.md)

### Annexe C : Contacts

- **Design Lead** : À désigner
- **Dev Lead** : À désigner
- **Product Owner** : À désigner
- **Stakeholders** : À identifier

---

*Document généré le 8 septembre 2026 - Ready for implementation*
