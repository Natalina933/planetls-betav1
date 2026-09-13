import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { getOwnerActivePath } from "../app/components/dashboard/Sidebar/ownerNavigation.ts";

const config = readFileSync(new URL("../app/components/dashboard/Sidebar/sidebarconfig.tsx", import.meta.url), "utf8").split("  owner: [")[1].split("  concierge: [")[0];
const paths = [...config.matchAll(/path: "([^"]+)"/g)].map(match => match[1]);
const items = paths.map(path => ({ path }));
test("owner sidebar reuses existing routes and removes overview children", () => {
  for (const path of paths) assert.ok(existsSync(new URL(`../app${path.split("?")[0]}/page.tsx`, import.meta.url)), path);
  assert.doesNotMatch(config, /label: "(?:Vue d'ensemble|Vue globale|Statistiques|Planning|Contacts|Discussions)"/);
});
test("owner active link distinguishes calendar, maintenance and movements", () => {
  const resolve = (query: string) => getOwnerActivePath(items, "/dashboard/owner/planning", query);
  assert.equal(resolve(""), "/dashboard/owner/planning");
  assert.equal(resolve("type=maintenance&extra=1"), "/dashboard/owner/planning?type=maintenance");
  for (const type of ["movements", "arrival", "departure"]) assert.equal(resolve(`type=${type}`), "/dashboard/owner/planning?type=movements");
});
test("owner active link covers details, settings tabs and preserved urgent route", () => {
  assert.equal(getOwnerActivePath(items, "/dashboard/owner/logements/42", "tab=infos"), "/dashboard/owner/logements");
  assert.equal(getOwnerActivePath(items, "/dashboard/owner/logements/create", ""), "/dashboard/owner/logements/create");
  assert.equal(getOwnerActivePath(items, "/dashboard/owner/settings", "tab=address"), "/dashboard/owner/settings?tab=overview");
  assert.equal(getOwnerActivePath(items, "/dashboard/owner/mission-urgente", ""), "/dashboard/owner/alertes");
});
