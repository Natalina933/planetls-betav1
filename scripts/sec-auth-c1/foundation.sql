-- Fondation synthétique, sans Supabase. Préparée seulement, jamais appliquée ici.
-- Stock PostgreSQL 17, brand-new cluster only. Refuse pre-existing application objects.
DO $$ BEGIN
  IF current_setting('server_version_num')::int NOT BETWEEN 170000 AND 179999
    OR to_regnamespace('auth') IS NOT NULL OR to_regnamespace('storage') IS NOT NULL
    OR EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public')
    OR EXISTS (SELECT 1 FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role','harness_client','harness_server'))
  THEN RAISE EXCEPTION 'Unexpected pre-existing foundation'; END IF;
END $$;
CREATE ROLE anon NOLOGIN NOSUPERUSER NOBYPASSRLS;
CREATE ROLE authenticated NOLOGIN NOSUPERUSER NOBYPASSRLS;
CREATE ROLE service_role NOLOGIN NOSUPERUSER BYPASSRLS;
CREATE ROLE harness_client LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS;
CREATE ROLE harness_server LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS;
GRANT authenticated, anon TO harness_client;
GRANT service_role TO harness_server;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),
    nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid;
$$;
-- Fake JWT fields are test inputs, NEVER proof of the actual PostgreSQL role.
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claim.role',true),''),
    nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role', current_user::text);
$$;
GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role;
CREATE SCHEMA storage;
-- Only storage.buckets is referenced by the canonical migrations as inventoried.
CREATE TABLE storage.buckets(id text PRIMARY KEY, name text NOT NULL, public boolean DEFAULT false,
  file_size_limit bigint, allowed_mime_types text[]);
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
-- Explicit synthetic ACL baseline, applied BEFORE historical migrations so their
-- specific revocations win. This is not an observation of the remote project ACL.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role;
CREATE SCHEMA harness;
CREATE TABLE harness.migration_log(path text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz DEFAULT clock_timestamp());
CREATE FUNCTION harness.assert_true(ok boolean, message text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERT: %',message; END IF; END $$;
CREATE FUNCTION harness.expect_error(command text, expected text) RETURNS void LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  d_state TEXT; d_message TEXT; d_detail TEXT; d_hint TEXT; d_context TEXT;
  d_table TEXT; d_column TEXT; d_constraint TEXT;
BEGIN
  BEGIN EXECUTE command;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS d_state=RETURNED_SQLSTATE, d_message=MESSAGE_TEXT,
      d_detail=PG_EXCEPTION_DETAIL, d_hint=PG_EXCEPTION_HINT, d_context=PG_EXCEPTION_CONTEXT,
      d_table=TABLE_NAME, d_column=COLUMN_NAME, d_constraint=CONSTRAINT_NAME;
    -- NOTICE arrive au client et dans le journal, même si l'erreur est attendue.
    RAISE NOTICE 'C1D_PG %', jsonb_build_object('sqlstate',d_state,'message',d_message,
      'detail',d_detail,'hint',d_hint,'context',d_context,'table',d_table,
      'column',d_column,'constraint',d_constraint,'expected',expected);
    IF d_state = ANY(string_to_array(expected, ',')) THEN RETURN; END IF;
    RAISE; -- Préserve l'erreur originale, son SQLSTATE et ses diagnostics.
  END;
  RAISE EXCEPTION 'Expected SQLSTATE %, command succeeded',expected;
END $$;
GRANT USAGE ON SCHEMA harness TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION harness.assert_true(boolean,text), harness.expect_error(text,text)
  TO authenticated, service_role, anon;
