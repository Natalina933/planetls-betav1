import { presentConciergeServices } from "../lib/servicePresentation";

export function ConciergeServices({ values, compact = false }: { values: readonly string[]; compact?: boolean }) {
  const presentation = presentConciergeServices(values);
  const mainServices = new Set((compact ? presentation.services.slice(0, 4) : presentation.services).map(service => service.slug));
  const remainingServices = presentation.services.filter(service => !mainServices.has(service.slug));
  return <div aria-label="Prestations du professionnel">
    {presentation.sections.filter(family => family.services.some(service => mainServices.has(service.slug))).map((family) => <section key={family.slug}>
      <strong>{family.label}</strong>
      <ul>{family.services.filter(service => mainServices.has(service.slug)).map((service) => <li key={service.slug}>{service.label}</li>)}</ul>
    </section>)}
    {remainingServices.length ? <details><summary>Voir les {remainingServices.length} autres prestations</summary><ul>{remainingServices.map(service => <li key={service.slug}>{service.label}</li>)}</ul></details> : null}
    {!presentation.services.length ? <p>Prestations à préciser</p> : null}
    {presentation.groups.length ? <p>Groupes déclarés, prestations à confirmer : {presentation.groups.map((group) => group.label).join(" · ")}</p> : null}
    {presentation.families.length ? <p>Familles déclarées, prestations à confirmer : {presentation.families.map((family) => family.label).join(" · ")}</p> : null}
    {presentation.unresolved.length ? <details><summary>Prestations historiques à confirmer ({presentation.unresolved.length})</summary><ul>{presentation.unresolved.map((value) => <li key={value}>{value}</li>)}</ul></details> : null}
  </div>;
}
