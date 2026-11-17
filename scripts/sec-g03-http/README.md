# SEC-G03-06 — Préparation HTTP/Auth/Storage

État : **PARTIEL, exécution bloquée**. Aucun service, compte ou objet réel créé.
Le commit applicatif de référence reste `661d690501b36e3b092167f8338415f7c60d9604`.
Cette préparation ne valide ni les quinze scénarios réels ni la compatibilité des images.

## Commandes permises pendant la préparation

```text
node scripts/sec-g03-http/run.mjs --plan
node --test scripts/sec-g03-http/check.test.mjs
```

La première commande lit uniquement les manifestes. La seconde exécute des tests
unitaires avec transports injectés en mémoire : aucun Docker, SQL, serveur Next,
connexion Auth ou Storage. `--execute`, `--cleanup`, `--prepare` et tout autre
argument sont refusés. Aucun `compose up` ni `supabase start/reset` n'est fourni.

## Fichiers et responsabilités

| Fichier | Rôle |
|---|---|
| manifest.json / plan.mjs | IDs d'images, commit, empreinte SQL, budget, ports, blocages, secrets générés en mémoire |
| assets.json | Inventaire fermé et empreintes SHA-256 de tous les autres actifs ; toute divergence refuse le mode plan |
| stack.mjs | Objet Compose proposé et configuration Kong, jamais matérialisés ni lancés |
| next-process.mjs | Environnement enfant en liste fermée, exclusion des `.env` avant lecture des blobs Git, commande Next sans shell |
| network-guard.mjs | Garde réseau expérimentale ; refus des autres destinations et redirections automatiques |
| fixtures.mjs | Descriptions des comptes et données ; UUID des profils liés aux UUID réellement fournis par GoTrue |
| client.mjs | Client HTTP local, vraie séquence CSRF/Credentials/session à exécuter ultérieurement |
| scenarios.mjs | Quinze critères et assertions programmées sur HTTP, PostgreSQL et Storage ; adaptateurs réels encore absents |
| lifecycle.mjs | Expurgation, événements JSONL, validation des identités et nettoyage par transport injecté |
| check.test.mjs | Contrôles unitaires sans service externe |

## Architecture et interfaces

Réseau Docker interne UUID exclusif ; base PostgreSQL Supabase neuve, GoTrue,
PostgREST, Storage fichier et Kong. Seule la gateway est publiée sur
`127.0.0.1:58431`. Next natif, dans une copie temporaire du commit approuvé,
écoute sur `127.0.0.1:58430`. Pas de bind mount des données existantes, volumes
persistants, réseau partagé, Studio, analytics, Realtime ou OAuth.

Les images ont été inspectées, pas exécutées :

| Service | Version locale | Interface/configuration proposée |
|---|---|---|
| PostgreSQL | Supabase 17.6.1.017 | 5432 interne ; entrypoint docker-entrypoint.sh ; commande postgres -D /etc/postgresql |
| Auth | GoTrue 2.186.0 | 9999 interne ; /health, /token, /admin/users ; supabase_auth_admin et schéma auth |
| REST | PostgREST 13.0.7 | 3000 interne ; authenticator, JWT, schémas public/storage, RPC C1A |
| Storage | 1.28.1 | 5000 interne ; PostgreSQL, PostgREST, schéma storage et backend fichier temporaire |
| Gateway | Kong 2.8.1 | 8000 interne ; /auth/v1, /rest/v1, /storage/v1 ; key-auth/ACL, administration désactivée |

IDs exacts et tailles `image inspect` dans le manifeste ; ces tailles ne sont
pas la consommation disque dédupliquée ni les tailles cumulées affichées par
`image ls`. L'inventaire fournit la présence et les métadonnées, pas une preuve
d'origine cryptographique ou de compatibilité.

Références d'interface : [compose Supabase officiel](https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml)
et [gateway officielle](https://github.com/supabase/supabase/blob/master/docker/volumes/api/kong.yml),
consultées le 17 novembre 2026. Ces références mouvantes utilisent des versions
plus récentes : elles ne sont pas une configuration compatible approuvée pour
les cinq images locales. Aucun code distant n'est importé ou exécuté.

### Blocages de configuration à résoudre avant un pilote exécutable

- Le bootstrap réel des rôles `authenticator`, `supabase_auth_admin`,
  `supabase_storage_admin`, `anon`, `authenticated`, `service_role`, leurs mots
  de passe/ACL et les schémas Auth/Storage n'est pas préparé/approuvé ici.
  **Ne jamais appliquer foundation.sql synthétique du harnais C1D.**
- Les chemins PGDATA et `/etc/postgresql`, l'initialisation sous cap_drop ALL,
  la racine read-only et les répertoires nécessaires aux migrations GoTrue et
  Storage doivent être validés. Aucun assouplissement automatique.
- Le fichier Kong généré en mémoire doit être injecté dans `/run/g03/kong.json`
  via une ressource temporaire exclusive en lecture seule ; ce raccordement
  n'existe pas. `buildStack` n'est donc pas une configuration démarrable.
- Pas de pilote Docker/migrations/copie Next, ni adaptateur réel SQL, Storage,
  observation des signatures ou barrières concurrentes. Leur contrat est
  explicite dans `runPreparedMatrix`; absence = refus avant HTTP.
- La garde réseau n'est pas encore éprouvée avec les workers Next/Undici.
  Certaines connexions IPC légitimes peuvent être refusées. Ajouter une
  exception exige une identification stricte, pas un fallback réseau.
- La copie Next doit extraire les blobs du commit approuvé sans lire `.env*`,
  puis vérifier les dépendances locales/lockfile et leur résolution hors dépôt.
  Ni copie ni jonction node_modules ni lancement réalisés.

## Ressources observées le 17 novembre 2026

Mesures non simultanées, à renouveler avant toute exécution :

- Docker : 8 CPU, 8 195 280 896 octets de RAM (~7,63 Gio).
- 32 mesures de conteneurs : ~4 858 Mio utilisés, CPU agrégé instantané ~29,7 %.
  Cette somme n'est pas une réservation ni une mesure de toute la VM WSL.
- Windows : 16 130 Mio au total, **795 Mio libres**, 8 processeurs logiques.
- C: : **8,9 Gio libres** sur 462,1 Gio.
- Ports candidats 58430/58431 absents des listeners TCP observés. Les autres
  piles occupent notamment 54321/54322, 55321/55322 et 55421/55422 : intouchables.

Budget proposé : limites Docker 3 584 Mio / 4 CPU, réserve Docker 512 Mio,
au moins 4 096 Mio Windows libres pour Next/tests/marge, 12 Gio disque libres.
Les conditions Docker, Windows et disque ne sont pas satisfaites. Aucune
suppression de fichier/conteneur ni augmentation de mémoire n'est autorisée
implicitement. CPU disponibles = capacité logique, pas garantie d'absence de charge.

## Séquence future et preuves attendues

1. Autorisation distincte, ressources suffisantes, ports réservés et IDs daemon/images
   revérifiés. Faire approuver le manifeste et `assets.json`, qui figent les
   fichiers de préparation actuels. Tout futur bootstrap/pilote exigera une
   nouvelle revue des différences et de nouvelles empreintes, jamais un
   recalcul destiné à masquer une divergence inconnue.
2. Créer reçu durable, réseau et conteneurs exclusifs ; vérifier labels, images,
   limites, ports et montages avant chaque action. Secrets hors logs, ACL
   Windows vérifiées, durée de vie bornée, arrêt contrôlé en cas d'interruption.
3. Bootstrap de la base neuve et services Auth/Storage ; healthchecks bornés.
   Valider propriétaires/ACL réels, puis les 73 migrations du manifeste et
   les invariants C1A. Première erreur : arrêt sans migration ignorée/corrigée.
4. Créer uniquement les comptes `example.invalid`, lier profils et identités,
   injecter les fixtures minimales et une preuve privée réelle. Pas de seed racine.
5. Copier Next sans `.env`, injecter uniquement les secrets de campagne ;
   vérifier les endpoints et les refus de sortie réseau avant lancement. Le
   verrou reste false ; son activation dans le processus de recette exigera
   une autorisation explicite et les prérequis SQL validés.
6. Exécuter la matrice réelle : sessions, autorisations, faux rattachements,
   suspension, preuves, révocation, rejeu, rollback, concurrence et liens signés.
   `observe()` doit comparer les lignes SQL et objets Storage ET observer les
   appels de signature : compter les objets seul ne prouve pas l'absence de lien.
   Tester aussi l'accès direct Storage/RLS par JWT client avant de conclure G03.
7. Les courses doivent démontrer l'ordre lecture/révocation/Storage et l'attente
   SQL via sessions distinctes. Mesurer les effets, ne pas prétendre une révocation
   atomique. Un lien déjà signé peut subsister 600 secondes. L'attente d'expiration
   doit céder la main et journaliser à intervalles inférieurs à 60 secondes.
8. Cleanup en finally, IDs exacts seulement : conteneurs, éventuels volumes exclusifs,
   réseau, processus Next enfant et copie temporaire vérifiée dans son parent.
   Aucun prune, compose down global, reset de pile existante ou suppression par nom
   approximatif. Identité incertaine : conserver le reçu et demander récupération.
   Les fonctions injectées de nettoyage ne prouvent pas un cleanup Docker réel.
9. Rapport expurgé conservé et Master Plan mis à jour après validation réelle.

Arrêt immédiat : identité/hash inconnu, image absente, dépendance non revue,
ressource insuffisante, mauvais endpoint, secret réel, échappement réseau,
anomalie SQL/Storage ou nettoyage incertain. Aucun correctif automatique.

Le pilote d'exécution et la durabilité des reçus restent à implémenter : le mode
plan ne les remplace pas. Aucune permission de lancement n'est déduite de ce README.
