-- Enable RLS for provider workspace tables exposed via PostgREST
-- Date: 2026-03-07

BEGIN;

ALTER TABLE IF EXISTS public.provider_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.provider_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.provider_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.provider_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.provider_alerts ENABLE ROW LEVEL SECURITY;

COMMIT;
