import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import * as catalog from "../app/lib/planetlsServiceCatalogTarget.ts";
import * as selection from "../app/lib/planetlsServiceSelection.ts";
import * as guest from "../app/lib/guestCheckinCheckout.ts";
import type { PlanetLSServicePickerProps } from "../components/ui/PlanetLSServicePicker/PlanetLSServicePicker.tsx";
import { buildOwnerConciergeSearchParams, preserveTouchedOwnerConciergeFilters } from "../app/dashboard/owner/concierges/searchHelpers.ts";
import { buildOwnerConciergeSearchDefaults, getOwnerProfilePreferences } from "../features/owner-preferences/profilePreferences.ts";
import { buildOwnerSearchReturnTo } from "../features/owner-concierges/lib/searchNavigation.ts";

type Node = { type: unknown; props: Record<string, unknown> };
const compiled = ts.transpileModule(readFileSync(new URL("../components/ui/PlanetLSServicePicker/PlanetLSServicePicker.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;

// Exécute les vrais gestionnaires du composant, sans navigateur, DOM ou réseau.
function picker(initial: string[] = [], compact = true) {
  let activeFamily: string | null = null;
  let selected = initial;
  let changes = 0;
  let preferredFamily: string | undefined;
  const dependencies: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    react: { useId: () => "fixture", useMemo: (fn: () => unknown) => fn(), useState: () => [activeFamily, (value: string) => { activeFamily = value; }] },
    "lucide-react": { CheckCircle2: () => null },
    "@/app/lib/planetlsServiceCatalogTarget": catalog,
    "@/app/lib/planetlsServiceSelection": selection,
    "@/app/lib/guestCheckinCheckout": guest,
    "./PlanetLSServicePicker.module.scss": { __esModule: true, default: new Proxy({}, { get: (_target, name) => name }) },
  };
  const exports: { PlanetLSServicePicker?: (props: PlanetLSServicePickerProps) => Node } = {};
  new Function("require", "exports", compiled)((name: string) => {
    assert.ok(name in dependencies, `Dépendance non simulée : ${name}`);
    return dependencies[name];
  }, exports);
  const render = () => exports.PlanetLSServicePicker!({ selected, preferredFamily, compact, allowGroups: false, collapseGuestCheckinCheckout: true, onChange: value => { selected = value; changes++; } });
  function nodes(value: unknown): Node[] {
    if (Array.isArray(value)) return value.flatMap(item => nodes(item));
    if (!value || typeof value !== "object" || !("props" in value)) return [];
    const node = value as Node;
    return [node, ...nodes(node.props.children)];
  }
  function text(value: unknown): string {
    if (Array.isArray(value)) return value.map(text).join("");
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (value && typeof value === "object" && "props" in value) return text((value as Node).props.children);
    return "";
  }
  function button(label: string) {
    const found = nodes(render()).find(node => node.type === "button" && text(node.props.children) === label);
    assert.ok(found, `Bouton absent : ${label}`);
    return found;
  }
  return {
    nodes: () => nodes(render()), text, button,
    click: (label: string) => (button(label).props.onClick as () => void)(),
    selected: () => selected,
    changes: () => changes,
    prefer: (family: string) => { preferredFamily = family; },
  };
}

test("naviguer entre familles ne sélectionne ni ne transmet de prestations", () => {
  const ui = picker();
  ui.click("Conciergerie et voyageurs");
  assert.deepEqual(ui.selected(), []);
  assert.equal(ui.changes(), 0);
  assert.equal(ui.nodes().filter(node => node.type === "section").length, 1);
  assert.equal(ui.nodes().find(node => node.type === "section")?.props["aria-label"], "Prestations Conciergerie et voyageurs");
  assert.equal(ui.nodes().some(node => node.type === "strong" && ui.text(node.props.children) === "Ménage du logement"), false);
});

test("sélections multiples conservées entre familles et retrait limité à la prestation choisie", () => {
  const ui = picker();
  ui.click("Ménage du logement");
  ui.click("Conciergerie et voyageurs");
  ui.click("Check-in & Check-out");
  assert.deepEqual(ui.selected(), ["cleaning_standard", "guest_checkin", "guest_checkout"]);
  ui.click("Ménage et linge1");
  assert.equal(ui.button("Ménage du logement").props["aria-pressed"], true);
  ui.click("Ménage du logement");
  assert.deepEqual(ui.selected(), ["guest_checkin", "guest_checkout"]);
  ui.click("Conciergerie et voyageurs1");
  assert.equal(ui.button("Check-in & Check-out").props["aria-pressed"], true);
  ui.click("Check-in & Check-out");
  assert.deepEqual(ui.selected(), []);
});

test("préférence reçue tardivement respectée sans écraser la navigation manuelle", () => {
  const ui = picker(["guest_checkin"]);
  ui.prefer("guest_concierge");
  assert.equal(ui.button("Check-in & Check-out").props["aria-pressed"], true);
  assert.deepEqual(ui.selected(), ["guest_checkin"]);
  ui.click("Ménage et linge");
  ui.prefer("maintenance_repair");
  assert.ok(ui.button("Ménage du logement"));
  assert.equal(ui.changes(), 0);
});

test("variante compacte sans répétition des familles, variante historique conservée", () => {
  const compact = picker();
  assert.equal(compact.nodes().some(node => node.type === "small"), false);
  assert.equal(compact.nodes().filter(node => node.type === "button" && node.props["aria-controls"]).length, catalog.PLANETLS_SERVICE_FAMILIES.length);
  const original = picker([], false);
  assert.equal(original.nodes().some(node => node.props.role === "tablist"), true);
  assert.equal(original.nodes().some(node => node.type === "small"), true);
});

test("anciens critères d'inscription et URL conservés, puis retrait explicite persistant au retour", () => {
  const preferences = getOwnerProfilePreferences(JSON.stringify({ preferences: { ownerOnboardingV1: { serviceFamilies: ["cleaning_linen"], services: ["cleaning_standard"] } } }));
  const filters = { ...buildOwnerConciergeSearchDefaults(preferences), city: "Vendôme", radiusKm: "20", selectedCategories: [], propertyType: "", budgetMax: "", proOnly: false };
  assert.equal(buildOwnerConciergeSearchParams(filters).get("serviceFamilies"), "cleaning_linen");
  assert.equal(buildOwnerConciergeSearchParams(filters).get("services"), "cleaning_standard");
  const cleared = preserveTouchedOwnerConciergeFilters(filters, { ...filters, selectedServiceFamilies: [] }, new Set(["selectedServiceFamilies"]));
  assert.equal(buildOwnerConciergeSearchParams(cleared, { preserveEmptyServiceFamilies: true }).get("serviceFamilies"), "");
  assert.equal(buildOwnerConciergeSearchParams(cleared).has("serviceFamilies"), false);
  assert.equal(buildOwnerConciergeSearchParams({ ...cleared, selectedServices: [] }, { preserveEmptyServices: true }).get("services"), "");
  const restored = new URL(buildOwnerSearchReturnTo(cleared, []), "http://localhost").searchParams;
  assert.equal(restored.get("serviceFamilies"), "");
  assert.equal(restored.get("services"), "cleaning_standard");
});
