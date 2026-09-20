BEGIN;
-- Do not silently turn historical non-selection into rejection or reopen proposals.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.quotes WHERE status = 'not_selected') THEN
    RAISE EXCEPTION 'Rollback refusé : sauvegarder et traiter explicitement les devis non retenus';
  END IF;
END $$;
DROP TRIGGER guard_awarded_quote ON public.quotes;
DROP FUNCTION public.guard_awarded_quote();
DROP TRIGGER guard_service_request_award ON public.service_requests;
DROP FUNCTION public.guard_service_request_award();
DROP FUNCTION public.award_service_request_quote(uuid, uuid);
ALTER TABLE public.quotes DROP CONSTRAINT quotes_status_check;
ALTER TABLE public.quotes ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('draft','sent','accepted','rejected','expired','canceled'));
COMMIT;
