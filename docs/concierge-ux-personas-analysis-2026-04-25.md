# Analyse UX concierges orientée personas (Persona simplicité & Persona expert)

_Date: 25 avril 2026_

## 1) Ce qui est déjà solide dans ton produit

### Fondations déjà en place
- **Dashboard concierge structuré**: indicateurs opérationnels, actions rapides et raccourcis existent déjà (missions, demandes compatibles, temps de réponse, satisfaction).
- **Navigation métier claire**: Biens, Propriétaires, Interventions, Réseau artisans.
- **Espace messages dédié** avec recherche + filtre de statut + fil de discussion.
- **Profil concierge avancé**: services, zone d'intervention, disponibilité, tarification et logique mission.
- **Recherche et filtrage riches** (zone, ville/CP, type de bien, budget, rayon, catégories/services).

👉 En résumé: la base est robuste côté fonctionnalités. Le principal levier est désormais la **simplicité d'usage par niveau de maturité digitale**.

---

## 2) Lecture par persona: points de friction probables

## Persona 1 — Persona simplicité (50 ans, peu diplômée, contraintes visuelles, zone restreinte Vendôme)

### Risques UX actuels
1. **Charge cognitive trop élevée**
   - Trop d'options à l'écran dès l'entrée (métriques, panneaux, navigation dense).
2. **Complexité lexicale**
   - Vocabulaire potentiellement trop "produit" ou "business" (prospection, conversion, pilotage).
3. **Accessibilité visuelle insuffisamment explicite**
   - Taille texte/contraste/raccourcis visuels non mis en avant comme réglage utilisateur.
4. **Parcours non guidé**
   - Persona simplicité a besoin d'un "pas à pas" très concret (quoi faire aujourd'hui, puis demain).
5. **Contrainte de mobilité non centrale**
   - Son périmètre réduit doit devenir un paramètre "verrouillé" et rassurant.

### Optimisations prioritaires pour Persona simplicité
- **Mode “Essentiel” (par défaut)**
  - 3 cartes max sur l'accueil: _Aujourd'hui_, _Mes missions proches_, _Mes messages urgents_.
- **Checklist quotidienne simple**
  - Ex: “1. Répondre aux 2 demandes”, “2. Confirmer l'intervention de 15h”, “3. Envoyer le compte-rendu”.
- **Paramètre accessibilité visible en haut**
  - Taille de police (M/L/XL), contraste renforcé, espacement augmenté.
- **Zone d'intervention verrouillable**
  - “Je travaille dans un rayon de 10 km autour de Vendôme” + refus automatique hors zone.
- **Microcopie pédagogique**
  - Remplacer “pilotage stratégique” par “Suivi de votre activité”.

---

## Persona 2 — Persona expert (40 ans, déjà active en saisonnier, veut scaler, outils Excel/SMS)

### Risques UX actuels
1. **Rupture d'outils**
   - Persona expert travaille déjà avec Excel + téléphone/SMS; sans passerelles, elle perd du temps.
2. **Manque de fonctions “ops multi-biens”**
   - Elle gère plusieurs lieux (Barcarès/Leucate), il faut une vue portefeuille plus puissante.
3. **Valorisation commerciale à renforcer**
   - Son besoin n'est pas juste d'exécuter, mais d'industrialiser sa future conciergerie.
4. **Gestion équipe/couple non outillée**
   - Répartition des rôles (elle: déco/photo/coordination, Arnaud: interventions manuelles).

### Optimisations prioritaires pour Persona expert
- **Import/Export Excel & CSV natif**
  - Missions, planning, tarifs, propriétaires.
- **Passerelle communication**
  - Templates de messages + journal unifié (SMS/téléphone/plateforme via notes si pas d'API SMS).
- **Vue portefeuille multi-biens / multi-zones**
  - Filtres rapides par ville, type de bien, rentabilité, urgence.
- **Bibliothèque “offres packagées”**
  - Ex: Pack check-in, Pack ménage premium, Pack shooting annonce.
- **Mode collaboratif léger**
  - Assignation de tâches par personne, statut, preuves photo avant/après.

---

## 3) Priorisation produit recommandée (90 jours)

## Phase 1 (0–30 jours) — Quick wins UX (impact fort / effort modéré)
1. Ajouter un **switch Mode Essentiel / Mode Expert**.
2. Créer une **home “Aujourd'hui”** orientée tâches.
3. Mettre des **libellés simples** + aide contextuelle courte.
4. Ajouter un **module accessibilité** (taille/contraste).
5. Mettre la **zone d'intervention** au cœur du paramétrage initial.

## Phase 2 (30–60 jours) — Productivité terrain
1. **Templates de messages** propriétaires/voyageurs/artisans.
2. **Journal d'activité** unifié (appel, SMS, message, visite).
3. **Checklists mission** avec photos et validation.
4. **Vue agenda + carte** pour optimiser les déplacements.

## Phase 3 (60–90 jours) — Croissance de la conciergerie
1. **Import/Export CSV/Excel**.
2. **Pack d'offres commercialisables**.
3. **Affectation d'équipe & rôles**.
4. **Dashboard business** (CA, marge, taux de conversion par zone).

---

## 4) Ce qui peut être optimisé dans ce que tu as déjà construit (très concret)

## A. Dashboard concierge
- Garder les KPI, mais proposer 2 vues:
  - **Vue Essentielle**: missions du jour, urgences, messages non lus.
  - **Vue Pilotage**: KPI complets, satisfaction, temps de réponse, prospection.

## B. Filtres et recherche
- Bonne profondeur fonctionnelle, mais prévoir:
  - **“Filtres favoris”** (1 clic) pour ne pas reconfigurer à chaque fois.
  - **Mode guidé en 3 étapes** (Zone → Service → Budget) pour profils moins à l'aise.

## C. Profil/tarification
- Très complet mais dense:
  - Ajouter un **score de complétude ultra lisible** avec "prochaine meilleure action".
  - Distinguer **indispensable vs avancé** (masquage progressif des options expertes).

## D. Messagerie
- Existant pertinent; à améliorer:
  - **Réponses rapides** (boutons pré-remplis).
  - **SLA visuel**: “réponse attendue sous 2h”.
  - **Tag d'urgence** + remontée automatique en haut.

---

## 5) Parcours ciblés à implémenter

## Parcours Persona simplicité (objectif: revenu d'appoint sans stress)
1. Onboarding en 5 écrans max.
2. Paramétrer rayon local + horaires disponibles.
3. Recevoir missions proches uniquement.
4. Suivre checklist mission + bouton “preuve photo”.
5. Voir gains hebdo simples + prochaine action recommandée.

## Parcours Persona expert (objectif: structurer une activité de conciergerie)
1. Importer ses données existantes (biens/contacts/tarifs).
2. Créer des packs de services.
3. Assigner tâches à elle/Arnaud.
4. Suivre taux d'acceptation + délais de réponse + rentabilité par bien.
5. Utiliser reporting mensuel pour piloter la croissance.

---

## 6) KPI UX à suivre absolument

### Adoption
- Taux d'activation J+7 (concierges ayant réalisé 3 actions clés).
- % de profils complétés à >80%.

### Efficacité
- Temps moyen pour accepter une mission.
- Temps moyen de première réponse message.
- Taux de missions terminées sans relance.

### Qualité perçue
- Satisfaction concierge (CSAT) par persona.
- Taux d'erreur / abandon sur onboarding.
- NPS spécifique “simplicité d'usage”.

### Business
- Taux de conversion demande → mission.
- Panier moyen par mission.
- Revenu mensuel actif par concierge.

---

## 7) Recommandation stratégique finale

Ton produit est déjà **fonctionnellement mature**. Le prochain palier ne se joue pas sur “plus de features”, mais sur:
1. **Simplifier pour Persona simplicité** (confiance + accessibilité + guidage).
2. **Industrialiser pour Persona expert** (ops multi-biens + automatisations légères + pilotage business).

Si tu veux, je peux te préparer ensuite:
- une **maquette de “Mode Essentiel”**,
- une **arborescence exacte des écrans**,
- et un **backlog priorisé en user stories** prêt pour dev.
