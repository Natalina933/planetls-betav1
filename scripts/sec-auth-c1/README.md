# SEC-AUTH-C1D — Harnais préparé, jamais exécuté

Ce dossier prépare une validation PostgreSQL 17 isolée des deux migrations C1A.
Aucune preuve PostgreSQL, migration appliquée ou correction du P0 n'est revendiquée.
L'autorisation de préparation ne permet pas de lancer le harnais.

## Inventaire et dépendances

- `manifest.json` : liste fermée et empreintes binaires des 73 migrations canoniques
  dans l'ordre réel (71 historiques, puis 2 C1A) et de tous les actifs locaux.
- `divergences.json` : anciennes empreintes, empreintes présentes et preuves Git.
- `dependencies.md` : dépendances et analyse des changements historiques.
- `foundation.sql` : rôles et interfaces Supabase synthétiques, assertions SQL.
- `fixtures.sql` : identités, propriétés, réservations, missions, intervention
  autonome avec JSON forgé, rapport et facture historiques entièrement fictifs.
- `history.sql` : projection complète et ordonnée des lignes métier préexistantes.
- `permissions.sql` : propriétaires, attributs de rôles, six fonctions, RLS et ACL.
- `scenarios.mjs` : scénarios SQL et courses à sessions indépendantes.
- `plan.mjs` : manifeste, environnement filtré et règles de ressources exclusives.
- `run.mjs` : orchestrateur futur; sans argument, plan statique seulement.
- `transport.mjs` : appels asynchrones annulables et sessions psql interactives.
- `lifecycle.mjs` : verdicts, interruptions, diagnostics et reçu durable.
- `reliability-check.mjs` : simulations en mémoire, sans processus réel.
- `check.mjs` : contrôles statiques autorisés, sans transport Docker/SQL.

Node 22.14 à 22.x et modules natifs seulement; aucune installation. Pour une
future exécution: Docker CLI, daemon Linux local approuvé, image PostgreSQL 17
officielle déjà présente, identifiée par ID complet immuable. Aucun pull/build.
L'origine officielle de l'image doit être revue par l'opérateur: les seuls
champs PG_MAJOR/entrypoint ne prouvent pas cryptographiquement cette origine.

Les mécanismes d'isolation sont repris de `scripts/concierge-04b/` sans modifier
ni importer son orchestrateur ou son manifeste. Aucun SQL proposal concierge
supplémentaire n'est requis pour les FK/RPC C1A; les trois proposals historiques
ne font pas partie de cette campagne. Le rejeu reste volontairement complet:
la chaîne historique n'est pas supposée fonctionner, aucune migration sautée.

## Divergences et blocage historique

Quatre différences sont uniquement CRLF/LF. Le texte normalisé correspond à un
blob local du commit `0701ec99`; sa variante CRLF reproduit exactement l'ancienne
empreinte. Ce n'est pas une ancienne version binaire brute retrouvée dans Git.

La cinquième est fonctionnelle: le blob `16abc407` correspond exactement à
l'empreinte attendue de `20261026120000_concierge_static_compatibility.sql`.
Le commit `c17c6ad0` ajoute les verrous et la gestion contrôlée des dépendances
des triggers avant/après ALTER TYPE. Aucun ordre de migration n'est changé.
Le diff explique les nouvelles empreintes; il ne démontre aucune réussite SQL.
La migration 71 demeure un point d'arrêt potentiel. Aucun journal SQL complet
de son échec antérieur n'a été retrouvé dans les emplacements examinés.

Toute divergence inconnue doit être enregistrée dans `blockers`, jamais approuvée
par simple recalcul. Le manifeste et les actifs sont figés après revue. Toute
modification exige une nouvelle revue et une nouvelle approbation de son SHA256.

## Contrôles statiques uniquement

```text
node --check scripts/sec-auth-c1/plan.mjs
node --check scripts/sec-auth-c1/run.mjs
node --check scripts/sec-auth-c1/scenarios.mjs
node --check scripts/sec-auth-c1/check.mjs
node --check scripts/sec-auth-c1/transport.mjs
node --check scripts/sec-auth-c1/lifecycle.mjs
node --check scripts/sec-auth-c1/reliability-check.mjs
node scripts/sec-auth-c1/check.mjs
node scripts/sec-auth-c1/reliability-check.mjs
```

Ces commandes ne compilent pas PL/pgSQL. Elles contrôlent JSON, fichiers,
empreintes, références Git locales, encodage, contrats des fixtures et garde-fous.
Le mode plan ne vérifie ni l'image ni le daemon et n'autorise aucune exécution.

## Conditions d'isolation avant autorisation

1. Autorisation conversationnelle explicite de la campagne et de son nettoyage.
2. Approbation du manifeste exact, des divergences et des deux profils.
3. Contexte explicite, endpoint local autorisé, ID exact du daemon Linux,
   Swarm inactif. Socket figé par `--host`; endpoint distant/override refusé.
4. Image locale approuvée par ID `sha256:...`, PostgreSQL 17 vérifié réellement
   par la fondation. Si absente: BLOCKED, aucun téléchargement de secours.
5. Conteneur unique labellisé, réseau `none`, aucun port ou bind mount, aucune
   donnée Supabase, aucun volume persistant. Racine read-only, utilisateur
   postgres, capacités retirées, données/tmp/socket en tmpfs seulement.
6. Aucun `.env` ni secret réel. Identifiants synthétiques fixes confinés au test.
   Connexions socket internes: admin pour migrations, catalogue, assertions
   d'intégrité, injection de panne et deadlock synthétique; clients non
   propriétaires et sans BYPASSRLS pour les permissions, serveur RPC séparé.
7. Journaux temporaires autorisés. Nettoyage uniquement de l'ID retourné par
   cette création, après revérification daemon/labels/image/isolation. Identité
   inconnue: refus du nettoyage, journal conservé. Aucun prune ou autre conteneur.

Le harnais ne démarre jamais le moteur Docker. Un moteur arrêté bloque le test.
Les inspections de ressources préexistantes sont limitées au daemon/contexte et
à l'image approuvés; aucun conteneur préexistant n'est ciblé.

## Commande future — INTERDITE sans nouvelle autorisation

```text
node scripts/sec-auth-c1/run.mjs --execute --authorize=SEC-AUTH-C1D --context=<local> --daemon-id=<approuvé> --image=sha256:<ID-local-approuvé> --manifest-sha256=<SHA256-approuvé> --profile=fresh
```

Répéter avec `--profile=existing`, dans un nouveau conteneur. Les arguments ne
remplacent pas l'autorisation conversationnelle. Aucun mode skip/force/reuse.

## Scénarios préparés et critères

| Sujet | Exécution future et résultat attendu |
|---|---|
| Fresh | Fondation, 73 migrations, fixtures, permissions, scénarios; arrêt au premier échec |
| Existing | 71 migrations, fixtures, empreinte, 2 C1A, égalité exacte des données, scénarios |
| PL/pgSQL | Appels création/reprise/révocation, triggers et branches négatives; CREATE FUNCTION seul insuffisant |
| Identités | Propriétaire/prestataire/tiers/absent/suspendu/rétrogradé refusés comme attributaires; admin et super-admin actifs admis |
| Propriétaire SQL | Propriété hostile simulée puis contrôle refusé dans transaction annulée |
| ACL/RLS | Clients interdits, helpers privés, serveur sans DML direct, fausse GUC sans effet |
| Héritage/PUBLIC | Appartenance cliente à service_role et EXECUTE public inattendu détectés puis annulés |
| FK/unique | Intervention/prestataire liés, intervention unique, identités et ressources non transférables |
| Réservation | Propriétaire/logement incompatibles refusés, concierge modifiable, NULL non transformé en preuve |
| Autonomie | Mission sans réservation, intervention autonome supprimable, ressources sans affectation modifiables |
| Idempotence | Même clé: même intervention sans effets répétés; corps changé refusé |
| Révocation | Répétition identique admise, réactivation et replay créateur refusés, historique conservé |
| Suppressions | Mission/intervention/réservation/profil référencés protégés, suppression autonome annulée après assertion |
| Rollback | Panne SQL au dernier effet (alerte): compteurs ET contenu historique inchangés, reprise complète |
| Concurrence | Deux sessions persistantes distinctes; A crée sans commit, B attend A (pg_blocking_pids), puis COMMIT explicite; deux réponses et une affectation exigées |
| Timeout attendu | A conserve la transaction, B doit produire 55P03 sous lock_timeout 500 ms; rollback de A puis reprise complète |
| Deadlock/reprise | Deux sessions admin possèdent chacune un verrou; attente A→B observée avant demande B→A, 40P01 exigé, reprise ordonnée puis replay RPC |
| JSON forgé | UPDATE RETURNING exige une ligne et les valeurs exactes; commit dans base jetable, lecture admin confirme l'effet et l'absence de nouvelle provenance/droits; ACL et RPC clients revérifiés |
| Conservation | Rapport/facture historiques présents; données existantes intactes pendant C1A |

Les courses exigent une attente effectivement observée; deux processus lancés
ne suffisent pas. Les fenêtres de synchronisation sont bornées: overlap non
démontré ou timeout inattendu = FAIL, jamais PASS. Le deadlock synthétique teste
l'infrastructure de reprise, pas une preuve de deadlock intrinsèque aux RPC.

Il n'y a plus de pg_sleep pour synchroniser les recettes. Les sessions restent
ouvertes jusqu'à la barrière explicite. Délais SQL: statement 20 s, verrou 15 s,
transaction inactive 30 s; commande interactive 30 s, appel transport 60 s.
L'observateur vérifie la relation entre PIDs distincts pendant une fenêtre de
8 s; les appels Docker ont aussi leur propre plafond. Un daemon trop lent peut
faire échouer la recette, sans autoriser un faux PASS. L'usage réel des doubles
marqueurs psql echo/warn et les fenêtres doivent encore être validés sur l'image.

PASS uniquement après assertions exécutées. Première erreur de dépendance,
fondation, image ou migration = BLOCKED, scénarios suivants NOT RUN. Assertion
de sécurité ou SQL inattendu pendant les scénarios = FAIL. Le journal conserve
le numéro de migration, SQLSTATE verbose, résultat et stade; les migrations ne
sont marquées appliquées qu'après succès. Erreur de nettoyage = échec signalé.

## Verdict et diagnostic après C1D-FIX

Un inventaire individuel existe dès le début. Un scénario passe par RUNNING;
PASS n'est écrit qu'après ses assertions. Ceux qui ne sont pas atteints restent
NOT RUN. `existing-history` est explicitement non applicable au profil fresh.
Un seul verdict terminal contient le résultat SQL, le nettoyage et le global:

| SQL | Nettoyage | Global |
|---|---|---|
| PASS, tous les scénarios requis PASS | PASS | PASS |
| PASS | FAIL ou non effectué | FAIL |
| FAIL (dont perte d'intégrité après migration) | PASS ou FAIL | FAIL |
| BLOCKED (dépendance/manifeste/migration) | PASS ou NOT RUN | BLOCKED |
| BLOCKED | FAIL | FAIL |
| NOT RUN | NOT RUN | NOT RUN, hors refus de démarrage classé BLOCKED |
| N'importe lequel, interruption reçue | N'importe lequel | FAIL |

Le global n'est calculé qu'après nettoyage. Une panne de journalisation impose
FAIL même si le SQL et la suppression ont réussi. Les causes SQL et nettoyage
restent séparées, aucune erreur secondaire ne remplace la cause initiale.

Les erreurs psql conservent les stdout/stderr disponibles, code de sortie,
signal, SQLSTATE, message, DETAIL, HINT, CONTEXT et localisation/position lorsque
fournis, avec étape et migration. `expect_error` émet une NOTICE JSON avec les
diagnostics empilés, puis utilise RAISE sans remplacement pour l'inattendu.
Les deux pipes doivent atteindre leur marqueur avant validation d'une commande
interactive: une NOTICE tardive n'est pas omise. Dépassement de délai/taille:
échec explicite avec les sorties déjà reçues, sans prétendre capturer une sortie
jamais produite ou reçue. Le filtrage masque les formats usuels de credentials;
seules des entrées synthétiques sont admises, jamais une source réelle contenant
des secrets arbitraires. Aucune valeur d'environnement confidentielle n'est loggée.

## Interruptions et récupération manuelle

SIGINT/SIGTERM sont traités explicitement: plus de nouvelle étape, arrêt des
clients actifs, puis nettoyage vérifié de l'ID exact. Le nettoyage a son propre
chemin borné; un second signal ne provoque pas une suppression moins contrôlée.
Interrompre le client Docker ne prouve pas l'annulation immédiate d'une requête
serveur: la suppression de la ressource exclusive et le verdict FAIL restent
nécessaires. Aucun nettoyage automatique n'est garanti après SIGKILL, coupure,
crash du moteur ou du système.

Avant création: journal et reçu `creation-pending`; après réception de l'ID:
reçu `created` écrit AVANT démarrage du conteneur. Création exclusive, mode 0600,
fsync du fichier et remplacement atomique dans le même dossier. La durabilité
du répertoire et les ACL effectives Windows restent une limite hôte à vérifier.
Les journaux sont conservés; le reçu passe à `removed` après nettoyage confirmé.

Récupération, uniquement après nouvelle autorisation:

1. Conserver journal et `creation-receipt.json`; ne pas relancer une campagne
   dans cette ressource et ne pas chercher une cible à supprimer par préfixe.
2. Vérifier le manifeste approuvé, le contexte/socket local, le daemon, puis
   exclusivement l'ID complet du reçu; comparer nom exact, UUID/labels, image,
   réseau, ports, montages et utilisateur avec les mêmes garde-fous.
3. Si la ressource n'existe plus: constater son absence, ne pas en sélectionner
   une autre. Si les identités divergent: refuser toute suppression.
4. Si tout correspond et que la suppression a été explicitement autorisée:
   supprimer uniquement cet ID, puis conserver le résultat et l'absence constatée.
5. Si le reçu est encore `creation-pending` sans ID, ou endommagé: aucune
   suppression automatique/approximative. Faire établir l'ID et la provenance
   par une investigation séparément autorisée. Une coupure entre création
   moteur et réception de son ID ne peut pas être éliminée par ce harnais.

Les simulations testent les décisions et de faux enfants en mémoire. Elles ne
créent aucun reçu réel et ne prouvent aucun nettoyage Docker réussi.

## Limites

Tout est préparé et NON EXÉCUTÉ. Ni transport Docker ni SQL testé dans ce lot.
La fondation n'est pas Supabase: pas de GoTrue, PostgREST, JWT signé, Storage,
pooler, email ou notification distante. Les handlers encore permissifs ne sont
pas testés et le P0 demeure ouvert. Aucun C1B/C1C démarré.

Le profil existing est synthétique, pas une copie de production; il ne couvre
pas toutes les variantes historiques. Toutes les positions de panne, les courses
de suppression/suspension et les niveaux REPEATABLE READ/SERIALIZABLE ne sont
pas encore couverts par les recettes exécutables. Les compléter sous autorisation
si nécessaires avant toute conclusion globale de concurrence. Aucun correctif
de migration historique ou contournement de la migration 71 n'est inclus.
