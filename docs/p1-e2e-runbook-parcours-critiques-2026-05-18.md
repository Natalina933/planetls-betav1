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

### Exécution automatisée 2026-07-18

- Testeur : Codex / Playwright Chromium.
- Environnement : serveur Next.js Webpack isolé sur le port 3100, comptes workspace locaux préparés via Supabase.
- Scénario owner smoke : `PASS` — authentification, dashboard, recherche concierge, API profils publics et demandes owner.
- Scénario concierge smoke : `PASS` — authentification, cockpit, demandes, assistant décoration et APIs associées.
- Scénario provider smoke : `PASS` — authentification, cockpit, clients, messages et interventions.
- Résultat : `3 passed` en 3,9 minutes ; tests unitaires `157/157`, lint et build `164 pages` au vert.
- Correctif découvert : les sélecteurs SCSS globaux de `dashboardSaas.module.scss` devaient être rattachés à une classe locale pour fonctionner avec Webpack.
- Limite : ces scénarios valident l'accès et les lectures critiques, pas encore les mutations complètes demande → devis → mission → paiement.
- Écart données : la table `decoration_ai_reports` n'est pas disponible dans le cache de schéma de la base connectée ; l'API renvoie donc l'historique vide de secours.
- CI : workflow `.github/workflows/e2e.yml` ajouté ; secrets E2E GitHub à configurer avant première exécution distante.
### Exécution transactionnelle du 18/07/2026

- Testeur : Codex / Playwright Chromium.
- Scénario : owner authentifié → demande ciblée persistée → intérêt concierge → devis envoyé/accepté → mission générée → facture brouillon → facture émise et visible owner.
- Données : titre préfixé `[E2E]`, deux sessions isolées et APIs Supabase réelles ; la trace est conservée et clôturée plutôt que supprimée, conformément à la règle métier qui interdit la suppression après envoi.
- Résultat final : `1 passed` en 2,9 minutes (`e2e/owner-concierge-service-request.spec.ts`).
- Frontières validées : authentification, demande, devis, acceptation, mission, facture brouillon, émission concierge et lecture owner.
- Incident corrigé : compatibilité de création de mission entre le schéma moderne `title` et le schéma connecté `service_label`, avec rattachement au service catalogue.
- Paiement : checkout correctement bloqué avec `503` car `STRIPE_SECRET_KEY` est absente ; aucun paiement réel déclenché.
- Suite : configurer Stripe en mode test pour valider checkout + synchronisation, puis automatiser le parcours provider.
---

## Priorité de correction en cas d'échec
1. `P0` API 500/403 sur parcours critique.
2. `P0` perte de lien entre objets métier (demande/devis/mission).
3. `P1` incohérence d’état UI sans perte de donnée.
4. `P2` microcopie/ergonomie non bloquante.
### Exécution transactionnelle provider du 18/07/2026

- Scénario : concierge authentifiée → mission → affectation provider → `in_progress` → preuve persistée → `completed` → facture provider émise de 90 € → relecture filtrée par intervention → relecture concierge.
- Résultat final : `1 passed` en 4,0 minutes (`e2e/provider-intervention-transaction.spec.ts`).
- Incidents corrigés : validateur UUID incomplet sur la route d'affectation ; lecture de mission rendue compatible avec `title` et `service_label` via normalisation du schéma connecté.
- Facturation : route dédiée sécurisée et idempotente ; intervention terminée obligatoire, facture/ligne reliées par `provider_intervention_id`, lecture limitée au provider authentifié.
- Preuve média : JPEG téléversé dans le bucket privé `mission-evidence`, empreinte SHA-256 persistée et téléchargement provider validé par URL signée ; accès limité au provider affecté.
- Correctifs complémentaires : validation UUID réparée sur les routes de fichiers et sélection de mission rendue compatible avec le schéma connecté sans colonne `title`.
- Résultat enrichi : `1 passed` en 3,2 minutes avec la preuve média réelle.
- Suite : configurer Stripe test et ajouter ce scénario à la première exécution CI distante.

### Validation webhook de paiement du 18/07/2026

- Scénario enrichi : demande → devis → mission → facture émise → webhook `checkout.session.completed` signé → facture `paid` relue par le propriétaire.
- Sécurité : signature HMAC vérifiée sur le corps brut et rejet des signatures altérées ou âgées de plus de cinq minutes.
- Résultat : `1 passed` en 3,9 minutes sur Supabase réel (`e2e/owner-concierge-service-request.spec.ts`).
- Frontière restante : la création et l'ouverture de la session Checkout Stripe hébergée nécessitent encore une `STRIPE_SECRET_KEY` de test.
### Validation planification après paiement du 18/07/2026

- Scénario enrichi : facture `paid` → créneau défini par la concierge → mission `scheduled` → relecture du même instant par le propriétaire.
- Compatibilité : repli `missions.title` vers `service_label` appliqué aussi aux mises à jour de mission sur le schéma connecté.
- Résultat : `1 passed` en 3,3 minutes sur Supabase réel.
- Frontières restantes : Checkout Stripe hébergé, gestion des conflits de créneaux et capacité opérationnelle.

### Garde anti-chevauchement du 18/07/2026

- Une planification est refusée avec 409 lorsqu'elle chevauche une mission active du même logement ou du même membre d'équipe.
- Deux ressources différentes et les créneaux uniquement adjacents restent autorisés.
- Les dates invalides ou inversées sont refusées avant écriture.
- Tests dédiés : 2/2 PASS ; parcours commercial de non-régression : 1 passed en 3,6 minutes.
