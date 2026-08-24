-- PLS-CAP-016 Lot 1: canonical Admin problem registry and append-only history.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.admin_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('onboarding', 'operation', 'finance', 'support', 'technical', 'security', 'content', 'strategy')),
  severity TEXT NOT NULL CHECK (severity IN ('information', 'vigilance', 'prioritaire', 'critique')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'in_progress', 'escalated', 'resolved', 'closed', 'reopened')),
  fingerprint CHAR(64) NOT NULL UNIQUE CHECK (fingerprint ~ '^[0-9a-f]{64}$'),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 500),
  source TEXT NOT NULL CHECK (char_length(source) BETWEEN 1 AND 80),
  entity_type TEXT NOT NULL CHECK (char_length(entity_type) BETWEEN 1 AND 80),
  entity_id TEXT NOT NULL CHECK (char_length(entity_id) BETWEEN 1 AND 160),
  functional_owner TEXT NOT NULL CHECK (functional_owner IN ('operations', 'support', 'finance', 'tech', 'direction')),
  first_detected_at TIMESTAMPTZ NOT NULL,
  last_detected_at TIMESTAMPTZ NOT NULL,
  occurrence_count INTEGER NOT NULL DEFAULT 1 CHECK (occurrence_count >= 1),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (last_detected_at >= first_detected_at)
);

CREATE TABLE IF NOT EXISTS public.admin_problem_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.admin_problems(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'redetected', 'status_changed', 'severity_changed', 'owner_changed', 'resolved', 'reopened')),
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  previous_status TEXT,
  next_status TEXT,
  previous_severity TEXT,
  next_severity TEXT,
  previous_functional_owner TEXT,
  next_functional_owner TEXT,
  note TEXT CHECK (note IS NULL OR char_length(note) <= 500),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_problems_open_priority
  ON public.admin_problems(
    (CASE severity
      WHEN 'information' THEN 1
      WHEN 'vigilance' THEN 2
      WHEN 'prioritaire' THEN 3
      WHEN 'critique' THEN 4
      ELSE 0
    END) DESC,
    last_detected_at DESC
  )
  WHERE status NOT IN ('resolved', 'closed');
CREATE INDEX IF NOT EXISTS idx_admin_problems_entity
  ON public.admin_problems(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_problem_events_problem_occurred
  ON public.admin_problem_events(problem_id, occurred_at DESC);

ALTER TABLE public.admin_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_problem_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.admin_problem_severity_rank(value TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE value
    WHEN 'information' THEN 1
    WHEN 'vigilance' THEN 2
    WHEN 'prioritaire' THEN 3
    WHEN 'critique' THEN 4
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.create_or_redetect_admin_problem(
  p_type TEXT,
  p_severity TEXT,
  p_fingerprint TEXT,
  p_title TEXT,
  p_summary TEXT,
  p_source TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_functional_owner TEXT,
  p_detected_at TIMESTAMPTZ DEFAULT now()
)
RETURNS public.admin_problems
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_problem public.admin_problems;
  previous_problem public.admin_problems;
  next_status TEXT;
  next_severity TEXT;
  event_name TEXT;
BEGIN
  -- Serializes a logical incident before checking its unique fingerprint.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_fingerprint, 0));

  SELECT * INTO current_problem
  FROM public.admin_problems
  WHERE fingerprint = p_fingerprint
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.admin_problems (
      type, severity, status, fingerprint, title, summary, source, entity_type, entity_id,
      functional_owner, first_detected_at, last_detected_at
    ) VALUES (
      p_type, p_severity, 'new', p_fingerprint, p_title, p_summary, p_source, p_entity_type, p_entity_id,
      p_functional_owner, p_detected_at, p_detected_at
    ) RETURNING * INTO current_problem;

    INSERT INTO public.admin_problem_events (problem_id, event_type, next_status, next_severity, next_functional_owner)
    VALUES (current_problem.id, 'created', current_problem.status, current_problem.severity, current_problem.functional_owner);
    RETURN current_problem;
  END IF;

  next_status := CASE current_problem.status
    WHEN 'closed' THEN 'reopened'
    WHEN 'resolved' THEN 'in_progress'
    ELSE current_problem.status
  END;
  next_severity := CASE
    WHEN public.admin_problem_severity_rank(p_severity) > public.admin_problem_severity_rank(current_problem.severity)
      THEN p_severity
    ELSE current_problem.severity
  END;
  previous_problem := current_problem;

  UPDATE public.admin_problems
  SET severity = next_severity,
      status = next_status,
      title = p_title,
      summary = p_summary,
      source = p_source,
      functional_owner = p_functional_owner,
      last_detected_at = GREATEST(last_detected_at, p_detected_at),
      occurrence_count = occurrence_count + 1,
      resolved_at = CASE WHEN next_status IN ('reopened', 'in_progress') THEN NULL ELSE resolved_at END,
      updated_at = now()
  WHERE id = current_problem.id
  RETURNING * INTO current_problem;

  event_name := CASE WHEN next_status = 'reopened' THEN 'reopened' ELSE 'redetected' END;
  INSERT INTO public.admin_problem_events (
    problem_id, event_type, previous_status, next_status, previous_severity, next_severity,
    previous_functional_owner, next_functional_owner
  ) VALUES (
    current_problem.id, event_name, previous_problem.status, next_status, previous_problem.severity, next_severity,
    previous_problem.functional_owner, p_functional_owner
  );

  RETURN current_problem;
END;
$$;

CREATE OR REPLACE FUNCTION public.change_admin_problem_status(
  p_problem_id UUID,
  p_next_status TEXT,
  p_actor_profile_id UUID DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS public.admin_problems
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_problem public.admin_problems;
  previous_status TEXT;
  is_allowed BOOLEAN;
BEGIN
  SELECT * INTO current_problem FROM public.admin_problems WHERE id = p_problem_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Admin problem not found' USING ERRCODE = 'P0002'; END IF;
  IF p_next_status = current_problem.status THEN RETURN current_problem; END IF;
  previous_status := current_problem.status;

  is_allowed := (current_problem.status = 'new' AND p_next_status IN ('acknowledged', 'in_progress', 'escalated'))
    OR (current_problem.status = 'acknowledged' AND p_next_status IN ('in_progress', 'escalated', 'resolved'))
    OR (current_problem.status = 'in_progress' AND p_next_status IN ('escalated', 'resolved'))
    OR (current_problem.status = 'escalated' AND p_next_status IN ('in_progress', 'resolved'))
    OR (current_problem.status = 'resolved' AND p_next_status IN ('closed', 'in_progress'))
    OR (current_problem.status = 'closed' AND p_next_status = 'reopened')
    OR (current_problem.status = 'reopened' AND p_next_status IN ('acknowledged', 'in_progress', 'escalated'));
  IF NOT is_allowed THEN RAISE EXCEPTION 'Invalid admin problem status transition' USING ERRCODE = '22023'; END IF;
  IF p_next_status = 'closed' AND char_length(trim(COALESCE(p_note, ''))) < 3 THEN
    RAISE EXCEPTION 'A closing report is required' USING ERRCODE = '22023';
  END IF;

  UPDATE public.admin_problems
  SET status = p_next_status,
      resolved_at = CASE WHEN p_next_status = 'resolved' THEN now() WHEN p_next_status IN ('in_progress', 'reopened') THEN NULL ELSE resolved_at END,
      updated_at = now()
  WHERE id = current_problem.id
  RETURNING * INTO current_problem;

  INSERT INTO public.admin_problem_events (problem_id, event_type, actor_profile_id, previous_status, next_status, note)
  VALUES (
    current_problem.id,
    CASE WHEN p_next_status = 'resolved' THEN 'resolved' WHEN p_next_status = 'reopened' THEN 'reopened' ELSE 'status_changed' END,
    p_actor_profile_id, previous_status, p_next_status, NULLIF(trim(COALESCE(p_note, '')), '')
  );
  RETURN current_problem;
END;
$$;

REVOKE ALL ON FUNCTION public.create_or_redetect_admin_problem(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.change_admin_problem_status(UUID, TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.admin_problems IS 'PLS-CAP-016 current Admin problem registry. Stores minimal references, never source payloads or message bodies.';
COMMENT ON TABLE public.admin_problem_events IS 'PLS-CAP-016 append-only audit history for Admin problem changes.';

COMMIT;
