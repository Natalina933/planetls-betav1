update public.categories
set image = case key
  when 'concierge' then '/images/carousel/planetls-private-concierge-voyageurs.png'
  when 'conciergerie_pro' then '/images/carousel/planetls-private-concierge-voyageurs.png'
  when 'artisan' then '/images/carousel/planetls-private-artisans-metier.png'
  when 'commercant' then '/images/carousel/planetls-private-commercant.png'
  when 'photographe' then '/images/carousel/planetls-private-photographe.png'
  when 'jardinier' then '/images/carousel/planetls-private-jardinier.png'
  when 'decoration' then '/images/carousel/planetls-private-decoratrice.png'
  when 'electricien' then '/images/carousel/planetls-private-electricien.png'
  when 'plombier' then '/images/carousel/planetls-private-maintenance-metier.png'
  when 'pisciniste' then '/images/carousel/planetls-private-pisciniste.png'
  when 'menuisier' then '/images/carousel/planetls-private-menuisier.png'
  when 'reparateur' then '/images/carousel/planetls-private-maintenance-metier.png'
  when 'blanchisseur' then '/images/carousel/planetls-private-blanchisseur.png'
  when 'maintenance' then '/images/carousel/planetls-private-maintenance-metier.png'
  when 'installateur' then '/images/carousel/planetls-private-installateur-meuble.png'
  else image
end
where key in (
  'concierge',
  'conciergerie_pro',
  'artisan',
  'commercant',
  'photographe',
  'jardinier',
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
