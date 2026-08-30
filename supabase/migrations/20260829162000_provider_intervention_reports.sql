-- Persist provider intervention completion reports outside metadata.
-- Date: 2026-08-29

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.provider_intervention_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_intervention_id UUID NOT NULL UNIQUE REFERENCES public.provider_interventions(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  provider_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  summary TEXT NOT NULL CHECK (length(trim(summary)) >= 3 AND length(summary) <= 5000),
  work_performed TEXT,
  materials_used TEXT,
  follow_up_required BOOLEAN NOT NULL DEFAULT false,
  follow_up_notes TEXT,
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_intervention_reports_provider
  ON public.provider_intervention_reports(provider_profile_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_intervention_reports_mission
  ON public.provider_intervention_reports(mission_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_intervention_reports_owner
  ON public.provider_intervention_reports(owner_profile_id, submitted_at DESC);

CREATE OR REPLACE FUNCTION public.set_provider_intervention_reports_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_provider_intervention_reports_updated_at ON public.provider_intervention_reports;
CREATE TRIGGER trg_set_provider_intervention_reports_updated_at
BEFORE UPDATE ON public.provider_intervention_reports
FOR EACH ROW
EXECUTE FUNCTION public.set_provider_intervention_reports_updated_at();

INSERT INTO public.provider_intervention_reports (
  provider_intervention_id,
  mission_id,
  reservation_id,
  provider_profile_id,
  owner_profile_id,
  summary,
  work_performed,
  follow_up_required,
  submitted_by,
  metadata
)
SELECT
  pi.id,
  CASE
    WHEN pi.metadata ->> 'mission_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN (pi.metadata ->> 'mission_id')::uuid
    ELSE NULL
  END,
  pi.reservation_id,
  pi.provider_profile_id,
  pi.owner_profile_id,
  LEFT(COALESCE(NULLIF(pi.metadata #>> '{proof,note}', ''), NULLIF(pi.metadata ->> 'completion_summary', ''), 'Compte rendu intervention'), 5000),
  NULLIF(pi.metadata #>> '{proof,note}', ''),
  false,
  pi.provider_profile_id,
  jsonb_build_object('source', 'metadata_backfill', 'legacy_proof', COALESCE(pi.metadata -> 'proof', '{}'::jsonb))
FROM public.provider_interventions pi
WHERE pi.status = 'completed'
  AND (
    pi.metadata ? 'proof'
    OR pi.metadata ? 'completion_summary'
  )
ON CONFLICT (provider_intervention_id) DO NOTHING;

ALTER TABLE public.provider_intervention_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS provider_intervention_reports_select_participants ON public.provider_intervention_reports;
DROP POLICY IF EXISTS provider_intervention_reports_insert_provider ON public.provider_intervention_reports;
DROP POLICY IF EXISTS provider_intervention_reports_update_provider ON public.provider_intervention_reports;
DROP POLICY IF EXISTS provider_intervention_reports_delete_provider ON public.provider_intervention_reports;

CREATE POLICY provider_intervention_reports_select_participants
  ON public.provider_intervention_reports
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'service_role'
    OR auth.uid() = provider_profile_id
    OR auth.uid() = owner_profile_id
    OR EXISTS (
      SELECT 1
      FROM public.missions m
      WHERE m.id = provider_intervention_reports.mission_id
        AND auth.uid() = m.concierge_profile_id
    )
  );

CREATE POLICY provider_intervention_reports_insert_provider
  ON public.provider_intervention_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      auth.uid() = provider_profile_id
      AND auth.uid() = submitted_by
      AND EXISTS (
        SELECT 1
        FROM public.provider_interventions pi
        WHERE pi.id = provider_intervention_reports.provider_intervention_id
          AND pi.provider_profile_id = auth.uid()
      )
    )
  );

CREATE POLICY provider_intervention_reports_update_provider
  ON public.provider_intervention_reports
  FOR UPDATE
  TO authenticated
  USING (
    auth.role() = 'service_role'
    OR auth.uid() = provider_profile_id
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      auth.uid() = provider_profile_id
      AND auth.uid() = submitted_by
    )
  );

CREATE POLICY provider_intervention_reports_delete_provider
  ON public.provider_intervention_reports
  FOR DELETE
  TO authenticated
  USING (
    auth.role() = 'service_role'
    OR auth.uid() = provider_profile_id
  );

COMMIT;
