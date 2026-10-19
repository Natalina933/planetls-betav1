import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { chromium, expect } from "@playwright/test";
import ts from "typescript";
import type { PromptDocument, PromptLibraryPayload } from "../features/prompt-library/types.ts";

const require = createRequire(import.meta.url);
const file = "src/app/dashboard/admin/(business)/pilotage/ai-center/PromptLibraryCenter.tsx";
const code = ts.transpileModule(readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
// Only presentation dependencies are replaced; the complete component and hooks run unchanged.
const uiCode = `const R=require('react');
exports.Badge=({children})=>R.createElement('span',null,children);
exports.DashboardPanel=({children})=>R.createElement('div',null,children);
exports.SearchBar=({value,inputProps})=>R.createElement('input',{value,'aria-label':'Rechercher',onChange:inputProps.onChange});`;
const iconCode = "for(const name of ['AlertTriangle','Copy','FileText','Heart','RefreshCw','Search'])exports[name]=()=>null;";
const stylesCode = "exports.default=new Proxy({},{get:(_,key)=>String(key)});";
const shims: Record<string, string> = {
  "@/components/ui/Badge": uiCode,
  "@/components/ui/SearchBar": uiCode,
  "@/components/dashboard": uiCode,
  "lucide-react": iconCode,
  "./PromptLibraryCenter.module.scss": stylesCode,
};
function loadComponent() {
  const entry = { exports: {} as { PromptLibraryCenter: React.ComponentType<{ payload: PromptLibraryPayload | null; loading: boolean }> } };
  const resolve = (id: string) => {
    if (!(id in shims)) return require(id);
    const shim = { exports: {} };
    new Function("require", "exports", "module", shims[id])(require, shim.exports, shim);
    return shim.exports;
  };
  new Function("require", "exports", "module", code)(resolve, entry.exports, entry);
  return entry.exports.PromptLibraryCenter;
}
function prompt(id: string, category: string): PromptDocument {
  return {
    metadata: { id, title: id, description: `Description ${id}`, category, status: "active", version: "1.0.0", author: "test", target: "codex", difficulty: "beginner", riskLevel: "low", contexts: [], tags: [], createdAt: "2026-10-19", updatedAt: "2026-10-19" },
    path: "fixture.md", objective: "Exemple local", useWhen: [], avoidWhen: [],
    variables: [{ key: "{{CONTEXT}}", label: "Contexte", required: true }],
    promptContent: "Contexte : {{CONTEXT}}", expectedDeliverables: [], successCriteria: [], versionHistory: [], provenance: [], recentRuns: [],
  };
}
const prompts = [prompt("Alpha", "technical"), prompt("Beta", "design"), prompt("Gamma", "technical")];
const payload: PromptLibraryPayload = {
  prompts,
  stats: { total: 3, active: 3, needsReview: 0, favoritesSupported: true, runs: 0, categories: 2 },
  filters: { categories: ["technical", "design"], statuses: ["active"], riskLevels: ["low"], difficulties: ["beginner"] },
  diagnostic: { existingPromptSources: [], existingAuditDocs: [], reusableComponents: [], storageApproach: "Fixture locale", migrationRisks: [], duplicatesDetected: [], proposedTree: [] },
  updatedAt: "2026-10-19",
};

test("server render preserves first selection, empty, missing and loading states", () => {
  const Component = loadComponent();
  const render = (value: PromptLibraryPayload | null, loading = false) => renderToString(React.createElement(Component, { payload: value, loading }));
  const html = render(payload);
  assert.match(html, /data-selected="true"[^>]*><div[^>]*><div><strong>Alpha<\/strong>/);
  assert.equal(render(payload), html, "no mutable selection shared across server renders");
  assert.match(render({ ...payload, prompts: [] }), /Choisir un prompt/);
  assert.match(render(null), /Bibliotheque indisponible/);
  assert.match(render(payload, true), /Chargement du Centre IA/);
});

test("real component in Chromium: selection, filters, payload changes and local preparations", async (t) => {
  const browserModules = Object.fromEntries([
    ["react", "react/cjs/react.development.js"],
    ["react/jsx-runtime", "react/cjs/react-jsx-runtime.development.js"],
    ["react-dom", "react-dom/cjs/react-dom.development.js"],
    ["client", "react-dom/cjs/react-dom-client.development.js"],
    ["scheduler", "scheduler/cjs/scheduler.development.js"],
  ].map(([name, path]) => [name, readFileSync(`node_modules/${path}`, "utf8")]));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const requests: string[] = [];
    const errors: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/*", (route) => route.abort());
    await page.setContent('<div id="root"></div>');
    await page.evaluate(({ modules, payload }) => {
      const storage = new Map<string, string>([["planetls-prompt-library-favorites", '["Beta"]']]);
      Object.defineProperty(window, "localStorage", { value: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) } });
      const cache: Record<string, { exports: unknown }> = {};
      const load = (name: string): unknown => {
        if (cache[name]) return cache[name].exports;
        const entry = { exports: {} }; cache[name] = entry;
        new Function("require", "exports", "module", "process", modules[name])(load, entry.exports, entry, { env: { NODE_ENV: "development" } });
        return entry.exports;
      };
      const React = load("react") as typeof import("react");
      const client = load("client") as typeof import("react-dom/client");
      const { PromptLibraryCenter } = load("component") as { PromptLibraryCenter: React.ComponentType<{ payload: PromptLibraryPayload | null; loading: boolean }> };
      let commits = 0;
      const root = client.createRoot(document.getElementById("root")!);
      const render = (value: PromptLibraryPayload | null, loading = false) => root.render(
        React.createElement(React.StrictMode, null, React.createElement(React.Profiler, { id: "pilot", onRender: () => { commits++; } }, React.createElement(PromptLibraryCenter, { payload: value, loading }))),
      );
      Object.assign(window, { promptPilot: { render, unmount: () => root.unmount(), commits: () => commits, storage: (key: string) => storage.get(key) } });
      render(payload);
    }, { modules: { ...browserModules, ...shims, component: code } as Record<string, string>, payload });
    const selected = page.locator('.promptCard[data-selected="true"] .promptCardHeader strong');
    const category = page.locator(".filterRow select").nth(0);
    const render = async (value: PromptLibraryPayload | null, loading = false) => {
      await page.evaluate(({ value, loading }) => (window as unknown as { promptPilot: { render: (value: PromptLibraryPayload | null, loading: boolean) => void } }).promptPilot.render(value, loading), { value, loading });
    };

    await t.test("initial value and click selection", async () => {
      await expect(selected).toHaveText("Alpha");
      await page.locator(".promptCard").filter({ hasText: "Description Beta" }).click();
      await expect(selected).toHaveText("Beta");
      await page.locator(".variableField textarea").fill("Contexte conserve");
      await expect(page.locator(".preview")).toContainText("Contexte conserve");
    });
    await t.test("removing selection by category permanently selects the first remaining item", async () => {
      await category.selectOption("technical"); await expect(selected).toHaveText("Alpha");
      await category.selectOption("all"); await expect(selected).toHaveText("Alpha");
    });
    await t.test("empty results clear selection; clearing search does not restore an old id", async () => {
      await page.locator(".promptCard").filter({ hasText: "Description Beta" }).click();
      await page.getByRole("textbox", { name: "Rechercher" }).fill("introuvable");
      await expect(selected).toHaveCount(0);
      await expect(page.getByText("Choisir un prompt", { exact: true })).toBeVisible();
      await page.getByRole("textbox", { name: "Rechercher" }).fill("");
      await expect(selected).toHaveText("Alpha");
    });
    await t.test("favorites and preparation values remain unchanged", async () => {
      await page.getByRole("button", { name: "Tous les prompts", exact: true }).click();
      await expect(selected).toHaveText("Beta");
      await expect(page.locator(".variableField textarea")).toHaveValue("Contexte conserve");
      await page.getByRole("button", { name: "Retirer des favoris", exact: true }).click();
      await expect(selected).toHaveCount(0);
      await page.getByRole("button", { name: "Favoris uniquement", exact: true }).click();
      await expect(selected).toHaveText("Alpha");
    });
    await t.test("payload reorder keeps valid selection; removal, null and empty reset it", async () => {
      await render({ ...payload, prompts: [prompts[2], prompts[1], prompts[0]] });
      await expect(selected).toHaveText("Alpha");
      await render({ ...payload, prompts: [prompts[2], prompts[1]] });
      await expect(selected).toHaveText("Gamma");
      await render(null); await expect(page.getByText("Bibliotheque indisponible", { exact: true })).toBeVisible();
      await render(payload); await expect(selected).toHaveText("Alpha");
      await render({ ...payload, prompts: [] }); await expect(selected).toHaveCount(0);
      await render({ ...payload, prompts: [prompts[2], prompts[0]] }); await expect(selected).toHaveText("Gamma");
    });
    await t.test("loading preserves a valid selection; idle does not cause a render loop", async () => {
      await render({ ...payload, prompts: [prompts[2], prompts[0]] }, true);
      await expect(page.getByText("Chargement du Centre IA...", { exact: true })).toBeVisible();
      await render({ ...payload, prompts: [prompts[2], prompts[0]] }); await expect(selected).toHaveText("Gamma");
      const commits = await page.evaluate(() => (window as unknown as { promptPilot: { commits: () => number } }).promptPilot.commits());
      await page.waitForTimeout(80);
      assert.equal(await page.evaluate(() => (window as unknown as { promptPilot: { commits: () => number } }).promptPilot.commits()), commits);
      assert.ok(commits < 60);
    });
    assert.deepEqual(errors, []);
    assert.deepEqual(requests, []);
    await page.evaluate(() => (window as unknown as { promptPilot: { unmount: () => void } }).promptPilot.unmount());
  } finally { await browser.close(); }
});
