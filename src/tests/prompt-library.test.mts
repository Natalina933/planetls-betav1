import test from "node:test";
import assert from "node:assert/strict";
import { parsePromptMarkdown } from "../server/prompt-library/index.ts";

const validPrompt = `---
id: sample-prompt
title: Prompt de test
description: Description de test
category: technical
status: active
version: 1.2.3
createdAt: 2026-08-03
updatedAt: 2026-08-03
author: PlanetLS
target: codex
difficulty: intermediate
estimatedDuration: 1-2h
riskLevel: medium
contexts:
  - ../planetls-context.md
  - ../codex-rules.md
tags:
  - test
  - prompt
source:
  - docs/source.md
---

## Objectif

Verifier le parseur.

## Quand utiliser

- Quand on veut valider un prompt.

## Quand ne pas l'utiliser

- Quand le frontmatter est absent.

## Variables

- {{PAGE_PATH}} | label: Page concernee | required: true | placeholder: /dashboard/admin/pilotage
- {{KNOWN_FILES}} | label: Fichiers connus | required: false | default: src/app/demo.tsx

## Prompt

Analyser {{PAGE_PATH}} puis relire {{KNOWN_FILES}}.

## Livrables attendus

- Diagnostic
- Correctif

## Criteres de reussite

- Parse correct

## Historique des versions

- 1.2.3 | 2026-08-03 | creation

## Provenance

- test interne
`;

test("parsePromptMarkdown lit les metadonnees et sections utiles", () => {
  const parsed = parsePromptMarkdown(validPrompt, "docs/ai/prompts/sample.md");

  assert.equal(parsed.metadata.id, "sample-prompt");
  assert.equal(parsed.metadata.status, "active");
  assert.deepEqual(parsed.metadata.contexts, ["../planetls-context.md", "../codex-rules.md"]);
  assert.equal(parsed.variables[0]?.key, "{{PAGE_PATH}}");
  assert.equal(parsed.variables[0]?.required, true);
  assert.match(parsed.promptContent, /Analyser \{\{PAGE_PATH\}\}/);
  assert.deepEqual(parsed.versionHistory[0], {
    version: "1.2.3",
    date: "2026-08-03",
    changes: ["creation"],
  });
});

test("parsePromptMarkdown rejette une version non semver", () => {
  assert.throws(
    () =>
      parsePromptMarkdown(
        validPrompt.replace("version: 1.2.3", "version: unstable"),
        "docs/ai/prompts/invalid.md",
      ),
    /Version semver invalide/,
  );
});

test("parsePromptMarkdown rejette un frontmatter manquant", () => {
  assert.throws(
    () => parsePromptMarkdown("## Objectif\n\nSans frontmatter", "docs/ai/prompts/missing.md"),
    /Frontmatter YAML manquant/,
  );
});
