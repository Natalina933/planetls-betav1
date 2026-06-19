# GitHub Issues - Profils utilisateurs

Date: 2026-06-19

## Usage

Chaque bloc ci-dessous peut devenir une GitHub Issue.

Champs proposes:

- `Title`
- `Labels`
- `Priority`
- `Context`
- `Scope`
- `Acceptance Criteria`

Ordre recommande:

1. Cadrage et modelisation
2. Profil Artisan
3. Preferences Proprietaire
4. API / validations / permissions
5. QA / harmonisation

---

## Issue 1

**Title**

Definir la cible fonctionnelle des profils par persona

**Labels**

`profil`, `product`, `owner`, `concierge`, `artisan`, `p0`

**Priority**

P0

**Context**

La plateforme ne dispose pas encore d'une definition stable de ce qu'est un "profil complet" pour chaque persona. Cette issue sert a figer la cible avant implementation.

**Scope**

- definir les sections attendues pour `Proprietaire`
- definir les sections attendues pour `Concierge`
- definir les sections attendues pour `Artisan`
- identifier les champs obligatoires, recommandes et optionnels
- definir les regles de completude par role

**Acceptance Criteria**

- une specification cible existe pour les 3 personas
- les sections et champs attendus sont listes
- les regles de completude sont explicites
- le document est exploitable par design, produit et dev

---

## Issue 2

**Title**

Cartographier les champs profils existants et les champs a migrer

**Labels**

`profil`, `api`, `data`, `tech-debt`, `p0`

**Priority**

P0

**Context**

Les donnees profils sont aujourd'hui reparties entre champs transverses, onboarding, demandes et JSON polymorphes. Il faut etablir une cartographie fiable avant refonte.

**Scope**

- recenser les champs utilises par `owner`, `concierge`, `artisan/provider`
- documenter les usages de `availability_hours`, `option`, `category`, `search_target`
- produire une correspondance `champ actuel -> usage -> cible`

**Acceptance Criteria**

- tous les champs profils utiles sont listes
- les champs legacy sont identifies
- les champs a migrer ou a normaliser sont explicites
- la cartographie est utilisable comme base de refactor

---

## Issue 3

**Title**

Definir la strategie de migration des donnees profils legacy

**Labels**

`profil`, `data`, `migration`, `tech-debt`, `p0`

**Priority**

P0

**Context**

La refonte profils ne doit pas casser les comptes existants ni les parcours deja actifs.

**Scope**

- definir les regles de compatibilite temporaire
- lister les donnees a migrer plus tard
- definir l'ordre de migration et les fallbacks

**Acceptance Criteria**

- une strategie de migration est documentee
- les cas legacy critiques sont identifies
- les fallbacks temporaires sont assumes et limites

---

## Issue 4

**Title**

Creer une page Profil Artisan dediee

**Labels**

`profil`, `artisan`, `frontend`, `dashboard`, `p1`

**Priority**

P1

**Context**

Le role artisan repose aujourd'hui surtout sur une fiche generique. Il faut un vrai module metier dedie.

**Scope**

- creer un ecran distinct de la fiche generique
- structurer la page avec sections metier
- preparer l'integration avec metiers, zone, disponibilites, services

**Acceptance Criteria**

- un artisan accede a une page profil dediee
- la page n'est plus uniquement une reutilisation de la fiche unifiee
- la structure est prete pour les sections metier

---

## Issue 5

**Title**

Ajouter la section Metiers et specialites au Profil Artisan

**Labels**

`profil`, `artisan`, `frontend`, `backend`, `p1`

**Priority**

P1

**Context**

Le coeur du profil artisan doit permettre de decrire clairement le savoir-faire.

**Scope**

- permettre de renseigner le ou les metiers
- permettre de renseigner les specialites
- ajouter une presentation metier exploitable

**Acceptance Criteria**

- les metiers sont visibles et modifiables
- les specialites sont persistantes
- la fiche artisan expose clairement le savoir-faire

---

## Issue 6

**Title**

Ajouter la section Zone d'intervention au Profil Artisan

**Labels**

`profil`, `artisan`, `frontend`, `backend`, `geo`, `p1`

**Priority**

P1

**Context**

L'artisan doit pouvoir declarer son perimetre d'action de facon simple et exploitable.

**Scope**

- zone principale
- rayon d'intervention
- ville ou secteur de reference

**Acceptance Criteria**

- la zone d'intervention est editable
- les donnees sont persistantes
- les informations sont reutilisables par les parcours aval

---

## Issue 7

**Title**

Ajouter la section Disponibilites au Profil Artisan

**Labels**

`profil`, `artisan`, `frontend`, `backend`, `planning`, `p1`

**Priority**

P1

**Context**

Les disponibilites artisan existent partiellement cote donnees mais ne sont pas pilotees comme une vraie fonction de profil.

**Scope**

- plages hebdomadaires
- disponibilite reguliere ou ponctuelle
- option urgences si retenue

**Acceptance Criteria**

- les disponibilites sont modifiables dans l'UI
- les donnees sont sauvegardees
- le profil artisan devient exploitable pour le matching ou la planification

---

## Issue 8

**Title**

Ajouter la section Services proposes au Profil Artisan

**Labels**

`profil`, `artisan`, `services`, `frontend`, `backend`, `p1`

**Priority**

P1

**Context**

Un artisan doit pouvoir declarer clairement ce qu'il propose, sans rester au niveau d'une simple categorie.

**Scope**

- liste de services
- categories de prestation
- types d'intervention ou forfaits si necessaire

**Acceptance Criteria**

- un artisan peut renseigner ses services
- les services sont lisibles dans le profil
- les donnees sont exploitables par les parcours de recherche ou operationnels

---

## Issue 9

**Title**

Ajouter une logique de completude au Profil Artisan

**Labels**

`profil`, `artisan`, `ux`, `frontend`, `p2`

**Priority**

P2

**Context**

L'utilisateur doit savoir ce qui manque pour finaliser son profil.

**Scope**

- checklist ou score de completude
- messages sur les champs manquants
- incitation vers la prochaine action utile

**Acceptance Criteria**

- le profil artisan affiche son niveau de completude
- les manques sont compréhensibles
- l'utilisateur sait quoi completer ensuite

---

## Issue 10

**Title**

Creer une page Preferences Proprietaire dediee

**Labels**

`profil`, `owner`, `frontend`, `dashboard`, `p1`

**Priority**

P1

**Context**

Les preferences proprietaire sont surtout captees dans les demandes et l'onboarding. Il faut un point d'entree stable dans le dashboard.

**Scope**

- creer une page dediee
- structurer les sections preferences
- preparer le lien avec les demandes et la recherche

**Acceptance Criteria**

- le proprietaire accede a une page preferences dediee
- les preferences ne vivent plus uniquement dans les demandes
- la page est coherente avec le reste du dashboard

---

## Issue 11

**Title**

Ajouter la section Objectifs de collaboration aux Preferences Proprietaire

**Labels**

`profil`, `owner`, `matching`, `frontend`, `backend`, `p1`

**Priority**

P1

**Context**

Le proprietaire doit pouvoir enregistrer durablement son objectif de collaboration, sans devoir tout ressaisir a chaque demande.

**Scope**

- objectif principal
- niveau de delegation
- type de collaboration souhaite

**Acceptance Criteria**

- ces preferences sont editables
- elles sont persistantes
- elles peuvent etre reutilisees dans les demandes

---

## Issue 12

**Title**

Ajouter la section Contexte d'exploitation aux Preferences Proprietaire

**Labels**

`profil`, `owner`, `frontend`, `backend`, `p1`

**Priority**

P1

**Context**

Le profil proprietaire doit porter un minimum de contexte metier pour guider la mise en relation.

**Scope**

- type de bien
- volume ou rythme estime
- attentes recurrentes
- cadre general d'exploitation

**Acceptance Criteria**

- le contexte d'exploitation est editable
- les informations sont persistantes
- elles sont reutilisables dans les parcours aval

---

## Issue 13

**Title**

Pre-remplir les demandes a partir des Preferences Proprietaire

**Labels**

`profil`, `owner`, `demandes`, `ux`, `frontend`, `backend`, `p2`

**Priority**

P2

**Context**

Les preferences proprietaire ne seront utiles que si elles reduisent la ressaisie dans les demandes.

**Scope**

- pre-remplir les champs de demande depuis le profil
- reutiliser les preferences dans les parcours owner
- conserver la possibilite d'ajustement ponctuel

**Acceptance Criteria**

- une demande peut se baser sur les preferences profil
- le proprietaire ne doit pas tout ressaisir
- les preferences restent modifiables au cas par cas

---

## Issue 14

**Title**

Ajouter une logique de completude au profil Proprietaire

**Labels**

`profil`, `owner`, `ux`, `frontend`, `p2`

**Priority**

P2

**Context**

Le proprietaire doit comprendre ce qui manque entre sa fiche, ses logements et ses preferences.

**Scope**

- score ou checklist profil
- visibilité des manques
- lien avec logements et preferences

**Acceptance Criteria**

- le proprietaire voit son niveau de completude
- les manques sont clairs
- l'interface guide vers les sections a completer

---

## Issue 15

**Title**

Introduire des schemas de validation profils par role

**Labels**

`api`, `profil`, `validation`, `security`, `p1`

**Priority**

P1

**Context**

Le endpoint de profil accepte aujourd'hui un payload trop transversal. Il faut valider les mises a jour selon la persona.

**Scope**

- schema `owner`
- schema `concierge`
- schema `artisan/provider`
- validation explicite des champs attendus

**Acceptance Criteria**

- les payloads profils sont valides par role
- les champs inattendus sont rejetes ou ignores explicitement
- les erreurs de validation sont compréhensibles

---

## Issue 16

**Title**

Clarifier et normaliser l'usage des champs transverses `option`, `category`, `search_target`

**Labels**

`api`, `profil`, `data`, `tech-debt`, `p1`

**Priority**

P1

**Context**

Certains champs ont aujourd'hui des usages multiples ou ambigus. Il faut leur redonner une responsabilité claire.

**Scope**

- documenter le role cible de chaque champ
- supprimer les interpretations ambiguës si possible
- harmoniser lecture et ecriture

**Acceptance Criteria**

- chaque champ transversal a une responsabilite claire
- les usages legacy restants sont documentes
- le code n'introduit plus de nouveaux usages ambigus

---

## Issue 17

**Title**

Reduire la dependance aux donnees polymorphes stockees dans `availability_hours`

**Labels**

`api`, `data`, `tech-debt`, `concierge`, `artisan`, `p1`

**Priority**

P1

**Context**

Une partie des donnees metier est encore stockee dans un JSON polyvalent, ce qui rend les evolutions et validations plus fragiles.

**Scope**

- identifier les donnees critiques a extraire
- definir une lecture/ecriture compatible pendant transition
- limiter les nouveaux usages de ce champ comme conteneur generique

**Acceptance Criteria**

- les nouvelles donnees critiques ne reposent plus uniquement sur `availability_hours`
- un plan de compatibilite est en place
- la dette technique diminue au lieu de s'etendre

---

## Issue 18

**Title**

Formaliser la matrice des champs modifiables par role

**Labels**

`permissions`, `profil`, `security`, `backend`, `p1`

**Priority**

P1

**Context**

Il faut savoir precisement qui peut modifier quoi sur les profils.

**Scope**

- definir `owner -> champs modifiables`
- definir `concierge -> champs modifiables`
- definir `artisan/provider -> champs modifiables`
- definir `admin` si necessaire

**Acceptance Criteria**

- une matrice claire existe
- les ambiguïtés sont levees
- la matrice peut etre utilisee en code et en QA

---

## Issue 19

**Title**

Appliquer les restrictions de mise a jour profils dans l'API

**Labels**

`permissions`, `profil`, `backend`, `security`, `p1`

**Priority**

P1

**Context**

Les permissions de mise a jour doivent etre enforcees cote serveur, pas seulement implicites dans l'UI.

**Scope**

- filtrer les payloads selon le role
- refuser les mises a jour hors perimetre
- journaliser ou signaler les cas invalides si utile

**Acceptance Criteria**

- un role ne peut plus modifier des champs hors scope
- l'API repond clairement en cas d'ecriture interdite
- les comportements sont alignes avec la matrice de permissions

---

## Issue 20

**Title**

Ajouter des tests de validation et permissions sur les profils

**Labels**

`tests`, `profil`, `permissions`, `api`, `p1`

**Priority**

P1

**Context**

La refonte profils doit etre protegee contre les regressions backend.

**Scope**

- tests de validation par role
- tests de permission par role
- cas admin si applicable

**Acceptance Criteria**

- les cas critiques sont couverts
- une regression de permission echoue en test
- les parcours owner / concierge / artisan sont verifies

---

## Issue 21

**Title**

Harmoniser la structure UX des pages profils par persona

**Labels**

`ux`, `frontend`, `profil`, `owner`, `concierge`, `artisan`, `p2`

**Priority**

P2

**Context**

Les profils doivent avoir une grammaire commune sans perdre leur logique metier propre.

**Scope**

- sections comparables
- vocabulaire cohérent
- pattern d'edition stable

**Acceptance Criteria**

- les pages profils semblent appartenir au meme produit
- chaque persona garde ses sections metier
- la navigation est plus previsible

---

## Issue 22

**Title**

Uniformiser les indicateurs de completude entre Proprietaire, Concierge et Artisan

**Labels**

`ux`, `frontend`, `profil`, `dashboard`, `p2`

**Priority**

P2

**Context**

Les trois personas doivent beneficier d'une logique de progression lisible et comparable.

**Scope**

- harmoniser la logique de score ou checklist
- harmoniser les messages d'etat
- aligner la lisibilite des manques

**Acceptance Criteria**

- les 3 roles ont une logique de completude claire
- les messages sont cohérents
- les prochaines actions utiles sont visibles

---

## Issue 23

**Title**

Ecrire une checklist QA profils par persona

**Labels**

`qa`, `profil`, `owner`, `concierge`, `artisan`, `p1`

**Priority**

P1

**Context**

La refonte profils doit etre verifiable de bout en bout sur chaque role.

**Scope**

- checklist `Proprietaire`
- checklist `Concierge`
- checklist `Artisan`
- cas de creation, edition, lecture, completude

**Acceptance Criteria**

- chaque role dispose d'une checklist QA
- les scenarios critiques sont couverts
- la checklist est exploitable avant release

---

## Issue 24

**Title**

Verifier la compatibilite des profils legacy apres refonte

**Labels**

`qa`, `migration`, `profil`, `tech-debt`, `p1`

**Priority**

P1

**Context**

Les comptes existants doivent rester utilisables pendant et apres la transition.

**Scope**

- tester les anciens profils
- verifier les fallbacks
- verifier la relecture et la reedition des donnees

**Acceptance Criteria**

- les profils legacy restent lisibles
- les profils legacy restent editables
- les regressions majeures sont detectees avant mise en production

---

## Issue 25

**Title**

Preparer le plan de release de la refonte Profils

**Labels**

`release`, `profil`, `ops`, `qa`, `p2`

**Priority**

P2

**Context**

La refonte profils touche au coeur des comptes utilisateurs et demande un minimum de garde-fous avant deploiement.

**Scope**

- definir l'ordre de livraison
- cadrer migrations ou activations progressives
- prevoir plan de rollback ou garde-fous

**Acceptance Criteria**

- un plan de release existe
- l'ordre de deploiement est clair
- les risques majeurs sont identifies

---

## Top 8 issues a creer en premier

Si tu veux aller au plus utile dans GitHub, cree d'abord:

1. `Definir la cible fonctionnelle des profils par persona`
2. `Cartographier les champs profils existants et les champs a migrer`
3. `Definir la strategie de migration des donnees profils legacy`
4. `Creer une page Profil Artisan dediee`
5. `Creer une page Preferences Proprietaire dediee`
6. `Introduire des schemas de validation profils par role`
7. `Formaliser la matrice des champs modifiables par role`
8. `Ajouter des tests de validation et permissions sur les profils`

## Labels GitHub conseilles

Tu peux creer ces labels si tu veux garder un backlog propre:

- `profil`
- `owner`
- `concierge`
- `artisan`
- `frontend`
- `backend`
- `api`
- `permissions`
- `qa`
- `ux`
- `tech-debt`
- `migration`
- `release`
- `p0`
- `p1`
- `p2`
