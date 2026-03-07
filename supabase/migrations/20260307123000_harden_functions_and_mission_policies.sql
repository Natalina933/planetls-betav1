-- Harden function search_path and replace permissive mission policies
-- Date: 2026-03-07

BEGIN;

DO $$
DECLARE
  function_name text;
  alter_stmt text;
BEGIN
  FOR function_name IN
    SELECT unnest(
      ARRAY[
        'set_updated_at',
        'set_contact_conversation_updated_at',
        'sync_contact_conversation_last_message',
        'recompute_quote_totals',
        'trg_quote_items_recompute',
        'trg_quote_items_recompute_totals',
        'recompute_invoice_totals',
        'trg_invoice_items_recompute',
        'trg_invoice_items_recompute_totals',
        'normalize_area_label'
      ]
    )
  LOOP
    FOR alter_stmt IN
      SELECT format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = public',
        n.nspname,
        p.proname,
        pg_get_function_identity_arguments(p.oid)
      )
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = function_name
    LOOP
      EXECUTE alter_stmt;
    END LOOP;
  END LOOP;
END
$$;

DROP POLICY IF EXISTS concierge_owner_matches_authenticated_all ON public.concierge_owner_matches;
DROP POLICY IF EXISTS concierge_owner_matches_select_participants ON public.concierge_owner_matches;
DROP POLICY IF EXISTS concierge_owner_matches_insert_concierge ON public.concierge_owner_matches;
DROP POLICY IF EXISTS concierge_owner_matches_update_concierge ON public.concierge_owner_matches;
DROP POLICY IF EXISTS concierge_owner_matches_delete_concierge ON public.concierge_owner_matches;

CREATE POLICY concierge_owner_matches_select_participants
  ON public.concierge_owner_matches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = concierge_profile_id OR auth.uid() = owner_profile_id);

CREATE POLICY concierge_owner_matches_insert_concierge
  ON public.concierge_owner_matches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = concierge_profile_id);

CREATE POLICY concierge_owner_matches_update_concierge
  ON public.concierge_owner_matches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = concierge_profile_id)
  WITH CHECK (auth.uid() = concierge_profile_id);

CREATE POLICY concierge_owner_matches_delete_concierge
  ON public.concierge_owner_matches
  FOR DELETE
  TO authenticated
  USING (auth.uid() = concierge_profile_id);

DROP POLICY IF EXISTS missions_authenticated_all ON public.missions;
DROP POLICY IF EXISTS missions_select_participants ON public.missions;
DROP POLICY IF EXISTS missions_insert_concierge ON public.missions;
DROP POLICY IF EXISTS missions_update_participants ON public.missions;
DROP POLICY IF EXISTS missions_delete_concierge ON public.missions;

CREATE POLICY missions_select_participants
  ON public.missions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = concierge_profile_id OR auth.uid() = owner_profile_id);

CREATE POLICY missions_insert_concierge
  ON public.missions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = concierge_profile_id);

CREATE POLICY missions_update_participants
  ON public.missions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = concierge_profile_id OR auth.uid() = owner_profile_id)
  WITH CHECK (auth.uid() = concierge_profile_id OR auth.uid() = owner_profile_id);

CREATE POLICY missions_delete_concierge
  ON public.missions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = concierge_profile_id);

DROP POLICY IF EXISTS mission_events_authenticated_all ON public.mission_events;
DROP POLICY IF EXISTS mission_events_select_participants ON public.mission_events;
DROP POLICY IF EXISTS mission_events_insert_participants ON public.mission_events;

CREATE POLICY mission_events_select_participants
  ON public.mission_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.missions m
      WHERE m.id = mission_events.mission_id
        AND (auth.uid() = m.concierge_profile_id OR auth.uid() = m.owner_profile_id)
    )
  );

CREATE POLICY mission_events_insert_participants
  ON public.mission_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.missions m
      WHERE m.id = mission_events.mission_id
        AND (auth.uid() = m.concierge_profile_id OR auth.uid() = m.owner_profile_id)
    )
    AND (actor_profile_id IS NULL OR actor_profile_id = auth.uid())
  );

DROP POLICY IF EXISTS mission_reviews_authenticated_all ON public.mission_reviews;
DROP POLICY IF EXISTS mission_reviews_select_participants ON public.mission_reviews;
DROP POLICY IF EXISTS mission_reviews_insert_reviewer ON public.mission_reviews;
DROP POLICY IF EXISTS mission_reviews_update_reviewer ON public.mission_reviews;
DROP POLICY IF EXISTS mission_reviews_delete_reviewer ON public.mission_reviews;

CREATE POLICY mission_reviews_select_participants
  ON public.mission_reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.missions m
      WHERE m.id = mission_reviews.mission_id
        AND (auth.uid() = m.concierge_profile_id OR auth.uid() = m.owner_profile_id)
    )
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'mission_reviews'
      AND column_name = 'reviewer_profile_id'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY mission_reviews_insert_reviewer
        ON public.mission_reviews
        FOR INSERT
        TO authenticated
        WITH CHECK (
          auth.uid() = reviewer_profile_id
          AND EXISTS (
            SELECT 1
            FROM public.missions m
            WHERE m.id = mission_reviews.mission_id
              AND (auth.uid() = m.concierge_profile_id OR auth.uid() = m.owner_profile_id)
              AND reviewed_profile_id IN (m.concierge_profile_id, m.owner_profile_id)
          )
        )
    $policy$;

    EXECUTE $policy$
      CREATE POLICY mission_reviews_update_reviewer
        ON public.mission_reviews
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = reviewer_profile_id)
        WITH CHECK (auth.uid() = reviewer_profile_id)
    $policy$;

    EXECUTE $policy$
      CREATE POLICY mission_reviews_delete_reviewer
        ON public.mission_reviews
        FOR DELETE
        TO authenticated
        USING (auth.uid() = reviewer_profile_id)
    $policy$;
  END IF;
END
$$;

COMMIT;
