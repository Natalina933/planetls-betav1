-- Missions core model: missions, events, reviews
-- Date: 2026-02-22

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concierge_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  service_id BIGINT REFERENCES public.services_catalog(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'assigned', 'accepted', 'in_progress', 'completed', 'canceled')),
  priority VARCHAR(10) NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  amount NUMERIC(10, 2),
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  response_time_minutes INTEGER CHECK (response_time_minutes IS NULL OR response_time_minutes >= 0),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mission_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type VARCHAR(40) NOT NULL
    CHECK (event_type IN ('created', 'assigned', 'accepted', 'rejected', 'started', 'completed', 'canceled', 'updated')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mission_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  reviewer_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_mission_reviewer UNIQUE (mission_id, reviewer_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_missions_concierge_profile_id
  ON public.missions(concierge_profile_id);
CREATE INDEX IF NOT EXISTS idx_missions_owner_profile_id
  ON public.missions(owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_missions_property_id
  ON public.missions(property_id);
CREATE INDEX IF NOT EXISTS idx_missions_status
  ON public.missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_scheduled_start
  ON public.missions(scheduled_start);

CREATE INDEX IF NOT EXISTS idx_mission_events_mission_id
  ON public.mission_events(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_events_actor_profile_id
  ON public.mission_events(actor_profile_id);
CREATE INDEX IF NOT EXISTS idx_mission_events_created_at
  ON public.mission_events(created_at);

CREATE INDEX IF NOT EXISTS idx_mission_reviews_mission_id
  ON public.mission_reviews(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_reviews_reviewed_profile_id
  ON public.mission_reviews(reviewed_profile_id);

CREATE OR REPLACE FUNCTION public.set_missions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_missions_updated_at ON public.missions;
CREATE TRIGGER trg_set_missions_updated_at
BEFORE UPDATE ON public.missions
FOR EACH ROW
EXECUTE FUNCTION public.set_missions_updated_at();

CREATE OR REPLACE FUNCTION public.set_mission_reviews_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_mission_reviews_updated_at ON public.mission_reviews;
CREATE TRIGGER trg_set_mission_reviews_updated_at
BEFORE UPDATE ON public.mission_reviews
FOR EACH ROW
EXECUTE FUNCTION public.set_mission_reviews_updated_at();

COMMIT;
