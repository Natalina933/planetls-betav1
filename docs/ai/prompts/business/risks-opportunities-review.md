---
id: risks-opportunities-review
title: Analyse des risques et opportunites PlanetLS
description: Evaluer les risques critiques et opportunites sans les dissocier du contexte produit et business reel.
category: business
status: active
version: 1.0.0
createdAt: 2026-08-03
updatedAt: 2026-08-03
author: PlanetLS
target: codex
difficulty: intermediate
estimatedDuration: 2-4h
riskLevel: medium
contexts:
  - ../../planetls-context.md
  - ../../codex-rules.md
  - ../../contexts/business-context.md
tags:
  - risques
  - opportunites
  - strategie
source:
  - src/app/dashboard/admin/(business)/pilotage/risk-register/riskData.ts
  - docs/master-plan-planetls.md
---

## Objectif

Produire une lecture risque/opportunite utile a la decision, reliee au code, au produit et au terrain.

## Quand utiliser

- Il faut prioriser des menaces critiques.
- Une decision strategique necessite une lecture plus froide des risques.

## Quand ne pas l'utiliser

- Le besoin est purement technique ou purement UX.

## Variables

- {{CURRENT_PROBLEM}} | label: Sujet a analyser | required: true | placeholder: densite locale insuffisante ou offre trop large
- {{BUSINESS_PRIORITY}} | label: Priorite business | required: false | placeholder: valider un segment payeur
- {{EXPECTED_RESULT}} | label: Resultat attendu | required: true | placeholder: risques classes et opportunites exploitables

## Prompt

Lis les contextes references et le registre de risques existant.

Ensuite :

1. recense les 5 risques les plus structurants ;
2. recense les opportunites reelles et pas seulement desirables ;
3. distingue court terme, moyen terme et faux bons idees ;
4. propose des mitigations ou tests ;
5. termine par une recommandation de priorisation.

## Livrables attendus

- Top risques
- Top opportunites
- Mitigations
- Recommandation de priorisation

## Criteres de reussite

- Lecture concrete et non generique
- Lien visible avec la maturite reelle du produit
- Aucune confusion entre risque theorique et risque confirme

## Historique des versions

- 1.0.0 | 2026-08-03 | creation initiale du prompt

## Provenance

- Risk Register Pilotage Business
- Master Plan PlanetLS

