# Audit harmonisation UI et architecture front

## Ce qui a ete stabilise

- Les tokens globaux `--ds-*`, `--ui-*` et `--dash-*` servent maintenant de reference commune pour les primitives UI.
- Les controles partagent des hauteurs standardisees: `--ds-control-height-sm`, `--ds-control-height-md`, `--ds-control-height-lg`.
- Les transitions, focus rings, rayons, ombres et couleurs de preuve/confiance sont centralises.
- Les mixins SCSS `ui-control-shell`, `ui-control-focus`, `ui-card-shell`, `ui-label`, `ui-hover-lift` reduisent les duplications.
- Les composants `Button`, `Card`, `Input`, `Select`, `Textarea`, `Badge`, `Section` et `StatsCard` utilisent davantage le socle commun.

## Regles UI recommandees

- Utiliser `Card`, `Button`, `Input`, `Select`, `Textarea`, `Badge`, `StatsCard` avant de creer un style local.
- Limiter les rayons a `--ds-radius-sm/md/lg` ou au mode Art Deco `4px`.
- Garder les boutons a 44px minimum pour l'accessibilite tactile.
- Garder les ombres faibles par defaut et reserver les ombres fortes aux panneaux actifs ou overlays.
- Utiliser l'or comme accent de decision/preuve, pas comme couleur dominante.
- Eviter les cartes imbriquees: preferer sections, grilles et panneaux adjacents.

## Opportunites suivantes

- Migrer progressivement les pages dashboard vers les primitives UI pour supprimer les variations locales.
- Regrouper les patterns dashboard repetes: header de page, barre de filtres, empty state, table mobile-card, timeline.
- Remplacer les styles de focus ad hoc par les mixins communs.
- Auditer les images de hero et avatars pour `next/image`, dimensions stables et priorite LCP.
- Ajouter des tests visuels ciblant `/design-system`, `/dashboard/owner`, `/dashboard/concierge`, `/dashboard/provider`.
