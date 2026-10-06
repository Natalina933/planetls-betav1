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
  for (const section of ["MON RÉSEAU", "MON ACTIVITÉ", "MON SUIVI", "En bas"]) {
    assert.match(config, new RegExp(`section: "${section}"`));
  }

  for (const label of ["Rechercher un propriétaire", "Mes demandes", "Mes partenaires", "Logements", "Séjours", "Interventions", "Devis", "Factures", "Documents"]) {
    assert.match(config, new RegExp(`label: "${label}"`));
  }

  assert.match(config, /label: "Tableau de bord"/);
  assert.match(config, /label: "Calendrier"/);
  assert.match(config, /label: "Paramètres"/);
  assert.match(sidebarComponent, /userType === "owner" \|\| userType === "concierge"/);
});

test("concierge sidebar preserves existing routes and the intentional billing alias", () => {
  for (const path of paths) {
    const cleanPath = path.split("?")[0];
    const pagePath = cleanPath.endsWith("/") ? `${cleanPath}page.tsx` : `${cleanPath}/page.tsx`;
    assert.ok(existsSync(new URL(`../app${pagePath}`, import.meta.url)), `Route ${path} should exist`);
  }

  assert.equal(paths.filter((path) => path === "/dashboard/concierge/billing").length, 2);
  assert.equal(config.includes("children:"), false);
});

test("concierge sidebar keeps the expected route order", () => {
  const expected = [
    "/dashboard/concierge",
    "/dashboard/concierge/planning",
    "/dashboard/concierge/recherche",
    "/dashboard/concierge/demandes",
    "/dashboard/concierge/contacts",
    "/dashboard/concierge/logements",
    "/dashboard/concierge/sejours",
    "/dashboard/concierge/maintenance",
    "/dashboard/concierge/messages",
    "/dashboard/concierge/billing",
    "/dashboard/concierge/billing",
    "/dashboard/concierge/profile?tab=documents",
    "/dashboard/concierge/settings",
  ];

  assert.deepEqual(paths, expected);
});
