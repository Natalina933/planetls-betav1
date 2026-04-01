BEGIN;

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL;

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20);

ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20);

ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_workflow_status_check;
ALTER TABLE public.quotes
  DROP CONSTRAINT IF EXISTS quotes_workflow_status_check;
ALTER TABLE public.missions
  DROP CONSTRAINT IF EXISTS missions_workflow_status_check;

ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_workflow_status_check
  CHECK (
    workflow_status IS NULL
    OR workflow_status IN (
      'NEW',
      'IN_DISCUSSION',
      'QUOTE_SENT',
      'ACCEPTED',
      'MISSION_CREATED',
      'IN_PROGRESS',
      'COMPLETED'
    )
  );

ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_workflow_status_check
  CHECK (
    workflow_status IS NULL
    OR workflow_status IN (
      'NEW',
      'IN_DISCUSSION',
      'QUOTE_SENT',
      'ACCEPTED',
      'MISSION_CREATED',
      'IN_PROGRESS',
      'COMPLETED'
    )
  );

ALTER TABLE public.missions
  ADD CONSTRAINT missions_workflow_status_check
  CHECK (
    workflow_status IS NULL
    OR workflow_status IN (
      'NEW',
      'IN_DISCUSSION',
      'QUOTE_SENT',
      'ACCEPTED',
      'MISSION_CREATED',
      'IN_PROGRESS',
      'COMPLETED'
    )
  );

CREATE OR REPLACE FUNCTION public.map_service_request_workflow_status(
  p_status TEXT,
  p_selected_concierge_profile_id UUID DEFAULT NULL,
  p_mission_id UUID DEFAULT NULL
)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF p_mission_id IS NOT NULL THEN
    RETURN 'MISSION_CREATED';
  END IF;

  CASE lower(coalesce(trim(p_status), ''))
    WHEN 'draft' THEN RETURN 'NEW';
    WHEN 'sent' THEN RETURN 'NEW';
    WHEN 'in_review' THEN RETURN 'IN_DISCUSSION';
    WHEN 'quoted' THEN RETURN 'QUOTE_SENT';
    WHEN 'accepted' THEN RETURN 'ACCEPTED';
    WHEN 'in_progress' THEN RETURN 'IN_PROGRESS';
    WHEN 'completed' THEN RETURN 'COMPLETED';
    ELSE
      IF p_selected_concierge_profile_id IS NOT NULL THEN
        RETURN 'ACCEPTED';
      END IF;
      RETURN NULL;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.map_quote_workflow_status(
  p_status TEXT,
  p_mission_id UUID DEFAULT NULL
)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF p_mission_id IS NOT NULL THEN
    RETURN 'MISSION_CREATED';
  END IF;

  CASE lower(coalesce(trim(p_status), ''))
    WHEN 'draft' THEN RETURN 'IN_DISCUSSION';
    WHEN 'sent' THEN RETURN 'QUOTE_SENT';
    WHEN 'accepted' THEN RETURN 'ACCEPTED';
    WHEN 'in_progress' THEN RETURN 'IN_PROGRESS';
    WHEN 'completed' THEN RETURN 'COMPLETED';
    ELSE RETURN NULL;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.map_mission_workflow_status(
  p_status TEXT
)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  CASE lower(coalesce(trim(p_status), ''))
    WHEN 'draft' THEN RETURN 'MISSION_CREATED';
    WHEN 'assigned' THEN RETURN 'MISSION_CREATED';
    WHEN 'accepted' THEN RETURN 'MISSION_CREATED';
    WHEN 'in_progress' THEN RETURN 'IN_PROGRESS';
    WHEN 'completed' THEN RETURN 'COMPLETED';
    ELSE RETURN NULL;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_service_request_workflow_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.workflow_status := public.map_service_request_workflow_status(
    NEW.status::text,
    NEW.selected_concierge_profile_id,
    NEW.mission_id
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_quote_workflow_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.workflow_status := public.map_quote_workflow_status(NEW.status::text, NEW.mission_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_mission_workflow_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.workflow_status := public.map_mission_workflow_status(NEW.status::text);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_service_request_workflow_status ON public.service_requests;
CREATE TRIGGER trg_sync_service_request_workflow_status
BEFORE INSERT OR UPDATE OF status, selected_concierge_profile_id, mission_id
ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.sync_service_request_workflow_status();

DROP TRIGGER IF EXISTS trg_sync_quote_workflow_status ON public.quotes;
CREATE TRIGGER trg_sync_quote_workflow_status
BEFORE INSERT OR UPDATE OF status, mission_id
ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.sync_quote_workflow_status();

DROP TRIGGER IF EXISTS trg_sync_mission_workflow_status ON public.missions;
CREATE TRIGGER trg_sync_mission_workflow_status
BEFORE INSERT OR UPDATE OF status
ON public.missions
FOR EACH ROW
EXECUTE FUNCTION public.sync_mission_workflow_status();

UPDATE public.missions
SET workflow_status = public.map_mission_workflow_status(status::text)
WHERE workflow_status IS DISTINCT FROM public.map_mission_workflow_status(status::text);

UPDATE public.quotes
SET workflow_status = public.map_quote_workflow_status(status::text, mission_id)
WHERE workflow_status IS DISTINCT FROM public.map_quote_workflow_status(status::text, mission_id);

UPDATE public.service_requests sr
SET mission_id = q.mission_id
FROM public.quotes q
WHERE q.owner_profile_id = sr.owner_profile_id
  AND q.mission_id IS NOT NULL
  AND q.metadata ? 'service_request_id'
  AND q.metadata->>'service_request_id' = sr.id::text
  AND sr.mission_id IS NULL;

UPDATE public.service_requests
SET workflow_status = public.map_service_request_workflow_status(
  status::text,
  selected_concierge_profile_id,
  mission_id
)
WHERE workflow_status IS DISTINCT FROM public.map_service_request_workflow_status(
  status::text,
  selected_concierge_profile_id,
  mission_id
);

CREATE INDEX IF NOT EXISTS idx_service_requests_workflow_status
  ON public.service_requests(workflow_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_requests_mission_id
  ON public.service_requests(mission_id);

CREATE INDEX IF NOT EXISTS idx_quotes_workflow_status
  ON public.quotes(workflow_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_missions_workflow_status
  ON public.missions(workflow_status, created_at DESC);

COMMIT;
