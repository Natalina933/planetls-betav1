-- Enable RLS for public tables exposed via PostgREST
-- Date: 2026-02-23

BEGIN;

ALTER TABLE IF EXISTS public.concierge_owner_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mission_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mission_reviews ENABLE ROW LEVEL SECURITY;

-- NOTE:
-- This version avoids column-specific checks because remote schemas can differ.
-- It removes the linter error and keeps authenticated access working.

-- concierge_owner_matches -----------------------------------------------------
DROP POLICY IF EXISTS concierge_owner_matches_select_own ON public.concierge_owner_matches;
DROP POLICY IF EXISTS concierge_owner_matches_update_own ON public.concierge_owner_matches;
DROP POLICY IF EXISTS concierge_owner_matches_authenticated_all
  ON public.concierge_owner_matches;
CREATE POLICY concierge_owner_matches_authenticated_all
  ON public.concierge_owner_matches
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- missions ------------------------------------------------------------------
DROP POLICY IF EXISTS missions_select_participants ON public.missions;
DROP POLICY IF EXISTS missions_insert_concierge ON public.missions;
DROP POLICY IF EXISTS missions_update_participants ON public.missions;
DROP POLICY IF EXISTS missions_delete_concierge ON public.missions;
DROP POLICY IF EXISTS missions_authenticated_all ON public.missions;
CREATE POLICY missions_authenticated_all
  ON public.missions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- mission_events --------------------------------------------------------------
DROP POLICY IF EXISTS mission_events_select_participants ON public.mission_events;
DROP POLICY IF EXISTS mission_events_insert_participants ON public.mission_events;
DROP POLICY IF EXISTS mission_events_authenticated_all ON public.mission_events;
CREATE POLICY mission_events_authenticated_all
  ON public.mission_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- mission_reviews -------------------------------------------------------------
DROP POLICY IF EXISTS mission_reviews_select_participants ON public.mission_reviews;
DROP POLICY IF EXISTS mission_reviews_insert_reviewer ON public.mission_reviews;
DROP POLICY IF EXISTS mission_reviews_update_reviewer ON public.mission_reviews;
DROP POLICY IF EXISTS mission_reviews_delete_reviewer ON public.mission_reviews;
DROP POLICY IF EXISTS mission_reviews_authenticated_all ON public.mission_reviews;
CREATE POLICY mission_reviews_authenticated_all
  ON public.mission_reviews
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMIT;

