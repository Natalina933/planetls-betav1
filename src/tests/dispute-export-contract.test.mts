import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("dispute export keeps evidence delivery private with signed URLs", async () => {
  const route = await readFile("src/app/api/disputes/[id]/export/route.ts", "utf8");

  assert.match(route, /createSignedUrl/);
  assert.doesNotMatch(route, /storage\/v1\/object\/public/);
});
