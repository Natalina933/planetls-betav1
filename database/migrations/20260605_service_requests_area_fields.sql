-- Persist owner search area on service requests
-- Date: 2026-06-05

BEGIN;

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS radius_km NUMERIC(8, 2);

CREATE INDEX IF NOT EXISTS idx_service_requests_region
  ON public.service_requests(region);

COMMIT;
