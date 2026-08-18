---
id: subscription-strategy
title: Strategie d'abonnement et cadrage de l'offre
description: Structurer une decision sur l'offre, le prix, le segment prioritaire et les tests business.
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
  - abonnement
  - pricing
  - offre
source:
  - src/app/dashboard/admin/(business)/pilotage/page.tsx
  - docs/master-plan-planetls.md
---

## Objectif

Comparer et cadrer une offre monisable simple sans donner une illusion de certitude.

## Quand utiliser

- Une decision prix ou offre doit etre preparee.
- Il faut arbitrer entre abonnement, commission ou approche hybride.

## Quand ne pas l'utiliser

- La decision doit etre directement appliquee dans Stripe.
- Le besoin concerne une implementation technique pure.

## Variables

- {{TARGET_USERS}} | label: Segment cible | required: true | placeholder: conciergeries
- {{CURRENT_PROBLEM}} | label: Tension actuelle | required: true | placeholder: l'offre reste trop large et peu testable
- {{EXPECTED_RESULT}} | label: Sortie attendue | required: true | placeholder: une offre pilote simple et testable
- {{CONSTRAINTS}} | label: Contraintes | required: false | placeholder: ne pas modifier Stripe ; rester frugal

## Prompt

Lis les contextes references et la documentation business utile.

Puis :

1. rappelle les hypotheses actuelles ;
2. compare 2 a 3 options maximum ;
3. explicite les avantages, risques, signaux de validation et conditions d'abandon ;
4. recommande une option testable sur 30 jours ;
5. separe clairement decision immediate et travail reporte.

## Livrables attendus

- Comparatif simple des options
- Recommandation de test
- Hypotheses critiques
- Prochaines actions terrain

## Criteres de reussite

- Pas de pseudo-precision inutile
- Les arbitrages sont relies au terrain
- Stripe reste hors perimetre tant qu'aucune decision n'est validee

## Historique des versions

- 1.0.0 | 2026-08-03 | creation initiale du prompt

## Provenance

- Pilotage Business
- Master Plan PlanetLS

