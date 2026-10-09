import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import {
  resolveRequestedServiceCatalogValue,
  resolveRequestedServicesCatalog,
} from "../app/api/_shared/requestedServicesCatalog.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const nodeRequire = createRequire(import.meta.url);

test("requested service resolver classifies exact services, families, modes and contexts", () => {
  const values = [
    "guest_checkin",
    "Ménage",
    "Gestion complète",
    "Urgence de nuit",
    "Intendance",
    "Valeur inventée",
    "Check-in / Check-out",
    "guest_checkout",
  ];
  const before = structuredClone(values);

  const resolutions = resolveRequestedServicesCatalog(values);

  assert.deepEqual(values, before);
  assert.equal(resolutions.length, values.length);
  assert.deepEqual(
    resolutions.map((item) => ({ kind: item.kind, originalValue: item.originalValue, index: item.index })),
    [
      { kind: "service", originalValue: "guest_checkin", index: 0 },
      { kind: "family", originalValue: "Ménage", index: 1 },
      { kind: "mode", originalValue: "Gestion complète", index: 2 },
      { kind: "context", originalValue: "Urgence de nuit", index: 3 },
      { kind: "ambiguous", originalValue: "Intendance", index: 4 },
      { kind: "unknown", originalValue: "Valeur inventée", index: 5 },
      { kind: "ambiguous", originalValue: "Check-in / Check-out", index: 6 },
      { kind: "service", originalValue: "guest_checkout", index: 7 },
    ],
  );

  const checkin = resolutions[0];
  assert.equal(checkin.kind, "service");
  if (checkin.kind === "service") assert.equal(checkin.slug, "guest_checkin");

  const cleaning = resolutions[1];
  assert.equal(cleaning.kind, "family");
  if (cleaning.kind === "family") assert.equal(cleaning.family, "Ménage");

  const fullManagement = resolutions[2];
  assert.equal(fullManagement.kind, "mode");
  if (fullManagement.kind === "mode") assert.equal(fullManagement.mode, "full_management");

  const nightEmergency = resolutions[3];
  assert.equal(nightEmergency.kind, "context");
  if (nightEmergency.kind === "context") assert.equal(nightEmergency.context, "night_emergency");
});

test("requested service resolver handles empty inputs without inventing services", () => {
  assert.deepEqual(resolveRequestedServicesCatalog(null), []);
  assert.deepEqual(resolveRequestedServicesCatalog(undefined), []);
  assert.deepEqual(resolveRequestedServiceCatalogValue("", 3), {
    kind: "unknown",
    originalValue: "",
    index: 3,
  });
});

test("quote draft generation keeps existing lines and amounts while resolving internally", async () => {
  const db = createDb();
  const load = createLoader(db);
  const { prepareQuoteDraftFromRequest, diagnoseQuoteDraftServiceMatches } = load(
    "@/features/concierge-commercial/server/quoteDraftFromRequest",
  ) as {
    diagnoseQuoteDraftServiceMatches: (
      requestedServices: string[],
      servicesCatalog: Array<{ id: number; category: string | null; service: string | null; description: string | null }>,
    ) => Array<Record<string, unknown>>;
    prepareQuoteDraftFromRequest: (
      conciergeProfileId: string,
      request: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>;
  };

  const request = {
    id: "request-1",
    title: "Besoin ménage",
    description: "Appartement deux pièces",
    budget_max: 120,
    currency: "eur",
    desired_date: "2026-11-10",
    requested_services: ["Ménage"],
  };
  const before = structuredClone(request);

  const draft = await prepareQuoteDraftFromRequest("concierge-1", request);

  assert.deepEqual(request, before);
  assert.equal("matchDiagnostics" in draft, false);
  assert.equal(draft.currency, "EUR");
  assert.deepEqual(draft.requestedServices, ["Ménage"]);
  assert.deepEqual(draft.summary, {
    matchedServiceCount: 2,
    matchedPricingCount: 1,
    matchedPackageName: "Pack ménage",
  });
  assert.deepEqual(draft.items, [
    {
      service_id: 2,
      pricing_id: "pricing-2",
      label: "Ménage entre voyageurs",
      description: "Tarif par prestation",
      quantity: 1,
      unit_price: 90,
      line_total: 90,
      sort_order: 0,
      metadata: {
        source: "service_request",
        service_request_id: "request-1",
        matched_from_request: true,
      },
    },
  ]);

  const diagnostics = diagnoseQuoteDraftServiceMatches(
    ["guest_checkin", "Ménage", "Check-in / Check-out", "Gestion complète", "Urgence de nuit", "Valeur inventée"],
    dataForTable("services_catalog") as Array<{ id: number; category: string | null; service: string | null; description: string | null }>,
  );
  assert.deepEqual(
    diagnostics.map((item) => ({
      value: item.originalValue,
      diagnostic: item.diagnostic,
      confidence: item.confidence,
      historicalServiceIds: item.historicalServiceIds,
    })),
    [
      { value: "guest_checkin", diagnostic: "exact", confidence: "certain", historicalServiceIds: [] },
      { value: "Ménage", diagnostic: "family_only", confidence: "needs_validation", historicalServiceIds: [1, 2] },
      { value: "Check-in / Check-out", diagnostic: "ambiguous", confidence: "needs_validation", historicalServiceIds: [16] },
      { value: "Gestion complète", diagnostic: "mode_only", confidence: "needs_validation", historicalServiceIds: [] },
      { value: "Urgence de nuit", diagnostic: "context_only", confidence: "needs_validation", historicalServiceIds: [] },
      { value: "Valeur inventée", diagnostic: "unknown", confidence: "none", historicalServiceIds: [] },
    ],
  );
});

test("quote draft diagnostics do not change fallback lines when no tariff is available", async () => {
  const db = createDb({ services_pricing: [] });
  const load = createLoader(db);
  const { prepareQuoteDraftFromRequest } = load(
    "@/features/concierge-commercial/server/quoteDraftFromRequest",
  ) as {
    prepareQuoteDraftFromRequest: (
      conciergeProfileId: string,
      request: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>;
  };

  const draft = await prepareQuoteDraftFromRequest("concierge-1", {
    id: "request-2",
    title: "Maintenance à prévoir",
    description: "À qualifier",
    budget_max: 75,
    currency: "EUR",
    desired_date: null,
    requested_services: ["Maintenance"],
  });

  assert.equal("matchDiagnostics" in draft, false);
  assert.deepEqual(draft.items, [
    {
      service_id: null,
      pricing_id: null,
      label: "Maintenance",
      description: "À qualifier",
      quantity: 1,
      unit_price: 75,
      line_total: 75,
      sort_order: 0,
      metadata: {
        source: "service_request",
        service_request_id: "request-2",
        matched_from_request: false,
      },
    },
  ]);
});

class Query {
  table: string;
  tables: Record<string, unknown[]>;

  constructor(table: string, tables: Record<string, unknown[]>) {
    this.table = table;
    this.tables = tables;
  }

  select() {
    return this;
  }

  eq() {
    return this;
  }

  then<TResult1 = { data: unknown[]; error: null }, TResult2 = never>(
    resolve?: ((value: { data: unknown[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve({ data: this.tables[this.table] ?? [], error: null }).then(resolve, reject);
  }
}

function createDb(overrides: Partial<Record<string, unknown[]>> = {}) {
  const tables: Record<string, unknown[]> = {
    services_catalog: [
      { id: 1, category: "Ménage", service: "Ménage standard", description: null },
      { id: 2, category: "Ménage", service: "Ménage entre voyageurs", description: null },
      { id: 16, category: "Accueil voyageurs", service: "Check-in / Check-out", description: null },
    ],
    services_pricing: [
      { id: "pricing-2", service_id: 2, label: "Ménage entre voyageurs", type: "fixed", amount: 90, unit: "par prestation" },
    ],
    services_packages: [
      { id: "package-1", name: "Pack ménage", description: null, category: "Ménage", services_package_items: [{ service_id: 2 }] },
    ],
    ...overrides,
  };

  return {
    from(table: string) {
      return new Query(table, tables);
    },
    tables,
  };
}

function dataForTable(table: string) {
  return createDb().tables[table] ?? [];
}

function createLoader(db: unknown) {
  const cache = new Map<string, { exports: Record<string, unknown> }>();
  const load = (name: string, parent = path.join(root, "src")): Record<string, unknown> => {
    if (name === "@/server/db/dbServer") return { db };
    if (!name.startsWith(".") && !name.startsWith("@/") && !path.isAbsolute(name) && !/^[a-zA-Z]:[\\/]/.test(name)) {
      return nodeRequire(name);
    }

    let file = name.startsWith("@/") ? path.join(root, "src", name.slice(2)) : path.resolve(parent, name);
    if (!existsSync(file)) file += ".ts";
    const existing = cache.get(file);
    if (existing) return existing.exports;

    const loaded = { exports: {} as Record<string, unknown> };
    cache.set(file, loaded);
    const code = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    new Function("require", "module", "exports", code)(
      (dependency: string) => load(dependency, path.dirname(file)),
      loaded,
      loaded.exports,
    );
    return loaded.exports;
  };
  return load;
}
