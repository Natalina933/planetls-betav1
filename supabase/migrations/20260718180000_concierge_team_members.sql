BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.concierge_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concierge_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  linked_profile_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  role TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('manager', 'lead', 'employee', 'collaborator', 'provider')),
  title TEXT,
  availability TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'offline')),
  daily_capacity_minutes INTEGER NOT NULL DEFAULT 480 CHECK (daily_capacity_minutes BETWEEN 60 AND 1440),
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  working_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concierge_team_members_concierge_active
  ON public.concierge_team_members(concierge_profile_id, is_active, name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_concierge_team_members_linked_profile
  ON public.concierge_team_members(concierge_profile_id, linked_profile_id)
  WHERE linked_profile_id IS NOT NULL;

ALTER TABLE public.concierge_team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS concierge_team_members_select_own ON public.concierge_team_members;
CREATE POLICY concierge_team_members_select_own ON public.concierge_team_members
  FOR SELECT USING (auth.role() = 'service_role' OR auth.uid() = concierge_profile_id OR auth.uid() = linked_profile_id);

DROP POLICY IF EXISTS concierge_team_members_insert_own ON public.concierge_team_members;
CREATE POLICY concierge_team_members_insert_own ON public.concierge_team_members
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = concierge_profile_id);

DROP POLICY IF EXISTS concierge_team_members_update_own ON public.concierge_team_members;
CREATE POLICY concierge_team_members_update_own ON public.concierge_team_members
  FOR UPDATE USING (auth.role() = 'service_role' OR auth.uid() = concierge_profile_id)
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = concierge_profile_id);

DROP POLICY IF EXISTS concierge_team_members_delete_own ON public.concierge_team_members;
CREATE POLICY concierge_team_members_delete_own ON public.concierge_team_members
  FOR DELETE USING (auth.role() = 'service_role' OR auth.uid() = concierge_profile_id);

COMMIT;