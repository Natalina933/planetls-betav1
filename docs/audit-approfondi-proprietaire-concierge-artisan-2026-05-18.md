# Audit approfondi par catégorie - Propriétaire, Concierge, Artisan

_Date: 18 mai 2026_
_Dernière mise à jour: 18 mai 2026 (lot P0 messagerie provider)_

## Objectif
Avoir une vue exploitable de l'état réel du produit par profil utilisateur:
- expérience utilisateur,
- demandes et missions,
- synchronisation des données,
- avancées livrées,
- ce qu'il reste à mettre en place pour un site abouti.

Ce document sert aussi de point de suivi des audits déjà faits (`docs/onboarding-gap-analysis-all-categories-2026-04-29.md`, `docs/ux-onboarding-audit-reprise-2026-04-29.md`, `docs/concierge-ux-personas-analysis-2026-04-25.md`).

## Légende statut
- `fait`: livré et visible dans le code.
- `partiel`: présent mais incomplet ou hétérogène.
- `en cours`: lancé, avec livrables intermédiaires disponibles.
- `à faire`: manque fonctionnel ou qualité bloquante.

---

## 1) Vue d'ensemble produit

### Fondations globales
- `fait` - Dashboards dédiés pour les 3 profils: owner (`/dashboard/owner`), concierge (`/dashboard/concierge`), artisan/provider (`/dashboard/provider`).
- `fait` - Parcours onboarding multi-étapes et redirection par catégorie (`CompleteRegistrationPage.tsx`).
- `fait` - Flux métier structurants déjà branchés: demandes (`/api/service-requests`), missions (`/api/missions`), messages (`/api/messages/conversations`), devis/factures (`/api/quotes`, `/api/invoices`, `/api/billing/*`).
- `fait` - Base de tests métier déjà significative (`src/tests/*`: missions, messages, recherche, profile editing, provider workspace, etc.).

### Points transverses à finaliser
- `partiel` - UX homogène de bout en bout (onboarding et qualité de cohérence visuelle selon écrans).
- `partiel` - Instrumentation KPI produit consolidée par parcours (activation, conversion, délai première valeur).
- `fait` - Checklist QA manuelle par profil documentée (`docs/qa-checklist-p0-profils-2026-05-18.md`).
- `à faire` - Exécuter cette checklist et consigner les résultats de validation.

---

## 2) Audit Propriétaire

### Expérience utilisateur
- `fait` - Espace riche et structuré: logements, missions, planning, alertes, conciergerie, demandes, devis, factures, messages, contacts.
- `fait` - Parcours principal cohérent: recherche concierges -> sélection -> envoi de demande -> échanges -> devis -> mission.
- `partiel` - Entrée onboarding orientée objectif présente en données/champs mais pas encore pleinement orchestrée comme tunnel guidé propriétaire de bout en bout.

### Demandes et missions
- `fait` - Création/lecture/mise à jour des demandes (`/api/service-requests`) et sélection de devis (`/api/service-requests/[id]/select`).
- `fait` - Création et suivi des missions (`/api/missions`, `/dashboard/owner/missions/*`, `/dashboard/owner/planning`).
- `fait` - Missions urgentes et suivi d'avancement déjà visibles côté owner.

### Synchronisation des données
- `fait` - Sync paiement/facture déjà branchée (`/api/billing/invoices/[id]/sync`, flux checkout).
- `fait` - Messages et conversations temps produit déjà intégrés aux écrans owner.
- `partiel` - Retours de sync et états de traitement encore hétérogènes selon pages (feedback utilisateur pas toujours uniforme).

### Avancées depuis audits précédents
- `fait` - Base owner devenue nettement plus complète que l'état ciblé en avril (demandes, devis, missions, finances, contacts).
- `fait` - Le point bloquant ancien "conflit merge register" n'est plus présent.

### Reste à faire pour une version aboutie
- `à faire` - Standardiser les feedbacks de statuts (chargement, succès, erreurs, retry) sur toutes les pages owner.
- `à faire` - Ajouter un score de progression owner global (activation compte -> 1ère demande -> 1ère mission -> 1er paiement).
- `à faire` - Renforcer tests E2E du parcours critique owner (de la recherche concierge jusqu'à mission créée).

---

## 3) Audit Concierge

### Expérience utilisateur
- `fait` - Dashboard concierge très avancé: missions, demandes, recherche, messages, logements, objectifs, alertes, urgences, profile tabs, pricing, packs, billing.
- `fait` - Différenciation de posture (mode simple/express/business) et logique onboarding enrichie dans l'inscription.
- `partiel` - Uniformisation UX encore à lisser entre modules historiques et nouveaux modules (styles/comportements d'interaction).

### Demandes et missions
- `fait` - Vue demandes concierge branchée sur `/api/service-requests?view=concierge`.
- `fait` - Gestion mission/planning/urgences active avec nombreuses actions contextuelles.
- `fait` - Couplage missions <-> messages <-> devis déjà exploitable.

### Synchronisation des données
- `fait` - Sync abonnement concierge PRO (`/api/billing/sync`) et écrans dédiés.
- `fait` - Données pricing/segments/règles/scénarios déjà persistées via API dédiées.
- `partiel` - Certaines logiques "état prêt" (readiness checks) restent locales UI et gagneraient à être historisées/mesurées côté serveur.

### Avancées depuis audits précédents
- `fait` - La majorité des priorités concierge des audits d'avril est maintenant implémentée côté produit.
- `fait` - Profil, missions, zone, disponibilité, finances et prospection sont couverts de façon opérationnelle.

### Reste à faire pour une version aboutie
- `à faire` - Consolider un référentiel unique de progression concierge (onboarding + exploitation quotidienne + business).
- `à faire` - Renforcer l'accessibilité et la cohérence interactionnelle des modales/formulaires sur tout le tunnel.
- `à faire` - Mettre en place des tests E2E ciblés concierge (demande reçue -> message -> devis -> mission).

---

## 4) Audit Artisan (Provider)

### Expérience utilisateur
- `fait` - Espace provider/artisan présent avec sections: interventions, planning, alertes, messages, clients, devis, finances, settings.
- `fait` - Rôles artisan/pro alignés avec provider côté permissions et navigation.
- `partiel` - Maturité UX plus faible que owner/concierge (moins de profondeur métier visible dans certains écrans).

### Demandes et missions
- `fait` - Interventions artisan liées aux missions disponibles (création/suivi via endpoints provider et mission detail).
- `fait` - Flux clients/messages/alertes déjà fonctionnels en base.
- `partiel` - Parcours "de la sollicitation à la facturation" moins industrialisé que côté concierge.

### Synchronisation des données
- `partiel` - APIs provider en place, avec progression messagerie: le dernier message est désormais synchronisé côté conversation (`last_message_preview`, `last_message_at`, réouverture du fil).
- `fait` - Intégration globale avec quotes/invoices/missions déjà prévue côté rôles et autorisations.

### Avancées depuis audits précédents
- `fait` - Le profil artisan n'est plus uniquement théorique: workspace complet en place.
- `fait` - Durcissement P0 messagerie provider implémenté dans:
  - `src/app/api/provider/messages/route.ts`
  - `src/app/api/provider/messages/[id]/route.ts`
- `partiel` - Le niveau de finition produit reste en retrait par rapport aux deux autres profils.

### Reste à faire pour une version aboutie
- `partiel` - Finaliser la messagerie provider en éliminant les dépendances de migration restantes (socle API de synchronisation déjà renforcé).
- `à faire` - Renforcer l'onboarding artisan orienté preuves de confiance (SIRET, assurance, portfolio) et disponibilité opérationnelle.
- `à faire` - Ajouter des KPI artisan explicites (temps de réponse, interventions terminées, conversion devis).

---

## 5) Suivi des audits antérieurs

### Audit onboarding global 29/04
- Stepper onboarding unifié 5/5: `partiel`
- Mode lisibilité multi-étapes: `partiel`
- Personnalisation concierge: `fait`
- Personnalisation propriétaire: `partiel`
- Personnalisation artisan: `partiel`
- Conflit API register: `fait`

### Audit personas concierge 25/04
- Base fonctionnelle concierge: `fait`
- Progression vers mode simple vs expert: `fait`
- Industrialisation business complète (KPI consolidés + automatisations): `partiel`

---

## 6) Priorités recommandées (ordre d'impact)
1. `P0` - Finaliser la robustesse artisan/provider (parcours complet, KPI) après première brique messagerie déjà livrée.
2. `P0` - Normaliser les états UX (loading/error/success) sur les 3 profils.
3. `P1` - Mettre des tests E2E parcours critiques par profil.
4. `P1` - Consolider un tableau de pilotage activation/conversion partagé produit.
5. `P2` - Harmoniser les patterns UI onboarding pour cohérence totale.

---

## 7) Journal des mises à jour

### 18/05/2026 - Lot P0 messagerie provider
- `fait` - Mise à jour du dernier message de conversation lors de la création d'un fil avec message initial.
- `fait` - Mise à jour du dernier message de conversation lors de l'envoi d'un nouveau message.
- `fait` - Réouverture automatique d'un fil en statut `open` après nouveau message.
- `fait` - Création d'une checklist QA d'exécution P0 dans `docs/qa-checklist-p0-profils-2026-05-18.md`.

### 18/05/2026 - Lot P1 amorcé
- `fait` - Runbook d'exécution E2E des 3 parcours critiques créé: `docs/p1-e2e-runbook-parcours-critiques-2026-05-18.md`.
- `fait` - Cadrage KPI partagé multi-profils documenté: `docs/p1-kpi-pilotage-partage-2026-05-18.md`.
- `fait` - Endpoint KPI agrégé créé: `src/app/api/kpis/overview/route.ts`.
- `fait` - Affichage KPI minimal branché dans l'admin: `src/app/dashboard/admin/page.tsx`.
- `en cours` - Automatisation E2E (outil de test + scénarios exécutables CI).

---

## Conclusion
Le socle est avancé et déjà exploitable en production sur les trois profils. Le chantier principal n'est plus la création de fonctionnalités majeures, mais la finition: homogénéité UX, robustesse provider/artisan, et pilotage qualité par KPI/tests E2E pour atteindre un niveau "site abouti".
