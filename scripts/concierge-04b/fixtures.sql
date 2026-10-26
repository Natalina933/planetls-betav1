-- Entirely synthetic, deterministic IDs; no external source. Inserted as postgres.
-- Availability remains the TEXT JSON representation in the canonical bootstrap.
INSERT INTO public.profiles(id,first_name,last_name,email,role,category,status,city,service_radius_km,availability_hours) VALUES
('10000000-0000-4000-8000-000000000001','Owner','Alpha','owner.alpha@example.invalid','owner','owner','active','Ville Démo A',NULL,NULL),
('10000000-0000-4000-8000-000000000002','Owner','Beta','owner.beta@example.invalid','owner','owner','active','Ville Démo B',NULL,NULL),
('20000000-0000-4000-8000-000000000001','Concierge','Alpha','concierge.alpha@example.invalid','concierge','concierge','active','Ville Démo A',10,'{"zones":[{"placeId":"demo:a","label":"Zone démo A","lat":48.85,"lng":2.35}],"radiusDeclaration":"explicit"}'),
('20000000-0000-4000-8000-000000000002','Concierge','Beta','concierge.beta@example.invalid','concierge','concierge','active','Ville Démo A',15,'{"zones":[{"placeId":"demo:b","label":"Zone démo A bis","lat":48.86,"lng":2.36}],"radiusDeclaration":"explicit"}'),
('20000000-0000-4000-8000-000000000003','Concierge','Gamma','concierge.gamma@example.invalid','concierge','concierge','active','Ville Démo B',5,'{"zones":[{"placeId":"demo:c","label":"Zone démo B","lat":43.60,"lng":1.44}],"radiusDeclaration":"explicit"}');
UPDATE public.profiles SET option='guest_checkin_checkout,cleaning_turnover,linen_change' WHERE role='concierge';
INSERT INTO public.housing(id,nom_logement,proprietaire,location) VALUES
(94001,'Logement démo A','{"owner_profile_id":"10000000-0000-4000-8000-000000000001"}','{"latitude":48.85,"longitude":2.35}'),
(94002,'Logement démo B','{"owner_profile_id":"10000000-0000-4000-8000-000000000002"}','{"latitude":43.60,"longitude":1.44}'),
(94003,'Logement démo historique','{"owner_profile_id":"10000000-0000-4000-8000-000000000001"}','{"latitude":48.85,"longitude":2.35}');
-- Current catalogue labels/slugs; fixture-only IDs for check-in/check-out/bundle.
INSERT INTO public.services_catalog(id,category,service) VALUES
(2,'Ménage et linge','Ménage entre deux séjours'),(9,'Ménage et linge','Changement de linge'),
(94001,'Conciergerie et voyageurs','Check-in'),(94002,'Conciergerie et voyageurs','Check-out'),
(94003,'Conciergerie et voyageurs','Check-in & Check-out');
INSERT INTO public.services_pricing(profile_id,service_id,label,amount)
SELECT id,2,'Ménage démo',25 FROM public.profiles WHERE role='concierge';
INSERT INTO public.service_requests(id,owner_profile_id,request_type,status,title,requested_services,city,metadata) VALUES
('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','ponctuel','sent','Demande démo multi-prestations',
 ARRAY['guest_checkin_checkout','cleaning_turnover','linen_change'],'Ville Démo A','{"fixture":"04b","service_modalities":{"guest_checkin_checkout":"arrival_departure"}}'),
('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','durable','sent','Collaboration sans date',
 ARRAY['cleaning_turnover'],'Ville Démo B','{"fixture":"04b","continuous_collaboration":true}');
INSERT INTO public.service_request_recipients(id,service_request_id,concierge_profile_id) VALUES
('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001'),
('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002'),
('40000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003');
INSERT INTO public.quotes(id,quote_number,concierge_profile_id,owner_profile_id,status,service_request_id,service_request_recipient_id) VALUES
('50000000-0000-4000-8000-000000000001','DEMO-04B-Q1','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','sent','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001'),
('50000000-0000-4000-8000-000000000002','DEMO-04B-Q2','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','sent','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002'),
('50000000-0000-4000-8000-000000000003','DEMO-04B-Q3','20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','sent','30000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000003');
INSERT INTO public.quote_items(quote_id,service_id,label,quantity,unit_price,line_total,metadata)
SELECT q.id,s.id,s.service,1,25,25,jsonb_build_object('operational_service_slug',s.slug)
FROM public.quotes q CROSS JOIN (VALUES (94001,'Check-in','guest_checkin'),(94002,'Check-out','guest_checkout'),
 (2,'Ménage entre deux séjours','cleaning_turnover'),(9,'Changement de linge','linen_change')) s(id,service,slug)
WHERE q.id IN ('50000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000002');
INSERT INTO public.housing_collaborations(id,housing_id,owner_profile_id,concierge_profile_id,status,collaboration_type,scope) VALUES
('60000000-0000-4000-8000-000000000001',94001,'10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','active','one_off','{"fixture":"04b","sentinel":"preserve"}'),
('60000000-0000-4000-8000-000000000002',94002,'10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','active','regular','{"fixture":"04b","continuous_collaboration":true}'),
('60000000-0000-4000-8000-000000000003',94003,'10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','ended','regular','{"fixture":"04b","history":"must-remain"}');
INSERT INTO public.missions(id,owner_profile_id,concierge_profile_id,title,status,metadata) VALUES
('70000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Intervention historique démo','completed','{"fixture":"04b","sentinel":"preserve"}');
INSERT INTO public.invoices(id,invoice_number,owner_profile_id,concierge_profile_id,mission_id,status,metadata) VALUES
('80000000-0000-4000-8000-000000000001','DEMO-04B-HISTORY','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001','paid','{"fixture":"04b","sentinel":"preserve"}');
