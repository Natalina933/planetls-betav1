# Module litiges - preuves horodatees (Proprietaire / Concierge)

## 1) Maquette UX (par parcours)

### A. Concierge - parcours obligatoire post-checkout

Ecran: `Dashboard Concierge > Logements > Inspection depart`

1. Bloc en-tete
- Logement, voyageur, date/heure de checkout.
- Badge statut: `A faire` | `Brouillon` | `Soumis`.
- CTA principal: `Demarrer inspection`.

2. Etape 1 - Checklist piece par piece
- Pieces prechargees: entree, salon, cuisine, chambre(s), salle de bain, exterieur.
- Pour chaque item: `OK` | `Anomalie` | `Non applicable`.
- Champ note obligatoire si `Anomalie`.
- Exemple items: sols, murs, mobilier, linge, vaisselle, electro-menager, odeurs, clefs.

3. Etape 2 - Preuves media (obligatoire)
- Minimum: `1 video` + `5 photos`.
- Capture in-app recommandee (mobile):
  - Horodatage serveur automatique.
  - Recuperation metadata appareil (EXIF si disponible).
  - Geolocalisation (lat/lng + precision).
- Marquage media:
  - `Vue generale` / `Detail dommage` / `Compteur` / `Inventaire`.

4. Etape 3 - Validation
- Resume automatique: nb anomalies, nb photos, nb videos.
- Cases a cocher:
  - `Je confirme que les preuves sont prises immediatement apres le depart voyageur.`
  - `Je confirme la localisation du logement.`
- Signature numerique (nom + date + profile connecte).
- CTA: `Soumettre le rapport` (verrouille les preuves).

5. Etats d'erreur UX
- Soumission bloquee si quotas media non atteints.
- Soumission bloquee si anomalies sans photo associee.
- Message clair: element manquant + lien direct vers l'etape concernee.

### B. Proprietaire - controle et ouverture de litige

Ecran: `Dashboard Proprietaire > Logements > Rapports depart`

1. Liste rapports
- Filtres: logement, statut, date, presence anomalies.
- Colonnes: date checkout, concierge, statut inspection, statut litige.

2. Detail rapport
- Resume: `Conforme` ou `Anomalies detectees`.
- Timeline:
  - `Check-in precedent` (etat avant)
  - `Checkout actuel` (etat apres)
- Galerie comparee `Avant / Apres`.
- Bloc preuves juridiques:
  - Date/heure serveur
  - Geolocalisation
  - Hash fichier (integrite)
  - Auteur de la capture

3. Ouverture litige
- CTA: `Ouvrir un litige`.
- Formulaire:
  - Type: `Degat` | `Manquant` | `Menage non conforme` | `Autre`
  - Montant estime
  - Description
  - Selection des preuves associees (photos/videos/items checklist)
- Regle metier: ouverture possible sous 48h apres checkout (parametrable).

4. Export
- CTA: `Generer dossier PDF`.
- Contenu PDF:
  - Rapport checklist
  - Photos/videos referencees
  - Horodatage + geoloc + hash
  - Resume du litige

## 2) Schema BDD (Supabase/PostgreSQL)

Tables proposees:
- `checkout_inspections`
- `checkout_checklist_items`
- `inspection_media`
- `damage_disputes`
- `dispute_evidence_links`
- `inspection_events`

Relations:
- 1 inspection -> N checklist items
- 1 inspection -> N medias
- 1 dispute -> N preuves liees
- 1 inspection -> N events

### Statuts recommandes

Inspection (`checkout_inspections.status`):
- `draft`
- `submitted`
- `reviewed`
- `dispute_opened`
- `closed`

Checklist item (`checkout_checklist_items.item_status`):
- `ok`
- `issue`
- `na`

Litige (`damage_disputes.status`):
- `open`
- `evidence_requested`
- `in_review`
- `resolved`
- `rejected`
- `closed`

## 3) Regles metier + API (pretes a coder)

### A. Regles metier critiques

1. Soumission inspection
- Impossible si < 5 photos ou < 1 video.
- Impossible si un item `issue` n'a aucune preuve associee.
- A la soumission:
  - `submitted_at` renseigne
  - medias verrouilles (`locked = true`)
  - event `inspection_submitted` ajoute

2. Integrite de preuve
- Stocker `sha256` du fichier.
- Interdire modification/suppression de media verrouille.
- Conserver metadata brute (EXIF + geo + horodatage capture + horodatage serveur).

3. Fenetre litige
- Litige autorise jusqu'a `checkout + 48h` (configurable par logement).
- Hors delai: litige bloque sauf role admin.

4. Autorisations
- Concierge assigne: cree et soumet inspection.
- Proprietaire du logement: lit et ouvre litige.
- Seuls participants (owner/concierge) lisent medias et litiges.

### B. Endpoints API

Inspection:
- `POST /api/inspections`
  - Cree un brouillon.
- `GET /api/inspections?housingId=...`
  - Liste des inspections d'un logement.
- `GET /api/inspections/:id`
  - Detail inspection + checklist + medias.
- `PATCH /api/inspections/:id`
  - Mise a jour brouillon.
- `POST /api/inspections/:id/submit`
  - Execute les validations et soumet.

Checklist:
- `PUT /api/inspections/:id/checklist`
  - Upsert des items checklist.

Media:
- `POST /api/inspections/:id/media`
  - Upload et metadata.
- `DELETE /api/inspections/:id/media/:mediaId`
  - Autorise uniquement si inspection `draft` et media non lock.

Litige:
- `POST /api/disputes`
  - Ouvre un litige.
- `GET /api/disputes/:id`
  - Detail litige + preuves.
- `PATCH /api/disputes/:id`
  - Changement statut / resolution.

Export:
- `GET /api/disputes/:id/export`
  - Genere un PDF de dossier de preuve.

### C. Exemples payload

Creation inspection:
```json
{
  "housingId": 123,
  "ownerProfileId": "uuid-owner",
  "conciergeProfileId": "uuid-concierge",
  "checkoutAt": "2026-03-12T09:00:00Z",
  "bookingReference": "AIRBNB-ABCD1234"
}
```

Soumission inspection:
```json
{
  "signatureName": "Nathalie C.",
  "signatureAccepted": true,
  "clientTimestamp": "2026-03-12T09:23:10Z"
}
```

Ouverture litige:
```json
{
  "inspectionId": "uuid-inspection",
  "disputeType": "damage",
  "estimatedAmount": 280.00,
  "currency": "EUR",
  "description": "Table basse raye profondement + pied casse.",
  "evidence": {
    "mediaIds": ["uuid-media-1", "uuid-media-2"],
    "checklistItemIds": ["uuid-item-1"]
  }
}
```

## 4) Plan d'implementation recommande (court)

1. Appliquer migration SQL (tables + triggers + RLS).
2. Creer bucket storage dedie `inspection-evidence`.
3. Implementer endpoints `inspections` puis `disputes`.
4. Integrer l'UI Concierge (wizard 3 etapes).
5. Integrer l'UI Proprietaire (comparatif + ouverture litige).
6. Ajouter export PDF et journal d'audit.

## 5) KPI de pilotage

- Taux d'inspections soumises < 2h apres checkout.
- % inspections avec preuve complete (>=5 photos, >=1 video).
- Delai moyen ouverture litige.
- Taux litiges resolus sans contestation supplementaire.
