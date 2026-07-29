# Specification produit - reservations, sejours et operations partagees

Date : mercredi 29 juillet 2026

## 1. Intention

Apres signature d'un devis ou contrat entre un proprietaire et une conciergerie, PlanetLS doit permettre au proprietaire de transmettre ses reservations a la conciergerie dans un cadre structure, exploitable et tracable.

La reservation recue ne doit pas etre modelisee comme une simple mission. Le bon modele metier est :

- contrat actif entre proprietaire et conciergerie
- reservation ou sejour partage
- consignes et besoins attaches au sejour
- taches operationnelles a realiser
- interventions artisans si necessaire
- planning partage et preuves d'execution

## 2. Principe metier

Une reservation voyageur est un objet de coordination.

Elle porte :

- le logement concerne
- les dates du sejour
- les informations utiles sur le voyageur
- les attentes et consignes du proprietaire
- les services prevus par le contrat

Autour de cette reservation, la plateforme cree ou propose des elements operationnels :

- check-in
- check-out
- menage
- linge
- reapprovisionnement
- reception de meuble ou colis
- grand nettoyage
- maintenance
- intervention artisan

Conclusion metier : la reservation est le conteneur principal, les missions et interventions sont des objets d'execution lies a cette reservation.

## 3. Objets canoniques

### 3.1 Contrat de collaboration

Objet liant :

- un proprietaire
- une conciergerie
- un ou plusieurs logements
- un perimetre de services
- des conditions commerciales

Champs attendus :

- id
- owner_profile_id
- concierge_profile_id
- property_ids ou perimetre logement
- statut : draft, sent, signed, active, suspended, ended
- date_signature
- date_debut
- date_fin optionnelle
- services_inclus
- services_sur_demande
- regles de facturation
- SLA et contraintes
- metadata contractuelle

Role :

- autoriser le partage de reservations
- definir quels services sont automatiques ou optionnels
- encadrer la facturation et les responsabilites

### 3.2 Reservation / sejour

Objet principal partage entre proprietaire et conciergerie.

Champs attendus :

- id
- contract_id
- owner_profile_id
- concierge_profile_id
- property_id
- source : manuel, import, channel_manager, airbnb, booking, autre
- external_reference
- traveler_name
- traveler_phone
- traveler_email
- guest_count
- adults_count
- children_count
- infants_count
- pets_count
- check_in_date
- check_out_date
- arrival_time_window
- departure_time_window
- status : draft, shared, acknowledged, scheduled, in_stay, completed, canceled
- access_instructions
- stay_notes
- concierge_notes
- billing_notes
- metadata
- created_at
- updated_at

Role :

- apparaitre dans les deux espaces
- nourrir le planning
- servir de racine aux operations

### 3.3 Tache operationnelle concierge

Sous-objet relie a une reservation.

Exemples :

- preparer le logement
- accueil voyageur
- remise de cles
- menage inter-sejour
- gestion linge
- controle depart
- achat specifique
- reception meuble

Champs attendus :

- id
- reservation_id
- mission_id optionnel si on reutilise le moteur mission existant
- assigned_profile_id ou team_member_id
- type
- titre
- description
- due_start
- due_end
- priority
- status : pending, scheduled, in_progress, done, blocked, canceled
- checklist
- proof_required
- completion_notes
- metadata

### 3.4 Intervention artisan

Objet utilise quand une demande sort du perimetre standard concierge.

Exemples :

- plomberie
- electricite
- serrurerie
- gros nettoyage
- livraison et montage

Champs attendus :

- id
- reservation_id optionnel mais recommande
- mission_id optionnel
- provider_profile_id
- owner_profile_id
- concierge_profile_id
- service_label
- requested_by_profile_id
- budget_estimate
- status : requested, quoted, approved, scheduled, in_progress, completed, canceled
- scheduled_start
- scheduled_end
- proof_bundle
- invoice_id optionnelle
- metadata

## 4. Regles de gestion

### 4.1 Condition d'entree

Le partage de reservation est possible seulement si :

- un contrat actif existe entre le proprietaire et la conciergerie
- le logement est couvert par ce contrat ou rattache a cette collaboration

### 4.2 Effet d'une reservation partagee

Quand le proprietaire partage une reservation :

- la reservation est visible cote proprietaire et cote conciergerie
- elle apparait dans le planning des deux parties
- elle peut creer des taches automatiques selon le contrat
- elle peut proposer des services additionnels
- elle devient un point de suivi unique pour les consignes et preuves

### 4.3 Automatisations selon contrat

Exemples de comportement :

- menage standard inclus : tache creee automatiquement
- check-in autonome : tache informative seulement
- linge sur demande : proposition d'action a valider
- grand nettoyage hors forfait : demande additionnelle a approuver
- reception meuble : tache ponctuelle ou intervention selon nature

### 4.4 Difference entre reservation et mission

La reservation repond a la question : "quel sejour faut-il exploiter ?"

La mission ou tache repond a la question : "quelle action faut-il realiser ?"

L'intervention artisan repond a la question : "quel prestataire externe faut-il engager ?"

## 5. Parcours utilisateur

### 5.1 Parcours proprietaire

1. Le proprietaire dispose d'un contrat signe avec une conciergerie.
2. Il cree ou importe une reservation.
3. Il selectionne le logement et la conciergerie responsable.
4. Il renseigne les informations du voyageur et les dates.
5. Il ajoute les consignes utiles.
6. Il precise les besoins specifiques lies a ce sejour.
7. Il partage la reservation.
8. Il suit ensuite :
   - l'accuse de reception
   - les taches planifiees
   - les demandes additionnelles
   - les preuves d'execution

### 5.2 Parcours conciergerie

1. La conciergerie recoit une nouvelle reservation partagee.
2. Elle verifie les dates, le logement et le contenu.
3. Elle accuse reception ou demande clarification.
4. Elle planifie les taches internes.
5. Elle affecte un membre d'equipe ou declenche une intervention externe.
6. Elle centralise les preuves, incidents et compte rendu.
7. Elle cloture le sejour sur PlanetLS.

### 5.3 Parcours artisan

1. Un besoin externe est cree depuis une reservation ou une tache.
2. L'artisan recoit une intervention cadree.
3. Il confirme, devis, planifie ou decline.
4. Il realise l'intervention.
5. Il depose ses preuves et eventuellement sa facture.

## 6. Planning partage

Le planning doit afficher au minimum :

- les reservations
- les arrivees
- les departs
- les taches planifiees
- les interventions externes
- les conflits de charge ou de dates

Vues attendues :

- vue proprietaire : lecture simple, statut du sejour, consignes, progression
- vue conciergerie : vue operationnelle par jour, logement, equipe, urgence
- vue artisan : seulement les interventions qui le concernent

## 7. Statuts recommandes

### 7.1 Reservation

- draft
- shared
- acknowledged
- scheduled
- in_stay
- completed
- canceled

### 7.2 Tache concierge

- pending
- scheduled
- in_progress
- done
- blocked
- canceled

### 7.3 Intervention artisan

- requested
- quoted
- approved
- scheduled
- in_progress
- completed
- canceled

## 8. Surfaces produit a prevoir

### 8.1 Cote proprietaire

- page liste des reservations partagees
- creation / import de reservation
- detail reservation
- timeline des actions
- planning sejours
- panneau de consignes et demandes

### 8.2 Cote conciergerie

- inbox des reservations recues
- detail sejour operationnel
- generation et affectation des taches
- lien avec equipe, planning et maintenance
- panneau de demandes additionnelles a approuver

### 8.3 Cote admin

- suivi des collaborations actives
- volumetrie reservations partagees
- reservations non accusees
- sejours sans planification
- interventions bloquees

## 9. Architecture cible recommandee

Recommendation forte :

- ne pas forcer `missions` a porter a lui seul le role de reservation
- introduire un objet canonique `reservations` ou `stays`
- rattacher les missions, taches et interventions a cet objet

Schema logique :

- `contracts`
- `reservations`
- `reservation_tasks` ou reuse partiel du moteur `missions`
- `provider_interventions`
- `workflow_events`
- `invoices`

Compatibilite de transition possible :

- garder `missions` pour les actions executables
- stocker temporairement le lien `reservation_id` dans `metadata`
- migrer ensuite vers des colonnes explicites

## 10. Decoupage MVP recommande

### MVP 1

- contrat actif requis
- creation manuelle d'une reservation par le proprietaire
- partage a la conciergerie
- affichage dans les deux plannings
- consignes
- accuse de reception

### MVP 2

- generation de taches automatiques selon contrat
- affectation equipe
- checklist et preuves
- statuts complets du sejour

### MVP 3

- interventions artisans reliees au sejour
- demandes additionnelles
- facturation complementaire
- import externe ou synchronisation channel manager

## 11. Decisions produit proposees

- Une reservation n'est pas une mission.
- Un sejour est l'objet principal partage proprietaire <-> conciergerie.
- Les missions sont des actions rattachees au sejour.
- Les artisans interviennent via des interventions liees au sejour ou a une tache.
- Le planning doit afficher reservations, taches et interventions dans une lecture unifiee mais avec des natures distinctes.

## 12. Questions a trancher ensuite

- Faut-il nommer l'objet canonique `reservations`, `sejours` ou garder les deux avec une nuance front/back ?
- Le contrat doit-il etre un objet autonome visible par les utilisateurs, ou une extension du devis signe ?
- Les besoins additionnels hors contrat declenchent-ils une approbation obligatoire du proprietaire ?
- Le voyageur aura-t-il a terme un espace ou seulement une fiche operationnelle interne ?
- Quelle part des taches doit reutiliser le moteur `missions` existant plutot qu'un nouvel objet `reservation_tasks` ?

## 13. Prochaine etape recommandee

Transformer cette specification en plan d'implementation technique :

- schema de donnees cible
- migrations
- mapping avec les tables existantes
- contrats API
- priorisation MVP 1 / 2 / 3
