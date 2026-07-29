# Realignement du schema `missions` distant - 29 juillet 2026

## Contexte

Le mercredi 29 juillet 2026, `npm run inspect:remote:admin-schema` a confirme que le schema REST distant expose bien `public.missions`, mais sans publier trois colonnes attendues par le depot :

- `missions.title`
- `missions.request_id`
- `missions.provider_profile_id`

Le code PlanetLS tolere maintenant cette derive cote API admin et KPI, mais seulement via des compatibilites transitoires :

- titre reconstruit depuis `metadata`
- activite provider derivee de `provider_interventions`
- jointures admin/KPI partielles sur les missions

Le correctif SQL pret a execution est fourni dans [docs/sql/2026-07-29-align-remote-missions-schema.sql](/C:/Users/ADMIN/Desktop/planetls-beta/docs/sql/2026-07-29-align-remote-missions-schema.sql).

## Ce que fait le script

1. Ajoute les colonnes manquantes sur `public.missions` si elles n'existent pas encore.
2. Force un `metadata` JSONB propre avec valeur par defaut.
3. Backfill `title` depuis `metadata.mission_title`, `metadata.service_label`, `metadata.property_label`, puis un fallback stable.
4. Backfill `request_id` depuis :
   - `service_requests.mission_id`
   - `metadata.service_request_id`
   - `metadata.request_id`
   - `quotes.mission_id -> quotes.service_request_id`
5. Backfill `provider_profile_id` depuis :
   - `metadata.provider_profile_id`
   - `metadata.assigned_provider_profile_id`
   - le dernier `provider_interventions.metadata.mission_id` connu
6. Ajoute les index et foreign keys manquants.

## Execution recommandee

Dans l'editeur SQL Supabase du projet connecte, executer le contenu de :

- [docs/sql/2026-07-29-align-remote-missions-schema.sql](/C:/Users/ADMIN/Desktop/planetls-beta/docs/sql/2026-07-29-align-remote-missions-schema.sql)

## Verifications apres execution

Verifier que ces requetes reviennent propres :

```sql
select count(*) as missing_titles
from public.missions
where title is null or btrim(title) = '';

select count(*) as linked_requests
from public.missions
where request_id is not null;

select count(*) as linked_providers
from public.missions
where provider_profile_id is not null;
```

Puis relancer :

```bash
npm run inspect:remote:admin-schema
```

Le resultat attendu cote REST est :

- `missions.id,title` : OK
- `missions.id,request_id` : OK
- `missions.id,provider_profile_id` : OK

## Limite volontaire

Ce script n'essaie pas de supprimer d'anciennes colonnes legacy ni de deduire artificiellement un `provider_profile_id` quand aucune preuve fiable n'existe. L'objectif est d'aligner la base distante sur le contrat actuel du code sans introduire de faux liens.
