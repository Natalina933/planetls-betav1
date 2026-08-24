import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parseMasterPlan } from "../src/app/dashboard/admin/(product-tech)/developpement/masterPlan.ts";

async function main() {
  const masterPlanPath = path.join(process.cwd(), "docs", "master-plan-planetls.md");
  const markdown = await readFile(masterPlanPath, "utf8");
  const plan = parseMasterPlan(markdown, new Date().toISOString());
  const diagnostics = plan.diagnostics;

  if (diagnostics.source !== "structured") {
    console.error("Echec development:check");
    console.error("Le registre structuré du développement est introuvable ou illisible dans docs/master-plan-planetls.md.");
    process.exit(1);
  }

  if (diagnostics.errors.length > 0) {
    console.error("Echec development:check");
    for (const error of diagnostics.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("development:check OK");
  console.log(`- source: ${diagnostics.source}`);
  console.log(`- elements: ${diagnostics.itemCount}`);
  console.log(`- derniere_mise_a_jour: ${diagnostics.lastStructuredUpdate ?? "inconnue"}`);
  console.log(`- prochain_numero: ${diagnostics.nextSuggestedId ?? "indisponible"}`);
  if (diagnostics.warnings.length > 0) {
    console.log("- alertes:");
    for (const warning of diagnostics.warnings) {
      console.log(`  - ${warning}`);
    }
  }
}

main().catch((error) => {
  console.error("Echec development:check");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
