# Plan d'implementation - Profils utilisateurs

Date: 2026-06-19

## Objectif

Transformer l'audit utilisateurs en backlog actionnable, decoupe par themes et en tickets executables.

Perimetre:

- Proprietaire
- Concierge
- Artisan
- API profils
- Validation et permissions
- QA et mise en production

## Logique de decoupage

Chaque ticket ci-dessous doit etre:

- suffisamment petit pour etre pris en charge en une iteration courte
- testable
- livrable independamment si possible
- rattache a un theme metier ou technique clair

## Vue d'ensemble

Ordre recommande:

1. Cadrage cible et modelisation
2. Profil Artisan
3. Preferences Proprietaire
4. Durcissement API / validations / permissions
5. Harmonisation UI et completude
6. QA et deploiement

---

## Theme 1 - Cadrage cible des profils

### Ticket 1.1 - Definir la cible fonctionnelle par persona

But:

- figer ce qui compose un "profil complet" pour chaque role

A produire:

- liste des sections par persona
- liste des champs obligatoires et optionnels
- regles de completude

Definition of done:

- specification validee pour `Proprietaire`, `Concierge`, `Artisan`

Priorite:

- `P0`

### Ticket 1.2 - Cartographier les champs existants et les champs a migrer

But:

- relier les besoins cibles aux champs deja disponibles dans le code et la base

A produire:

- tableau `champ actuel -> usage -> role -> destination cible`
- identification des champs polymorphes a sortir de `availability_hours` ou `option`

Definition of done:

- cartographie de donnees exploitable par l'equipe dev

Priorite:

- `P0`

### Ticket 1.3 - Definir la strategie de migration des donnees profils

But:

- eviter de casser les profils existants pendant la refonte

A produire:

- regles de compatibilite
- ordre de migration
- cas legacy conserves temporairement

Definition of done:

- plan de migration approuve

Priorite:

- `P0`

---

## Theme 2 - Profil Artisan

### Ticket 2.1 - Creer la page `Profil Artisan` dediee

But:

- ne plus reutiliser uniquement la fiche generique

A produire:

- page artisan avec sections dediees
- navigation claire entre profil, metiers, zone, disponibilites, services

Definition of done:

- l'artisan dispose d'un ecran distinct de la fiche unifiee generique

Priorite:

- `P1`

Dependances:

- tickets `1.1`, `1.2`

### Ticket 2.2 - Ajouter la section `Metiers et specialites`

But:

- rendre editable le coeur du profil professionnel artisan

A produire:

- choix du ou des metiers
- specialites
- texte de presentation du savoir-faire

Definition of done:

- les metiers sont visibles, modifiables et persistants

Priorite:

- `P1`

### Ticket 2.3 - Ajouter la section `Zone d'intervention`

But:

- permettre a l'artisan de definir son perimetre terrain

A produire:

- zone principale
- rayon d'intervention
- ville / secteur de reference

Definition of done:

- la zone artisan est configurable et exploitable par les parcours aval

Priorite:

- `P1`

### Ticket 2.4 - Ajouter la section `Disponibilites`

But:

- faire passer les disponibilites d'une donnee backend peu visible a un vrai outil de pilotage

A produire:

- plages hebdomadaires
- disponibilite ponctuelle ou reguliere
- eventuelle gestion des urgences si retenue produit

Definition of done:

- les disponibilites artisan sont modifiables depuis l'interface

Priorite:

- `P1`

### Ticket 2.5 - Ajouter la section `Services proposes`

But:

- clarifier ce que l'artisan vend vraiment

A produire:

- liste de services
- categories de prestation
- eventuels forfaits ou types d'intervention

Definition of done:

- un artisan peut decrire ses services de maniere exploitable

Priorite:

- `P1`

### Ticket 2.6 - Ajouter la completude du profil artisan

But:

- donner un retour clair a l'utilisateur sur l'etat de sa fiche

A produire:

- score ou checklist de completude artisan
- message d'aide sur les informations manquantes

Definition of done:

- l'utilisateur voit clairement ce qui manque pour finaliser son profil

Priorite:

- `P2`

---

## Theme 3 - Preferences Proprietaire

### Ticket 3.1 - Creer la page `Preferences Proprietaire`

But:

- sortir les preferences du seul contexte demande / onboarding

A produire:

- page dediee
- sections structurees par besoin

Definition of done:

- les preferences proprietaire disposent d'un point d'entree stable dans le dashboard

Priorite:

- `P1`

Dependances:

- tickets `1.1`, `1.2`

### Ticket 3.2 - Ajouter la section `Objectifs de collaboration`

But:

- structurer le besoin du proprietaire de facon durable

A produire:

- objectif principal
- niveau de delegation
- type de collaboration souhaite

Definition of done:

- les informations actuellement porteuses dans les demandes peuvent etre enregistrees dans le profil

Priorite:

- `P1`

### Ticket 3.3 - Ajouter la section `Contexte d'exploitation`

But:

- conserver les preferences utiles a la mise en relation

A produire:

- type de bien
- volume / rythme estime
- attentes recurrentes

Definition of done:

- le profil proprietaire transporte le contexte utile sans reposer uniquement sur la derniere demande

Priorite:

- `P1`

### Ticket 3.4 - Reutiliser les preferences dans les demandes et la recherche

But:

- eviter la ressaisie et rendre le profil utile

A produire:

- pre-remplissage des demandes
- reutilisation dans les parcours de recherche ou matching

Definition of done:

- les preferences profil alimentent les parcours aval

Priorite:

- `P2`

### Ticket 3.5 - Ajouter la completude du profil proprietaire

But:

- harmoniser le pilotage du profil proprietaire avec les autres roles

A produire:

- checklist ou score de completude
- visibilite des manques

Definition of done:

- le proprietaire sait ce qui manque entre fiche, parc logements et preferences

Priorite:

- `P2`

---

## Theme 4 - Refactor API et modele de donnees

### Ticket 4.1 - Introduire des schemas de validation par role

But:

- ne plus accepter un payload trop transversal sans garde-fous

A produire:

- schema `owner`
- schema `concierge`
- schema `artisan/provider`

Definition of done:

- les mises a jour profils sont validees selon la persona

Priorite:

- `P1`

Dependances:

- tickets `1.1`, `1.2`, `1.3`

### Ticket 4.2 - Isoler les donnees metier legacy stockees dans `availability_hours`

But:

- reduire la dette de modelisation

A produire:

- identification des sous-structures a extraire
- plan de lecture / ecriture compatible

Definition of done:

- les nouvelles donnees critiques ne dependent plus uniquement d'un JSON polymorphe

Priorite:

- `P1`

### Ticket 4.3 - Clarifier le role de `option`, `category`, `search_target`

But:

- eviter les champs "fourre-tout"

A produire:

- semantics cibles
- usages supprimes ou conserves
- normalisation de la lecture et de l'ecriture

Definition of done:

- chaque champ transversal a une responsabilite claire

Priorite:

- `P1`

### Ticket 4.4 - Ajouter des endpoints ou sous-routes par domaine si necessaire

But:

- mieux separer le cycle de vie des profils

A produire:

- endpoints dedies si le `PATCH /api/profiles` devient trop generaliste

Definition of done:

- les operations metier majeures ne sont plus toutes concentrees dans un seul endpoint ambigu

Priorite:

- `P2`

---

## Theme 5 - Permissions et regles de mise a jour

### Ticket 5.1 - Formaliser les champs modifiables par role

But:

- encadrer precisement ce qu'un utilisateur peut changer

A produire:

- matrice `role -> champs modifiables`

Definition of done:

- la logique d'autorisation est documentee et exploitable en code

Priorite:

- `P1`

### Ticket 5.2 - Appliquer les restrictions de mise a jour dans l'API

But:

- aligner le backend sur les regles metier

A produire:

- filtrage des payloads
- refus explicite des champs non autorises

Definition of done:

- un role ne peut plus modifier des champs hors de son perimetre

Priorite:

- `P1`

### Ticket 5.3 - Ajouter les tests de permissions profils

But:

- eviter les regressions silencieuses

A produire:

- tests `owner`
- tests `concierge`
- tests `artisan/provider`
- tests `admin` si applicable

Definition of done:

- les cas critiques de permission sont couverts

Priorite:

- `P1`

---

## Theme 6 - Harmonisation UI et experience

### Ticket 6.1 - Harmoniser la structure des pages profils

But:

- donner une logique commune sans uniformiser a outrance

A produire:

- sections comparables par role
- vocabulaire coherent
- pattern d'edition stable

Definition of done:

- les pages profils semblent appartenir a la meme plateforme tout en respectant chaque metier

Priorite:

- `P2`

### Ticket 6.2 - Uniformiser les indicateurs de completude

But:

- rendre la progression lisible par tous

A produire:

- regles communes de score
- messages d'etat harmonises

Definition of done:

- les trois personas ont une logique de completude comprensible et comparable

Priorite:

- `P2`

### Ticket 6.3 - Ajouter les aides contextuelles et messages de guidance

But:

- reduire la friction de remplissage

A produire:

- textes d'aide
- placeholders et recommandations
- CTA vers la prochaine etape utile

Definition of done:

- l'utilisateur comprend pourquoi remplir le profil et ce que cela debloque

Priorite:

- `P2`

---

## Theme 7 - QA, migration et mise en production

### Ticket 7.1 - Ecrire la checklist QA profils par persona

But:

- verifier le bon fonctionnement reel des trois parcours

A produire:

- checklist `Proprietaire`
- checklist `Concierge`
- checklist `Artisan`

Definition of done:

- chaque profil peut etre teste de bout en bout

Priorite:

- `P1`

### Ticket 7.2 - Tester la compatibilite des donnees legacy

But:

- garantir que les profils existants restent lisibles et editables

A produire:

- cas de test sur anciens profils
- verification des fallbacks

Definition of done:

- pas de regression majeure sur les comptes existants

Priorite:

- `P1`

### Ticket 7.3 - Preparer le plan de release

But:

- de-risquer la mise en production

A produire:

- ordre de deploiement
- migration eventuelle
- rollback ou garde-fous

Definition of done:

- plan de livraison valide

Priorite:

- `P2`

---

## Proposition de lots de livraison

### Lot 1 - Foundations

- `1.1`
- `1.2`
- `1.3`
- `4.1`
- `5.1`

Resultat attendu:

- cible claire
- modelisation stabilisee
- permissions clarifiees

### Lot 2 - Profil Artisan

- `2.1`
- `2.2`
- `2.3`
- `2.4`
- `2.5`
- `2.6`

Resultat attendu:

- un vrai profil metier artisan enfin exploitable

### Lot 3 - Preferences Proprietaire

- `3.1`
- `3.2`
- `3.3`
- `3.4`
- `3.5`

Resultat attendu:

- un profil proprietaire plus durable, reutilisable et moins dependant du parcours demande

### Lot 4 - Durcissement technique

- `4.2`
- `4.3`
- `4.4`
- `5.2`
- `5.3`

Resultat attendu:

- reduction de la dette technique sur le modele profils

### Lot 5 - Finition et mise en production

- `6.1`
- `6.2`
- `6.3`
- `7.1`
- `7.2`
- `7.3`

Resultat attendu:

- experience harmonisee
- verification complete
- release preparee

## Tickets a lancer en premier

Si l'objectif est d'avancer sans se disperser, je recommande de lancer d'abord:

1. `1.1 - Definir la cible fonctionnelle par persona`
2. `1.2 - Cartographier les champs existants et les champs a migrer`
3. `2.1 - Creer la page Profil Artisan dediee`
4. `3.1 - Creer la page Preferences Proprietaire`
5. `4.1 - Introduire des schemas de validation par role`

## Conclusion

Ce plan permet de convertir l'audit en feuille de route concrete.

Le fil directeur est simple:

- on clarifie la cible
- on comble d'abord le retard artisan
- on stabilise ensuite les preferences proprietaire
- on durcit enfin la couche technique et les permissions

Le plus important est d'eviter une nouvelle extension de la fiche generique actuelle, et de construire des profils vraiment penses par persona.
