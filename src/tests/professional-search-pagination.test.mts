import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getProfessionalPageRange,
  hasReachedProfessionalPageLimit,
} from "../app/lib/professionalSearchPagination.ts";

test("première page de 100 profils", () => {
  assert.deepEqual(getProfessionalPageRange(0), {
    from: 0,
    to: 99,
  });
});

test("pagination sans chevauchement", () => {
  assert.deepEqual(getProfessionalPageRange(1), {
    from: 100,
    to: 199,
  });

  assert.deepEqual(getProfessionalPageRange(2), {
    from: 200,
    to: 299,
  });
});

test("refuse les index invalides", () => {
  assert.throws(() => getProfessionalPageRange(-1), RangeError);
  assert.throws(() => getProfessionalPageRange(1.5), RangeError);
});

test("détecte la limite de sécurité", () => {
  assert.equal(hasReachedProfessionalPageLimit(20, 100), true);

  assert.equal(hasReachedProfessionalPageLimit(19, 100), false);

  assert.equal(hasReachedProfessionalPageLimit(20, 50), false);
});
