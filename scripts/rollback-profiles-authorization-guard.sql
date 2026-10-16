-- PLS-SEC-005 LOT 1: fail-closed emergency rollback, NOT a restore of unsafe grants.
-- Run only after explicit approval, after saving the prior schema/ACL snapshot.
-- Ordinary direct client INSERT/UPDATE stops; guarded server operations remain.
-- No row, policy, function or trigger is deleted.
BEGIN;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER ON public.profiles FROM PUBLIC, anon, authenticated;
DO $$
DECLARE
  columns_sql text;
BEGIN
  SELECT string_agg(quote_ident(attname), ', ' ORDER BY attnum)
    INTO columns_sql FROM pg_attribute
    WHERE attrelid = 'public.profiles'::regclass AND attnum > 0 AND NOT attisdropped;
  EXECUTE format('REVOKE INSERT (%s), UPDATE (%s) ON public.profiles FROM PUBLIC, anon, authenticated', columns_sql, columns_sql);
END;
$$;
ALTER TABLE public.profiles DISABLE TRIGGER profiles_authorization_attributes_guard;
COMMIT;
