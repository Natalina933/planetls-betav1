# Specification cible - Profils par persona

Date: 2026-06-19

## Objectif

Definir la cible fonctionnelle des profils utilisateurs pour les trois personas principales:

- Proprietaire
- Concierge
- Artisan

Cette specification sert de base pour:

- l'issue GitHub `#10`
- la refonte des ecrans profils
- la normalisation du modele de donnees
- les futures validations et permissions par role

## Principes directeurs

### 1. Un profil doit etre pense par persona

Un meme socle technique peut exister, mais l'experience, la structure et les champs utiles doivent suivre le metier.

### 2. Le profil n'est pas seulement une fiche identitaire

Le profil doit aussi porter:

- le contexte metier
- les preferences utiles
- la capacite operationnelle
- les donnees reutilisables dans les autres parcours

### 3. La completude doit etre lisible

Chaque role doit comprendre:

- ce qui est requis
- ce qui est recommande
- ce qui manque
- ce que le remplissage debloque dans le produit

### 4. Les sections doivent etre stables

Il faut eviter que des informations critiques vivent uniquement:

- dans l'onboarding
- dans les demandes
- dans des payloads JSON polyvalents

## Niveaux de champs

- `Obligatoire`: necessaire pour considerer le profil comme exploitable
- `Recommande`: renforce la qualite du profil et l'usage produit
- `Optionnel`: utile mais non bloquant

## Persona 1 - Proprietaire

### Structure cible

Le profil proprietaire doit etre organise en 3 blocs:

1. Profil
2. Logements
3. Preferences

### Tableau cible

| Section | Champs cibles | Niveau | Visible a qui | Utilise dans quels parcours |
| --- | --- | --- | --- | --- |
| Profil > Identite | prenom, nom, email, telephone | Obligatoire | Proprietaire, admin, partiellement concierge | compte, demandes, devis, confiance |
| Profil > Presence locale | ville, code_postal, pays | Obligatoire | Proprietaire, admin, partiellement concierge | mise en relation, contexte des demandes |
| Profil > Presentation | bio courte, mode de fonctionnement | Recommande | Proprietaire, admin, concierge cible | demandes, relation commerciale |
| Profil > Structure | nom de societe si applicable | Optionnel | Proprietaire, admin, concierge cible | devis, facturation, credibilite |
| Logements > Parc | au moins un logement lie | Obligatoire pour usage metier complet | Proprietaire, admin, concierge selon contexte | demandes, missions, suivi |
| Logements > Fiche bien | nom, ville, type, capacite, photo principale, description | Obligatoire par logement actif | Proprietaire, admin, concierge selon contexte | matching, missions, coordination |
| Preferences > Objectif | ownerGoal / objectif principal | Obligatoire | Proprietaire, admin | recherche, demande, matching |
| Preferences > Delegation | niveau de delegation, type de collaboration | Obligatoire | Proprietaire, admin | demandes, qualification commerciale |
| Preferences > Rythme | frequence, volume estime, saisonnalite | Recommande | Proprietaire, admin | matching, proposition de service |
| Preferences > Contexte bien | type de bien, contexte d'exploitation | Recommande | Proprietaire, admin | matching, demandes |
| Preferences > Attentes | services attendus, contraintes recurrentes | Recommande | Proprietaire, admin | demandes, recherche, onboarding |

### Definition du profil complet

Un profil proprietaire est considere comme `complet` si:

- l'identite de base est renseignee
- la presence locale est renseignee
- au moins un logement exploitable existe ou est en cours de creation encadree
- l'objectif de collaboration est defini
- le niveau de delegation ou le type de collaboration est defini

### Definition du profil avance

Un profil proprietaire est considere comme `avance` si, en plus:

- au moins un logement comporte ses informations cles
- les preferences de rythme et de contexte d'exploitation sont renseignees
- les attentes de service sont structurées

### Ce que cela doit debloquer

- creation de demandes plus rapide
- pre-remplissage des parcours owner
- meilleur matching concierge
- meilleure lecture du besoin cote concierge

## Persona 2 - Concierge

### Structure cible

Le profil concierge doit etre organise en 4 blocs:

1. Profil
2. Zone d'intervention
3. Services
4. Disponibilites

### Tableau cible

| Section | Champs cibles | Niveau | Visible a qui | Utilise dans quels parcours |
| --- | --- | --- | --- | --- |
| Profil > Identite | prenom, nom, email, telephone | Obligatoire | Concierge, admin, proprietaire selon contexte | compte, confiance, messages |
| Profil > Marque | nom commercial / company_name | Obligatoire | Concierge, admin, proprietaire | annuaire, demandes, devis |
| Profil > Localisation | ville, code_postal, pays | Obligatoire | Concierge, admin, proprietaire | matching, zone, missions |
| Profil > Presentation | presentation, experience, positionnement | Recommande | Concierge, admin, proprietaire | annuaire, conversion commerciale |
| Profil > Conformite | siren, siret, assurances, infos legales | Recommande a obligatoire selon parcours | Concierge, admin | verification, confiance, backoffice |
| Zone d'intervention > Perimetre | zone principale, villes couvertes, rayon km | Obligatoire | Concierge, admin, proprietaire selon recherche | matching, demandes, urgence |
| Zone d'intervention > Contraintes | intervention_zone_locked, limites eventuelles | Optionnel | Concierge, admin | operationnel |
| Services > Catalogue actif | services actifs, categories, options de prestation | Obligatoire | Concierge, admin, proprietaire selon recherche | annuaire, demandes, devis |
| Services > Offre commerciale | packs, forfaits, fourchettes de prix | Recommande | Concierge, admin, proprietaire selon contexte | conversion, devis |
| Disponibilites > Planning | plages hebdomadaires | Obligatoire | Concierge, admin | matching, missions, urgence |
| Disponibilites > Reactivite | disponibilite urgente, urgence 24h, temps de reponse | Recommande | Concierge, admin, proprietaire selon recherche | matching, priorisation |

### Definition du profil complet

Un profil concierge est considere comme `complet` si:

- l'identite de base est renseignee
- le nom commercial est renseigne
- la ville ou zone principale est renseignee
- au moins un service actif est defini
- la zone d'intervention est definie
- les disponibilites hebdomadaires existent

### Definition du profil avance

Un profil concierge est considere comme `avance` si, en plus:

- la presentation et l'experience sont renseignees
- les informations de conformite sont remplies
- des elements commerciaux sont disponibles
- les parametres de reactivite sont explicites

### Ce que cela doit debloquer

- visibilite publique ou semi-publique
- matching proprietaire plus pertinent
- demandes mieux qualifiees
- meilleure lecture commerciale et operationnelle

## Persona 3 - Artisan

### Structure cible

Le profil artisan doit etre organise en 4 blocs:

1. Profil
2. Metiers et specialites
3. Zone d'intervention
4. Disponibilites

Un 5e bloc `Services proposes` est recommande si le produit veut aller au-dela d'une simple presentation metier.

### Tableau cible

| Section | Champs cibles | Niveau | Visible a qui | Utilise dans quels parcours |
| --- | --- | --- | --- | --- |
| Profil > Identite | prenom, nom, email, telephone | Obligatoire | Artisan, admin, clients selon contexte | compte, confiance, messages |
| Profil > Structure | nom commercial / structure | Recommande a obligatoire selon cible pro | Artisan, admin, clients | credibilite, devis |
| Profil > Localisation | ville, code_postal, pays | Obligatoire | Artisan, admin, clients selon contexte | zone, missions, matching |
| Profil > Presentation | presentation du savoir-faire | Recommande | Artisan, admin, clients | conversion, selection |
| Metiers et specialites > Metier principal | categorie principale / metier principal | Obligatoire | Artisan, admin, clients | recherche, matching |
| Metiers et specialites > Specialites | specialites, domaines d'intervention | Recommande | Artisan, admin, clients | recherche, qualification |
| Metiers et specialites > Experience | annees d'experience, niveau | Recommande | Artisan, admin, clients | confiance, selection |
| Services proposes > Prestations | liste de services proposes | Recommande fort | Artisan, admin, clients | devis, selection, matching |
| Zone d'intervention > Perimetre | zone principale, ville de reference, rayon km | Obligatoire | Artisan, admin, clients | matching, interventions |
| Disponibilites > Planning | plages hebdomadaires | Obligatoire | Artisan, admin | affectation, missions |
| Disponibilites > Reactivite | urgence, intervention rapide, disponibilite ponctuelle | Recommande | Artisan, admin | operationnel |

### Definition du profil complet

Un profil artisan est considere comme `complet` si:

- l'identite de base est renseignee
- la localisation est renseignee
- le metier principal est defini
- la zone d'intervention est definie
- les disponibilites minimales sont declarees

### Definition du profil avance

Un profil artisan est considere comme `avance` si, en plus:

- les specialites sont explicites
- une presentation du savoir-faire existe
- des services proposes sont listes
- l'experience ou les niveaux d'intervention sont visibles

### Ce que cela doit debloquer

- profil professionnel comprehensible
- meilleure selection par les equipes ou les clients
- meilleure affectation operationnelle
- socle propre pour un futur annuaire ou matching artisan

## Regles communes de completude

### Regle 1 - Un profil ne peut pas etre complet sans identite exploitable

Minimum commun:

- prenom
- nom
- email
- telephone

### Regle 2 - Un profil ne peut pas etre complet sans ancrage local

Minimum commun:

- ville
- code postal ou zone principale

### Regle 3 - Chaque persona doit avoir un coeur metier propre

- Proprietaire: objectif + preferences + au moins un logement ou intention structuree
- Concierge: services + zone + disponibilites
- Artisan: metier principal + zone + disponibilites

### Regle 4 - La completude ne doit pas dependre d'un seul parcours

Les informations critiques ne doivent pas vivre uniquement:

- dans l'onboarding
- dans une demande ponctuelle
- dans un champ JSON polyvalent

## Visibilite cible des donnees

### Proprietaire

- visible par le proprietaire: tout
- visible par l'admin: tout
- visible par la conciergerie: uniquement ce qui est necessaire a la qualification de la demande et du logement

### Concierge

- visible par le concierge: tout
- visible par l'admin: tout
- visible par le proprietaire: presentation, zone, services, signaux de confiance utiles

### Artisan

- visible par l'artisan: tout
- visible par l'admin: tout
- visible par le client ou donneur d'ordre: presentation, metiers, zone, disponibilite utile, signaux de confiance utiles

## Decisions cibles a valider

### Proprietaire

- les preferences doivent devenir une vraie page autonome
- les donnees de demandes doivent pouvoir etre pre-remplies depuis le profil

### Concierge

- le concierge reste la reference produit de la richesse fonctionnelle
- les donnees critiques doivent sortir progressivement des structures trop polymorphes

### Artisan

- le profil artisan ne doit plus reposer uniquement sur la fiche generique
- le metier principal, la zone et les disponibilites doivent devenir des objets produit de premier rang

## Resultat attendu pour l'issue #10

L'issue peut etre consideree comme couverte si cette specification est validee ou ajustee sur les points suivants:

- sections finales par persona
- definition du minimum `complet`
- definition du niveau `avance`
- visibilite cible des donnees
- articulation entre profil, preferences, services, zone et disponibilites

## Recommandation immediate

Une fois cette cible validee, la suite logique est:

1. cartographier les champs existants par rapport a cette cible
2. definir les validations par role
3. lancer le chantier `Profil Artisan`
4. lancer le chantier `Preferences Proprietaire`
