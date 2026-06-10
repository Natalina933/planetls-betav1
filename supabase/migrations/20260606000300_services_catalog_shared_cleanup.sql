update public.services_catalog
set
  category = case
    when lower(trim(category)) in ('accueil', 'accueil voyageurs') then 'Accueil voyageurs'
    when lower(trim(category)) in ('administratif', 'gestion administrative') then 'Gestion administrative'
    when lower(trim(category)) in ('autres', 'autre besoin') then 'Autre besoin'
    else trim(category)
  end,
  service = trim(service),
  description = nullif(trim(coalesce(description, '')), ''),
  updated_at = now()
where category is distinct from trim(category)
   or service is distinct from trim(service)
   or description is distinct from nullif(trim(coalesce(description, '')), '')
   or lower(trim(category)) in ('accueil', 'administratif', 'autres');

with ranked_services as (
  select
    id,
    row_number() over (
      partition by lower(trim(category)), lower(trim(service))
      order by id
    ) as duplicate_rank
  from public.services_catalog
)
delete from public.services_catalog catalog
using ranked_services ranked
where catalog.id = ranked.id
  and ranked.duplicate_rank > 1;

