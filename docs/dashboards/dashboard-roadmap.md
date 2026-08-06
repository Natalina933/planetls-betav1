# Roadmap de convergence des dashboards PlanetLS

Date: 2026-08-06

## But

Transformer progressivement les dashboards PlanetLS en une famille coherente, sans casser les parcours existants ni fusionner artificiellement les logiques owner, concierge, provider et admin.

## Principes

1. La convergence porte d'abord sur la composition, pas sur les fetchs ni sur les regles metier.
2. Les pages d'entree priment sur les pages secondaires.
3. Une page n'entre dans la convergence que si ses donnees et ses permissions sont deja suffisamment stables.
4. Les strates legacy encore actives servent de transition, pas de cible.

## Sequence recommandee

### Lot 1 — Stabiliser le socle partage

- Perimetre : `UnifiedRoleDashboard`, `UnifiedSpotlightList`, `UnifiedStatStack`, styles communs.
- Statut : engage.
- Objectif : finir l'homogeneisation des homes `owner`, `concierge`, `provider`, `admin`.
- Sortie attendue : memes primitives pour hero, KPI, priorites, activite et raccourcis, avec personnalites de role conservees.

### Lot 2 — Consolider l'admin secondaire

- Perimetre : `/dashboard/admin/controle`, puis `/dashboard/admin/pilotage`.
- Pourquoi maintenant : ce sont les pages secondaires les plus exposees et les plus visibles dans la dette de double strate.
- Sortie attendue : abandon progressif de `DashboardLayout` sur les parcours admin majeurs.

### Lot 3 — Converger les modules coeur owner et concierge autour de la chronologie partagee

- Perimetre : owner `missions/voyageurs`, `planning`, concierge `sejours`, `planning`, `reservations`.
- Pourquoi maintenant : la reservation canonique existe deja et doit devenir la meme histoire visible des deux cotes.
- Sortie attendue : cartes, aside, timeline et etats coherents entre proprietaire et conciergerie.

### Lot 4 — Reprendre les overviews legacy

- Perimetre : pages `overview` encore branchees sur `SimpleOverviewWorkspace` et `WorkspacePageShell`.
- Pourquoi plus tard : ces pages restent utiles mais ne sont pas le meilleur levier de perception produit immediate.
- Sortie attendue : remplacement progressif par des variantes plus legeres du socle partage.

### Lot 5 — Rationaliser les modules experts et annexes

- Perimetre : CRM, finances detaillees, Centre IA, decisions architecture, risk register, prototypes premium.
- Pourquoi en dernier : forte valeur, mais faible urgence pour la coherence du cockpit quotidien.
- Sortie attendue : arbitrage clair entre `a integrer`, `a garder specialise`, `a ne pas etendre`.

## Ce qu'il ne faut pas faire

- Ne pas relancer une refonte simultanee des quatre espaces.
- Ne pas imposer un composant universel a des modules dont les donnees sont encore hybrides.
- Ne pas etendre les patterns legacy juste pour aller plus vite.
- Ne pas utiliser le prototype premium owner avec mock data comme reference d'integration.

## Risques a surveiller

- Dette visuelle masquee par une home harmonisee alors que les pages secondaires divergent encore fortement.
- Surpromesse UX sur des modules dont la source canonique est encore en transition.
- Regressions mobiles cote provider si la convergence devient trop desktop-first.
- Dette de gouvernance si les migrations et les types Supabase restent partiellement desynchronises.

## Definition de succes

- Les quatre homes se lisent comme une meme famille de produit.
- Les surfaces secondaires les plus frequentes n'utilisent plus la double strate legacy quand une alternative partagee existe.
- Les modules owner et concierge qui parlent d'un meme sejour racontent la meme chronologie.
- L'admin garde ses usages experts sans retomber dans une UI a part.
