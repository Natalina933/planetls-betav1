import assert from "node:assert/strict";
import test from "node:test";

import { guardHousingWriteAccess } from "../app/lib/housingWriteGuards.ts";

test("owner writes are pinned to the authenticated owner profile", () => {
  const result = guardHousingWriteAccess({
    proprietaire: {
      owner_profile_id: "owner-1",
      manager_profile_id: "manager-9",
    },
    userId: "owner-1",
    role: "owner",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.proprietaire.owner_profile_id, "owner-1");
  assert.equal(result.proprietaire.manager_profile_id, "manager-9");
});

test("owner cannot create a housing record for another owner profile", () => {
  const result = guardHousingWriteAccess({
    proprietaire: {
      owner_profile_id: "owner-2",
    },
    userId: "owner-1",
    role: "owner",
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /propre profil/i);
});

test("concierge writes reject a foreign manager profile", () => {
  const result = guardHousingWriteAccess({
    proprietaire: {
      owner_profile_id: "owner-1",
      manager_profile_id: "manager-9",
    },
    userId: "manager-1",
    role: "concierge",
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /gestionnaire/i);
});

test("concierge placeholder owner ids are cleared when they leak from the manual draft", () => {
  const result = guardHousingWriteAccess({
    proprietaire: {
      id: "manager-1",
      owner_profile_id: "manager-1",
      manager_profile_id: "manager-1",
      full_name: "Proprietaire a confirmer",
      email: "manager-1@pending.local",
    },
    userId: "manager-1",
    role: "concierge",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.proprietaire.owner_profile_id, null);
  assert.equal(result.proprietaire.id, null);
  assert.equal(result.proprietaire.manager_profile_id, "manager-1");
});
