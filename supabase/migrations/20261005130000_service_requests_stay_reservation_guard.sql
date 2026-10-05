-- Owner-scoped guard for the one-off stay service request context.
-- Date: 2026-10-05
-- A service request may only reference a reservation owned by the request
-- owner. This closes the direct PostgREST insert/update path (RLS-guarded)
-- that could otherwise attach a request to another owner's stay, bypassing
-- the server-side validation of POST /api/service-requests. Classic requests
-- (reservation_id IS NULL) are completely unaffected. The EXISTS subquery is
-- evaluated under the caller's own reservations visibility: the guard applies
-- to inserts (owner only) and to updates performed by the request owner;
-- updates performed by the selected concierge keep their historical behavior.

BEGIN;

DROP POLICY IF EXISTS service_requests_insert_owner ON public.service_requests;
CREATE POLICY service_requests_insert_owner
  ON public.service_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_profile_id
    AND (
      reservation_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.reservations r
        WHERE r.id = service_requests.reservation_id
          AND r.owner_profile_id = service_requests.owner_profile_id
      )
    )
  );

DROP POLICY IF EXISTS service_requests_update_participants ON public.service_requests;
CREATE POLICY service_requests_update_participants
  ON public.service_requests
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = owner_profile_id
    OR auth.uid() = selected_concierge_profile_id
  )
  WITH CHECK (
    (auth.uid() = owner_profile_id OR auth.uid() = selected_concierge_profile_id)
    AND (
      auth.uid() <> owner_profile_id
      OR reservation_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.reservations r
        WHERE r.id = service_requests.reservation_id
          AND r.owner_profile_id = service_requests.owner_profile_id
      )
    )
  );

COMMIT;