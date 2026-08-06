---
id: ux-page-refactor
title: Refonte UX/UI d'une page existante PlanetLS
description: Ameliorer la lisibilite, la hierarchie et le responsive d'une page existante sans casser ses usages.
category: ux-ui
status: active
version: 1.0.0
createdAt: 2026-08-03
updatedAt: 2026-08-03
author: PlanetLS
target: codex
difficulty: intermediate
estimatedDuration: 2-6h
riskLevel: medium
contexts:
  - ../../planetls-context.md
  - ../../codex-rules.md
  - ../../contexts/ux-ui-context.md
tags:
  - ux
  - dashboard
  - responsive
source:
  - docs/ui-harmonization-audit.md
  - docs/responsive-a11y-dashboard-checklist-2026-05-25.md
---

## Objectif

Refondre une page existante pour la rendre plus claire, plus scannable et plus exploitable sans refaire toute l'architecture.

## Quand utiliser

- Une page devient trop dense ou trop difficile a lire.
- Le responsive ou l'accessibilite sont insuffisants.
- Il faut reorganiser des blocs existants plutot que creer un module complet neuf.

## Quand ne pas l'utiliser

- Le besoin principal est backend ou permissions.
- La page n'existe pas encore.

## Variables

- {{PAGE_PATH}} | label: Page concernee | required: true | placeholder: /dashboard/admin/pilotage
- {{CURRENT_PROBLEM}} | label: Probleme actuel | required: true | placeholder: La page est trop dense et peu scannable
- {{EXPECTED_RESULT}} | label: Resultat attendu | required: true | placeholder: Une lecture en 10 secondes avec vues claires
- {{KNOWN_FILES}} | label: Fichiers a relire | required: false | placeholder: src/app/... ; docs/...

## Prompt

Avant d'executer cette mission, lis obligatoirement les contextes references et les fichiers lies a `{{PAGE_PATH}}`.

Puis :

1. audite l'existant avant toute creation ;
2. identifie ce qui peut etre reutilise ;
3. propose une reorganisation simple ;
4. implemente la version la plus utile ;
5. verifie responsive, accessibilite, chargement et etats vides ;
6. mets a jour la documentation ou le Master Plan si l'impact est significatif.

Contexte de mission :

- page : `{{PAGE_PATH}}`
- probleme : `{{CURRENT_PROBLEM}}`
- resultat attendu : `{{EXPECTED_RESULT}}`
- fichiers connus : `{{KNOWN_FILES}}`

## Livrables attendus

- Diagnostic UX initial
- Refactor de page ou de composants
- Verifications responsive et a11y
- Resume des changements

## Criteres de reussite

- La page est plus simple a comprendre
- Les composants existants sont privilegies
- Le responsive n'est pas une regression

## Historique des versions

- 1.0.0 | 2026-08-03 | creation initiale du prompt

## Provenance

- Audit UI PlanetLS
- Checklist responsive et accessibilite
