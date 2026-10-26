# CONCIERGE-04B — Harnais PostgreSQL 17 isolé

Préparation CONCIERGE-04A-2 uniquement : aucun Docker, PostgreSQL, SQL ou nettoyage exécuté. Les contrôles statiques ne prouvent pas l’isolation dynamique. Aucun démarrage automatique.

## Plan sans effet

Depuis la racine : `node scripts/concierge-04b/run.mjs --plan` (même comportement sans argument). Le manifeste est vérifié par empreintes SHA-256 ; un changement de migration/proposition/actif exige une nouvelle revue et une actualisation explicite du manifeste. Aucun `.env`, export de schéma, configuration Supabase ou secret réel n’est lu. Les copies de `database/migrations` sont exclues.

Le plan affiche les outils, ressources, image attendue, isolation, ordre SQL, scénarios et nettoyage. Il ne vérifie ni l’existence de l’image ni la disponibilité du daemon.

Vérifications statiques sans Docker : `node --experimental-strip-types --test src/tests/concierge-postgres-harness.test.mjs src/tests/concierge-sql-static.test.mts`. La syntaxe JavaScript se vérifie avec `node --check` sur les trois modules et le test. ESLint est limité à ces quatre fichiers. Aucun TypeScript applicatif modifié ; aucun typecheck global nécessaire pour ce lot JavaScript/SQL.

## Conditions exactes avant lancement de CONCIERGE-04B

1. Autorisation explicite de l’utilisateur pour exécuter 04B, distincte de cette préparation.
2. Revue des scripts, SQL et manifeste ; branche et travaux Git préservés. Node 22.14 à 22.x et Docker CLI disponibles.
3. Image officielle PostgreSQL 17 **déjà présente localement**, identifiée par son ID complet `sha256:…` et approuvée. Aucun tag mutable, téléchargement, build ou pull de secours. Métadonnées PG_MAJOR/entrypoint contrôlées ; version réelle contrôlée par la fondation après démarrage. Aucune image n’a été inspectée pendant 04A-2.
4. Contexte Docker explicite dont l’endpoint est l’un des sockets locaux autorisés ; daemon Linux identifié par son ID exact, Swarm inactif. Le socket local validé est ensuite figé avec `--host`, pour qu’une modification ultérieure du contexte ne puisse pas rediriger les commandes. Revue locale préalable de ces identifiants dans le périmètre autorisé 04B. Tout endpoint distant/inconnu ou override d’environnement Docker/PG/Supabase/Node est refusé.
5. Espace/mémoire nécessaires : plafond conteneur 1 Go, données tmpfs 512 Mo. Aucun port, montage hôte, volume persistant, `.env`, secret réel ou autre conteneur requis.
6. Deux campagnes indépendantes : profil `fresh`, puis profil `existing`. La seconde reconstruit les 70 migrations historiques, injecte les données synthétiques, puis applique le correctif et les trois propositions. Elle ne copie aucune base habituelle. Empreintes des profils/missions/factures comparées avant/après cette fin de chaîne.

Commande future, **à ne pas exécuter pendant 04A-2** :

```text
node scripts/concierge-04b/run.mjs --execute --authorize=CONCIERGE-04B --context=<contexte-local> --daemon-id=<ID-approuvé> --image=sha256:<ID-image-approuvé> --profile=fresh
```

Répéter ensuite avec `--profile=existing`. Le drapeau est une confirmation explicite de l’opérateur ; il ne remplace pas l’autorisation conversationnelle. Le script ne propose aucun mode d’exécution sans ces paramètres.

## Architecture et ordre

- `plan.mjs` : fonctions pures de validation, manifeste, arguments fixes et plan.
- `run.mjs` : adaptation Docker, précontrôles, identité exclusive, Unix socket interne, délais, journal et nettoyage vérifié.
- `foundation.sql` : PostgreSQL 17 vierge ; rôles, `auth.uid()`, `auth.role()`, seule table `storage.buckets` référencée, ACL synthétiques et assertions.
- `manifest.json` : liste explicite des 70 migrations historiques, du correctif `20261026120000`, puis RLS 04A, 03B et 03C ; empreintes de chaque fichier et des actifs du harnais.
- `fixtures.sql` : deux propriétaires, trois concierges, zones distinctes déclarées, prestations du catalogue actuel, trois logements, deux demandes dont une sans date, trois devis, lignes distinctes Check-in/Check-out/ménage/linge, collaborations, mission et facture historiques. Aucune identité réelle ; emails `example.invalid`, points de démonstration, aucun géocodage.
- `preflight.sql` : arrêt sur doublons avant les quatre index, aucun nettoyage automatique.
- `permissions.sql` : rôle réel, absence de propriété/BYPASSRLS du client, séparation du serveur, droits des RPC et RLS.
- `scenarios.mjs` et `expired.sql` : scénarios SQL, connexions indépendantes et interruptions contrôlées.

Chaque fichier est appliqué par `psql -X --no-password -v ON_ERROR_STOP=1` ; première erreur = arrêt. Journal JSONL local dans un nouveau répertoire temporaire, plus `harness.migration_log` pour les seuls fichiers réussis. Une migration échouée peut avoir partiellement modifié **la base jetable uniquement** si elle ne contient pas de transaction ; aucun rattrapage silencieux. Délais : connexion/commande Docker 60 s, processus concurrent 30 s, SQL 15 s, verrou 3 s, transaction inactive 15 s, démarrage 45 s.

## Scénarios et portée des preuves futures

| Groupe | Préparation PostgreSQL | Limite explicite |
|---|---|---|
| A — ponctuel | Deux invitations/devis, RPC d’attribution unique, quatre interventions distinctes et lignes de facture, répétition | Les recettes SQL utilisent les contraintes réelles mais n’exécutent pas la recherche HTTP ni `acceptedQuoteWorkflow.ts`. |
| B — continu | Demande sans date, RPC, collaboration active, interventions avant/pendant préavis, notice figée, autre notice déjà expirée et historique conservé | Calcul contractuel, notification et statut projeté de l’API restent couverts par les tests applicatifs séparés, pas par une réimplémentation déclarée équivalente. |
| C — sécurité | Propriétaires/concierges/tiers/anonyme, demandes/destinataires, devis, attribution, missions, résiliation, factures, rôles/statuts, fausses GUC, FORCE RLS | Les résultats ne seront connus qu’après 04B. Un défaut réel doit faire échouer la campagne ; aucune politique n’est assouplie. |
| D — concurrence | Deux processus `psql` indépendants par course : devis concurrents, recette de finalisation répétée, intervention de même clé, résiliation simultanée ; PIDs journalisés | Vérifier le chevauchement/attente réelle pendant 04B ; le simple lancement parallèle ne prouve pas une contention. Compléter l’ordonnancement si nécessaire avant de conclure sur la concurrence. |
| E — reprise | Échec contrôlé après insertion dans une sous-transaction, interruption entre étapes déjà validées, répétition sans doublon | Ce sont des points de panne SQL contrôlés ; ni crash du serveur réel, ni panne réseau, ni compensation REST complète ne sont simulés. |

Les tests applicatifs existants `concierge-publication`, `concierge-commercial-api`, `concierge-operational-workflow` et `collaboration-termination` restent complémentaires. Ils ne sont pas lancés par ce harnais ; leurs doubles ne prouvent pas PostgreSQL. Le harnais ne doit jamais conclure « parcours utilisateur complet validé » sur ses seules recettes SQL.

## Nettoyage limité

Le nom et le label contiennent un UUID de campagne. Aucun conteneur préexistant n’est réutilisé. Seul l’ID complet renvoyé par **cette** création est mémorisé. Avant démarrage, SQL et suppression : contexte local, même daemon, ID, nom, image, labels et configuration sont revérifiés. Le `finally` ne supprime que cet ID avec `container rm --force`, jamais par préfixe, ni avec prune. Aucun drop de base externe, suppression de fichier projet, montage hôte ou volume habituel. Un refus de vérification laisse la ressource intacte et le journal signale son ID ; aucun nettoyage aveugle de secours. Les journaux temporaires sont conservés pour examen. Il n’existe pas de mode autonome acceptant un ID arbitraire à nettoyer.

## Différences et limites Supabase

Pas de PostgREST, GoTrue, API Storage, JWT signé, pooler, extension Supabase supplémentaire, réseau, serveur Next ou tâches différées. Les migrations inventoriées n’utilisent que `auth.uid`, `auth.role` et `storage.buckets` parmi ces objets ; une nouvelle dépendance nécessite revue. Les GUC d’identité sont des entrées synthétiques, jamais une preuve du véritable rôle SQL. Les clients se connectent comme `harness_client` (NOINHERIT/NOBYPASSRLS, non propriétaire) puis prennent le rôle réel authenticated/anon ; le client serveur séparé prend service_role. La connexion locale trust est confinée au socket interne de ce conteneur jetable, sans authentification réelle. Tout détenteur de Docker exec reste administrateur du conteneur : ce harnais n’est pas un bac à sable contre un administrateur malveillant.

Les ACL de départ sont explicites, synthétiques et établies **avant** les migrations : CRUD authenticated, SELECT anon, ALL service_role, séquences associées ; les révocations historiques ultérieures restent prioritaires. Ce modèle ne prouve pas les ACL du projet réel. Aucune donnée distante ou seed absent de `supabase/config.toml` n’est utilisé. Le rôle helper RLS dédié et ses droits doivent être contrôlés sur le vrai moteur.

Restent notamment à vérifier : reconstruction intégrale des migrations, privilèges des verrous concierge, contraintes historiques, types/nullabilité/défauts après migration, JSON invalides et rattachements modifiés par UPDATE, échéance exacte, concurrence réelle et cohérence logement/participants héritée du séjour. Les erreurs découvertes en 04B devront être rapportées, sans contournement automatique.
