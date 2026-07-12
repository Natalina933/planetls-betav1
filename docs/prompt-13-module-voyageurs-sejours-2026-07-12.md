# Prompt 13 - Module Voyageurs et sejours

Date: 2026-07-12

## Audit cible avant modification

### Pages existantes identifiees

- `src/app/dashboard/owner/missions/voyageurs/page.tsx` : centre proprietaire pour transmettre des sejours voyageurs et creer des missions avec `metadata.mission_kind = traveler_stay`.
- `src/app/dashboard/missions/MissionDetailClient.tsx` : detail mission avec bloc "pret voyageurs", booking source, guest name/count, checklist et alertes booking.
- `src/app/dashboard/concierge/maintenance/*` : workflow incident -> artisan -> devis -> mission -> facture cree au sprint precedent.
- `src/app/dashboard/concierge/planning` et `src/components/dashboard/calendar/DashboardCalendar.tsx` : calendrier reutilisable pour evenements booking/mission/reminder.
- `src/app/dashboard/notifications/page.tsx` et pages messages : bases de notifications/conversations deja presentes.

### Services et APIs reutilises

- `src/app/lib/reservationPlanningEngine.ts` : moteur reservation -> menage -> controle -> accueil -> check-in -> check-out -> maintenance -> facturation.
- `src/app/api/concierge/reservations/route.ts` : creation et lecture des workflows de reservation depuis `missions.metadata`.
- `src/app/api/concierge/reservations/[id]/route.ts` : actions move/delete/replan/assign/follow sur les etapes de reservation.
- `src/app/api/missions/route.ts` : lecture des missions par role et creation avec metadata.
- `mission_events`, `contact_conversations`, `contact_messages` : historique, trace et notifications conversationnelles deja disponibles.

### Composants UI reutilises

- `DashboardOperationalPage` pour le shell dashboard.
- `AsyncState` pour loading, empty et error states.
- Navigation dashboard existante dans `sidebarconfig.tsx`.
- Command center dashboard existant dans `DashboardCommandCenter.tsx`.
- IcÃ´nes `lucide-react` deja utilisees par le dashboard.

### Types et modeles Supabase existants

- Types Supabase: `src/types/supabase.ts`, `src/types/supabase.generated.ts`.
- Tables exploitees indirectement: `missions`, `mission_events`, `invoices`, `contact_conversations`, `contact_messages`.
- Migrations pertinentes: `missions_core`, `add_missions_metadata`, `workflow_events_core`, `mission_planning_statuses`, `optimized_routes`.

## Livrables implementes

### Nouveau service metier

- `src/app/lib/travelerStayCenter.ts`
  - Statuts centralises `TRAVELER_STAY_STATUSES`.
  - Preparation d'arrivee avec blockers critiques.
  - Depart/check-out avec prochaine action.
  - KPI dashboard voyageurs.
  - Garde-fou: impossible de considerer un sejour pret avec blocages critiques, sauf override trace avec raison.
  - Profil voyageur volontairement operationnel: pas de score, pas de categorie sensible.

### API dediee ajoutee

- `src/app/api/concierge/stays/route.ts`
  - `GET /api/concierge/stays` agrege les missions Supabase, regroupe les workflows reservation et retourne `{ stays, dashboard }`.
  - `PATCH /api/concierge/stays` met a jour les metadata operationnelles d'un sejour: confirmation horaire, acces pret, linge/consommables, equipements, depart, override trace.
  - Chaque action PATCH ecrit un evenement `mission_events` pour garder une trace d'audit.
  - Acces limite aux roles `admin`, `super_admin`, `concierge`, `concierge_pro`.

### Mapping partage

- `src/app/lib/travelerStaySupabase.ts`
  - Mapping mutualise `missions/workflows -> TravelerStayInput`.
  - Detection des missions voyageurs autonomes.
  - Deduplication par reservation/sejour.
  - Utilise par la page et par la route API pour eviter une divergence client/serveur.
### Nouvelle page concierge

- `src/app/dashboard/concierge/sejours/page.tsx`
- `src/app/dashboard/concierge/sejours/page.module.scss`

Fonctionnalites:

- KPI: aujourd'hui, arrivees, departs, blocages, incidents.
- Lecture Supabase via APIs existantes:
  - `/api/concierge/reservations?limit=160`
  - `/api/missions?scope=concierge&limit=160`
- Fusion/deduplication des workflows et missions.
- Recherche par voyageur, logement, canal, proprietaire.
- Filtres: tous, aujourd'hui, arrivees, departs, en cours, infos manquantes, incidents.
- Table desktop.
- Cartes mobiles dediees.
- Detail sejour:
  - synthese,
  - preparation arrivee,
  - depart,
  - historique voyageur,
  - actions vers missions, messages, maintenance.

### Navigation

- Ajout dans la sidebar concierge: `/dashboard/concierge/sejours`.
- Ajout dans le command center: route "Voyageurs et sejours" et action rapide "Preparer un sejour".

### Tests

- `src/tests/traveler-stay-center.test.mts`
  - normalisation des statuts,
  - blocages preparation,
  - override trace,
  - KPI arrivees/departs/incidents,
  - absence de scoring voyageur.
- `src/tests/traveler-stay-supabase.test.mts`
  - mapping workflow reservation vers sejour,
  - detection de missions voyageurs autonomes,
  - deduplication workflow/mission.

## Composants a reutiliser ensuite

- `travelerStayCenter.ts` pour dashboard concierge, planning, notifications et mobile.
- `reservationPlanningEngine.ts` pour continuer a generer les missions depuis une reservation.
- `DashboardCalendar` pour vue calendrier voyageurs.
- `MissionDetailClient` pour le detail riche mission.
- `AsyncState` pour tous les etats asynchrones.

## Composants a fusionner ou mutualiser

- Fusion future recommandee entre:
  - la logique parsing sejours de `owner/missions/voyageurs/page.tsx`,
  - le mapping de metadata de `concierge/sejours/page.tsx`,
  - le moteur `reservationPlanningEngine.ts`.
- Extraire un composant commun `StayStatusBadge`.
- Extraire un composant commun `StayWorkflowChecklist`.
- Extraire les helpers metadata voyageurs dans `src/app/lib`.

## Duplications detectees

- Plusieurs zones lisent `guest_name`, `traveler_name`, `guest_count`, `booking_source` avec des fallbacks locaux.
- Les statuts mission/reservation/sejour sont encore partiellement disperses.
- Les checklists "pret voyageurs" existent dans le detail mission et dans le nouveau centre sejours.

## Inutilises ou a surveiller

- Pas de suppression realisee pendant ce sprint.
- Les anciennes pages voyageurs proprietaire restent utiles pour la transmission cote owner.
- Certaines routes ciblees par navigation peuvent encore etre des pages en construction selon le role.

## Supabase et RLS

Aucune migration destructive n'a ete appliquee dans ce sprint. Le module s'appuie sur les tables existantes et sur `missions.metadata` pour rester compatible avec la base actuelle.

Migration cible recommandee pour un sprint ulterieur:

```sql
create table traveler_profiles (
  id uuid primary key default gen_random_uuid(),
  concierge_profile_id uuid not null references profiles(id),
  display_name text not null,
  email text,
  phone text,
  language text,
  previous_stays integer default 0,
  operational_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table traveler_stays (
  id uuid primary key default gen_random_uuid(),
  reservation_workflow_id text,
  concierge_profile_id uuid not null references profiles(id),
  owner_profile_id uuid references profiles(id),
  property_id uuid,
  traveler_profile_id uuid references traveler_profiles(id),
  status text not null,
  check_in timestamptz,
  check_out timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

RLS cible:

- concierge/admin: lecture/ecriture sur les sejours de leur workspace.
- collaborateur: lecture/ecriture selon attribution mission ou permission explicite.
- owner: lecture limitee aux sejours de ses logements, sans donnees voyageur inutiles.
- provider/artisan: lecture minimale des informations necessaires a l'intervention.

## UX/UI

Ameliorations effectuees:

- Vue "journee concierge" orientee arrivees/departs.
- Blocages critiques visibles sans masquer l'avancement.
- Experience mobile distincte par cartes actionnables.
- Etats loading/empty/error reutilisant `AsyncState`.

Incoherences restantes:

- Certains libelles historiques contiennent encore du mojibake dans le command center.
- Les pages owner et concierge n'ont pas encore le meme composant de detail sejour.
- Les actions de preparation ne modifient pas encore les metadata depuis la page sejours.

## Performance

- Chargement parallele reservations + missions.
- Deduplication client simple par identifiant reservation.
- Calculs KPI memoises.

Optimisations futures:

- API dediee `/api/concierge/stays` avec aggregation serveur.
- Pagination et index Supabase sur `metadata.reservation_workflow_id`, `scheduled_start`, `concierge_profile_id`.
- Cache court cote serveur pour les KPI du jour.

## Accessibilite

- Etats asynchrones avec `role=status` / `role=alert` via `AsyncState`.
- Filtres sous forme de boutons explicites.
- Table desktop lisible et cartes mobiles larges.

Ameliorations futures:

- Rendre chaque ligne table activable clavier avec bouton interne.
- Ajouter libelles ARIA plus detailles aux barres de progression.
- Ajouter focus states visuels specifiques aux cartes mobiles.

## Limites connues

- Pas d'integration reelle Airbnb, Booking ou Abritel ajoutee.
- Pas de stockage de donnees sensibles ou scoring voyageur.
- La page consolide les donnees existantes, mais ne persiste pas encore les champs de preparation depuis l'interface.
- Le modele dedie `traveler_stays` est documente mais non migre pour eviter de casser les types Supabase existants.

## Prochaines etapes

1. Creer l'API serveur `/api/concierge/stays`.
2. Ajouter mutations: confirmer horaire, valider acces, valider linge, tracer override, ouvrir incident.
3. Extraire les composants `StayStatusBadge` et `StayWorkflowChecklist`.
4. Brancher les notifications automatiques sur arrivees/departs/blocages.
5. Ajouter la vue calendrier voyageurs basee sur `DashboardCalendar`.

