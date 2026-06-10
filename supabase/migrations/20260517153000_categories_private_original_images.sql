update public.categories
set image = case key
  when 'proprietaire' then '/images/carousel/planetls-private-proprietaires.png'
  when 'concierge' then '/images/carousel/planetls-private-conciergeries.png'
  when 'conciergerie_pro' then '/images/carousel/planetls-private-conciergeries.png'
  when 'artisan' then '/images/carousel/planetls-private-artisans.png'
  when 'commercant' then '/images/carousel/planetls-private-prestataires.png'
  when 'photographe' then '/images/carousel/planetls-private-photo.png'
  when 'jardinier' then '/images/carousel/planetls-private-exterieur.png'
  when 'reseaux' then '/images/carousel/planetls-private-prestataires.png'
  when 'decoration' then '/images/carousel/planetls-private-photo.png'
  when 'electricien' then '/images/carousel/planetls-private-maintenance.png'
  when 'plombier' then '/images/carousel/planetls-private-maintenance.png'
  when 'pisciniste' then '/images/carousel/planetls-private-exterieur.png'
  when 'menuisier' then '/images/carousel/planetls-private-maintenance.png'
  when 'reparateur' then '/images/carousel/planetls-private-maintenance.png'
  when 'blanchisseur' then '/images/carousel/planetls-private-linge.png'
  when 'maintenance' then '/images/carousel/planetls-private-maintenance.png'
  when 'installateur' then '/images/carousel/planetls-private-maintenance.png'
  else image
end
where key in (
  'proprietaire',
  'concierge',
  'conciergerie_pro',
  'artisan',
  'commercant',
  'photographe',
  'jardinier',
  'reseaux',
  'decoration',
  'electricien',
  'plombier',
  'pisciniste',
  'menuisier',
  'reparateur',
  'blanchisseur',
  'maintenance',
  'installateur'
);
