# P1 - Parcours critiques E2E (runbook exécutable)

_Date: 18 mai 2026_

## Portée
Ce runbook couvre les 3 parcours critiques produit:
1. Propriétaire: recherche concierge -> demande -> message -> devis -> mission.
2. Concierge: demande reçue -> réponse -> devis -> planification mission.
3. Artisan: client -> conversation -> intervention -> suivi.

## Pré-conditions
- Base avec jeux de données de test (owner/concierge/provider) actifs.
- Auth valide sur les 3 comptes.
- Variables d'environnement Supabase et billing configurées.
- Données horaires/logements minimales présentes pour éviter les faux négatifs.

## Grille de preuve
Pour chaque scénario, consigner:
- date/heure,
- testeur,
- compte utilisé,
- résultat (`PASS`/`FAIL`),
- URL de l’écran où ça bloque,
- message d’erreur exact,
- capture(s) si FAIL.

---

## Scénario E2E 1 - Propriétaire

### Étapes
1. Ouvrir `/dashboard/owner/concierges`.
2. Rechercher une concierge et sélectionner au moins 1 profil.
3. Envoyer une demande via le panneau de demande.
4. Vérifier la présence de la demande dans `/dashboard/owner/demandes`.
5. Ouvrir la conversation liée dans `/dashboard/owner/messages`.
6. Vérifier qu’un devis lié est consultable dans `/dashboard/owner/devis` (si devis envoyé côté concierge).
7. Créer/ouvrir la mission depuis l’espace owner.

### Critères de succès
- Demande persistée et visible immédiatement.
- Conversation accessible sans 500/403.
- Lien demande/devis/mission cohérent (mêmes IDs métier).

### Exécution en cours (18/05/2026)
- Statut: `en cours`
- Responsable: QA / Produit
- Préparation terminée: check des écrans cibles owner (`concierges`, `demandes`, `messages`, `devis`, `missions`).
- Reste à produire: preuves d'exécution réelle (`PASS/FAIL`, URL bloquante, message d'erreur exact, captures).

### Exécution 2026-05-25 18:56
- Testeur: Codex
- Environnement: local `http://localhost:3000`, Supabase projet configuré via `.env.local`
- Compte owner: `proprio123@fee.fr`
- Concierge ciblé: `chris664@free.fr` (Christa Lefevbure)
- Scénario 1 Owner: `FAIL partiel`
- Données créées dans Supabase: demande `96531566-f84e-4d1a-aa11-567f2c33994d`, conversation `69159d9b-b691-4ef3-981d-ab9cfcbeed9a`
- Blocants: la recherche UI `/dashboard/owner/concierges` reste en état `Recherche en cours...` en dev local lors du test navigateur. Le serveur dev Next a aussi présenté des timeouts intermittents sur `/api/auth/session`; relance en `dev:webpack` nécessaire pour stabiliser `/login`.
- Décision: ne pas marquer le parcours complet PASS tant que la recherche UI et l'ouverture côté concierge n'ont pas été rejouées sur une session réelle.

---

## Scénario E2E 2 - Concierge

### Étapes
1. Ouvrir `/dashboard/concierge/demandes`.
2. Prendre une demande reçue, ouvrir la conversation propriétaire.
3. Envoyer une réponse.
4. Préparer ou ouvrir le devis depuis le flux demande.
5. Vérifier la mise à jour dans `/dashboard/concierge/planning` ou `/dashboard/concierge/missions` après conversion en mission.

### Critères de succès
- Passage demande -> message -> devis sans rupture.
- Navigation contextuelle correcte depuis chaque CTA.
- Statuts cohérents entre demandes, missions et planning.

---

## Scénario E2E 3 - Artisan/Provider

### Étapes
1. Ouvrir `/dashboard/provider/clients` et vérifier un client actif.
2. Ouvrir `/dashboard/provider/messages`.
3. Créer un nouveau fil avec message initial, puis renvoyer un second message.
4. Vérifier que le fil remonte en tête et que l’aperçu est à jour.
5. Ouvrir `/dashboard/provider/interventions` et créer/mettre à jour une intervention liée.

### Critères de succès
- `last_message_preview` et `last_message_at` reflètent le dernier envoi.
- Aucun blocage de navigation entre messages/clients/interventions.
- Intervention visible en liste avec statut modifiable.

---

## Template de résultat (copier/coller)

```md
### Exécution YYYY-MM-DD HH:mm
- Testeur:
- Environnement:
- Scénario 1 Owner: PASS|FAIL
- Scénario 2 Concierge: PASS|FAIL
- Scénario 3 Provider: PASS|FAIL
- Blocants:
- Captures/Logs:
- Décision release:
```

---

## Priorité de correction en cas d'échec
1. `P0` API 500/403 sur parcours critique.
2. `P0` perte de lien entre objets métier (demande/devis/mission).
3. `P1` incohérence d’état UI sans perte de donnée.
4. `P2` microcopie/ergonomie non bloquante.
