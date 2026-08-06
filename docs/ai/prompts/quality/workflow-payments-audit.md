---
id: workflow-payments-audit
title: Audit demandes, devis, missions et paiements
description: Verifier la coherence du workflow metier de la demande initiale jusqu'au paiement visible.
category: quality
status: active
version: 1.0.0
createdAt: 2026-08-03
updatedAt: 2026-08-03
author: PlanetLS
target: codex
difficulty: advanced
estimatedDuration: 4-8h
riskLevel: high
contexts:
  - ../../planetls-context.md
  - ../../codex-rules.md
  - ../../contexts/technical-context.md
tags:
  - workflow
  - paiement
  - mission
source:
  - docs/audit-parcours-demande-devis-mission-2026-06-05.md
  - docs/audit-parcours-paiement-devis-mission-2026-06-06.md
---

## Objectif

Auditer le workflow demande -> devis -> mission -> paiement avec une lecture produit, technique et permissions.

## Quand utiliser

- Une regression impacte le parcours commercial ou terrain.
- Il faut preparer une consolidation avant tests E2E ou release.

## Quand ne pas l'utiliser

- Le besoin est purement visuel.
- Le sujet porte seulement sur un texte ou une documentation.

## Variables

- {{CURRENT_PROBLEM}} | label: Probleme actuel | required: true | placeholder: incoherence de statuts ou de facturation
- {{KNOWN_FILES}} | label: Fichiers et routes utiles | required: false | placeholder: api/workflow ; api/billing ; dashboard missions
- {{CONSTRAINTS}} | label: Contraintes | required: false | placeholder: ne pas modifier Stripe ; ne pas lancer de migration irreversible

## Prompt

Lis les contextes references puis inspecte le workflow reel.

Attendus :

1. verifier les statuts et transitions ;
2. controler les permissions et la visibilite des donnees ;
3. relever les incoherences entre UX, API, base et facturation ;
4. distinguer dette immediate, dette structurelle et blocages critiques ;
5. proposer ou appliquer les correctifs minimaux utiles ;
6. confirmer les verifications executees.

## Livrables attendus

- Liste des ecarts par etape de workflow
- Risques fonctionnels et securite
- Correctifs recommandes ou appliques
- Tests ou verifications executes

## Criteres de reussite

- Les anomalies sont rattachees a une etape claire
- Les permissions ne sont pas cassees
- Le compte rendu distingue reel, hypothese et simulation

## Historique des versions

- 1.0.0 | 2026-08-03 | creation initiale du prompt

## Provenance

- Audits workflow et paiements de juin 2026
