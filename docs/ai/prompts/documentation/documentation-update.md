---
id: documentation-update
title: Mise a jour de documentation PlanetLS
description: Mettre a jour la documentation impactee par une evolution reelle du code ou du produit.
category: documentation
status: active
version: 1.0.0
createdAt: 2026-08-03
updatedAt: 2026-08-03
author: PlanetLS
target: codex
difficulty: beginner
estimatedDuration: 30-90min
riskLevel: low
contexts:
  - ../../planetls-context.md
  - ../../codex-rules.md
tags:
  - documentation
  - maintenance
source:
  - AGENTS.md
  - docs/master-plan-planetls.md
---

## Objectif

Mettre a jour la documentation utile a partir des fichiers reels modifies et des preuves disponibles.

## Quand utiliser

- Une evolution importante vient d'etre codee.
- Un document de reference n'est plus aligne avec le code.

## Quand ne pas l'utiliser

- La mission est une simple coquille visuelle sans impact partage.

## Variables

- {{KNOWN_FILES}} | label: Fichiers modifies | required: true | placeholder: src/app/... ; docs/...
- {{EXPECTED_RESULT}} | label: Documentation a aligner | required: true | placeholder: README, doc metier, spec technique

## Prompt

Lis les fichiers modifies et la documentation concernee.

Puis :

1. identifie les infos devenues obsoletes ;
2. mets a jour uniquement ce que le code confirme ;
3. note les limites restantes ;
4. indique les verifications executees.

## Livrables attendus

- Documentation mise a jour
- Notes de limites
- Preuves ou verifications

## Criteres de reussite

- Pas de contradiction avec le code
- Pas de nouvel audit redondant
- Les limites non confirmees restent signalees

## Historique des versions

- 1.0.0 | 2026-08-03 | creation initiale du prompt

## Provenance

- AGENTS.md
- regles documentaires PlanetLS
