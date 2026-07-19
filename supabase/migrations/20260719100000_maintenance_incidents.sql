BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.maintenance_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concierge_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  provider_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  housing_id UUID,
  title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 3 AND 160),
  description TEXT,
  property_label TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'qualified', 'assigned', 'quoted', 'approved', 'scheduled', 'in_progress', 'resolved', 'closed', 'cancelled')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_incidents_concierge_status
  ON public.maintenance_incidents(concierge_profile_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_incidents_owner
  ON public.maintenance_incidents(owner_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_incidents_provider
  ON public.maintenance_incidents(provider_profile_id, status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_incidents_mission
  ON public.maintenance_incidents(mission_id) WHERE mission_id IS NOT NULL;

ALTER TABLE public.maintenance_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS maintenance_incidents_select_participants ON public.maintenance_incidents;
CREATE POLICY maintenance_incidents_select_participants ON public.maintenance_incidents
  FOR SELECT USING (
    auth.role() = 'service_role' OR auth.uid() = concierge_profile_id OR
    auth.uid() = owner_profile_id OR auth.uid() = provider_profile_id
  );

DROP POLICY IF EXISTS maintenance_incidents_insert_concierge ON public.maintenance_incidents;
CREATE POLICY maintenance_incidents_insert_concierge ON public.maintenance_incidents
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = concierge_profile_id);

DROP POLICY IF EXISTS maintenance_incidents_update_concierge ON public.maintenance_incidents;
CREATE POLICY maintenance_incidents_update_concierge ON public.maintenance_incidents
  FOR UPDATE USING (auth.role() = 'service_role' OR auth.uid() = concierge_profile_id)
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = concierge_profile_id);

COMMIT;