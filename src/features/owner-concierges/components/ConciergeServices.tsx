import { presentConciergeServices } from "../lib/servicePresentation";

export function ConciergeServices({ values }: { values: readonly string[] }) {
  const presentation = presentConciergeServices(values);
  return <div aria-label="Prestations du professionnel">
    {presentation.sections.map((family) => <section key={family.slug}>
      <strong>{family.label}</strong>
      <ul>{family.services.map((service) => <li key={service.slug}>{service.label}</li>)}</ul>
    </section>)}
    {!presentation.services.length ? <p>Prestations à préciser</p> : null}
    {presentation.groups.length ? <p>Groupes déclarés, prestations à confirmer : {presentation.groups.map((group) => group.label).join(" · ")}</p> : null}
    {presentation.families.length ? <p>Familles déclarées, prestations à confirmer : {presentation.families.map((family) => family.label).join(" · ")}</p> : null}
    {presentation.unresolved.length ? <details><summary>Prestations historiques à confirmer ({presentation.unresolved.length})</summary><ul>{presentation.unresolved.map((value) => <li key={value}>{value}</li>)}</ul></details> : null}
  </div>;
}
