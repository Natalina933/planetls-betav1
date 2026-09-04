# Journal de développement PlanetLS

Journal factuel des validations techniques reproductibles. Le [Master Plan](master-plan-planetls.md) reste la source officielle des statuts, priorités et décisions produit.

## 3 septembre 2026 - E2E local multi-rôle PLS-DEV-001

### Contexte

Après le report opérationnel de `PLS-SEC-003`, la priorité P1 `PLS-DEV-001` a été vérifiée sur une base Supabase locale fraîchement initialisée. Le bootstrap historique a été complété avec les colonnes de `profiles` attendues par l'application et les catégories minimales des fixtures locales.

### Résultats observés

- Owner : connexion, cockpit et API de recherche de conciergeries accessibles.
- Concierge : connexion, cockpit et API des demandes accessibles.
- Provider : connexion, cockpit et API clients accessibles.
- Admin : connexion, cockpit et API de synthèse accessibles.

### Cadre d'exécution

- Le scénario Playwright Chromium passe avec les quatre espaces de test.
- La base Supabase et le serveur Next utilisés sont locaux ; aucune commande n'a ciblé Supabase en ligne.
- Le tunnel complet d'inscription n'est pas couvert par cette validation.

### Suite

`PLS-DEV-001` reste `🟡 En cours`, `P1 Prioritaire`. Cette première validation multi-rôle précède désormais l'E2E d'inscription propriétaire documenté ci-dessous, puis la couverture des variantes restantes et des parcours legacy.

## 3 septembre 2026 - Inscription propriétaire locale PLS-DEV-001

### Contexte

Un scénario Playwright complète l'inscription d'un propriétaire sur la base Supabase locale. Le serveur de test est lancé avec `--e2e`, ce qui active uniquement hors production la fixture de ville `Paris` et évite tout appel au service externe de géocodage.

### Résultats observés

- Création du compte local : `POST /api/auth/register` retourne `201`.
- Connexion automatique credentials réussie.
- Redirection vers `/dashboard/owner` réussie.
- Profil relu après connexion : email de fixture, rôle `owner` et `onboarding_complete=true`.

### Cadre d'exécution

- La commande cible `http://127.0.0.1:3101` et les conteneurs Supabase locaux.
- Aucune commande ni donnée n'a ciblé Supabase en ligne.

### Suite

`PLS-DEV-001` reste `🟡 En cours`, `P1 Prioritaire`. Les variantes d'inscription concierge et artisan restent à couvrir avant les parcours legacy.

## 3 septembre 2026 - Validation locale PLS-SEC-003, photos de logement

### Contexte

Le test vérifie la confidentialité des photos de logement sur une base Supabase locale fraîche, avec Docker Desktop et des données de test locales. La procédure complète est disponible dans le [runbook du test local des photos de logement](runbooks/housing-photo-local-test.md).

### Résultats observés

- Visite anonyme refusée : `401`.
- Compte d'un autre tenant refusé : `403`.
- Propriétaire autorisé : `302` vers une URL signée.
- Accès public direct au Storage refusé.

### Cadre d'exécution

- Aucune modification n'a été effectuée sur Supabase en ligne.
- Le serveur PlanetLS temporaire a été arrêté après le test afin de libérer le port `3000`.
- Docker Desktop peut rester ouvert : il conserve l'environnement local disponible pour une nouvelle exécution.

### Suite

`PLS-SEC-003` reste `🟡 En cours`, `P0 Critique`. La validation finale nécessite une copie restaurable d'une base existante, avec sauvegarde, prévisualisation et rollback documentés.

## 4 septembre 2026 - Revalidation isolée PLS-SEC-003

### Résultats observés

- PlanetLS a été lancé sur `http://127.0.0.1:3102` avec le mode local isolé, sans arrêter le serveur de développement déjà ouvert.
- Les fixtures locales ont prouvé à nouveau : URL Storage publique refusée, anonyme `401`, tenant voisin `403`, propriétaire `302` vers une URL signée.
- Le lanceur `test:housing-photo:local` accepte maintenant une URL d'application locale distincte, ce qui rend le scénario reproductible sans conflit de port ou de verrou Next.

### Vérifications

- `npm run check:migrations` : PASS.
- Tests de contrat et garde-fous logement : PASS `6/6`.
- Test connecté des photos sur l'instance isolée : PASS `1/1`.

### Limite

La validation sur une copie anonymisée, restaurable et représentative d'une base existante reste nécessaire avant de clôturer `PLS-SEC-003`.

## 4 septembre 2026 - Validation staging PLS-SEC-003

### Cadre d'exécution

- Seul `planetls-staging` (`rhvyvpuqnsgrgacbwwqf`) a été modifié. `planetls-beta-v2` et `supabase-charcoal-ferry` sont restés hors périmètre.
- Les données créées sont exclusivement deux comptes de test, un logement fictif et une image de test. Aucun secret ni donnée personnelle n'est reproduit dans le journal.

### Résultats observés

- Les 61 migrations locales sont appliquées sur staging ; `housing-photos` est privé, limité à 8 Mo et aux formats autorisés.
- Le serveur PlanetLS local temporaire, connecté à staging, a confirmé : URL publique Storage refusée, `401` anonyme, `403` tenant voisin et `302` propriétaire vers une URL signée.
- Une sauvegarde de données `public` et la configuration de rollback du bucket ont été générées dans `supabase/.temp/`. Le bucket a été restauré dans son état privé final.

### Limite

La migration du 2 septembre ne peut pas être rejouée par `db push` une fois celle du 3 septembre déjà enregistrée. Cette validation de staging reste donc une preuve sur base vide puis synthétique, et ne permet pas de clôturer `PLS-SEC-003` sans copie anonymisée, restaurable et représentative d'une base existante.

## 4 septembre 2026 - Préparation historique locale PLS-SEC-003

### Résultats observés

- Les 59 migrations allant de `20260219120000` à `20260829162000` suffisent pour l'état antérieur : `housing` est présente dès la première et Storage est fourni par Supabase local.
- Un projet Docker isolé a été préparé dans `supabase/.temp/pls-sec-003-history/`, avec `project_id` et ports `553xx` distincts de l'instance locale habituelle.
- Le téléchargement de l'image PostgreSQL requise par la CLI est resté bloqué. Il a été interrompu avant toute création de conteneur, donnée ou migration de test.

### Limite

`PLS-SEC-003` reste `🟡 En cours`, `P0 Critique`. Aucun accès distant, aucune donnée réelle et aucun `migration repair` n'ont été utilisés. La validation historique reprendra seulement lorsque l'image Docker locale sera disponible.

## 4 septembre 2026 - Rollback historique local PLS-SEC-003

- Les 59 migrations historiques, les deux migrations de septembre et le test connecté `401/403/302` ont été validés sur Docker isolé avec seules fixtures fictives.
- Le rollback de schéma vers les 59 migrations a réussi par `supabase db reset --local` après retrait des copies temporaires.
- Limite : la sauvegarde `public` ne contient ni Auth ni Storage. Elle ne permet pas de restaurer complètement les fixtures ; `PLS-SEC-003` reste en cours.

## 4 septembre 2026 - Bilan de session PLS-SEC-003

- L'instance Docker isolée a validé les 59 migrations historiques, les deux migrations de septembre, la confidentialité Storage et le contrôle connecté `401/403/302` avec fixtures fictives.
- Les archives de volumes restent conservées comme preuves expérimentales. Leur restauration ne reconstitue pas tous les attributs internes Storage : le fichier existe mais Storage retourne `ENODATA`.
- Décision : ne plus utiliser la restauration brute du volume Storage comme preuve de rollback fonctionnel. La prochaine validation doit exporter et restaurer les objets fictifs via l'API locale avec manifeste SHA-256, puis rejouer rollback et seconde application.
- `PLS-SEC-003` reste `🟡 En cours`, `P0 Critique`. Aucun projet Supabase distant n'a été contacté.

## 4 septembre 2026 - Upgrade reproductible PLS-SEC-003 sur base locale existante

### Résultats observés

- La commande `npm run verify:housing-photo:upgrade:local` crée une sauvegarde locale des données `public` et une cible de rollback du bucket dans `supabase/.temp/`.
- La migration `20260902113000_private_housing_photos.sql` a été prévisualisée, appliquée sur les fixtures préexistantes, puis appliquée une seconde fois après restauration de l'état pré-migration du bucket.
- Le bucket final est privé et le test connecté sur l'instance isolée confirme à nouveau URL Storage publique refusée, `401` anonyme, `403` tenant voisin et `302` propriétaire.

### Limite

Cette preuve est reproductible sur une base locale avec données fictives, mais ne remplace toujours pas une copie anonymisée et restaurable d'une base existante réelle.
