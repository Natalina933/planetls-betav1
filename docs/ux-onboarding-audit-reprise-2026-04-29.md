# Reprise audit UX onboarding - etat reel du parcours

_Date: 29 avril 2026_

## Perimetre relu

Sources docs:
- `docs/onboarding-gap-analysis-all-categories-2026-04-29.md`
- `docs/concierge-signup-ux-audit-Persona simplicité-Persona expert-suite-2026-04-26.md`
- `docs/concierge-ux-personas-analysis-2026-04-25.md`

Sources code:
- `src/app/components/layout/Home/MapWithSearch/MapWithSearch.tsx`
- `src/app/components/popups/ExperiencePopup/ExperiencePopup.tsx`
- `src/app/components/popups/CategoryPopup/CategoryPopup.tsx`
- `src/app/components/popups/AccessPopup/AccessPopup.tsx`
- `src/app/complete-registration/CompleteRegistrationPage.tsx`
- `src/app/dashboard/shared/categoryCompletion.ts`
- `src/app/api/auth/register/route.tsx`

Objectif: mettre a jour l'audit UX avec ce qui est maintenant en place, ce qui reste partiel, et ce qui bloque vraiment l'experience utilisateur.

---

## 1) Etat actuel du tunnel

Le parcours est maintenant structure en 5 temps:

1. Profil + localisation dans `MapWithSearch`.
2. Niveau d'experience dans `ExperiencePopup`.
3. Services/options dans `CategoryPopup`.
4. Coordonnees et details profil dans `AccessPopup`.
5. Creation du compte dans `CompleteRegistrationPage`.

Le tunnel repond donc mieux a l'objectif initial: eviter le gros formulaire unique et guider progressivement l'utilisateur.

---

## 2) Ce qui est maintenant fait

### Onboarding progressif
- Step textuel present sur les etapes 1, 2, 3, 4 et 5.
- Progressbar accessible sur l'etape 4 (`AccessPopup`) et l'etape 5 (`CompleteRegistrationPage`).
- Correction recente: le `progressbar` de `AccessPopup` a maintenant un nom accessible via `aria-label`.

### Concierge: personnalisation Persona simplicité / Persona expert
- Choix de mode dans `AccessPopup`:
  - `simple`,
  - `express`,
  - `business`.
- Promesse locale pour le mode simple.
- Promesse rapide pour le mode express.
- Promesse activite structuree pour le mode business.
- Collecte du rayon d'intervention pendant l'inscription.
- Valeur par defaut a 15 km sur la page de finalisation si categorie concierge et rayon absent.

### Finalisation et projection post-inscription
- Recapitulatif enrichi sur `CompleteRegistrationPage`.
- Bloc "Apres inscription, choisissez votre premiere action" pour les concierges:
  - creer un bien,
  - creer une offre,
  - inviter un proprietaire.
- Redirection par categorie apres inscription:
  - concierge vers `/dashboard/concierge`,
  - artisan vers `/dashboard/provider`,
  - proprietaire vers `/dashboard/owner`.

### Lisibilite
- Mode `Lisibilite +` present dans l'etape 1 et l'etape 5.
- Persistance dans `localStorage` via `planetls-readability-mode`.
- Application globale par `document.body.dataset.readability`.

### Completion dashboard
- Des cartes de completion existent deja cote dashboards.
- La completion concierge couvre notamment identite, experience, missions, zone, disponibilites, logement, proprietaires et finances selon les modules.

---

## 3) Ce qui reste partiel

### Stepper incomplet visuellement

Le stepper est coherent dans l'intention, mais pas encore homogene:
- etape 1: texte `Etape 1/5`, pas de barre de progression,
- etape 2: texte `Etape 2/5`, pas de barre de progression,
- etape 3: texte `Etape 3/5`, pas de barre de progression,
- etape 4: texte + progressbar,
- etape 5: texte + progressbar.

Decision UX recommandee: creer un composant commun `OnboardingStepper` reutilise sur les 5 etapes, avec `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`.

### Mode lisibilite pas expose partout

Le mode existe, mais il n'est visible que sur certaines etapes. Pour Persona simplicité, il doit rester disponible pendant tout le tunnel, surtout sur:
- `ExperiencePopup`,
- `CategoryPopup`,
- `AccessPopup`.

Decision UX recommandee: ajouter le meme controle `Lisibilite +` dans l'en-tete commun du stepper.

### Modes concierge encore dans la derniere grande popup

Le choix `simple / express / business` existe, mais il arrive a l'etape coordonnees. Pour Persona expert, l'entree express gagnerait a etre proposee plus tot, idealement juste apres l'experience.

Decision UX recommandee: si `experienceLevel === experimente`, suggerer le mode express avant la collecte longue.

### Proprietaire et artisan moins personnalises

Les ameliorations fortes sont surtout cote concierge. Les parcours proprietaire et artisan restent plus generiques:
- proprietaire: pas encore de choix d'objectif clair des le debut,
- artisan: pas encore de collecte metier complete type urgence, assurance, SIRET, creneaux.

Decision UX recommandee: ne pas elargir le tunnel concierge; creer deux variantes legeres dans `AccessPopup` par profil.

---

## 4) Risques UX prioritaires

### P0 - Conflit Git dans l'API register

`src/app/api/auth/register/route.tsx` contient des marqueurs de conflit (`<<<<<<<`, `=======`, `>>>>>>>`).

Impact utilisateur:
- inscription potentiellement cassee,
- build TypeScript bloque,
- impossible de valider le tunnel de bout en bout.

Action: resoudre ce conflit avant tout test UX final.

### P1 - Accessibilite modale incomplete

Points a verifier/corriger:
- `CategoryPopup` n'a pas encore `role="dialog"` ni `aria-modal="true"`.
- `ExperiencePopup` a `role="dialog"` mais pas de `aria-labelledby` explicite.
- `AccessPopup` a `role="dialog"` mais pas de `aria-labelledby` explicite.
- Les titres peuvent servir d'identifiants accessibles.

Action: ajouter des `id` sur les titres et relier chaque modale avec `aria-labelledby`.

### P1 - Retour et fermeture

Le retour existe entre etape 4 et etape 3, mais le parcours manque encore d'une navigation retour standardisee sur les etapes precedentes.

Action: definir une regle commune:
- fermer = abandonner le tunnel,
- retour = revenir a l'etape precedente,
- continuer = sauvegarder l'etape courante.

### P2 - Microcopie et encodage

Plusieurs textes affiches dans la console PowerShell apparaissent mal encodes. Si l'affichage navigateur est aussi touche, cela degrade fortement la confiance.

Action: verifier l'encodage reel en navigateur et normaliser les fichiers en UTF-8 si necessaire.

---

## 5) Backlog UX recommande

### Ticket 1 - Unifier le stepper onboarding

Critere d'acceptation:
- les 5 etapes affichent le meme composant de progression,
- chaque progressbar a un nom accessible,
- le texte et la valeur ARIA restent synchronises.

### Ticket 2 - Propager `Lisibilite +` sur toutes les popups

Critere d'acceptation:
- le bouton est present sur les etapes 1 a 5,
- l'etat est persistant,
- les popups lisent bien `body[data-readability="on"]`.

### Ticket 3 - Corriger les dialogues accessibles

Critere d'acceptation:
- chaque popup a `role="dialog"`,
- chaque popup a `aria-modal="true"`,
- chaque popup a `aria-labelledby` relie au titre visible,
- la fermeture clavier `Escape` fonctionne de facon coherente.

### Ticket 4 - Sortir l'express concierge plus tot

Critere d'acceptation:
- apres l'etape experience, un profil experimente voit une proposition "Mode express",
- le mode choisi est transmis jusqu'a `CompleteRegistrationPage`,
- la recap affiche clairement le parcours choisi.

### Ticket 5 - Ajouter objectifs proprietaire/artisan

Critere d'acceptation proprietaire:
- choix d'objectif: gestion complete, besoin ponctuel, comparer plusieurs concierges,
- recap final affiche cet objectif,
- le dashboard owner peut proposer la prochaine action pertinente.

Critere d'acceptation artisan:
- corps de metier, zone, urgence acceptee, creneaux,
- champs confiance optionnels: SIRET, assurance, photos,
- recap final distingue indispensable et optionnel.

---

## 6) Decision produit

Le tunnel est passe d'un MVP generique a un onboarding deja personnalise pour les concierges. La prochaine priorite n'est plus d'ajouter beaucoup de champs, mais de rendre l'experience plus coherente:

1. reparer le conflit API register,
2. unifier le stepper,
3. rendre toutes les modales accessibles,
4. rendre le mode lisibilite permanent,
5. etendre la personnalisation aux proprietaires et artisans.

