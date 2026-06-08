# Audit parcours demande -> devis -> mission - Propriétaire / Concierge

_Date: 5 juin 2026_

## Objectif
Vérifier l'état réel du parcours métier entre propriétaire et concierge, depuis la recherche d'une conciergerie jusqu'au démarrage de la première mission après acceptation d'un devis.

Périmètre audité:
- recherche et sélection de concierges côté propriétaire;
- création et suivi des demandes de service;
- réception, qualification et préparation de devis côté concierge;
- comparaison, acceptation ou refus du devis côté propriétaire;
- création automatique de mission, facture brouillon, messages et rattachements métier;
- statuts, notifications, cohérence UX et données.

## Légende statut
- `fait`: livré et visible dans le code.
- `partiel`: présent mais incomplet, hétérogène ou reconstruit côté UI.
- `à faire`: manque fonctionnel ou qualité bloquante pour un parcours abouti.

---

## 1) Synthèse exécutive

### Niveau global
- `fait` - Le socle métier existe: demandes (`service_requests`), destinataires (`service_request_recipients`), devis (`quotes`), missions (`missions`), factures (`invoices`) et messagerie (`contact_conversations`, `contact_messages`).
- `fait` - Le flux principal est utilisable: recherche concierge -> short-list -> demande multi-destinataires -> qualification concierge -> devis -> comparaison owner -> acceptation -> mission + facture brouillon.
- `fait` - L'acceptation d'un devis déclenche déjà un workflow serveur (`finalizeAcceptedQuoteWorkflow`) qui crée ou rattache une mission, met à jour le devis, synchronise la demande et génère une facture brouillon si les lignes de devis existent.
- `fait` - La lecture métier dispose désormais d'un référentiel partagé (`commercialWorkflow`) exposé par les APIs avec `request_workflow_status`, `quote_workflow_status` et `mission_workflow_status`.
- `fait` - Les transitions clés disposent désormais d'un journal `workflow_events` typé, en complément des messages système et compteurs de conversations.
- `fait` - Le workflow métier est unifié côté référentiel partagé entre API et UI pour limiter les écarts entre "devis accepté", "partenariat actif", "mission créée" et "mission à planifier".

Conclusion: le parcours est plus avancé qu'un simple prototype, mais il doit être consolidé en workflow produit unique pour que l'utilisateur ne se demande jamais où il en est.

---

## 2) Parcours côté propriétaire

### Recherche et sélection
- `fait` - `/dashboard/owner/concierges` permet de filtrer par ville/code postal, rayon, catégories/services, type de logement, budget et profils PRO.
- `fait` - Le propriétaire peut sélectionner plusieurs concierges via une short-list (`selectedConciergeIds`) avant d'envoyer une demande.
- `fait` - Une demande envoyée à plusieurs concierges crée une ligne `service_requests`, plusieurs `service_request_recipients` et des conversations de suivi.
- `fait` - La zone géographique est persistée explicitement dans `service_requests` via `region` et `radius_km`, en plus de la ville et du code postal.
- `fait` - La date souhaitée existe côté API (`desired_date`) et le formulaire de short-list propriétaire la capture puis la transmet.

### Création de demande
- `fait` - La demande contient type (`ponctuel`, `renfort`, `durable`), titre, description, services, ville, code postal, urgence, budget et devise.
- `fait` - L'API valide les champs avec Zod et refuse une demande sans concierge valide.
- `fait` - La création depuis `/dashboard/owner/demandes` prépare désormais les critères et bascule vers `/dashboard/owner/concierges`; l'envoi réel reste conditionné à la sélection de conciergeries.
- `fait` - Le champ date souhaitée est ajouté dans le composeur de demande depuis la recherche, avec une microcopie indiquant qu'elle reste optionnelle.

### Suivi des demandes
- `fait` - `/dashboard/owner/demandes` affiche les statuts reconstruits: brouillon, en attente, consultée, en discussion, acceptée, refusée, expirée.
- `fait` - La page affiche des milestones: demande, devis reçus, devis accepté, missions voyageurs.
- `fait` - Le propriétaire voit les concierges destinataires, les réponses, les devis liés et le partenaire retenu.
- `fait` - Les statuts owner consomment en priorité le `request_workflow_status` serveur normalisé, les anciens calculs locaux ne servant plus que de fallback.
- `fait` - `/api/service-requests` remonte un workflow serveur normalisé (`workflow_status` / `request_workflow_status`) pour éviter que chaque page reconstruise sa propre lecture.

### Comparaison, acceptation et refus des devis
- `fait` - `/dashboard/owner/devis` charge les devis, les regroupe par demande/logement, compare jusqu'à 3 devis et affiche prix, lignes, validité, pack et PDF.
- `fait` - Le propriétaire peut refuser un devis avec motif optionnel.
- `fait` - Le propriétaire peut retenir un concierge depuis une demande, ce qui accepte le devis lié si présent.
- `fait` - Pour un devis sans demande liée, le propriétaire peut accepter directement le devis.
- `fait` - La notion "devis consulté" existe désormais comme événement persistant `quote_viewed` et trace dans `quotes.metadata` lors de l'ouverture du PDF.

### Après acceptation
- `fait` - Acceptation via `/api/quotes/[id]/status` ou `/api/service-requests/[id]/select`.
- `fait` - Création ou rattachement mission via `finalizeAcceptedQuoteWorkflow`.
- `fait` - Création d'une facture brouillon depuis les lignes du devis.
- `fait` - Mise à jour de la demande en `quote_accepted`, sélection du concierge, stockage structuré de `mission_id` et conservation des anciens pointeurs metadata en compatibilité.
- `fait` - Message de suivi sur le fil `quote`.
- `fait` - L'UI distingue mieux la mission commerciale créée/rattachée après acceptation et les séjours voyageurs opérationnels à transmettre ensuite.
- `fait` - Les libellés post-acceptation parlent désormais de "mission commerciale" et de "séjours voyageurs" au lieu de laisser croire qu'aucune mission n'a encore été créée.

---

## 3) Parcours côté concierge

### Réception et qualification
- `fait` - `/dashboard/concierge/demandes` charge `/api/service-requests?view=concierge`.
- `fait` - Les demandes reçues sont automatiquement marquées `viewed` à l'ouverture de la page.
- `fait` - Le concierge voit propriétaire, logement si disponible, localisation, budget, services, urgence, date souhaitée si renseignée.
- `fait` - CTA disponibles: ouvrir conversation, "je suis intéressée", préparer devis, refuser.
- `fait` - Le statut destinataire `information_requested` permet désormais une demande de précision structurée.
- `fait` - Le concierge peut proposer une date alternative structurée via `proposed_date` et le statut `date_proposed`.

### Devis
- `fait` - `prepare-quote` génère ou réutilise un devis brouillon depuis la demande.
- `fait` - Le devis reprend les services demandés et tente de préremplir les lignes depuis les tarifs/packs.
- `fait` - La préparation d'un brouillon de devis maintient le destinataire en discussion (`interested`) tant que le devis n'est pas envoyé.
- `fait` - Le statut `quoted` correspond désormais à un devis réellement envoyé côté synchronisation demande/destinataire.
- `fait` - Les devis brouillons ne sont plus affichés côté propriétaire comme propositions reçues.

### Après acceptation
- `fait` - Le concierge voit les demandes `selected` ou avec `mission_id` comme collaboration acceptée.
- `fait` - CTA vers devis/facturation et planning.
- `fait` - Les missions apparaissent dans `/dashboard/concierge/missions` et le planning via l'API missions.
- `fait` - La mission créée automatiquement passe désormais en `to_schedule` ou `date_requested` selon la présence d'une date souhaitée.
- `fait` - Le cycle de planification mission dispose désormais de statuts structurés: `to_schedule`, `date_requested`, `date_proposed`, `date_confirmed`, `scheduled`.
- `fait` - La fiche mission commune owner/concierge expose des CTA de planification: demander une date, proposer un créneau, confirmer la date et planifier.
- `fait` - Les changements de statut de planification alimentent le planning, `mission_events`, `workflow_events` et la conversation mission.

---

## 4) Modèle de données et statuts

### Demandes actuelles
- `fait` - `service_requests.status`: `draft`, `sent`, `in_review`, `quoted`, `accepted`, `closed`, `cancelled`.
- `fait` - `service_request_recipients.status`: `sent`, `viewed`, `interested`, `quoted`, `declined`, `selected`, `not_selected`.
- `fait` - Helper serveur `deriveServiceRequestStatus` consolide les statuts recipients.
- `fait` - Les statuts demandés dans le brief sont représentés: `received`, `information_requested`, `quote_accepted`, `quote_refused`, `expired`.

### Devis actuels
- `fait` - `quotes.status`: `draft`, `sent`, `accepted`, `rejected`, `expired`, `canceled`.
- `fait` - `quote_events` historise création, envoi, acceptation, refus, annulation et changement de statut.
- `fait` - Le `viewed` persistant existe via l'événement `quote_viewed` et les champs de consultation stockés dans `quotes.metadata`.

### Missions actuelles
- `fait` - `missions.status`: `draft`, `assigned` (legacy), `to_schedule`, `date_requested`, `date_proposed`, `date_confirmed`, `scheduled`, `accepted`, `in_progress`, `completed`, `canceled`.
- `fait` - `mission_events` historise les événements.
- `fait` - Les statuts métier dédiés à la planification sont ajoutés: `to_schedule`, `date_requested`, `date_proposed`, `date_confirmed`, `scheduled`.
- `fait` - Les états de planning sont désormais portés par `missions.status`; `scheduled_start` sert à stocker la date planifiée plutôt qu'à reconstruire seul le workflow.

### Workflow recommandé

#### Demande
- `draft`: demande commencée sans destinataire ou non envoyée.
- `sent`: demande envoyée aux concierges.
- `received`: au moins un destinataire créé; équivalent technique proche de `sent`, utile surtout pour audit/notification.
- `viewed`: au moins un concierge a ouvert la demande.
- `in_discussion`: au moins un concierge est intéressé ou échange.
- `information_requested`: un concierge demande une précision structurée.
- `quote_draft`: brouillon préparé côté concierge, non visible comme proposition finale owner.
- `quote_sent`: devis envoyé au propriétaire.
- `accepted`: un devis ou concierge est retenu.
- `declined`: tous les destinataires ont refusé ou aucun devis n'est retenu.
- `cancelled`: annulée par le propriétaire.
- `expired`: sans réponse ou devis valide après échéance.

#### Devis
- `draft`: en préparation.
- `sent`: envoyé.
- `viewed`: consulté par le propriétaire.
- `accepted`: accepté.
- `rejected`: refusé.
- `expired`: expiré.
- `canceled`: annulé par l'émetteur.

#### Mission
- `to_schedule`: mission créée sans date confirmée.
- `date_requested`: une date est demandée au propriétaire ou au concierge.
- `date_proposed`: une date alternative est proposée.
- `date_confirmed`: les deux parties ont confirmé.
- `scheduled`: planifiée.
- `in_progress`: en cours.
- `completed`: terminée.
- `canceled`: annulée.

---

## 5) Notifications et messages

### Présent
- `fait` - Création de conversations lors de l'envoi d'une demande.
- `fait` - Messages système lors d'une réponse concierge, d'un changement de statut devis et d'une création mission.
- `fait` - Compteurs de conversations non lues côté owner/concierge via `/api/messages/conversations`.
- `fait` - Badges de navigation sur demandes, messages, alertes, devis.
- `fait` - Les transitions critiques peuvent désormais être persistées dans `workflow_events`, en complément des conversations/messages.

### Manques
- `fait` - Créer un référentiel `workflow_events` typé pour distinguer message utilisateur, notification système, tâche à faire et audit trail.
- `fait` - Les événements sont écrits pour les transitions clés déjà centralisées: demande créée/envoyée, réponse concierge, brouillon devis préparé/actualisé, devis envoyé/accepté/refusé/consulté, mission créée, changement de statut mission, demande d'information et date proposée.
- `fait` - Les événements stockent un `action_href` exploitable par les timelines et centres de notifications.

---

## 6) Incohérences et risques

### P0 / P1 fonctionnels
1. `P0 traité` - Le statut `quoted` ne bascule plus lors de la simple préparation d'un brouillon de devis.
2. `P0 traité` - La date souhaitée est capturée dans le flux principal de recherche owner.
3. `P1 traité` - Les APIs exposent désormais des statuts normalisés `request_workflow_status`, `quote_workflow_status`, `mission_workflow_status`.
4. `P1 traité` - Les notifications importantes disposent d'un journal métier `workflow_events` et d'une API de lecture `/api/workflow-events`.
5. `P1 traité` - La mission créée automatiquement après acceptation et les séjours voyageurs sont mieux distingués dans les libellés owner.
6. `P1 traité` - Le statut "date à confirmer" est désormais gouverné par des transitions serveur dédiées côté mission.

### UX
- `fait` - Un composant `WorkflowTimeline` commun est visible sur les demandes, devis et missions.
- `fait` - Les CTA post-acceptation distinguent la mission commerciale et les séjours voyageurs à transmettre.
- `fait` - Les retours visuels post-action exposent désormais une `next_action` opérationnelle: vérifier/envoyer le devis, choisir/confirmer une date, transmettre les séjours ou comparer les autres devis.

### Technique
- `fait` - Les informations structurantes critiques ne reposent plus seulement sur `metadata`: `service_requests.mission_id`, `region`, `radius_km`, `service_request_recipients.proposed_date`, `quotes.service_request_id` et `quotes.service_request_recipient_id` sont persistés en colonnes dédiées, avec fallback metadata pour l'historique.
- `fait` - Le modèle SQL ajoute désormais `mission_id` à `service_requests` via une migration dédiée.
- `fait` - Ajouter tests d'intégration ciblés sur les transitions: brouillon devis -> envoyé -> accepté -> mission créée -> facture brouillon -> notifications.

---

## 7) Pages et composants à créer ou améliorer

### Owner
- `fait` - Ajouter date souhaitée dans `RequestPanel` et `OwnerConciergesPageClient`.
- `fait` - Sur `/dashboard/owner/demandes`, afficher un statut serveur normalisé + CTA unique "Comparer les devis", "Choisir une date", "Créer/voir la mission".
- `fait` - Sur `/dashboard/owner/devis`, l'ouverture du PDF marque le devis comme consulté via un événement persistant.
- `fait` - Sur `/dashboard/owner/missions/voyageurs`, clarifier le lien avec le devis accepté et la mission créée automatiquement.

### Concierge
- `fait` - Sur `/dashboard/concierge/demandes`, le brouillon est préparé côté demande et l'envoi réel reste porté par le module devis/facturation.
- `fait` - Ajouter une action "Demander une précision" avec message structuré et statut `information_requested`.
- `fait` - Ajouter une action "Proposer une date" avec champ structuré `proposed_date`.
- `fait` - Sur `/dashboard/concierge/planning`, afficher les missions issues de devis en `to_schedule` avec CTA "confirmer/planifier".

### Partagé
- `fait` - Créer un composant `WorkflowTimeline` commun demande/devis/mission.
- `fait` - Créer un helper serveur unique `commercialWorkflow` exposé dans les APIs.
- `fait` - Créer une table `workflow_events` et une API `/api/workflow-events` pour alimenter notifications, timeline et audit produit.

---

## 8) Règles métier recommandées

1. Une demande envoyée à plusieurs concierges reste active tant qu'au moins un destinataire est `sent`, `viewed`, `interested`, `quote_draft` ou `quote_sent`.
2. Un devis brouillon ne doit pas apparaître comme proposition reçue côté propriétaire tant qu'il n'est pas `sent`.
3. Un propriétaire ne peut accepter qu'un seul devis par demande; les autres destinataires passent `not_selected`.
4. Accepter un devis crée ou rattache une mission et fige les éléments contractuels: services, prix, devise, fréquence, logement, date si disponible.
5. Si aucune date n'est connue à l'acceptation, la mission passe `to_schedule` et génère une tâche visible pour les deux parties.
6. Si une date est proposée par une seule partie, la mission passe `date_proposed` ou `date_requested` jusqu'à confirmation.
7. Toute transition critique doit créer un événement métier: demande envoyée, consultée, réponse, devis envoyé, devis consulté, devis accepté/refusé, mission créée, date confirmée.
8. La messagerie reste le fil de discussion, mais ne doit pas être la seule source de vérité pour les statuts.

---

## 9) Plan d'implémentation recommandé

### Lot P0 - Clarté du parcours
1. `fait` - Ajouter `desired_date` dans le formulaire de demande depuis `/dashboard/owner/concierges`.
2. `fait` - Distinguer brouillon devis et devis envoyé dans `service_request_recipients`.
3. `fait` - Ne faire apparaître un devis côté owner comme "reçu" qu'après `quotes.status = sent`.
4. `fait` - Harmoniser les libellés post-acceptation: "partenariat accepté", "mission commerciale créée", "séjours voyageurs à transmettre".

### Lot P1 - Workflow serveur unique
1. `fait` - Ajouter un helper serveur unique qui retourne `request_workflow_status`, `quote_workflow_status`, `mission_workflow_status`.
2. `fait` - Exposer ces statuts dans `/api/service-requests`, `/api/quotes`, `/api/missions` et `/api/missions/[id]`.
3. `partiel` - Remplacer les calculs locaux redondants par le référentiel commun: les écrans consomment déjà `workflow_status`, il reste à nettoyer progressivement les fallbacks locaux.
4. `fait` - Ajouter des tests unitaires sur les transitions demande/devis/mission.

### Lot P1 - Notifications structurées
1. `fait` - Ajouter une table `workflow_events`.
2. `fait` - Écrire un événement à chaque transition critique centralisée: demande/devis/mission, consultation devis, demande d'information, date proposée et changement de statut mission.
3. `à faire` - Alimenter navbar, sidebar, alertes et timelines depuis ces événements.

### Lot P2 - Planification avancée
1. `fait` - Ajouter statuts mission `to_schedule`, `date_requested`, `date_proposed`, `date_confirmed`, `scheduled`.
2. `fait` - Ajouter CTA owner/concierge de confirmation de date.
3. `fait` - Synchroniser planning et messages à partir de ces statuts.

---

## 10) Références code auditées

- `src/app/dashboard/owner/concierges/OwnerConciergesPageClient.tsx`
- `src/app/dashboard/owner/demandes/page.tsx`
- `src/app/dashboard/owner/devis/page.tsx`
- `src/app/dashboard/owner/missions/voyageurs/page.tsx`
- `src/app/dashboard/concierge/demandes/page.tsx`
- `src/app/api/service-requests/route.ts`
- `src/app/api/service-requests/[id]/select/route.ts`
- `src/app/api/service-request-recipients/[id]/respond/route.ts`
- `src/app/api/service-request-recipients/[id]/prepare-quote/route.ts`
- `src/app/api/quotes/[id]/status/route.ts`
- `src/app/api/_shared/acceptedQuoteWorkflow.ts`
- `src/app/api/missions/route.ts`
- `src/server/service-requests/workflow.ts`
- `src/app/lib/requestStatus.ts`
- `src/features/service-requests/components/ServiceRequestCard/ServiceRequestCard.tsx`
- `database/migrations/20260307_service_requests_core.sql`
- `database/migrations/20260223_quotes_invoices_core.sql`
- `database/migrations/20260222_missions_core.sql`
- `database/migrations/20260223_contact_conversations_core.sql`

---

## 11) Journal d'avancement

### 05/06/2026 - Lot P0 clarté demande/devis
- `fait` - Ajout de la date souhaitée dans le composeur de demande propriétaire depuis `/dashboard/owner/concierges`.
- `fait` - Transmission de `desired_date` à `/api/service-requests` au lieu d'envoyer systématiquement `null`.
- `fait` - Un devis brouillon préparé depuis une demande maintient désormais la demande en discussion (`interested` / `in_review`) tant que le devis n'est pas envoyé.
- `fait` - Les devis `draft` ne sont plus exposés dans les listes propriétaire `/api/quotes` et dans l'hydratation owner de `/api/service-requests`.
- `fait` - L'envoi réel du devis via `/api/quotes/[id]/status` conserve la bascule existante vers `quoted` / proposition reçue.
- `fait` - Les libellés post-acceptation distinguent la mission commerciale créée/rattachée et les séjours voyageurs à transmettre.

### 05/06/2026 - Lot P1 workflow et événements
- `fait` - Création du référentiel `commercialWorkflow` pour dériver `request_workflow_status`, `quote_workflow_status` et `mission_workflow_status`.
- `fait` - Exposition des statuts workflow dans `/api/service-requests`, `/api/quotes`, `/api/missions` et `/api/missions/[id]`.
- `fait` - Ajout de la migration `workflow_events` et de l'API `/api/workflow-events`.
- `fait` - Écriture d'événements workflow sur les transitions principales: demande, réponse concierge, brouillon devis, statut devis, consultation devis, création/statut mission, demande d'information et date proposée.
- `fait` - Ajout de tests unitaires dédiés au référentiel commercial.

### 05/06/2026 - Lot P1 données de zone
- `fait` - Ajout des colonnes `region` et `radius_km` sur `service_requests`.
- `fait` - Transmission de la région et du rayon depuis le flux `/dashboard/owner/concierges` vers `/api/service-requests`.
- `fait` - Support de `region` et `radius_km` en création et modification de demande.

### 05/06/2026 - Lot P1 création directe owner
- `fait` - `/dashboard/owner/demandes` ne crée plus de brouillon orphelin lors d'une nouvelle recherche.
- `fait` - Les critères saisis sur `/dashboard/owner/demandes` préremplissent `/dashboard/owner/concierges` pour sélectionner les conciergeries puis envoyer la demande.

### 05/06/2026 - Lot P1 lecture statut owner
- `fait` - `/dashboard/owner/demandes` priorise le `request_workflow_status` exposé par `/api/service-requests`.
- `fait` - Les calculs locaux de statut owner restent disponibles uniquement comme fallback de compatibilité.

### 05/06/2026 - Lot P1 devis consulté
- `fait` - Ajout de `/api/quotes/[id]/view` pour persister la consultation d'un devis.
- `fait` - L'ouverture du PDF depuis `/dashboard/owner/devis` écrit un événement `quote_viewed`.
- `fait` - La consultation est aussi tracée dans `quotes.metadata` (`first_viewed_at`, `last_viewed_at`, `view_count`).

### 05/06/2026 - Lot P1 qualification concierge
- `fait` - Ajout du statut destinataire `information_requested`.
- `fait` - Ajout du statut destinataire `date_proposed` et du champ structuré `proposed_date`.
- `fait` - `/dashboard/concierge/demandes` expose les actions "Demander une précision" et "Proposer une date".

### 05/06/2026 - Lot P1 planification mission
- `fait` - Ajout des statuts mission `to_schedule`, `date_requested`, `date_proposed`, `date_confirmed`, `scheduled`.
- `fait` - Les missions créées automatiquement après acceptation de devis utilisent `to_schedule` ou `date_requested` au lieu de `assigned`.

### 06/06/2026 - Lot P2 planification avancée
- `fait` - La fiche mission owner/concierge ajoute les CTA "Demander une date", "Proposer ce créneau", "Confirmer la date" et "Planifier".
- `fait` - Les actions de planification passent par `PATCH /api/missions/[id]` avec `request_date`, `propose_date`, `confirm_date` et `schedule`.
- `fait` - Chaque transition de planification met à jour `missions.status`, crée un `mission_event`, crée un `workflow_event` et ajoute un message système dans la conversation mission.

### 06/06/2026 - Audit paiement et architecture composants
- `fait` - Ajout de l'audit `docs/audit-parcours-paiement-devis-mission-2026-06-06.md` pour couvrir le parcours devis accepte -> mission -> facture -> paiement -> solde/cloture.
- `fait` - Classement du paiement existant: facture brouillon, facture PDF, paiement Stripe facture, synchronisation Stripe et statut facture sont documentes comme faits ou partiels selon leur niveau de maturite.
- `fait` - Ajout de l'audit `docs/audit-architecture-composants-workflow-2026-06-06.md` pour imposer la reutilisation des composants existants avant toute creation.
- `fait` - Les composants a reutiliser, a ameliorer, les rares nouveaux composants acceptables, les fichiers a modifier et les doublons a surveiller sont documentes.

### 05/06/2026 - Lot P1 statuts brief
- `fait` - Ajout des statuts `received`, `information_requested`, `quote_accepted`, `quote_refused`, `expired` au modèle `service_requests`.
- `fait` - Mapping workflow serveur de ces statuts vers les lectures owner/concierge.
- `fait` - Les transitions devis acceptées/refusées synchronisent désormais la demande en `quote_accepted` / `quote_refused`.

### 05/06/2026 - Lot P1 rattachement mission
- `fait` - Ajout de `mission_id` dans `service_requests` via migration dédiée.

---

## Conclusion
Le parcours propriétaire -> concierge est déjà exploitable et couvre le coeur du besoin: recherche, demande multi-concierges, devis, comparaison, acceptation, mission et facture brouillon. Le principal chantier n'est pas d'inventer le flux, mais de le rendre incontestable: statuts plus précis, date structurée, notifications typées, et référentiel workflow unique entre serveur et UI.

Priorité suivante: brancher la navbar, la sidebar et les alertes produit sur `/api/workflow-events`, puis nettoyer progressivement les derniers fallbacks locaux.
