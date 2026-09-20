BEGIN;

ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE public.quotes ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'canceled', 'not_selected'));

-- One winner for the current product policy, not a universal unique index on quotes.
-- The request is the arbitration lock; preserve existing metadata and downstream IDs.
CREATE FUNCTION public.award_service_request_quote(p_quote_id uuid, p_actor_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q public.quotes; r public.service_requests; recipient public.service_request_recipients;
  request_id uuid; recipient_id uuid; winner text;
BEGIN
  SELECT * INTO q FROM public.quotes WHERE id = p_quote_id;
  IF NOT FOUND OR q.owner_profile_id IS DISTINCT FROM p_actor_id THEN
    RAISE EXCEPTION 'Accès refusé au devis' USING ERRCODE = '42501';
  END IF;
  request_id := coalesce(q.service_request_id, nullif(q.metadata->>'service_request_id', '')::uuid);
  IF request_id IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO r FROM public.service_requests WHERE id = request_id FOR UPDATE;
  IF NOT FOUND OR r.owner_profile_id IS DISTINCT FROM p_actor_id THEN
    RAISE EXCEPTION 'Accès refusé à la demande' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO q FROM public.quotes WHERE id = p_quote_id FOR UPDATE;
  recipient_id := coalesce(q.service_request_recipient_id, nullif(q.metadata->>'service_request_recipient_id', '')::uuid);
  SELECT * INTO recipient FROM public.service_request_recipients WHERE id = recipient_id;
  IF NOT FOUND OR recipient.service_request_id IS DISTINCT FROM r.id
    OR recipient.concierge_profile_id IS DISTINCT FROM q.concierge_profile_id
    OR q.owner_profile_id IS DISTINCT FROM r.owner_profile_id
    OR coalesce(q.service_request_id, nullif(q.metadata->>'service_request_id','')::uuid) IS DISTINCT FROM r.id
    OR (q.metadata->>'service_request_id' IS NOT NULL AND q.metadata->>'service_request_id' <> r.id::text)
    OR (q.metadata->>'service_request_recipient_id' IS NOT NULL AND q.metadata->>'service_request_recipient_id' <> recipient.id::text) THEN
    RAISE EXCEPTION 'Rattachement du devis incohérent' USING ERRCODE = '40001';
  END IF;
  winner := nullif(r.metadata->>'selected_quote_id', '');
  IF (winner IS NOT NULL AND winner <> q.id::text)
    OR (r.selected_concierge_profile_id IS NOT NULL AND r.selected_concierge_profile_id <> q.concierge_profile_id)
    OR EXISTS (SELECT 1 FROM public.quotes other WHERE other.id <> q.id AND other.status = 'accepted'
      AND coalesce(other.service_request_id::text, other.metadata->>'service_request_id') = r.id::text) THEN
    RAISE EXCEPTION 'Cette demande est déjà attribuée à un autre devis' USING ERRCODE = '40001';
  END IF;
  IF q.status NOT IN ('sent', 'accepted') THEN
    RAISE EXCEPTION 'Ce devis ne peut pas être accepté' USING ERRCODE = '40001';
  END IF;
  IF winner = q.id::text AND q.status = 'accepted' THEN RETURN to_jsonb(r); END IF;

  UPDATE public.service_requests SET status = 'quote_accepted', selected_concierge_profile_id = q.concierge_profile_id,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('selected_quote_id', q.id,
      'selected_recipient_id', recipient.id, 'selected_at', coalesce(metadata->>'selected_at', now()::text))
    WHERE id = r.id RETURNING * INTO r;
  UPDATE public.quotes SET status = 'accepted', accepted_at = coalesce(accepted_at, now()) WHERE id = q.id;
  INSERT INTO public.quote_events(quote_id, actor_profile_id, event_type, payload)
    VALUES(q.id, p_actor_id, 'accepted', jsonb_build_object('service_request_id',r.id));
  -- Terminal refusals/withdrawals remain distinct. Only competing open proposals lose.
  WITH changed AS (
    UPDATE public.quotes SET status = 'not_selected'
    WHERE id <> q.id AND status IN ('draft', 'sent')
      AND coalesce(service_request_id::text, metadata->>'service_request_id') = r.id::text
    RETURNING id
  ) INSERT INTO public.quote_events(quote_id, actor_profile_id, event_type, payload)
    SELECT id, p_actor_id, 'status_changed', jsonb_build_object('to','not_selected','selected_quote_id',q.id) FROM changed;
  UPDATE public.service_request_recipients
    SET status = CASE WHEN id = recipient.id THEN 'selected' ELSE 'not_selected' END,
        responded_at = coalesce(responded_at, now()) WHERE service_request_id = r.id;
  RETURN to_jsonb(r);
END $$;
REVOKE ALL ON FUNCTION public.award_service_request_quote(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_service_request_quote(uuid, uuid) TO service_role;

-- Older APIs and direct authenticated writes cannot replace an existing winner.
CREATE FUNCTION public.guard_service_request_award() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF nullif(OLD.metadata->>'selected_quote_id','') IS NOT NULL AND
    (NEW.metadata->>'selected_quote_id' IS DISTINCT FROM OLD.metadata->>'selected_quote_id'
      OR NEW.selected_concierge_profile_id IS DISTINCT FROM OLD.selected_concierge_profile_id) THEN
    RAISE EXCEPTION 'Attribution déjà enregistrée' USING ERRCODE = '40001';
  END IF;
  IF current_user IN ('authenticated','anon') AND
    (NEW.metadata->>'selected_quote_id' IS DISTINCT FROM OLD.metadata->>'selected_quote_id'
      OR NEW.selected_concierge_profile_id IS DISTINCT FROM OLD.selected_concierge_profile_id) THEN
    RAISE EXCEPTION 'Utiliser le parcours serveur d’attribution' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_service_request_award BEFORE UPDATE ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.guard_service_request_award();

CREATE FUNCTION public.guard_awarded_quote() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE request_id text; winner text;
BEGIN
  request_id := coalesce(NEW.service_request_id::text, NEW.metadata->>'service_request_id');
  IF TG_OP = 'UPDATE' AND OLD.status IN ('accepted','not_selected')
    AND coalesce(OLD.service_request_id::text, OLD.metadata->>'service_request_id') IS NOT NULL
    AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.service_request_id IS DISTINCT FROM OLD.service_request_id
      OR NEW.service_request_recipient_id IS DISTINCT FROM OLD.service_request_recipient_id
      OR NEW.owner_profile_id IS DISTINCT FROM OLD.owner_profile_id OR NEW.concierge_profile_id IS DISTINCT FROM OLD.concierge_profile_id
      OR NEW.metadata->>'service_request_id' IS DISTINCT FROM OLD.metadata->>'service_request_id') THEN
    RAISE EXCEPTION 'Le résultat de l’attribution doit être conservé' USING ERRCODE = '40001';
  END IF;
  IF request_id IS NOT NULL AND NEW.status = 'accepted' THEN
    SELECT metadata->>'selected_quote_id' INTO winner FROM public.service_requests WHERE id::text = request_id;
    IF winner IS DISTINCT FROM NEW.id::text THEN
      RAISE EXCEPTION 'Utiliser l’arbitrage de la demande' USING ERRCODE = '40001';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_awarded_quote BEFORE INSERT OR UPDATE ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.guard_awarded_quote();
COMMIT;
