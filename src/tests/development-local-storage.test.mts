import assert from "node:assert/strict";
import test from "node:test";
import { createElement, useSyncExternalStore } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createDevelopmentLocalStorage, isFavoriteIdList } from "../app/dashboard/admin/(product-tech)/developpement/developmentLocalStorage.ts";

const key = "planetls:developer-log:favorites";
function setup(initial: string | null = null) {
  const values = new Map(initial === null ? [] : [[key, initial]]);
  let reads = 0;
  let writes = 0;
  const storage = { getItem: (name: string) => { reads++; return values.get(name) ?? null; }, setItem: (name: string, value: string) => { writes++; values.set(name, value); } };
  const create = () => createDevelopmentLocalStorage<string[]>(key, [], isFavoriteIdList, () => storage);
  return { create, values, reads: () => reads, writes: () => writes };
}

test("favoris : chargement initial sans écrasement, snapshot stable et lecture unique", () => {
  const fixture = setup('["entry-1"]');
  const store = fixture.create();
  assert.deepEqual(store.getSnapshot(), ["entry-1"]);
  assert.equal(store.getSnapshot(), store.getSnapshot());
  assert.equal(fixture.reads(), 1);
  assert.equal(fixture.writes(), 0);
});

test("favoris : ajout, retrait, notification et persistance après remontage", () => {
  const fixture = setup('["entry-1"]');
  const store = fixture.create();
  let notifications = 0;
  const unsubscribe = store.subscribe(() => { notifications++; });
  store.set(previous => [...previous, "entry-2"]);
  assert.deepEqual(store.getSnapshot(), ["entry-1", "entry-2"]);
  assert.deepEqual(fixture.create().getSnapshot(), ["entry-1", "entry-2"]);
  store.set(previous => previous.filter(id => id !== "entry-1"));
  assert.deepEqual(fixture.create().getSnapshot(), ["entry-2"]);
  assert.equal(notifications, 2);
  assert.equal(fixture.writes(), 2);
  unsubscribe();
  store.set([]);
  assert.equal(notifications, 2);
});

test("favoris : absent, JSON invalide et forme invalide reviennent au vide sans écriture", () => {
  for (const initial of [null, "broken", "null", "{}", "[42]"]) {
    const fixture = setup(initial);
    assert.deepEqual(fixture.create().getSnapshot(), []);
    assert.equal(fixture.writes(), 0);
  }
});

test("favoris : stockage indisponible, interaction locale préservée et aucun cycle de notification", () => {
  const store = createDevelopmentLocalStorage<string[]>(key, [], isFavoriteIdList, () => { throw Error("Storage denied"); });
  assert.deepEqual(store.getSnapshot(), []);
  let notifications = 0;
  store.subscribe(() => { notifications++; store.getSnapshot(); });
  store.set(previous => [...previous, "entry-1"]);
  assert.deepEqual(store.getSnapshot(), ["entry-1"]);
  store.set(previous => previous);
  assert.equal(notifications, 1);
});

test("favoris : rendu serveur et snapshot d’hydratation identiques, sans lecture navigateur", () => {
  const fixture = setup('["entry-1"]');
  const server = fixture.create();
  function Favorites({ store }: { store: ReturnType<typeof fixture.create> }) {
    const ids = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
    return createElement("span", null, ids.length);
  }
  assert.equal(renderToStaticMarkup(createElement(Favorites, { store: server })), "<span>0</span>");
  assert.equal(fixture.reads(), 0);
  const browser = fixture.create();
  assert.deepEqual(browser.getServerSnapshot(), server.getServerSnapshot());
  assert.deepEqual(browser.getSnapshot(), ["entry-1"]);
  assert.deepEqual(browser.getServerSnapshot(), []);
  assert.equal(fixture.writes(), 0);
});

test("les autres valeurs du même chargement gardent leur format et leur clé", () => {
  for (const [name, initial, next] of [
    ["planetls:developer-log:comments", { old: [] }, { old: [], added: [] }],
    ["planetls:developer-log:manual-entries", [{ id: "old" }], [{ id: "new" }]],
    ["planetls:developer-roadmap:completions", ["old"], ["new"]],
  ] as const) {
    let raw = JSON.stringify(initial);
    const store = createDevelopmentLocalStorage<unknown>(name, null, undefined, () => ({
      getItem: requested => { assert.equal(requested, name); return raw; },
      setItem: (requested, value) => { assert.equal(requested, name); raw = value; },
    }));
    assert.deepEqual(store.getSnapshot(), initial);
    store.set(next);
    assert.deepEqual(JSON.parse(raw), next);
  }
});
