-- Persist mission/intervention checklists as business data.
-- Date: 2026-08-29

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.mission_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  provider_intervention_id UUID REFERENCES public.provider_interventions(id) ON DELETE SET NULL,
  external_key TEXT NOT NULL,
  label TEXT NOT NULL CHECK (length(trim(label)) > 0 AND length(label) <= 240),
  is_done BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  required BOOLEAN NOT NULL DEFAULT true,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mission_checklist_external_key_unique UNIQUE (mission_id, external_key)
);

CREATE INDEX IF NOT EXISTS idx_mission_checklist_items_mission_position
  ON public.mission_checklist_items(mission_id, position ASC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_mission_checklist_items_provider_intervention
  ON public.mission_checklist_items(provider_intervention_id, position ASC);

CREATE OR REPLACE FUNCTION public.set_mission_checklist_items_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_mission_checklist_items_updated_at ON public.mission_checklist_items;
CREATE TRIGGER trg_set_mission_checklist_items_updated_at
BEFORE UPDATE ON public.mission_checklist_items
FOR EACH ROW
EXECUTE FUNCTION public.set_mission_checklist_items_updated_at();

INSERT INTO public.mission_checklist_items (
  mission_id,
  external_key,
  label,
  is_done,
  position,
  required,
  completed_at,
  metadata
)
SELECT
  m.id,
  COALESCE(NULLIF(item.value ->> 'id', ''), 'metadata_' || item.ordinality::text),
  LEFT(COALESCE(NULLIF(item.value ->> 'label', ''), 'Point de controle ' || item.ordinality::text), 240),
  CASE
    WHEN lower(COALESCE(item.value ->> 'done', 'false')) IN ('true', 't', 'yes', 'y', '1', 'on') THEN true
    ELSE false
  END,
  item.ordinality::integer - 1,
  CASE
    WHEN lower(COALESCE(item.value ->> 'required', 'true')) IN ('false', 'f', 'no', 'n', '0', 'off') THEN false
    ELSE true
  END,
  CASE
    WHEN lower(COALESCE(item.value ->> 'done', 'false')) IN ('true', 't', 'yes', 'y', '1', 'on') THEN now()
    ELSE NULL
  END,
  jsonb_build_object('source', 'metadata_backfill')
FROM public.missions m
CROSS JOIN LATERAL jsonb_array_elements(m.metadata -> 'checklist') WITH ORDINALITY AS item(value, ordinality)
WHERE jsonb_typeof(m.metadata -> 'checklist') = 'array'
ON CONFLICT (mission_id, external_key) DO NOTHING;

ALTER TABLE public.mission_checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mission_checklist_select_participants ON public.mission_checklist_items;
DROP POLICY IF EXISTS mission_checklist_insert_concierge ON public.mission_checklist_items;
DROP POLICY IF EXISTS mission_checklist_update_intervenants ON public.mission_checklist_items;
DROP POLICY IF EXISTS mission_checklist_delete_concierge ON public.mission_checklist_items;

CREATE POLICY mission_checklist_select_participants
  ON public.mission_checklist_items
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.missions m
      WHERE m.id = mission_checklist_items.mission_id
        AND (auth.uid() = m.owner_profile_id OR auth.uid() = m.concierge_profile_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.provider_interventions pi
      WHERE pi.id = mission_checklist_items.provider_intervention_id
        AND auth.uid() = pi.provider_profile_id
    )
  );

CREATE POLICY mission_checklist_insert_concierge
  ON public.mission_checklist_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.missions m
      WHERE m.id = mission_checklist_items.mission_id
        AND auth.uid() = m.concierge_profile_id
    )
  );

CREATE POLICY mission_checklist_update_intervenants
  ON public.mission_checklist_items
  FOR UPDATE
  TO authenticated
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.missions m
      WHERE m.id = mission_checklist_items.mission_id
        AND auth.uid() = m.concierge_profile_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.provider_interventions pi
      WHERE pi.id = mission_checklist_items.provider_intervention_id
        AND auth.uid() = pi.provider_profile_id
    )
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.missions m
      WHERE m.id = mission_checklist_items.mission_id
        AND auth.uid() = m.concierge_profile_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.provider_interventions pi
      WHERE pi.id = mission_checklist_items.provider_intervention_id
        AND auth.uid() = pi.provider_profile_id
    )
  );

CREATE POLICY mission_checklist_delete_concierge
  ON public.mission_checklist_items
  FOR DELETE
  TO authenticated
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.missions m
      WHERE m.id = mission_checklist_items.mission_id
        AND auth.uid() = m.concierge_profile_id
    )
  );

COMMIT;
