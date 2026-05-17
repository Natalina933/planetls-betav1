ALTER TABLE IF EXISTS public.services_packages
  ADD COLUMN IF NOT EXISTS accent text NOT NULL DEFAULT 'teal'
  CHECK (accent IN ('teal', 'sand', 'gold', 'slate'));
