-- PLS-SEC-005 LOT 1: protect authorization attributes independently of legacy RLS.
-- No data rewrite. Administrative changes remain server/service-role operations.
BEGIN;

CREATE OR REPLACE FUNCTION public.guard_profile_authorization_attributes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Use the actual SQL executor, never user-editable JWT metadata or a GUC flag.
  -- Do not make this function SECURITY DEFINER: that would trust every caller.
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF current_user <> 'authenticated' OR auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Profile authorization changes require an authorized server operation'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.id IS DISTINCT FROM auth.uid() OR NEW.id IS DISTINCT FROM OLD.id
       OR NEW.role IS DISTINCT FROM OLD.role
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.category IS DISTINCT FROM OLD.category THEN
      RAISE EXCEPTION 'Profile identity, role, status and category are protected'
        USING ERRCODE = '42501';
    END IF;
  ELSE
    -- Direct client creation supports only the same basic personas as signup.
    -- A null/unknown role must not activate Auth.js's category fallback.
    IF NEW.id IS DISTINCT FROM auth.uid()
       OR NEW.status IS DISTINCT FROM 'active'
       OR NOT coalesce(
         (NEW.role = 'owner' AND NEW.category = 'proprietaire')
         OR (NEW.role = 'concierge' AND NEW.category = 'concierge')
         OR (NEW.role = 'provider' AND NEW.category = 'artisan'), false) THEN
      RAISE EXCEPTION 'Only an active basic signup profile may be created directly'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_profile_authorization_attributes() FROM PUBLIC;
CREATE OR REPLACE TRIGGER profiles_authorization_attributes_guard
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_authorization_attributes();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE ON public.profiles FROM PUBLIC, anon;
-- Prevent delete/recreate, TRUNCATE (which bypasses row RLS), and installation
-- of another trigger changing NEW after this guard. Server administration stays.
REVOKE DELETE, TRUNCATE, TRIGGER ON public.profiles FROM PUBLIC, anon, authenticated;
-- Keep ordinary column updates and signup usable; the trigger protects attributes
-- even if another legacy policy or grant also permits the operation.
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
    AND tablename = 'profiles' AND policyname = 'profiles_sec005_select_own') THEN
    CREATE POLICY profiles_sec005_select_own ON public.profiles FOR SELECT
      TO authenticated USING (id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
    AND tablename = 'profiles' AND policyname = 'profiles_sec005_insert_own') THEN
    CREATE POLICY profiles_sec005_insert_own ON public.profiles FOR INSERT
      TO authenticated WITH CHECK (id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
    AND tablename = 'profiles' AND policyname = 'profiles_sec005_update_own') THEN
    CREATE POLICY profiles_sec005_update_own ON public.profiles FOR UPDATE
      TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
END;
$$;

COMMIT;
