// Projection de présentation du référentiel local : aucun statut métier écrit ou déduit.
export const SOCLE_SPACES = ["Propriétaire", "Conciergerie", "Artisans / Prestataires"] as const;
export type SocleSpace = typeof SOCLE_SPACES[number];
export type DevelopmentAssessment = "implemented" | "partial" | "not_started" | "not_assessed";
export type CapabilityPresentation = {
  id: string;
  label: string;
  scope: "core" | "improvement" | "future";
  spaces: SocleSpace[];
  development: DevelopmentAssessment;
  qualification: string;
  implementationCriteria: string;
  validationCriteria: string;
  limitations: string;
  obligations: string[];
  source: string;
  sourceKeys: string[];
  validation: "not_assessed";
};
export type SoclePresentation = {
  capabilities: CapabilityPresentation[];
  historicalEvidence: string[];
  securityGates: string[];
  diagnostic: string | null;
  sourceBundles: Record<string, string>;
};
export const ASSESSMENT_LABELS: Record<DevelopmentAssessment, string> = {
  implemented: "Implémentée", partial: "Partielle", not_started: "Non commencée", not_assessed: "Non évaluée",
};
const referencePath = "docs/planetls-progress-functional-reference.md";
const improvements = new Set(["PFC-CON-04", "PFC-CON-06", "PFC-CON-08", "PFC-DASH-04", "PFC-DASH-05"]);
const futures = new Set(["PFC-CON-07", "PFC-CON-10"]);
const shortIds = (text: string): string[] => text.match(/\b(?:AUTH|PROF|RECH|MSG|NOT|DEV|COL|LOG|SEJ|MIS|FAC|CON|ART|DASH)-\d{2}\b/g) ?? [];
const cells = (line: string) => line.split("|").slice(1, -1).map(value => value.trim());

export function parseSoclePresentation(reference: string, arbitration: string): SoclePresentation {
  const lines = reference.split(/\r?\n/);
  const capabilities: CapabilityPresentation[] = [];
  const sourceBundles = Object.fromEntries(lines.filter(line => /^\| S\d{2} \|/.test(line))
    .map(line => { const columns = cells(line); return [columns[0], columns.slice(1).join(" — ")]; }));
  const bindings = new Map<string, Set<SocleSpace>>();
  for (const line of lines) {
    const parent = line.match(/^\| (OWN|CON|ART)-\d{3} \|/);
    if (!parent) continue;
    const space = SOCLE_SPACES[parent[1] === "OWN" ? 0 : parent[1] === "CON" ? 1 : 2];
    for (const id of shortIds(cells(line)[3] ?? "")) {
      const consumers = bindings.get(`PFC-${id}`) ?? new Set<SocleSpace>();
      consumers.add(space);
      bindings.set(`PFC-${id}`, consumers);
    }
  }
  // Les obligations B3 restent visibles sans inventer de rattachement par rôle.
  const b3 = reference.slice(reference.indexOf("## 11."));
  const decisions = b3.split(/\r?\n/).filter(line => /^\| ARB-\d{2}/.test(line));
  lines.forEach((line, index) => {
    if (!/^\| PFC-[A-Z]+-\d{2} \|/.test(line)) return;
    const [id, title, implementationCriteria, qualification, validationCriteria, , limitations] = cells(line);
    const label = id === "PFC-FAC-02" ? "Suivre un règlement direct déclaré et contestable"
      : id === "PFC-CON-05" ? "Protéger les accès simplifiés et consignes"
        : id === "PFC-NOT-02" ? "Distribuer les emails essentiels" : title.replace(/ \/ [SAF]$/, "");
    capabilities.push({ id, label,
      scope: improvements.has(id) ? "improvement" : futures.has(id) ? "future" : "core",
      spaces: [...(bindings.get(id) ?? [])], development: "not_assessed", validation: "not_assessed",
      qualification, implementationCriteria, validationCriteria, limitations,
      obligations: decisions.filter(row => shortIds(cells(row)[1] ?? "").includes(id.slice(4)))
        .map(row => { const columns = cells(row); return `${columns[0]} : ${columns[2]}. Écarts : ${columns[3]}. Contrôles : ${columns[4]}`; }),
      source: `${referencePath}:${index + 1}`,
      sourceKeys: qualification.match(/S\d{2}/g) ?? [],
    });
  });
  const counts = (scope: CapabilityPresentation["scope"]) => capabilities.filter(item => item.scope === scope).length;
  const securityGates = arbitration.split(/\r?\n/).filter(line => /^\| G\d{2} —/.test(line)).map(line => cells(line).join(" — "));
  const ids = new Set(capabilities.map(item => item.id));
  const unknownBinding = [...bindings.keys()].some(id => !ids.has(id));
  if (capabilities.length !== 52 || ids.size !== 52 || counts("core") !== 45 || counts("improvement") !== 5 || counts("future") !== 2
    || decisions.length !== 9 || !b3.includes("PFC-NOT-02 : A historique → S cible")
    || securityGates.length !== 10 || unknownBinding || capabilities.some(item => !item.spaces.length || !item.implementationCriteria || !item.validationCriteria
      || !item.sourceKeys.length || item.sourceKeys.some(key => !sourceBundles[key]))) {
    return { capabilities: [], historicalEvidence: [], securityGates: [], sourceBundles: {}, diagnostic: "Référentiel local incomplet ou incompatible avec le périmètre B3 : indicateurs non évalués." };
  }
  return { capabilities, sourceBundles,
    historicalEvidence: lines.filter(line => /^\| H0[1-4] \|/.test(line)).map(line => cells(line).join(" — ")),
    securityGates,
    diagnostic: null,
  };
}

export function summarizeSocle(capabilities: CapabilityPresentation[], space?: SocleSpace) {
  const unique = [...new Map(capabilities.filter(item => item.scope === "core" && (!space || item.spaces.includes(space)))
    .map(item => [item.id, item])).values()];
  return { total: unique.length,
    counts: Object.fromEntries(Object.keys(ASSESSMENT_LABELS).map(state => [state, unique.filter(item => item.development === state).length])) as Record<DevelopmentAssessment, number>,
    developmentPercentage: null, validationPercentage: null,
  };
}
