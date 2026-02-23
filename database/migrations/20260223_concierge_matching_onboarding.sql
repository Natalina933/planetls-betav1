-- Concierge onboarding + owner matching snapshots
-- Date: 2026-02-23

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.concierge_owner_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concierge_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL,
  listing_source VARCHAR(20) NOT NULL CHECK (listing_source IN ('property', 'housing')),
  owner_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  city TEXT,
  postal_code TEXT,
  property_type TEXT,
  surface_m2 NUMERIC(10,2),
  services_wanted JSONB NOT NULL DEFAULT '[]'::jsonb,
  matched_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  compatibility_ratio TEXT,
  compatibility_score INTEGER NOT NULL DEFAULT 0 CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  distance_km NUMERIC(10,2),
  budget_note TEXT,
  match_status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (match_status IN ('new', 'contacted', 'archived')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_concierge_owner_matches_unique_listing
  ON public.concierge_owner_matches(concierge_profile_id, listing_id);

CREATE INDEX IF NOT EXISTS idx_concierge_owner_matches_concierge
  ON public.concierge_owner_matches(concierge_profile_id, compatibility_score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_concierge_owner_matches_owner
  ON public.concierge_owner_matches(owner_profile_id);

CREATE INDEX IF NOT EXISTS idx_concierge_owner_matches_status
  ON public.concierge_owner_matches(match_status);

CREATE OR REPLACE FUNCTION public.set_concierge_owner_matches_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_concierge_owner_matches_updated_at ON public.concierge_owner_matches;
CREATE TRIGGER trg_set_concierge_owner_matches_updated_at
BEFORE UPDATE ON public.concierge_owner_matches
FOR EACH ROW
EXECUTE FUNCTION public.set_concierge_owner_matches_updated_at();

COMMIT;
