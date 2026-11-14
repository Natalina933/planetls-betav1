# Dépendances C1D et revue des divergences

## Ordre et périmètre

La fondation crée un cluster synthétique logique PostgreSQL 17 avec rôles/auth/
storage minimaux. Les 71 migrations antérieures sont reprises intégralement dans
l'ordre canonique; les deux fichiers C1A suivent, sans copie SQL réécrite. Aucun
fichier de `database/migrations` ni proposal concierge supplémentaire n'est inclus.

Ancres métier nécessaires, au sein de la chaîne complète:

- `20260219120000_bootstrap_legacy_core_schema.sql`: profils, propriétés, catalogue.
- `20260222120000_missions_core.sql`: missions et événements, UUID/FK de base.
- `20260223194000_quotes_invoices_core.sql`: factures historiques des fixtures.
- `20260301103000_provider_workspace_core.sql`: interventions et alertes.
- `20260307123000_harden_functions_and_mission_policies.sql`: RLS missions.
- `20260307153000_normalize_mission_profile_ids.sql`: identifiants normalisés.
- `20260404113000_harden_remaining_public_tables.sql`: politiques interventions.
- `20260510212500_consolidate_missions_columns.sql`: colonnes consolidées.
- `20260729153000_reservations_core.sql`: réservations/participants/propriétés.
- `20260729190000_link_missions_to_reservations.sql`: FK mission/réservation.
- `20260729193000_link_provider_interventions_to_reservations.sql`: FK intervention/réservation.
- `20260829150000_mission_checklist_items.sql`: dépendances de suppression.
- `20260829162000_provider_intervention_reports.sql`: rapports historiques.
- `20261016100000_profiles_authorization_guard.sql`: ancre propriétaire/contrôle des profils.
- `20261026120000_concierge_static_compatibility.sql`: migration 71, dépendances de triggers/statuts.
- `20261112120000_mission_provider_assignments.sql`: unicités, table, FK, triggers et ACL.
- `20261112121000_mission_provider_assignment_functions.sql`: RPC et contrôles de propriétaire.

Le manifeste énumère les autres migrations intermédiaires et leurs empreintes:
elles restent des dépendances de reconstruction, sans être présentées comme
toutes indispensables au seul objet C1A. Leur réussite n'est pas présumée.

## Analyse des cinq écarts

`divergences.json` conserve pour chaque fichier les deux SHA256 complets,
la référence Git locale, la transformation éventuelle et la conclusion.

| Migration | Version disponible et nature | Incidence |
|---|---|---|
| `20260222120000_missions_core.sql` | Blob local `0701ec99`, variante CRLF = empreinte historique; texte actuel normalisé identique | Fins de ligne uniquement, aucun SQL ni ordre modifié |
| `20260307110000_service_requests_core.sql` | Même preuve `0701ec99` et transformation déterministe CRLF | Fins de ligne uniquement |
| `20261005120000_service_request_stay_context.sql` | Même preuve `0701ec99` et transformation déterministe CRLF | Fins de ligne uniquement |
| `20261005130000_service_requests_stay_reservation_guard.sql` | Même preuve `0701ec99` et transformation déterministe CRLF | Fins de ligne uniquement |
| `20261026120000_concierge_static_compatibility.sql` | Ancien blob brut `16abc407` exactement correspondant; correctif actuel `c17c6ad0` | Changement fonctionnel expliqué; PostgreSQL reste non validé |

Le correctif c17c6ad0 ajoute un lock_timeout, un search_path et des verrous
exclusifs; inventorie les dépendances du statut; traite uniquement les triggers
attendus; restaure définition, état, OID et métadonnées, puis vérifie la
restauration. Les dépendances inconnues restent refusées. Le code n'est pas
remplacé par une ancienne version et aucune protection n'est désactivée pour
faire réussir la campagne. Cette explication ne certifie pas la correction SQL.

Recherche bornée à l'historique Git local des cinq chemins (`git log --all`, puis
lecture des blobs): références exactes d'empreintes retrouvées selon les
transformations documentées. Aucun fetch, aucune ancienne version inventée.
Le fichier historique de manifeste et tous les fichiers de référence restent
intacts. Les nouvelles empreintes sont liées à ces preuves, pas acceptées par
simple rafraîchissement.

## Refus et blocages

Chemin ajouté/retiré, ordre différent, hash modifié, actif inattendu ou divergence
non expliquée = refus avant toute commande Docker. Aucun skip automatique.
Le SHA256 de tout le manifeste doit être approuvé dans la future commande.

La 71e migration peut encore bloquer: aucune trace SQL complète de l'échec
antérieur n'a été retrouvée, aucun rejeu n'a été lancé. Le harnais doit en
conserver numéro, fichier et erreur verbose/SQLSTATE et laisser le reste NOT RUN.
Une erreur historique nécessite une mission séparée, jamais un correctif ou un
contournement automatique par ce harnais.
