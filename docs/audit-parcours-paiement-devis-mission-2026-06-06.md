# Audit parcours devis, mission et paiement - 06/06/2026

## Objectif
Creer un parcours professionnel, fluide et securise depuis la demande de service jusqu'au paiement final, cote proprietaire et cote concierge.

Priorite produit:
- le proprietaire comprend ce qu'il paie, quand il paie et pourquoi;
- le concierge sait clairement quand la mission est confirmee, realisee et reglee;
- la solution reste simple, rassurante et evolutive.

---

## 1) Parcours recommande

1. Le proprietaire envoie une demande.
2. Le concierge repond ou demande des precisions.
3. Le concierge propose un devis.
4. Le proprietaire consulte, compare et accepte le devis.
5. La mission est creee ou rattachee automatiquement.
6. Une date de premiere mission est confirmee.
7. Le proprietaire regle selon le mode prevu: acompte, totalite, solde ou mensualite.
8. Le concierge realise la mission.
9. Le proprietaire confirme la bonne realisation.
10. Le paiement est valide ou marque comme paye.
11. Une facture ou un recu est disponible.
12. Les deux parties consultent l'historique.

---

## 2) Etat actuel apres lecture du code

- `fait` - Le parcours demande -> reponse concierge -> devis -> acceptation existe.
- `fait` - Le concierge peut demander une precision via `information_requested`.
- `fait` - Le concierge peut proposer une date via `date_proposed` et `proposed_date`.
- `fait` - Le proprietaire peut consulter, comparer, accepter ou refuser les devis.
- `fait` - L'acceptation d'un devis cree ou rattache une mission automatiquement.
- `fait` - Une mission issue de devis passe en `date_requested` si une date existe, sinon en `to_schedule`.
- `fait` - Une facture brouillon est generee depuis le devis accepte quand les lignes de devis existent.
- `fait` - Les factures sont listees cote proprietaire et cote concierge via le module facturation.
- `fait` - Les factures exposent total, solde, statut, echeance et lignes.
- `fait` - Un document facture/recu est disponible via `/api/invoices/[id]/document`.
- `fait` - Le proprietaire peut lancer un paiement facture via Stripe Checkout depuis `/dashboard/owner/factures`.
- `fait` - Le retour Stripe facture synchronise la facture en `paid` via `/api/billing/invoices/[id]/sync`.
- `fait` - Le webhook Stripe traite `checkout.session.completed` pour les paiements de facture.
- `fait` - Le concierge peut mettre a jour un statut facture via API: `issued`, `partially_paid`, `paid`, `overdue`, `canceled`.
- `fait` - Les changements facture creent des `invoice_events` et des `mission_events`.

- `partiel` - Le paiement en ligne existe au niveau facture, mais pas encore comme cycle metier complet acompte -> mission confirmee -> solde.
- `partiel` - Le paiement manuel est possible techniquement par changement de statut facture, mais il manque une UX explicite "paiement hors plateforme a confirmer".
- `partiel` - Les statuts facture couvrent `draft`, `issued`, `partially_paid`, `paid`, `overdue`, `canceled`, mais pas les statuts metier demandes: acompte demande, acompte paye, solde a regler, echec, remboursement.
- `partiel` - Les documents existent, mais la page "Reglements et paiements" reste une page de consolidation en preparation.
- `partiel` - Les timelines demande/devis/mission existent, mais la timeline de paiement final n'est pas encore integree au parcours metier commun.

- `a faire` - Ajouter un modele simple de plan de paiement rattache au devis/facture: `full_before_mission`, `deposit_then_balance`, `after_completion`, `monthly`.
- `a faire` - Ajouter les champs contractuels de paiement: acompte requis, montant ou pourcentage d'acompte, solde, date d'echeance, mode prefere.
- `a faire` - Bloquer la confirmation de mission si un acompte obligatoire n'est pas paye.
- `a faire` - Ajouter une validation proprietaire de realisation avant solde quand le paiement est apres mission.
- `a faire` - Ajouter une action concierge "Marquer paiement manuel recu" avec preuve/commentaire.
- `a faire` - Ajouter une action concierge "Demander le solde" et une notification proprietaire.
- `a faire` - Ajouter une action "Relancer paiement" pour facture echeance/retard.
- `a faire` - Alimenter la timeline mission avec paiement/acompte/solde/facture disponible.

---

## 3) Meilleure solution paiement

Architecture conseillee:

- paiement en ligne securise par facture via Stripe Checkout, puis evolution vers Stripe Connect si la plateforme doit reverser aux concierges;
- paiement manuel declare par concierge avec statut, montant, date, commentaire et event;
- paiement complet avant mission pour les missions ponctuelles simples;
- acompte a l'acceptation puis solde apres realisation pour les missions sensibles ou couteuses;
- paiement apres realisation pour les missions avec validation proprietaire;
- paiement mensuel pour collaboration reguliere, en commencant par une facture mensuelle simple avant abonnement automatise.

Choix recommande pour rester simple:
1. court terme: facture unique + paiement Stripe ou manuel;
2. P1: option acompte/solde sur une facture;
3. P2: mensualisation avec factures recurrentes;
4. P3: Stripe Connect et reversement automatise.

---

## 4) Statuts recommandes

### Paiement
- `pending` - en attente
- `deposit_requested` - acompte demande
- `deposit_paid` - acompte paye
- `full_payment_requested` - paiement complet demande
- `paid` - paye
- `balance_due` - solde a regler
- `overdue` - en retard
- `failed` - echoue
- `refunded` - rembourse
- `canceled` - annule
- `manual_payment_pending` - paiement manuel a confirmer

### Mission
- `quote_accepted` - devis accepte
- `awaiting_deposit` - en attente d'acompte
- `to_schedule` - prete a planifier
- `scheduled` - planifiee
- `in_progress` - en cours
- `completed` - realisee
- `awaiting_owner_validation` - en attente de validation
- `validated` - validee
- `awaiting_balance` - en attente de solde
- `closed` - cloturee

---

## 5) Regles metier a appliquer

- `fait` - Un devis accepte cree ou rattache une mission et une facture brouillon.
- `fait` - Si aucune date n'est connue, la mission passe en planification.
- `fait` - Les deux parties voient deja des statuts adaptes au role sur demande/devis/mission.

- `a faire` - Si un acompte est obligatoire, la mission ne peut pas etre confirmee tant que l'acompte n'est pas paye.
- `a faire` - Si aucun acompte n'est demande, la mission peut etre planifiee directement.
- `a faire` - Si la date est absente, demander une date avant paiement ou avant planification selon le plan de paiement.
- `a faire` - Verrouiller le devis accepte pour eviter les modifications non validees.
- `a faire` - Toute modification apres acceptation doit creer un avenant ou une nouvelle version.
- `a faire` - Le proprietaire doit valider explicitement chaque paiement.
- `a faire` - Le concierge doit etre notifie a chaque etape importante de paiement.
- `a faire` - Les deux parties doivent voir le meme statut metier avec wording adapte.

---

## 6) UX attendue

### Proprietaire
- `fait` - "Vous avez accepte ce devis" existe dans le parcours devis.
- `partiel` - "Mission confirmee" existe via le statut mission, mais pas encore lie au paiement.
- `partiel` - "Paiement termine" existe via facture `paid`, mais pas encore dans une timeline globale.
- `a faire` - "Acompte a regler pour confirmer la mission".
- `a faire` - "Solde a regler apres realisation".
- `a faire` - Afficher clairement reste a payer, montant deja regle, mode de paiement et prochaine action.

### Concierge
- `fait` - "Votre devis a ete accepte" est deduit du devis accepte et de la mission creee.
- `partiel` - "Mission confirmee" existe par statut mission, sans garde-fou acompte.
- `partiel` - "Paiement termine" existe par facture payee, mais pas encore consolide dans la mission.
- `a faire` - "En attente du paiement de l'acompte".
- `a faire` - "Mission realisee, en attente de validation".
- `a faire` - "Demander le solde" et "Relancer paiement".

Timeline cible:
Demande envoyee -> Devis recu -> Devis accepte -> Paiement/acompte -> Mission planifiee -> Mission realisee -> Validation -> Paiement final -> Cloture.

---

## 7) Donnees recommandees

Approche minimale:

- conserver `quotes`, `missions`, `invoices`, `invoice_items`, `invoice_events`;
- ajouter `payment_plan` dans `quotes.metadata` ou dans une colonne dediee ensuite;
- ajouter `payment_status` et `payment_terms` dans `invoices.metadata` si la migration doit rester legere;
- creer plus tard une table `payments` si besoin de tracer plusieurs transactions Stripe/manuelles sur une meme facture.

Structure cible simple:

- `payment_plan`: `full_before_mission | deposit_then_balance | after_completion | monthly`
- `deposit_amount`
- `deposit_percent`
- `balance_amount`
- `payment_method`: `stripe | bank_transfer | manual | external`
- `payment_status`
- `manual_payment_reference`
- `paid_at`
- `validated_by_owner_at`
- `closed_at`

---

## 8) Notifications a prevoir

- `fait` - Devis accepte: evenement workflow existant.
- `fait` - Facture payee: evenement facture et mission cree quand le statut passe `paid`.
- `partiel` - Paiement echoue: webhook Stripe capte `invoice.payment_failed`, mais l'exposition produit reste a finaliser.
- `partiel` - Facture disponible: document disponible, notification produit a brancher.

- `a faire` - Acompte demande.
- `a faire` - Acompte paye.
- `a faire` - Mission confirmee apres paiement.
- `a faire` - Mission realisee.
- `a faire` - Validation demandee.
- `a faire` - Solde demande.
- `a faire` - Solde paye.
- `a faire` - Paiement en retard.
- `a faire` - Mission cloturee.

---

## 9) Implementation progressive proposee

### P0 - Clarifier paiement facture existant
- `a faire` - Ajouter dans `/dashboard/owner/factures` un encart "Ce que vous payez" avec services, quantites, total, deja regle, reste a payer.
- `a faire` - Ajouter cote concierge une action visible "Marquer paiement manuel recu" branchée sur `/api/invoices/[id]/status`.
- `a faire` - Ajouter un event `workflow_events` lors de `invoice_issued`, `invoice_paid`, `invoice_overdue`, `invoice_canceled`.
- `a faire` - Afficher ces evenements dans la timeline mission.

### P1 - Acompte et solde
- `a faire` - Ajouter les champs de plan de paiement au devis ou a la facture brouillon.
- `a faire` - Generer une facture avec acompte/solde ou deux echeances.
- `a faire` - Bloquer `schedule` si `deposit_required = true` et `deposit_paid_at` absent.
- `a faire` - Ajouter CTA owner "Regler l'acompte" puis "Regler le solde".

### P2 - Validation mission
- `a faire` - Ajouter statut mission `awaiting_owner_validation` puis `validated`.
- `a faire` - Ajouter CTA concierge "Marquer realisee".
- `a faire` - Ajouter CTA proprietaire "Confirmer la bonne realisation".
- `a faire` - Declencher `balance_due` apres validation si un solde existe.

### P3 - Paiement avance
- `a faire` - Ajouter Stripe Connect si la plateforme doit encaisser puis reverser.
- `a faire` - Ajouter mensualisation pour collaborations regulieres.
- `a faire` - Ajouter remboursement/avoir et avenants de devis acceptes.

---

## 10) References code auditees

- `src/app/api/_shared/acceptedQuoteWorkflow.ts`
- `src/app/api/invoices/route.ts`
- `src/app/api/invoices/[id]/status/route.ts`
- `src/app/api/invoices/[id]/document/route.ts`
- `src/app/api/billing/invoices/[id]/checkout/route.ts`
- `src/app/api/billing/invoices/[id]/sync/route.ts`
- `src/app/api/billing/webhook/route.ts`
- `src/app/dashboard/owner/factures/OwnerInvoicesPageClient.tsx`
- `src/app/dashboard/owner/reglement/page.tsx`
- `src/app/dashboard/concierge/billing/page.tsx`
- `src/app/dashboard/missions/MissionDetailClient.tsx`
- `src/features/service-requests/components/WorkflowTimeline/WorkflowTimeline.tsx`

---

## 11) Garde-fou architecture composants

- `fait` - Un audit architecture dedie a ete ajoute dans `docs/audit-architecture-composants-workflow-2026-06-06.md`.
- `fait` - La regle retenue est de reutiliser ou ameliorer les composants existants avant toute creation.
- `fait` - Les composants deja presents a privilegier sont `Button`, `Badge`, `Card`, `RequestStatusBadge`, `WorkflowStatusBadge`, `ServiceRequestCard`, `WorkflowTimeline`, `OwnerQuoteResponseCard`, `OwnerRequestSummaryCard`, `OwnerQuotesComparisonTable`, `TariffBillingDesk` et `EmptyState`.
- `fait` - Les nouveaux composants paiement sont limites a des composants partageables: `PaymentSummaryPanel`, `PaymentActionBar`, `PaymentPlanFields`, uniquement si l'extension des composants existants ne suffit pas.
- `fait` - Les helpers metier doivent rester centralises: `commercialWorkflow`, `missionStatus`, `requestStatus`, `workflowStatus`, `serviceRequestBrief`, puis futur `paymentWorkflow`.
