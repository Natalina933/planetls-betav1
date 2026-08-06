---
id: technical-audit
title: Audit technique PlanetLS
description: Auditer architecture, dette, permissions et conventions a partir du code reel du depot.
category: technical
status: active
version: 1.0.0
createdAt: 2026-08-03
updatedAt: 2026-08-03
author: PlanetLS
target: codex
difficulty: advanced
estimatedDuration: 3-8h
riskLevel: high
contexts:
  - ../../planetls-context.md
  - ../../codex-rules.md
  - ../../contexts/technical-context.md
tags:
  - architecture
  - permissions
  - dette
source:
  - docs/sprint-1-audit-complet-planetls-2026-07-07.md
  - docs/audit-complet-code-routes-permissions-2026-06-18.md
---

## Objectif

Produire un audit technique credible qui s'appuie sur le code actuel, pas sur des suppositions documentaires.

## Quand utiliser

- Il faut reprendre un module devenu fragile.
- Une dette technique ou de permissions doit etre clarifiee.
- Il faut preparer un refactor ou une phase de stabilisation.

## Quand ne pas l'utiliser

- Le besoin est une simple correction UI.
- Le perimetre n'est pas encore delimite.

## Variables

- {{MODULE_NAME}} | label: Module ou zone | required: true | placeholder: pilotage admin ou workflow reservations
- {{KNOWN_FILES}} | label: Fichiers connus | required: false | placeholder: src/app/... ; src/server/... ; docs/...
- {{CURRENT_PROBLEM}} | label: Probleme observe | required: true | placeholder: conventions heterogenes ou logique dispersee
- {{EXPECTED_RESULT}} | label: Sortie attendue | required: false | placeholder: cartographie et priorisation technique

## Prompt

Lis les contextes references puis inspecte le module `{{MODULE_NAME}}`.

Attendus :

1. cartographier architecture, donnees et points d'entree ;
2. relever la dette immediate et structurelle ;
3. verifier roles, permissions et effets de bord ;
4. classer les problemes par severite ;
5. proposer le plus petit plan de remise en etat utile.

## Livrables attendus

- Cartographie technique
- Findings classes
- Risques de regression
- Plan de correction

## Criteres de reussite

- Le diagnostic est factuel
- Les permissions sont traitees explicitement
- Les recommandations sont proportionnees

## Historique des versions

- 1.0.0 | 2026-08-03 | creation initiale du prompt

## Provenance

- Audit sprint et audit routes/permissions
