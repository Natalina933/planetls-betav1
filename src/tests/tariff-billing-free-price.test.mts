import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
type Row = Record<string, any>;

// Exécute le vrai composant et ses handlers ; hooks et transport isolés, sans réseau.
function desk(unitPrice: number | "" = 0, confirmed = false, failSave = false) {
  const quote = { id: "quote-fixture", status: "draft", quote_items: [{ label: "Ménage", quantity: 1, unit_price: unitPrice, confirm_free: confirmed, metadata: { quote_service_price_confirmed: confirmed } }] };
  const states: any[] = [[quote], [], [], [], [], quote.id, quote, "custom", "", "", false, null, null, null];
  const lock = { current: false };
  let cursor = 0;
  let writes = 0;
  let effects: Array<() => void | (() => void)> = [];
  const requests: Array<{ url: string; body: Row }> = [];
  let release: (() => void) | undefined;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const exports: Row = {};
  const code = ts.transpileModule(readFileSync(new URL("../app/components/tariffs/TariffBillingDesk.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const load = (name: string): any => {
    if (name === "react") return {
      useState: (initial: unknown) => {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [states[index], (value: any) => { writes++; states[index] = typeof value === "function" ? value(states[index]) : value; }];
      },
      useRef: () => lock, useEffect: (effect: () => void | (() => void)) => { effects.push(effect); }, useMemo: (fn: () => unknown) => fn(), useCallback: (fn: unknown) => fn,
    };
    if (name === "react/jsx-runtime") return nativeRequire(name);
    if (name === "@/components/ui") return new Proxy({}, { get: (_, key) => String(key) });
    if (name.endsWith(".scss")) return { default: {} };
    if (name.endsWith("invoiceStatus")) return { getInvoicePaymentSummary: () => ({}) };
    if (name.endsWith("paymentWorkflow")) return {
      computePaymentPlanAmounts: () => ({ plan: "full_before_mission" }),
      getPaymentPlanLabel: (value: string) => value,
      normalizePaymentPlanType: (value: string) => value || "full_before_mission",
    };
    throw new Error(`Import inattendu : ${name}`);
  };
  const fetchMock = async (url: string, init: RequestInit) => {
    if (!init?.body) {
      await pending;
      return Response.json(url.startsWith("/api/quotes?") ? [quote] : []);
    }
    const body = JSON.parse(String(init.body));
    requests.push({ url, body });
    if (!url.endsWith("/status")) {
      await pending;
      return Response.json(failSave ? { error: "Sauvegarde indisponible." } : { ...quote, quote_items: body.items }, { status: failSave ? 500 : 200 });
    }
    return Response.json({ id: quote.id, status: "sent" });
  };
  new Function("require", "exports", "fetch", code)(load, exports, fetchMock);
  function render() {
    for (let attempt = 0; attempt < 10; attempt++) {
      cursor = 0; effects = [];
      const previousWrites = writes;
      const tree = exports.default({});
      if (writes === previousWrites) return tree;
    }
    throw new Error("Render did not stabilize");
  }
  function nodes(node: any): any[] {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
  }
  const find = (predicate: (node: any) => boolean) => nodes(render()).find(predicate);
  const send = () => find(node => node.type === "Button" && node.props.onClick?.name === "sendQuote").props.onClick();
  return { requests, states, send, release: () => release!(), find, render,
    startLoad: () => {
      render();
      const before = writes;
      const cleanup = effects[0]();
      assert.equal(writes, before, "The effect must not write state synchronously");
      return cleanup;
    },
  };
}

test("interface : gratuité explicite, sauvegarde avant envoi et verrou immédiat", async () => {
  const ui = desk();
  const checkbox = ui.find(node => node.type === "input" && node.props.type === "checkbox");
  assert.equal(checkbox.props.checked, false);
  checkbox.props.onChange({ target: { checked: true } });
  assert.equal(ui.find(node => node.props.type === "checkbox").props.checked, true);
  const first = ui.send();
  const second = ui.send();
  assert.equal(ui.requests.length, 1);
  assert.equal(ui.requests[0].body.items[0].confirm_free, true);
  ui.release();
  await Promise.all([first, second]);
  assert.deepEqual(ui.requests.map(request => request.url), ["/api/quotes/quote-fixture", "/api/quotes/quote-fixture/status"]);
});

test("interface : tarif absent ou zéro non confirmé empêchent tout envoi", async () => {
  for (const price of ["", 0] as const) {
    const ui = desk(price);
    await ui.send();
    assert.equal(ui.requests.length, 0);
    assert.match(ui.states[12], /Renseignez chaque tarif/);
  }
});

test("interface : vider ou modifier le prix révoque la confirmation", () => {
  const ui = desk(0, true);
  ui.find(node => node.props.label === "Prix unitaire").props.onChange({ target: { value: "25" } });
  assert.equal(ui.states[6].quote_items[0].confirm_free, false);
  ui.find(node => node.props.label === "Prix unitaire").props.onChange({ target: { value: "" } });
  assert.equal(ui.states[6].quote_items[0].unit_price, "");
  ui.find(node => node.props.label === "Prix unitaire").props.onChange({ target: { value: "0" } });
  assert.equal(ui.find(node => node.props.type === "checkbox").props.checked, false);
});

test("interface : échec de sauvegarde interdit l'envoi et libère le verrou pour réessayer", async () => {
  const ui = desk(0, true, true);
  const sending = ui.send();
  ui.release();
  await sending;
  assert.equal(ui.requests.length, 1);
  assert.equal(ui.states[12], "Sauvegarde indisponible.");
  await ui.send();
  assert.equal(ui.requests.length, 2);
  assert.ok(ui.requests.every(request => !request.url.endsWith("/status")));
});

test("loading: async response initializes editor and restores free confirmation", async () => {
  const ui = desk(0, true);
  ui.states[0] = [];
  ui.states[5] = null;
  ui.states[6] = null;
  ui.states[10] = true;
  ui.startLoad();
  ui.release();
  await new Promise(resolve => setImmediate(resolve));
  ui.render();
  assert.equal(ui.states[10], false);
  assert.equal(ui.states[6].id, "quote-fixture");
  assert.equal(ui.states[6].quote_items[0].confirm_free, true);
  ui.states[6] = { ...ui.states[6], notes: "Unsaved draft" };
  ui.render();
  assert.equal(ui.states[6].notes, "Unsaved draft");
  ui.states[5] = null;
  ui.render();
  assert.equal(ui.states[6], null);
});

test("loading: cleanup ignores a late response", async () => {
  const ui = desk();
  ui.states[0] = [];
  ui.states[5] = null;
  ui.states[6] = null;
  ui.states[10] = true;
  const cleanup = ui.startLoad();
  if (typeof cleanup === "function") cleanup();
  ui.release();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(ui.states[0], []);
  assert.equal(ui.states[6], null);
  assert.equal(ui.states[10], true);
  assert.equal(ui.states[12], null);
});
