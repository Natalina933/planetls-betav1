import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const sidebarSource = readFileSync(
  new URL("../app/components/dashboard/Sidebar/sidebarconfig.tsx", import.meta.url),
  "utf8",
);
const sidebarComponent = readFileSync(
  new URL("../app/components/dashboard/Sidebar/Sidebar.tsx", import.meta.url),
  "utf8",
);
const config = sidebarSource.split("  concierge: [")[1].split("  provider: [")[0];
const paths = [...config.matchAll(/path: "([^"]+)"/g)].map((match) => match[1]);

test("concierge sidebar exposes the validated sections and labels", () => {
  for (const section of ["Mon activité", "Commercial", "Clients", "Prestataires", "Gestion", "Pilotage", "Configuration"]) {
    assert.match(config, new RegExp(`section: "${section}"`));
  }

  for (const label of ["Planning & tournées", "Offre de services", "Artisans & interventions", "Facturation"]) {
    assert.match(config, new RegExp(`label: "${label}"`));
  }

  assert.doesNotMatch(config, /label: "Vue d'ensemble"/);
  assert.match(sidebarComponent, /userType === "owner" \|\| userType === "concierge"/);
});

test("concierge sidebar preserves existing routes and the intentional billing alias", () => {
  for (const path of paths) {
    assert.ok(existsSync(new URL(`../app${path.split("?")[0]}/page.tsx`, import.meta.url)), path);
  }

  assert.equal(paths.filter((path) => path === "/dashboard/concierge/billing").length, 2);
  assert.equal(config.includes("children:"), false);
});

test("concierge sidebar keeps the expected route order", () => {
  const expected = [
    "/dashboard/concierge",
    "/dashboard/concierge/missions",
    "/dashboard/concierge/planning",
    "/dashboard/concierge/urgences",
    "/dashboard/concierge/demandes",
    "/dashboard/concierge/billing",
    "/dashboard/concierge/contacts",
    "/dashboard/concierge/contract-templates",
    "/dashboard/concierge/missions/overview",
    "/dashboard/concierge/recherche",
    "/dashboard/concierge/proprietaires/overview",
    "/dashboard/concierge/logements",
    "/dashboard/concierge/sejours",
    "/dashboard/concierge/maintenance",
    "/dashboard/concierge/messages",
    "/dashboard/concierge/profile?tab=documents",
    "/dashboard/concierge/stocks",
    "/dashboard/concierge/billing",
    "/dashboard/concierge/finances/overview",
    "/dashboard/concierge/objectifs",
    "/dashboard/concierge/finances/simulation",
    "/dashboard/concierge/profile",
    "/dashboard/concierge/equipe",
    "/dashboard/concierge/pricing",
    "/dashboard/concierge/services-packages",
    "/dashboard/concierge/settings",
  ];

  assert.deepEqual(paths, expected);
});
