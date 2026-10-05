-- One-off stay-specific service requests ("demande ponctuelle de séjour").
-- Date: 2026-10-05
-- Keeps the explicit stay context on service_requests so that accepting the
-- linked quote creates a mission bound to missions.reservation_id without
-- creating a housing row or a housing collaboration.

BEGIN;

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stay_need TEXT
    CHECK (stay_need IS NULL OR stay_need IN ('checkin', 'checkout', 'cleaning', 'linen', 'courses'));

CREATE INDEX IF NOT EXISTS idx_service_requests_reservation_id
  ON public.service_requests(reservation_id);

COMMIT;
