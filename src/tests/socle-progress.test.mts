import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseSoclePresentation, summarizeSocle } from "../app/dashboard/admin/(product-tech)/developpement/socleProgressData.ts";

const base = "src/app/dashboard/admin/(product-tech)/developpement/";
const reference = readFileSync("docs/planetls-progress-functional-reference.md", "utf8");
const arbitration = readFileSync("docs/planetls-progress-launch-arbitration.md", "utf8");
const data = parseSoclePresentation(reference, arbitration);

test("socle : les 52 IDs locaux sont uniques, partition 45/5/2 et obligations B3", () => {
  assert.equal(data.diagnostic, null);
  assert.equal(new Set(data.capabilities.map(item => item.id)).size, 52);
  for (const [scope, count] of [["core", 45], ["improvement", 5], ["future", 2]] as const) {
    assert.equal(data.capabilities.filter(item => item.scope === scope).length, count);
  }
  assert.equal(data.capabilities.find(item => item.id === "PFC-NOT-02")?.scope, "core");
  assert.match(data.capabilities.find(item => item.id === "PFC-FAC-02")!.label, /contestable/);
  assert.match(data.capabilities.find(item => item.id === "PFC-AUTH-04")!.obligations.join(" "), /MFA/);
  assert.ok(data.capabilities.every(item => item.source.includes(".md:") && item.implementationCriteria && item.validationCriteria));
  assert.equal(data.securityGates.length, 10);
});

test("socle : rattachements explicites 27/35/26, aucun double comptage global", () => {
  for (const [space, count] of [["Propriétaire", 27], ["Conciergerie", 35], ["Artisans / Prestataires", 26]] as const) {
    assert.equal(summarizeSocle(data.capabilities, space).total, count);
  }
  assert.equal(summarizeSocle([...data.capabilities, ...data.capabilities]).total, 45);
});

test("socle : historique jamais promu, états actuels non évalués et taux absents", () => {
  assert.equal(data.historicalEvidence.length, 4);
  assert.ok(data.capabilities.every(item => item.development === "not_assessed" && item.validation === "not_assessed"));
  const summary = summarizeSocle(data.capabilities);
  assert.equal(summary.counts.not_assessed, 45);
  assert.equal(summary.developmentPercentage, null);
  assert.equal(summary.validationPercentage, null);
  const partial = { ...data.capabilities.find(item => item.scope === "core")!, development: "partial" as const };
  assert.equal(summarizeSocle([partial]).counts.partial, 1);
  assert.equal(summarizeSocle([partial]).counts.implemented, 0);
});

test("socle : source absente, doublon, rattachement inconnu ou changement B3 échouent explicitement", () => {
  assert.ok(parseSoclePresentation(reference, "").diagnostic);
  const row = reference.split(/\r?\n/).find(line => line.startsWith("| PFC-AUTH-01 |"))!;
  for (const invalid of ["", reference + "\n" + row, reference.replace("AUTH-01, AUTH-02, AUTH-03", "AUTH-99, AUTH-02, AUTH-03"), reference.replace("PFC-NOT-02 : A historique → S cible", "classement inconnu")]) {
    const result = parseSoclePresentation(invalid, arbitration);
    assert.ok(result.diagnostic);
    assert.deepEqual(result.capabilities, []);
    assert.equal(summarizeSocle(result.capabilities).validationPercentage, null);
  }
});

test("socle : rendu compact, un espace à la fois, détails clavier et distinction historique", () => {
  const native = createRequire(import.meta.url);
  let selected = "Propriétaire";
  const exports: Record<string, any> = {};
  const compiled = ts.transpileModule(readFileSync(base + "SocleProgress.tsx", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  new Function("require", "exports", compiled.outputText)((name: string) => {
    if (name === "react") return { useState: () => [selected, (value: string) => { selected = value; }] };
    if (name === "./socleProgressData") return native("../app/dashboard/admin/(product-tech)/developpement/socleProgressData.ts");
    if (name === "@/components/ui") return { Button: "button", Card: "article", CardBody: "div" };
    if (name.endsWith(".scss")) return { __esModule: true, default: {} };
    return native(name);
  }, exports);
  function nodes(node: any): any[] {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
  }
  for (const [space, count] of [["Propriétaire", 27], ["Conciergerie", 35], ["Artisans / Prestataires", 26]] as const) {
    const tree = exports.SocleExplorer({ data });
    nodes(tree).find(node => node.type === "select").props.onChange({ target: { value: space } });
    const html = renderToStaticMarkup(exports.SocleExplorer({ data }));
    assert.equal((html.match(/<details/g) ?? []).length, count + 1);
    assert.match(html, /label for="socle-space"/);
    assert.doesNotMatch(html, /<details open|0 %|3 implémentées|41 partielles/);
    assert.match(html, /Observation historique 02B/);
  }
  let destination = "";
  const summary = exports.SocleSummary({ data, onFeatures: () => { destination = "features"; }, onChecks: () => { destination = "checks"; } });
  const buttons = nodes(summary).filter(node => node.type === "button");
  buttons[0].props.onClick(); assert.equal(destination, "features");
  buttons[1].props.onClick(); assert.equal(destination, "checks");
  const html = renderToStaticMarkup(createElement(exports.SocleChecks, { data }));
  assert.match(html, /Validation du socle — Non évalué/);
  assert.match(html, /Résultats historiques/);
  assert.doesNotMatch(html, /0 %|progressbar/);
});
