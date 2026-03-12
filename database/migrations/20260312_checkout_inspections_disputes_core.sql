-- Checkout inspections + dispute evidence module
-- Date: 2026-03-12

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.checkout_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  housing_id BIGINT NOT NULL REFERENCES public.housing(id) ON DELETE CASCADE,
  owner_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  concierge_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_reference TEXT,
  checkout_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'reviewed', 'dispute_opened', 'closed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  submitted_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  signature_name TEXT,
  evidence_locked_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.checkout_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.checkout_inspections(id) ON DELETE CASCADE,
  zone_key TEXT NOT NULL,
  item_key TEXT NOT NULL,
  item_label TEXT NOT NULL,
  item_status VARCHAR(10) NOT NULL DEFAULT 'ok'
    CHECK (item_status IN ('ok', 'issue', 'na')),
  severity VARCHAR(10) CHECK (severity IS NULL OR severity IN ('minor', 'major', 'critical')),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_checkout_checklist_items_inspection_item UNIQUE (inspection_id, item_key)
);

CREATE TABLE IF NOT EXISTS public.inspection_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.checkout_inspections(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES public.checkout_checklist_items(id) ON DELETE SET NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('photo', 'video')),
  storage_bucket TEXT NOT NULL DEFAULT 'inspection-evidence',
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes BIGINT CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  sha256 CHAR(64) NOT NULL,
  captured_at_device TIMESTAMPTZ,
  captured_at_server TIMESTAMPTZ NOT NULL DEFAULT now(),
  geo_lat NUMERIC(9, 6),
  geo_lng NUMERIC(9, 6),
  geo_accuracy_m NUMERIC(8, 2),
  exif_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  device_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  locked BOOLEAN NOT NULL DEFAULT false,
  created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_inspection_media_sha UNIQUE (inspection_id, sha256)
);

CREATE TABLE IF NOT EXISTS public.damage_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.checkout_inspections(id) ON DELETE CASCADE,
  housing_id BIGINT NOT NULL REFERENCES public.housing(id) ON DELETE CASCADE,
  owner_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  concierge_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opened_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dispute_type VARCHAR(20) NOT NULL
    CHECK (dispute_type IN ('damage', 'missing_item', 'cleaning', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  estimated_amount NUMERIC(12, 2),
  currency VARCHAR(8) NOT NULL DEFAULT 'EUR',
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'evidence_requested', 'in_review', 'resolved', 'rejected', 'closed')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  resolution_note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dispute_evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.damage_disputes(id) ON DELETE CASCADE,
  media_id UUID REFERENCES public.inspection_media(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES public.checkout_checklist_items(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_dispute_evidence_target CHECK (
    media_id IS NOT NULL OR checklist_item_id IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS public.inspection_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.checkout_inspections(id) ON DELETE CASCADE,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type VARCHAR(40) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_inspections_housing_created
  ON public.checkout_inspections(housing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkout_inspections_owner_created
  ON public.checkout_inspections(owner_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkout_inspections_concierge_created
  ON public.checkout_inspections(concierge_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkout_inspections_status
  ON public.checkout_inspections(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_checkout_checklist_inspection
  ON public.checkout_checklist_items(inspection_id);
CREATE INDEX IF NOT EXISTS idx_checkout_checklist_issue
  ON public.checkout_checklist_items(inspection_id)
  WHERE item_status = 'issue';

CREATE INDEX IF NOT EXISTS idx_inspection_media_inspection
  ON public.inspection_media(inspection_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inspection_media_item
  ON public.inspection_media(checklist_item_id);

CREATE INDEX IF NOT EXISTS idx_damage_disputes_inspection
  ON public.damage_disputes(inspection_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_damage_disputes_owner
  ON public.damage_disputes(owner_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_damage_disputes_status
  ON public.damage_disputes(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inspection_events_inspection
  ON public.inspection_events(inspection_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_checkout_module_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_checkout_inspections_updated_at ON public.checkout_inspections;
CREATE TRIGGER trg_set_checkout_inspections_updated_at
BEFORE UPDATE ON public.checkout_inspections
FOR EACH ROW
EXECUTE FUNCTION public.set_checkout_module_updated_at();

DROP TRIGGER IF EXISTS trg_set_checkout_checklist_items_updated_at ON public.checkout_checklist_items;
CREATE TRIGGER trg_set_checkout_checklist_items_updated_at
BEFORE UPDATE ON public.checkout_checklist_items
FOR EACH ROW
EXECUTE FUNCTION public.set_checkout_module_updated_at();

DROP TRIGGER IF EXISTS trg_set_damage_disputes_updated_at ON public.damage_disputes;
CREATE TRIGGER trg_set_damage_disputes_updated_at
BEFORE UPDATE ON public.damage_disputes
FOR EACH ROW
EXECUTE FUNCTION public.set_checkout_module_updated_at();

CREATE OR REPLACE FUNCTION public.validate_inspection_submission()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  photo_count INTEGER;
  video_count INTEGER;
  missing_issue_evidence INTEGER;
BEGIN
  IF NEW.status = 'submitted' AND COALESCE(OLD.status, '') <> 'submitted' THEN
    SELECT COUNT(*) INTO photo_count
    FROM public.inspection_media m
    WHERE m.inspection_id = NEW.id
      AND m.media_type = 'photo';

    SELECT COUNT(*) INTO video_count
    FROM public.inspection_media m
    WHERE m.inspection_id = NEW.id
      AND m.media_type = 'video';

    IF photo_count < 5 THEN
      RAISE EXCEPTION 'Soumission impossible: minimum 5 photos requises.';
    END IF;

    IF video_count < 1 THEN
      RAISE EXCEPTION 'Soumission impossible: minimum 1 video requise.';
    END IF;

    SELECT COUNT(*) INTO missing_issue_evidence
    FROM public.checkout_checklist_items ci
    WHERE ci.inspection_id = NEW.id
      AND ci.item_status = 'issue'
      AND NOT EXISTS (
        SELECT 1
        FROM public.inspection_media m
        WHERE m.inspection_id = NEW.id
          AND m.checklist_item_id = ci.id
      );

    IF missing_issue_evidence > 0 THEN
      RAISE EXCEPTION 'Soumission impossible: chaque anomalie doit avoir au moins une preuve media associee.';
    END IF;

    NEW.submitted_at = COALESCE(NEW.submitted_at, now());
    NEW.evidence_locked_at = COALESCE(NEW.evidence_locked_at, now());

    UPDATE public.inspection_media
    SET locked = true
    WHERE inspection_id = NEW.id
      AND locked = false;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_inspection_submission ON public.checkout_inspections;
CREATE TRIGGER trg_validate_inspection_submission
BEFORE UPDATE ON public.checkout_inspections
FOR EACH ROW
EXECUTE FUNCTION public.validate_inspection_submission();

CREATE OR REPLACE FUNCTION public.prevent_locked_media_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  inspection_locked BOOLEAN;
BEGIN
  SELECT (ci.evidence_locked_at IS NOT NULL)
  INTO inspection_locked
  FROM public.checkout_inspections ci
  WHERE ci.id = COALESCE(NEW.inspection_id, OLD.inspection_id);

  IF inspection_locked THEN
    RAISE EXCEPTION 'Modification impossible: preuves verrouillees apres soumission.';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_locked_media_update ON public.inspection_media;
CREATE TRIGGER trg_prevent_locked_media_update
BEFORE UPDATE ON public.inspection_media
FOR EACH ROW
EXECUTE FUNCTION public.prevent_locked_media_mutation();

DROP TRIGGER IF EXISTS trg_prevent_locked_media_delete ON public.inspection_media;
CREATE TRIGGER trg_prevent_locked_media_delete
BEFORE DELETE ON public.inspection_media
FOR EACH ROW
EXECUTE FUNCTION public.prevent_locked_media_mutation();

-- RLS
ALTER TABLE public.checkout_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damage_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_evidence_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS checkout_inspections_select_participants ON public.checkout_inspections;
DROP POLICY IF EXISTS checkout_inspections_insert_concierge ON public.checkout_inspections;
DROP POLICY IF EXISTS checkout_inspections_update_participants ON public.checkout_inspections;
CREATE POLICY checkout_inspections_select_participants
  ON public.checkout_inspections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_profile_id OR auth.uid() = concierge_profile_id);
CREATE POLICY checkout_inspections_insert_concierge
  ON public.checkout_inspections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = concierge_profile_id);
CREATE POLICY checkout_inspections_update_participants
  ON public.checkout_inspections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_profile_id OR auth.uid() = concierge_profile_id)
  WITH CHECK (auth.uid() = owner_profile_id OR auth.uid() = concierge_profile_id);

DROP POLICY IF EXISTS checkout_checklist_items_select_participants ON public.checkout_checklist_items;
DROP POLICY IF EXISTS checkout_checklist_items_mutate_concierge ON public.checkout_checklist_items;
CREATE POLICY checkout_checklist_items_select_participants
  ON public.checkout_checklist_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.checkout_inspections ci
      WHERE ci.id = checkout_checklist_items.inspection_id
        AND (auth.uid() = ci.owner_profile_id OR auth.uid() = ci.concierge_profile_id)
    )
  );
CREATE POLICY checkout_checklist_items_mutate_concierge
  ON public.checkout_checklist_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.checkout_inspections ci
      WHERE ci.id = checkout_checklist_items.inspection_id
        AND auth.uid() = ci.concierge_profile_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.checkout_inspections ci
      WHERE ci.id = checkout_checklist_items.inspection_id
        AND auth.uid() = ci.concierge_profile_id
    )
  );

DROP POLICY IF EXISTS inspection_media_select_participants ON public.inspection_media;
DROP POLICY IF EXISTS inspection_media_mutate_concierge ON public.inspection_media;
CREATE POLICY inspection_media_select_participants
  ON public.inspection_media
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.checkout_inspections ci
      WHERE ci.id = inspection_media.inspection_id
        AND (auth.uid() = ci.owner_profile_id OR auth.uid() = ci.concierge_profile_id)
    )
  );
CREATE POLICY inspection_media_mutate_concierge
  ON public.inspection_media
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.checkout_inspections ci
      WHERE ci.id = inspection_media.inspection_id
        AND auth.uid() = ci.concierge_profile_id
        AND ci.status = 'draft'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.checkout_inspections ci
      WHERE ci.id = inspection_media.inspection_id
        AND auth.uid() = ci.concierge_profile_id
        AND ci.status = 'draft'
    )
  );

DROP POLICY IF EXISTS damage_disputes_select_participants ON public.damage_disputes;
DROP POLICY IF EXISTS damage_disputes_insert_owner ON public.damage_disputes;
DROP POLICY IF EXISTS damage_disputes_update_participants ON public.damage_disputes;
CREATE POLICY damage_disputes_select_participants
  ON public.damage_disputes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_profile_id OR auth.uid() = concierge_profile_id);
CREATE POLICY damage_disputes_insert_owner
  ON public.damage_disputes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_profile_id AND auth.uid() = opened_by_profile_id);
CREATE POLICY damage_disputes_update_participants
  ON public.damage_disputes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_profile_id OR auth.uid() = concierge_profile_id)
  WITH CHECK (auth.uid() = owner_profile_id OR auth.uid() = concierge_profile_id);

DROP POLICY IF EXISTS dispute_evidence_links_select_participants ON public.dispute_evidence_links;
DROP POLICY IF EXISTS dispute_evidence_links_mutate_owner ON public.dispute_evidence_links;
CREATE POLICY dispute_evidence_links_select_participants
  ON public.dispute_evidence_links
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.damage_disputes d
      WHERE d.id = dispute_evidence_links.dispute_id
        AND (auth.uid() = d.owner_profile_id OR auth.uid() = d.concierge_profile_id)
    )
  );
CREATE POLICY dispute_evidence_links_mutate_owner
  ON public.dispute_evidence_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.damage_disputes d
      WHERE d.id = dispute_evidence_links.dispute_id
        AND auth.uid() = d.owner_profile_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.damage_disputes d
      WHERE d.id = dispute_evidence_links.dispute_id
        AND auth.uid() = d.owner_profile_id
    )
  );

DROP POLICY IF EXISTS inspection_events_select_participants ON public.inspection_events;
DROP POLICY IF EXISTS inspection_events_insert_participants ON public.inspection_events;
CREATE POLICY inspection_events_select_participants
  ON public.inspection_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.checkout_inspections ci
      WHERE ci.id = inspection_events.inspection_id
        AND (auth.uid() = ci.owner_profile_id OR auth.uid() = ci.concierge_profile_id)
    )
  );
CREATE POLICY inspection_events_insert_participants
  ON public.inspection_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.checkout_inspections ci
      WHERE ci.id = inspection_events.inspection_id
        AND (auth.uid() = ci.owner_profile_id OR auth.uid() = ci.concierge_profile_id)
    )
    AND (actor_profile_id IS NULL OR actor_profile_id = auth.uid())
  );

COMMIT;
