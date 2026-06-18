# Audit Utilisateurs - Gestion complete des profils

Date: 2026-06-18

## Perimetre

Audit cible sur les profils utilisateurs et leur niveau reel de couverture dans l'application:

- Proprietaire
  - profil
  - logements
  - preferences
- Concierge
  - profil
  - zone d'intervention
  - services
- Artisan
  - profil
  - metiers
  - disponibilites

Livrable attendu: evaluation de la "gestion complete des profils".

## Synthese executive

La gestion complete des profils n'est pas encore atteinte de maniere homogene.

- Concierge: niveau le plus abouti, proche d'un module complet.
- Proprietaire: socle present, surtout bon sur les logements, mais les preferences restent dispersees.
- Artisan: couverture insuffisante sur le profil metier, les metiers et les disponibilites.

Verdict global:

- Concierge: `Partiellement atteint` a `quasi atteint`
- Proprietaire: `Partiellement atteint`
- Artisan: `Non atteint`
- Gestion complete des profils, toutes personas confondues: `Non atteint`

## Matrice de couverture

| Role | Domaine | Etat | Commentaire |
| --- | --- | --- | --- |
| Proprietaire | Profil | Partiel | Ecran fonctionnel mais generique, sans sous-modules metier dedies |
| Proprietaire | Logements | Bon | Parc, checklist de completude, guidage de correction presents |
| Proprietaire | Preferences | Faible | Preferences surtout modelisees dans les demandes, pas dans un vrai profil durable |
| Concierge | Profil | Bon | Ecran riche, edition avancee, progression metier |
| Concierge | Zone d'intervention | Bon | Gestion dediee, logique de zone et rayon presentes |
| Concierge | Services | Bon | Services actifs et logique metier presentes |
| Concierge | Disponibilites | Bon | Gestion structuree, mais adossee a un JSON polymorphe |
| Artisan | Profil | Partiel | Fiche generique seulement |
| Artisan | Metiers | Faible | Donnees implicites, pas de veritable gestion dediee |
| Artisan | Disponibilites | Faible | Donnees exposees en API, mais peu ou pas pilotables dans l'UI |

## Constats prioritaires

### 1. Le profil artisan n'a pas encore de vraie gestion metier

Le point de blocage principal est l'absence d'un module artisan comparable au module concierge.

References:

- [src/app/dashboard/provider/settings/page.tsx](C:/Users/ADMIN/Desktop/planetls-beta/src/app/dashboard/provider/settings/page.tsx:1)
- [src/app/components/dashboard/profile/EditableUnifiedProfilePage.tsx](C:/Users/ADMIN/Desktop/planetls-beta/src/app/components/dashboard/profile/EditableUnifiedProfilePage.tsx:31)
- [src/app/api/provider/workspace/route.ts](C:/Users/ADMIN/Desktop/planetls-beta/src/app/api/provider/workspace/route.ts:18)

Constat:

- L'ecran artisan reutilise une fiche unifiee generique.
- Les champs metier attendus pour un artisan ne sont pas portes par une experience dediee.
- L'API expose deja `availability_hours`, `service_area`, `service_radius_km` et `category`, mais l'interface ne transforme pas ce socle en vrai pilotage produit.

Impact:

- Le role artisan ne dispose pas d'une fiche exploitable comme profil professionnel complet.
- Les metiers et disponibilites sont sous-exposes.
- La promesse "gestion complete des profils" n'est pas tenue pour cette persona.

### 2. Le profil proprietaire existe, mais les preferences ne sont pas un module stable

Le proprietaire a bien une fiche et un bon module logements, mais ses preferences ne vivent pas encore comme un veritable sous-domaine de profil.

References:

- [src/app/dashboard/owner/settings/page.tsx](C:/Users/ADMIN/Desktop/planetls-beta/src/app/dashboard/owner/settings/page.tsx:6)
- [src/app/components/dashboard/profile/EditableUnifiedProfilePage.tsx](C:/Users/ADMIN/Desktop/planetls-beta/src/app/components/dashboard/profile/EditableUnifiedProfilePage.tsx:80)
- [src/app/lib/serviceRequestBrief.ts](C:/Users/ADMIN/Desktop/planetls-beta/src/app/lib/serviceRequestBrief.ts:1)
- [src/features/onboarding-assistant/onboardingPayload.ts](C:/Users/ADMIN/Desktop/planetls-beta/src/features/onboarding-assistant/onboardingPayload.ts:1)

Constat:

- Le profil proprietaire repose sur la meme base generique que l'artisan.
- Les preferences metier sont surtout capturees lors des demandes ou de l'onboarding.
- On trouve les concepts utiles (`ownerGoal`, `collaborationType`, `frequency`, `responsibilityLevel`, `propertyTypes`, `needVolume`), mais ils sont rattaches au parcours de demande ou a des payloads d'onboarding, pas a une brique "Preferences proprietaire".

Impact:

- Les preferences sont difficiles a relire, modifier, reutiliser et versionner.
- Le systeme manque d'un point d'entree unique pour les attentes du proprietaire.
- Le matching et la personnalisation risquent de rester dependants du dernier parcours effectue.

### 3. Le concierge est le role le plus mature, mais encore appuye sur un modele de donnees trop polymorphe

Le concierge dispose aujourd'hui du meilleur niveau de couverture, avec un vrai espace de configuration metier.

References:

- [src/app/dashboard/concierge/profile/ConciergeProfilePage.tsx](C:/Users/ADMIN/Desktop/planetls-beta/src/app/dashboard/concierge/profile/ConciergeProfilePage.tsx:1867)
- [src/app/dashboard/shared/categoryCompletion.ts](C:/Users/ADMIN/Desktop/planetls-beta/src/app/dashboard/shared/categoryCompletion.ts:96)

Constat:

- Le profil, la zone, les services et les disponibilites sont bien presents.
- La logique fonctionnelle est riche et exploitable.
- En revanche, une partie importante du modele est encore stockee dans `availability_hours` sous forme JSON, avec `option` utilise comme fallback pour certains services.

Impact:

- Le module fonctionne bien en surface.
- La maintenance, les validations et les evolutions seront plus couteuses.
- Le risque d'incoherence entre lecture, ecriture et calcul de completude reste eleve.

### 4. Le module logements proprietaire est le plus robuste apres le concierge

La gestion des logements est l'element le plus mature du profil proprietaire.

References:

- [src/app/components/dashboard/housing/HousingListPage.tsx](C:/Users/ADMIN/Desktop/planetls-beta/src/app/components/dashboard/housing/HousingListPage.tsx:106)

Constat:

- Il existe une checklist claire de completude.
- Le mode "a revoir" aide a corriger les fiches incompletes.
- Les informations cles du bien sont bien prises en compte: nom, ville, photo, capacite, equipements, description, statut.

Impact:

- Bonne base pour la gestion du parc proprietaire.
- Bonne lisibilite des manques pour l'utilisateur.
- Limite actuelle: la completude est principalement portee par l'UI, pas encore par une couche de validation de domaine centralisee.

### 5. L'API de profil reste trop transversale pour supporter proprement trois personas metier

Le coeur technique repose sur une API unique qui accepte de nombreux champs heterogenes pour tous les roles.

Reference:

- [src/app/api/profiles/route.ts](C:/Users/ADMIN/Desktop/planetls-beta/src/app/api/profiles/route.ts:69)

Constat:

- Le meme endpoint accepte des champs d'identite, de presentation, de localisation, de metier, de disponibilite, de tarification et de facturation.
- La validation reste relativement souple.
- Le modele n'impose pas une separation claire entre ce qui releve du proprietaire, du concierge et de l'artisan.

Impact:

- Dette de modelisation.
- Risque de payloads incomplets ou incoherents selon la persona.
- Difficulte a faire evoluer les permissions et la QA par role.

## Evaluation detaillee par role

### Proprietaire

#### Profil

Etat: `Partiel`

Points forts:

- edition simple disponible
- informations de base utilisables
- reutilisation coherente dans certains parcours

Manques:

- absence de sections metier dediees
- pas de lecture claire des attentes de collaboration
- pas de separation nette entre identite, preferences et contexte d'exploitation

#### Logements

Etat: `Bon`

Points forts:

- gestion de parc presente
- logique de completude utile
- UX de correction deja exploitable

Manques:

- validation de domaine encore trop distribuee dans le front
- articulation a clarifier avec les preferences et les demandes

#### Preferences

Etat: `Faible`

Points forts:

- concepts metier deja presents dans les parcours de demande
- donnees d'onboarding existantes

Manques:

- pas d'ecran "Preferences proprietaire"
- pas de persistence claire d'un profil de collaboration durable
- pas de gouvernance unique de ces donnees

### Concierge

#### Profil

Etat: `Bon`

Points forts:

- couverture metier riche
- edition par sections
- progression et completude suivies

Manques:

- structure de donnees encore trop polymorphe

#### Zone d'intervention

Etat: `Bon`

Points forts:

- edition dediee
- notion de zone, rayon et localisation

Manques:

- dependance a une structure JSON interne pour certaines lectures

#### Services

Etat: `Bon`

Points forts:

- presence de services actifs
- logique exploitable pour la mise en relation

Manques:

- fallback partiel via `option`, signe d'une transition de modele non totalement finalisee

#### Disponibilites

Etat: `Bon`

Points forts:

- plages et disponibilites bien presentes
- exploitees dans les calculs de completude

Manques:

- stockage trop polyvalent dans `availability_hours`

### Artisan

#### Profil

Etat: `Partiel`

Points forts:

- fiche de base disponible
- structure de compte exploitable

Manques:

- pas de module profil metier
- peu de signal professionnel visible

#### Metiers

Etat: `Faible`

Points forts:

- existence de `category` et de notions de `tradeBody` a l'onboarding

Manques:

- pas de gestion dediee des metiers, specialites ou domaines d'intervention
- pas de presentation structuree du savoir-faire

#### Disponibilites

Etat: `Faible`

Points forts:

- champs exposes en backend

Manques:

- pas d'UI metier equivalente au concierge
- pas de pilotage simple des plages, urgences ou perimetres d'intervention

## Risques produit et technique

- Incoherence entre personas: l'utilisateur peut percevoir une plateforme tres complete cote concierge et tres partielle cote artisan.
- Dette de modelisation: plusieurs concepts metier sont stockes dans des champs transverses ou des payloads JSON.
- Dette UX: absence de lecture unifiee des profils par role.
- Dette permissionnelle future: plus le modele reste melange, plus il devient difficile d'encadrer proprement les droits et validations par persona.

## Recommandations prioritaires

### Priorite 1 - Creer un vrai module Profil Artisan

Objectif:

- donner a l'artisan un niveau de maturite proche du concierge

A couvrir:

- profil professionnel
- metiers et specialites
- zone d'intervention
- disponibilites
- services proposes

### Priorite 2 - Creer un module Preferences Proprietaire

Objectif:

- sortir les preferences du seul contexte "demande"

A couvrir:

- objectifs de collaboration
- niveau de delegation souhaite
- frequence cible
- type de bien et volume
- attentes de service recurrentes

### Priorite 3 - Normaliser le modele de donnees par persona

Objectif:

- limiter la dependance aux champs polymorphes comme `availability_hours` et `option`

A viser:

- separation claire des donnees d'identite
- separation des donnees metier par role
- validations par persona

### Priorite 4 - Renforcer l'API de profil

Objectif:

- eviter qu'un endpoint transversal serve indistinctement trois profils metier differents

A viser:

- schemas par role
- validation stricte
- permissions de mise a jour explicites

## Backlog propose

### P0

- Concevoir la cible fonctionnelle "Gestion complete des profils" par persona
- Definir la structure attendue du profil artisan
- Definir la structure attendue des preferences proprietaire

### P1

- Implementer un ecran `Profil Artisan` dedie
- Implementer un ecran `Preferences Proprietaire` dedie
- Extraire la logique metier critique hors de `availability_hours` quand elle merite une structure stable

### P2

- Revoir `PATCH /api/profiles` pour introduire des validations par role
- Centraliser les regles de completude cote domaine
- Harmoniser les indicateurs de progression entre proprietaire, concierge et artisan

## Conclusion

Si le livrable cible est "Gestion complete des profils", la plateforme dispose d'une base solide mais tres asymetrique.

- Le concierge sert de reference produit.
- Le proprietaire est correct sur le parc logements mais incomplet sur la couche preferences.
- L'artisan reste le principal chantier.

Le prochain cap logique est donc de reduire cet ecart de maturite entre personas, plutot que d'ajouter de nouvelles variations sur la fiche generique existante.
