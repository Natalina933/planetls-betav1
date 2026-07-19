BEGIN;

CREATE TABLE IF NOT EXISTS public.maintenance_incident_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.maintenance_incidents(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT,
  storage_bucket TEXT NOT NULL DEFAULT 'mission-evidence',
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 26214400),
  sha256 TEXT NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_incident_media_incident
  ON public.maintenance_incident_media(incident_id, created_at DESC);

ALTER TABLE public.maintenance_incident_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS maintenance_media_select_participants ON public.maintenance_incident_media;
CREATE POLICY maintenance_media_select_participants ON public.maintenance_incident_media
  FOR SELECT USING (
    auth.role() = 'service_role' OR EXISTS (
      SELECT 1 FROM public.maintenance_incidents incident
      WHERE incident.id = incident_id AND (
        auth.uid() = incident.concierge_profile_id OR auth.uid() = incident.owner_profile_id OR auth.uid() = incident.provider_profile_id
      )
    )
  );

DROP POLICY IF EXISTS maintenance_media_insert_intervenants ON public.maintenance_incident_media;
CREATE POLICY maintenance_media_insert_intervenants ON public.maintenance_incident_media
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR (auth.uid() = uploaded_by AND EXISTS (
      SELECT 1 FROM public.maintenance_incidents incident
      WHERE incident.id = incident_id AND (
        auth.uid() = incident.concierge_profile_id OR auth.uid() = incident.provider_profile_id
      )
    ))
  );

COMMIT;