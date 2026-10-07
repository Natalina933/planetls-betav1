import test from "node:test";
import assert from "node:assert/strict";

import { authorizeMissionCreation } from "../app/api/_shared/missionCreationAuthorization.ts";
import type { LooseSupabaseClient } from "../app/api/_shared/untypedSupabase.ts";

type Row = Record<string, unknown>;
type Tables = Record<string, Row[]>;

class Query {
  private filters: Array<(row: Row) => boolean> = [];
  private readonly rows: Row[];

  constructor(rows: Row[]) {
    this.rows = rows;
  }

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  in(column: string, values: readonly unknown[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  limit() {
    return this;
  }

  async maybeSingle<T>() {
    const data = this.rows.find((row) => this.filters.every((filter) => filter(row))) ?? null;
    return { data: data as T | null, error: null };
  }
}

function dbStub(tables: Tables) {
  return {
    from(table: string) {
      return new Query(tables[table] ?? []);
    },
    async rpc() {
      return { data: null, error: null };
    },
  } as unknown as LooseSupabaseClient;
}

const CONCIERGE_A = "11111111-1111-4111-8111-111111111111";
const CONCIERGE_B = "22222222-2222-4222-8222-222222222222";
const OWNER_A = "33333333-3333-4333-8333-333333333333";
const OWNER_B = "44444444-4444-4444-8444-444444444444";
const PROPERTY_A = "10";
const PROPERTY_B = "20";
const RESERVATION_A = "55555555-5555-4555-8555-555555555555";
const RESERVATION_B = "66666666-6666-4666-8666-666666666666";

function baseTables(): Tables {
  return {
    housing_collaborations: [
      {
        id: "collab-a",
        housing_id: 10,
        owner_profile_id: OWNER_A,
        concierge_profile_id: CONCIERGE_A,
        status: "active",
      },
      {
        id: "collab-b",
        housing_id: 20,
        owner_profile_id: OWNER_B,
        concierge_profile_id: CONCIERGE_B,
        status: "active",
      },
    ],
    reservations: [
      {
        id: RESERVATION_A,
        owner_profile_id: OWNER_A,
        concierge_profile_id: CONCIERGE_A,
        property_id: PROPERTY_A,
        metadata: {},
      },
      {
        id: RESERVATION_B,
        owner_profile_id: OWNER_B,
        concierge_profile_id: CONCIERGE_B,
        property_id: PROPERTY_B,
        metadata: {},
      },
    ],
    concierge_owner_matches: [],
    properties: [],
  };
}

test("concierge can create a mission on an authorized housing", async () => {
  const result = await authorizeMissionCreation({
    db: dbStub(baseTables()),
    actorProfileId: CONCIERGE_A,
    actorRole: "concierge",
    conciergeProfileId: CONCIERGE_A,
    ownerProfileId: OWNER_A,
    propertyId: PROPERTY_A,
    reservationId: null,
    metadata: null,
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.ownerProfileId, OWNER_A);
    assert.equal(result.propertyId, null);
    assert.equal(result.housingId, PROPERTY_A);
  }
});

test("concierge can create a mission with housing reference in metadata", async () => {
  const result = await authorizeMissionCreation({
    db: dbStub(baseTables()),
    actorProfileId: CONCIERGE_A,
    actorRole: "concierge",
    conciergeProfileId: CONCIERGE_A,
    ownerProfileId: null,
    propertyId: null,
    reservationId: null,
    metadata: { property_housing_id: PROPERTY_A },
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.ownerProfileId, OWNER_A);
    assert.equal(result.propertyId, null);
    assert.equal(result.housingId, PROPERTY_A);
  }
});

test("concierge cannot create a mission on another concierge's housing", async () => {
  const result = await authorizeMissionCreation({
    db: dbStub(baseTables()),
    actorProfileId: CONCIERGE_A,
    actorRole: "concierge",
    conciergeProfileId: CONCIERGE_A,
    ownerProfileId: OWNER_B,
    propertyId: PROPERTY_B,
    reservationId: null,
    metadata: null,
  });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 403);
});

test("authorized property with reservation from another housing is rejected", async () => {
  const result = await authorizeMissionCreation({
    db: dbStub(baseTables()),
    actorProfileId: CONCIERGE_A,
    actorRole: "concierge",
    conciergeProfileId: CONCIERGE_A,
    ownerProfileId: OWNER_A,
    propertyId: PROPERTY_A,
    reservationId: RESERVATION_B,
    metadata: null,
  });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 403);
});

test("authorized property with wrong owner_profile_id is rejected", async () => {
  const result = await authorizeMissionCreation({
    db: dbStub(baseTables()),
    actorProfileId: CONCIERGE_A,
    actorRole: "concierge",
    conciergeProfileId: CONCIERGE_A,
    ownerProfileId: OWNER_B,
    propertyId: PROPERTY_A,
    reservationId: null,
    metadata: null,
  });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 403);
});

test("concierge can create a mission with coherent property and reservation", async () => {
  const result = await authorizeMissionCreation({
    db: dbStub(baseTables()),
    actorProfileId: CONCIERGE_A,
    actorRole: "concierge",
    conciergeProfileId: CONCIERGE_A,
    ownerProfileId: OWNER_A,
    propertyId: PROPERTY_A,
    reservationId: RESERVATION_A,
    metadata: null,
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.ownerProfileId, OWNER_A);
    assert.equal(result.propertyId, null);
    assert.equal(result.housingId, PROPERTY_A);
    assert.equal(result.reservationId, RESERVATION_A);
  }
});
