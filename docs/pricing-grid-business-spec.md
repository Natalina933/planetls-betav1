# Spécification Métier: Grille Tarifaire Concierge (v2)

## Objectif
Rendre le calcul tarifaire lisible, prévisible et extensible pour un concierge:
- devis simples par défaut (base + majorations globales),
- exceptions possibles par service et par contexte,
- résultat traçable.

## Sources de prix
1. `base`: `hourlyRate`, `travelFee`, `minimumInvoice`
2. `globalModifiers`: `urgentPercent`, `nightPercent`, `weekendPercent`, `highSeasonPercent`
3. `serviceOverrides` (optionnel): ajustements ciblés par service
4. `contextRules` (optionnel): règles avancées selon contexte (urgence, nuit, week-end, haute saison, type de bien, etc.)

## Priorité d’application (ordre officiel)
1. `contextRules` (triées par `priority` croissante)
2. `serviceOverrides`
3. `globalModifiers`
4. `base`

Règles de fusion:
- `replace` remplace la valeur courante.
- `delta` ajoute/soustrait à la valeur courante.

## Calcul standard
1. `baseAmount = hourlyRate * durationHours + travelFee + fixedFees`
2. `modifierPercentTotal = somme des modificateurs actifs`
3. `totalBeforeMinimum = baseAmount * (1 + modifierPercentTotal / 100)`
4. appliquer `flatAmount` / `multiplier` des `contextRules` si présents
5. `total = max(totalBeforeMinimum, minimumInvoice)`

## Fallback (obligatoire)
Si `pricing_v2` absent:
- construire un `pricing_v2` en mémoire à partir de l’existant (`hourly_rate`, `travel_fee`, `pricing` legacy),
- calculer avec cette version dérivée,
- ne jamais bloquer le devis.

## Format de stockage (cohabitation)
Dans `availability_hours`:
- conserver `pricing` (legacy) pendant transition,
- écrire aussi `pricing_v2` (source cible),
- synchroniser au minimum: `minimumInvoice` + majorations globales.

## Résultat attendu d’un calcul
Le moteur doit retourner:
- `total`,
- `minimumInvoice` retenu,
- `appliedRules` (ids),
- `appliedModifiers` finaux,
- `totalBeforeMinimum`.

## Exemple métier
Contexte: `ménage`, `urgent`, `week-end`, `haute saison`.
- base: 45 EUR/h, 2h, déplacement 15 EUR, frais fixes 90 EUR
- majorations: urgent +30, week-end +15, haute saison +25
- total avant minimum calculé, puis clamp avec `minimumInvoice`
- si override service “ménage” existe, il s’applique avant les règles contexte.

## Règles produit à respecter
1. Une seule logique officielle de priorité (pas d’exception cachée).
2. Toute règle appliquée doit être explicable dans l’UI ou dans le résultat API.
3. En cas de conflit, la priorité la plus haute gagne.
4. Si aucune règle ne matche, le calcul de base doit toujours produire un total valide.
