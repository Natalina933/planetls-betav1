import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("public profile analytics route records structured CTA clicks", () => {
  const route = read("../app/api/profiles/public/[id]/track/route.ts");
  assert.match(route, /export async function POST/);
  assert.match(route, /public_profile_cta_clicked/);
  assert.match(route, /cta_key/);
  assert.match(route, /recordWorkflowEvent/);
});

test("public concierge page posts CTA interactions back to the tracking endpoint", () => {
  const page = read("../app/concierges/[id]/page.tsx");
  assert.match(page, /\/api\/profiles\/public\/\$\{encodeURIComponent\(profileId\)\}\/track/);
  assert.match(page, /Actions recommandées/);
  assert.match(page, /getPublicProfileCtas/);
});
