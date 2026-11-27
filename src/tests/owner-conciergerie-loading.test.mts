import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../app/dashboard/owner/conciergerie/page.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
});

type Element = { type: unknown; props: Record<string, unknown> };

function descendants(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(descendants);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const element = value as Element;
  return [element, ...descendants(element.props.children)];
}

function renderConciergeries() {
  const states: unknown[] = [];
  let index = 0;
  let mount: (() => () => void) | undefined;
  let setterCalls = 0;
  const ref = { current: null };
  const jsx = (type: Element["type"], props: Element["props"]) => ({ type, props });
  const react = {
    useState(initial: unknown) {
      const slot = index++;
      if (!(slot in states)) states[slot] = initial;
      return [states[slot], (value: unknown) => {
        setterCalls++;
        states[slot] = value;
      }];
    },
    useCallback: (fn: unknown) => fn,
    useMemo: (fn: () => unknown) => fn(),
    useRef: () => ref,
    useEffect: (effect: () => () => void) => { mount ??= effect; },
  };
  const exports = {} as { default: () => Element };
  new Function("require", "exports", outputText)((name: string) => {
    if (name === "react") return react;
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
    if (name === "../_components/OwnerWorkspacePage") return { default: "OwnerWorkspacePage" };
    if (name === "@/app/lib/planetlsServiceSelection") return { normalizePlanetLSSelection: () => [] };
    if (name.endsWith(".scss")) return { default: {} };
    return {};
  }, exports);

  return {
    render() {
      index = 0;
      return descendants(exports.default());
    },
    mount() {
      assert.ok(mount);
      return mount();
    },
    get setterCalls() { return setterCalls; },
  };
}

test("Conciergeries démarre en chargement et ignore un échec après démontage", async (t) => {
  const page = renderConciergeries();
  const { promise, reject } = Promise.withResolvers<Response>();
  const signals: AbortSignal[] = [];
  t.mock.method(globalThis, "fetch", (_input: string, { signal }: { signal: AbortSignal }) => {
    signals.push(signal);
    return promise;
  });

  const initial = page.render();
  assert.equal(initial.find(({ type }) => type === "OwnerWorkspacePage")?.props.description, "Chargement des relations...");
  const cleanup = page.mount();
  assert.equal(page.setterCalls, 0);
  assert.equal(signals.length, 3);
  assert.ok(signals.every(signal => signal === signals[0] && !signal.aborted));
  cleanup();
  assert.ok(signals[0].aborted);
  reject(new Error("Réponse obsolète"));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(page.setterCalls, 0);

  page.render();
  const { promise: failed, reject: rejectActive } = Promise.withResolvers<Response>();
  t.mock.method(globalThis, "fetch", () => failed);
  const cleanupActive = page.mount();
  rejectActive(new Error("Service indisponible"));
  await new Promise(resolve => setImmediate(resolve));
  const result = page.render();
  assert.ok(result.some(({ type, props }) => type === "p" && props.children === "Service indisponible"));
  assert.notEqual(result.find(({ type }) => type === "OwnerWorkspacePage")?.props.description, "Chargement des relations...");
  cleanupActive();
});

test("une lecture obsolète ne remplace pas les devis du rafraîchissement courant", async (t) => {
  const page = renderConciergeries();
  const firstRefresh = Promise.withResolvers<void>();
  const secondRefresh = Promise.withResolvers<void>();
  const signals = new Map<AbortSignal, number>();

  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (init.method === "PATCH") return Response.json({});
    assert.ok(init.signal);
    if (!signals.has(init.signal)) signals.set(init.signal, signals.size);
    const batch = signals.get(init.signal);
    if (batch === 1) await firstRefresh.promise;
    if (batch === 2) await secondRefresh.promise;
    if (url.startsWith("/api/service-requests")) return Response.json({ items: [] });
    if (url === "/api/housing") return Response.json([]);
    assert.equal(url, "/api/quotes?limit=100");
    const ids = batch === 0 ? ["premier", "second"] : batch === 1 ? ["obsolète"] : ["courant"];
    return Response.json(ids.map(id => ({ id, status: "sent" })));
  });

  page.render();
  const cleanup = page.mount();
  await new Promise(resolve => setImmediate(resolve));
  const quotesTab = page.render().find(({ type, props }) =>
    type === "button" && descendants(props.children).some(({ props: child }) => child.children === "Devis reçus"),
  );
  assert.ok(typeof quotesTab?.props.onClick === "function");
  quotesTab.props.onClick();
  const actions = page.render().flatMap(({ props }) =>
    typeof props.onReject === "function" ? [props.onReject as () => Promise<void>] : [],
  );
  assert.equal(actions.length, 2);

  const firstAction = actions[0]();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(page.render().find(({ type }) => type === "OwnerWorkspacePage")?.props.description, "Chargement des relations...");
  const secondAction = actions[1]();
  await new Promise(resolve => setImmediate(resolve));
  const [, obsoleteSignal, currentSignal] = [...signals.keys()];
  assert.equal(obsoleteSignal.aborted, true);
  assert.equal(currentSignal.aborted, false);

  secondRefresh.resolve();
  await secondAction;
  const writesAfterCurrent = page.setterCalls;
  firstRefresh.resolve();
  await firstAction;
  // The older action still clears its own busy state, but its read publishes nothing.
  assert.equal(page.setterCalls, writesAfterCurrent + 1);
  const quotes = page.render().flatMap(({ props }) => props.quote ? [props.quote] : []);
  assert.deepEqual(quotes, [{ id: "courant", status: "sent" }]);
  cleanup();
});
