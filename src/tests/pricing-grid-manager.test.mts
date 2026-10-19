import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setImmediate } from "node:timers/promises";
import test from "node:test";
import ts from "typescript";

type Pricing = {
  id: string;
  service_id: string | null;
  label: string;
  type: "fixed" | "hourly" | "monthly" | "custom";
  amount: number;
  unit: string;
  property_type?: string;
  estimated_duration?: number;
  service?: { id: string; service: string; category: string };
};
type Link = Omit<Pricing, "service_id" | "unit"> & {
  package_id: string;
  package?: { id: string; name: string } | null;
};
type Inputs = {
  pricings: Pricing[];
  linkedPricingPackages: Link[];
  editingId: string | null;
  filterPropertyType: string;
  filterPricingType: string;
  searchTerm: string;
  activeServiceIds?: string[];
  activeServiceLabels?: string[];
  servicesCatalog: { byCategory: Record<string, Array<{ id: string; service: string; category: string }>> };
};
type SignatureInput = {
  label: string;
  type: Pricing["type"];
  amount: number;
  propertyType?: string | null;
  includePropertyType?: boolean;
};
type View = {
  buildPricingSignature: (input: SignatureInput) => string;
  getPricingSignature: (pricing: Pricing) => string;
  getLoosePricingSignature: (pricing: Pricing) => string;
  linkedPricingMap: Record<string, Link[]>;
  linkedPricingLooseMap: Record<string, Link[]>;
  linkedPricingSignatures: Set<string>;
  allPricingPackageMap: Record<string, Link[]>;
  dedupeLinkedPricingRows: (rows: Link[]) => Link[];
  editingPricing: Pricing | null;
  editingPricingLinkedRows: Link[];
  getPricingLinkedPackages: (pricing: Pricing) => Array<{ id: string; name: string }>;
  getPricingLinkedRows: (pricing: Pricing) => Link[];
  filteredPricings: Pricing[];
  visiblePricings: Pricing[];
  selectableServicesByCategory: Inputs["servicesCatalog"]["byCategory"];
  selectableServiceCount: number;
  getPriceDisplay: (pricing: Pricing) => string;
  averageFixedAmount: number;
  averageHourlyAmount: number;
};

// Exercise the actual local declarations, without rendering UI or running effects.
// No copied signature, pricing or deduplication implementation lives in this harness.
const outputNames: Array<keyof View> = [
  "buildPricingSignature", "getPricingSignature", "getLoosePricingSignature",
  "linkedPricingMap", "linkedPricingLooseMap", "linkedPricingSignatures",
  "allPricingPackageMap", "dedupeLinkedPricingRows", "editingPricing",
  "editingPricingLinkedRows", "getPricingLinkedPackages", "getPricingLinkedRows",
  "filteredPricings", "visiblePricings", "selectableServicesByCategory",
  "selectableServiceCount", "getPriceDisplay", "averageFixedAmount", "averageHourlyAmount",
];
const declarationNames = new Set<string>([
  ...outputNames, "normalizeServiceText", "hasActiveServiceFilter",
  "activeServiceIdSet", "activeServiceLabelSet",
]);
const inputNames: Array<keyof Inputs> = [
  "pricings", "linkedPricingPackages", "editingId", "filterPropertyType",
  "filterPricingType", "searchTerm", "activeServiceIds", "activeServiceLabels", "servicesCatalog",
];
const source = readFileSync(new URL(
  "../app/components/dashboard/concierge/PricingGridManager/PricingGridManager.tsx", import.meta.url,
), "utf8");
const tree = ts.createSourceFile("PricingGridManager.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const selected: string[] = [];
const found = new Set<string>();
function collect(node: ts.Node) {
  if (ts.isVariableStatement(node)) {
    for (const declaration of node.declarationList.declarations) {
      const name = declaration.name.getText(tree);
      if (declarationNames.has(name)) {
        selected.push(node.getText(tree));
        found.add(name);
      }
    }
  }
  ts.forEachChild(node, collect);
}
collect(tree);
assert.deepEqual([...found].sort(), [...declarationNames].sort());
const code = ts.transpileModule(selected.join("\n"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const execute = new Function(
  "useMemo", "useCallback", ...inputNames,
  `"use strict";\n${code}\nreturn {${outputNames.join(",")}};`,
);

function renderer() {
  const slots: Array<{ dependencies: readonly unknown[]; value: unknown }> = [];
  let computations = 0;
  return {
    get computations() { return computations; },
    render(input: Inputs): View {
      let cursor = 0;
      const memoize = <T,>(calculate: () => T, dependencies: readonly unknown[]): T => {
        const index = cursor++;
        const previous = slots[index];
        if (previous && previous.dependencies.length === dependencies.length &&
          dependencies.every((value, position) => Object.is(value, previous.dependencies[position]))) {
          return previous.value as T;
        }
        computations++;
        const value = calculate();
        slots[index] = { dependencies: [...dependencies], value };
        return value;
      };
      const cacheCallback = <T,>(callback: T, dependencies: readonly unknown[]) => memoize(() => callback, dependencies);
      return execute(memoize, cacheCallback, ...inputNames.map(name => input[name])) as View;
    },
  };
}

function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function inputs(overrides: Partial<Inputs> = {}): Inputs {
  return freeze({
    pricings: [], linkedPricingPackages: [], editingId: null,
    filterPropertyType: "", filterPricingType: "", searchTerm: "",
    servicesCatalog: { byCategory: {} }, ...overrides,
  });
}
function pricing(overrides: Partial<Pricing> = {}): Pricing {
  return { id: "price-1", service_id: "service-1", label: "Ménage", type: "fixed", amount: 45, unit: "EUR", property_type: "appartement", ...overrides };
}
function link(overrides: Partial<Link> = {}): Link {
  return { id: "link-1", package_id: "pack-1", package: { id: "pack-1", name: " Séjour " }, label: "Ménage", type: "fixed", amount: 45, property_type: "appartement", ...overrides };
}

test("pricing signatures preserve normalization, two decimals and property-specific matching", () => {
  const view = renderer().render(inputs());
  assert.equal(view.buildPricingSignature({ label: "  MÉNAGE été  ", type: "fixed", amount: 10.5, propertyType: "maison" }), "menage ete__fixed__10.50__maison");
  assert.equal(view.getPricingSignature(pricing({ amount: 9.999 })), "menage__fixed__10.00__appartement");
  assert.equal(view.getPricingSignature(pricing({ amount: -1.125 })), "menage__fixed__-1.13__appartement");
  assert.equal(view.getLoosePricingSignature(pricing()), "menage__fixed__45.00__");
});

test("package grouping keeps insertion order, exact-match priority and first-row deduplication", () => {
  const exact = link();
  const duplicate = link({ package: { id: "pack-1", name: "Ignored duplicate" } });
  const loose = link({ id: "link-2", property_type: "maison", package_id: "pack-2", package: { id: "pack-2", name: "Autre" } });
  const row = pricing();
  const view = renderer().render(inputs({ pricings: [row], editingId: row.id, linkedPricingPackages: [exact, duplicate, loose] }));
  assert.deepEqual(view.linkedPricingMap[view.getPricingSignature(row)], [exact, duplicate]);
  assert.deepEqual(view.linkedPricingLooseMap[view.getLoosePricingSignature(row)], [exact, duplicate, loose]);
  assert.deepEqual(view.getPricingLinkedRows(row), [exact]);
  assert.deepEqual(view.editingPricingLinkedRows, [exact]);
  assert.deepEqual(view.getPricingLinkedRows(pricing({ property_type: "villa_haut_de_gamme" })), [exact, loose]);
  assert.deepEqual(view.getPricingLinkedPackages(row), [{ id: "pack-1", name: "Séjour" }]);
  assert.deepEqual(view.getPricingLinkedRows(pricing({ amount: 99 })), []);
});

test("coincident exact and loose keys preserve raw duplicates and deduplicate returned links", () => {
  const row = pricing({ property_type: undefined });
  const item = link({ property_type: undefined });
  const view = renderer().render(inputs({ linkedPricingPackages: [item] }));
  assert.deepEqual(view.allPricingPackageMap[view.getPricingSignature(row)], [item, item]);
  assert.deepEqual(view.getPricingLinkedRows(row), [item]);
});

test("package display deduplicates package IDs, trims names and skips missing metadata", () => {
  const rows = [link(), link({ id: "link-2" }), link({ id: "link-3", package_id: "fallback", package: undefined }), link({ id: "link-4", package: { id: "", name: "Empty ID" } }), link({ id: "link-5", package: { id: "pack-5", name: "   " } }), link({ id: "link-6", package: { id: "pack-6", name: " Second " } })];
  const view = renderer().render(inputs({ linkedPricingPackages: rows }));
  assert.deepEqual(view.getPricingLinkedPackages(pricing()), [{ id: "pack-1", name: "Séjour" }, { id: "pack-6", name: "Second" }]);
});

test("pricing displays and averages retain their rounding and exclude other pricing types", () => {
  const rows = [pricing({ amount: 10.4 }), pricing({ id: "fixed-2", amount: 11.5 }), pricing({ id: "hourly-1", type: "hourly", amount: 12.5, estimated_duration: 1.5 }), pricing({ id: "hourly-2", type: "hourly", amount: 19.5 }), pricing({ id: "monthly", type: "monthly", amount: 999 })];
  const view = renderer().render(inputs({ pricings: rows }));
  assert.equal(view.averageFixedAmount, 11);
  assert.equal(view.averageHourlyAmount, 16);
  assert.equal(view.getPriceDisplay(rows[0]), "10.40 EUR forfait");
  assert.equal(view.getPriceDisplay(rows[2]), "12.50 EUR/h (~19 EUR)");
  assert.equal(view.getPriceDisplay(rows[3]), "19.50EUR");
});

test("empty data returns empty mappings, no packages and zero averages", () => {
  const data = inputs();
  const view = renderer().render(data);
  assert.deepEqual(view.linkedPricingMap, {});
  assert.deepEqual(view.allPricingPackageMap, {});
  assert.equal(view.linkedPricingSignatures.size, 0);
  assert.equal(view.editingPricing, null);
  assert.deepEqual(view.editingPricingLinkedRows, []);
  assert.deepEqual(view.getPricingLinkedPackages(pricing()), []);
  assert.deepEqual(view.visiblePricings, []);
  assert.equal(view.averageFixedAmount, 0);
  assert.equal(view.averageHourlyAmount, 0);
  assert.equal(view.selectableServicesByCategory, data.servicesCatalog.byCategory);
});

test("service changes preserve package references and update ID/label filtering with shared prices", () => {
  const cleaning = { id: "service-1", service: "Ménage", category: "Maison" };
  const linen = { id: "service-2", service: "Linge", category: "Maison" };
  const data = inputs({
    pricings: [pricing({ service: cleaning }), pricing({ id: "linen", service_id: linen.id, label: "Linge", service: linen }), pricing({ id: "shared", service_id: null, label: "Commun" })],
    linkedPricingPackages: [link()], servicesCatalog: { byCategory: { Maison: [cleaning, linen] } }, activeServiceIds: [cleaning.id],
  });
  const render = renderer();
  const first = render.render(data);
  assert.deepEqual(first.visiblePricings.map(row => row.id), ["price-1", "shared"]);
  const second = render.render({ ...data, activeServiceIds: [linen.id] });
  assert.deepEqual(second.visiblePricings.map(row => row.id), ["linen", "shared"]);
  assert.equal(second.linkedPricingMap, first.linkedPricingMap);
  assert.equal(second.getPricingLinkedRows, first.getPricingLinkedRows);
  const multiple = render.render({ ...data, activeServiceIds: [cleaning.id, linen.id] });
  assert.equal(multiple.selectableServiceCount, 2);
  assert.equal(multiple.visiblePricings.length, 3);
  const labels = render.render({ ...data, activeServiceIds: [], activeServiceLabels: [" MÉNAGE "] });
  assert.deepEqual(labels.visiblePricings.map(row => row.id), ["price-1", "shared"]);
  const filtered = render.render({ ...data, filterPropertyType: "maison" });
  assert.deepEqual(filtered.visiblePricings, []);
});

test("unchanged inputs reuse memoized references without recomputation; relevant data invalidates only dependants", () => {
  const row = pricing();
  const data = inputs({ pricings: [row], linkedPricingPackages: [link()], editingId: row.id });
  const render = renderer();
  const first = render.render(data);
  const computations = render.computations;
  const second = render.render({ ...data });
  assert.equal(render.computations, computations);
  for (const key of ["buildPricingSignature", "getPricingSignature", "getLoosePricingSignature", "linkedPricingMap", "linkedPricingLooseMap", "allPricingPackageMap", "linkedPricingSignatures", "editingPricingLinkedRows", "getPricingLinkedPackages", "getPricingLinkedRows", "visiblePricings"] as const) assert.equal(second[key], first[key], key);
  const changed = render.render({ ...data, pricings: [pricing({ amount: 80 })] });
  assert.equal(changed.averageFixedAmount, 80);
  assert.notEqual(changed.visiblePricings, first.visiblePricings);
  assert.deepEqual(changed.editingPricingLinkedRows, []);
  assert.equal(changed.allPricingPackageMap, first.allPricingPackageMap);
  assert.equal(changed.getPricingLinkedRows, first.getPricingLinkedRows);
  const newLinks = render.render({ ...data, linkedPricingPackages: [...data.linkedPricingPackages, link({ id: "link-new" })] });
  assert.notEqual(newLinks.allPricingPackageMap, first.allPricingPackageMap);
  assert.notEqual(newLinks.getPricingLinkedRows, first.getPricingLinkedRows);
  assert.equal(newLinks.buildPricingSignature, first.buildPricingSignature);
});

test("initial load retains endpoint order and does not refetch on an unchanged render", async () => {
  let body: ts.Block | undefined;
  function findBody(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(tree) === "PricingGridManager" &&
      node.initializer && ts.isArrowFunction(node.initializer) && ts.isBlock(node.initializer.body)) {
      body = node.initializer.body;
    }
    ts.forEachChild(node, findBody);
  }
  findBody(tree);
  assert.ok(body);
  const firstEffect = body.statements.find(node => ts.isExpressionStatement(node) &&
    ts.isCallExpression(node.expression) && node.expression.expression.getText(tree) === "useEffect");
  assert.ok(firstEffect);
  const statements = body.statements.filter(node => node === firstEffect ||
    (ts.isVariableStatement(node) && node.declarationList.declarations.some(declaration =>
      ["fetchPricings", "fetchServicesCatalog"].includes(declaration.name.getText(tree)))));
  const loadCode = ts.transpileModule(statements.map(node => node.getText(tree)).join("\n"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const render = new Function("useEffect", "fetch", "setPricings", "setServicesCatalog", loadCode);
  const effects: Array<() => void> = [];
  let mounted = false;
  const useEffect = (effect: () => void, dependencies: unknown[]) => {
    assert.deepEqual(dependencies, []);
    if (!mounted) effects.push(effect);
    mounted = true;
  };
  const calls: string[] = [];
  const rows = [pricing()];
  const services = [{ id: "service-1", service: "Ménage", category: "Maison" }, { id: "service-2", service: "Linge", category: "Maison" }];
  const fetch = async (url: string) => {
    calls.push(url);
    return { ok: true, json: async () => url === "/api/pricing" ? rows : services };
  };
  const savedPricings: unknown[] = [];
  const savedCatalogs: unknown[] = [];
  const args = [useEffect, fetch, (value: unknown) => savedPricings.push(value), (value: unknown) => savedCatalogs.push(value)];
  render(...args);
  render(...args);
  assert.deepEqual(calls, []);
  assert.equal(effects.length, 1);
  effects[0]();
  await setImmediate();
  assert.deepEqual(calls, ["/api/pricing", "/api/services/services-catalog"]);
  assert.deepEqual(savedPricings, [rows]);
  assert.deepEqual(savedCatalogs, [{ byCategory: { Maison: services } }]);
});
