update public.categories
set image = case key
  when 'proprietaire' then '/images/generated/hero-carousel/planetls-hero-proprietaires.png'
  when 'concierge' then '/images/generated/hero-carousel/planetls-hero-conciergeries.png'
  when 'conciergerie_pro' then '/images/generated/hero-carousel/planetls-hero-conciergeries.png'
  when 'artisan' then '/images/generated/hero-carousel/planetls-hero-artisans.png'
  when 'commercant' then '/images/generated/hero-carousel/planetls-hero-prestataires.png'
  when 'photographe' then '/images/generated/hero-carousel/planetls-hero-prestataires.png'
  when 'jardinier' then '/images/generated/hero-carousel/planetls-hero-prestataires.png'
  when 'reseaux' then '/images/generated/hero-carousel/planetls-hero-prestataires.png'
  when 'decoration' then '/images/generated/hero-carousel/planetls-hero-prestataires.png'
  when 'electricien' then '/images/generated/hero-carousel/planetls-hero-artisans.png'
  when 'plombier' then '/images/generated/hero-carousel/planetls-hero-artisans.png'
  when 'pisciniste' then '/images/generated/hero-carousel/planetls-hero-prestataires.png'
  when 'menuisier' then '/images/generated/hero-carousel/planetls-hero-artisans.png'
  when 'reparateur' then '/images/generated/hero-carousel/planetls-hero-artisans.png'
  when 'blanchisseur' then '/images/generated/hero-carousel/planetls-hero-prestataires.png'
  when 'maintenance' then '/images/generated/hero-carousel/planetls-hero-artisans.png'
  when 'installateur' then '/images/generated/hero-carousel/planetls-hero-artisans.png'
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
