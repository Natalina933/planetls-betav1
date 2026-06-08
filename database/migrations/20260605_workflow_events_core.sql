-- Typed workflow events for commercial owner -> concierge journeys
-- Date: 2026-06-05

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  owner_profile_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  concierge_profile_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_request_id UUID NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  service_request_recipient_id UUID NULL REFERENCES public.service_request_recipients(id) ON DELETE SET NULL,
  quote_id UUID NULL REFERENCES public.quotes(id) ON DELETE SET NULL,
  mission_id UUID NULL REFERENCES public.missions(id) ON DELETE SET NULL,
  event_type VARCHAR(60) NOT NULL,
  request_workflow_status VARCHAR(40),
  quote_workflow_status VARCHAR(40),
  mission_workflow_status VARCHAR(40),
  title TEXT NOT NULL,
  body TEXT,
  action_href TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_events_owner_created_at
  ON public.workflow_events(owner_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_events_concierge_created_at
  ON public.workflow_events(concierge_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_events_request_created_at
  ON public.workflow_events(service_request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_events_quote_created_at
  ON public.workflow_events(quote_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_events_mission_created_at
  ON public.workflow_events(mission_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_events_type_created_at
  ON public.workflow_events(event_type, created_at DESC);

ALTER TABLE public.workflow_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workflow_events_select_participants ON public.workflow_events;
CREATE POLICY workflow_events_select_participants
  ON public.workflow_events
  FOR SELECT
  USING (
    auth.uid() = actor_profile_id
    OR auth.uid() = owner_profile_id
    OR auth.uid() = concierge_profile_id
  );

DROP POLICY IF EXISTS workflow_events_insert_participants ON public.workflow_events;
CREATE POLICY workflow_events_insert_participants
  ON public.workflow_events
  FOR INSERT
  WITH CHECK (
    auth.uid() = actor_profile_id
    OR auth.uid() = owner_profile_id
    OR auth.uid() = concierge_profile_id
  );

COMMIT;
