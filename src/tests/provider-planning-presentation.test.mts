import assert from "node:assert/strict";
import test from "node:test";
import { getProviderInterventionHref } from "../app/dashboard/provider/interventionLinks.ts";
import {
  formatInterventionCount,
  getMonthDates,
  getPlanningState,
} from "../app/dashboard/provider/planning/presentation.ts";

test("le planning distingue chargement, échec, liste vide et données disponibles", () => {
  assert.equal(getPlanningState(undefined, false).status, "loading");
  assert.equal(getPlanningState(undefined, true).status, "error");
  assert.equal(getPlanningState(0, true).status, "error");
  assert.equal(getPlanningState(0, false).status, "empty");
  assert.equal(getPlanningState(1, false).status, "ready");
});

test("les compteurs accordent le libellé intervention", () => {
  assert.deepEqual([0, 1, 2].map(formatInterventionCount), [
    "0 intervention",
    "1 intervention",
    "2 interventions",
  ]);
});

test("les raccourcis ouvrent l’intervention sélectionnée à la liste", () => {
  const url = new URL(getProviderInterventionHref("id&autre#détail"), "https://example.test");
  assert.equal(url.pathname, "/dashboard/provider/interventions");
  assert.equal(url.searchParams.get("intervention"), "id&autre#détail");
  assert.equal(url.hash, "#liste-interventions");
});

test("la grille mensuelle inclut tous les jours des mois qui occupent six semaines", () => {
  const dates = getMonthDates(new Date(2026, 7, 15));
  assert.equal(dates.length, 42);
  assert.equal(dates[0].getDay(), 1);
  assert.deepEqual(
    dates.filter((date) => date.getMonth() === 7).map((date) => date.getDate()),
    Array.from({ length: 31 }, (_, index) => index + 1),
  );
  assert.equal(getMonthDates(new Date(2026, 10, 15)).length, 42);
  assert.equal(getMonthDates(new Date(2026, 1, 15)).length, 35);
});
