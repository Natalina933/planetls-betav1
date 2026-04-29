# Suite de l'audit UX concierge — Lynda & Christa

_Date: 26 avril 2026_

## Objectif de cette suite
Transformer les constats de l'audit initial en **plan d'exécution produit**: parcours cible, instrumentation, tests UX et critères de succès.

---

## 1) Parcours cible par persona (version opérationnelle)

## A. Lynda (simplicité, confiance, proximité)

### Parcours cible (J0 → J7)
1. **Inscription guidée avec stepper visible** ("Étape 1 sur 5").
2. **Activation mode lisibilité** dès l'écran d'accueil onboarding.
3. **Définition du rayon max d'intervention** avec valeur par défaut (ex: 15 km).
4. **Message de réassurance local**: "Nous privilégions les missions proches de votre zone."
5. **Arrivée dashboard avec checklist ultra-simple**:
   - compléter profil,
   - publier 1 offre,
   - répondre à 1 demande.

### Critères UX pour Lynda
- Temps de complétion onboarding < 8 min.
- Taux d'abandon entre étapes < 12%.
- Taux d'activation du mode lisibilité > 30% chez les profils débutants.

---

## B. Christa (rapidité, contrôle, projection business)

### Parcours cible (J0 → J7)
1. **Choix d'entrée**: mode standard ou **onboarding express**.
2. Onboarding express en 3 écrans:
   - zone + services principaux,
   - niveau d'expérience + capacité,
   - confirmation + CTA métier.
3. **Écran de projection immédiate**:
   - créer 1er bien,
   - créer 1re offre packagée,
   - inviter 1 propriétaire.
4. **Nudge post-signup**: "Importer vos données" (CSV/API) en tâche différée.

### Critères UX pour Christa
- Temps de complétion mode express < 3 min 30.
- Taux d'accès à un CTA métier dans les 5 min > 60%.
- Taux de création de premier actif (bien/offre) à J1 > 45%.

---

## 2) Expérimentations produit (A/B test)

## Expérience 1 — Stepper visible vs sans stepper
- **Hypothèse**: le stepper réduit la charge cognitive et les abandons.
- **Population**: nouveaux comptes concierges.
- **Succès**: baisse d'abandon d'au moins 15% sur étape 2→3.

## Expérience 2 — Mode lisibilité affiché par défaut vs optionnel
- **Hypothèse**: meilleure complétion pour profils peu digitaux.
- **Succès**: +10% de complétion chez profils "débutant/intermédiaire".

## Expérience 3 — Onboarding express vs tunnel complet
- **Hypothèse**: l'express accélère l'activation des profils experts.
- **Succès**: +20% de création d'actif métier en J1.

---

## 3) Instrumentation minimale à ajouter

Événements analytics recommandés:
- `concierge_onboarding_started`
- `concierge_onboarding_step_viewed`
- `concierge_onboarding_step_completed`
- `concierge_onboarding_accessibility_enabled`
- `concierge_onboarding_radius_set`
- `concierge_onboarding_express_selected`
- `concierge_post_signup_cta_clicked`
- `concierge_first_asset_created`

Propriétés clés:
- `persona_hint` (`lynda_like`, `christa_like`),
- `experience_level`,
- `onboarding_variant`,
- `step_index`,
- `time_to_complete_seconds`.

---

## 4) Roadmap 4 semaines

### Semaine 1
- Stepper onboarding.
- Événements analytics de base.

### Semaine 2
- Mode lisibilité onboarding.
- Champ rayon max + validations.

### Semaine 3
- Onboarding express (MVP 3 écrans).
- Écran post-signup avec 3 CTA métier.

### Semaine 4
- Lancement A/B tests.
- Dashboard KPI onboarding + revue produit.

---

## 5) KPI de pilotage (vue hebdo)
- Complétion onboarding concierge.
- Temps médian de complétion.
- Taux d'abandon par étape.
- Taux d'activation J+1 (action métier réalisée).
- Taux d'activation J+7 (au moins 3 actions clés).
- CSAT onboarding (question unique en sortie de tunnel).

---

## Décision produit recommandée
Prioriser un **double démarrage persona-driven**:
- **Parcours rassurant et lisible** pour profils type Lynda.
- **Parcours express orienté business** pour profils type Christa.

Ce choix maximise la conversion sans complexifier excessivement l'architecture existante.
