-- Empreinte des lignes existantes, indépendante de l'ordre physique.
SELECT jsonb_build_object(
 'profiles',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.profiles t),
 'properties',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.properties t),
 'reservations',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.reservations t),
 'missions',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.missions t),
 'interventions',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.provider_interventions t),
 'reports',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.provider_intervention_reports t),
 'invoices',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.invoices t),
 'events',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.mission_events t),
 'alerts',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.provider_alerts t));
