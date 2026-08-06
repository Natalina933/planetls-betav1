---
id: predeployment-regression
title: Test de regression avant deploiement
description: Preparer et executer une verification de regression avant release ou merge important.
category: quality
status: active
version: 1.0.0
createdAt: 2026-08-03
updatedAt: 2026-08-03
author: PlanetLS
target: codex
difficulty: intermediate
estimatedDuration: 1-4h
riskLevel: medium
contexts:
  - ../../planetls-context.md
  - ../../codex-rules.md
  - ../../contexts/technical-context.md
tags:
  - regression
  - build
  - e2e
source:
  - docs/p1-e2e-runbook-parcours-critiques-2026-05-18.md
  - docs/master-plan-planetls.md
---

## Objectif

Verifier qu'un lot important ne casse pas les parcours critiques, le build ou les permissions.

## Quand utiliser

- Avant merge important
- Avant deploiement
- Apres un refactor transverse

## Quand ne pas l'utiliser

- Le changement est typographique et isole.
- Les prerequis de test sont absents et non compensables.

## Variables

- {{KNOWN_FILES}} | label: Fichiers modifies | required: true | placeholder: src/app/... ; docs/...
- {{CURRENT_PROBLEM}} | label: Risque principal | required: false | placeholder: risque de regression admin ou workflow
- {{CONSTRAINTS}} | label: Contraintes | required: false | placeholder: sandbox ; e2e indisponible ; cle test absente

## Prompt

Lis les contextes references puis concentre-toi sur le lot modifie.

Ensuite :

1. identifie les parcours critiques touches ;
2. execute les verifications pertinentes `test`, `lint`, `build`, E2E si possible ;
3. releve les gaps de verification restants ;
4. termine par une lecture `pret / partiel / bloque`.

## Livrables attendus

- Liste des verifications executees
- Resultats
- Gaps restants
- Recommandation de release

## Criteres de reussite

- Le niveau de confiance final est explicite
- Les tests manquants sont signales
- Le build n'est pas oublie

## Historique des versions

- 1.0.0 | 2026-08-03 | creation initiale du prompt

## Provenance

- Runbook E2E
- Master Plan PlanetLS
