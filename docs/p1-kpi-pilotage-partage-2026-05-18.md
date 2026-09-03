# P1 - Pilotage KPI partagé (owner / concierge / artisan)

_Date: 18 mai 2026_

## Objectif
Consolider un tableau de pilotage commun avec des KPI stables, comparables et actionnables.

## KPI cibles (minimum)

### Activation
- `activation_j7_owner`: owner ayant fait >= 3 actions clés en 7 jours.
- `activation_j7_concierge`: concierge ayant fait >= 3 actions clés en 7 jours.
- `activation_j7_provider`: provider ayant fait >= 3 actions clés en 7 jours.

### Vitesse de mise en valeur
- `median_signup_to_first_request_minutes` (owner).
- `median_signup_to_first_response_minutes` (concierge/provider).

### Conversion
- `request_to_quote_rate`.
- `quote_to_mission_rate`.
- `mission_to_paid_invoice_rate`.

### Qualité opérationnelle
- `median_first_message_response_minutes` par profil.
- `missions_completed_rate`.

## Sources de données
- `service_requests`
- `service_request_recipients`
- `quotes`
- `missions`
- `messages` / `conversations`
- `invoices` / `billing events`
- `profiles`

## Convention de calcul
- Fenêtre glissante: 30 jours par défaut.
- Fuseau de calcul: UTC en base, conversion locale uniquement en affichage.
- Null safety: valeur `null` si échantillon < seuil minimum (éviter faux signaux).

## Plan d'implémentation
1. `fait` Créer un endpoint unique: `/api/kpis/overview` (agrégé multi-profils).
2. `fait` Créer un typage partagé `KpiOverviewPayload`.
3. `fait` Brancher l'affichage dans dashboard admin + cartes synthèse par profil.
4. `fait` Ajouter un test de contrat JSON de l’API.

## Contrat JSON proposé
```json
{
  "window_days": 30,
  "generated_at": "2026-05-18T12:00:00Z",
  "owner": {
    "activation_j7": 0,
    "median_signup_to_first_request_minutes": 0,
    "request_to_quote_rate": 0
  },
  "concierge": {
    "activation_j7": 0,
    "median_signup_to_first_response_minutes": 0,
    "quote_to_mission_rate": 0
  },
  "provider": {
    "activation_j7": 0,
    "median_signup_to_first_response_minutes": 0,
    "missions_completed_rate": 0
  },
  "shared": {
    "mission_to_paid_invoice_rate": 0,
    "median_first_message_response_minutes": 0
  }
}
```

## Statut
- `fait` - cadrage KPI partagé prêt.
- `fait` - implémentation endpoint + affichage + test de contrat.
- `en cours` - enrichissement KPI (sources facturation complètes, qualité des seuils d'échantillon, séries temporelles).
