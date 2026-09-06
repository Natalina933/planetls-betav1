import { parseMasterPlan } from "../../(product-tech)/developpement/masterPlan.ts";
import type { ProductPersona } from "../../(product-tech)/developpement/personas/personas.ts";

export type PersonaLot = { id: string; title: string; status: string; priority: string; source: "registry" | "capability" };

/** Statuts relus à la source ; aucune déduction de couverture depuis le statut d’un lot. */
export function readPersonaLots(markdown: string): PersonaLot[] {
  const plan = parseMasterPlan(markdown, "");
  if (plan.diagnostics.errors.length) throw new Error("Registre Master Plan invalide");
  const lots: PersonaLot[] = plan.registryItems.map((item) => ({
    id: item.id, title: item.title, status: item.statusLabel, priority: item.priorityLabel, source: "registry",
  }));
  for (const line of markdown.split(/\r?\n/)) {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim().replaceAll("`", ""));
    if (!/^PLS-CAP-\d{3}$/.test(cells[0] ?? "") || cells.length !== 7) continue;
    lots.push({ id: cells[0], title: cells[2], status: cells[4], priority: cells[5].split(";")[0].trim(), source: "capability" });
  }
  return lots;
}

export function buildCoverageRows(personas: ProductPersona[], lots: PersonaLot[]) {
  const byId = new Map(lots.map((lot) => [lot.id, lot]));
  return personas.flatMap((persona) => persona.needs.map((need) => ({
    personaId: persona.id, personaName: persona.name, need,
    // Garder les références manquantes visibles plutôt que les ignorer.
    lots: need.plsIds.map((id) => ({ id, lot: byId.get(id) ?? null })),
    coverage: need.assessment ? need.coverage : "unknown" as const,
  })));
}
