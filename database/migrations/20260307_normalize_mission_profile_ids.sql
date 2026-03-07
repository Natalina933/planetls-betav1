BEGIN;

-- Normalize missions identifiers on the *_profile_id convention.
ALTER TABLE IF EXISTS public.missions
  ADD COLUMN IF NOT EXISTS concierge_profile_id UUID,
  ADD COLUMN IF NOT EXISTS owner_profile_id UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'missions'
      AND column_name = 'concierge_id'
  ) THEN
    EXECUTE $sql$
      UPDATE public.missions
      SET concierge_profile_id = COALESCE(concierge_profile_id, concierge_id)
      WHERE concierge_profile_id IS NULL
        AND concierge_id IS NOT NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'missions'
      AND column_name = 'owner_id'
  ) THEN
    EXECUTE $sql$
      UPDATE public.missions
      SET owner_profile_id = COALESCE(owner_profile_id, owner_id)
      WHERE owner_profile_id IS NULL
        AND owner_id IS NOT NULL
    $sql$;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'missions_concierge_profile_id_fkey'
      AND conrelid = 'public.missions'::regclass
  ) THEN
    ALTER TABLE public.missions
      ADD CONSTRAINT missions_concierge_profile_id_fkey
      FOREIGN KEY (concierge_profile_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'missions_owner_profile_id_fkey'
      AND conrelid = 'public.missions'::regclass
  ) THEN
    ALTER TABLE public.missions
      ADD CONSTRAINT missions_owner_profile_id_fkey
      FOREIGN KEY (owner_profile_id)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_missions_concierge_profile_id
  ON public.missions(concierge_profile_id);

CREATE INDEX IF NOT EXISTS idx_missions_owner_profile_id
  ON public.missions(owner_profile_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'missions'
      AND column_name = 'concierge_profile_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.missions
    WHERE concierge_profile_id IS NULL
  ) THEN
    ALTER TABLE public.missions
      ALTER COLUMN concierge_profile_id SET NOT NULL;
  END IF;
END
$$;

COMMENT ON COLUMN public.missions.concierge_profile_id IS
  'Canonical concierge profile relation for missions.';
COMMENT ON COLUMN public.missions.owner_profile_id IS
  'Canonical owner profile relation for missions.';

-- Normalize mission_reviews identifiers on the *_profile_id convention.
ALTER TABLE IF EXISTS public.mission_reviews
  ADD COLUMN IF NOT EXISTS reviewer_profile_id UUID,
  ADD COLUMN IF NOT EXISTS reviewed_profile_id UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'mission_reviews'
      AND column_name = 'owner_id'
  ) THEN
    EXECUTE $sql$
      UPDATE public.mission_reviews
      SET reviewer_profile_id = COALESCE(reviewer_profile_id, owner_id)
      WHERE reviewer_profile_id IS NULL
        AND owner_id IS NOT NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'mission_reviews'
      AND column_name = 'concierge_id'
  ) THEN
    EXECUTE $sql$
      UPDATE public.mission_reviews
      SET reviewed_profile_id = COALESCE(reviewed_profile_id, concierge_id)
      WHERE reviewed_profile_id IS NULL
        AND concierge_id IS NOT NULL
    $sql$;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mission_reviews_reviewer_profile_id_fkey'
      AND conrelid = 'public.mission_reviews'::regclass
  ) THEN
    ALTER TABLE public.mission_reviews
      ADD CONSTRAINT mission_reviews_reviewer_profile_id_fkey
      FOREIGN KEY (reviewer_profile_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mission_reviews_reviewed_profile_id_fkey'
      AND conrelid = 'public.mission_reviews'::regclass
  ) THEN
    ALTER TABLE public.mission_reviews
      ADD CONSTRAINT mission_reviews_reviewed_profile_id_fkey
      FOREIGN KEY (reviewed_profile_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END
$$;

ALTER TABLE IF EXISTS public.mission_reviews
  DROP CONSTRAINT IF EXISTS mission_reviews_mission_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_mission_reviewer'
      AND conrelid = 'public.mission_reviews'::regclass
  ) THEN
    ALTER TABLE public.mission_reviews
      ADD CONSTRAINT uq_mission_reviewer UNIQUE (mission_id, reviewer_profile_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_mission_reviews_mission_id
  ON public.mission_reviews(mission_id);

CREATE INDEX IF NOT EXISTS idx_mission_reviews_reviewed_profile_id
  ON public.mission_reviews(reviewed_profile_id);

CREATE INDEX IF NOT EXISTS idx_mission_reviews_reviewer_profile_id
  ON public.mission_reviews(reviewer_profile_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'mission_reviews'
      AND column_name = 'reviewer_profile_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.mission_reviews
    WHERE reviewer_profile_id IS NULL
  ) THEN
    ALTER TABLE public.mission_reviews
      ALTER COLUMN reviewer_profile_id SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'mission_reviews'
      AND column_name = 'reviewed_profile_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.mission_reviews
    WHERE reviewed_profile_id IS NULL
  ) THEN
    ALTER TABLE public.mission_reviews
      ALTER COLUMN reviewed_profile_id SET NOT NULL;
  END IF;
END
$$;

COMMENT ON COLUMN public.mission_reviews.reviewer_profile_id IS
  'Canonical reviewer profile relation for mission reviews.';
COMMENT ON COLUMN public.mission_reviews.reviewed_profile_id IS
  'Canonical reviewed profile relation for mission reviews.';

ALTER TABLE IF EXISTS public.mission_reviews
  DROP COLUMN IF EXISTS concierge_id,
  DROP COLUMN IF EXISTS owner_id;

ALTER TABLE IF EXISTS public.missions
  DROP COLUMN IF EXISTS concierge_id,
  DROP COLUMN IF EXISTS owner_id;

COMMIT;
