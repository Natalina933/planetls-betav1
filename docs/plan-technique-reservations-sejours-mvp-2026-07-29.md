# Plan technique - reservations partagees et sejours MVP

Date : mercredi 29 juillet 2026

## 1. Objectif

Transformer la clarification metier `contrat -> reservation/sejour -> taches -> intervention` en trajectoire technique realiste, compatible avec le code actuel de PlanetLS.

Ce plan ne part pas d'une page blanche :

- le depot contient deja des routes `concierge/reservations` et `concierge/stays`
- il existe une page owner pour transmettre des sejours via `missions`
- il existe un moteur `missions`, `provider_interventions`, `workflow_events`, `quotes`, `invoices`

Le vrai besoin est donc une migration progressive hors du modele "tout est une mission".

## 2. Etat actuel du code

### 2.1 Ce qui existe deja

- `src/app/api/concierge/reservations/route.ts`
- `src/app/api/concierge/reservations/[id]/route.ts`
- `src/app/api/concierge/stays/route.ts`
- `src/app/dashboard/concierge/sejours/page.tsx`
- `src/app/dashboard/owner/missions/voyageurs/page.tsx`
- moteur `missions`
- moteur `provider_interventions`
- contrats `services_contracts`
- workflow `service_requests -> quotes -> mission -> invoice`

### 2.2 Limite actuelle

Le parcours sejour est actuellement reconstitue via :

- `missions`
- `mission.metadata`
- flags `reservation_workflow`, `reservation_workflow_id`, `mission_kind = traveler_stay`

Conséquence :

- le sejour n'est pas un objet canonique
- le planning partage n'a pas de racine metier propre
- les statuts sejour et les statuts mission sont melanges
- les jointures admin/KPI sont moins lisibles
- les artisans sont relies indirectement via `mission_id` ou `metadata`

## 3. Decision d'architecture

### 3.1 Objet canonique a introduire

Introduire une table canonique `public.reservations`.

Nom recommande cote base :

- `reservations`

Nom recommande cote UX :

- `Reservations`
- `Sejours`

Selon le contexte :

- proprietaire : "Reservations"
- conciergerie : "Sejours"

### 3.2 Positionnement des objets

- `services_contracts` ou equivalent signe = autorisation de collaboration
- `reservations` = objet racine partage
- `missions` = taches ou operations executables
- `provider_interventions` = execution artisan
- `workflow_events` = timeline transverse

## 4. Schema cible MVP 1

### 4.1 Nouvelle table `reservations`

Champs proposes :

```sql
id uuid primary key default gen_random_uuid()
contract_id uuid null references public.services_contracts(id) on delete set null
owner_profile_id uuid not null references public.profiles(id) on delete cascade
concierge_profile_id uuid not null references public.profiles(id) on delete cascade
property_id uuid null references public.properties(id) on delete set null
source text not null default 'manual'
external_reference text null
channel text null
traveler_first_name text null
traveler_last_name text null
traveler_phone text null
traveler_email text null
guest_count integer null
adults_count integer null
children_count integer null
infants_count integer null
pets_count integer null
check_in_at timestamptz not null
check_out_at timestamptz not null
arrival_time_window text null
departure_time_window text null
access_instructions text null
owner_notes text null
concierge_notes text null
status text not null default 'shared'
metadata jsonb not null default '{}'::jsonb
created_by_profile_id uuid null references public.profiles(id) on delete set null
acknowledged_at timestamptz null
completed_at timestamptz null
canceled_at timestamptz null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

### 4.2 Statuts reservation

```text
draft
shared
acknowledged
scheduled
in_stay
completed
canceled
```

### 4.3 Index minimum

```sql
idx_reservations_owner_profile_id
idx_reservations_concierge_profile_id
idx_reservations_property_id
idx_reservations_contract_id
idx_reservations_check_in_at
idx_reservations_check_out_at
idx_reservations_status
```

## 5. Extension du modele existant

### 5.1 Missions

Ne pas supprimer `missions`.

Ajouter a terme :

- `reservation_id uuid null references public.reservations(id) on delete set null`
- index `idx_missions_reservation_id`

Usage :

- une mission peut etre liee a une reservation
- une reservation peut avoir plusieurs missions

### 5.2 Provider interventions

Ne pas casser le modele actuel.

Ajouter a terme :

- `reservation_id uuid null references public.reservations(id) on delete set null`

Conserver aussi `mission_id` indirect via `metadata` pendant la transition si necessaire.

### 5.3 Workflow events

Ajouter a terme :

- `reservation_id uuid null references public.reservations(id) on delete cascade`

Cela permettra une timeline unique :

- reservation partagee
- accuse reception
- tache planifiee
- intervention demandee
- sejour termine

## 6. RLS cible

### 6.1 Lecture reservation

Peuvent lire une reservation :

- le proprietaire concerne
- la conciergerie concernee
- les admins
- plus tard, les membres d'equipe explicitement assignes

### 6.2 Ecriture reservation

Peuvent creer / modifier selon regles :

- le proprietaire createur
- la conciergerie rattachee pour les champs operationnels
- les admins

### 6.3 Regle cle

Une reservation ne peut etre creee que si la collaboration owner <-> concierge est legitime.

Verification recommandee :

- contrat actif dans `services_contracts`
- ou lien explicite de collaboration logement/profil deja valide

## 7. API MVP 1

### 7.1 API owner

`POST /api/owner/reservations`

Role :

- creer et partager une reservation avec une conciergerie

Payload minimum :

- concierge_profile_id
- property_id
- check_in_at
- check_out_at
- traveler_first_name
- traveler_last_name
- guest_count
- owner_notes

### 7.2 API owner list

`GET /api/owner/reservations`

Role :

- lister les reservations envoyees
- filtrer par logement, statut, periode, concierge

### 7.3 API concierge inbox

`GET /api/concierge/reservations`

Evolution recommandee :

- brancher progressivement la route existante sur la table `reservations`
- garder un fallback legacy pendant la migration

### 7.4 API detail / actions

`GET /api/reservations/:id`

`PATCH /api/reservations/:id`

Actions MVP 1 :

- acknowledge
- update_notes
- cancel

### 7.5 Planning

`GET /api/reservations/calendar`

Role :

- fournir un flux calendrier unifie pour owner et concierge

## 8. UI MVP 1

### 8.1 Espace proprietaire

Remplacer progressivement la logique "creer une mission voyageur" par :

- page "Reservations"
- formulaire de creation reservation
- selection logement
- selection conciergerie
- infos voyageur
- consignes
- recapitulatif

Reutilisation possible :

- parsing du module `owner/missions/voyageurs`
- structure de formulaire deja existante

### 8.2 Espace conciergerie

Faire evoluer la page `dashboard/concierge/sejours` pour qu'elle lise `reservations` comme source primaire.

Conserver les indicateurs operationnels :

- arrivals
- departures
- blockers
- incidents

### 8.3 Planning partage

Afficher dans le planning :

- reservations en bandeau principal
- missions liees en sous-couches
- interventions externes en badges secondaires

## 9. Strategie de migration

### 9.1 Phase technique A

Creer la table `reservations` sans casser l'existant.

Livrables :

- migration SQL
- types Supabase regen
- RLS
- CRUD minimal

### 9.2 Phase technique B

Brancher les nouvelles creations owner sur `reservations` au lieu de creer directement une mission `traveler_stay`.

Compatibilite temporaire :

- si besoin, creation automatique d'une mission de preparation derivee
- stockage du `reservation_id` dans `missions`

### 9.3 Phase technique C

Faire lire `concierge/reservations` et `concierge/stays` depuis `reservations`.

Fallback transitoire :

- continuer a supporter les anciens objets derives de `missions.metadata`

### 9.4 Phase technique D

Raccorder planning, interventions et admin :

- calendriers
- centre de controle admin
- overview KPI

## 10. Reutilisations conseillees

### 10.1 A reutiliser

- formulaire owner de saisie des sejours voyageurs
- page concierge `sejours`
- `provider_interventions`
- `workflow_events`
- moteur planning
- assignation equipe sur `missions`

### 10.2 A ne pas reutiliser comme source canonique

- `mission.metadata` comme stockage principal du sejour
- `mission_kind = traveler_stay` comme modele cible final
- `reservation_workflow` uniquement en metadata sans table dediee

## 11. MVP 1 exact recommande

Perimetre :

- contrat ou collaboration active requis
- creation reservation cote owner
- reception cote concierge
- apparition dans les deux plannings
- notes / consignes
- accuse de reception
- timeline de base

Hors perimetre MVP 1 :

- synchronisation channel manager
- automatisation complete des taches
- facturation additionnelle
- portail voyageur
- orchestration artisan complete

## 12. Risques et points d'attention

- ne pas casser les parcours existants bases sur `missions`
- eviter une double source de verite durable entre `missions` et `reservations`
- bien separer les statuts reservation et mission
- verifier les permissions owner/concierge sur les logements partages
- prevoir un script de migration des sejours legacy les plus utiles

## 13. Ordre de realisation recommande

1. migration `reservations` + RLS
2. types et helpers serveur
3. API owner create/list/detail
4. lecture concierge branchee sur `reservations`
5. planning partage
6. lien `missions.reservation_id`
7. lien `provider_interventions.reservation_id`
8. admin / KPI / dashboard health

## 14. Definition of done MVP 1

Le MVP 1 est termine si :

- un proprietaire avec collaboration active peut partager une reservation
- la conciergerie la voit immediatement
- la reservation apparait dans les deux plannings
- les consignes sont visibles des deux cotes
- la conciergerie peut accuser reception
- la timeline est tracee
- les tests API et UI critiques passent
