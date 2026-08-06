---
id: owner-concierge-journey-audit
title: Audit du parcours proprietaire-concierge
description: Auditer un parcours metier complet entre proprietaire et concierge, depuis la demande jusqu'au suivi.
category: product
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
  - ../../contexts/business-context.md
tags:
  - parcours
  - owner
  - concierge
source:
  - docs/audit-complet-parcours-metier-proprietaire-concierge-2026-06-06.md
---

## Objectif

Produire un audit actionnable d'un parcours proprietaire-concierge reel, ancre dans le code et les routes existantes.

## Quand utiliser

- Il faut comprendre les frictions d'un parcours metier.
- Un chantier transverse melange UX, logique metier et etats workflow.

## Quand ne pas l'utiliser

- Le besoin porte sur une seule page.
- Le sujet concerne surtout Stripe ou une migration base.

## Variables

- {{TARGET_USERS}} | label: Profils concernes | required: true | placeholder: proprietaire ; concierge
- {{CURRENT_PROBLEM}} | label: Probleme observe | required: true | placeholder: le parcours se fragmente entre plusieurs ecrans
- {{KNOWN_FILES}} | label: Fichiers ou routes connus | required: false | placeholder: src/app/api/... ; src/app/dashboard/...
- {{SUCCESS_SIGNAL}} | label: Signal de reussite | required: false | placeholder: parcours plus coherent et priorites classees

## Prompt

Lis les contextes references puis les fichiers utiles au parcours.

Ensuite :

1. cartographie le parcours reel observe dans le code ;
2. distingue ce qui est termine, partiel, simule ou manquant ;
3. releve les frictions produit, UX, permissions et donnees ;
4. priorise les corrections ;
5. propose les plus petits changements utiles ;
6. si implementation demandee, execute puis reverifie.

## Livrables attendus

- Cartographie du parcours reel
- Frictions detectees
- Priorisation
- Recommandations ou implementation

## Criteres de reussite

- L'audit s'appuie sur le code et pas seulement sur l'intention
- Les priorites sont actionnables
- Les roles et permissions restent explicites

## Historique des versions

- 1.0.0 | 2026-08-03 | creation initiale du prompt

## Provenance

- Audit parcours proprietaire-concierge du 2026-06-06
