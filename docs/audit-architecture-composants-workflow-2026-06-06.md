# Audit architecture composants - workflow demande, devis, mission, paiement

Date: 06/06/2026

## Principe directeur
Avant toute creation de composant, le projet doit reutiliser ou ameliorer l'existant. Un nouveau composant n'est acceptable que s'il devient partageable entre plusieurs parcours et s'il reduit vraiment la duplication.

Objectif: construire une base legere et coherente pour le parcours demande -> devis -> mission -> paiement.

---

## 1) Composants existants a reutiliser

### UI de base
- `src/components/ui/Button` - actions principales, secondaires, liens.
- `src/components/ui/Input`, `Select`, `Textarea`, `Checkbox` - formulaires owner/concierge.
- `src/components/ui/Badge` et `src/components/ui/Tag` - badges lisibles et tags de contexte.
- `src/components/ui/Card` - cartes generiques lorsque la page n'a pas deja une carte metier.
- `src/components/ui/Loader` - chargements.
- `src/features/shared/components/EmptyState` - etats vides.
- `src/components/ui/RequestStatusBadge` - lecture workflow demande/devis/mission orientee parcours commercial.
- `src/app/components/ui/WorkflowStatusBadge/WorkflowStatusBadge.tsx` - badges de statuts generiques deja utilises dans factures, planning, devis.

### Parcours demande/devis/mission
- `src/features/service-requests/components/ServiceRequestCard` - carte transverse demande owner/concierge avec faits, chips, actions et timeline.
- `src/features/service-requests/components/WorkflowTimeline` - timeline commune deja presente sur demande, devis et mission.
- `src/features/owner-dashboard/components/OwnerRequestSummaryCard` - synthese demande cote owner.
- `src/features/owner-dashboard/components/OwnerQuoteResponseCard` - reponse devis owner avec timeline.
- `src/features/owner-dashboard/components/OwnerQuotesComparisonTable` - comparaison de devis.
- `src/app/components/tariffs/TariffBillingDesk.tsx` - bureau devis/factures concierge.

### Shells et pages operationnelles
- `src/app/dashboard/owner/_components/OwnerWorkspacePage.tsx` - shell owner.
- `src/app/dashboard/concierge/_components/ConciergeWorkspacePage.tsx` - shell concierge.
- `src/components/dashboard/DashboardOperationalPage` et `DashboardPanel` - panneaux de dashboard reutilisables.
- `src/app/components/dashboard/shared/SectionHeader.tsx` - titres de sections.

---

## 2) Composants existants a ameliorer

- `WorkflowTimeline`
  - Ajouter un mode paiement sans nouveau composant: etapes `payment`, `deposit`, `balance`, `invoice`.
  - Accepter des `actionHref` ou `actionLabel` optionnels pour afficher la prochaine action si necessaire.

- `ServiceRequestCard`
  - Continuer a l'utiliser pour demandes concierge/owner.
  - Ajouter des facts/chips enrichis plutot que creer une nouvelle carte "demande paiement".
  - Utiliser les memes props pour objectif, collaboration, urgence, date, paiement.

- `RequestStatusBadge`
  - Le garder comme badge metier du workflow commercial.
  - Etendre les labels avec paiement/acompte seulement si le statut est vraiment partage.

- `WorkflowStatusBadge`
  - Le conserver pour statuts generiques facture/planning.
  - Centraliser les labels/couleurs dans `src/app/lib/workflowStatus.ts` au lieu de multiplier les mappings locaux.

- `TariffBillingDesk`
  - Ajouter les actions facture manquantes: paiement manuel recu, demander solde, relancer paiement.
  - Ne pas creer un second bureau paiement concierge tant que ce composant peut porter le flux.

- `OwnerInvoicesPageClient`
  - Ajouter un encart "Ce que vous payez" dans les cartes facture.
  - Reutiliser `WorkflowTimeline` pour afficher paiement/acompte/solde si disponible.

- `OwnerReglementPage`
  - La page est aujourd'hui une page de consolidation en preparation.
  - Elle doit reutiliser les donnees et cartes de factures au lieu de recreer une logique parallele.

- `MissionDetailClient`
  - Ajouter la partie paiement dans la timeline mission existante.
  - Afficher factures et solde avec les composants existants.

---

## 3) Nouveaux composants minimaux necessaires

Priorite: aucun nouveau composant page-specific.

Nouveaux composants acceptables uniquement si partageables:

1. `PaymentSummaryPanel`
   - Reutilisable owner/concierge.
   - Affiche total, deja regle, reste a payer, mode, prochaine action.
   - Peut etre utilise dans facture, mission et devis accepte.

2. `PaymentActionBar`
   - Reutilisable owner/concierge.
   - Cote owner: regler acompte, regler solde, regler totalite.
   - Cote concierge: marquer paiement manuel recu, demander solde, relancer.

3. `PaymentPlanFields`
   - Reutilisable dans devis/facture.
   - Choix: paiement complet, acompte/solde, apres realisation, mensuel.

Ces composants ne doivent etre crees qu'apres verification que `TariffBillingDesk`, `OwnerInvoicesPageClient` et `MissionDetailClient` ne peuvent pas porter l'amelioration proprement.

---

## 4) Helpers et constantes a centraliser

### Existants a conserver
- `src/app/lib/commercialWorkflow.ts` - reference demande/devis/mission.
- `src/app/lib/requestStatus.ts` - lecture workflow demande.
- `src/app/lib/missionStatus.ts` - statuts mission et labels.
- `src/app/lib/workflowStatus.ts` - metadata badges generiques.
- `src/app/lib/serviceRequestBrief.ts` - objectif principal, collaboration, synthese de demande.

### A ajouter ou ameliorer
- `src/app/lib/paymentWorkflow.ts`
  - statuts paiement;
  - labels owner/concierge;
  - prochaine action;
  - regles de blocage mission selon acompte.

- `src/app/lib/invoiceStatus.ts`
  - labels/couleurs facture;
  - mapping facture -> payment workflow.

But: eviter que owner, concierge, API et tests recalculent chacun leur propre lecture.

---

## 5) Fichiers a modifier en priorite

### P0 - Clarifier l'existant sans nouveau composant
- `src/app/dashboard/owner/factures/OwnerInvoicesPageClient.tsx`
- `src/app/components/tariffs/TariffBillingDesk.tsx`
- `src/app/dashboard/missions/MissionDetailClient.tsx`
- `src/app/api/invoices/[id]/status/route.ts`
- `src/app/api/billing/invoices/[id]/checkout/route.ts`
- `src/app/api/billing/invoices/[id]/sync/route.ts`
- `src/app/api/billing/webhook/route.ts`
- `src/app/lib/workflowStatus.ts`
- `src/app/lib/commercialWorkflow.ts`

### P1 - Acompte/solde
- `src/app/api/_shared/acceptedQuoteWorkflow.ts`
- `src/app/api/quotes/[id]/status/route.ts`
- `src/app/api/missions/[id]/route.ts`
- `src/app/dashboard/owner/devis/page.tsx`
- `src/app/dashboard/owner/factures/OwnerInvoicesPageClient.tsx`
- `src/app/components/tariffs/TariffBillingDesk.tsx`
- `src/tests/workflow-transitions-integration.test.mts`

### P2 - Validation mission
- `src/app/dashboard/missions/MissionDetailClient.tsx`
- `src/app/api/missions/[id]/route.ts`
- `src/app/lib/missionStatus.ts`
- `src/app/lib/missionPermissions.ts`
- `src/tests/mission-status.test.mts`

---

## 6) Fichiers inutiles ou doublons a surveiller

A ne pas supprimer sans audit d'usage, mais a surveiller:

- `src/app/components/ui/WorkflowStatusBadge/WorkflowStatusBadge.tsx` et `src/components/ui/RequestStatusBadge/RequestStatusBadge.tsx`
  - Deux badges de statut coexistent. Les garder si roles distincts: `WorkflowStatusBadge` generique, `RequestStatusBadge` metier commercial.
  - A documenter dans `src/components/ui/README.md`.

- `src/app/components/dashboard/...` et `src/components/dashboard/...`
  - Deux zones dashboard coexistent. Eviter d'ajouter de nouveaux composants dans `src/app/components/dashboard` si un equivalent existe dans `src/components/dashboard`.

- `OwnerRequestSummaryCard`, `OwnerQuoteResponseCard`, `ServiceRequestCard`
  - Ne pas creer une quatrieme carte metier. Si besoin paiement, etendre `ServiceRequestCard` ou ajouter `PaymentSummaryPanel`.

- Mappings de statuts locaux dans les pages owner/concierge
  - A nettoyer progressivement au profit de `commercialWorkflow`, `missionStatus`, `workflowStatus` et futur `paymentWorkflow`.

Suppression immediate recommandee: aucune. Le projet est en cours de consolidation; supprimer maintenant risquerait de casser des parcours sans gain clair.

---

## 7) Architecture finale proposee

### Couche metier partagee
- `commercialWorkflow.ts` pour demande/devis/mission.
- `paymentWorkflow.ts` pour paiement/acompte/solde.
- `missionStatus.ts` pour statuts mission.
- `serviceRequestBrief.ts` pour objectif/collaboration/synthese.

### Couche UI partagee
- UI atomique: `Button`, `Input`, `Select`, `Textarea`, `Badge`, `Tag`, `Card`, `Loader`.
- Workflow: `RequestStatusBadge`, `WorkflowStatusBadge`, `WorkflowTimeline`.
- Cartes metier: `ServiceRequestCard`, `OwnerQuoteResponseCard`, `OwnerRequestSummaryCard`.
- Paiement: d'abord extension de `TariffBillingDesk`, `OwnerInvoicesPageClient`, `MissionDetailClient`; nouveau `PaymentSummaryPanel` seulement si reutilise dans au moins deux pages.

### Couche pages
- Les pages owner/concierge assemblent les composants et appellent les APIs.
- Les pages ne doivent plus contenir de logique de statut complexe sauf fallback temporaire.
- Les actions critiques passent par APIs qui creent `workflow_events`, `invoice_events` ou `mission_events`.

---

## 8) Decision pour les prochains lots

- `fait` - L'audit impose la reutilisation des composants existants avant toute creation.
- `fait` - Les composants existants reutilisables ont ete identifies.
- `fait` - Les composants a ameliorer ont ete listes.
- `fait` - Les nouveaux composants necessaires ont ete limites a trois composants partageables.
- `fait` - Les fichiers a modifier et les doublons a surveiller sont documentes.

