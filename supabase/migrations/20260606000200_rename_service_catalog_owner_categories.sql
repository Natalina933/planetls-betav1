update public.services_catalog
set category = case
  when category = 'Accueil' then 'Accueil voyageurs'
  when category = 'Administratif' then 'Gestion administrative'
  when category = 'Autres' then 'Autre besoin'
  else category
end
where category in ('Accueil', 'Administratif', 'Autres');

