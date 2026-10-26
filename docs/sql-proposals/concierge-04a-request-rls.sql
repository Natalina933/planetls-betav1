-- LOCAL PROPOSAL ONLY. NOT EXECUTED. Requires isolated PostgreSQL/RLS tests.
-- Cycle: requests SELECT -> recipients SELECT -> requests SELECT.
-- Break only the first edge, retaining owner/selected concierge/invited concierge.
-- Run future DDL as the isolated database administrator. Dedicated function owner
-- has NOLOGIN and no memberships; BYPASSRLS is necessary for this one lookup.
-- It receives only two recipient columns, no mutation or other table access.
-- Review existing PUBLIC grants/role memberships in the isolated harness too.
BEGIN;
CREATE ROLE concierge_request_rls_reader NOLOGIN NOSUPERUSER NOCREATEDB
  NOCREATEROLE NOINHERIT NOREPLICATION BYPASSRLS;
GRANT USAGE ON SCHEMA public, auth TO concierge_request_rls_reader;
GRANT SELECT (service_request_id, concierge_profile_id)
  ON public.service_request_recipients TO concierge_request_rls_reader;
GRANT EXECUTE ON FUNCTION auth.uid() TO concierge_request_rls_reader;
CREATE FUNCTION public.concierge_has_request_invitation(request_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog SET row_security = off AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.service_request_recipients AS recipient
    WHERE recipient.service_request_id = request_id
      AND recipient.concierge_profile_id = auth.uid()
  );
$$;
-- Ownership transfer needs CREATE on the containing schema; remove it immediately.
GRANT CREATE ON SCHEMA public TO concierge_request_rls_reader;
ALTER FUNCTION public.concierge_has_request_invitation(uuid)
  OWNER TO concierge_request_rls_reader;
REVOKE CREATE ON SCHEMA public FROM concierge_request_rls_reader;
REVOKE ALL ON FUNCTION public.concierge_has_request_invitation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.concierge_has_request_invitation(uuid) TO authenticated;
DROP POLICY service_requests_select_participants ON public.service_requests;
CREATE POLICY service_requests_select_participants ON public.service_requests
FOR SELECT TO authenticated USING (
  auth.uid() = owner_profile_id
  OR auth.uid() = selected_concierge_profile_id
  OR public.concierge_has_request_invitation(id)
);
COMMIT;
-- No other policy/grant changes. auth.uid() still depends on trusted JWT setup
-- by PostgREST; no role GUC is used to authorize privileged execution.
-- Test owner, invited/selected concierge, unrelated actors, anonymous, server,
-- direct helper calls and all recipient CRUD under real RLS, including FORCE RLS.
-- Rollback in one reviewed transaction: restore original SELECT policy from
-- 20260404113000, drop helper, DROP OWNED BY dedicated role, then DROP ROLE.
-- Restoring the original policy also restores the original recursion risk.
