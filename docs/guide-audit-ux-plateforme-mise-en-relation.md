# Guide d'audit UX - Plateforme Proprietaires, Conciergeries et Artisans

Date de creation : 2026-05-25

Objectif : disposer d'un support de travail vivant pour evaluer l'etat actuel de la plateforme, identifier les frictions principales et prioriser les prochains chantiers UX/UI.

## 1. Cartographie des parcours utilisateurs

### 1.1 Proprietaire

| Action critique | Objectif utilisateur | Point de friction potentiel |
| --- | --- | --- |
| Comprendre la proposition de valeur | Savoir rapidement pourquoi utiliser la plateforme | Message trop vague, benefices concrets peu visibles |
| Creer un compte | Acceder a son espace proprietaire | Formulaire trop long, manque d'explication sur les donnees demandees |
| Ajouter un bien | Presenter son logement a une conciergerie | Trop de champs, aide insuffisante sur les informations attendues |
| Rechercher une conciergerie | Trouver un prestataire fiable | Filtres insuffisants : zone, tarifs, services, avis, disponibilite |
| Comparer les profils | Choisir la bonne conciergerie | Manque de transparence sur les prix, prestations et preuves de confiance |
| Envoyer une demande | Initier une collaboration | Incertitude sur la suite apres l'envoi |
| Suivre les demandes | Voir qui a repondu et ou en est le dossier | Statuts peu clairs ou notifications absentes |
| Valider une collaboration | Confirmer la relation avec une conciergerie | Peur de l'engagement, cadre juridique ou operationnel flou |
| Suivre les prestations | Garder une visibilite sur la gestion du bien | Informations dispersees ou tableau de bord trop pauvre |
| Noter ou recommander | Partager son experience | Notation trop generique ou demandee au mauvais moment |

### 1.2 Concierge

| Action critique | Objectif utilisateur | Point de friction potentiel |
| --- | --- | --- |
| Comprendre l'interet business | Identifier comment la plateforme apporte des mandats | Proposition de valeur pas assez orientee acquisition client |
| Creer un profil professionnel | Etre visible aupres des proprietaires | Peu d'options pour valoriser son expertise |
| Definir sa zone d'intervention | Recevoir des demandes pertinentes | Zones geographiques ou rayons d'action mal geres |
| Presenter ses services | Clarifier son offre : gestion complete, check-in, menage, maintenance | Services mal categorises ou difficiles a comparer |
| Recevoir une demande proprietaire | Transformer un lead en client | Informations insuffisantes sur le bien ou le besoin |
| Repondre a une demande | Proposer une offre claire | Absence de modele de reponse, devis ou estimation difficile |
| Gerer ses biens ou missions | Organiser l'activite quotidienne | Interface trop generique, peu adaptee aux operations terrain |
| Trouver un artisan | Resoudre un probleme sur un logement | Filtres peu fiables : urgence, disponibilite, specialite, zone |
| Assigner une intervention | Mandater un artisan | Incertitude sur les delais, tarifs et responsabilites |
| Suivre les interventions | S'assurer que le probleme est resolu | Manque de statuts intermediaires, preuves photo ou historique |
| Facturer et suivre les paiements | Securiser la transaction | Flou sur qui paie quoi : proprietaire, concierge ou plateforme |
| Evaluer les artisans | Construire un reseau fiable | Avis superficiels ou non lies a une mission reelle |

### 1.3 Artisan

| Action critique | Objectif utilisateur | Point de friction potentiel |
| --- | --- | --- |
| Comprendre l'opportunite | Savoir si la plateforme genere des missions rentables | Proposition de valeur trop centree proprietaires ou conciergeries |
| Creer un profil artisan | Presenter son metier, ses competences et disponibilites | Categories metier trop rigides ou mal adaptees |
| Definir zones et creneaux | Recevoir des demandes compatibles | Mauvaise gestion de l'urgence, des horaires ou de la distance |
| Recevoir une mission | Comprendre rapidement le besoin | Brief incomplet : adresse, acces, photos, urgence, budget |
| Accepter ou refuser | Gerer son planning | Pression a repondre vite avec trop peu d'informations |
| Communiquer avec le concierge | Clarifier l'intervention | Messagerie peu structuree, informations perdues dans les echanges |
| Realiser l'intervention | Executer la prestation | Acces au logement mal documente, absence de contact sur place |
| Ajouter des preuves | Envoyer photos, rapport et commentaire | Upload complexe ou experience mobile insuffisante |
| Demander validation | Cloturer proprement la mission | Statut final ambigu : termine, valide, conteste, paye |
| Etre paye | Recevoir sa remuneration | Delais ou conditions de paiement peu transparents |
| Recevoir un avis | Renforcer sa reputation | Avis non contextualises ou absence de droit de reponse |

## 2. Matrice d'evaluation de la mise en relation

### 2.1 Relation Proprietaire - Concierge

| Critere UX | A verifier | Risque si absent |
| --- | --- | --- |
| Clarte de l'offre | Services inclus/exclus, tarifs, niveau d'accompagnement | Le proprietaire ne sait pas comparer ni s'engager |
| Confiance | Profil verifie, avis authentifies, experience, assurances, zone couverte | La demande n'est pas envoyee ou reste sans suite |
| Comparabilite | Filtres et fiches profils homogenes | Choix difficile, perception d'opacite |
| Fluidite de la demande | Formulaire court mais qualifiant, confirmation apres envoi | Abandon ou demande inexploitable |
| Suivi | Statuts, notifications, historique des echanges | Perte de controle, relances manuelles |

Statuts recommandes :

- Demande envoyee
- En attente de reponse
- Reponse recue
- Rendez-vous prevu
- Offre envoyee
- Offre acceptee
- Collaboration active
- Collaboration terminee

### 2.2 Relation Concierge - Artisan

| Critere UX | A verifier | Risque si absent |
| --- | --- | --- |
| Brief mission clair | Nature de l'intervention, urgence, adresse, acces, photos, budget | Intervention refusee, retardee ou mal executee |
| Disponibilite | Indication des artisans disponibles ou joignables rapidement | Perte de temps en situation d'urgence |
| Statuts operationnels | Cycle de vie complet de la mission | Confusion sur qui doit agir |
| Messagerie contextualisee | Conversation liee a une mission precise | Informations dispersees et difficiles a retrouver |
| Gestion des imprevus | Indisponibilite, surcout, piece manquante, seconde intervention | Perte de confiance et litiges |
| Preuves et validation | Photos avant/apres, rapport, validation, litige | Paiement ou cloture contestables |

Statuts recommandes :

- A traiter
- En attente d'acceptation
- Acceptee
- En route
- En cours
- Terminee
- Validee
- Contestee
- Payee

### 2.3 Relation triangulaire Proprietaire - Concierge - Artisan

| Dimension | Questions UX a clarifier |
| --- | --- |
| Roles et responsabilites | Qui demande ? Qui valide ? Qui paie ? Qui est informe ? Qui peut contacter qui ? |
| Visibilite adaptee | Que voit le proprietaire ? Que voit le concierge ? Que voit l'artisan ? |
| Tracabilite | Les actions, documents, photos et decisions sont-ils horodates et historises ? |
| Confiance transactionnelle | Les conditions de paiement, d'annulation et de litige sont-elles explicites ? |
| Reduction de l'incertitude | La prochaine etape, la personne responsable et le delai attendu sont-ils toujours visibles ? |

## 3. Checklist d'auto-evaluation

Reponses possibles : Oui / Non / En cours.

| Question | Oui | Non | En cours | Notes |
| --- | --- | --- | --- | --- |
| La proposition de valeur est-elle comprehensible en moins de 5 secondes ? | [ ] | [ ] | [ ] |  |
| Chaque profil comprend-il clairement ce que la plateforme lui apporte ? | [ ] | [ ] | [ ] |  |
| Les parcours Proprietaire, Concierge et Artisan sont-ils separes ou personnalises des l'entree ? | [ ] | [ ] | [ ] |  |
| Le processus d'inscription est-il court, rassurant et adapte a chaque profil ? | [ ] | [ ] | [ ] |  |
| Les formulaires demandent-ils uniquement les informations necessaires a l'etape concernee ? | [ ] | [ ] | [ ] |  |
| Les statuts des demandes, missions ou collaborations sont-ils visibles et comprehensibles ? | [ ] | [ ] | [ ] |  |
| L'utilisateur sait-il toujours quelle est la prochaine action a effectuer ? | [ ] | [ ] | [ ] |  |
| Les profils professionnels inspirent-ils confiance : avis, zone, services, disponibilite, verification ? | [ ] | [ ] | [ ] |  |
| Les criteres de recherche et de filtrage sont-ils suffisants pour trouver un bon match ? | [ ] | [ ] | [ ] |  |
| La messagerie est-elle liee a un contexte precis : demande, bien, mission ou intervention ? | [ ] | [ ] | [ ] |  |
| Les informations importantes sont-elles accessibles sur mobile sans friction ? | [ ] | [ ] | [ ] |  |
| Les textes des boutons sont-ils orientes action ? | [ ] | [ ] | [ ] |  |
| Les erreurs de formulaire sont-elles expliquees clairement et proches du champ concerne ? | [ ] | [ ] | [ ] |  |
| Le contraste, la taille des textes et les zones cliquables respectent-ils les bases d'accessibilite ? | [ ] | [ ] | [ ] |  |
| Les utilisateurs recoivent-ils des confirmations apres les actions importantes ? | [ ] | [ ] | [ ] |  |

Lecture rapide :

- Majorite de Oui : base UX solide, priorite a l'optimisation et a la conversion.
- Majorite de En cours : plateforme structuree, mais a stabiliser avant acquisition.
- Majorite de Non : priorite aux parcours critiques, aux statuts et aux elements de confiance.

## 4. Plan d'action et priorisation

### 4.1 Tableau de priorisation

| Amelioration | Profil concerne | Probleme UX observe | Impact utilisateur | Effort dev | Priorite | Commentaire |
| --- | --- | --- | --- | --- | --- | --- |
| Clarifier la proposition de valeur par profil | Tous | Message trop general | Fort | Faible | P1 | A traiter avant acquisition |
| Simplifier le formulaire d'ajout de bien | Proprietaire | Risque d'abandon | Fort | Moyen | P1 | Reduire les champs et ajouter une progression |
| Ajouter des statuts de mission | Concierge / Artisan | Manque de visibilite operationnelle | Fort | Moyen | P1 | Indispensable pour la confiance |
| Enrichir les profils artisans | Concierge / Artisan | Choix difficile d'un prestataire fiable | Moyen | Faible | P2 | Ajouter avis, zone, specialites, disponibilite |
| Ajouter des notifications email | Tous | L'utilisateur ne sait pas quand agir | Fort | Moyen | P1 | Prioritaire pour demandes et missions |
| Ameliorer l'accessibilite mobile | Tous | Usage terrain difficile | Fort | Eleve | P1/P2 | Prioriser les pages critiques |

### 4.2 Grille Impact / Effort

| Categorie | Description | Decision |
| --- | --- | --- |
| Impact fort / Effort faible | Amelioration rapide avec benefice visible | Faire en priorite |
| Impact fort / Effort eleve | Chantier strategique structurant | Planifier en sprint dedie |
| Impact faible / Effort faible | Optimisation secondaire | Faire si rapide |
| Impact faible / Effort eleve | Peu rentable a court terme | Reporter ou abandonner |

### 4.3 Score simple de priorisation

Noter chaque amelioration de 1 a 5 sur chaque critere :

| Critere | Note |
| --- | --- |
| Impact utilisateur | 1 a 5 |
| Impact business | 1 a 5 |
| Facilite de mise en oeuvre | 1 a 5 |

Formule :

```text
Score priorite = Impact utilisateur + Impact business + Facilite de mise en oeuvre
```

Plus le score est eleve, plus l'amelioration doit etre traitee tot.

## 5. Suivi de travail et prochaines etapes

Cette section sert a avancer progressivement sur l'audit.

| Etape | Objectif | Statut | Notes |
| --- | --- | --- | --- |
| 1. Audit de la proposition de valeur | Verifier si chaque profil comprend l'interet de la plateforme | En cours | Home et vocabulaire artisan harmonises ; verification visuelle en cours |
| 2. Audit des parcours d'inscription | Identifier les frictions dans l'onboarding | En cours | Entrees vers l'etape finale securisees ; validation email et wording recap ameliores |
| 3. Audit des profils professionnels | Evaluer confiance, lisibilite et comparabilite | En cours | Cartes concierge enrichies avec signaux de confiance ; manque fiche artisan publique identifie |
| 4. Audit de la recherche et du matching | Verifier filtres, criteres et pertinence des resultats | En cours | Raisons de match ajoutees cote proprietaire et cote concierge |
| 5. Audit des demandes et missions | Evaluer statuts, suivi, messagerie et notifications | En cours | Statuts, messagerie contextualisee et alertes roles audites ; premieres corrections appliquees |
| 6. Audit mobile et accessibilite | Controler les parcours critiques sur mobile | A faire |  |
| 7. Priorisation finale | Classer les chantiers selon impact et effort | A faire |  |

## 6. Etape 1 - Audit de la proposition de valeur

Perimetre observe :

- Page d'accueil redirigee vers `/home`.
- Hero principal de la home.
- Section "Pour qui ?" avec cartes Proprietaires, Conciergeries et Artisans.
- Page de choix de parcours `/parcours`.
- Pages publiques `/owner`, `/concierge` et `/provider`.

### 6.1 Constats positifs

| Element observe | Evaluation UX |
| --- | --- |
| Les trois profils sont bien representes | La plateforme assume clairement sa logique triangulaire. C'est une base saine pour la comprehension. |
| Une page `/parcours` existe | Elle aide a orienter les utilisateurs selon leur role, ce qui reduit le risque d'une entree trop generique. |
| Chaque role dispose d'une page publique dediee | Bonne base pour adapter le discours, les CTA et les preuves de valeur. |
| Les pages rolees utilisent une logique d'etapes | Cela aide l'utilisateur a comprendre la progression attendue. |
| Les dashboards sont relies aux promesses produit | Les textes publics ne sont pas deconnectes des fonctionnalites existantes. |

### 6.2 Frictions probables

| Friction | Impact utilisateur | Priorite |
| --- | --- | --- |
| Le hero principal presente beaucoup de concepts en meme temps : SaaS, carte, devis, missions, messages, documents, dashboards | L'utilisateur comprend la richesse, mais peut avoir du mal a identifier la premiere action a faire | P1 |
| Les CTA du hero sont concurrents : demande urgente, creation de compte, fonctionnement | La hierarchie de decision est moins evidente pour un nouvel utilisateur | P1 |
| Le vocabulaire alterne entre "Artisan", "Provider" et "Partenaire" | Risque de confusion, surtout pour les prestataires terrain peu familiers avec le vocabulaire SaaS | P1 |
| La proposition de valeur artisan insiste sur le pilotage, mais pas assez sur l'acquisition de missions rentables | Le benefice business peut paraitre moins fort pour ce profil | P2 |
| Les pages publiques proposent parfois d'ouvrir directement le dashboard | Pour un utilisateur non connecte, cela peut creer une rupture si la redirection ou l'acces n'est pas explique | P2 |
| Les preuves de confiance restent generales | Il manque des elements concrets : profils verifies, delais de reponse, avis, zones couvertes, exemples de missions | P2 |

### 6.3 Recommandations prioritaires

| Recommandation | Profil concerne | Impact | Effort estime | Priorite |
| --- | --- | --- | --- | --- |
| Clarifier le CTA principal de la home autour du choix de parcours | Tous | Fort | Faible | P1 |
| Garder "Lancer une demande urgente" comme action secondaire contextualisee | Proprietaire / Concierge | Moyen | Faible | P1 |
| Harmoniser le vocabulaire public : choisir entre "Artisan", "Prestataire" ou "Partenaire terrain" | Artisan | Fort | Faible | P1 |
| Ajouter une phrase de benefice concret par role dans le hero ou juste sous le hero | Tous | Fort | Faible | P1 |
| Ajouter des micro-preuves sous les CTA : profils verifies, devis centralises, suivi mission, messagerie | Tous | Moyen | Faible | P2 |
| Transformer les CTA "Ouvrir mon dashboard" en CTA plus rassurants pour les visiteurs non connectes | Tous | Moyen | Faible | P2 |

### 6.4 Proposition de hierarchie pour la home

Objectif : faire comprendre la plateforme en moins de 5 secondes, puis orienter vers le bon role.

| Niveau | Message recommande |
| --- | --- |
| H1 | PlanetLS relie proprietaires, conciergeries et artisans pour piloter la location saisonniere. |
| Sous-titre | Trouvez les bons partenaires, envoyez des demandes qualifiees, suivez les missions et centralisez les echanges dans un espace clair. |
| CTA principal | Choisir mon parcours |
| CTA secondaire | Lancer une demande urgente |
| CTA tertiaire | Voir le fonctionnement |

### 6.5 Proposition de benefices par profil

| Profil | Benefice principal a rendre visible |
| --- | --- |
| Proprietaire | Trouver une conciergerie fiable, comparer les offres et garder le controle sur les missions et les finances. |
| Concierge | Recevoir des demandes qualifiees, structurer son offre et coordonner les interventions depuis un seul espace. |
| Artisan | Recevoir des missions locales contextualisees, intervenir plus vite et construire des partenariats recurrents. |

### 6.6 Decision de travail

Prochaine etape proposee : traiter l'harmonisation des textes publics avant de passer aux parcours d'inscription.

Actions possibles :

- Revoir le hero de `/home`.
- Revoir les CTA publics pour chaque role.
- Harmoniser le vocabulaire "artisan / prestataire / partenaire".
- Ajouter des micro-preuves de confiance visibles avant inscription.

### 6.7 Changements appliques - premiere passe

Date : 2026-05-25

| Zone | Changement | Objectif UX |
| --- | --- | --- |
| Hero `/home` | CTA principal remplace par "Choisir mon parcours" vers `/parcours` | Orienter les nouveaux visiteurs par role avant inscription |
| Hero `/home` | "Lancer une demande urgente" passe en action secondaire | Garder l'urgence accessible sans en faire l'entree par defaut |
| Hero `/home` | Message recentre sur proprietaires, conciergeries et artisans | Rendre la promesse triangulaire plus explicite |
| Hero `/home` | Ajout de micro-preuves : profils verifies, devis, suivi, messages, documents | Renforcer la confiance avant conversion |
| Section "Pour qui ?" | CTA artisan harmonise en "Decouvrir le parcours artisan" | Eviter l'ambiguite "partenaire" pour le profil artisan |
| Section "Comment ca marche ?" | Onglet "Prestataires" remplace par "Artisans" | Aligner le vocabulaire sur les trois roles metier |
| Bloc plateforme tout-en-un | "Partenaire terrain" et "prestataire" remplaces par "artisan" | Supprimer les synonymes concurrents sur la home |
| Page `/parcours` | Carte artisan harmonisee | Garder un vocabulaire coherent entre home, parcours et page dediee |
| Page `/provider` | Textes publics harmonises autour du mot "artisan" | Conserver "provider" comme route technique, pas comme langage utilisateur |
| Meta description `/home` | "Prestataires" remplace par "artisans" | Renforcer la coherence SEO et partage social |

Verification effectuee :

- `npx.cmd tsc --noEmit` : OK.
- Verification navigateur avec agent-browser : `/home`, `/parcours`, `/provider` chargent et affichent les textes attendus.
- `agent-browser errors` sur la session de verification : aucun probleme remonte.

Point d'attention hors perimetre :

- Le serveur Next signale une erreur existante sur une route dashboard concierge : import introuvable `@/app/dashboard/_components/SimpleOverviewWorkspace` depuis `src/app/components/dashboard/profile/ProfileOverviewWorkspace.tsx`. Cette erreur n'est pas liee aux changements de wording publics, mais devra etre traitee dans un chantier technique separe.

## 7. Etape 2 - Audit des parcours d'inscription et onboarding

Perimetre observe :

- Point d'entree principal via `MapWithSearch`.
- Popups d'onboarding : experience, services, coordonnees.
- Page finale `/complete-registration`.
- CTA publics qui envoyaient vers l'inscription.
- API d'inscription `/api/auth/register`.

### 7.1 Cartographie du flux actuel

| Etape | Ecran / composant | Objectif utilisateur | Risque UX |
| --- | --- | --- | --- |
| 1 | `MapWithSearch` | Choisir son role et sa ville | La ville doit etre reconnue ; l'utilisateur peut ne pas comprendre pourquoi il est bloque |
| 2 | `ExperiencePopup` | Declarer son niveau d'experience ou le niveau souhaite | Les questions changent selon le role, ce qui est positif mais demande une bonne clarte de libelle |
| 3 | `CategoryPopup` | Choisir services recherches ou proposes | Selection obligatoire ; risque de blocage si l'utilisateur ne trouve pas son service |
| 4 | `AccessPopup` | Renseigner coordonnees et informations metier | Etape dense, surtout pour concierge et artisan |
| 5 | `/complete-registration` | Valider le recap, creer identifiant et mot de passe | Derniere etape longue ; le bouton peut etre bloque sans explication visible sur le nom d'utilisateur |

### 7.2 Constats positifs

| Element observe | Evaluation UX |
| --- | --- |
| Le parcours est role par role | Bonne base pour eviter un onboarding generique. |
| La progression en 5 etapes est visible | L'utilisateur sait qu'il avance vers une finalisation. |
| Les informations sont reutilisees dans un recap final | Cela renforce le controle avant creation du compte. |
| Les popups permettent de revenir en arriere | Bon point pour corriger sans tout recommencer. |
| Les parcours concierge et artisan collectent des criteres utiles au matching | Zone, services, disponibilite, urgence, assurance, tarif ou outils sont de bonnes donnees initiales. |

### 7.3 Frictions prioritaires

| Friction | Impact utilisateur | Priorite |
| --- | --- | --- |
| Certains CTA envoyaient directement vers `/complete-registration` sans contexte | L'utilisateur arrivait sur une etape finale vide, avec un risque de compte incomplet | P1 |
| L'etape coordonnees validait surtout la presence de l'email, pas son format dans la logique applicative | Erreur tardive possible au moment de l'inscription | P1 |
| Le recap final contenait des formulations maladroites selon le role | Perte de confiance a un moment critique | P1 |
| La page finale depend fortement des query params | Risque de rupture si l'utilisateur recharge, partage ou arrive par un lien direct | P2 |
| Le bouton final peut etre desactive sans aide explicite pour le nom d'utilisateur | Friction possible si l'utilisateur ne comprend pas la regle des 3 caracteres | P2 |
| Le flux est dense pour un premier contact | Risque d'abandon si l'utilisateur voulait seulement explorer ou comparer | P2 |

### 7.4 Changements appliques - premiere passe onboarding

Date : 2026-05-25

| Zone | Changement | Objectif UX |
| --- | --- | --- |
| CTA "Essayer gratuitement" | Redirection vers `/parcours` au lieu de `/complete-registration` | Eviter une arrivee directe sur l'etape finale |
| Offre Standard | Redirection vers `/parcours` au lieu de `/complete-registration` | Faire commencer l'utilisateur par le choix de role |
| `/complete-registration` | Ajout d'un etat de recuperation si le contexte onboarding est absent | Eviter un formulaire final vide et guider vers le bon depart |
| `AccessPopup` | Validation explicite du format email avant de continuer | Reduire les erreurs tardives cote API |
| Recap final | Reformulation des intentions par role | Eviter les phrases maladroites du type "missions de Proprietaire" |

Verification effectuee :

- `npx.cmd tsc --noEmit` : OK.
- Ouverture directe de `/complete-registration` : affiche un message de reprise propre avec CTA vers `/parcours` et `/home`.
- Ouverture de `/complete-registration` avec parametres onboarding : le recap final reste accessible.

### 7.5 Recommandations suivantes

| Recommandation | Impact | Effort | Priorite |
| --- | --- | --- | --- |
| Ajouter une aide visible sous le champ "Nom d'utilisateur" | Moyen | Faible | P2 |
| Ajouter une checklist des conditions mot de passe toujours visible | Moyen | Faible | P2 |
| Ajouter une option "Je ne trouve pas mon service" dans l'etape services | Fort | Moyen | P1 |
| Clarifier la validation de ville avec un message plus proche du champ | Moyen | Moyen | P2 |
| Prevoir un mode exploration sans compte pour les visiteurs non decides | Fort | Eleve | P2 |

## 8. Etape 3 - Audit des profils professionnels

Perimetre observe :

- Cartes de conciergeries visibles sur la home.
- Cartes concierge dans la recherche proprietaire.
- Fiche publique concierge `/concierges/[id]`.
- API publique concierge `/api/profiles/public/[id]`.
- Recherche d'un equivalent public artisan.

### 8.1 Constats positifs

| Element observe | Evaluation UX |
| --- | --- |
| Les cartes concierge utilisent un composant partage | Bonne base pour garder une comparaison homogene entre home, recherche et fiche. |
| Les informations essentielles sont deja presentes | Nom, ville/zone, services, tarifs, experience, avis et badge de statut sont visibles. |
| La fiche publique concierge existe | Le proprietaire peut consulter plus de details avant de contacter. |
| Les avis sont relies aux missions | Bon principe de confiance, meme si le volume d'avis est encore faible. |
| Les fiches gerent les donnees manquantes | Les libelles "Sur demande" ou "Avis en attente" evitent les trous visuels. |

### 8.2 Frictions prioritaires

| Friction | Impact utilisateur | Priorite |
| --- | --- | --- |
| Il n'existe pas d'equivalent clair de fiche publique artisan | Les conciergeries ne peuvent pas comparer les artisans avec le meme niveau de confiance | P1 |
| Les cartes affichaient des donnees utiles mais sans lecture de confiance explicite | Le proprietaire devait interpreter seul les signaux : zone, avis, tarif, statut | P1 |
| Certains libelles techniques ou non accentues etaient visibles sur la fiche | Perte de finition percue sur une page de confiance | P2 |
| La promesse "profils verifies" etait trop forte par rapport aux donnees visibles | Risque de surpromesse si la verification n'est pas encore branchee | P1 |
| Les criteres de comparaison ne distinguent pas encore assurance, disponibilite reelle ou delai de reponse | Decision encore incomplete pour les missions sensibles | P2 |

### 8.3 Changements appliques - premiere passe profils

Date : 2026-05-25

| Zone | Changement | Objectif UX |
| --- | --- | --- |
| Cartes `ConciergePreviewCard` | Ajout de signaux : profil public/PRO, avis, zone, tarif | Rendre la comparaison plus rapide et plus rassurante |
| Home hero | "Profils verifies" remplace par "Profils lisibles" | Eviter une promesse non encore prouvee par les donnees visibles |
| Fiche `/concierges/[id]` | Correction de micro-libelles : experience, avis publie, donnees non renseignees | Ameliorer la finition percue |
| Fiche `/concierges/[id]` | Normalisation du niveau d'experience technique en libelle lisible | Remplacer `debutant` par `Debutant`, etc. |

Verification effectuee :

- `npx.cmd tsc --noEmit` : OK.
- Verification navigateur sur `/home` : les cartes affichent les signaux de confiance.
- Verification navigateur sur une fiche concierge publique : la fiche charge, aucun `agent-browser errors` remonte.

### 8.4 Recommandations suivantes

| Recommandation | Impact | Effort | Priorite |
| --- | --- | --- | --- |
| Creer une fiche publique artisan comparable a la fiche concierge | Fort | Moyen/Elevé | P1 |
| Ajouter un champ de verification utile par role : assurance, SIRET, zone, disponibilite | Fort | Moyen | P1 |
| Ajouter un indicateur "delai de reponse moyen" ou "derniere activite" | Moyen | Moyen | P2 |
| Ajouter une section "Ce profil est pertinent pour..." | Moyen | Faible | P2 |
| Ajouter une comparaison courte des profils selectionnes cote proprietaire | Fort | Moyen | P2 |

### 8.5 Structure cible pour une fiche artisan

| Bloc | Donnees a afficher |
| --- | --- |
| Identite | Nom, metier, ville, zone d'intervention, photo ou initiales |
| Confiance | Assurance, SIRET, avis mission, date d'inscription, statut actif |
| Intervention | Urgences acceptees, creneaux habituels, rayon, delai indicatif |
| Tarifs | Tarif de depart, sur devis, frais de deplacement si applicable |
| Preuves | Photos avant/apres, exemples d'intervention, commentaires clients |
| Actions | Contacter, demander un devis, assigner une intervention |

## 9. Etape 4 - Audit de la recherche et du matching

Perimetre observe :

- Recherche proprietaire vers conciergeries : `/dashboard/owner/concierges`.
- Cartes de resultats concierge partagees avec les pages publiques.
- Recherche concierge vers demandes proprietaires : `/dashboard/concierge/recherche`.
- API de matching concierge vers proprietaires : `/api/concierge/match-owner-requests`.
- API de profils conciergeries : `/api/profiles/concierges`.

### 9.1 Constats positifs

| Element observe | Evaluation UX |
| --- | --- |
| Les deux parcours de recherche existent | Bonne base pour une plateforme de mise en relation triangulaire. |
| Les filtres proprietaire couvrent les services, la zone, l'experience, la note, le tarif et la disponibilite | Les criteres principaux de decision sont presents. |
| Le tri proprietaire distingue pertinence, note, prix et experience | L'utilisateur peut adapter sa recherche selon son intention. |
| La recherche concierge affiche un score de compatibilite | Le concierge dispose deja d'un indicateur de priorisation. |
| La recherche concierge croise les services actifs avec les demandes proprietaires | Le matching repose sur une logique metier utile, pas seulement sur une liste brute. |

### 9.2 Frictions prioritaires

| Friction | Impact utilisateur | Priorite |
| --- | --- | --- |
| Les resultats proprietaire n'expliquaient pas pourquoi une conciergerie ressortait | Le proprietaire pouvait percevoir le tri comme opaque | P1 |
| Le score concierge etait utile mais peu interpretable sans lecture textuelle | Le concierge voyait un pourcentage sans comprendre les raisons du match | P1 |
| Le matching repose beaucoup sur des libelles de services exacts | Des synonymes peuvent faire manquer des correspondances pertinentes | P1 |
| Les resultats sans correspondance proposent peu de chemins alternatifs | L'utilisateur peut se retrouver bloque sans suggestion claire | P2 |
| Le versant artisan reste moins visible dans la recherche publique | La logique triangulaire n'est pas encore aussi forte cote concierge-artisan | P1 |

### 9.3 Changements appliques - premiere passe matching

Date : 2026-05-25

| Zone | Changement | Objectif UX |
| --- | --- | --- |
| Cartes concierge cote proprietaire | Ajout d'un bloc "Pourquoi ce profil ?" avec services demandes, zone, disponibilite, note ou tarif | Rendre les resultats plus explicables et rassurants |
| Grille de resultats proprietaire | Transmission des filtres actifs aux cartes | Relier les signaux affiches a la recherche de l'utilisateur |
| Recherche concierge | Ajout d'un libelle qualitatif du score : tres bon match, match solide, match a qualifier, faible correspondance | Eviter qu'un pourcentage soit interprete seul |
| Recherche concierge | Ajout de raisons de compatibilite : services communs, distance, budget, zone precise | Aider le concierge a prioriser ses contacts |

Verification effectuee :

- `npx.cmd tsc --noEmit` : OK apres les ajouts de raisons cote proprietaire et cote concierge.
- `npx.cmd eslint` cible sur les composants modifies : OK.
- Verification navigateur : `/home` charge sans overlay ; les routes dashboard de matching redirigent vers `/login` sans session active, donc la verification visuelle des cartes devra etre refaite avec un compte connecte.

### 9.4 Recommandations suivantes

| Recommandation | Impact | Effort | Priorite |
| --- | --- | --- | --- |
| Construire un score de matching commun, cote API, pour proprietaires et conciergeries | Fort | Moyen | P1 |
| Ajouter une taxonomie de services avec synonymes et familles metier | Fort | Moyen/Eleve | P1 |
| Afficher des suggestions quand aucun resultat n'est trouve : elargir zone, retirer service, voir profils proches | Moyen | Faible | P2 |
| Ajouter une vue comparaison de 2 ou 3 conciergeries selectionnees | Fort | Moyen | P2 |
| Prevoir une recherche artisan comparable : metier, urgence, rayon, disponibilite, assurance | Fort | Moyen/Eleve | P1 |
| Ajouter l'enregistrement d'une recherche et des alertes de nouvelles correspondances | Moyen | Moyen | P2 |

## 10. Etape 5 - Audit des demandes, missions, statuts, messagerie et notifications

Perimetre observe :

- Demandes proprietaire : `/dashboard/owner/demandes`.
- Demandes concierge : `/dashboard/concierge/demandes`.
- Missions concierge : `/dashboard/concierge/missions`.
- Detail mission partage proprietaire / concierge : `/dashboard/owner/missions/[id]` et `/dashboard/concierge/missions/[id]`.
- Messagerie proprietaire : `/dashboard/owner/messages`.
- Messagerie concierge : `/dashboard/concierge/messages`.
- Centres d'alertes : `/dashboard/owner/alertes`, `/dashboard/concierge/alertes`, `/dashboard/provider/alertes`.
- Redirection globale : `/dashboard/notifications`.

### 10.1 Constats positifs

| Element observe | Evaluation UX |
| --- | --- |
| Les demandes proprietaire disposent d'un statut relationnel lisible | Brouillon, attente, consultation, discussion, acceptation et expiration sont traduits en langage utilisateur. |
| Les demandes concierge affichent des jalons operationnels | Qualification, devis et mission donnent une bonne vision de progression. |
| Les missions ont une logique d'action claire | Accepter, demarrer, terminer, annuler et ouvrir les messages sont accessibles depuis le detail. |
| La mission centralise preuves, checklist, documents, artisan et historique | Bonne base pour remplacer les echanges disperses et securiser la validation. |
| Les messageries sont rattachees aux conversations | Les fils gardent le sujet, le dernier message, les participants et un etat lu/non lu. |
| Les centres d'alertes existent par role | Chaque acteur dispose d'une entree dediee pour les points d'attention. |

### 10.2 Frictions prioritaires

| Friction | Impact utilisateur | Priorite |
| --- | --- | --- |
| Les libelles de contexte messagerie pouvaient rester techniques : `mission`, `quote`, `search` | L'utilisateur comprend moins vite pourquoi un fil existe | P1 |
| La redirection `/dashboard/notifications` envoyait les artisans vers les messages alors qu'une page alertes existe | Les prestataires rataient leur centre de vigilance dedie | P1 |
| Les statuts demandes et missions ne partagent pas encore une frise commune de bout en bout | La transition demande -> devis -> mission -> intervention artisan peut rester fragmentee | P1 |
| Les notifications restent surtout internes au dashboard | Sans email ou push, une action urgente peut etre manquee hors plateforme | P1 |
| La mission permet d'annuler avec motif optionnel, mais sans garde-fou fort | Risque d'annulation peu documentee en situation de litige | P2 |
| Les preuves terrain existent mais leur qualite attendue n'est pas guidee | Photos, documents ou notes peuvent etre trop vagues pour valider une intervention | P2 |

### 10.3 Changements appliques - premiere passe suivi operationnel

Date : 2026-05-25

| Zone | Changement | Objectif UX |
| --- | --- | --- |
| `/dashboard/notifications` | Redirection artisan/provider vers `/dashboard/provider/alertes` | Envoyer chaque role vers son vrai centre d'alertes |
| Messagerie proprietaire | Ajout d'un libelle de contexte metier dans l'entete du fil | Remplacer les sources techniques par Mission, Devis, Demande ou Recherche concierge |
| Messagerie concierge | Ajout d'un libelle de contexte metier dans l'entete du fil | Aider la conciergerie a comprendre le dossier lie au message |
| Verification import `SimpleOverviewWorkspace` | Import remplace par un chemin relatif stable et `next build` passe avec `/dashboard/concierge/profile` compile | Corriger le cas dev/Turbopack qui ne resolvait pas l'alias vers `_components` |

Verification effectuee :

- `npx.cmd tsc --noEmit` : OK.
- `npx.cmd eslint` cible sur les fichiers modifies : OK.
- `npm.cmd run build` : OK, avec `/dashboard/concierge/profile`, `/dashboard/notifications`, les messageries et les centres d'alertes generes sans erreur.

### 10.4 Recommandations suivantes

| Recommandation | Impact | Effort | Priorite |
| --- | --- | --- | --- |
| Creer une frise unique du cycle complet : demande, devis, mission, intervention, validation, paiement | Fort | Moyen | P1 |
| Ajouter des notifications email pour nouveau message, devis recu, mission assignee, retard et intervention terminee | Fort | Moyen/Eleve | P1 |
| Ajouter une confirmation d'annulation avec motif recommande selon statut mission | Moyen | Faible | P2 |
| Ajouter des modeles de message contextuels : relance devis, demande de precision, confirmation intervention | Moyen | Moyen | P2 |
| Ajouter des exigences de preuves selon type de mission : photo avant/apres, facture, commentaire, signature | Fort | Moyen | P1 |
| Ajouter un journal d'activite lisible par role sur chaque mission | Moyen | Moyen | P2 |
| Harmoniser les labels de statut entre cartes, filtres, details et alertes | Fort | Faible/Moyen | P1 |
