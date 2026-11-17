import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadSubfeatureDetail } from "./helpers/load-concierge-subfeatures.mts";
import { subfeatureCatalog } from "../app/dashboard/admin/(product-tech)/developpement/subfeatureCatalog.ts";
import { SUBFEATURE_SPACES } from "../app/dashboard/admin/(product-tech)/developpement/subfeatureTypes.ts";
import type { Subfeature } from "../app/dashboard/admin/(product-tech)/developpement/subfeatureTypes.ts";

const { SubfeatureDetail, IMPLEMENTATION_LABELS, VALIDATION_LABELS } = loadSubfeatureDetail();
const render = (item: Subfeature, parent?: { title: string; priority: string }) => renderToStaticMarkup(createElement("ul", null, createElement(SubfeatureDetail, { item, parent })));
const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");

test("détail générique : même structure sémantique et six espaces acceptés", () => {
  for (const space of SUBFEATURE_SPACES) {
    const item = { ...subfeatureCatalog[0], primarySpace: space };
    const html = render(item, { title: "Parent fourni", priority: "P1" });
    assert.ok(html.includes(`${item.id} — ${escape(item.name)}`));
    assert.ok(html.includes(escape(item.description)));
    assert.ok(html.includes(item.parentMasterPlanId));
    assert.ok(html.includes(escape(item.nextAction)));
    assert.match(html, /Parent fourni/);
    assert.ok(html.includes(space));
    assert.match(html, /<ul><li data-subfeature-id=/);
    assert.equal((html.match(/<details\b/g) ?? []).length, 1);
    assert.equal((html.match(/<summary>/g) ?? []).length, 1);
    assert.doesNotMatch(html, /<details[^>]*\bopen\b|<button|<input|role="progressbar"/);
  }
  const source = readFileSync("src/app/dashboard/admin/(product-tech)/developpement/SubfeatureDetail.tsx", "utf8");
  assert.doesNotMatch(source, /from ["'][^"']*(?:conciergeSubfeatures|subfeatureCatalog|subfeatureSearch)["']/);
});

test("tous les libellés d'implémentation et de validation sont conservés", () => {
  const item = structuredClone(subfeatureCatalog[0]);
  for (const state of ["not_assessed", "not_started", "partial", "implemented"] as const) {
    item.implementation.state = state;
    assert.ok(render(item).includes(`Implémentation : ${IMPLEMENTATION_LABELS[state]}`));
  }
  for (const state of ["not_assessed", "not_validated", "partially_validated", "validated"] as const) {
    item.validation.state = state;
    assert.ok(render(item).includes(`Validation : ${VALIDATION_LABELS[state]}`));
  }
});

test("preuve historique, limites et dates inconnues ne deviennent pas une validation", () => {
  const item = subfeatureCatalog[14];
  const html = render(item);
  assert.match(html, /Validation : Non évaluée/);
  assert.match(html, /Rapport historique — ne vaut pas validation actuelle/);
  assert.match(html, /Date d’exécution : Date inconnue/);
  assert.match(html, /<time dateTime="2026-10-10">2026-10-10<\/time>/);
  assert.match(html, /Commit inconnu/);
  assert.match(html, /Environnement inconnu/);
  for (const proof of item.evidence) {
    for (const value of [proof.source, proof.description, ...proof.scope, ...proof.limitations]) assert.ok(html.includes(escape(value)));
  }
  for (const value of [...item.files, ...item.routes, ...item.unknowns, ...item.remainingWork, ...item.validation.limitations]) assert.ok(html.includes(escape(value)));
  assert.doesNotMatch(html, /Validation : Validée avec preuves/);
});

test("critères, absence de critères, fiche 004, parent inconnu et exclusion P4", () => {
  const item = structuredClone(subfeatureCatalog[0]);
  assert.match(render(item), /Aucun critère défini ; aucune validation complète établie/);
  assert.match(render(item), /Libellé inconnu/);
  assert.match(render(item), /Priorité documentaire inconnue/);
  item.validation.criteria = [{ id: "fixture", description: "Critère explicite", state: "unverified", evidenceIds: [item.evidence[0].id] }];
  const html = render(item);
  assert.match(html, /fixture — Critère explicite · Non vérifié/);
  assert.ok(html.includes(item.evidence[0].id));
  const scope = render(subfeatureCatalog[3]);
  assert.match(scope, /Périmètre à qualifier/);
  assert.match(scope, /Implémentation : Non évalué/);
  assert.match(scope, /Validation : Non évaluée/);
  assert.match(render(subfeatureCatalog[18], { title: "Rémunération", priority: "P4" }), /P4 — exclue de la progression documentaire/);
  assert.doesNotMatch(render(subfeatureCatalog[18], { title: "Rémunération", priority: "P1" }), /P4 — exclue/);
});

test("rendu du détail sans mutation de la fiche ni des preuves", () => {
  const item = structuredClone(subfeatureCatalog[0]);
  const before = JSON.stringify(item);
  const parent = Object.freeze({ title: "Parent", priority: "P1" });
  function freeze(value: any) {
    if (value && typeof value === "object") {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
  }
  freeze(item);
  render(item, parent);
  assert.equal(JSON.stringify(item), before);
});
