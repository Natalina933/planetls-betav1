# Analyse de ce qu'il reste à faire — onboarding par catégorie

_Date: 29 avril 2026_

_Note de reprise: voir `docs/ux-onboarding-audit-reprise-2026-04-29.md` pour l'etat reel compare au code._

## Contexte
Cette synthèse reprend les constats déjà produits dans:
- `docs/concierge-signup-ux-audit-lynda-christa-2026-04-25.md`
- `docs/concierge-ux-personas-analysis-2026-04-25.md`

Objectif: clarifier **ce qu'il reste à faire** au démarrage de l'expérience utilisateur, pour les 3 catégories:
1. Concierge,
2. Propriétaire,
3. Commerçant/Artisan.

---

## 1) État de départ commun (déjà en place)

Les bases du tunnel sont correctes:
- parcours en étapes,
- validation de localisation,
- création de compte avec contrôles,
- redirection par catégorie,
- gestion explicite de l'échec de connexion auto.

➡️ Donc la suite se joue surtout sur la **personnalisation des parcours**, pas sur une refonte complète du tunnel.

---

## 2) Ce qu'il reste à faire — Concierge

## 2.1 Priorité haute (à faire en premier)
1. **Ajouter un stepper d'onboarding** visible (_Étape X/Y_).
2. **Activer un mode lisibilité** (contraste + taille texte) dès la première étape.
3. **Demander le rayon d'intervention** pendant l'inscription (pas après).
4. **Créer un mode express vs guidé**:
   - Guidé pour profils type Lynda,
   - Express pour profils type Christa.

## 2.2 Priorité moyenne
1. **Libellés simplifiés** (moins jargon métier, plus terrain).
2. **Écran post-inscription orienté actions**:
   - Configurer mes services,
   - Ajouter mon premier bien géré,
   - Répondre à une première demande.
3. **Nudges de complétion** (profil/tarifs/disponibilités) avec progression.

## 2.3 KPI à brancher
- taux de finalisation inscription concierge,
- temps moyen de complétion,
- % de profils avec zone + services + disponibilités remplis en J+1.

---

## 3) Ce qu'il reste à faire — Propriétaire

## 3.1 Priorité haute
1. **Onboarding orienté objectif** dès l'entrée:
   - "Je veux déléguer la gestion complète",
   - "Je veux un service ponctuel",
   - "Je veux comparer plusieurs concierges".
2. **Collecte minimale sur le bien** dès onboarding:
   - ville/quartier,
   - type de bien,
   - volume de besoin (occasionnel/régulier).
3. **Projection claire de la suite**:
   - "Après inscription, vous pourrez envoyer votre première demande en 2 min".

## 3.2 Priorité moyenne
1. **Template de première demande** pré-rempli selon objectif.
2. **Matching initial immédiat** (3 profils recommandés après inscription).
3. **Réassurance forte** (délais de réponse, qualité des concierges, sécurité des échanges).

## 3.3 KPI à brancher
- taux inscription propriétaire → première demande,
- délai médian inscription → première mise en relation,
- taux d'abandon avant création de demande.

---

## 4) Ce qu'il reste à faire — Commerçant / Artisan

## 4.1 Priorité haute
1. **Onboarding métier simplifié**:
   - corps de métier,
   - zone d'intervention,
   - créneaux disponibles,
   - urgence acceptée ou non.
2. **Preuves de confiance dès départ**:
   - assurance,
   - SIRET (si applicable),
   - photos réalisations (optionnel mais recommandé).
3. **Clarifier la promesse plateforme**:
   - type de missions reçues,
   - fréquence attendue,
   - comment répondre vite et bien.

## 4.2 Priorité moyenne
1. **Grille tarifaire de base guidée** (fourchettes proposées).
2. **Templates de réponse devis** pour gagner du temps.
3. **Score de profil “prêt à recevoir des missions”**.

## 4.3 KPI à brancher
- taux inscription artisan → profil publiable,
- délai inscription → première réponse à sollicitation,
- taux de complétion pièces de confiance (assurance/documents).

---

## 5) Plan d'exécution recommandé (court terme)

## Sprint 1 (immédiat)
- Stepper onboarding + mode lisibilité global.
- Rayon d'intervention ajouté pour concierge/artisan.
- Écran de fin d'inscription avec CTA différents par catégorie.

## Sprint 2
- Parcours objectif propriétaire + template de première demande.
- Express onboarding concierge expert.
- Profil readiness score pour artisan/concierge.

## Sprint 3
- Matching immédiat propriétaire.
- Templates de messages/devis (concierge/artisan).
- Instrumentation KPI onboarding complète.

---

## 6) Conclusion pratique

Tu as une base solide. Le principal manque n'est pas technique, il est produit/UX:
- **Concierge**: différencier débutant vs expert et matérialiser la contrainte de zone.
- **Propriétaire**: orienter vers un objectif concret dès la première minute.
- **Commerçant/Artisan**: accélérer la mise en confiance et la mise en action commerciale.

Si tu veux, prochaine étape: je peux te transformer ce document en **backlog Jira prêt à développer** (user stories + critères d'acceptation + ordre de priorité).
