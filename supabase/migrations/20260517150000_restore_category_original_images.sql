update public.categories
set image = case key
  when 'proprietaire' then '/images/carousel/proprio.jpeg'
  when 'concierge' then '/images/carousel/concierges.jpg'
  when 'conciergerie_pro' then '/images/carousel/conciergerie pro.jpg'
  when 'artisan' then '/images/carousel/artisans.jpg'
  when 'commercant' then '/images/carousel/commercant.jpeg'
  when 'photographe' then '/images/carousel/photographe.jpg'
  when 'jardinier' then '/images/carousel/jardinier.jpg'
  when 'reseaux' then '/images/carousel/reseaux.jpeg'
  when 'decoration' then '/images/carousel/decoratrice.jpg'
  when 'electricien' then '/images/carousel/electricien.jpg'
  when 'plombier' then '/images/carousel/plombier.jpg'
  when 'pisciniste' then '/images/carousel/pisciniste.jpg'
  when 'menuisier' then '/images/carousel/menuisier.jpg'
  when 'reparateur' then '/images/carousel/reparateur.jpg'
  when 'blanchisseur' then '/images/carousel/blanchisseur.jpg'
  when 'maintenance' then '/images/carousel/maintenance.jpg'
  when 'installateur' then '/images/carousel/installateur.jpg'
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
