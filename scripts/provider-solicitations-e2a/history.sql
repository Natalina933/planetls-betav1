SELECT jsonb_build_object(
 'profiles',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.profiles t),
 'properties',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.properties t),
 'reservations',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.reservations t));
