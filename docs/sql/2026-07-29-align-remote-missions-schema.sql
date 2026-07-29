BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE IF EXISTS public.missions
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS request_id uuid,
  ADD COLUMN IF NOT EXISTS provider_profile_id uuid;

ALTER TABLE IF EXISTS public.missions
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

UPDATE public.missions
SET metadata = '{}'::jsonb
WHERE metadata IS NULL;

ALTER TABLE IF EXISTS public.missions
  ALTER COLUMN metadata SET NOT NULL;

UPDATE public.missions
SET title = COALESCE(
  NULLIF(btrim(title), ''),
  NULLIF(btrim(metadata->>'mission_title'), ''),
  NULLIF(btrim(metadata->>'service_label'), ''),
  NULLIF(btrim(metadata->>'property_label'), ''),
  'Mission ' || left(id::text, 8)
)
WHERE title IS NULL
   OR btrim(title) = '';

ALTER TABLE IF EXISTS public.missions
  ALTER COLUMN title SET DEFAULT 'Mission';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'missions'
      AND column_name = 'title'
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.missions
    WHERE title IS NULL OR btrim(title) = ''
  ) THEN
    ALTER TABLE public.missions
      ALTER COLUMN title SET NOT NULL;
  END IF;
END
$$;

UPDATE public.missions AS m
SET request_id = sr.id
FROM public.service_requests AS sr
WHERE m.request_id IS NULL
  AND sr.mission_id = m.id;

UPDATE public.missions
SET request_id = CASE
  WHEN metadata ? 'service_request_id'
    AND (metadata->>'service_request_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    THEN (metadata->>'service_request_id')::uuid
  WHEN metadata ? 'request_id'
    AND (metadata->>'request_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    THEN (metadata->>'request_id')::uuid
  ELSE request_id
END
WHERE request_id IS NULL;

UPDATE public.missions AS m
SET request_id = q.service_request_id
FROM public.quotes AS q
WHERE m.request_id IS NULL
  AND q.mission_id = m.id
  AND q.service_request_id IS NOT NULL;

UPDATE public.missions
SET provider_profile_id = CASE
  WHEN metadata ? 'provider_profile_id'
    AND (metadata->>'provider_profile_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    THEN (metadata->>'provider_profile_id')::uuid
  WHEN metadata ? 'assigned_provider_profile_id'
    AND (metadata->>'assigned_provider_profile_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    THEN (metadata->>'assigned_provider_profile_id')::uuid
  ELSE provider_profile_id
END
WHERE provider_profile_id IS NULL;

WITH latest_provider_by_mission AS (
  SELECT DISTINCT ON ((pi.metadata->>'mission_id'))
    (pi.metadata->>'mission_id')::uuid AS mission_id,
    pi.provider_profile_id
  FROM public.provider_interventions AS pi
  WHERE pi.provider_profile_id IS NOT NULL
    AND pi.metadata ? 'mission_id'
    AND (pi.metadata->>'mission_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ORDER BY (pi.metadata->>'mission_id'), pi.created_at DESC, pi.id DESC
)
UPDATE public.missions AS m
SET provider_profile_id = latest.provider_profile_id
FROM latest_provider_by_mission AS latest
WHERE m.id = latest.mission_id
  AND m.provider_profile_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'missions_request_id_fkey'
      AND conrelid = 'public.missions'::regclass
  ) THEN
    ALTER TABLE public.missions
      ADD CONSTRAINT missions_request_id_fkey
      FOREIGN KEY (request_id)
      REFERENCES public.service_requests(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'missions_provider_profile_id_fkey'
      AND conrelid = 'public.missions'::regclass
  ) THEN
    ALTER TABLE public.missions
      ADD CONSTRAINT missions_provider_profile_id_fkey
      FOREIGN KEY (provider_profile_id)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_missions_request_id
  ON public.missions(request_id);

CREATE INDEX IF NOT EXISTS idx_missions_provider_profile_id
  ON public.missions(provider_profile_id);

COMMENT ON COLUMN public.missions.title IS
  'Canonical mission label expected by the application and PostgREST.';

COMMENT ON COLUMN public.missions.request_id IS
  'Optional direct relation to the originating service request for admin KPI joins.';

COMMENT ON COLUMN public.missions.provider_profile_id IS
  'Optional direct provider relation, backfilled from mission metadata or provider interventions when available.';

COMMIT;
