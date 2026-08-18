---
id: lean-validation-30-days
title: Validation Lean Startup sur 30 jours
description: Construire ou executer un plan de validation marche simple, mesurable et frugal sur 30 jours.
category: business
status: active
version: 1.0.0
createdAt: 2026-08-03
updatedAt: 2026-08-03
author: PlanetLS
target: codex
difficulty: intermediate
estimatedDuration: 2-5h
riskLevel: medium
contexts:
  - ../../planetls-context.md
  - ../../codex-rules.md
  - ../../contexts/business-context.md
  - ../../contexts/pilotage-business-context.md
tags:
  - validation
  - lean
  - go-to-market
source:
  - src/app/dashboard/admin/(business)/pilotage/market-validation/validationData.ts
  - src/app/dashboard/admin/(business)/pilotage/market-validation/LeanValidationDashboard.tsx
---

## Objectif

Planifier une validation terrain lisible, courte et mesurable avant toute extension produit lourde.

## Quand utiliser

- La fondatrice doit valider un segment, une promesse ou une offre.
- Il faut transformer une hypothese en plan de tests concret.

## Quand ne pas l'utiliser

- Le besoin est un plan business complet sur 3 ans.
- Il n'existe aucun acces terrain pour realiser les tests.

## Variables

- {{TARGET_USERS}} | label: Cible a tester | required: true | placeholder: conciergeries de taille 1 a 5 personnes
- {{CURRENT_PROBLEM}} | label: Hypothese principale | required: true | placeholder: la douleur est forte mais la volonte de payer reste inconnue
- {{EXPECTED_RESULT}} | label: Sortie attendue | required: true | placeholder: une sequence de 30 jours avec criteres GO / TEST MORE / PIVOT

## Prompt

Lis les contextes references puis le bloc de validation marche existant.

Puis :

1. reformule les hypotheses critiques ;
2. priorise les tests les plus informatifs ;
3. propose un plan sur 30 jours maximum ;
4. associe chaque test a un signal mesurable ;
5. termine par une grille de decision explicite.

## Livrables attendus

- Hypotheses prioritaires
- Plan 30 jours
- KPI de validation
- Grille GO / TEST MORE / PIVOT

## Criteres de reussite

- Le plan est executable avec peu de moyens
- Les signaux sont mesurables
- La sequence aide une vraie decision

## Historique des versions

- 1.0.0 | 2026-08-03 | creation initiale du prompt

## Provenance

- Validation marche de Pilotage Business

