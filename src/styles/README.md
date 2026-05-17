# Front-End Design System

Ce dossier contient la couche de fondation visuelle partagée du projet.

## Tokens

Les tokens globaux vivent dans `src/styles/_variables.scss`.

Priorité d'usage :

- `--ds-*` pour les fondations globales : couleurs, spacing, rayons, ombres, motions.
- `--ui-*` pour les composants UI réutilisables.
- `--dash-*` pour les interfaces métier des dashboards.

## Mixins

Les mixins réutilisables vivent dans `src/styles/_mixins.scss`.

À privilégier :

- `ui-card-shell` pour les cartes.
- `ui-panel-shell` pour les panels métier.
- `ui-control-shell` et `ui-control-focus` pour champs, selects et textareas.
- `ui-label` pour les labels de formulaires.
- `ui-responsive-grid` pour les grilles de cards.

## Règles UI

- Utiliser les composants de `src/components/ui` avant de créer un nouveau style local.
- Garder les rayons à `8px` pour les surfaces métier, sauf éléments circulaires.
- Éviter les ombres ad hoc : utiliser `--ds-shadow-*`.
- Éviter les couleurs hex locales : utiliser les tokens `--ds-*`, `--ui-*`, `--dash-*`.
- Les dashboards doivent rester denses, lisibles et orientés action, pas marketing.
