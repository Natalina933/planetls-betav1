# Audit Supabase Admin

Date: `2026-06-16`

## Tables confirmées en base

- `profiles`
- `properties`
- `missions`
- `service_requests`
- `service_request_recipients`
- `quotes`
- `invoices`
- `planning_entries`
- `services_pricing`
- `profile_services`
- `provider_clients`
- `provider_interventions`
- `provider_alerts`
- `provider_conversations`
- `provider_messages`
- `owner_invitations`
- `owner_concierge_links`
- `workflow_events`
- `onboarding_events`
- `concierge_daily_checklist`
- `concierge_absences`

## Colonnes utiles confirmées

### `profiles`

- `id`
- `email`
- `username`
- `first_name`
- `last_name`
- `role`
- `category`
- `company_name`
- `city`
- `phone`
- `status`
- `created_at`
- `updated_at`
- `onboarding_complete`
- `onboarding_completed_at`

### `missions`

- `id`
- `owner_profile_id`
- `concierge_profile_id`
- `service_request_id`
- `status`
- `workflow_status`
- `priority`
- `scheduled_start`
- `scheduled_end`

### `service_requests`

- `id`
- `owner_profile_id`
- `property_id`
- `selected_concierge_profile_id`
- `requested_services`
- `status`
- `workflow_status`
- `mission_id`
- `city`
- `region`
- `radius_km`
- `created_at`
- `updated_at`

## Tables à utiliser pour l'espace admin

### Base utilisateurs

Source principale:
- `profiles`

Compléments:
- `auth.users` via `supabase.auth.admin.listUsers()`
- `onboarding_events`

Objectif:
- connexions récentes
- emails confirmés
- onboarding terminé
- comptes jamais connectés
- coordonnées manquantes

### Propriétaires

Sources:
- `profiles`
- `properties`
- `missions`
- `service_requests`

Objectif:
- nombre de propriétaires
- logements par propriétaire
- missions liées
- demandes émises

### Conciergeries

Sources:
- `profiles`
- `missions`
- `service_request_recipients`
- `service_requests`

Objectif:
- demandes reçues
- missions gérées
- activation du compte
- complétude du profil

### Artisans

Sources:
- `profiles`
- `services_pricing`
- `provider_clients`
- `provider_interventions`

Objectif:
- tarifs configurés
- clients reliés
- interventions suivies
- activation du compte

### Suivi opérationnel plateforme

Sources:
- `service_requests`
- `quotes`
- `missions`
- `invoices`
- `workflow_events`
- `planning_entries`

Objectif:
- blocages
- devis acceptés sans mission
- missions en retard
- activité workflow
- volume planning

## Décisions retenues

- l'API admin doit s'appuyer d'abord sur `profiles`
- les métriques admin ne doivent plus dépendre d'un champ `type` non fiable
- les métriques artisan doivent utiliser `provider_clients` et `services_pricing`
- les métriques conciergerie doivent utiliser `service_request_recipients` et `missions`
- les métriques de connexion doivent venir de `auth.users`, pas d'un cache frontend
