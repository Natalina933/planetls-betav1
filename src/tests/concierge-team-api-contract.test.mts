import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const collectionRoute = readFileSync(new URL("../app/api/concierge/team/route.ts", import.meta.url), "utf8");
const memberRoute = readFileSync(new URL("../app/api/concierge/team/[id]/route.ts", import.meta.url), "utf8");
const teamPage = readFileSync(new URL("../app/dashboard/concierge/equipe/page.tsx", import.meta.url), "utf8");

test("concierge team collection exposes scoped read and creation", () => {
  assert.match(collectionRoute, /export async function GET/);
  assert.match(collectionRoute, /export async function POST/);
  assert.match(collectionRoute, /eq\("concierge_profile_id", userId\)/);
  assert.match(collectionRoute, /daily_capacity_minutes: capacity/);
});

test("concierge team member updates remain scoped and use soft deletion", () => {
  assert.match(memberRoute, /export async function PATCH/);
  assert.match(memberRoute, /export async function DELETE/);
  assert.match(memberRoute, /eq\("id", id\)/);
  assert.match(memberRoute, /eq\("concierge_profile_id", userId\)/);
  assert.match(memberRoute, /is_active: false/);
  assert.match(memberRoute, /Aucune modification valide/);
});
test("concierge team page wires persistent creation, updates and deactivation", () => {
  assert.match(teamPage, /schemaReady \? persistedMembers : buildDefaultMembers/);
  assert.match(teamPage, /method: "POST"/);
  assert.match(teamPage, /method: "PATCH"/);
  assert.match(teamPage, /method: "DELETE"/);
  assert.match(teamPage, /Mode demonstration/);
});