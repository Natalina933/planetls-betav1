---
id: prompt-id
title: Titre du prompt
description: Description courte et concrete
category: technical
status: draft
version: 0.1.0
createdAt: 2026-08-03
updatedAt: 2026-08-03
author: PlanetLS
target: codex
difficulty: intermediate
estimatedDuration: 1-4h
riskLevel: medium
contexts:
  - ../planetls-context.md
  - ../codex-rules.md
tags:
  - exemple
source:
  - origine-a-indiquer
---

## Objectif

Decrire le resultat cherche en une phrase.

## Quand utiliser

- Cas ou ce prompt est approprie.

## Quand ne pas l'utiliser

- Cas ou ce prompt n'est pas le bon outil.

## Variables

- {{PAGE_PATH}} | label: Page concernee | required: true | placeholder: /dashboard/admin/pilotage
- {{CURRENT_PROBLEM}} | label: Probleme actuel | required: true | placeholder: La page est trop dense
- {{EXPECTED_RESULT}} | label: Resultat attendu | required: true | placeholder: Une page plus claire et plus simple a piloter
- {{KNOWN_FILES}} | label: Fichiers connus | required: false | placeholder: src/app/... ; docs/...

## Prompt

Avant d'executer cette mission, lis obligatoirement les contextes references.

Puis :

1. analyse l'existant ;
2. formule le diagnostic ;
3. propose l'implementation la plus simple utile ;
4. execute les changements ;
5. verifie les regressions ;
6. mets a jour la documentation concernee.

Contexte specifique :

- `{{PAGE_PATH}}`
- `{{CURRENT_PROBLEM}}`
- `{{EXPECTED_RESULT}}`
- `{{KNOWN_FILES}}`

## Livrables attendus

- Diagnostic initial
- Implementation
- Verification
- Compte rendu final

## Criteres de reussite

- Pas de duplication inutile
- Solution simple et maintenable
- Documentation alignee avec le code

## Historique des versions

- 0.1.0 | 2026-08-03 | creation du template initial

## Provenance

- bibliotheque initiale PlanetLS
