---
id: master-plan-update
title: Mise a jour du Master Plan PlanetLS
description: Mettre a jour le pilotage officiel apres une evolution fonctionnelle, technique ou metier significative.
category: project-management
status: active
version: 1.0.0
createdAt: 2026-08-03
updatedAt: 2026-08-03
author: PlanetLS
target: codex
difficulty: intermediate
estimatedDuration: 30-90min
riskLevel: medium
contexts:
  - ../../planetls-context.md
  - ../../codex-rules.md
  - ../../../master-plan-planetls.md
tags:
  - master-plan
  - roadmap
  - journal
source:
  - AGENTS.md
  - docs/master-plan-planetls.md
---

## Objectif

Refleter dans le Master Plan l'etat reel du produit apres une mission significative.

## Quand utiliser

- Une fonctionnalite a ete ajoutee, modifiee ou stabilisee.
- Une priorite, limite ou dependance change vraiment.

## Quand ne pas l'utiliser

- Le changement est purement cosmetique et sans effet partage.

## Variables

- {{KNOWN_FILES}} | label: Fichiers modifies | required: true | placeholder: src/app/... ; docs/...
- {{CURRENT_PROBLEM}} | label: Impact a refleter | required: true | placeholder: nouveau module, changement de statut ou nouvelle limite
- {{EXPECTED_RESULT}} | label: Sortie attendue | required: true | placeholder: statuts, preuves et prochaine action alignes

## Prompt

Lis le Master Plan, les fichiers modifies et les verifications executees.

Puis :

1. mets a jour le statut reel ;
2. actualise priorite, preuves, limites, dependances et prochaine action ;
3. ajoute la decision utile au journal si necessaire ;
4. n'ajoute aucun audit redondant ;
5. termine par une section `Mise a jour du pilotage PlanetLS`.

## Livrables attendus

- Master Plan mis a jour
- Journal de decision si utile
- Compte rendu de pilotage final

## Criteres de reussite

- Le document reste la source de pilotage officielle
- Les preuves correspondent au code et aux tests
- Les contradictions detectees sont signalees

## Historique des versions

- 1.0.0 | 2026-08-03 | creation initiale du prompt

## Provenance

- AGENTS.md
- Master Plan PlanetLS
