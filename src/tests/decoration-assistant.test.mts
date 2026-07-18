import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDecorationReport,
  summarizeDecorationHistory,
  type DecorationAssistantInput,
} from "../app/lib/decorationAssistant.ts";

const baseInput: DecorationAssistantInput = {
  roomName: "Salon",
  housingType: "apartment",
  budget: 900,
  style: "premium",
  goal: "better_photos",
  ownerName: "Nathalie",
  ownerEmail: "owner@example.com",
  propertyName: "Appartement Opéra",
  constraints: "Pas de peinture.",
  photoName: "salon.jpg",
};

test("buildDecorationReport returns a complete owner-ready decoration report", () => {
  const report = buildDecorationReport(baseInput);

  assert.equal(report.input.budget, 900);
  assert.equal(report.palette.length, 3);
  assert.ok(report.strengths.length >= 3);
  assert.ok(report.weaknesses.length >= 3);
  assert.ok(report.suggestions.length >= 3);
  assert.ok(report.objects.length >= 3);
  assert.ok(report.photoTips.length >= 4);
  assert.match(report.imagePrompt, /location saisonnière/i);
  assert.match(report.executiveSummary, /Pas de peinture/);
  assert.ok(report.budget.estimatedTotal > 0);
});

test("summarizeDecorationHistory computes dashboard metrics", () => {
  const reports = [
    buildDecorationReport(baseInput),
    buildDecorationReport({ ...baseInput, style: "premium", budget: 1200 }),
    buildDecorationReport({ ...baseInput, style: "bohemian", budget: 600 }),
  ];

  const summary = summarizeDecorationHistory(reports);

  assert.equal(summary.analysesCount, 3);
  assert.equal(summary.averageBudget, 900);
  assert.equal(summary.popularStyles[0]?.style, "premium");
  assert.equal(summary.popularStyles[0]?.count, 2);
});
test("buildDecorationReport adapts recommendations to family friendly goal", () => {
  const report = buildDecorationReport({
    ...baseInput,
    style: "family",
    goal: "family_friendly",
    budget: 700,
  });

  assert.ok(report.suggestions.some((item) => item.title.includes("famille")));
  assert.match(report.imagePrompt, /familial/i);
  assert.equal(report.input.budget, 700);
});
