-- Synthétique uniquement. Chargement par le propriétaire dans la base jetable.
INSERT INTO public.profiles(id,email,first_name,last_name,role,status,category) VALUES
('10000000-0000-4000-8000-000000000001','owner1@example.invalid','Owner','One','owner','active','proprietaire'),
('10000000-0000-4000-8000-000000000002','owner2@example.invalid','Owner','Two','owner','active','proprietaire'),
('20000000-0000-4000-8000-000000000001','concierge1@example.invalid','Concierge','One','concierge','active','concierge'),
('20000000-0000-4000-8000-000000000002','concierge2@example.invalid','Concierge','Two','concierge_pro','active','concierge'),
('30000000-0000-4000-8000-000000000001','provider1@example.invalid','Provider','One','provider','active','artisan'),
('30000000-0000-4000-8000-000000000002','provider2@example.invalid','Provider','Two','artisan_pro','active','artisan'),
('40000000-0000-4000-8000-000000000001','admin@example.invalid','Admin','One','admin','active','admin'),
('40000000-0000-4000-8000-000000000002','super@example.invalid','Super','One','super_admin','active','super_admin'),
('40000000-0000-4000-8000-000000000003','suspended@example.invalid','Suspended','One','admin','suspended','admin'),
('40000000-0000-4000-8000-000000000004','demoted@example.invalid','Demoted','One','owner','active','proprietaire');
INSERT INTO public.properties(id,owner_id,name) VALUES
('50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Logement synthétique A'),
('50000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Logement synthétique B');
INSERT INTO public.reservations(id,owner_profile_id,concierge_profile_id,property_id,check_in_at,check_out_at,created_by_profile_id)
SELECT ('60000000-0000-4000-8000-00000000000'||n)::uuid,
  CASE WHEN n=2 THEN '10000000-0000-4000-8000-000000000002'::uuid ELSE '10000000-0000-4000-8000-000000000001'::uuid END,
  '20000000-0000-4000-8000-000000000001',
  CASE WHEN n=3 THEN NULL ELSE ('50000000-0000-4000-8000-00000000000'||n)::uuid END,
  '2030-06-01T12:00:00Z','2030-06-08T12:00:00Z','10000000-0000-4000-8000-000000000001'
FROM generate_series(1,3) n;
INSERT INTO public.missions(id,concierge_profile_id,owner_profile_id,property_id,reservation_id,title,status)
SELECT ('70000000-0000-4000-8000-00000000000'||n)::uuid,
  CASE WHEN n=3 THEN '20000000-0000-4000-8000-000000000002'::uuid ELSE '20000000-0000-4000-8000-000000000001'::uuid END,
  CASE WHEN n IN (3,5) THEN '10000000-0000-4000-8000-000000000002'::uuid ELSE '10000000-0000-4000-8000-000000000001'::uuid END,
  CASE WHEN n=4 THEN NULL WHEN n IN(3,6) THEN '50000000-0000-4000-8000-000000000002'::uuid ELSE '50000000-0000-4000-8000-000000000001'::uuid END,
  CASE WHEN n=2 THEN NULL WHEN n=3 THEN '60000000-0000-4000-8000-000000000002'::uuid
    WHEN n=4 THEN '60000000-0000-4000-8000-000000000003'::uuid ELSE '60000000-0000-4000-8000-000000000001'::uuid END,
  'Mission synthétique '||n,'draft' FROM generate_series(1,6) n;
INSERT INTO public.provider_interventions(id,provider_profile_id,owner_profile_id,title,metadata) VALUES
('80000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',
 '10000000-0000-4000-8000-000000000001','Autonome avec JSON forgé',
 '{"mission_id":"70000000-0000-4000-8000-000000000003","proof":{"path":"foreign"}}');
INSERT INTO public.provider_intervention_reports(provider_intervention_id,provider_profile_id,owner_profile_id,summary,submitted_by)
VALUES('80000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',
 '10000000-0000-4000-8000-000000000001','Rapport historique synthétique','30000000-0000-4000-8000-000000000001');
INSERT INTO public.invoices(id,invoice_number,concierge_profile_id,owner_profile_id,mission_id,status,metadata)
VALUES('90000000-0000-4000-8000-000000000001','C1D-HISTORY',
 '20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',
 '70000000-0000-4000-8000-000000000001','draft','{"fixture":"synthetic-history"}');
