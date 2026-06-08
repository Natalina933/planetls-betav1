-- Persist accepted commercial mission link on service requests
-- Date: 2026-06-05

BEGIN;

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS mission_id UUID NULL REFERENCES public.missions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_service_requests_mission_id
  ON public.service_requests(mission_id);

COMMIT;
