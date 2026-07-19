BEGIN;

CREATE TABLE IF NOT EXISTS public.provider_profile_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('insurance', 'certification', 'identity', 'company', 'portfolio', 'other')),
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 200),
  storage_bucket TEXT NOT NULL DEFAULT 'mission-evidence',
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  sha256 TEXT NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  expires_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_profile_documents_owner
  ON public.provider_profile_documents(provider_profile_id, created_at DESC);

ALTER TABLE public.provider_profile_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS provider_documents_select_owner ON public.provider_profile_documents;
CREATE POLICY provider_documents_select_owner ON public.provider_profile_documents
  FOR SELECT USING (auth.role() = 'service_role' OR auth.uid() = provider_profile_id);

DROP POLICY IF EXISTS provider_documents_insert_owner ON public.provider_profile_documents;
CREATE POLICY provider_documents_insert_owner ON public.provider_profile_documents
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR (auth.uid() = provider_profile_id AND auth.uid() = uploaded_by)
  );

DROP POLICY IF EXISTS provider_documents_delete_owner ON public.provider_profile_documents;
CREATE POLICY provider_documents_delete_owner ON public.provider_profile_documents
  FOR DELETE USING (auth.role() = 'service_role' OR auth.uid() = provider_profile_id);

COMMIT;