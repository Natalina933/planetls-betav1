# Audit complet parcours metier proprietaire concierge - 06/06/2026

## Objectif
Obtenir une plateforme metier professionnelle pour la location courte duree, couvrant:

Demande -> Reponse -> Devis -> Acceptation -> Mission -> Realisation -> Paiement -> Facturation -> Historique.

Regle d'architecture: reutiliser les composants, helpers et pages existants avant toute creation. Les nouveaux composants doivent etre rares, transverses et justifies.

Audits relies:
- `docs/audit-parcours-demande-devis-mission-2026-06-05.md`
- `docs/audit-parcours-paiement-devis-mission-2026-06-06.md`
- `docs/audit-architecture-composants-workflow-2026-06-06.md`

---

## 1) Etat des lieux global

### Parcours recherche et demande
- `fait` - Recherche de concierges avec filtres ville, region, services, logement, budget, rayon, disponibilite/pro.
- `fait` - Selection de plusieurs concierges et envoi d'une meme demande multi-destinataires.
- `fait` - Les demandes sont persistantes dans `service_requests` et `service_request_recipients`.
- `partiel` - Les filtres notes, experience et departement existent partiellement selon les donnees disponibles, mais ne sont pas encore tous exposes comme criteres metier homogenes.

### Objectif principal et type de collaboration
- `fait` - Un referentiel `serviceRequestBrief` existe pour objectif principal, type de collaboration, frequence, responsabilite, logement structure, synthese et informations manquantes.
- `fait` - Le formulaire owner expose ces choix, adapte le type de collaboration/frequence/responsabilite selon l'objectif, et persiste les donnees via `/api/service-requests`.
- `fait` - La suite du formulaire est adaptee selon l'objectif choisi via `getServiceRequestBriefDefaults` et `getServiceRequestBriefFormGuidance`.
- `fait` - Tests UX A a E ajoutes dans `src/tests/service-request-brief.test.mts`.

### Formulation du besoin
- `fait` - Titre, description, ville, code postal, services, budget, urgence et date souhaitee existent.
- `fait` - Le logement concerne, adresse/repere, type de logement, couchages et contraintes sont structures dans le flux de demande et repris dans la synthese.
- `fait` - Une synthese automatique complete est affichee avant envoi dans `RequestPanel`, persistee et affichee cote concierge.

### Parcours concierge
- `fait` - Le concierge voit les demandes recues.
- `fait` - Le concierge peut indiquer son interet, refuser, demander une precision, proposer une date et preparer un devis.
- `fait` - Les demandes recues utilisent `ServiceRequestCard` et `WorkflowTimeline`.
- `fait` - Les informations objectif/collaboration/frequence, proposition attendue et informations manquantes sont visibles dans chaque carte concierge via `ServiceRequestCard`.

### Gestion des dates
- `fait` - `desired_date`, `proposed_date` et les statuts `date_requested`, `date_proposed`, `date_confirmed`, `scheduled` existent.
- `fait` - La fiche mission expose les CTA demander/proposer/confirmer/planifier une date.
- `partiel` - Refuser une date et proposer une autre date cote proprietaire doivent encore etre mieux structures.

### Devis
- `fait` - Le concierge peut preparer un devis depuis une demande.
- `fait` - Les tarifs et packs sont reutilises par `TariffBillingDesk`.
- `fait` - Le proprietaire peut consulter, comparer, accepter ou refuser les devis.
- `fait` - Le devis accepte devient la reference de la mission.
- `partiel` - Demander des precisions depuis un devis owner reste encore surtout porte par la conversation.

### Creation automatique de mission
- `fait` - L'acceptation d'un devis cree ou rattache une mission.
- `fait` - La mission recupere proprietaire, concierge, montant, devise, logement/date quand disponibles et metadata contractuelles.
- `fait` - Une facture brouillon est generee depuis les lignes du devis accepte.
- `partiel` - La frequence et certains commentaires/contraintes doivent etre mieux figes comme elements contractuels.

### Planning et organisation
- `fait` - Les missions issues de devis apparaissent dans les parcours mission/planning.
- `fait` - Les statuts de planification existent.
- `partiel` - Les conflits de planning ne sont pas encore un controle metier complet.

### Paiement
- `fait` - Paiement facture Stripe Checkout existe cote proprietaire.
- `fait` - Synchronisation Stripe et webhook existent pour facture payee.
- `fait` - Statuts facture `draft`, `issued`, `partially_paid`, `paid`, `overdue`, `canceled`.
- `fait` - Paiement manuel recu est disponible cote concierge dans `TariffBillingDesk` via la route statut facture.
- `partiel` - Acompte et solde disposent d'un helper metier `paymentWorkflow`, mais le plan de paiement n'est pas encore integre au devis/facture et le paiement recurrent reste a faire.

### Facturation et documents
- `fait` - Devis PDF et facture/recu PDF sont disponibles.
- `fait` - Documents accessibles dans les espaces owner.
- `partiel` - Archivage transversal demande/devis/mission/paiement a renforcer via historique commun.

### Messagerie
- `fait` - Conversations liees aux demandes avec messages systeme.
- `fait` - La messagerie reste le fil de discussion.
- `partiel` - Les messages ne doivent pas remplacer les statuts: il faut continuer a privilegier `workflow_events`, `mission_events`, `invoice_events`.

### Notifications
- `fait` - `workflow_events` existe pour les transitions principales demande/devis/mission.
- `partiel` - Navbar, sidebar, alertes et timelines ne sont pas encore toutes alimentees par ces evenements.
- `partiel` - Notifications paiement ajoutees dans `workflow_events` pour facture disponible, paiement recu, paiement partiel et paiement en retard; acompte demande/paye et solde paye restent a relier au futur plan de paiement.

---

## 2) Composants existants a reutiliser

- UI: `Button`, `ButtonLink`, `Input`, `Select`, `Textarea`, `Checkbox`, `Badge`, `Tag`, `Card`, `Loader`.
- Etats et layout: `EmptyState`, `OwnerWorkspacePage`, `ConciergeWorkspacePage`, `DashboardPanel`, `SectionHeader`.
- Workflow: `RequestStatusBadge`, `WorkflowStatusBadge`, `ServiceRequestCard`, `WorkflowTimeline`.
- Owner: `OwnerRequestSummaryCard`, `OwnerQuoteResponseCard`, `OwnerQuotesComparisonTable`.
- Concierge/facturation: `TariffBillingDesk`.

Decision: ne pas creer de nouvelle carte demande/devis/mission. Etendre les composants existants ou alimenter leurs props.

---

## 3) Composants a ameliorer

- `ServiceRequestCard`: ajouter objectif, collaboration, frequence, informations manquantes et paiement si besoin.
- `WorkflowTimeline`: supporter les etapes paiement/acompte/solde/facture sans composant parallele.
- `RequestStatusBadge` et `WorkflowStatusBadge`: documenter leur role et centraliser davantage les labels.
- `TariffBillingDesk`: ajouter paiement manuel, demande de solde, relance paiement.
- `OwnerInvoicesPageClient`: clarifier "ce que vous payez" et prochaine action.
- `MissionDetailClient`: integrer paiement et facture dans la timeline mission.

---

## 4) Nouveaux composants minimaux acceptables

Nouveaux composants seulement si reutilises sur au moins deux parcours:

- `PaymentSummaryPanel`: total, deja regle, reste a payer, mode, prochaine action.
- `PaymentActionBar`: actions owner/concierge selon le statut paiement.
- `PaymentPlanFields`: choix paiement complet, acompte/solde, apres realisation, mensuel.

Aucun composant specifique a une seule page n'est recommande a ce stade.

---

## 5) Helpers partages

### Existants
- `commercialWorkflow.ts`
- `requestStatus.ts`
- `missionStatus.ts`
- `missionPermissions.ts`
- `workflowStatus.ts`
- `serviceRequestBrief.ts`

### A ajouter
- `fait` - `paymentWorkflow.ts`: statuts paiement, labels owner/concierge, prochaine action, garde-fous acompte.
- `fait` - `invoiceStatus.ts`: mapping facture -> paiement, labels coherents et evenements workflow facture.

---

## 6) Statuts metier cibles

### Demande
`draft`, `sent`, `received`, `viewed`, `in_review`, `information_requested`, `quoted`, `quote_accepted`, `quote_refused`, `accepted`, `expired`, `cancelled`.

### Devis
`draft`, `sent`, `viewed`, `accepted`, `rejected`, `expired`, `canceled`.

### Mission
`to_schedule`, `date_requested`, `date_proposed`, `date_confirmed`, `scheduled`, `awaiting_deposit`, `ready`, `in_progress`, `completed`, `awaiting_owner_validation`, `validated`, `closed`, `canceled`.

### Paiement
`pending`, `deposit_requested`, `deposit_paid`, `payment_requested`, `paid`, `partially_paid`, `balance_due`, `overdue`, `failed`, `canceled`, `refunded`, `manual_payment_pending`.

---

## 7) Tests UX a couvrir

- `fait` - Scenario A: mission ponctuelle.
- `fait` - Scenario B: collaboration annuelle.
- `fait` - Scenario C: comparaison de plusieurs concierges.
- `fait` - Scenario D: date non renseignee.
- `fait` - Scenario E: informations incompletes.
- `fait` - Scenario F: paiement avec acompte.
- `fait` - Scenario G: paiement integral.

Les tests techniques actuels couvrent 113 cas unitaires/integration, dont workflow demande/devis/mission, facture brouillon, scenarios objectif/collaboration A a E et paiement F/G.

---

## 8) Implementation progressive

### P0 - Finir objectif/collaboration sans nouveau composant
- `fait` - Finaliser l'affichage de la synthese avant envoi dans `RequestPanel`.
- `fait` - Persister objectif/collaboration/frequence/responsabilite et logement structure dans `/api/service-requests`.
- `fait` - Afficher ces informations dans `ServiceRequestCard` cote concierge.
- `fait` - Ajouter tests `serviceRequestBrief`.

### P1 - Clarifier paiement facture existant
- `fait` - Ajouter "Ce que vous payez" sur les factures owner.
- `fait` - Ajouter paiement manuel recu cote concierge dans `TariffBillingDesk`.
- `fait` - Ajouter events workflow pour facture emise/payee/en retard.

### P2 - Acompte et solde
- `fait` - Ajouter `paymentWorkflow`.
- `a faire` - Ajouter plan de paiement au devis/facture.
- `a faire` - Bloquer planification si acompte obligatoire non paye.

### P3 - Validation mission et cloture
- `a faire` - Ajouter validation proprietaire de realisation.
- `a faire` - Declencher solde a regler apres validation.
- `a faire` - Cloturer mission apres paiement final.

---

## 9) Risques principaux

- Trop de logique de statut locale dans les pages owner/concierge.
- Deux familles de badges de statut a clarifier.
- Paiement facture existant mais encore separe du statut mission.
- Informations de brief encore trop dependantes de metadata si elles deviennent critiques pour reporting.
- Creation de nouveaux composants trop specifiques: a eviter.

---

## 10) Etat de validation

- `fait` - Audit complet ajoute.
- `fait` - Audit architecture composants ajoute.
- `fait` - Audit paiement ajoute.
- `fait` - Verification TypeScript lancee et reussie apres ces ajouts.
- `fait` - Tests complets lances: 113 tests passent.
