# Checklist QA P0 - Propriétaire, Concierge, Artisan

_Date: 18 mai 2026_

## But
Exécuter rapidement les points `P0`, `partiel` et `à faire` avec une vérification manuelle stable avant release.

## Statuts
- `fait`
- `en cours`
- `à faire`

---

## 1) P0 Robustesse Artisan/Provider

### Messagerie provider
- `fait` Vérifier liste conversations (`GET /api/provider/messages`) sans erreur 500.
- `fait` Vérifier création de conversation avec message initial met à jour le dernier message du fil.
- `fait` Vérifier envoi dans un fil existant met à jour `last_message_preview` et `last_message_at`.
- `à faire` Vérifier fermeture/réouverture de conversation selon règles métier attendues.

### Parcours provider complet
- `à faire` Créer client -> créer conversation -> créer intervention -> suivi statut.
- `à faire` Vérifier cohérence entre `interventions`, `alertes` et `messages`.

---

## 2) P0 États UX homogènes (3 profils)

### Propriétaire
- `en cours` Pattern unifié `loading/error/success` renforcé sur demandes, devis, factures (reste: messages, planning).
- `en cours` Wording erreurs API unifié sur demandes, devis, factures via helper `ownerApiError` (reste: messages, planning).

### Concierge
- `à faire` Confirmer pattern unique `loading/error/success` sur demandes, missions, messages, pricing, packs.
- `à faire` Uniformiser feedback après actions critiques (envoi, validation, sélection, création).

### Artisan
- `en cours` Confirmer pattern unique `loading/error/success` sur messages provider.
- `à faire` Harmoniser avec interventions, clients et alertes.

---

## 3) P1 Tests E2E critiques (à préparer maintenant)

### Propriétaire
- `en cours` Recherche concierge -> demande -> message -> devis -> mission.
- `en cours` Runbook prêt: `docs/p1-e2e-runbook-parcours-critiques-2026-05-18.md` (Scénario E2E 1 Owner).
- `à faire` Exécuter le scénario en environnement cible et consigner preuves (`PASS/FAIL`, URL bloquante, message exact, captures).

### Concierge
- `à faire` Demande reçue -> réponse -> devis -> planification mission.

### Artisan
- `à faire` Client -> conversation -> intervention -> suivi.

---

## 4) KPI produit consolidés

- `à faire` Activation J+7 par profil.
- `à faire` Délai inscription -> première action utile par profil.
- `à faire` Conversion demande -> mission -> paiement.
- `à faire` Temps moyen première réponse messages (owner/concierge/provider).

---

## 5) Suivi d'exécution

### Lot exécuté le 18/05/2026
- `fait` Durcissement messagerie provider: mise à jour explicite du dernier message et timestamp dans les routes API.

### Prochain lot recommandé
1. Uniformiser les feedbacks UX owner sur pages `demandes`, `devis`, `factures`.
2. Uniformiser les feedbacks UX concierge sur `demandes` et `messages`.
3. Exécuter 3 scénarios E2E manuels de bout en bout (1 par profil) et consigner les écarts.
