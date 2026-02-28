import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedServiceRole } from "../app/api/services/pure.ts";

test("isAllowedServiceRole accepts expected service roles", () => {
  assert.equal(isAllowedServiceRole("concierge"), true);
  assert.equal(isAllowedServiceRole("provider"), true);
  assert.equal(isAllowedServiceRole("artisan_pro"), true);
  assert.equal(isAllowedServiceRole("owner"), false);
  assert.equal(isAllowedServiceRole(""), false);
  assert.equal(isAllowedServiceRole(undefined), false);
});
