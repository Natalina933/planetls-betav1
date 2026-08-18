import assert from "node:assert/strict";
import test from "node:test";
import { buildTechnicalMemoryView } from "../app/dashboard/admin/(product-tech)/developpement/technicalMemory.ts";

test("buildTechnicalMemoryView expose les décisions canoniques et celles du Master Plan", () => {
  const markdown = `# Master Plan PlanetLS

**2026-07-27 - Produit/UX.** La vue de développement reçoit une Roadmap intelligente dérivée du registre officiel.
**2026-07-27 - Tech/Build.** Les fichiers e2e et playwright.config.ts sont exclus du tsconfig applicatif.`;

  const view = buildTechnicalMemoryView({
    markdown,
    projectVersion: "0.1.0",
    workflowExists: true,
  });

  assert.equal(view.entries.some((entry) => entry.title.includes("Supabase")), true);
  assert.equal(view.entries.some((entry) => entry.title.includes("Next.js")), true);
  assert.equal(view.entries.some((entry) => entry.title.includes("Vercel")), true);
  assert.equal(view.entries.some((entry) => entry.source === "master-plan" && entry.title.includes("Roadmap intelligente")), true);
  assert.equal(view.tags.includes("playwright"), true);
  assert.equal(view.categories.includes("Workflow"), true);
});
