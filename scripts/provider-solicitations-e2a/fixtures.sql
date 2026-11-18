-- Synthetic only. Run in the disposable database after the canonical baseline.
INSERT INTO public.profiles(id,email,first_name,last_name,role,status,category) VALUES
('10000000-0000-4000-8000-000000000001','owner1@example.invalid','Owner','One','owner','active','proprietaire'),
('10000000-0000-4000-8000-000000000002','owner2@example.invalid','Owner','Two','owner','active','proprietaire'),
('30000000-0000-4000-8000-000000000001','provider1@example.invalid','Provider','One','provider','active','artisan'),
('30000000-0000-4000-8000-000000000002','provider2@example.invalid','Provider','Two','provider','active','artisan');
INSERT INTO public.properties(id,owner_id,name,city) VALUES
('50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Synthetic property','Testville');
