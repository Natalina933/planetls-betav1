# Master Plan PlanetLS

> Document officiel de pilotage produit, mÃƒÂ©tier et technique  
> Version initiale consolidÃƒÂ©e : 18 juillet 2026  
> Source de vÃƒÂ©ritÃƒÂ© : code du dÃƒÂ©pÃƒÂ´t, schÃƒÂ©mas/migrations, tests, puis documentation historique  
> PropriÃƒÂ©taire du document : direction produit PlanetLS  
> Prochaine revue : ÃƒÂ  chaque fin de lot ou au minimum toutes les deux semaines

> Encodage du document normalise en UTF-8 le 6 aout 2026 pour supprimer les entrees hybrides UTF-8 / Windows-1252.

## 0. Mode d'emploi et gouvernance

Ce document remplace les nouveaux audits transverses comme support de pilotage. Les documents historiques de `docs/` restent conservÃƒÂ©s comme preuves, spÃƒÂ©cifications dÃƒÂ©taillÃƒÂ©es et archives de dÃƒÂ©cisions ; ils ne doivent plus ÃƒÂªtre utilisÃƒÂ©s seuls pour dÃƒÂ©terminer l'ÃƒÂ©tat courant du produit.

### RÃƒÂ¨gles de mise ÃƒÂ  jour

1. Le code, les migrations rÃƒÂ©ellement appliquÃƒÂ©es et les tests exÃƒÂ©cutÃƒÂ©s priment sur les affirmations historiques.
2. Une page ou une route prÃƒÂ©sente ne suffit pas ÃƒÂ  dÃƒÂ©clarer une fonctionnalitÃƒÂ© terminÃƒÂ©e.
3. Une fonctionnalite est `Terminee` seulement si son parcours principal est branche, persistant, autorise cote serveur et valide.
4. Une fonctionnalite est `En cours` si une surface existe mais qu'il manque persistance, couverture de bout en bout, homogeneite ou validation reelle.
5. Une fonctionnalite est `A faire` si elle n'existe qu'en idee ou en specification.
6. Toute nouvelle idÃƒÂ©e va d'abord en section 7. Toute dÃƒÂ©cision prise va dans le journal, puis met ÃƒÂ  jour la roadmap et la checklist si nÃƒÂ©cessaire.
7. Ne pas crÃƒÂ©er un nouvel audit global : mettre ÃƒÂ  jour ce document et lier, si indispensable, une spÃƒÂ©cification spÃƒÂ©cialisÃƒÂ©e.
8. Toute evolution importante susceptible d'affecter le Business Plan doit declencher un `Business Impact Check` selon `docs/business-plan-maintenance.md`, meme si aucune hypothese strategique n'est modifiee dans la meme mission.

### Niveaux de maturitÃƒÂ©

| Niveau | DÃƒÂ©finition |
|---|---|
| N0 Ã¢â‚¬â€ IdÃƒÂ©e | Intention sans conception validÃƒÂ©e |
| N1 Ã¢â‚¬â€ SpÃƒÂ©cifiÃƒÂ© | Parcours/rÃƒÂ¨gles documentÃƒÂ©s, pas de rÃƒÂ©alisation exploitable |
| N2 Ã¢â‚¬â€ Socle | UI, helper ou API partielle ; donnÃƒÂ©es parfois locales ou en `metadata` |
| N3 Ã¢â‚¬â€ Fonctionnel | Parcours principal persistant et utilisable, finitions ou E2E manquants |
| N4 Ã¢â‚¬â€ ValidÃƒÂ© | Parcours complet, permissions, erreurs, tests et QA rÃƒÂ©els validÃƒÂ©s |
| N5 Ã¢â‚¬â€ PilotÃƒÂ© | N4 + mÃƒÂ©triques, alertes et amÃƒÂ©lioration continue |

### CritÃƒÂ¨re de prioritÃƒÂ©

| PrioritÃƒÂ© | Sens |
|---|---|
| Critique | Bloque la fiabilitÃƒÂ©, la sÃƒÂ©curitÃƒÂ©, la donnÃƒÂ©e, le lancement ou un parcours de valeur principal |
| Importante | Augmente fortement conversion, rÃƒÂ©tention ou efficacitÃƒÂ© opÃƒÂ©rationnelle |
| Confort | AmÃƒÂ©liore cohÃƒÂ©rence, lisibilitÃƒÂ© ou productivitÃƒÂ© sans bloquer l'usage |
| Ãƒâ€°volution future | Pari stratÃƒÂ©gique ÃƒÂ  valider avant industrialisation |

---

## 1. Vision du projet

### Mission

PlanetLS aide les professionnels de la location saisonniÃƒÂ¨re ÃƒÂ  se trouver, se faire confiance et travailler ensemble dans un mÃƒÂªme environnement : de l'identitÃƒÂ© professionnelle et la mise en relation jusqu'ÃƒÂ  la demande, au devis, ÃƒÂ  la mission, au sÃƒÂ©jour, au paiement et au suivi opÃƒÂ©rationnel.

### Ambition

Devenir le rÃƒÂ©seau professionnel opÃƒÂ©rationnel de rÃƒÂ©fÃƒÂ©rence de la location saisonniÃƒÂ¨re en France : un rÃƒÂ©seau vivant, local et vÃƒÂ©rifiable, doublÃƒÂ© d'un cockpit mÃƒÂ©tier pour exÃƒÂ©cuter le travail quotidien.

### Valeurs

- **Confiance prouvÃƒÂ©e** : identitÃƒÂ©, certifications, assurance, avis, historique, preuves et statuts explicites.
- **ClartÃƒÂ©** : une prochaine action comprÃƒÂ©hensible, des rÃƒÂ¨gles mÃƒÂ©tier stables, aucun statut ambigu.
- **UtilitÃƒÂ© terrain** : mobile, rapiditÃƒÂ©, disponibilitÃƒÂ©, zones et contraintes rÃƒÂ©elles avant sophistication dÃƒÂ©corative.
- **CoopÃƒÂ©ration** : faire circuler demandes, missions, informations et responsabilitÃƒÂ©s entre acteurs.
- **Professionnalisme humain** : automatiser la charge administrative sans dÃƒÂ©shumaniser la relation locale.
- **TraÃƒÂ§abilitÃƒÂ©** : conserver dÃƒÂ©cisions, ÃƒÂ©vÃƒÂ©nements, documents et arbitrages.
- **AccessibilitÃƒÂ©** : servir aussi bien un utilisateur peu technophile qu'une structure experte en croissance.

### Objectifs

1. RÃƒÂ©duire le temps entre inscription et premiÃƒÂ¨re valeur : profil utile, demande reÃƒÂ§ue ou mission trouvÃƒÂ©e.
2. Fluidifier le cycle `recherche Ã¢â€ â€™ demande Ã¢â€ â€™ devis Ã¢â€ â€™ mission Ã¢â€ â€™ paiement Ã¢â€ â€™ avis`.
3. Donner aux conciergeries un cockpit complet : logements, propriÃƒÂ©taires, rÃƒÂ©servations, ÃƒÂ©quipe, maintenance, finance et prestataires.
4. Donner aux propriÃƒÂ©taires visibilitÃƒÂ©, contrÃƒÂ´le et confiance sans complexitÃƒÂ© opÃƒÂ©rationnelle.
5. Donner aux artisans un canal qualifiÃƒÂ© de missions locales et un outil de suivi mobile.
6. CrÃƒÂ©er une densitÃƒÂ© locale visible pour rÃƒÂ©soudre le dÃƒÂ©marrage du rÃƒÂ©seau.
7. Piloter activation, conversion, qualitÃƒÂ© et liquiditÃƒÂ© locale par des KPI fiables.

### Positionnement

PlanetLS n'est ni un simple annuaire, ni uniquement une marketplace, ni seulement un logiciel de conciergerie. Son positionnement cible combine :

- un **rÃƒÂ©seau professionnel vertical** centrÃƒÂ© sur la location saisonniÃƒÂ¨re ;
- une **marketplace locale de besoins et de missions** ;
- un **systÃƒÂ¨me opÃƒÂ©rationnel partagÃƒÂ©** pour rÃƒÂ©aliser, documenter et payer le travail.

Le point d'entrÃƒÂ©e peut varier par acteur, mais le produit doit converger vers un graphe commun : personnes, entreprises, logements, zones, services, demandes, missions, sÃƒÂ©jours et preuves.

### DiffÃƒÂ©renciation

- RÃƒÂ©seau spÃƒÂ©cialisÃƒÂ© plutÃƒÂ´t que plateforme gÃƒÂ©nÃƒÂ©raliste de services.
- ContinuitÃƒÂ© entre dÃƒÂ©couverte et exÃƒÂ©cution, lÃƒÂ  oÃƒÂ¹ les annuaires s'arrÃƒÂªtent au contact.
- DonnÃƒÂ©es mÃƒÂ©tier propres ÃƒÂ  la location saisonniÃƒÂ¨re : check-in/out, mÃƒÂ©nage, linge, maintenance, voyageurs, planning, SLA et urgence.
- Profils orientÃƒÂ©s preuves et capacitÃƒÂ© rÃƒÂ©elle, pas seulement prÃƒÂ©sentation.
- ExpÃƒÂ©rience adaptÃƒÂ©e ÃƒÂ  chaque rÃƒÂ´le, avec permissions et donnÃƒÂ©es partagÃƒÂ©es maÃƒÂ®trisÃƒÂ©es.
- DensitÃƒÂ© locale rendue visible par le fil, la carte et le mur des missions.

### Proposition de valeur par cible

- **PropriÃƒÂ©taire** : trouver les bons professionnels, comparer clairement et suivre son logement sans perdre le contrÃƒÂ´le.
- **Concierge** : gagner des mandats, organiser l'exploitation, coordonner ÃƒÂ©quipes et artisans, maÃƒÂ®triser marge et qualitÃƒÂ©.
- **Artisan / commerÃƒÂ§ant** : recevoir des missions locales qualifiÃƒÂ©es, prouver son sÃƒÂ©rieux et simplifier intervention, devis et facturation.
- **Ãƒâ€°quipe** : savoir quoi faire, oÃƒÂ¹, quand et avec quelles consignes, puis laisser une preuve exploitable.
- **Administrateur** : garantir sÃƒÂ©curitÃƒÂ©, qualitÃƒÂ© du rÃƒÂ©seau, rÃƒÂ©solution des blocages et pilotage de la croissance.

---

## 2. Acteurs et objectifs

| Acteur | Objectifs principaux | PremiÃƒÂ¨re valeur attendue | CritÃƒÂ¨re de rÃƒÂ©ussite |
|---|---|---|---|
| PropriÃƒÂ©taire | Trouver une concierge ou un prestataire fiable, formuler son besoin, comparer, suivre missions, paiements et documents | Obtenir une premiÃƒÂ¨re rÃƒÂ©ponse qualifiÃƒÂ©e | Demande transformÃƒÂ©e en collaboration puis mission rÃƒÂ©ussie |
| PropriÃƒÂ©taire professionnel | Piloter plusieurs biens, partenaires, revenus, incidents et niveaux de service | Importer/crÃƒÂ©er ses biens et identifier les responsables | Portefeuille suivi sans outils parallÃƒÂ¨les |
| Concierge / conciergerie | Trouver des propriÃƒÂ©taires, recevoir des demandes, vendre des packs, gÃƒÂ©rer logements, sÃƒÂ©jours, planning, ÃƒÂ©quipe, artisans et finances | Recevoir une demande ou intÃƒÂ©grer un premier logement | ActivitÃƒÂ© quotidienne pilotÃƒÂ©e dans PlanetLS |
| Artisan / prestataire | Afficher mÃƒÂ©tiers, zone, disponibilitÃƒÂ© et preuves ; accepter des interventions ; ÃƒÂ©changer, deviser et facturer | Voir ou recevoir une mission pertinente ÃƒÂ  proximitÃƒÂ© | Intervention rÃƒÂ©alisÃƒÂ©e, prouvÃƒÂ©e et payÃƒÂ©e |
| CommerÃƒÂ§ant | Proposer produits ou services locaux rÃƒÂ©currents aux logements/conciergeries | ÃƒÅ tre dÃƒÂ©couvert sur une zone et un besoin prÃƒÂ©cis | Commande ou partenariat rÃƒÂ©current ; rÃƒÂ´le encore ÃƒÂ  spÃƒÂ©cifier sÃƒÂ©parÃƒÂ©ment de l'artisan |
| Ãƒâ€°quipe de conciergerie | Recevoir les affectations, exÃƒÂ©cuter checklists, signaler blocages, ajouter photos/signature | Voir le planning et la mission du jour | Mission clÃƒÂ´turÃƒÂ©e avec preuve, sans ressaisie |
| Administrateur | GÃƒÂ©rer utilisateurs, rÃƒÂ´les, conformitÃƒÂ©, opÃƒÂ©rations, qualitÃƒÂ©, KPI et incidents | Identifier un compte ou workflow bloquÃƒÂ© | RÃƒÂ©seau sain, support rapide et mÃƒÂ©triques fiables |
| Voyageur | Recevoir des informations de sÃƒÂ©jour et signaler un besoin, sans ÃƒÂªtre ÃƒÂ©valuÃƒÂ© ni surprofilÃƒÂ© | AccÃƒÂ©der aux informations utiles de son sÃƒÂ©jour | ArrivÃƒÂ©e/dÃƒÂ©part fluide ; rÃƒÂ´le externe prÃƒÂ©vu, pas encore un espace utilisateur autonome |

### Principes de responsabilitÃƒÂ©

- Le propriÃƒÂ©taire dÃƒÂ©cide du besoin, du devis et du paiement.
- La conciergerie orchestre l'exploitation et les intervenants autorisÃƒÂ©s.
- L'artisan exÃƒÂ©cute son pÃƒÂ©rimÃƒÂ¨tre et fournit les preuves nÃƒÂ©cessaires.
- L'ÃƒÂ©quipe n'accÃƒÂ¨de qu'aux logements, missions et donnÃƒÂ©es utiles ÃƒÂ  son affectation.
- L'administrateur supervise mais les actions sensibles doivent rester tracÃƒÂ©es.
- Le voyageur reste un bÃƒÂ©nÃƒÂ©ficiaire opÃƒÂ©rationnel ; aucun scoring sensible ou profil commercial implicite.

---

## 3. Ãƒâ€°tat actuel du projet au 18 juillet 2026

### Photographie technique vÃƒÂ©rifiÃƒÂ©e

- Next.js App Router 16.1.6, React 19, TypeScript, Supabase, NextAuth, SCSS et Vercel.
- 118 pages App Router, 103 routes API, 42 fichiers de tests et 76 composants TSX/JSX sous `src/components` et `src/features`.
- 158 tests exÃƒÂ©cutÃƒÂ©s le 18/07/2026 : 158 rÃƒÂ©ussis, aucun ÃƒÂ©chec.
- Les migrations sont rÃƒÂ©parties entre `supabase/migrations` et `database/migrations` : cette double source reste une dette de gouvernance.
- Les rÃƒÂ´les owner, concierge, provider/artisan et admin disposent de surfaces dÃƒÂ©diÃƒÂ©es.

### Tableau fonctionnel construit depuis le code

| FonctionnalitÃƒÂ© | Ãƒâ€°tat | Niveau | Observations factuelles |
|---|---|---:|---|
| Authentification, inscription, rÃƒÂ´les | En cours | N3 | Login/register, NextAuth, proxy et guards API prÃƒÂ©sents ; un garde CSRF central bloque dÃƒÂ©sormais les mutations `/api` hors mÃƒÂªmes origines autorisÃƒÂ©es avec exemptions explicites pour `/api/auth`, webhook Stripe et appels serveur-ÃƒÂ -serveur signÃƒÂ©s ; onboarding et catÃƒÂ©gories legacy restent complexes ; E2E absent |
| Onboarding multi-profils | En cours | N3 | Tunnel multi-ÃƒÂ©tapes et ÃƒÂ©vÃƒÂ©nements prÃƒÂ©sents ; personnalisation concierge plus mÃƒÂ»re que owner/provider ; cohÃƒÂ©rence et instrumentation ÃƒÂ  finir |
| Dashboard propriÃƒÂ©taire | En cours | N3 | Cockpit riche et donnÃƒÂ©es rÃƒÂ©elles ; la vue d'ensemble `/dashboard/owner` s'appuie maintenant sur un socle partagÃƒÂ© `UnifiedRoleDashboard` avec listes spotlight et piles de stats rÃƒÂ©utilisables pour prioritÃƒÂ©s, missions et sÃƒÂ©jours ; une entree `Performance & rentabilite locative` est maintenant remontee directement dans `A traiter maintenant` et pointe vers `/dashboard/owner/finances/overview` ; quelques strates historiques et ÃƒÂ©tats UX restent ÃƒÂ  harmoniser sur les pages secondaires ; aucun module canonique branche sur des donnees owner reelles n'existe encore, meme si les reservations, factures, missions et quelques couts potentiels existent deja comme socle |
| Dashboard concierge | En cours | N3 | Surface la plus avancÃƒÂ©e : cockpit, modes, objectifs, alertes, finance, CRM, maintenance ; la vue d'ensemble `/dashboard/concierge` utilise dÃƒÂ©jÃƒÂ  le mÃƒÂªme socle UI partagÃƒÂ© `UnifiedRoleDashboard` et conserve ses widgets, modes d'exploitation et agrÃƒÂ©gations mÃƒÂ©tier propres ; plusieurs fonctions rÃƒÂ©centes restent partiellement locales/`metadata` |
| Dashboard artisan/provider | En cours | N3 | E2E mission Ã¢â€ â€™ intervention Ã¢â€ â€™ preuve mÃƒÂ©dia privÃƒÂ©e Ã¢â€ â€™ facture liÃƒÂ©e validÃƒÂ© ; la vue d'ensemble `/dashboard/provider` converge maintenant elle aussi vers le socle UI partagÃƒÂ© `UnifiedRoleDashboard`, avec prioritÃƒÂ©s, planning, devis, activitÃƒÂ© et rails latÃƒÂ©raux homogÃƒÂ©nÃƒÂ©isÃƒÂ©s sans fusionner la logique provider ; profil mÃƒÂ©tier ÃƒÂ©ditable et persistant (activitÃƒÂ©, zone, disponibilitÃƒÂ©, tarifs, expÃƒÂ©rience, identitÃƒÂ© lÃƒÂ©gale, assurance, certifications) ; paiement et preuves documentaires restent incomplets |
| Dashboard administrateur | En cours | N3 | Mission Control admin recentrÃƒÂ© sur prioritÃƒÂ©s, activitÃƒÂ©, tables mÃƒÂ©tier, graphiques d'activation, donuts de rÃƒÂ©partition/contrÃƒÂ´le, cartes de santÃƒÂ© visuelles par section, hero ÃƒÂ©ditorial premium et filtres segment/pÃƒÂ©riode ; la page `controle` suit maintenant le mÃƒÂªme niveau premium avec hero santÃƒÂ©, onglets de premier niveau `SantÃƒÂ© globale / Inscriptions / Missions / Messages` et surfaces de pilotage plus lisibles ; la vue d'ensemble `/dashboard/admin` converge dÃƒÂ©sormais aussi vers le socle partagÃƒÂ© `UnifiedRoleDashboard`, ce qui aligne le hero, les KPI et les rails latÃƒÂ©raux avec l'espace propriÃƒÂ©taire tout en conservant les agrÃƒÂ©gations admin existantes ; le parseur d'actions admin accepte aussi des identifiants systÃƒÂ¨me stables non UUID pour prÃƒÂ©parer le suivi d'incidents transverses sans casser les cibles mÃƒÂ©tier existantes ; la page `developpement` est maintenant recentrÃƒÂ©e sur l'exÃƒÂ©cution technique `Master Plan, Mission Control, Roadmap, MÃƒÂ©moire, Journal`, avec le `Tableau fonctionnel / Master Plan` placÃƒÂ© en premier et sans le `Conseiller projet` ; la page `/dashboard/admin/pilotage` synthÃƒÂ©tise dÃƒÂ©sormais acquisition, activation, pipeline missions, conversion de facturation, tensions business et actions recommandÃƒÂ©es ÃƒÂ  partir des endpoints admin existants, affiche une lecture financiÃƒÂ¨re plus directive `prix, abonnement, commission, rÃƒÂ©serve solidaire`, conserve un bloc `Due diligence investisseur` avec verdict, scores, questions critiques, red flags et conditions avant levÃƒÂ©e, et rÃƒÂ©cupÃƒÂ¨re maintenant les arbitrages utiles issus du dÃƒÂ©veloppement via une route admin dÃƒÂ©diÃƒÂ©e `/api/admin/project-advisor` ; lecture dÃƒÂ©gradÃƒÂ©e maintenue quand certaines sources sont indisponibles ; responsive mobile des tableaux et accessibilitÃƒÂ© clavier/lecteur d'ÃƒÂ©cran renforcÃƒÂ©es ; overview, contrÃƒÂ´le, pilotage, utilisateurs et vues par rÃƒÂ´le reliÃƒÂ©s ; validations connectÃƒÂ©es et navigation E2E encore ÃƒÂ  renforcer |
| Profils professionnels | En cours | N3 | Profil concierge riche, owner preferences persistÃƒÂ©es ; profil artisan enrichi et persistant avec complÃƒÂ©tude mÃƒÂ©tier ; la page publique concierge `/concierges/[id]` expose maintenant aussi une mini-surface type Linktree avec liens utiles `site web, LinkedIn, Instagram, Facebook`, une section `Actions recommandÃƒÂ©es` et un tracking lÃƒÂ©ger des CTA issus du profil existant, sans nouveau modÃƒÂ¨le de donnÃƒÂ©es ; l'ouverture aux profils provider est volontairement reportÃƒÂ©e tant que leurs signaux publics de confiance et leurs CTA mÃƒÂ©tier ne sont pas mieux stabilisÃƒÂ©s ; portfolio, piÃƒÂ¨ces justificatives vÃƒÂ©rifiÃƒÂ©es, avis et historique complet non aboutis |
| Recherche et matching de concierges | En cours | N3 | Recherche, filtres, cartes publiques, alertes et sÃƒÂ©lection multi-destinataires ; qualitÃƒÂ© dÃƒÂ©pend de la densitÃƒÂ© et de champs legacy |
| Demandes de service | En cours | N3 | E2E demande Ã¢â€ â€™ devis acceptÃƒÂ© Ã¢â€ â€™ mission Ã¢â€ â€™ facture payÃƒÂ©e par webhook Stripe signÃƒÂ© validÃƒÂ© ; crÃƒÂ©ation de la session Checkout hÃƒÂ©bergÃƒÂ©e reste ÃƒÂ  couvrir avec une clÃƒÂ© test |
| Devis | En cours | N3 | CrÃƒÂ©ation, documents, consultation, comparaison, acceptation/refus et lien demande prÃƒÂ©sents ; parcours complet ÃƒÂ  valider |
| Missions | En cours | N3 | CRUD, permissions, statuts, dÃƒÂ©tails riches, fichiers, ÃƒÂ©vÃƒÂ©nements et affectations ; plusieurs donnÃƒÂ©es riches sont en `metadata` |
| Missions urgentes | En cours | N3 | Publication/acceptation et surfaces owner/concierge prÃƒÂ©sentes ; liquiditÃƒÂ© rÃƒÂ©elle et rÃƒÂ¨gles d'attribution ÃƒÂ  ÃƒÂ©prouver |
| Planning | En cours | N3 | Pages owner/concierge/provider, calendrier et statuts ; planification aprÃƒÂ¨s paiement validÃƒÂ©e E2E owner/concierge ; garde anti-chevauchement actif ; charge quotidienne visible ; table ÃƒÂ©quipe, RLS et API ajoutÃƒÂ©es avec repli local ; migration Supabase ÃƒÂ  appliquer avant persistance rÃƒÂ©elle, puis drag-and-drop et temps de trajet ÃƒÂ  consolider |
| Logements | En cours | N3 | CrÃƒÂ©ation, ÃƒÂ©dition, photos, vues owner/concierge et collaborations ; coexistence `housing`/`properties` ÃƒÂ  normaliser |
| Messagerie owner/concierge | En cours | N3 | Conversations/messages et UI des deux rÃƒÂ´les ; temps rÃƒÂ©el, notifications et parcours E2E ÃƒÂ  confirmer |
| Messagerie provider | En cours | N3 | API et UI prÃƒÂ©sentes, synchronisation du dernier message durcie ; QA fermeture/rÃƒÂ©ouverture et chaÃƒÂ®ne client-intervention incomplÃƒÂ¨tes |
| Notifications et alertes | En cours | N2 | Centre de notifications, alertes concierge/provider et ÃƒÂ©vÃƒÂ©nements existent ; distribution uniforme, push et prÃƒÂ©fÃƒÂ©rences manquent |
| Factures et paiements | En cours | N3 | Factures, documents, checkout/sync/webhook, acompte/solde modÃƒÂ©lisÃƒÂ©s ; webhook de paiement signÃƒÂ© validÃƒÂ© E2E, Checkout hÃƒÂ©bergÃƒÂ© et ÃƒÂ©checs visibles restent partiels |
| Tarification, packs et contrats | En cours | N3 | Pricing, segments, rÃƒÂ¨gles, scÃƒÂ©narios, packs et modÃƒÂ¨les de contrat ; complexitÃƒÂ© ÃƒÂ©levÃƒÂ©e et validation mÃƒÂ©tier de bout en bout ÃƒÂ  faire |
| CRM propriÃƒÂ©taires | En cours | N2 | Helper et page contacts enrichie ; consolidation utile, mais persistance dÃƒÂ©diÃƒÂ©e et timeline unifiÃƒÂ©e non finalisÃƒÂ©es |
| Ãƒâ€°quipe et affectations | En cours | N2 | ModÃƒÂ¨le mÃƒÂ©tier, page et action d'affectation ; tables spÃƒÂ©cialisÃƒÂ©es, permissions fines et persistance complÃƒÂ¨te manquent |
| RÃƒÂ©servations et sÃƒÂ©jours voyageurs | En cours | N2 | Moteur, API rÃƒÂ©servations, API sÃƒÂ©jours, page concierge et tests ; donnÃƒÂ©es principalement via missions/`metadata`, pas d'espace voyageur ; la route `/api/reservations/[id]` s'aligne maintenant sur le type partagÃƒÂ© `TravelerStayMissionRow` au lieu d'un cast gÃƒÂ©nÃƒÂ©rique ; clarification mÃƒÂ©tier formalisÃƒÂ©e le mercredi 29 juillet 2026 : la rÃƒÂ©servation ou le sÃƒÂ©jour doit devenir l'objet canonique partagÃƒÂ© entre propriÃƒÂ©taire et conciergerie, les missions restant des actions d'exÃƒÂ©cution liÃƒÂ©es, avec interventions artisans en troisiÃƒÂ¨me niveau |
| Maintenance et artisans | En cours | N3 | Affectation, exÃƒÂ©cution, preuve mÃƒÂ©dia privÃƒÂ©e avec empreinte SHA-256 et facture provider liÃƒÂ©e validÃƒÂ©es E2E ; paiement reste ÃƒÂ  couvrir |
| Litiges et preuves | En cours | N2 | Migrations inspections/litiges, routes API et page owner existent ; l'export HTML de dossier litige ne diffuse plus d'URLs publiques Storage et gÃƒÂ©nÃƒÂ¨re dÃƒÂ©sormais des liens signÃƒÂ©s temporaires pour les preuves ; parcours obligatoire post-checkout et validation E2E non prouvÃƒÂ©s |
| Carte interactive rÃƒÂ©seau | Ã°Å¸â€Â´ Non commencÃƒÂ©e | N1 | BibliothÃƒÂ¨ques carte et prototypes de recherche existent, mais pas de carte unifiÃƒÂ©e acteurs + missions + recherches |
| Fil d'actualitÃƒÂ© professionnel | Ã°Å¸â€Â´ Non commencÃƒÂ©e | N0 | Aucun modÃƒÂ¨le ni flux rÃƒÂ©seau professionnel canonique |
| Mur des missions | Ã°Å¸â€Â´ Non commencÃƒÂ©e | N1 | Les missions urgentes fournissent un socle, sans marketplace gÃƒÂ©olocalisÃƒÂ©e ouverte et filtrable |
| Avis, rÃƒÂ©putation et certifications | En cours | N2 | API reviews et champs de profil existent ; expÃƒÂ©rience complÃƒÂ¨te, modÃƒÂ©ration et preuves vÃƒÂ©rifiÃƒÂ©es non abouties |
| KPI produit | En cours | N3 | Endpoint overview et affichage admin ; activation J+7, temps de premiÃƒÂ¨re valeur, conversion et sÃƒÂ©ries fiables disponibles ; en local, `/api/kpis/overview` injecte dÃƒÂ©sormais des cohortes workspace crÃƒÂ©dibles quand Supabase est inaccessible ou quand aucune cohorte mature n'existe encore ; en connectÃƒÂ©, un seed persistant `scripts/seed-admin-workspace-kpis.mjs` peuple dÃƒÂ©sormais Supabase en profils/workflows KPI rattachÃƒÂ©s ÃƒÂ  l'e-mail admin cible, et l'endpoint KPI retombe proprement sur `provider_interventions` quand la base distante ne publie pas encore `provider_profile_id` sur `missions`, `quotes` ou `invoices` ; inspection distante du mercredi 29 juillet 2026 : `missions` existe mais n'expose pas `title`, `request_id` ni `provider_profile_id`, alors que `quotes.service_request_id`, `invoices.quote_id` et `provider_interventions.provider_profile_id` sont bien prÃƒÂ©sents |
| Tests E2E navigateur | Partiel | N3 | Parcours critiques et transactionnels passent ; branche owner Checkout hÃƒÂ©bergÃƒÂ©e prÃƒÂªte avec carte Stripe test, retour et synchronisation ; exÃƒÂ©cution rÃƒÂ©elle bloquÃƒÂ©e par lÃ¢â‚¬â„¢absence de E2E_STRIPE_SECRET_KEY |
| Responsive et accessibilitÃƒÂ© | En cours | N3 | Socle, checklists et composants accessibles ; audit systÃƒÂ©matique clavier/mobile et tests automatisÃƒÂ©s manquent |
| Design system | En cours | N3 | Primitives, tokens, route showcase et direction Art DÃƒÂ©co ; double strate UI, snapshot portable et tests au vert |
| SEO et acquisition publique | En cours | N2 | Pages publiques et profils publics prÃƒÂ©sents ; la home expose dÃƒÂ©sormais aussi une intention ÃƒÂ©ditoriale sur l'impact solidaire/humanitaire du rÃƒÂ©seau, sans mÃƒÂ©canique mÃƒÂ©tier ni paiement associatif branchÃƒÂ©s ÃƒÂ  ce stade ; les profils concierges publics disposent maintenant d'un bloc `Liens utiles` type Linktree, d'une section `Actions recommandÃƒÂ©es` et d'une instrumentation lÃƒÂ©gÃƒÂ¨re de clics CTA branchÃƒÂ©e sur les champs dÃƒÂ©jÃƒÂ  persistÃƒÂ©s, ce qui amÃƒÂ©liore l'actionnabilitÃƒÂ© sans ouvrir encore un vrai cockpit acquisition ni des CTA provider ; metadata, Open Graph, JSON-LD, pages locales et mesure acquisition restent ÃƒÂ  faire |
| PWA / push / hors ligne | Ã°Å¸â€Â´ Non commencÃƒÂ©e | N1 | Intentions mobile documentÃƒÂ©es ; checklist/signature actuellement locales, pas de PWA terrain industrialisÃƒÂ©e |
| Assistant dÃƒÂ©coration | Partiel | N2 | Page/API, moteur, migration/RLS et tests prÃƒÂ©sents ; E2E lecture passe mais la table n'est pas appliquÃƒÂ©e sur la base connectÃƒÂ©e ; image, partage owner et validation terrain restent ÃƒÂ  finaliser |

### Lecture synthÃƒÂ©tique

Le produit est **fonctionnellement large mais pas encore validÃƒÂ© comme un tout**. Le meilleur qualificatif global est `N3 Ã¢â‚¬â€ Fonctionnel en consolidation`. Le risque principal n'est pas l'absence de pages ; c'est l'ÃƒÂ©cart entre richesse apparente, persistance rÃƒÂ©elle, cohÃƒÂ©rence des modÃƒÂ¨les et preuve E2E.

---

## 4. Audit documentaire consolidÃƒÂ©

### Enseignements conservÃƒÂ©s

- RÃƒÂ©utiliser les composants et helpers existants avant de crÃƒÂ©er une nouvelle strate.
- Concevoir chaque profil selon son persona et sa premiÃƒÂ¨re valeur, avec un socle commun limitÃƒÂ©.
- Garder une distinction nette entre demande, devis, mission et paiement.
- Centraliser statuts et transitions dans les helpers mÃƒÂ©tier partagÃƒÂ©s.
- Faire du mobile terrain une prioritÃƒÂ© pour ÃƒÂ©quipes et artisans.
- Exposer confiance, zone, disponibilitÃƒÂ©, services et preuve prÃƒÂ¨s de chaque dÃƒÂ©cision.
- Harmoniser loading, vide, erreur, succÃƒÂ¨s, focus et prochaine action.
- Piloter activation, dÃƒÂ©lai de premiÃƒÂ¨re valeur, conversion, qualitÃƒÂ© et liquiditÃƒÂ©.
- Conserver l'Art DÃƒÂ©co comme accent structurel sobre, jamais au dÃƒÂ©triment de la lecture.

### Familles de doublons fusionnÃƒÂ©es

| Famille documentaire | Documents concernÃƒÂ©s | DÃƒÂ©cision canonique |
|---|---|---|
| Onboarding/personas | audits concierge des 25Ã¢â‚¬â€œ26/04, gap analysis 29/04, reprise UX 29/04 | Conserver les personas simplicitÃƒÂ©/expert ; statut courant dans ce Master Plan |
| Audit global par rÃƒÂ´les | audit approfondi 18/05, audit code/permissions 18/06, audits Sprint 1 des 07 et 12/07 | Le prÃƒÂ©sent tableau fonctionnel devient la vue officielle |
| Demande Ã¢â€ â€™ devis Ã¢â€ â€™ mission Ã¢â€ â€™ paiement | trois audits des 05Ã¢â‚¬â€œ06/06 + architecture composants | Un workflow partagÃƒÂ©, statuts centralisÃƒÂ©s, pas de composants parallÃƒÂ¨les |
| Profils utilisateurs | audit 18/06, cartographie, matrice, spec cible, tickets/issues, reprise owner du 19/06 | La spec persona reste dÃƒÂ©taillÃƒÂ©e ; roadmap/checklist ici fait foi |
| UX/UI | guide UX, blueprint premium, design system, handoff Figma, audit UI, checklist responsive | Un seul principe : cockpit calme, preuve visible, primitives partagÃƒÂ©es, mobile et a11y obligatoires |
| QA/KPI | checklist P0, runbook E2E, cadrage KPI | Les scÃƒÂ©narios restent des annexes d'exÃƒÂ©cution ; leur statut est suivi ici |

### Contradictions et ÃƒÂ©carts dÃƒÂ©tectÃƒÂ©s

1. **Ã¢â‚¬Å“Socle exploitable en productionÃ¢â‚¬Â contre absence de validation E2E.** Les audits de mai qualifient les trois espaces d'exploitables, mais le runbook ne prouve aucun parcours complet ; l'unique essai owner est `FAIL partiel`. Statut officiel : N3, pas N4.
2. **Ã¢â‚¬Å“Build et validations au vertÃ¢â‚¬Â contre baseline UI datÃƒÂ©e.** L'audit du 12/07 rapportait un build valide, mais le snapshot UI n'avait pas ÃƒÂ©tÃƒÂ© actualisÃƒÂ© aprÃƒÂ¨s les ÃƒÂ©volutions des primitives et dÃƒÂ©pendait des fins de ligne du systÃƒÂ¨me. Le test a ÃƒÂ©tÃƒÂ© rendu portable et la baseline doit rester une dÃƒÂ©cision de revue explicite.
3. **FonctionnalitÃƒÂ© crÃƒÂ©ÃƒÂ©e contre fonctionnalitÃƒÂ© persistÃƒÂ©e.** CRM, ÃƒÂ©quipe, maintenance, mobile et une partie des rÃƒÂ©servations disposent de helpers/UI/tests, mais les documents rÃƒÂ©cents reconnaissent l'usage de `metadata` ou du stockage local en attente de tables dÃƒÂ©diÃƒÂ©es. Ils restent N2.
4. **Profil artisan Ã¢â‚¬Å“workspace completÃ¢â‚¬Â contre audit profils.** Le workspace existe, mais le profil mÃƒÂ©tier, les mÃƒÂ©tiers/spÃƒÂ©cialitÃƒÂ©s, preuves, disponibilitÃƒÂ©s, avis et complÃƒÂ©tude ne forment pas encore une identitÃƒÂ© professionnelle complÃƒÂ¨te.
5. **Voyageur Ã¢â‚¬Å“module livrÃƒÂ©Ã¢â‚¬Â contre acteur autonome.** Le centre sÃƒÂ©jours est bien livrÃƒÂ© pour la concierge ; le voyageur n'a pas d'espace ou d'identitÃƒÂ© autonome. Il reste acteur externe prÃƒÂ©vu.
6. **Source de schÃƒÂ©ma ambiguÃƒÂ«.** Deux dossiers de migrations coexistent et les types Supabase ne couvrent pas toutes les tables ; il faut choisir `supabase/migrations` comme source canonique et rÃƒÂ©gÃƒÂ©nÃƒÂ©rer les types.
7. **Design system stabilisÃƒÂ© contre double strate UI.** Les primitives sont solides, mais `src/components/ui` et `src/app/components/ui` coexistent et de nombreux SCSS locaux divergent encore.
8. **React/Next alignement.** Next est en 16.1.6, tandis que `react` et `react-dom` sont dÃƒÂ©clarÃƒÂ©s `^19.0.0`; une vÃƒÂ©rification de version rÃƒÂ©solue et des correctifs de sÃƒÂ©curitÃƒÂ© doit ÃƒÂªtre intÃƒÂ©grÃƒÂ©e au lot de stabilisation.

### Informations devenues obsolÃƒÂ¨tes

- Le conflit Git historique de l'API register signalÃƒÂ© en avril n'est plus prÃƒÂ©sent.
- L'absence d'espace artisan dÃƒÂ©crite dans les premiers audits est dÃƒÂ©passÃƒÂ©e : un workspace provider existe.
- L'absence de preferences owner est dÃƒÂ©passÃƒÂ©e : page, politique de patch et tests existent depuis juin.
- L'absence de sÃƒÂ©jours voyageurs cÃƒÂ´tÃƒÂ© concierge est dÃƒÂ©passÃƒÂ©e depuis le 12/07.
- Les feuilles de route datÃƒÂ©es d'avril ÃƒÂ  juin ne doivent plus ÃƒÂªtre exÃƒÂ©cutÃƒÂ©es dans leur ordre initial ; leurs ÃƒÂ©lÃƒÂ©ments non rÃƒÂ©alisÃƒÂ©s sont repris dans la roadmap ci-dessous.
- Les nombres de pages/routes citÃƒÂ©s dans les anciens audits sont des instantanÃƒÂ©s et ne doivent plus ÃƒÂªtre recopiÃƒÂ©s comme ÃƒÂ©tat courant.

### RÃƒÂ´le futur des documents existants

Les spÃƒÂ©cifications dÃƒÂ©taillÃƒÂ©es restent valables lorsqu'elles dÃƒÂ©crivent des rÃƒÂ¨gles mÃƒÂ©tier non reproduites ici : tarification, litiges, profils, accessibilitÃƒÂ© et scÃƒÂ©narios E2E. Elles sont des **annexes**, pas des tableaux de bord concurrents. Aucun document n'est supprimÃƒÂ©.

---

## 5. Audit des fonctionnalitÃƒÂ©s et prioritÃƒÂ©s

### TerminÃƒÂ©es au sens Ã¢â‚¬Å“socle livrÃƒÂ©Ã¢â‚¬Â, ÃƒÂ  prÃƒÂ©server

- Architecture App Router et espaces sÃƒÂ©parÃƒÂ©s owner/concierge/provider/admin.
- Guards d'autorisation mÃƒÂ©tier cÃƒÂ´tÃƒÂ© API et tests de permissions principaux.
- Workflow partagÃƒÂ© demande/devis/mission et helpers de statuts.
- CrÃƒÂ©ation/ÃƒÂ©dition de logements et recherche publique de concierges.
- APIs de facturation, documents, checkout et synchronisation.
- Design tokens, primitives UI et composants opÃƒÂ©rationnels rÃƒÂ©utilisables.
- Tests unitaires/contrats mÃƒÂ©tier ÃƒÂ©tendus.

Ces ÃƒÂ©lÃƒÂ©ments ne sont pas tous N4 ; Ã¢â‚¬Å“terminÃƒÂ©sÃ¢â‚¬Â signifie ici qu'ils ne doivent pas ÃƒÂªtre recrÃƒÂ©ÃƒÂ©s, mais consolidÃƒÂ©s.

### IncomplÃƒÂ¨tes Ã¢â‚¬â€ prioritÃƒÂ© critique

| FonctionnalitÃƒÂ© | Manque principal | Sortie attendue |
|---|---|---|
| Parcours E2E par rÃƒÂ´le | Aucun scÃƒÂ©nario automatisÃƒÂ© complet | Owner et concierge : inscription/connexion Ã¢â€ â€™ demande Ã¢â€ â€™ devis Ã¢â€ â€™ mission Ã¢â€ â€™ paiement ; provider : mission Ã¢â€ â€™ intervention Ã¢â€ â€™ preuve Ã¢â€ â€™ facture |
| SÃƒÂ©curitÃƒÂ© CSRF en environnement rÃƒÂ©el | La dÃƒÂ©fense centrale existe cÃƒÂ´tÃƒÂ© proxy, mais la validation E2E multi-origines et le contrÃƒÂ´le des exemptions signÃƒÂ©es restent ÃƒÂ  confirmer en conditions proches production | VÃƒÂ©rifications navigateur/API sur mutations protÃƒÂ©gÃƒÂ©es, exemptions Stripe et appels serveur-ÃƒÂ -serveur documentÃƒÂ©es et rejouÃƒÂ©es |
| Persistance des modules rÃƒÂ©cents | `metadata` et local storage pour ÃƒÂ©quipe, maintenance, mobile, rÃƒÂ©servations | Tables, RLS, Storage, types gÃƒÂ©nÃƒÂ©rÃƒÂ©s, migration et tests d'intÃƒÂ©gration |
| Gouvernance Supabase | Deux sources de migrations, types incomplets | Source canonique, inventaire appliquÃƒÂ©, types rÃƒÂ©gÃƒÂ©nÃƒÂ©rÃƒÂ©s, suppression progressive des casts loose |
| QualitÃƒÂ© CI | Baseline UI ÃƒÂ  maintenir aprÃƒÂ¨s revue | Snapshot portable LF/CRLF, mise ÃƒÂ  jour volontaire aprÃƒÂ¨s ÃƒÂ©volution acceptÃƒÂ©e |
| ObservabilitÃƒÂ© produit | KPI de conversion/activation incomplets | Ãƒâ€°vÃƒÂ©nements fiables et dashboard funnel par rÃƒÂ´le/zone |
| Profil artisan | IdentitÃƒÂ© mÃƒÂ©tier et confiance incomplÃƒÂ¨tes | MÃƒÂ©tiers, spÃƒÂ©cialitÃƒÂ©s, zone, disponibilitÃƒÂ©, documents, portfolio, complÃƒÂ©tude |

### IncomplÃƒÂ¨tes Ã¢â‚¬â€ prioritÃƒÂ© importante

- Statuts et prochaines actions homogÃƒÂ¨nes sur demandes, devis, missions, factures et paiements.
- Notifications structurÃƒÂ©es, prÃƒÂ©fÃƒÂ©rences et relances ; push plus tard.
- Temps rÃƒÂ©el et robustesse de messagerie sur les trois rÃƒÂ´les.
- Planning avec conflits, capacitÃƒÂ©, affectation et distances.
- Paiement consolidÃƒÂ© au niveau mission, traitement visible des ÃƒÂ©checs et relances.
- Litiges/preuves obligatoires selon rÃƒÂ¨gles de checkout.
- Profil owner/concierge/provider unifiÃƒÂ© sans conteneur polymorphe `availability_hours`.
- Lecture acquisition publique des CTA rÃƒÂ©ellement cliquÃƒÂ©s, avec agrÃƒÂ©gation exploitable cÃƒÂ´tÃƒÂ© admin.
- AccessibilitÃƒÂ© clavier, focus trap et responsive vÃƒÂ©rifiÃƒÂ©s sur les parcours critiques.
- Encodage franÃƒÂ§ais rÃƒÂ©siduel et cohÃƒÂ©rence UI.

### Manquantes Ã¢â‚¬â€ prioritÃƒÂ© stratÃƒÂ©gique importante

- Carte rÃƒÂ©seau unifiÃƒÂ©e.
- Mur des missions local et mÃƒÂ©canisme de candidature/attribution.
- Fil d'actualitÃƒÂ© professionnel utile et modÃƒÂ©rÃƒÂ©.
- Programme d'amorÃƒÂ§age local et outils d'invitation/parrainage mesurÃƒÂ©s.
- Pages d'acquisition par zone et par besoin avec profils vÃƒÂ©rifiÃƒÂ©s.
- Mini-pages profils plus actionnables avec CTA mÃƒÂ©tier et mesure de clics, aprÃƒÂ¨s la V1 de liens utiles publics.

### Confort

- Widgets configurables, recherche globale serveur et favoris synchronisÃƒÂ©s.
- Exports finance/comptabilitÃƒÂ©.
- Drag-and-drop avancÃƒÂ© et optimisation des tournÃƒÂ©es.
- Consolidation progressive des deux strates UI et des SCSS locaux.
- Tests visuels ciblÃƒÂ©s et analyse de bundle par dashboard.

### Ãƒâ€°volutions futures

- PWA hors ligne, push et gÃƒÂ©olocalisation de preuve consentie.
- Recommandation/matching assistÃƒÂ©, aprÃƒÂ¨s disponibilitÃƒÂ© de donnÃƒÂ©es fiables.
- Automatisation des relances et affectations, toujours explicable et rÃƒÂ©versible.
- Offre commerÃƒÂ§ants et achats rÃƒÂ©currents, aprÃƒÂ¨s validation du besoin terrain.
- Espace voyageur limitÃƒÂ© et sÃƒÂ©curisÃƒÂ©, uniquement si sa valeur dÃƒÂ©passe le coÃƒÂ»t et le risque donnÃƒÂ©es.

---

## 6. Roadmap priorisÃƒÂ©e valeur / effort

### Court terme Ã¢â‚¬â€ stabiliser et prouver (0 ÃƒÂ  8 semaines)

| Ordre | Lot | Valeur | Effort | RÃƒÂ©sultat mesurable |
|---:|---|---|---|---|
| 1 | Remettre CI au vert et figer une baseline | Haute | Faible | Tests, lint, build et snapshot acceptÃƒÂ©s |
| 2 | Automatiser deux parcours E2E critiques + un provider | TrÃƒÂ¨s haute | Moyen | 3 scÃƒÂ©narios exÃƒÂ©cutables en CI, preuves et donnÃƒÂ©es de test maÃƒÂ®trisÃƒÂ©es |
| 3 | Canoniser migrations/types Supabase | TrÃƒÂ¨s haute | Moyen | Une source, types alignÃƒÂ©s, inventaire des tables/RLS |
| 4 | Persister maintenance, ÃƒÂ©quipe, rÃƒÂ©servations et rapports terrain | TrÃƒÂ¨s haute | Ãƒâ€°levÃƒÂ© | Plus de donnÃƒÂ©e critique uniquement locale/`metadata` |
| 5 | Finaliser profil artisan et confiance | TrÃƒÂ¨s haute | Moyen | Profil publiable et filtrable, complÃƒÂ©tude mesurÃƒÂ©e |
| 6 | Instrumenter activation et funnel | TrÃƒÂ¨s haute | Moyen | Inscription Ã¢â€ â€™ profil Ã¢â€ â€™ demande/mission Ã¢â€ â€™ paiement par rÃƒÂ´le et zone |
| 7 | Pilote d'acquisition dans une zone | TrÃƒÂ¨s haute | Moyen | Premier noyau local actif et missions rÃƒÂ©elles |

### Moyen terme Ã¢â‚¬â€ crÃƒÂ©er la liquiditÃƒÂ© et la rÃƒÂ©tention (2 ÃƒÂ  6 mois)

1. Lancer le mur des missions gÃƒÂ©olocalisÃƒÂ© ÃƒÂ  partir des missions urgentes et demandes existantes.
2. DÃƒÂ©ployer la carte rÃƒÂ©seau unifiÃƒÂ©e, d'abord sur la zone pilote.
3. Introduire un fil professionnel limitÃƒÂ© ÃƒÂ  des objets structurÃƒÂ©s : recherche, disponibilitÃƒÂ©, mission, logement, prestation.
4. Unifier rÃƒÂ©putation, certifications, portfolio, avis et statistiques vÃƒÂ©rifiables.
5. Renforcer planning, capacitÃƒÂ© ÃƒÂ©quipe, conflits, attribution et tournÃƒÂ©es.
6. Consolider CRM, finance, relances et paiement au niveau mission.
7. Transformer le prototype `Performance & rentabilite locative` en premier cockpit owner branche sur `reservations + invoices + housing`, avec distinction explicite `reel / estime / demonstration`.
8. Produire pages locales, SEO structurÃƒÂ© et boucles d'invitation/parrainage.
9. Ãƒâ€°tendre la mini-page publique type Linktree aux CTA mÃƒÂ©tier, au tracking de clics et aux profils providers aprÃƒÂ¨s validation d'usage cÃƒÂ´tÃƒÂ© concierge.

### Long terme Ã¢â‚¬â€ devenir le rÃƒÂ©seau professionnel de rÃƒÂ©fÃƒÂ©rence (6 ÃƒÂ  18 mois)

1. Ãƒâ€°tendre ville par ville avec seuils de densitÃƒÂ© avant ouverture large.
2. DÃƒÂ©ployer PWA terrain, push, offline lÃƒÂ©ger et preuves synchronisÃƒÂ©es.
3. Ajouter recommandations explicables basÃƒÂ©es sur zone, disponibilitÃƒÂ©, qualitÃƒÂ© et historique.
4. Ouvrir l'ÃƒÂ©cosystÃƒÂ¨me commerÃƒÂ§ants/partenaires aprÃƒÂ¨s validation du modÃƒÂ¨le rÃƒÂ©current.
5. CrÃƒÂ©er benchmarks anonymisÃƒÂ©s de performance pour les professionnels.
6. Ãƒâ€°tudier un espace voyageur minimal, sans scoring ni collecte excessive.

### Ce qui n'est pas prioritaire maintenant

- Ajouter de nouveaux dashboards sans fermer les parcours existants.
- CrÃƒÂ©er une nouvelle bibliothÃƒÂ¨que UI ou un store global.
- Industrialiser une IA de matching avant d'avoir densitÃƒÂ©, donnÃƒÂ©es et mÃƒÂ©triques fiables.
- Ãƒâ€°tendre nationalement avant d'obtenir une liquiditÃƒÂ© dÃƒÂ©montrÃƒÂ©e dans une zone pilote.

---

## 7. IdÃƒÂ©es stratÃƒÂ©giques Ã¢â‚¬â€ registre vivant

### 7.1 PlanetLS comme rÃƒÂ©seau professionnel

Le changement de cap est officiel : PlanetLS doit ÃƒÂªtre conÃƒÂ§u comme le rÃƒÂ©seau professionnel de la location saisonniÃƒÂ¨re. La marketplace et le cockpit sont ses moteurs transactionnel et opÃƒÂ©rationnel, pas sa dÃƒÂ©finition complÃƒÂ¨te.

Le graphe rÃƒÂ©seau cible relie :

`Professionnel Ã¢â€ â€ entreprise Ã¢â€ â€ zone Ã¢â€ â€ compÃƒÂ©tence Ã¢â€ â€ logement Ã¢â€ â€ besoin Ã¢â€ â€ mission Ã¢â€ â€ preuve Ã¢â€ â€ avis`

Chaque nouvelle fonction doit renforcer au moins une boucle : dÃƒÂ©couverte, confiance, collaboration, exÃƒÂ©cution ou rÃƒÂ©putation.

### 7.2 Profils professionnels ÃƒÂ©voluÃƒÂ©s

Le profil cible contient : identitÃƒÂ©, entreprise, compÃƒÂ©tences, disponibilitÃƒÂ©s, zones, services, certifications, assurance, portfolio, avis, expÃƒÂ©rience, statistiques, historique et capacitÃƒÂ© opÃƒÂ©rationnelle.

Ajout du vendredi 7 aoÃƒÂ»t 2026 : une V1 lÃƒÂ©gÃƒÂ¨re de mini-page publique type Linktree est dÃƒÂ©sormais considÃƒÂ©rÃƒÂ©e comme une extension naturelle du profil public, pas comme un module autonome. La rÃƒÂ¨gle produit retenue est de rÃƒÂ©utiliser les champs dÃƒÂ©jÃƒÂ  persistÃƒÂ©s `website`, `linkedin`, `instagram`, `facebook` pour amÃƒÂ©liorer l'actionnabilitÃƒÂ© publique sans ouvrir immÃƒÂ©diatement de nouveaux champs, ni de slug secondaire, ni d'analytics.

Ajout du vendredi 7 aoÃƒÂ»t 2026 : l'ÃƒÂ©tape suivante retenue pour cette surface publique est un couple `CTA mÃƒÂ©tier structurÃƒÂ©s + tracking lÃƒÂ©ger`, toujours limitÃƒÂ© aux profils concierges. DÃƒÂ©cision de sÃƒÂ©quencement : l'ouverture aux profils provider est reportÃƒÂ©e ÃƒÂ  plus tard, car leurs besoins publics `urgence, disponibilitÃƒÂ©, devis, spÃƒÂ©cialitÃƒÂ©s, preuves` et leurs signaux de confiance ne sont pas encore assez stabilisÃƒÂ©s pour mutualiser proprement la mÃƒÂªme page.

RÃƒÂ¨gles :

- distinguer donnÃƒÂ©es dÃƒÂ©clarÃƒÂ©es, vÃƒÂ©rifiÃƒÂ©es et calculÃƒÂ©es ;
- ne montrer publiquement que ce qui aide une dÃƒÂ©cision professionnelle ;
- rattacher les statistiques ÃƒÂ  des ÃƒÂ©vÃƒÂ©nements rÃƒÂ©els ;
- ne pas crÃƒÂ©er de score opaque unique ;
- permettre ÃƒÂ  chaque rÃƒÂ´le de comprendre et amÃƒÂ©liorer sa complÃƒÂ©tude.

### 7.3 Fil d'actualitÃƒÂ© professionnel

Le fil ne doit pas devenir un rÃƒÂ©seau social gÃƒÂ©nÃƒÂ©rique. La V1 doit publier des cartes structurÃƒÂ©es :

- Ã‚Â« Je recherche une concierge Ã‚Â» ;
- Ã‚Â« Je suis disponible Ã‚Â» ;
- Ã‚Â« Je cherche un artisan Ã‚Â» ;
- nouvelle mission ;
- nouvelle prestation ;
- nouveau logement.

Chaque publication possÃƒÂ¨de zone, durÃƒÂ©e de validitÃƒÂ©, auteur vÃƒÂ©rifiÃƒÂ©, catÃƒÂ©gorie, CTA et modÃƒÂ©ration. Le fil est filtrÃƒÂ© par pertinence locale ; les contenus expirÃƒÂ©s disparaissent. Une activitÃƒÂ© systÃƒÂ¨me utile peut animer le rÃƒÂ©seau sans inventer de faux utilisateurs : nouvelles zones couvertes, missions pourvues, profils vÃƒÂ©rifiÃƒÂ©s, tendances agrÃƒÂ©gÃƒÂ©es.

### 7.4 Carte interactive

La carte doit afficher par couches : concierges, propriÃƒÂ©taires ayant choisi d'ÃƒÂªtre visibles, artisans, missions et recherches. Les adresses privÃƒÂ©es et logements ne sont jamais exposÃƒÂ©s prÃƒÂ©cisÃƒÂ©ment sans autorisation. V1 : agrÃƒÂ©gation par ville/rayon, liste synchronisÃƒÂ©e, filtres et CTA. Le prototype carte/recherche actuel sert de socle visuel, pas de module final.

### 7.5 Mur des missions

Le mur inverse la recherche : les concierges et artisans voient les opportunitÃƒÂ©s proches d'eux. Une carte mission montre service, zone approximative, dÃƒÂ©lai, urgence, budget ÃƒÂ©ventuel, preuves requises et donneur d'ordre vÃƒÂ©rifiÃƒÂ©. La candidature doit ÃƒÂªtre simple ; l'accÃƒÂ¨s aux coordonnÃƒÂ©es intervient aprÃƒÂ¨s acceptation selon les rÃƒÂ¨gles mÃƒÂ©tier.

### 7.6 Performance & rentabilite locative

Vision retenue : faire evoluer PlanetLS d'un simple outil de gestion vers un vrai cockpit economique du logement, en priorite pour le proprietaire, avec une ouverture progressive vers la conciergerie et l'administrateur.

Le module doit aider a comprendre non seulement le taux d'occupation et le chiffre d'affaires, mais aussi la rentabilite reelle, les periodes sous-performantes, les mois a proteger, le potentiel de nuits supplementaires, les couts d'exploitation et les leviers d'amelioration prioritaires.

Workflow cible officiel :

`Donnees de reservation -> Analyse de performance -> Benchmark -> Calcul de rentabilite -> Detection d'opportunites -> Recommandation -> Action -> Mesure du resultat`

Donnees a viser par paliers :

- existantes ou deja exploitables partiellement : `reservations`, `missions`, `invoices`, `housing`, montants devis/factures, dates de sejour, statut, logement, quelques informations de menage/logement ;
- calculees : nuits reservees, nuits disponibles, taux d'occupation, ADR, chiffre d'affaires brut, revenu net estime, marge estimee, RevPAR, progression vers objectif ;
- manquantes a persister proprement : commissions par plateforme, cout conciergerie reel, cout menage reel, consommables, autres charges variables, objectifs proprietaire, revenus par canal, benchmark local exploitable ;
- externes futures : tendances de destination, benchmark local, references marche, saisonnalite enrichie.

Decoupage produit retenu :

- MVP : dashboard de performance, analyse mensuelle et annuelle, rentabilite nette estimee, detection des mois sous-performants, objectifs de taux d'occupation, alertes de performance.
- V1 : calendrier d'opportunites, simulateur `Et si...`, comparaison de plusieurs scenarios, mesure du resultat apres action, recommandations branchees d'abord sur regles metier puis API IA.
- V2 : benchmark marche local, previsions saisonnieres, scenarios multi-logements, comparaison N / N-1 enrichie et recommandations avancees.

Etat reel au 17 aout 2026 :

- une premiere couche de pilotage est maintenant visible dans `/dashboard/owner/finances/overview` ;
- elle documente la vision, les KPI de demonstration, la rentabilite cible, les scenarios, les risques, les dependances et les prochaines actions ;
- elle utilise des calculs purs testables et un cas pilote BarcarÃƒÂ¨s clairement marque comme demonstration ;
- elle ne constitue pas encore un moteur owner branche sur des donnees reelles ni un benchmark local connecte.

Hypothese business a suivre :

Cette brique peut devenir une raison claire de souscrire a une offre proprietaire payante.

- Gratuit : occupation, nuits reservees, chiffre d'affaires, comparaison simple.
- Proprietaire Pro : rentabilite, couts, objectifs, analyse saisonniere, recommandations.
- Premium / Pilotage : benchmark local, previsions, simulateur avance, alertes, scenarios et recommandations IA.

Regles de gouvernance :

- ne jamais presenter une donnee de demonstration comme une donnee reelle ;
- separer partout `reel`, `estime`, `demonstration` et `source externe future` ;
- garder la logique metier de calcul hors des composants UI ;
- ne pas modifier immediatement la grille tarifaire de production sans validation business dediee.

### 7.7 Registre d'idÃƒÂ©es ÃƒÂ  ÃƒÂ©valuer

| IdÃƒÂ©e | HypothÃƒÂ¨se | Signal de validation | Statut |
|---|---|---|---|
| DisponibilitÃƒÂ© en un clic | Rend immÃƒÂ©diatement les profils actionnables | Plus de mises en relation dans les 7 jours | Ãƒâ‚¬ cadrer |
| Parrainage par professionnel | Le rÃƒÂ©seau existant recrute mieux qu'une publicitÃƒÂ© froide | Invitations activÃƒÂ©es et premiÃƒÂ¨re action utile | Ãƒâ‚¬ tester |
| Badge Ã¢â‚¬Å“rÃƒÂ©pond rapidementÃ¢â‚¬Â | RÃƒÂ©duit l'incertitude | Hausse du taux de contact et de rÃƒÂ©ponse | DonnÃƒÂ©es requises |
| Packs locaux rÃƒÂ©currents | Les conciergeries veulent des partenaires rÃƒÂ©currents | RÃƒÂ©achat mensuel | Ãƒâ‚¬ explorer |
| Pages de tension locale | Montrer besoins rÃƒÂ©els attire l'offre | Inscriptions qualifiÃƒÂ©es par zone | Ãƒâ‚¬ tester |

| Automatisation administrative reversible | Les professionnels retiennent plus vite PlanetLS si la plateforme supprime les relances, rappels, confirmations et ressaisies repetitives sans agir seule sur les cas sensibles | Baisse du temps administratif par mission, hausse des actions faites a l'heure et usage recurrent des automatismes | A cadrer |
| Cockpit reporting, veille et tresorerie | Un cockpit qui consolide KPI, previsionnel de tresorerie, veille locale et signaux business peut augmenter la valeur percue cote direction et conciergerie | Consultation hebdomadaire recurrente, decisions prises depuis PlanetLS et reduction des exports manuels externes | A explorer |
| Prospection assistee et gestion des leads | PlanetLS peut accelerer l'acquisition B2B si la plateforme aide a identifier, enrichir, relancer et convertir des prospects locaux | Nombre de prospects qualifies, taux de reponse, premiers RDV ou demandes signes depuis les sequences assistees | A tester |
| Communication et contenu assistes | La creation assistee de posts, slides, newsletters, pre-reponses email et medias personnalises peut aider a faire vivre la marque et accelerer la reponse commerciale | Frequence de publication, taux d'ouverture/reponse, reutilisation des brouillons generes et gain de temps declare | A explorer |
| Registre des automatisations PlanetLS | Un registre unique par role et par workflow peut eviter la sur-automatisation et aider a choisir les bons chantiers avant implementation | Chaque automatisation candidate est scoree, priorisee, puis suivie avec KPI avant/apres plutot qu'ouverte au fil de l'eau | A structurer |
| Audit terrain et cartographie AS-IS -> TO-BE | PlanetLS ne doit pas cartographier ses processus uniquement depuis des hypotheses internes ; il faut observer les pratiques reelles avant de dessiner les automatisations cibles | Questionnaires, entretiens, observations et validations utilisateur font emerger les vraies regles metier, exceptions et limites acceptables de l'automatisation | A lancer |
| Performance & rentabilite locative owner-first | Un cockpit economique du logement peut devenir une proposition de valeur payante forte s'il relie occupation, revenus, couts, opportunites et recommandations sans confusion entre reel et estimation | Consultation recurrente cote owner, decisions prises depuis PlanetLS, progression mesurable vers un objectif annuel et acceptation d'un palier payant dedie | A structurer |
--- 

## 8. Acquisition des premiers utilisateurs Ã¢â‚¬â€ prioritÃƒÂ© stratÃƒÂ©gique

### Le vrai problÃƒÂ¨me

PlanetLS est un rÃƒÂ©seau multi-faces. Une plateforme vide n'est pas seulement visuellement pauvre : elle ne fournit aucune premiÃƒÂ¨re valeur. Une expansion nationale prÃƒÂ©maturÃƒÂ©e disperse propriÃƒÂ©taires, concierges et artisans, rÃƒÂ©duit les probabilitÃƒÂ©s de rÃƒÂ©ponse et rend les KPI trompeurs.

La stratÃƒÂ©gie recommandÃƒÂ©e est donc **locale, opÃƒÂ©rÃƒÂ©e manuellement au dÃƒÂ©but et centrÃƒÂ©e sur des missions rÃƒÂ©elles**.

### Comparaison des stratÃƒÂ©gies

| StratÃƒÂ©gie | Avantage | Risque | Adaptation PlanetLS |
|---|---|---|---|
| PublicitÃƒÂ© nationale | Volume rapide | Trafic froid, rÃƒÂ©seau dispersÃƒÂ©, coÃƒÂ»t ÃƒÂ©levÃƒÂ© | Faible avant preuve locale |
| SEO national | Actif durable | Lent et concurrence ÃƒÂ©levÃƒÂ©e | Ãƒâ‚¬ prÃƒÂ©parer, pas moteur initial |
| Ville pilote | DensitÃƒÂ© et apprentissage | Croissance gÃƒÂ©ographique plus lente | Meilleure option |
| Partenariats locaux | Confiance et accÃƒÂ¨s ÃƒÂ  des communautÃƒÂ©s | Temps commercial | TrÃƒÂ¨s adaptÃƒÂ© |
| Concierge comme tÃƒÂªte de rÃƒÂ©seau | Apporte propriÃƒÂ©taires, logements et artisans | DÃƒÂ©pendance ÃƒÂ  quelques comptes | TrÃƒÂ¨s adaptÃƒÂ© avec diversification |
| Missions rÃƒÂ©elles Ã¢â‚¬Å“concierge blancÃ¢â‚¬Â | Valeur immÃƒÂ©diate malgrÃƒÂ© peu d'utilisateurs | OpÃƒÂ©rations manuelles coÃƒÂ»teuses | RecommandÃƒÂ© au lancement |
| Freemium large | RÃƒÂ©duit la friction | Comptes inactifs et support | Ãƒâ‚¬ limiter ÃƒÂ  une activation guidÃƒÂ©e |
| Parrainage | CoÃƒÂ»t maÃƒÂ®trisÃƒÂ©, confiance | Ne marche qu'aprÃƒÂ¨s premiÃƒÂ¨re valeur | Ãƒâ‚¬ activer dans la zone pilote |

### StratÃƒÂ©gie progressive recommandÃƒÂ©e

#### Phase A Ã¢â‚¬â€ prÃƒÂ©parer une zone (2 semaines)

Choisir une zone ÃƒÂ  forte densitÃƒÂ© de locations, accessible ÃƒÂ  l'ÃƒÂ©quipe et avec quelques contacts existants. DÃƒÂ©finir un seuil minimal avant communication publique : par exemple 5 conciergeries actives, 15 artisans/prestataires vÃƒÂ©rifiÃƒÂ©s, 20 propriÃƒÂ©taires/logements qualifiÃƒÂ©s et 10 besoins rÃƒÂ©els.

CrÃƒÂ©er manuellement les profils avec les professionnels, vÃƒÂ©rifier leurs donnÃƒÂ©es, services et zones, et recueillir leur disponibilitÃƒÂ©. Importer uniquement avec consentement ; aucun faux profil.

#### Phase B Ã¢â‚¬â€ garantir la premiÃƒÂ¨re valeur (semaines 3 ÃƒÂ  6)

- Recruter d'abord 3 ÃƒÂ  5 conciergeries Ã¢â‚¬Å“ancresÃ¢â‚¬Â.
- Leur offrir une mise en place accompagnÃƒÂ©e : profil, logements, packs, planning et besoins artisans.
- Transformer leurs besoins rÃƒÂ©els en premiÃƒÂ¨res missions du mur.
- Recruter ensuite les artisans demandÃƒÂ©s, mÃƒÂ©tier par mÃƒÂ©tier.
- Inviter les propriÃƒÂ©taires dÃƒÂ©jÃƒÂ  liÃƒÂ©s via le flux d'invitations existant.
- Faire le matching manuellement lorsque nÃƒÂ©cessaire et documenter chaque friction.

La plateforme peut paraÃƒÂ®tre vivante grÃƒÂ¢ce ÃƒÂ  de vrais ÃƒÂ©vÃƒÂ©nements structurÃƒÂ©s : disponibilitÃƒÂ©s dÃƒÂ©clarÃƒÂ©es, nouvelles missions, profils vÃƒÂ©rifiÃƒÂ©s et logements ajoutÃƒÂ©s. Il ne faut jamais simuler une activitÃƒÂ© inexistante.

#### Phase C Ã¢â‚¬â€ rendre la boucle reproductible (mois 2Ã¢â‚¬â€œ3)

- Lancer mur des missions et carte sur la zone uniquement.
- Ajouter parrainage professionnel et invitation propriÃƒÂ©taire.
- Publier des ÃƒÂ©tudes/cas locaux et pages Ã¢â‚¬Å“missions ÃƒÂ  pourvoir ÃƒÂ  [ville]Ã¢â‚¬Â.
- Nouer des partenariats avec offices de tourisme, rÃƒÂ©seaux de propriÃƒÂ©taires, agences, organismes de formation, fournisseurs de linge et collectifs d'artisans.
- Mesurer acquisition Ã¢â€ â€™ activation Ã¢â€ â€™ premiÃƒÂ¨re rÃƒÂ©ponse Ã¢â€ â€™ mission Ã¢â€ â€™ rÃƒÂ©tention.

#### Phase D Ã¢â‚¬â€ ÃƒÂ©tendre par grappes (aprÃƒÂ¨s preuve)

Ouvrir une nouvelle zone seulement lorsque la prÃƒÂ©cÃƒÂ©dente atteint des seuils : rÃƒÂ©ponse mÃƒÂ©diane < 24 h, au moins 60 % des demandes avec rÃƒÂ©ponse, 30 % transformÃƒÂ©es en ÃƒÂ©change qualifiÃƒÂ©, missions rÃƒÂ©currentes et rÃƒÂ©tention ÃƒÂ  30 jours. RÃƒÂ©pliquer le playbook, adapter les mÃƒÂ©tiers dominants et nommer un ambassadeur local.

### Offre de lancement

- Conciergerie ancre : onboarding assistÃƒÂ©, import accompagnÃƒÂ©, visibilitÃƒÂ© locale prioritaire contre retours hebdomadaires.
- Artisan fondateur : profil vÃƒÂ©rifiÃƒÂ© gratuit pendant la phase pilote et accÃƒÂ¨s prioritaire aux missions, sans promesse artificielle de volume.
- PropriÃƒÂ©taire : demande accompagnÃƒÂ©e et rÃƒÂ©ponse humaine garantie dans la zone pilote.
- Ambassadeur : reconnaissance visible et avantages limitÃƒÂ©s dans le temps, liÃƒÂ©s ÃƒÂ  des utilisateurs rÃƒÂ©ellement activÃƒÂ©s.

### KPI de lancement

| KPI | DÃƒÂ©finition | Cible pilote initiale |
|---|---|---:|
| DensitÃƒÂ© d'offre | Pros actifs et vÃƒÂ©rifiÃƒÂ©s par mÃƒÂ©tier/zone | Ã¢â€°Â¥ 3 options sur chaque besoin prioritaire |
| Taux d'activation | Inscrits accomplissant la premiÃƒÂ¨re action utile en 7 jours | Ã¢â€°Â¥ 60 % accompagnÃƒÂ©s |
| Temps de premiÃƒÂ¨re valeur | Inscription Ã¢â€ â€™ profil publiable, demande ou mission | < 48 h |
| Taux de rÃƒÂ©ponse | Demandes avec rÃƒÂ©ponse qualifiÃƒÂ©e | Ã¢â€°Â¥ 60 % |
| DÃƒÂ©lai de rÃƒÂ©ponse | MÃƒÂ©diane premiÃƒÂ¨re rÃƒÂ©ponse | < 24 h |
| Conversion en mission | Demandes devenues missions | Ãƒâ‚¬ baseliner, puis amÃƒÂ©liorer par groupe |
| LiquiditÃƒÂ© du mur | Missions avec au moins une candidature adaptÃƒÂ©e | Ã¢â€°Â¥ 70 % dans la zone pilote |
| RÃƒÂ©tention 30 jours | Pros ayant une nouvelle action utile | Ã¢â€°Â¥ 40 % |
| Part organique | ActivÃƒÂ©s venant d'une invitation/parrainage | Croissante mois aprÃƒÂ¨s mois |

### ExpÃƒÂ©riences prioritaires

1. Tester deux messages : Ã‚Â« rÃƒÂ©seau professionnel local Ã‚Â» contre Ã‚Â« cockpit de gestion Ã‚Â» selon la cible.
2. Comparer onboarding autonome et onboarding accompagnÃƒÂ© sur activation ÃƒÂ  J+7.
3. Tester l'alerte disponibilitÃƒÂ© et le mur des missions avant un fil complet.
4. Tester une page locale avec besoins rÃƒÂ©els et profils vÃƒÂ©rifiÃƒÂ©s.
5. Interviewer systÃƒÂ©matiquement les non-rÃƒÂ©pondants et missions non pourvues.

---

## 9. Checklist permanente

Dates : `Ã¢â‚¬â€` signifie non planifiÃƒÂ©. Le responsable est un rÃƒÂ´le, ÃƒÂ  remplacer par un nom lors de l'engagement du lot.

| FonctionnalitÃƒÂ© / action | Statut | PrioritÃƒÂ© | Date cible | Responsable | Commentaires / preuve attendue |
|---|---|---|---|---|---|
| Baseline tests/lint/build/snapshot | Ã¢Å“â€¦ TerminÃƒÂ© | P0 Critique | 2026-07-19 | Tech lead | 202/202 tests, lint ciblÃƒÂ© et build Next.js de 168 pages au vert |
| E2E owner complet | Ã¢ÂÂ¸Ã¯Â¸Â ReportÃƒÂ© | P0 Critique | Ãƒâ‚¬ reprendre avec clÃƒÂ© Stripe test | QA + Produit | Demande Ã¢â€ â€™ devis Ã¢â€ â€™ mission Ã¢â€ â€™ facture payÃƒÂ©e par webhook signÃƒÂ© PASS ; scÃƒÂ©nario Checkout hÃƒÂ©bergÃƒÂ©, carte test, retour owner et sync prÃƒÂªt ; aucune E2E_STRIPE_SECRET_KEY locale disponible pour la preuve finale |
| E2E concierge complet | Ã°Å¸Å¸Â  | P0 Critique | Court terme | QA + Produit | RÃƒÂ©ception Ã¢â€ â€™ devis envoyÃƒÂ© Ã¢â€ â€™ mission Ã¢â€ â€™ facture payÃƒÂ©e Ã¢â€ â€™ crÃƒÂ©neau planifiÃƒÂ© et relu owner PASS ; Checkout hÃƒÂ©bergÃƒÂ© reste ÃƒÂ  valider |
| E2E provider complet | Ã¢Å“â€¦ | P0 Critique | 2026-07-18 | QA + Provider | Mission Ã¢â€ â€™ intervention Ã¢â€ â€™ preuve mÃƒÂ©dia privÃƒÂ©e Ã¢â€ â€™ facture liÃƒÂ©e PASS ; prochaine ÃƒÂ©volution : paiement Stripe test |
| Source canonique migrations | Ã°Å¸Å¸Â  | Critique | Court terme | Backend | supabase/migrations canonique ; 20 fichiers historiques figÃƒÂ©s dans database/migrations ; contrÃƒÂ´le CI ajoutÃƒÂ© ; inventaire distant bloquÃƒÂ© sans token |
| Types Supabase rÃƒÂ©gÃƒÂ©nÃƒÂ©rÃƒÂ©s | Ã°Å¸Å¸Â¡ | Critique | Court terme | Backend | Tables actives entiÃƒÂ¨rement typÃƒÂ©es ; le build du 2026-07-28 a nÃƒÂ©cessitÃƒÂ© un helper non typÃƒÂ© temporaire dans `/api/admin/control-tower` car `onboarding_events`, `service_requests` et `workflow_events` ne sont pas encore couverts par les types gÃƒÂ©nÃƒÂ©rÃƒÂ©s |
| Persistance maintenance | Partiel | P0 Critique | Court terme | Backend + Concierge | Incidents et mÃƒÂ©dias/RLS, API CRUD partiel, transitions, affectation, preuves privÃƒÂ©es SHA-256 et URL signÃƒÂ©es, contrat 6/6 ; migrations distantes et E2E restent ÃƒÂ  faire |
| Persistance ÃƒÂ©quipe/affectations | Ã°Å¸Å¸Â¡ | Critique | Court terme | Backend + Concierge | Permissions fines incluses |
| Persistance rÃƒÂ©servations/terrain | Ã°Å¸Å¸Â¡ | Critique | Court terme | Backend + Mobile | Photos/signatures/checklists Storage |
| Profil artisan complet | Partiel | P0 Critique | Court terme | Produit + Provider | Ãƒâ€°dition mÃƒÂ©tier persistante et complÃƒÂ©tude dÃƒÂ©diÃƒÂ©es ; justificatifs privÃƒÂ©s PDF/images avec SHA-256, statuts de vÃƒÂ©rification et liens signÃƒÂ©s livrÃƒÂ©s ; migration distante, validation admin, avis et vue publique dÃƒÂ©taillÃƒÂ©e restent ÃƒÂ  finaliser |
| KPI activation/funnel | Ã¢Å“â€¦ TerminÃƒÂ© | P0 Critique | Court terme | Data + Produit | DÃƒÂ©finitions J+7, groupes, sÃƒÂ©ries et zones validÃƒÂ©s sur lÃ¢â‚¬â„¢API connectÃƒÂ©e ; seuils par rÃƒÂ´le, alerte faible ÃƒÂ©chantillon, baisse de groupe et actions admin visibles |
| Paiement consolidÃƒÂ© mission | Ã°Å¸Å¸Â¡ | Importante | Moyen terme | Backend + Produit | Acompte, solde, ÃƒÂ©chec, relance visibles |
| Notifications structurÃƒÂ©es | Ã°Å¸Å¸Â¡ | Importante | Moyen terme | Produit + Backend | PrÃƒÂ©fÃƒÂ©rences et ÃƒÂ©vÃƒÂ©nements utiles |
| Automatisations productivite et taches recurrentes | 🔴 | P2 Important | Moyen terme | Produit + Backend + Ops | Workflows reversibles pour relances devis, rappels paiement, confirmations de RDV, emails de bienvenue, anniversaires client, onboarding client/collaborateur et pre-remplissage de contrat ; validation humaine et journalisation obligatoires sur les actions sensibles |
| Reporting automatise, veille et previsionnel de tresorerie | 🔴 | P2 Important | Moyen terme | Admin + Data + Finance | Consolider statistiques d'entreprise, previsionnel de tresorerie, reporting reseaux sociaux/concurrents et veille sectorielle dans un cockpit exploitable sans tableurs paralleles |
| Performance & rentabilite locative owner-first | 🟠 Partiel | P1 Prioritaire | Moyen terme | Produit + Owner + Data | Prototype de pilotage livre dans `/dashboard/owner/finances/overview` avec KPI de demonstration, scenarios compares, decomposition de rentabilite, audit de donnees, risques et roadmap MVP/V1/V2 ; le cockpit owner principal remonte aussi maintenant cette brique dans `A traiter maintenant` pour la rendre visible depuis `/dashboard/owner` ; prochaine etape : brancher un premier owner pilote sur `reservations + invoices + housing`, persister les couts variables utiles et distinguer proprement `reel / estime / demonstration` |
| Prospection automatisee et gestion des leads | 🔴 | P2 Important | Moyen terme | Growth + CRM + Produit | Collecte de prospects, enrichissement, premier email personnalise, relances, sequences de prospection et suivi de conversion relies au CRM PlanetLS |
| Communication marketing assistee | 🔴 | P3 Confort | Moyen terme | Growth + Marketing | Publication reseaux sociaux, newsletters, articles, slides, pre-reponses email et medias personnalises ; a cadrer d'abord comme accelerateur de contenu et non comme promesse d'automatisation aveugle |
| Litiges/preuves E2E | Ã°Å¸Å¸Â¡ | Importante | Moyen terme | Produit + QA | Parcours post-checkout validÃƒÂ© |
| AccessibilitÃƒÂ© parcours critiques | Ã°Å¸Å¸Â¡ | Importante | Court terme | Front + QA | Clavier, focus, contraste, 360/768/1280 |
| Pilote acquisition local | Ã°Å¸â€Â´ | Critique | Court terme | Growth + Direction | Zone, ancres, offre, seuils et suivi hebdo |
| Mur des missions V1 | Ã°Å¸â€Â´ | Importante | Moyen terme | Produit + Tech | GÃƒÂ©olocalisÃƒÂ©, expirant, candidature simple |
| Carte rÃƒÂ©seau V1 | Ã°Å¸â€Â´ | Importante | Moyen terme | Produit + Front | ConfidentialitÃƒÂ© et liste synchronisÃƒÂ©e |
| Fil professionnel V1 | Ã°Å¸â€Â´ | Importante | Moyen terme | Produit | Objets structurÃƒÂ©s, modÃƒÂ©ration, expiration |
| RÃƒÂ©putation/certifications | Ã°Å¸Å¸Â¡ | Importante | Moyen terme | Produit + Admin | DÃƒÂ©clarÃƒÂ©/vÃƒÂ©rifiÃƒÂ©/calculÃƒÂ© distinguÃƒÂ©s |
| SEO local et donnÃƒÂ©es structurÃƒÂ©es | Ã°Å¸Å¸Â¡ | Importante | Moyen terme | Growth + Front | Pages zone, OG, JSON-LD, conversion |
| PWA/push/offline | Ã°Å¸â€Â´ | Ãƒâ€°volution future | Long terme | Mobile + Backend | AprÃƒÂ¨s persistance et E2E |
| Assistant dÃƒÂ©coration : partage owner et image | Ã°Å¸Å¸Â  | P2 Important | Moyen terme | Produit + Concierge | Confirmer valeur terrain, envoi traÃƒÂ§able et gÃƒÂ©nÃƒÂ©ration d'image rÃƒÂ©elle |

| Registre des automatisations et score d'opportunite | 🔴 | P2 Important | Court terme | Produit + Admin + Data | Mettre en place dans le pilotage un registre unique des automatisations candidates avec statut `Idee -> A analyser -> Validee -> A developper -> En test -> Active -> A optimiser`, score d'opportunite `/100`, niveau de risque et KPI avant/apres |
| Audit terrain, cartographie AS-IS et validation utilisateur | 🔴 | P2 Important | Court terme | Produit + Recherche + Admin | Mener questionnaires, entretiens, observations terrain, cartographie `AS-IS`, validation utilisateur puis conception `TO-BE` avant d'industrialiser les automatisations sensibles ; documenter aussi les exceptions `Oui, sauf quand...` |
| Achats et renouvellements logement | Partiel | P1 Prioritaire | Court terme | Produit + Owner + Concierge | Besoin structurÃƒÂ© persistant dans la fiche logement partagÃƒÂ©e : article, dimensions, quantitÃƒÂ©, motif, photo/lien marchand, budget/plafond, rÃƒÂ¨gle contractuelle, livraison, dÃƒÂ©cision owner, facture, preuve et statuts signalÃƒÂ© Ã¢â€ â€™ installÃƒÂ©. Garde contrat/plafond/preuve testÃƒÂ© ; upload privÃƒÂ©, notifications et E2E multi-rÃƒÂ´les restent ÃƒÂ  faire. |

### Definition of Done commune

Une ligne ne passe ÃƒÂ  `Ã¢Å“â€¦` que si :

- rÃƒÂ¨gles mÃƒÂ©tier et propriÃƒÂ©taire de la donnÃƒÂ©e identifiÃƒÂ©s ;
- schÃƒÂ©ma/migration/RLS et types alignÃƒÂ©s si nÃƒÂ©cessaire ;
- permissions contrÃƒÂ´lÃƒÂ©es cÃƒÂ´tÃƒÂ© serveur ;
- loading, vide, erreur, succÃƒÂ¨s et retry traitÃƒÂ©s ;
- responsive 360/768/1280 et clavier vÃƒÂ©rifiÃƒÂ©s ;
- tests unitaires/contrats et au moins une preuve de parcours ;
- ÃƒÂ©vÃƒÂ©nements KPI ajoutÃƒÂ©s si la fonction influence le funnel ;
- documentation et journal mis ÃƒÂ  jour dans le mÃƒÂªme lot.

---

## 10. Journal du projet

### Format obligatoire

| Date | Type | DÃƒÂ©cision / ÃƒÂ©volution | Motif | Impact | Responsable |
|---|---|---|---|---|---|
| AAAA-MM-JJ | Produit / Technique / UX / Go-to-market | Formulation courte | DonnÃƒÂ©es ou arbitrage | Code, donnÃƒÂ©es, roadmap, utilisateurs | Nom/rÃƒÂ´le |

### Journal consolidÃƒÂ©

| Date | Type | DÃƒÂ©cision / ÃƒÂ©volution | Motif | Impact | Responsable |
|---|---|---|---|---|---|
| 2026-08-17 | Produit/Pilotage | Structurer officiellement `Performance & rentabilite locative` comme brique owner-first du pilotage PlanetLS | Le produit possede deja reservations, missions, devis, factures et quelques informations logement, mais aucun cadre unifie ne disait encore comment transformer ces briques en cockpit economique lisible, testable et monetisable | Le Master Plan ajoute une section strategique dediee `vision, workflow cible, donnees existantes/calculees/manquantes/externes, MVP/V1/V2, hypothese business et regles de gouvernance`; l'espace `/dashboard/owner/finances/overview` embarque un premier module de pilotage avec KPI de demonstration BarcarÃƒÂ¨s, rentabilite cible, scenarios compares, recommandations, risques, audit des donnees et prochaines actions, et le cockpit principal `/dashboard/owner` remonte maintenant cette brique dans `A traiter maintenant` pour la rendre visible sans passer par le pilotage business admin | Produit/Direction |
| 2026-08-17 | Produit/Pilotage | Integrer un axe officiel `automatisation, reporting et prospection assistee` dans le Master Plan | Plusieurs idees utiles revenaient autour des taches repetitives, du tracking/reporting, de la relation client et de la prospection ; elles devaient etre dedoublonnees puis raccrochees aux priorites existantes sur l'IA et l'automatisation | Ajout de quatre idees strategiques dans le registre vivant `automatisation administrative reversible, cockpit reporting/veille/tresorerie, prospection assistee, communication et contenu assistes` et de quatre lignes dans la checklist permanente `automatisations productivite`, `reporting/veille/tresorerie`, `prospection automatisee`, `communication marketing assistee` ; ces pistes restent non developpees et dependantes d'un cadrage metier, de donnees fiables et de garde-fous humains | Produit/Direction |
| 2026-08-17 | Produit/Pilotage | Transformer les idees d'automatisation en methode de priorisation et en flux cibles par role | Le cadrage initial listait des opportunites utiles, mais il manquait une discipline de selection pour eviter la sur-automatisation et des flux suffisamment concrets pour guider les futurs lots | Ajout d'un `Registre des automatisations PlanetLS`, d'une regle a trois niveaux `Automatique / Automatique + validation / Humain obligatoire`, d'une grille `anti-sur-automatisation` et de nouvelles priorites `P2-030` a `P2-034` couvrant les flux owner, concierge, artisan et admin | Produit/Direction |
| 2026-08-17 | Produit/Pilotage | Formaliser la methode de deploiement progressive des automatisations PlanetLS | Le risque principal est desormais la dispersion et le lancement trop simultane de workflows encore mal relies entre eux, davantage que le manque d'idees | Le Master Plan ajoute une methode `processus -> probleme -> automatisation -> technologie -> developpement -> test -> mesure -> deploiement`, un cycle d'etat detaille pour chaque automatisation candidate, une regle `une automatisation a la fois`, un plan de deploiement en 6 vagues et un `plan B` obligatoire pour tout workflow sensible | Produit/Direction |
| 2026-08-17 | Produit/Pilotage | Ajouter la boucle officielle de mesure et d'amelioration continue des automatisations | Une priorisation sans mesure continue risquait de dire qu'un workflow est `actif` sans savoir s'il fait vraiment gagner du temps, s'il est fiable et s'il est utilise | Le Master Plan ajoute la boucle `mesurer -> detecter -> comprendre -> corriger -> retester`, la distinction `KPI metier / KPI techniques`, un journal d'execution cible, une gestion standard des erreurs, un deploiement `Developpement -> Test -> Pilote -> Production` et la structure d'un cockpit `Performance des automatisations` | Produit/Direction |
| 2026-08-17 | Produit/Pilotage | Completer le pilotage post-production des automatisations | Il manquait encore la lecture `apres mise en production` : satisfaction utilisateur explicite, cadence de controle, tableau de bord de synthese et trace avant/apres des corrections | Le Master Plan ajoute quatre familles de KPI `Performance, Fiabilite, Impact metier, Satisfaction utilisateur`, une frequence `controle quotidien automatique + rapport hebdomadaire`, la regle `une automatisation peut etre techniquement correcte mais mauvaise metier`, un tableau de bord cible et une trace `Probleme observe -> hypothese -> modification -> resultat avant/apres` pour chaque correction | Produit/Direction |
| 2026-08-17 | Produit/Pilotage | Ajouter une cartographie macro officielle des automatisations PlanetLS | Avec des automatisations chainees, un simple bug peut devenir difficile a localiser si les dependances, les IDs et les responsables ne sont pas documentes des le depart | Le Master Plan ajoute une convention `AUT-xxx`, une structure de fiche standard, une cartographie macro par zone `Reservation, Devis, Mission, Incident, Paiement`, des dependances amont/aval explicites, un champ `criticite` et les responsabilites `metier / technique / service externe` pour rendre l'architecture fonctionnelle des automatisations lisible et pilotable | Produit/Direction |
| 2026-08-17 | Produit/UX | Ajouter un module `Automatisations & Processus` dans la page `developpement` uniquement | Le besoin etait d'obtenir un espace professionnel de recensement, cartographie et suivi des automatisations sans ouvrir une nouvelle page ni dupliquer le pilotage business | La page `/dashboard/admin/developpement` embarque maintenant un module dedie avec filtres, vue d'ensemble, processus `AS-IS / TO-BE`, registre `AUT-xxx`, cartographie macro, performance, incidents et historique a partir de donnees de demonstration structurees ; aucune nouvelle page admin n'a ete creee et le lot reste volontairement local a la vue `developpement` | Produit/Tech |
| 2026-08-17 | Produit/UX | Repositionner un tableau court des automatisations sous la section `P3` de la page `developpement` | Le besoin utilisateur etait de voir un tableau immediat directement dans le cockpit court, sans devoir ouvrir seulement le module detaille plus bas dans la page | Le bloc `Pilotage des priorites` affiche maintenant aussi, juste sous les tableaux `P0 / P1 / P2 / P3`, un tableau court `Automatisations & Processus` avec `ID, automatisation, processus, statut, criticite, dependances, technologies` pour rendre cette lecture visible des l'entree de page | Produit/Tech |
| 2026-08-17 | Produit/UX | Aligner le tableau court des automatisations sur le format exact demande dans `developpement` | Le besoin s'est precise : le tableau sous `P3` devait suivre une structure fixe et pedagogique plutot qu'une vue derivee du registre detaille | Le tableau court de `/dashboard/admin/developpement` affiche maintenant exactement les colonnes `ID, Zone d'intervention, Etat, Objectif, Resume, Declencheur, Scenario simplifie, Dependances, Outil, KPI` et les cinq lignes `AUT-001` a `AUT-005` demandees | Produit/Tech |
| 2026-08-17 | Produit/UX | Compacter la lecture automatisation dans `developpement` | Le gros module detaille prenait trop de place et diluait la lecture du cockpit court ; les informations utiles devaient remonter directement dans le tableau visible sous `P3` | Le bloc separe `Automatisations & Processus` est retire de la page `developpement` au profit d'un tableau unique enrichi sous `P3`, avec ajout de `Criticite` et `Suivi utile` pour conserver les signaux importants sans rallonger la page | Produit/Tech |
| 2026-08-17 | Produit/UX | Retirer la vue rapide redondante du cockpit `pilotage business` admin | Les quatre tuiles `Utilisateurs visibles`, `Hypotheses critiques`, `Risques critiques` et `Offre active` encombraient l'entree de page sans apporter une lecture plus utile que le contenu principal deja present | La page `/dashboard/admin/pilotage` n'injecte plus ces statistiques dans le `DashboardLayout` et ouvre desormais plus directement sur le contenu business de la page, sans bloc `Vue rapide` en tete | Produit/Tech |
| 2026-08-17 | Produit/Formation | Choisir `AUT-001` comme automatisation centrale la plus defendable pour l'exercice | Pour un livrable de formation, il fallait une automatisation simple a expliquer, directement liee a la valeur de PlanetLS et sans dependre d'une stack externe type Make ou n8n | Le cadrage retient `Devis accepte -> creation et planification automatique d'une mission` comme automatisation de reference : probleme initial, objectifs mesurables, distinction explicite entre `processus metier global` et `automatisation ciblee`, donnees necessaires, chemins d'erreur, tracabilite et absence d'IA necessaire sur la regle deterministe principale | Produit/Direction |
| 2026-08-17 | Produit/Recherche | Poser l'audit terrain comme prealable aux automatisations majeures | PlanetLS sert plusieurs metiers que l'equipe ne pratique pas tous directement ; les workflows ne doivent pas etre cartographies uniquement depuis des hypotheses internes | Ajout d'une idee strategique `Audit terrain et cartographie AS-IS -> TO-BE`, d'une ligne de pilotage `Audit terrain, cartographie AS-IS et validation utilisateur` et des priorites `P2-035` a `P2-037` pour cadrer questionnaires, entretiens, observation, validation des exceptions et conception `TO-BE` | Produit/Direction |
| 2026-08-17 | Produit/Audit | Etablir une premiere cartographie `AS-IS` des processus existants a partir du code et des specifications internes | Avant d'aller sur le terrain, il fallait deja figer une lecture honnete du produit reel `ce qui est branche, ce qui est partiel, ce qui est encore hybride` pour ne pas interviewer les utilisateurs sur une representation floue du systeme | Ajout d'une mise a jour ciblee `Audit et cartographie AS-IS des processus existants` : flux metier `demande -> devis -> mission`, `reservation/sejour -> taches`, `incident -> artisan`, `facture -> paiement`, flux support `onboarding, pilotage, messagerie/notifications`, exceptions majeures et contradictions entre modele cible et implementation encore hybride | Produit/Direction |
| 2026-08-07 | Technique/SÃƒÂ©curitÃƒÂ© | Centraliser la dÃƒÂ©fense CSRF sur les mutations API via le proxy applicatif | Les cookies Auth.js en `SameSite=Lax` rÃƒÂ©duisaient le risque, mais les routes mÃƒÂ©tier `POST/PATCH/PUT/DELETE` n'avaient pas encore de garde CSRF explicite ni de politique d'exemption centralisÃƒÂ©e | Nouveau helper `src/server/security/csrf.ts`, contrÃƒÂ´le `Origin` puis repli `Referer` contre l'origine courante/configurÃƒÂ©e, blocage JSON `403` pour les mutations `/api` non fiables, exemptions explicites pour `/api/auth`, `/api/billing/webhook` et appels serveur-ÃƒÂ -serveur porteurs d'en-tÃƒÂªtes de confiance, tests dÃƒÂ©diÃƒÂ©s `src/tests/csrf-protection.test.mts` `6/6 PASS`; build alternatif `.next-csrf-check` bloquÃƒÂ© par un problÃƒÂ¨me TypeScript prÃƒÂ©existant hors lot dans `src/app/dashboard/admin/pilotage/page.tsx` | Tech/SÃƒÂ©curitÃƒÂ©/QA |
| 2026-08-07 | Produit/Acquisition | Ãƒâ€°tendre le profil public concierge avec une mini-surface type Linktree plutÃƒÂ´t que crÃƒÂ©er un produit sÃƒÂ©parÃƒÂ© | Le besoin rÃƒÂ©el est d'augmenter l'actionnabilitÃƒÂ© publique des profils partagÃƒÂ©s via rÃƒÂ©seaux, bouche-ÃƒÂ -oreille ou QR code, sans ouvrir une nouvelle dette produit ou data | `/api/profiles/public/[id]` expose dÃƒÂ©sormais aussi `website`, `linkedin`, `instagram`, `facebook` ; `/concierges/[id]` affiche un bloc `Liens utiles`, un CTA `Visiter le site`, une section `Actions recommandÃƒÂ©es` et poste maintenant les clics vers `/api/profiles/public/[id]/track` pour journaliser des ÃƒÂ©vÃƒÂ©nements `public_profile_cta_clicked` ; helpers purs de normalisation / structuration des liens et CTA + tests dÃƒÂ©diÃƒÂ©s ; cadrage produit consignÃƒÂ© dans `docs/spec-profils-publics-linktree-2026-08-07.md` ; dÃƒÂ©cision explicite de ne pas ouvrir encore cette mÃƒÂ©canique aux profils provider | Produit/Tech |
| 2026-07-29 | Tech/Admin | Diagnostiquer puis rendre l'admin compatible avec le schÃƒÂ©ma distant `missions` rÃƒÂ©ellement exposÃƒÂ© | Le seed KPI connectÃƒÂ© a rÃƒÂ©ussi, mais la base distante cassait encore certaines lectures admin car `missions.title`, `missions.request_id` et `missions.provider_profile_id` ne sont pas publiÃƒÂ©s par PostgREST alors que le repo les attend | Nouveau script `npm run inspect:remote:admin-schema` / `scripts/inspect-remote-admin-schema.mjs` pour sonder le schÃƒÂ©ma REST distant ; constat vÃƒÂ©rifiÃƒÂ© le mercredi 29 juillet 2026 : `missions` expose `id, owner_profile_id, concierge_profile_id, status, created_at`, mais pas `title`, `request_id` ni `provider_profile_id` ; correctifs admin branchÃƒÂ©s : `/api/admin/control-tower` retente dÃƒÂ©sormais une lecture `missions` compatible sans `title` et reconstruit un libellÃƒÂ© via `metadata.mission_title/service_label/property_label`, `/api/admin/operations` affiche aussi un titre dÃƒÂ©duit au lieu de laisser `null`, `npm run build` PASS aprÃƒÂ¨s ces ajustements ; correctif structurel prÃƒÂ©parÃƒÂ© ensuite dans `docs/sql/2026-07-29-align-remote-missions-schema.sql` avec note d'application `docs/remote-missions-schema-realignment-2026-07-29.md` pour rÃƒÂ©aligner la base distante sans casser les donnÃƒÂ©es existantes | Admin/Tech |
| 2026-07-29 | Produit/Architecture | Clarifier le modÃƒÂ¨le mÃƒÂ©tier contrat -> rÃƒÂ©servation -> tÃƒÂ¢ches -> intervention | Le flux cible propriÃƒÂ©taire/conciergerie risquait de confondre rÃƒÂ©servation voyageur, mission opÃƒÂ©rationnelle et intervention artisan, ce qui aurait fragilisÃƒÂ© planning, statuts, facturation et UX | Nouvelle spÃƒÂ©cification `docs/spec-reservations-sejours-operations-2026-07-29.md` : un devis ou contrat signÃƒÂ© ouvre la collaboration, la rÃƒÂ©servation ou le sÃƒÂ©jour devient l'objet canonique partagÃƒÂ© dans les deux plannings, les consignes et besoins se rattachent au sÃƒÂ©jour, les tÃƒÂ¢ches concierge en dÃƒÂ©rivent, et les artisans interviennent via des interventions liÃƒÂ©es plutÃƒÂ´t que via une confusion gÃƒÂ©nÃƒÂ©rale autour de `missions` | Produit/Tech |
| 2026-07-29 | Produit/Tech | Transformer la clarification mÃƒÂ©tier en plan technique de migration progressive | AprÃƒÂ¨s avoir clarifiÃƒÂ© que la rÃƒÂ©servation n'est pas une mission, il fallait ÃƒÂ©viter une refonte thÃƒÂ©orique et dÃƒÂ©finir une trajectoire compatible avec les routes dÃƒÂ©jÃƒÂ  prÃƒÂ©sentes (`concierge/reservations`, `concierge/stays`, owner `voyageurs`) | Nouveau plan `docs/plan-technique-reservations-sejours-mvp-2026-07-29.md` : introduction recommandÃƒÂ©e d'une table canonique `reservations`, liens progressifs vers `missions`, `provider_interventions` et `workflow_events`, APIs MVP 1 owner/concierge/planning, RLS cible, stratÃƒÂ©gie de migration par phases A/B/C/D et dÃƒÂ©finition de done ; orientation retenue : rÃƒÂ©utiliser les surfaces existantes mais sortir le sÃƒÂ©jour de `mission.metadata` ; phase A matÃƒÂ©rialisÃƒÂ©e par la migration `supabase/migrations/20260729153000_reservations_core.sql`, les types Supabase mis ÃƒÂ  jour et un test contractuel dÃƒÂ©diÃƒÂ© `src/tests/reservations-core-contract.test.mts` ; phase B engagÃƒÂ©e ensuite avec un CRUD minimal owner/participants (`/api/owner/reservations`, `/api/reservations/[id]`), un helper partagÃƒÂ© `src/app/api/_shared/reservations.ts` et la route `/api/concierge/stays` branchÃƒÂ©e sur `reservations` en source primaire avec fallback legacy `missions` ; phase C est dÃƒÂ©sormais terminÃƒÂ©e : `src/app/dashboard/owner/missions/voyageurs/page.tsx` lit/crÃƒÂ©e les sÃƒÂ©jours via `reservations`, `src/app/dashboard/owner/planning/page.tsx` calcule son planning depuis `/api/owner/reservations`, et `GET /api/concierge/reservations` prend dÃƒÂ©sormais `reservations` comme objet racine tout en rÃƒÂ©attachant les missions opÃƒÂ©rationnelles liÃƒÂ©es pour prÃƒÂ©server la lecture workflow ; phase D est dÃƒÂ©sormais appliquÃƒÂ©e ÃƒÂ  distance sur les trois maillons principaux et nettoyÃƒÂ©e sur les parcours secondaires : migration `supabase/migrations/20260729190000_link_missions_to_reservations.sql` appliquÃƒÂ©e sur la base Supabase distante le mercredi 29 juillet 2026, ajout de `missions.reservation_id` dans les types locaux, insert mission compatible avec fallback si la colonne n'est pas encore exposÃƒÂ©e ÃƒÂ  distance, `POST /api/concierge/reservations` garantit dÃƒÂ©sormais l'existence de la rÃƒÂ©servation canonique avant crÃƒÂ©ation des missions liÃƒÂ©es, routes `concierge/reservations`, `concierge/stays` et `reservations/[id]` capables d'utiliser `reservation_id` avant de retomber sur `metadata.reservation_id/reservation_workflow_id`, extension explicite vers les artisans avec migration `supabase/migrations/20260729193000_link_provider_interventions_to_reservations.sql` elle aussi appliquÃƒÂ©e ÃƒÂ  distance le mercredi 29 juillet 2026, crÃƒÂ©ation de `provider_interventions.reservation_id` et lecture/ÃƒÂ©criture des interventions branchÃƒÂ©es d'abord sur cette liaison avant fallback metadata, puis extension explicite de la timeline avec migration `supabase/migrations/20260729194500_link_workflow_events_to_reservations.sql` appliquÃƒÂ©e ÃƒÂ  distance le mercredi 29 juillet 2026, helper `recordWorkflowEvent` compatible `reservation_id`, API `/api/workflow-events` filtrable par `reservationId`, et ÃƒÂ©critures mission/facture/devis capables d'alimenter cette relation directe ; le nettoyage secondaire est aussi livrÃƒÂ© : agrÃƒÂ©gation des sÃƒÂ©jours priorisant `reservation_id`, ÃƒÂ©vÃƒÂ©nements concierge enrichis en `reservation_id`, annulation de facture de workflow pilotÃƒÂ©e par `mission_id` plutÃƒÂ´t que par le seul metadata workflow, moteur de planning alignÃƒÂ© sur l'identifiant canonique de rÃƒÂ©servation, puis nouvelle couche de cycle de vie partagÃƒÂ© directement sur la rÃƒÂ©servation canonique avec timeline unifiÃƒÂ©e `workflow_events + ÃƒÂ©vÃƒÂ©nements synthÃƒÂ©tiques`, traÃƒÂ§age des crÃƒÂ©ations owner/concierge et journalisation des mises ÃƒÂ  jour de statuts, notes et consignes dans `PATCH /api/reservations/[id]` | Produit/Tech |
| 2026-07-29 | Produit/UX | Rendre la lecture du sÃƒÂ©jour rÃƒÂ©ellement collaborative dans les cockpits owner et concierge | La rÃƒÂ©servation canonique exposait dÃƒÂ©jÃƒÂ  ses champs ÃƒÂ©ditoriaux et sa timeline, mais les ÃƒÂ©crans mÃƒÂ©tier lisaient encore surtout des cartes statiques ou dÃƒÂ©rivÃƒÂ©es de `missions`, sans narration partagÃƒÂ©e du sÃƒÂ©jour | `/dashboard/concierge/sejours` charge maintenant `/api/reservations/[id]` sur le sÃƒÂ©jour sÃƒÂ©lectionnÃƒÂ© et affiche une section `Lecture collaborative` avec propriÃƒÂ©taire, derniÃƒÂ¨re mise ÃƒÂ  jour, consignes d'accÃƒÂ¨s, notes owner/conciergerie et une timeline rÃƒÂ©cente ; `/dashboard/owner/missions/voyageurs` rÃƒÂ©cupÃƒÂ¨re aussi le dÃƒÂ©tail canonique de la rÃƒÂ©servation focalisÃƒÂ©e, ajoute un bouton `Suivi`, un `Brief collaboratif` et une `Timeline rÃƒÂ©cente` dans l'aside, avec ÃƒÂ©tats loading/erreur/empty ; preuves : contrat `src/tests/reservations-api-contract.test.mts` enrichi, suite Node ciblÃƒÂ©e `19/19 PASS` et `npm run build` PASS le mercredi 29 juillet 2026 | Produit/UX/Tech |
| 2026-07-29 | Produit/UX | Ouvrir l'ÃƒÂ©criture collaborative du sÃƒÂ©jour depuis les cockpits owner/concierge et prolonger ce rÃƒÂ©cit dans le planning owner | La lecture canonique ÃƒÂ©tait branchÃƒÂ©e, mais l'utilisateur devait encore sortir des ÃƒÂ©crans mÃƒÂ©tier pour enrichir le brief ou faire avancer le cycle de vie partagÃƒÂ© du sÃƒÂ©jour | `PATCH /api/reservations/[id]` accepte dÃƒÂ©sormais aussi les effacements volontaires de `access_instructions`, `owner_notes` et `concierge_notes`, tout en journalisant ces mises ÃƒÂ  jour comme `Brief collaboratif mis a jour` ; `/dashboard/concierge/sejours` permet maintenant d'ÃƒÂ©diter les consignes d'accÃƒÂ¨s et les notes conciergerie, puis d'exÃƒÂ©cuter directement des actions de timeline `Accuser reception`, `Marquer en sejour` et `Cloturer` ; `/dashboard/owner/missions/voyageurs` permet dÃƒÂ©sormais au propriÃƒÂ©taire d'ÃƒÂ©diter ses consignes d'accÃƒÂ¨s et notes owner dans l'aside focalisÃƒÂ©e, puis d'annuler le sÃƒÂ©jour depuis le cockpit avec traÃƒÂ§age canonique ; `/dashboard/owner/planning` rÃƒÂ©injecte aussi le voyageur, les notes owner/concierge, les consignes d'accÃƒÂ¨s et la conciergerie dans ses cartes et pastilles pour rendre le planning plus ÃƒÂ©ditorial ; preuves : contrat `src/tests/reservations-api-contract.test.mts` enrichi, suite Node ciblÃƒÂ©e `19/19 PASS`, `npm run build` PASS le mercredi 29 juillet 2026 | Produit/UX/Tech |
| 2026-07-29 | Data/Tech | Semer un jeu KPI persistant rattachÃƒÂ© aux workspaces admin | Le fallback local gardait l'UI lisible, mais ne crÃƒÂ©ait aucune donnÃƒÂ©e rÃƒÂ©elle dans Supabase pour valider les KPI connectÃƒÂ©s | Nouveau script `scripts/seed-admin-workspace-kpis.mjs` + commande `npm run seed:admin:kpis` : crÃƒÂ©ation idempotente de 18 profils KPI liÃƒÂ©s ÃƒÂ  `admin@planetls.fr` (6 owner, 6 concierge, 6 provider), ÃƒÂ©vÃƒÂ©nements d'onboarding, demandes, destinataires, devis, factures, conversations, messages, `workflow_events`, `provider_clients` et `provider_interventions` ; exÃƒÂ©cution rÃƒÂ©elle rÃƒÂ©ussie le mercredi 29 juillet 2026 avec IDs persistÃƒÂ©s en base ; `/api/kpis/overview` tolÃƒÂ¨re aussi les schÃƒÂ©mas distants incomplets en rÃƒÂ©essayant sans `provider_profile_id` et en calculant l'activation provider via `provider_interventions` si `missions` n'expose pas encore cette relation | Admin/Data/Tech |
| 2026-07-28 | Produit/UX | Basculer le dashboard administrateur en Mission Control orientÃƒÂ© action | La page admin restait lisible comme audit interne mais pas encore comme cockpit quotidien de dÃƒÂ©cision | `/dashboard/admin` adopte un bandeau de synthÃƒÂ¨se, un filtre 7/30/90 jours, un filtre segment `PropriÃƒÂ©taires/Conciergeries/Artisans`, des cartes KPI, une liste de prioritÃƒÂ©s actionnables, une activitÃƒÂ© rÃƒÂ©cente, trois tables mÃƒÂ©tier compactes, deux lectures graphiques issues des vraies donnÃƒÂ©es (`activation_series`, `activation_by_zone`), deux donuts supplÃƒÂ©mentaires pour la rÃƒÂ©partition des rÃƒÂ´les et les feux de contrÃƒÂ´le, trois cartes de santÃƒÂ© visuelles pour `Inscriptions`, `Missions` et `Messages`, ainsi quÃ¢â‚¬â„¢un hero premium de type `data story` avec tension du jour, actions chaudes et rÃƒÂ©sumÃƒÂ©s ÃƒÂ©ditoriaux ; les libellÃƒÂ©s `n/a` sont remplacÃƒÂ©s par `DonnÃƒÂ©e insuffisante` / `Non disponible` ; la page `/dashboard/admin/controle` est aussi remontÃƒÂ©e au mÃƒÂªme niveau visuel avec hero santÃƒÂ© ÃƒÂ©ditorial, cartes de synthÃƒÂ¨se, onglets plus dÃƒÂ©cisionnels et surfaces de pilotage plus lisibles ; la page couvre aussi une phase 6 dÃ¢â‚¬â„¢ÃƒÂ©tats UX complets et une phase 7 responsive/a11y : boutons de filtre avec ÃƒÂ©tat clavier explicite, focus visible, tableaux annotÃƒÂ©s (`caption`, `scope`) et repli mobile en cartes lisibles via libellÃƒÂ©s de colonnes ; `DashboardLayout` peut masquer ses blocs secondaires pour laisser cette composition respirer ; la page reste dÃƒÂ©sormais lisible en mode dÃƒÂ©gradÃƒÂ© si `overview`, `operations`, `control-tower` ou `kpis` sont indisponibles et affiche un bandeau dÃ¢â‚¬â„¢ÃƒÂ©tat explicite ; `/api/admin/overview`, `/api/admin/operations` et `/api/kpis/overview` renvoient aussi un payload `health` plutÃƒÂ´t quÃ¢â‚¬â„¢un `500` quand Supabase est inaccessible, ce qui garde le cockpit exploitable en sandbox ; en complÃƒÂ©ment, `/api/kpis/overview` injecte maintenant en local des cohortes workspace dÃƒÂ©terministes et des zones/series non nulles quand Supabase tombe ou quand aucune cohorte mature n'est encore disponible, afin d'ÃƒÂ©viter des visuels durablement vides pendant l'amorÃƒÂ§age ; phase 8 validÃƒÂ©e avec `npm run build` PASS, Playwright `e2e/admin-dashboard.spec.ts` PASS, Playwright `e2e/admin-kpi-activation.spec.ts` PASS, Playwright `e2e/admin-control-actions.spec.ts` PASS et contrat `src/tests/kpis-overview-contract.test.mts` PASS ; revalidation complÃƒÂ©mentaire du 2026-07-28 : contrat `src/tests/kpis-overview-contract.test.mts` `5/5 PASS`, `npm run build` PASS | Admin/Produit/Tech |
| 2026-07-29 | Produit/Finance | Ajouter un cockpit admin dÃƒÂ©diÃƒÂ© au pilotage entrepreneurial et financier | Le cockpit admin principal pilotait bien l'activitÃƒÂ© et les risques, mais il manquait une lecture plus directement business sur la croissance, le pipeline et la tension de trÃƒÂ©sorerie | Nouvelle route `/dashboard/admin/pilotage` branchÃƒÂ©e ÃƒÂ  la navigation admin, au centre de commandes global et au shell dashboard ; la page agrÃƒÂ¨ge `/api/admin/overview`, `/api/admin/operations`, `/api/admin/control-tower` et `/api/kpis/overview` pour afficher une synthÃƒÂ¨se acquisition/activation, des estimations de pipeline missions, de valeur planifiÃƒÂ©e, de valeur facturÃƒÂ©e visible, un taux de monÃƒÂ©tisation, une lecture d'encaissement final, des alertes de friction commerciale et des actions recommandÃƒÂ©es ; la page reste lisible en mode dÃƒÂ©gradÃƒÂ© quand certaines sources remontent un `health` incomplet ; vÃƒÂ©rification : `npm run build` PASS le mercredi 29 juillet 2026, route statique `/dashboard/admin/pilotage` gÃƒÂ©nÃƒÂ©rÃƒÂ©e dans le build | Admin/Produit/Finance |
| 2026-08-03 | Produit/Finance | Remplacer le comparateur d'offre Pro par un cadrage financier plus direct | La fondatrice ne veut plus d'un comparateur de scÃƒÂ©narios ; elle a besoin d'une premiÃƒÂ¨re proposition de prix, d'une estimation selon le nombre d'abonnÃƒÂ©s et d'une hypothÃƒÂ¨se de commission | Le `Business Strategy Center` de `/dashboard/admin/pilotage` abandonne le comparatif A/B/C et affiche dÃƒÂ©sormais une recommandation simple : `Conciergerie Pro` ÃƒÂ  `99 Ã¢â€šÂ¬ HT / mois` en lancement puis `149 Ã¢â€šÂ¬ HT / mois` en cible, avec tableau d'estimation MRR/ARR par volume d'abonnÃƒÂ©s, hypothÃƒÂ¨se alternative de commission ÃƒÂ  `8 %` avec projection mensuelle selon le nombre de missions, et note explicite indiquant que l'idÃƒÂ©e de commission solidaire associations est conservÃƒÂ©e mais reportÃƒÂ©e tant que le choix financier principal n'est pas arrÃƒÂªtÃƒÂ© ; vÃƒÂ©rification : `npm run build` PASS le lundi 3 aoÃƒÂ»t 2026 | Admin/Produit/Finance |
| 2026-08-03 | Produit/Finance | Conserver une due diligence investisseur dans le cockpit de pilotage | La rÃƒÂ©flexion due diligence produite en session risquait de rester hors du produit, donc difficilement rÃƒÂ©utilisable dans le pilotage global | La page `/dashboard/admin/pilotage` embarque dÃƒÂ©sormais un bloc `Due diligence investisseur` avec verdict `Attendre`, scoring investisseur, top questions critiques, red flags majeurs et conditions minimales avant rÃƒÂ©examen d'un dossier de levÃƒÂ©e ; le Master Plan conserve aussi une synthÃƒÂ¨se durable de cette lecture pour ÃƒÂ©viter de la perdre hors conversation ; vÃƒÂ©rification : `npm run build` PASS le lundi 3 aoÃƒÂ»t 2026 | Admin/Produit/Finance |
| 2026-08-03 | Documentation/IA | Conserver durablement le cadrage du futur systÃƒÂ¨me de prompts PlanetLS | La spÃƒÂ©cification IA dÃƒÂ©taillÃƒÂ©e ÃƒÂ©tait prÃƒÂ©sente dans une piÃƒÂ¨ce jointe Codex, donc facile ÃƒÂ  perdre et difficile ÃƒÂ  retrouver dans le dÃƒÂ©pÃƒÂ´t | CrÃƒÂ©ation du dossier `docs/ai/` avec un index dÃƒÂ©diÃƒÂ© et une fiche `systeme-gestion-prompts-planetls-2026-08-03.md` rÃƒÂ©sumant l'objectif, l'architecture en 3 niveaux, les contraintes et la sÃƒÂ©quence de travail recommandÃƒÂ©e pour un futur centre de prompts ; aucun dÃƒÂ©veloppement produit lancÃƒÂ© ÃƒÂ  ce stade | Produit/Tech/Documentation |
| 2026-08-03 | Technique/SÃƒÂ©curitÃƒÂ© | PrÃƒÂ©server la confidentialitÃƒÂ© des preuves litige et rÃƒÂ©intÃƒÂ©grer seulement les rÃƒÂ©cupÃƒÂ©rations locales ÃƒÂ  faible risque | Le poste fixe contenait des changements non poussÃƒÂ©s alors que `master` avait dÃƒÂ©jÃƒÂ  divergÃƒÂ© ; il fallait rÃƒÂ©cupÃƒÂ©rer uniquement les morceaux encore pertinents sans rÃƒÂ©introduire l'ancienne direction UI | Conservation ciblÃƒÂ©e de trois apports : export litige via liens signÃƒÂ©s temporaires au lieu d'URLs publiques Storage, typage explicite `TravelerStayMissionRow` dans `/api/reservations/[id]`, et ouverture du parseur `admin/control-tower` aux cibles systÃƒÂ¨me non UUID avec tests associÃƒÂ©s ; les ÃƒÂ©crans locaux de pilotage plus anciens ne sont pas rÃƒÂ©injectÃƒÂ©s car `master` suit dÃƒÂ©jÃƒÂ  une autre trajectoire fonctionnelle | Tech/SÃƒÂ©curitÃƒÂ©/QA |
| 2026-07-28 | Technique | TolÃƒÂ©rer temporairement les tables Supabase non rÃƒÂ©gÃƒÂ©nÃƒÂ©rÃƒÂ©es dans la tour de contrÃƒÂ´le admin | Le build Vercel ÃƒÂ©chouait sur `onboarding_events`, puis `service_requests`, car les migrations existent mais les types gÃƒÂ©nÃƒÂ©rÃƒÂ©s ne couvrent pas encore toutes les tables actives | `/api/admin/control-tower` passe par un helper local non typÃƒÂ© pour prÃƒÂ©server le build et le diagnostic admin ; `npm run build` repasse au vert ; la rÃƒÂ©gÃƒÂ©nÃƒÂ©ration complÃƒÂ¨te des types Supabase reste prioritaire pour supprimer ce contournement | Tech |
| 2026-07-19 | Produit/Technique | Faire de l'ÃƒÂ©tat non vÃƒÂ©rifiable un statut explicite de la tour de contrÃƒÂ´le | Une table ou colonne absente ne doit jamais produire un faux ÃƒÂ©tat sain | API trace 9 sources, santÃƒÂ© globale horodatÃƒÂ©e, bandeau admin et recontrÃƒÂ´le manuel ; 181/181 tests et build au vert | Produit/Tech/QA |
| 2026-04-25 | UX | Conserver deux modes d'accompagnement concierge : simplicitÃƒÂ© et expert | Besoins et aisance numÃƒÂ©rique trÃƒÂ¨s diffÃƒÂ©rents | Onboarding et densitÃƒÂ© UI adaptatifs | Produit |
| 2026-05-18 | Technique | Durcir la messagerie provider et synchroniser le dernier message | FiabilitÃƒÂ© des conversations | Routes provider messages | Tech |
| 2026-05-18 | Produit | Introduire KPI partagÃƒÂ©s owner/concierge/provider | Mesurer activation et conversion | Endpoint KPI + admin, encore incomplet | Produit/Data |
| 2026-05-25 | UX | Adopter une checklist responsive/a11y permanente | HÃƒÂ©tÃƒÂ©rogÃƒÂ©nÃƒÂ©itÃƒÂ© des dashboards | CritÃƒÂ¨re de sortie de chaque lot UI | Front/QA |
| 2026-06-05 | MÃƒÂ©tier | Centraliser demande Ã¢â€ â€™ devis Ã¢â€ â€™ mission et sÃƒÂ©parer leurs statuts | Ãƒâ€°viter transitions contradictoires | Helpers et ÃƒÂ©vÃƒÂ©nements de workflow | Produit/Tech |
| 2026-06-06 | Architecture | RÃƒÂ©utiliser/amÃƒÂ©liorer avant de crÃƒÂ©er un composant | RÃƒÂ©duire duplication et strates concurrentes | Pages comme assembleurs, helpers partagÃƒÂ©s | Tech lead |
| 2026-06-06 | Paiement | Supporter paiement complet ou acompte/solde et consolider au niveau mission | ClartÃƒÂ© owner/concierge | Workflow paiement ÃƒÂ  finaliser | Produit/Backend |
| 2026-06-18 | SÃƒÂ©curitÃƒÂ© | ContrÃƒÂ´ler les autorisations dans les APIs, jamais uniquement dans le proxy | DÃƒÂ©fense en profondeur | Guards mÃƒÂ©tier et tests de permissions | Backend |
| 2026-06-19 | Produit | Concevoir les profils par persona et isoler les prÃƒÂ©fÃƒÂ©rences owner | Le profil polymorphe ne supporte pas les mÃƒÂ©tiers | Spec cible, policy de patch, owner preferences | Produit/Backend |
| 2026-07-07 | Architecture | Geler les conventions du Sprint 1 avant nouvelles grandes ÃƒÂ©volutions | Base riche mais fragmentÃƒÂ©e | UI, types, Supabase et workflows ÃƒÂ  consolider | Tech lead |
| 2026-07-12 | Produit | Enrichir le cockpit concierge : CRM, ÃƒÂ©quipe, maintenance, rÃƒÂ©servations, mobile | Faire de PlanetLS un outil quotidien | Socles livrÃƒÂ©s, persistance spÃƒÂ©cialisÃƒÂ©e attendue | Produit/Tech |
| 2026-07-12 | Produit | CrÃƒÂ©er le centre sÃƒÂ©jours sans scoring voyageur | Besoin opÃƒÂ©rationnel et minimisation des donnÃƒÂ©es | API/page concierge, voyageur non autonome | Produit |
| 2026-07-18 | StratÃƒÂ©gie | Positionner PlanetLS comme rÃƒÂ©seau professionnel de la location saisonniÃƒÂ¨re | RÃƒÂ©soudre dÃƒÂ©couverte, confiance, liquiditÃƒÂ© et rÃƒÂ©tention | Fil, carte, mur des missions et profils ÃƒÂ©voluÃƒÂ©s entrent dans la cible | Direction produit |
| 2026-07-18 | Gouvernance | Faire du prÃƒÂ©sent Master Plan la rÃƒÂ©fÃƒÂ©rence officielle | Ãƒâ€°viter la multiplication des audits | Les documents existants deviennent des annexes historiques/spÃƒÂ©cialisÃƒÂ©es | Direction produit |
| 2026-07-18 | QA | Qualifier le produit global N3 et non Ã¢â‚¬Å“terminÃƒÂ©Ã¢â‚¬Â | Baseline initiale 153/154, puis 157/157 aprÃƒÂ¨s correction du snapshot ; pas d'E2E complet et modules rÃƒÂ©cents partiellement persistÃƒÂ©s | PrioritÃƒÂ© ÃƒÂ  la preuve et ÃƒÂ  la consolidation | QA/Tech |
| 2026-07-18 | Produit | Ajouter un assistant dÃƒÂ©coration au cockpit concierge | Aider la concierge ÃƒÂ  prÃƒÂ©parer une recommandation budgÃƒÂ©tÃƒÂ©e pour un propriÃƒÂ©taire | Page/API/helper, table `decoration_ai_reports`, navigation et tests ; partage et gÃƒÂ©nÃƒÂ©ration visuelle restent partiels | Produit/Tech |
| 2026-07-18 | QA | Rendre le snapshot UI indÃƒÂ©pendant des fins de ligne | Ãƒâ€°viter les ÃƒÂ©checs globaux LF/CRLF sans changement logique | Hash normalisÃƒÂ© et baseline UI rÃƒÂ©gÃƒÂ©nÃƒÂ©rÃƒÂ©e ; 157/157 tests validÃƒÂ©s | Tech |
| 2026-07-18 | QA | Valider la baseline de production | Fermer le lot de stabilisation avant les E2E | Lint sans erreur et build Next.js rÃƒÂ©ussi avec 164 pages ; l'ÃƒÂ©chec `spawn EPERM` initial ÃƒÂ©tait liÃƒÂ© ÃƒÂ  la sandbox Windows | Tech |
| 2026-07-18 | QA | Automatiser les smoke tests des trois espaces | Remplacer les runbooks sans preuve par une validation navigateur reproductible | Playwright, comptes workspace locaux, serveur `.next-e2e`, 3/3 scÃƒÂ©narios PASS et workflow GitHub ajoutÃƒÂ© | QA/Tech |
| 2026-07-18 | Architecture | Utiliser Webpack pour le serveur E2E | Turbopack a paniquÃƒÂ© en dÃƒÂ©veloppement parallÃƒÂ¨le ; Webpack a rÃƒÂ©vÃƒÂ©lÃƒÂ© un sÃƒÂ©lecteur CSS Module invalide | `NEXT_DIST_DIR` isole le runner ; correction SCSS compatible avec les deux bundlers | Tech |
| 2026-07-18 | QA | Valider le flux commercial multi-rÃƒÂ´les | Prouver la chaÃƒÂ®ne navigateur Ã¢â€ â€™ API Ã¢â€ â€™ donnÃƒÂ©es Ã¢â€ â€™ restitution, au-delÃƒÂ  des smoke tests | Demande, devis acceptÃƒÂ©, mission gÃƒÂ©nÃƒÂ©rÃƒÂ©e et facture ÃƒÂ©mise/visible owner ; 1/1 PASS | QA/Tech |
| 2026-07-18 | Paiement | Reporter le paiement rÃƒÂ©el jusqu'a la configuration Stripe test | `STRIPE_SECRET_KEY` absente ; le checkout rÃƒÂ©pond proprement `503` sans transaction | Configurer uniquement des clÃƒÂ©s test puis valider checkout et synchronisation | Tech/Produit |
| 2026-07-18 | Architecture | Rendre la crÃƒÂ©ation de mission compatible avec le schÃƒÂ©ma connectÃƒÂ© | L'E2E a rÃƒÂ©vÃƒÂ©lÃƒÂ© l'absence de `missions.title` et l'obligation de `service_id` | Repli contrÃƒÂ´lÃƒÂ© vers `service_label`, service catalogue conservÃƒÂ© dans le devis puis la mission, test unitaire dÃƒÂ©diÃƒÂ© | Tech |
| 2026-07-18 | QA | Valider le flux opÃƒÂ©rationnel provider | Prouver l'affectation multi-rÃƒÂ´les, la restitution terrain et la facturation | Mission Ã¢â€ â€™ intervention Ã¢â€ â€™ preuve Ã¢â€ â€™ `completed` Ã¢â€ â€™ facture liÃƒÂ©e de 90 Ã¢â€šÂ¬, 1/1 PASS | QA/Tech |
| 2026-07-18 | Architecture | RÃƒÂ©utiliser le moteur de facturation pour les providers | Ãƒâ€°viter un second systÃƒÂ¨me tout en empÃƒÂªchant la facturation de missions arbitraires | Route intervention-scopÃƒÂ©e, contrÃƒÂ´le d'appartenance/statut, crÃƒÂ©ation idempotente et filtre `providerInterventionId` | Tech |
| 2026-07-18 | Architecture | Corriger la route mission/provider pour le schÃƒÂ©ma connectÃƒÂ© | UUID valides rejetÃƒÂ©s et lecture dÃƒÂ©pendante de `missions.title` | Validateur UUID restaurÃƒÂ©, rÃƒÂ©solution par chemin et normalisation `title`/`service_label` | Tech |
| 2026-07-18 | Architecture | Ouvrir les preuves mÃƒÂ©dia aux artisans affectÃƒÂ©s uniquement | Permettre la restitution terrain sans exposer les fichiers des autres missions | Bucket privÃƒÂ© existant rÃƒÂ©utilisÃƒÂ©, contrÃƒÂ´le par `provider_interventions.metadata.mission_id`, SHA-256 et URL signÃƒÂ©e ; E2E 1/1 PASS | Tech/QA |
| 2026-07-18 | Paiement | Valider la synchronisation Stripe sans transaction rÃƒÂ©elle | Fermer le risque webhook avant disponibilitÃƒÂ© des clÃƒÂ©s test | Signature HMAC avec fenÃƒÂªtre anti-rejeu de 5 minutes ; facture rÃƒÂ©elle passÃƒÂ©e ÃƒÂ  `paid` par webhook E2E signÃƒÂ©, 1/1 PASS | Tech/QA |
| 2026-07-18 | CI | Ãƒâ€°tendre le workflow critique ÃƒÂ  toute la quality gate | EmpÃƒÂªcher un E2E vert de masquer une rÃƒÂ©gression unitaire, lint ou build | VÃƒÂ©rification des secrets, `npm test`, lint, build puis Playwright ; timeout portÃƒÂ© ÃƒÂ  30 minutes et `.env.example` ajoutÃƒÂ© sans valeur sensible | Tech/QA |
| 2026-07-18 | QA | Valider la planification aprÃƒÂ¨s paiement | Prouver que le garde paiement et le calendrier partagent un ÃƒÂ©tat persistant multi-rÃƒÂ´les | Concierge planifie une mission payÃƒÂ©e, statut et crÃƒÂ©neau relus owner ; E2E 1/1 PASS en 3,3 min | QA/Tech |
| 2026-07-18 | Planning | Bloquer les chevauchements attribuables | Ãƒâ€°viter la double rÃƒÂ©servation dÃ¢â‚¬â„¢un logement ou dÃ¢â‚¬â„¢un membre sans bloquer les ressources distinctes | Validation des dates, dÃƒÂ©tection dÃ¢â‚¬â„¢intersection stricte, rÃƒÂ©ponse 409 avec conflits ; tests unitaires et E2E de non-rÃƒÂ©gression verts | Tech/QA |
| 2026-07-18 | Planning | Exposer la capacitÃƒÂ© quotidienne de lÃ¢â‚¬â„¢ÃƒÂ©quipe | Donner un signal de surcharge sans inventer des horaires contractuels absents du modÃƒÂ¨le | DurÃƒÂ©e planifiÃƒÂ©e du jour, plafond configurable, taux de charge, ÃƒÂ©tat occupÃƒÂ© et compteur de surcharges dans lÃ¢â‚¬â„¢espace Ãƒâ€°quipe ; test dÃƒÂ©diÃƒÂ© vert | Produit/Tech |
| 2026-07-18 | Architecture | PrÃƒÂ©parer la persistance de lÃ¢â‚¬â„¢ÃƒÂ©quipe concierge | Remplacer progressivement les membres locaux sans casser la base connectÃƒÂ©e actuelle | Migration concierge_team_members avec RLS, API GET/POST et UI branchÃƒÂ©e avec fallback ; smoke 3/3 PASS, migration distante non appliquÃƒÂ©e | Tech/DBA |
| 2026-07-18 | Architecture | SÃƒÂ©curiser le cycle de vie des membres dÃ¢â‚¬â„¢ÃƒÂ©quipe | Ãƒâ€°viter les modifications transverses et conserver lÃ¢â‚¬â„¢historique dÃ¢â‚¬â„¢affectation | API membre PATCH/DELETE scoping propriÃƒÂ©taire/admin, validation mÃƒÂ©tier et dÃƒÂ©sactivation logique ; contrat 2/2 PASS | Tech/QA |
| 2026-07-18 | Produit | Brancher la gestion persistante dÃ¢â‚¬â„¢ÃƒÂ©quipe dans le cockpit concierge | Remplacer les membres de dÃƒÂ©monstration dÃƒÂ¨s que le schÃƒÂ©ma est disponible sans masquer une ÃƒÂ©quipe rÃƒÂ©ellement vide | Formulaire de crÃƒÂ©ation, disponibilitÃƒÂ© et dÃƒÂ©sactivation connectÃƒÂ©s aux API ; fallback migration explicite ; contrat 3/3 PASS | Produit/Tech |
| 2026-07-18 | Architecture | Canoniser les nouvelles migrations Supabase | EmpÃƒÂªcher la dette des deux dossiers de continuer sans dÃƒÂ©placer ÃƒÂ  lÃ¢â‚¬â„¢aveugle 20 migrations historiques | supabase/migrations devient canonique, archive legacy figÃƒÂ©e par check:migrations, contrÃƒÂ´le ajoutÃƒÂ© ÃƒÂ  la CI ; inventaire distant en attente du token Supabase | Tech/DBA |
| 2026-07-19 | Architecture | CrÃƒÂ©er le dossier maintenance canonique | Sortir les incidents de missions.metadata sans casser lÃ¢â‚¬â„¢historique existant | Table maintenance_incidents et RLS participants, API GET/POST, fusion UI dÃƒÂ©dupliquÃƒÂ©e et formulaire ; 167/167 tests, build 166 pages ; migration distante non appliquÃƒÂ©e | Tech/QA |
| 2026-07-19 | MÃƒÂ©tier | Encadrer le cycle de vie des incidents maintenance | EmpÃƒÂªcher les clÃƒÂ´tures arbitraires et tracer une progression opÃƒÂ©rationnelle cohÃƒÂ©rente | API PATCH scopÃƒÂ©e, transitions signalÃƒÂ© Ã¢â€ â€™ qualifiÃƒÂ© Ã¢â€ â€™ affectÃƒÂ© Ã¢â€ â€™ devis Ã¢â€ â€™ validÃƒÂ© Ã¢â€ â€™ planifiÃƒÂ© Ã¢â€ â€™ en cours Ã¢â€ â€™ rÃƒÂ©solu Ã¢â€ â€™ clÃƒÂ´turÃƒÂ©, action UI ; contrat 4/4, 168/168 tests, build 166 pages | Produit/Tech |
| 2026-07-19 | SÃƒÂ©curitÃƒÂ© | Restreindre et valider lÃ¢â‚¬â„¢affectation artisan | Permettre le dispatch sans exposer les coordonnÃƒÂ©es privÃƒÂ©es ni accepter un profil arbitraire | Annuaire provider dÃƒÂ©diÃƒÂ© limitÃƒÂ© aux champs professionnels, contrÃƒÂ´le du rÃƒÂ´le ÃƒÂ  lÃ¢â‚¬â„¢ÃƒÂ©criture, sÃƒÂ©lection cockpit ; contrat 5/5, 169/169 tests, build 167 pages | Tech/Produit |
| 2026-07-19 | SÃƒÂ©curitÃƒÂ© | Rendre les preuves maintenance privÃƒÂ©es et vÃƒÂ©rifiables | Conserver les photos terrain sans URL publique ni fichier non tracÃƒÂ© | Table mÃƒÂ©dia/RLS, bucket privÃƒÂ© mission-evidence rÃƒÂ©utilisÃƒÂ©, contrÃƒÂ´le MIME/25 Mo, SHA-256, URL signÃƒÂ©e 10 min et upload cockpit ; contrat 6/6, 170/170 tests, build 167 pages | Tech/QA |
| 2026-07-19 | Data | Stabiliser la dÃƒÂ©finition de lÃ¢â‚¬â„¢activation J+7 | LÃ¢â‚¬â„¢ancien calcul comptait trois activitÃƒÂ©s arbitraires et incluait des comptes trop rÃƒÂ©cents | Cohorte limitÃƒÂ©e aux comptes ayant atteint J+7, ÃƒÂ©vÃƒÂ©nement dans la fenÃƒÂªtre individuelle : demande owner, devis concierge, mission provider ; ÃƒÂ©ligibles/activÃƒÂ©s exposÃƒÂ©s ; 172/172 tests, build 167 pages | Data/Produit |
| 2026-07-19 | Data | Ajouter les sÃƒÂ©ries hebdomadaires dÃ¢â‚¬â„¢activation | Un taux global masque les variations de qualitÃƒÂ© dÃ¢â‚¬â„¢acquisition et dÃ¢â‚¬â„¢onboarding | Cohortes dÃ¢â‚¬â„¢inscription hebdomadaires matures, ÃƒÂ©ligibles/activÃƒÂ©s/taux par rÃƒÂ´le, mÃƒÂªme moteur J+7 que la synthÃƒÂ¨se ; 173/173 tests, build 167 pages | Data/Produit |
| 2026-07-19 | Data | Segmenter lÃ¢â‚¬â„¢activation J+7 par ville | Identifier les zones oÃƒÂ¹ lÃ¢â‚¬â„¢acquisition ou lÃ¢â‚¬â„¢onboarding fonctionne sans masquer la taille dÃ¢â‚¬â„¢ÃƒÂ©chantillon | Top 20 zones par rÃƒÂ´le avec ÃƒÂ©ligibles, activÃƒÂ©s et taux ; groupes immatures exclus ; 174/174 tests, build 167 pages | Data/Growth |
| 2026-07-19 | Produit/Data | Exposer activation J+7 dans le cockpit admin | Rendre les groupes actionnables sans consulter directement API | Cartes owner/concierge/provider, activÃƒÂ©s/ÃƒÂ©ligibles, tendance sur quatre groupes et zone principale ; erreur locale non bloquante ; 175/175 tests, build 167 pages | Admin/Data |
| 2026-07-19 | Produit | Enrichir le profil professionnel artisan sans nouveau modÃƒÂ¨le concurrent | Le workspace provider ne permettait d'ÃƒÂ©diter que l'identitÃƒÂ© gÃƒÂ©nÃƒÂ©rique malgrÃƒÂ© les colonnes mÃƒÂ©tier existantes | Policy de patch ÃƒÂ©tendue et section persistante activitÃƒÂ©/zone/disponibilitÃƒÂ©/tarifs/expÃƒÂ©rience/lÃƒÂ©gal/assurance/certifications avec complÃƒÂ©tude dÃƒÂ©diÃƒÂ©e ; 175/175 tests, lint et build 167 pages | Produit/Tech |
| 2026-07-19 | SÃƒÂ©curitÃƒÂ© | Conserver les justificatifs artisan privÃƒÂ©s jusqu'ÃƒÂ  vÃƒÂ©rification | Une certification dÃƒÂ©clarÃƒÂ©e ne doit pas ÃƒÂªtre confondue avec une preuve validÃƒÂ©e ni exposer un document sensible | Table/RLS dÃƒÂ©diÃƒÂ©e, bucket privÃƒÂ© rÃƒÂ©utilisÃƒÂ©, PDF/images 10 Mo, SHA-256, statuts pending/verified/rejected, liens signÃƒÂ©s 10 min et panneau profil ; migration distante non appliquÃƒÂ©e ; 178/178 tests, build 168 pages | Tech/Produit |
| 2026-07-19 | Administration | Ãƒâ€°tendre le centre de santÃƒÂ© aux contradictions opÃƒÂ©rationnelles | Un simple comptage des objets liÃƒÂ©s ne dÃƒÂ©tecte ni mission sans affectation, ni planning incohÃƒÂ©rent, ni paiement ou maintenance bloquants | 11 sources tracÃƒÂ©es, moteur mÃƒÂ©tier isolÃƒÂ© et testÃƒÂ©, contrÃƒÂ´les affectation/planning/facture/paiement/maintenance exposÃƒÂ©s dans le cockpit ; 191/191 tests, lint ciblÃƒÂ© et build 168 pages | Admin/Tech/QA |
| 2026-07-19 | SÃƒÂ©curitÃƒÂ©/Produit | Faire dÃƒÂ©cider les justificatifs artisan par un administrateur sans publier les fichiers | Une dÃƒÂ©claration fournisseur ne doit devenir un signal de confiance quÃ¢â‚¬â„¢aprÃƒÂ¨s dÃƒÂ©cision tracÃƒÂ©e, sans fuite de document, empreinte ou chemin Storage | Route admin verified/rejected avec acteur/date/motif, panneau privÃƒÂ© dans la fiche artisan et agrÃƒÂ©gats vÃƒÂ©rifiÃƒÂ©s non expirÃƒÂ©s dans lÃ¢â‚¬â„¢annuaire de dispatch ; 192/192 tests, lint et build 168 pages | Admin/Produit/Tech |
| 2026-07-19 | Pilotage | GÃƒÂ©nÃƒÂ©rer le planning de dÃƒÂ©veloppement depuis le registre de maintenance | Donner un ordre de travail lisible sans crÃƒÂ©er une seconde roadmap divergente | Chantiers non terminÃƒÂ©s groupÃƒÂ©s par horizon calculÃƒÂ© depuis P0Ã¢â‚¬â€œP4, prochaine action et preuves visibles dans `/dashboard/admin/developpement` ; 193/193 tests, lint et build 168 pages | Produit/Tech |
| 2026-07-27 | Pilotage/UX | Transformer la page Developer en journal de bord opÃƒÂ©rationnel | La vue dÃƒÂ©veloppement exposait dÃƒÂ©jÃƒÂ  le Master Plan, mais ne permettait ni mÃƒÂ©moire quotidienne, ni favoris, ni commentaires, ni saisie manuelle dÃ¢â‚¬â„¢ÃƒÂ©vÃƒÂ©nements de dÃƒÂ©veloppement | Section `Journal de bord` ajoutÃƒÂ©e dans `/dashboard/admin/developpement` : timeline verticale responsive, ÃƒÂ©vÃƒÂ©nements auto depuis Git et planning, formulaire manuel local, recherche instantanÃƒÂ©e, filtres pÃƒÂ©riode/fonctionnalitÃƒÂ©/prioritÃƒÂ©/auteur, favoris, commentaires et liens GitHub ; tests `203/203 PASS`, ESLint ciblÃƒÂ© `PASS`, build Next `PASS` aprÃƒÂ¨s exclusion des fichiers E2E du `tsconfig` applicatif | Produit/Tech/QA |
| 2026-07-27 | Pilotage/UX | CrÃƒÂ©er une Mission Control dÃƒÂ©veloppeur lisible en 30 secondes | Le journal de bord documente lÃ¢â‚¬â„¢activitÃƒÂ©, mais il manquait un cockpit de dÃƒÂ©cision immÃƒÂ©diate sur la progression produit, la charge de dev et la santÃƒÂ© des dÃƒÂ©pendances clÃƒÂ©s | Bloc `Mission Control` ajoutÃƒÂ© dans `/dashboard/admin/developpement` : progression globale, fonctionnalitÃƒÂ©s terminÃƒÂ©es/en cours/bloquÃƒÂ©es, bugs critiques/mineurs, dÃƒÂ©cisions et commits rÃƒÂ©cents, temps de dev hebdomadaire estimÃƒÂ©, objectifs semaine/suivant, derniÃƒÂ¨re sauvegarde, environnement courant et cartes de santÃƒÂ© Supabase/Vercel/GitHub ; tests `204/204 PASS`, ESLint ciblÃƒÂ© `PASS`, build Next `PASS` | Produit/Tech/QA |
| 2026-07-27 | Pilotage/UX | Transformer le planning en roadmap intelligente vivante | Le cockpit dev montrait lÃ¢â‚¬â„¢ÃƒÂ©tat du projet, mais ne proposait pas encore de sÃƒÂ©quencement dynamique quand un chantier se termine ou se dÃƒÂ©bloque | Bloc `Roadmap intelligente` ajoutÃƒÂ© dans `/dashboard/admin/developpement` : prioritÃƒÂ©s, difficultÃƒÂ©, dÃƒÂ©pendances, estimation, gains utilisateur/business, dette technique, responsable, date prÃƒÂ©vue, suggestion de prochaine fonctionnalitÃƒÂ© logique et clÃƒÂ´ture locale avec recalcul immÃƒÂ©diat ; tests `205/205 PASS`, ESLint ciblÃƒÂ© `PASS`, build Next `PASS`, spec Playwright enrichie mais non exÃƒÂ©cutable localement car la commande `playwright` est absente du shell | Produit/Tech/QA |
| 2026-07-27 | Pilotage/Tech | CrÃƒÂ©er une mÃƒÂ©moire technique consultable en quelques secondes | Les arbitrages de stack, dÃ¢â‚¬â„¢architecture et de workflow existaient dans le code et le Master Plan, mais restaient trop lents ÃƒÂ  retrouver lors dÃ¢â‚¬â„¢un nouveau chantier | Bloc `MÃƒÂ©moire technique` ajoutÃƒÂ© dans `/dashboard/admin/developpement` : dÃƒÂ©cisions canoniques `Pourquoi Supabase`, `Pourquoi Next.js`, `Pourquoi Vercel`, architecture, composants et workflow, complÃƒÂ©tÃƒÂ©es par les dÃƒÂ©cisions extraites du Master Plan avec recherche instantanÃƒÂ©e ; tests `206/206 PASS`, ESLint ciblÃƒÂ© `PASS`, build Next `PASS`, spec Playwright enrichie mais bloquÃƒÂ©e localement par `/api/auth/dev-workspace-login` | Produit/Tech/QA |
| 2026-07-19 | Correctif responsive | Conserver les lÃƒÂ©gendes des graphiques admin dans leurs cartes | Le seuil global ÃƒÂ  760 px imposait simultanÃƒÂ©ment trois cartes et une lÃƒÂ©gende latÃƒÂ©rale, coupÃƒÂ©e par le conteneur | LÃƒÂ©gende empilÃƒÂ©e, grille 2 colonnes puis 3 ÃƒÂ  1200 px, retour ÃƒÂ  la ligne des libellÃƒÂ©s et mesure Playwright des trois camemberts `1/1 PASS` ; 193/193 tests, lint et build 168 pages | UI/QA |
| 2026-07-19 | Pilotage/UX | Rendre visibles les contenus rattachÃƒÂ©s aux titres parents du Master Plan | Les H2 suivis immÃƒÂ©diatement de H3 semblaient vides alors que leur contenu ÃƒÂ©tait rÃƒÂ©parti dans les sous-sections | Index cliquable des enfants directs avec ÃƒÂ©tat vide explicite en dernier recours ; contrÃƒÂ´le Playwright sur `1. Vision du projet` `1/1 PASS`, lint et build 168 pages | Produit/UI |
| 2026-07-19 | Maintenance | Supprimer uniquement les redondances prouvÃƒÂ©es hors graphe actif | AllÃƒÂ©ger le dÃƒÂ©pÃƒÂ´t sans casser les nombreux replis legacy encore utilisÃƒÂ©s | Retrait de 10 dÃƒÂ©pendances directes sans import et de 4 fichiers sans consommateur ; les compatibilitÃƒÂ©s legacy actives sont conservÃƒÂ©es ; 193/193 tests, lint et build 168 pages | Tech/QA |
| 2026-07-19 | Data/Produit | ClÃƒÂ´turer le P0 activation par des seuils explicites et des alertes actionnables | Un taux brut sans taille de groupe, seuil ni tendance ne permettait pas ÃƒÂ  lÃ¢â‚¬â„¢admin de dÃƒÂ©cider | Cibles owner 30 %, concierge 25 %, provider 35 % ; seuils critiques 15/12/18 %, minimum 5 profils ÃƒÂ©ligibles et baisse de 10 points ; repli connectÃƒÂ© contact_messages, Playwright 1/1 PASS, contrat 5/5, suite 195/195 et build 168 pages | Data/Produit/Tech |
| 2026-07-19 | Administration | ClÃƒÂ´turer le centre de santÃƒÂ© avec des interventions humaines auditables | Le diagnostic automatique dÃƒÂ©tectait les anomalies mais ne permettait ni prise en charge ni transmission persistÃƒÂ©e | Cycle enregistrÃƒÂ© dans workflow_events avec acteur, date, cible et motif : prise en charge, transmission au responsable puis clÃƒÂ´ture avec compte rendu sans masquer lÃ¢â‚¬â„¢anomalie ; E2E connectÃƒÂ© 1/1, contrat 10/10, suite 199/199, lint et build 168 pages | Admin/Tech/QA |
| 2026-07-19 | Paiement/QA | PrÃƒÂ©parer le P0 owner pour un vrai Checkout Stripe sans accepter de clÃƒÂ© live | Le scÃƒÂ©nario attendait toujours un 503 et ne pouvait donc jamais valider Checkout aprÃƒÂ¨s configuration | Branche sk_test_ ouvrant Checkout hÃƒÂ©bergÃƒÂ©, carte test 4242, retour factures et synchronisation ; garde CI refusant clÃƒÂ© absente ou non-test, contrat 2/2, fallback signÃƒÂ© 1/1, suite 201/201 et build 168 pages ; preuve finale bloquÃƒÂ©e sans secret | Produit/Tech/QA |
| 2026-08-02 | Pilotage/UX | Reporter l'E2E Stripe et ne plus le proposer comme meilleure action tant que sa clÃƒÂ© de test est indisponible | Garder une action matÃƒÂ©riellement impossible en tÃƒÂªte masquait les chantiers exÃƒÂ©cutables | Les statuts ReportÃƒÂ© et AbandonnÃƒÂ© sont exclus des listes prÃƒÂªte/bloquÃƒÂ©e de la roadmap ; le sommaire de DÃƒÂ©veloppement est remontÃƒÂ© en tÃƒÂªte et regroupÃƒÂ© en Agir, DÃƒÂ©cider, Documenter | Produit/Tech/QA |
| 2026-08-02 | Pilotage/UX | Rendre la page DÃƒÂ©veloppement responsive selon sa largeur rÃƒÂ©ellement disponible | Les media queries suivaient la largeur de l'ÃƒÂ©cran sans dÃƒÂ©duire la sidebar de 280 px, laissant des grilles trop larges et une partie droite coupÃƒÂ©e | Conteneur responsive local, protections anti-dÃƒÂ©bordement, sommaire supÃƒÂ©rieur hiÃƒÂ©rarchisÃƒÂ© avec repÃƒÂ¨res verticaux, passages 4/3 Ã¢â€ â€™ 2 Ã¢â€ â€™ 1 colonnes selon l'espace rÃƒÂ©el | Produit/Tech/QA |
| 2026-08-02 | Pilotage/UX | Afficher le Sommaire et dÃƒÂ©tail du Master Plan comme premiÃƒÂ¨re section de travail | Le rÃƒÂ©fÃƒÂ©rentiel complet restait relÃƒÂ©guÃƒÂ© aprÃƒÂ¨s les outils dÃƒÂ©rivÃƒÂ©s alors qu'il constitue leur source de vÃƒÂ©ritÃƒÂ© | Bloc placÃƒÂ© juste aprÃƒÂ¨s l'en-tÃƒÂªte, ouvert par dÃƒÂ©faut ; roadmap, Mission Control, conseiller, journal et mÃƒÂ©moire suivent dans cet ordre | Produit/Tech/QA |
| 2026-07-19 | Ãƒâ€°quipe/QA | ClÃƒÂ´turer le cycle de vie persistant des membres concierge | Le Master Plan supposait encore la migration distante absente alors que le schÃƒÂ©ma connectÃƒÂ© est dÃƒÂ©sormais disponible | CRUD connectÃƒÂ© validÃƒÂ© : crÃƒÂ©ation, modification de disponibilitÃƒÂ©, rendu UI, dÃƒÂ©sactivation logique et refus owner ; Playwright 1/1, contrat 3/3, suite 201/201, lint et build 168 pages | Concierge/Tech/QA |
| 2026-07-19 | Pilotage/UX | SÃƒÂ©parer les P0 restants des mentions historiques de prioritÃƒÂ© | Le compteur global affichait 17 occurrences de P0, y compris les ÃƒÂ©lÃƒÂ©ments terminÃƒÂ©s, doublons et entrÃƒÂ©es du journal | Compteurs restant/total calculÃƒÂ©s uniquement depuis le registre officiel : 3 P0 restants sur 10 ; synthÃƒÂ¨se et filtres alignÃƒÂ©s, parseur 4/4, Playwright desktop/mobile 1/1, suite 202/202 et build 168 pages | Produit/Tech/QA |

---

| 2026-07-19 | MÃƒÂ©tier | SÃƒÂ©parer information permanente, besoin dÃ¢â‚¬â„¢achat et exÃƒÂ©cution | Une dimension dÃ¢â‚¬â„¢ÃƒÂ©quipement doit rester liÃƒÂ©e au logement tandis que la commande suit une dÃƒÂ©cision contractuelle traÃƒÂ§able | purchaseNeeds persiste dans stockManagement partagÃƒÂ© ; garde contrat, plafond et photo finale ; surfaces owner et concierge ; 3 tests mÃƒÂ©tier ajoutÃƒÂ©s | Produit/Tech |

**2026-07-19 - Produit/UX.** La page admin `/dashboard/admin/developpement` devient la vue de lecture du Master Plan. Elle lit directement le Markdown afin de conserver une seule source de vÃƒÂ©ritÃƒÂ© et ajoute synthÃƒÂ¨se, recherche, filtres et sommaire.

**2026-07-27 - Produit/UX.** La page admin `/dashboard/admin/developpement` devient aussi un journal de bord du dÃƒÂ©veloppeur. Les ÃƒÂ©vÃƒÂ©nements automatiques sont dÃƒÂ©rivÃƒÂ©s des commits rÃƒÂ©cents et du registre de maintenance ; les ajouts manuels, favoris et commentaires restent stockÃƒÂ©s localement dans le navigateur pour un pilotage quotidien sans crÃƒÂ©er une nouvelle source mÃƒÂ©tier concurrente au Master Plan.

**2026-07-27 - Produit/UX.** La mÃƒÂªme page devient une `Mission Control` premium inspirÃƒÂ©e des cockpits produit. Les mÃƒÂ©triques de synthÃƒÂ¨se proviennent du registre officiel, de Git et de lÃ¢â‚¬â„¢environnement rÃƒÂ©el ; les statuts Vercel et GitHub restent des signaux de configuration locale tant quÃ¢â‚¬â„¢aucun connecteur live nÃ¢â‚¬â„¢est branchÃƒÂ© dans cette vue.

**2026-07-27 - Produit/UX.** La vue de dÃƒÂ©veloppement reÃƒÂ§oit une `Roadmap intelligente` dÃƒÂ©rivÃƒÂ©e du registre officiel. Les dÃƒÂ©pendances, dates prÃƒÂ©vues, gains et dette sont infÃƒÂ©rÃƒÂ©s depuis le Master Plan, puis recalculÃƒÂ©s localement quand un chantier est marquÃƒÂ© terminÃƒÂ© afin de proposer automatiquement la prochaine fonctionnalitÃƒÂ© logique sans ouvrir une seconde source de vÃƒÂ©ritÃƒÂ©.

**2026-07-27 - Pilotage/Tech.** La vue de dÃƒÂ©veloppement reÃƒÂ§oit une `MÃƒÂ©moire technique` qui consolide les dÃƒÂ©cisions canoniques de stack, dÃ¢â‚¬â„¢architecture, de composants et de workflow, puis les mÃƒÂ©lange aux dÃƒÂ©cisions formalisÃƒÂ©es dans le Master Plan. LÃ¢â‚¬â„¢objectif est de retrouver un Ã¢â‚¬Å“pourquoiÃ¢â‚¬Â technique en quelques secondes sans repartir dÃ¢â‚¬â„¢une lecture intÃƒÂ©grale de la documentation.

**2026-07-27 - Tech/Build.** Les fichiers `e2e/` et `playwright.config.ts` sont exclus du `tsconfig` applicatif afin que `next build` ne tente plus de typer les helpers Playwright hors bundle. Les tests E2E restent exÃƒÂ©cutables via Playwright ; seul le pÃƒÂ©rimÃƒÂ¨tre de vÃƒÂ©rification du build Next est recentrÃƒÂ© sur lÃ¢â‚¬â„¢application.

**2026-07-19 - Correctif React/mobile.** La navigation mobile admin conserve deux actions vers `/dashboard/admin/controle`, mais leur clÃƒÂ© React combine dÃƒÂ©sormais libellÃƒÂ© et URL. Le warning de clÃƒÂ© dupliquÃƒÂ©e est couvert par un contrat `2/2 PASS` et une assertion console Playwright `1/1 PASS`.

**2026-08-03 - Pilotage/UX mobile admin.** La barre mobile du rÃƒÆ’Ã‚Â´le admin n'utilise plus une logique terrain gÃƒÆ’Ã‚Â©nÃƒÆ’Ã‚Â©rique `Accueil / Planning / Missions / Messages / Terrain`. Elle renvoie maintenant vers `Vue plateforme`, `Pilotage business`, `Controle detaille` et `Developpement`, avec une feuille d'actions mobile alignÃƒÆ’Ã‚Â©e sur la revue admin plutÃƒÆ’Ã‚Â´t que sur l'exÃƒÆ’Ã‚Â©cution terrain. Preuves : `src/app/components/dashboard/mobile/DashboardMobileExperience.tsx`. VÃƒÆ’Ã‚Â©rification : `next build` relancÃƒÆ’Ã‚Â© aprÃƒÆ’Ã‚Â¨s libÃƒÆ’Ã‚Â©ration du verrou `.next/lock`.

**2026-08-13 - Pilotage/UX mobile admin.** La feuille `Action admin` a finalement ÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â© retirÃƒÆ’Ã‚Â©e de la barre mobile admin. Elle restait purement locale `checklist, capture, signature`, sans persistance serveur ni impact direct sur les vraies vues `Pilotage business`, `ContrÃƒÆ’Ã‚Â´le dÃƒÆ’Ã‚Â©taillÃƒÆ’Ã‚Â©` ou `DÃƒÆ’Ã‚Â©veloppement`, et ajoutait une couche de revue redondante. La barre admin conserve un accÃƒÆ’Ã‚Â¨s direct aux pages utiles `Vue plateforme`, `Pilotage business`, `ContrÃƒÆ’Ã‚Â´le dÃƒÆ’Ã‚Â©taillÃƒÆ’Ã‚Â©`, `DÃƒÆ’Ã‚Â©veloppement` et `Missions`. Preuves : `src/app/components/dashboard/mobile/DashboardMobileExperience.tsx`. VÃƒÆ’Ã‚Â©rification restante : relancer `next build`.

## 11. Index documentaire et destination

Tous les documents prÃƒÂ©sents lors de la consolidation ont ÃƒÂ©tÃƒÂ© pris en compte. Leur destination ÃƒÂ©vite de perdre les dÃƒÂ©tails utiles.

| Document | Apport conservÃƒÂ© | Statut aprÃƒÂ¨s Master Plan |
|---|---|---|
| `admin-supabase-audit-2026-06-16.md` | Tables et mÃƒÂ©triques admin | Annexe technique ÃƒÂ  revalider avec la base |
| `art-deco-design-system.md` | Direction visuelle et tokens | RÃƒÂ©fÃƒÂ©rence design spÃƒÂ©cialisÃƒÂ©e |
| `audit-approfondi-proprietaire-concierge-artisan-2026-05-18.md` | Vue par rÃƒÂ´le et prioritÃƒÂ©s historiques | Archive, statuts remplacÃƒÂ©s ici |
| `audit-architecture-composants-workflow-2026-06-06.md` | RÃƒÂ©utilisation et architecture workflow | RÃƒÂ©fÃƒÂ©rence d'architecture |
| `audit-complet-code-routes-permissions-2026-06-18.md` | Auth, routes et permissions | Archive technique datÃƒÂ©e |
| `audit-complet-parcours-metier-proprietaire-concierge-2026-06-06.md` | Parcours mÃƒÂ©tier dÃƒÂ©taillÃƒÂ© | SpÃƒÂ©cification mÃƒÂ©tier annexe |
| `audit-final-sprint-planetls-2026-07-12.md` | Bilan Sprint 1 et risques | Archive de livraison |
| `audit-parcours-demande-devis-mission-2026-06-05.md` | Workflow commercial dÃƒÂ©taillÃƒÂ© | SpÃƒÂ©cification annexe |
| `audit-parcours-paiement-devis-mission-2026-06-06.md` | RÃƒÂ¨gles paiement | SpÃƒÂ©cification annexe |
| `audit-utilisateurs-gestion-complete-profils-2026-06-18.md` | Ãƒâ€°carts profils par rÃƒÂ´le | Archive, backlog repris ici |
| `cartographie-champs-profils-2026-06-19.md` | Champs et dette polymorphe | RÃƒÂ©fÃƒÂ©rence migration profils |
| `concierge-signup-ux-audit-lynda-christa-2026-04-25.md` | Persona simplicitÃƒÂ©/expert | Recherche UX historique |
| `concierge-signup-ux-audit-lynda-christa-suite-2026-04-26.md` | ExpÃƒÂ©riences et KPI onboarding | Banque d'expÃƒÂ©riences |
| `concierge-ux-personas-analysis-2026-04-25.md` | Parcours et KPI persona | Recherche UX historique |
| `dashboard-figma-handoff.md` | Grilles et ÃƒÂ©tats responsive | RÃƒÂ©fÃƒÂ©rence handoff UI |
| `docs/ai/README.md` | Point d'entrÃƒÂ©e du rÃƒÂ©fÃƒÂ©rentiel IA et prompts | Index documentaire actif pour retrouver les idÃƒÂ©es IA durables |
| `docs/ai/systeme-gestion-prompts-planetls-2026-08-03.md` | Vision du systÃƒÂ¨me de gestion des prompts Codex | SpÃƒÂ©cification IA active ÃƒÂ  rÃƒÂ©ÃƒÂ©valuer avant implÃƒÂ©mentation |
| `github-issues-profils-utilisateurs-2026-06-19.md` | Formulation de 25 issues | Backlog dÃƒÂ©taillÃƒÂ© ÃƒÂ  rapprocher des issues rÃƒÂ©elles |
| `guide-audit-ux-plateforme-mise-en-relation.md` | Checklist exhaustive de parcours | Guide mÃƒÂ©thodologique, pas ÃƒÂ©tat courant |
| `matrice-validation-profils-par-role-2026-06-19.md` | Champs autorisÃƒÂ©s/interdits | RÃƒÂ©fÃƒÂ©rence sÃƒÂ©curitÃƒÂ© profils |
| `module-litiges-preuves-spec.md` | UX, schÃƒÂ©ma et rÃƒÂ¨gles litiges | SpÃƒÂ©cification mÃƒÂ©tier active |
| `onboarding-gap-analysis-all-categories-2026-04-29.md` | Gaps initiaux par rÃƒÂ´le | Archive, plusieurs points dÃƒÂ©passÃƒÂ©s |
| `p1-e2e-runbook-parcours-critiques-2026-05-18.md` | ScÃƒÂ©narios manuels | Runbook QA actif |
| `p1-kpi-pilotage-partage-2026-05-18.md` | DÃƒÂ©finitions KPI initiales | RÃƒÂ©fÃƒÂ©rence Data ÃƒÂ  enrichir |
| `plan-implementation-profils-utilisateurs-tickets-2026-06-19.md` | DÃƒÂ©coupage technique profils | Backlog spÃƒÂ©cialisÃƒÂ© |
| `premium-ux-ui-platform-blueprint.md` | Vision cockpit premium | RÃƒÂ©fÃƒÂ©rence UX spÃƒÂ©cialisÃƒÂ©e |
| `pricing-grid-business-spec.md` | Calcul et fallback tarifaire | SpÃƒÂ©cification mÃƒÂ©tier active |
| `prompt-13-module-voyageurs-sejours-2026-07-12.md` | Bilan module sÃƒÂ©jours | Archive de livraison + limites |
| `qa-checklist-p0-profils-2026-05-18.md` | Preuves QA par rÃƒÂ´le | Checklist d'exÃƒÂ©cution annexe |
| `reprise-profils-owner-preferences-2026-06-19.md` | Ãƒâ€°tat de reprise owner | Archive de chantier |
| `responsive-a11y-dashboard-checklist-2026-05-25.md` | CritÃƒÂ¨res responsive/a11y | Checklist QA active |
| `spec-cible-profils-personas-2026-06-19.md` | Cible dÃƒÂ©taillÃƒÂ©e des profils | SpÃƒÂ©cification produit active |
| `sprint-1-audit-complet-planetls-2026-07-07.md` | Cartographie architecture | Archive d'audit, conventions conservÃƒÂ©es |
| `ui-harmonization-audit.md` | Tokens et rÃƒÂ¨gles UI | RÃƒÂ©fÃƒÂ©rence UI spÃƒÂ©cialisÃƒÂ©e |
| `ux-onboarding-audit-reprise-2026-04-29.md` | Ãƒâ€°tat du tunnel en avril | Archive historique |

---

## 12. Maintenance continue

### Tableau de suivi ÃƒÂ  mettre ÃƒÂ  jour aprÃƒÂ¨s chaque ÃƒÂ©volution importante

Ce tableau est le registre de maintenance courant. La photographie dÃƒÂ©taillÃƒÂ©e de la section 3 reste l'inventaire initial ; toute ÃƒÂ©volution ultÃƒÂ©rieure doit ÃƒÂªtre enregistrÃƒÂ©e ici avec une preuve courte et une prochaine action.

Pour les evolutions importantes touchant offre, marche, revenus, couts, IA, architecture ou segmentation, la mise a jour doit aussi indiquer si un `Business Impact Check` a ete realise et quelles sections du Business Plan sont potentiellement `A actualiser` ou `A valider`.

| Domaine | FonctionnalitÃƒÂ© | Profil concernÃƒÂ© | Statut | PrioritÃƒÂ© | DerniÃƒÂ¨re ÃƒÂ©volution | Preuves dans le code | Prochaine action |
|---|---|---|---|---|---|---|---|
| QualitÃƒÂ© | Baseline tests, lint, build et snapshot | Tous | Ã¢Å“â€¦ TerminÃƒÂ© | P0 Critique | 2026-07-19 | 202/202 tests, ESLint ciblÃƒÂ©, build Next.js 168 pages, snapshot UI portable | Maintenir la baseline |
| Maintenance | AllÃƒÂ¨gement du code et des dÃƒÂ©pendances mortes | Tous | Ã¢Å“â€¦ TerminÃƒÂ© | P2 Important | 2026-07-19 | 10 dÃƒÂ©pendances directes inutilisÃƒÂ©es retirÃƒÂ©es (36 paquets transitifs), 2 composants TSX et 2 fichiers de support sans consommateur supprimÃƒÂ©s ; 193/193 tests, lint et build 168 pages | Poursuivre par petits lots prouvÃƒÂ©s, sans supprimer les compatibilitÃƒÂ©s legacy encore actives |
| QualitÃƒÂ© | Smoke E2E des espaces critiques | Owner, concierge, provider | Ã¢Å“â€¦ TerminÃƒÂ© | P0 Critique | 2026-07-18 | Playwright Chromium : 3/3 PASS ; workflow GitHub contrÃƒÂ´le secrets, tests, lint, build puis tous les E2E | Configurer les secrets GitHub et lancer la premiÃƒÂ¨re exÃƒÂ©cution distante |
| QualitÃƒÂ© | E2E transactionnel commercial | Owner, concierge | Ã¢ÂÂ¸Ã¯Â¸Â ReportÃƒÂ© | P0 Critique | 2026-08-02 | Parcours mÃƒÂ©tier et webhook signÃƒÂ© 1/1 PASS ; branche Checkout Stripe hÃƒÂ©bergÃƒÂ©e prÃƒÂªte avec garde sk_test_, carte de test, retour facture et synchronisation ; clÃƒÂ© de test indisponible pour le moment | Reprendre le scÃƒÂ©nario Checkout dÃƒÂ¨s qu'une E2E_STRIPE_SECRET_KEY de test sera disponible ; ne pas le proposer comme prochaine meilleure action d'ici lÃƒÂ  |
| QualitÃƒÂ© | E2E transactionnel provider | Concierge, provider | Ã¢Å“â€¦ TerminÃƒÂ© | P0 Critique | 2026-07-18 | Mission, intervention, preuve mÃƒÂ©dia privÃƒÂ©e, clÃƒÂ´ture et facture liÃƒÂ©e de 90 Ã¢â€šÂ¬, 1/1 PASS | Configurer Stripe test et valider le paiement |
| Outils mÃƒÂ©tier | Assistant dÃƒÂ©coration | Concierge, propriÃƒÂ©taire | Partiel | P2 Important | 2026-07-18 | page `/dashboard/concierge/decoration-ai`, API dÃƒÂ©diÃƒÂ©e, `decorationAssistant.ts`, migration `decoration_ai_reports`, tests | Valider l'usage terrain, tracer l'envoi owner et brancher une gÃƒÂ©nÃƒÂ©ration d'image rÃƒÂ©elle |
| Maintenance | Incidents persistants | Concierge, owner, provider | Partiel | P0 Critique | 2026-07-19 | incidents+mÃƒÂ©dias/RLS, API GET/POST/PATCH, cycle, affectation, upload privÃƒÂ© et liens signÃƒÂ©s, contrat 6/6 PASS | Appliquer les migrations puis valider le parcours E2E persistant |
| Data | Activation et funnel par rÃƒÂ´le | Admin, direction | Ã¢Å“â€¦ TerminÃƒÂ© | P0 Critique | 2026-07-19 | API connectÃƒÂ©e et cockpit validÃƒÂ©s : taux/volumes par rÃƒÂ´le, 4 groupes, zones, seuils visibles, faible ÃƒÂ©chantillon, baisse et actions ciblÃƒÂ©es ; repli contact_messages si messages absent ; contrat 5/5, Playwright 1/1, suite 195/195 et build 168 pages | Surveiller les groupes et recalibrer les seuils lorsque le volume rÃƒÂ©el devient statistiquement reprÃƒÂ©sentatif |
| Profils | IdentitÃƒÂ© professionnelle artisan | Provider/artisan | Partiel | P0 Critique | 2026-07-19 | Profil mÃƒÂ©tier persistant ; justificatifs privÃƒÂ©s PDF/images et SHA-256 ; dÃƒÂ©cision admin tracÃƒÂ©e avec motif de rejet ; annuaire de dispatch limitÃƒÂ© aux compteurs/types vÃƒÂ©rifiÃƒÂ©s actifs, sans donnÃƒÂ©e fichier ; contrat 4/4, 192/192 tests, lint et build 168 pages | Appliquer la migration distante, valider le cycle upload Ã¢â€ â€™ dÃƒÂ©cision Ã¢â€ â€™ signal sur donnÃƒÂ©es connectÃƒÂ©es, puis concevoir la fiche publique artisan dÃƒÂ©taillÃƒÂ©e |
| Ãƒâ€°quipe | Cycle de vie des membres concierge | Concierge, admin | Ã¢Å“â€¦ TerminÃƒÂ© | P0 Critique | 2026-07-19 | Migration/RLS disponible sur la base connectÃƒÂ©e ; API GET/POST/PATCH/DELETE, scoping concierge/admin, UI crÃƒÂ©ation/disponibilitÃƒÂ©/dÃƒÂ©sactivation ; contrat 3/3, Playwright connectÃƒÂ© 1/1, suite 201/201 et build 168 pages | Surveiller lÃ¢â‚¬â„¢usage terrain et ajouter lÃ¢â‚¬â„¢historique dÃƒÂ©taillÃƒÂ© seulement si le besoin est confirmÃƒÂ© |
| Pilotage | Maintenance automatique du Master Plan | Ãƒâ€°quipe projet | Ã¢Å“â€¦ TerminÃƒÂ© | P0 Critique | 2026-07-29 | `AGENTS.md`, prÃƒÂ©sente section, journal Developer + Mission Control + Roadmap intelligente + MÃƒÂ©moire technique synchronisÃƒÂ©s avec le Master Plan, Git et lÃ¢â‚¬â„¢environnement ; dÃƒÂ©doublonnage de la vue dÃƒÂ©veloppement en retirant le planning parallÃƒÂ¨le ; la vue ajoute maintenant un `Conseiller projet` avec rÃƒÂ©ponses calculÃƒÂ©es sur prochaine fonctionnalitÃƒÂ© rentable, blocages, composants sous-utilisÃƒÂ©s, modules terminÃƒÂ©s, dÃƒÂ©rives design system, pages proches production, gros fichiers et manques de tests ; `224/224` tests et build Next PASS le mercredi 29 juillet 2026 | Observer lÃ¢â‚¬â„¢usage rÃƒÂ©el du conseiller puis dÃƒÂ©cider sÃ¢â‚¬â„¢il faut une persistance serveur, des questions personnalisables ou un branchement LLM temps rÃƒÂ©el |
| Administration | Centre de santÃƒÂ© opÃƒÂ©rationnelle | Admin | Ã¢Å“â€¦ TerminÃƒÂ© | P0 Critique | 2026-07-29 | Ãƒâ€°tat global sur 12 sources, sources non vÃƒÂ©rifiables explicites et cycle persistant : prise en charge, transmission au responsable et clÃƒÂ´ture avec compte rendu, sans masquer l'anomalie ; la page `/dashboard/admin/controle` suit dÃƒÂ©sormais le mÃƒÂªme niveau premium que le cockpit principal : hero santÃƒÂ© ÃƒÂ©ditorial, cartes de synthÃƒÂ¨se, onglets plus dÃƒÂ©cisionnels, surfaces de pilotage plus lisibles et cartes dÃƒÂ©taillÃƒÂ©es toujours compatibles avec la prise en charge persistÃƒÂ©e ; la route `/api/admin/control-tower` tolÃƒÂ¨re dÃƒÂ©sormais l'indisponibilitÃƒÂ© transport de Supabase via un mode dÃƒÂ©gradÃƒÂ© traÃƒÂ§able, garde 12 sources lisibles, injecte une anomalie de repli si tout le diagnostic distant est hors ligne et persiste localement les actions admin pour ne plus renvoyer `500` dans cet environnement ; la page `/dashboard/admin` passe en phase 8 avec un `Mission Control` premium branchÃƒÂ© sur les donnÃƒÂ©es rÃƒÂ©elles : hero ÃƒÂ©ditorial `data story`, bandeau de synthÃƒÂ¨se, filtre 7/30/90 jours, filtre segment, KPIs de volume et complÃƒÂ©tude, liste de prioritÃƒÂ©s actionnables, activitÃƒÂ© rÃƒÂ©cente, tables compactes utilisateurs/demandes/missions, deux graphiques alimentÃƒÂ©s par `activation_series` et `activation_by_zone`, deux donuts visuels pour la rÃƒÂ©partition des rÃƒÂ´les et les feux de contrÃƒÂ´le, trois cartes de santÃƒÂ© premium dÃƒÂ©diÃƒÂ©es ÃƒÂ  `Inscriptions`, `Missions` et `Messages`, skeleton de chargement, ÃƒÂ©tats vides explicites, relance dÃ¢â‚¬â„¢erreur locale, focus visible clavier et tableaux mobiles plus lisibles grÃƒÂ¢ce aux libellÃƒÂ©s de colonnes et `caption/scope` ; les libellÃƒÂ©s ambigus `n/a` sont remplacÃƒÂ©s par `DonnÃƒÂ©e insuffisante` ou `Non disponible` selon le contexte ; le shell `DashboardLayout` peut dÃƒÂ©sormais masquer ses blocs secondaires pour laisser chaque cockpit composer sa surface ; la page reste aussi exploitable en mode dÃƒÂ©gradÃƒÂ© quand les endpoints admin connectÃƒÂ©s sont indisponibles et affiche alors un bandeau explicite plutÃƒÂ´t quÃ¢â‚¬â„¢un ÃƒÂ©cran vide ; `/api/admin/overview`, `/api/admin/operations` et `/api/kpis/overview` renvoient dÃƒÂ©sormais un `health` explicite avec raisons et sources indisponibles au lieu de tomber en `500` lors dÃ¢â‚¬â„¢une coupure Supabase ; en local avec `WORKSPACE_QUICK_LOGIN_ENABLED=true`, `/api/kpis/overview` injecte des cohortes workspace dÃƒÂ©terministes, mais la base connectÃƒÂ©e peut dÃƒÂ©sormais aussi ÃƒÂªtre semÃƒÂ©e pour de vrai via `npm run seed:admin:kpis` ; lÃ¢â‚¬â„¢endpoint KPI retombe sur des sÃƒÂ©lections compatibles sans `provider_profile_id` et calcule lÃ¢â‚¬â„¢activation provider via `provider_interventions` quand la base distante nÃ¢â‚¬â„¢expose pas encore la relation provider sur `missions`, `quotes` ou `invoices` ; lÃ¢â‚¬â„¢admin lit aussi dÃƒÂ©sormais les missions distantes sans dÃƒÂ©pendre de `missions.title` : `control-tower` retente une sÃƒÂ©lection compatible et reconstruit un libellÃƒÂ© via `metadata`, `operations` affiche le mÃƒÂªme fallback de titre ; le correctif structurel est maintenant prÃƒÂªt : `docs/sql/2026-07-29-align-remote-missions-schema.sql` ajoute et backfill `title`, `request_id` et `provider_profile_id`, avec note d'application dÃƒÂ©diÃƒÂ©e ; vÃƒÂ©rifications : `npm run build` PASS le mercredi 29 juillet 2026, `npm run inspect:remote:admin-schema` PASS avec diagnostic prÃƒÂ©cis du schÃƒÂ©ma REST distant, exÃƒÂ©cution distante `npm run seed:admin:kpis` PASS avec 18 profils seedÃƒÂ©s et 6 lots opÃƒÂ©rationnels persistÃƒÂ©s ; limite connue : la base distante nÃ¢â‚¬â„¢expose toujours pas `missions.title`, `missions.request_id` ni `missions.provider_profile_id` tant que le SQL dÃ¢â‚¬â„¢alignement nÃ¢â‚¬â„¢a pas ÃƒÂ©tÃƒÂ© exÃƒÂ©cutÃƒÂ© sur Supabase, donc le dataset connectÃƒÂ© reste partiellement basÃƒÂ© sur `provider_interventions`, devis, factures, onboarding et messages pour la lecture provider | ExÃƒÂ©cuter le SQL de rÃƒÂ©alignement sur la base Supabase distante, relancer `npm run inspect:remote:admin-schema`, puis rÃƒÂ©duire progressivement les compatibilitÃƒÂ©s transitoires |

| Authentification | Acces rapide aux espaces de travail | Owner, concierge, provider, admin | Ã¢Å“â€¦ TerminÃƒÂ© | P1 Prioritaire | 2026-07-19 | `/login` propose les quatre comptes Supabase de travail et preremplit email/mot de passe ; selection directe par `workspace=` ; route strictement locale et hors production | Conserver les secrets uniquement dans `.env.local` et valider periodiquement les quatre comptes |

- **Vue de dÃƒÂ©veloppement du Master Plan** Ã¢â‚¬â€ `Ã¢Å“â€¦ TerminÃƒÂ©`, `P1 Prioritaire` au 2026-07-27. Preuve : route admin sÃƒÂ©curisÃƒÂ©e `/dashboard/admin/developpement`, lecture serveur du fichier, synthÃƒÂ¨se, recherche, filtres statut/prioritÃƒÂ©, sommaire, journal de bord, Mission Control, MÃƒÂ©moire technique, Roadmap intelligente, gÃƒÂ©nÃƒÂ©ration automatique depuis Git + registre de maintenance, saisie manuelle locale, favoris, commentaires et tests dÃƒÂ©diÃƒÂ©s. La page a ÃƒÂ©tÃƒÂ© resserrÃƒÂ©e pour ÃƒÂ©viter les doublons entre pilotage quotidien et sÃƒÂ©quencement produit. Prochaine action : observer lÃ¢â‚¬â„¢usage rÃƒÂ©el avant dÃ¢â‚¬â„¢ajouter une persistance serveur ou des connecteurs live.
  - Conseiller projet : la vue `/dashboard/admin/developpement` embarque dÃƒÂ©sormais un bloc `Conseiller projet` qui ne se comporte pas comme un simple chat, mais comme un coach technique ÃƒÂ  questions fixes. Il calcule ses rÃƒÂ©ponses ÃƒÂ  partir du Master Plan, de Mission Control, de la roadmap, de la mÃƒÂ©moire technique et de scans repo cÃƒÂ´tÃƒÂ© serveur `taille de fichiers, imports UI, pages testÃƒÂ©es, signaux de dÃƒÂ©rive design system`, avec affichage explicite du niveau de confiance `Factuel / CroisÃƒÂ© / Heuristique`. Preuves : `projectAdvisor.ts`, enrichissement serveur `page.tsx`, rendu `MasterPlanViewer.tsx`, styles `page.module.scss`, test `project-advisor.test.mts`, suite `224/224 PASS`, `npm run build` PASS le mercredi 29 juillet 2026. Limite : il nÃ¢â‚¬â„¢interprÃƒÂ¨te pas encore les diffs ligne ÃƒÂ  ligne, les tickets externes ni les mÃƒÂ©triques dÃ¢â‚¬â„¢usage rÃƒÂ©elles, et ses audits de design system / sous-utilisation restent volontairement heuristiques.
  - AccÃƒÂ¨s au rÃƒÂ©fÃƒÂ©rentiel UI : lÃ¢â‚¬â„¢en-tÃƒÂªte de `/dashboard/admin/developpement` propose dÃƒÂ©sormais une navigation dÃ¢â‚¬â„¢espace compacte entre le `Pilotage` courant et la page `/design-system`, afin de retrouver le rÃƒÂ©fÃƒÂ©rentiel visuel en un clic sans lÃ¢â‚¬â„¢imbriquer dans le cockpit dÃƒÂ©jÃƒÂ  dense. Statut : `Termine`. PrioritÃƒÂ© : `P3 Confort`. Preuves : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`. VÃƒÂ©rification restante : contrÃƒÂ´le visuel desktop/mobile authentifiÃƒÂ©.
  - RÃƒÂ©fÃƒÂ©rentiel Personas : le socle de donnÃƒÂ©es personas et l'atelier d'ÃƒÂ©dition locale ont d'abord ÃƒÂ©tÃƒÂ© construits sous `/dashboard/admin/developpement/personas`, avec huit profils cibles, portraits `public/avatars`, contexte, objectifs, frustrations, premiÃƒÂ¨re valeur, fonctionnalitÃƒÂ©s prioritaires, parcours, critÃƒÂ¨res de confiance, appareil, niveau numÃƒÂ©rique, source et statut de validation. Les changements restent versionnÃƒÂ©s dans le `localStorage` via `PersonaCard`, `PersonaEditorModal`, `usePersonasStorage` et `PersonasWorkspace`, avec restauration individuelle ou globale. La clÃƒÂ© et le schÃƒÂ©ma `planetls:product-personas:v1` sont conservÃƒÂ©s pour ne pas perdre les informations dÃƒÂ©jÃƒÂ  modifiÃƒÂ©es. Statut : `Partiel`, car un persona est validÃƒÂ© par lÃ¢â‚¬â„¢usage et sept restent ÃƒÂ  confronter au terrain. PrioritÃƒÂ© : `P2 Important`. Preuves : `src/app/dashboard/admin/developpement/personas/`, `src/components/development/DevelopmentSectionNav.tsx`. Limite : les prÃƒÂ©cisions locales ne sont ni partagÃƒÂ©es entre appareils ni persistÃƒÂ©es en base. Prochaine action : conduire des entretiens avec propriÃƒÂ©taires, conciergeries, ÃƒÂ©quipes et prestataires, puis dÃƒÂ©cider si une persistance Supabase administrateur est nÃƒÂ©cessaire.
  - Validation navigateur : Playwright Chromium `1/1 PASS` sur connexion admin, lecture desktop, recherche, remise ÃƒÂ  zÃƒÂ©ro, filtre P0 et viewport mobile 390 px. Limite : inspection visuelle automatisÃƒÂ©e de la capture indisponible ÃƒÂ  cause du sandbox Windows.
  - Ãƒâ€°volution de lecture : cartes cliquables pour chaque statut et prioritÃƒÂ©, ÃƒÂ©tat actif accessible avec `aria-pressed`, synchronisation avec les listes de filtres et adaptation mobile. Preuves : parseur `2/2 PASS`, ESLint ciblÃƒÂ© et Playwright `1/1 PASS`.
  - Navigation de dÃƒÂ©blocage : dans `Mission Control`, la carte `BloquÃƒÂ©es` ouvre dÃƒÂ©sormais automatiquement `Sommaire et dÃƒÂ©tail du Master Plan`, applique le filtre `Ã¢Å¡Â Ã¯Â¸Â BloquÃƒÂ©` et scrolle vers le premier blocage visible, pour ÃƒÂ©viter une recherche manuelle dans la page de dÃƒÂ©veloppement. Preuves : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `page.module.scss`, `src/tests/mission-control.test.mts` `1/1 PASS`, `npm run build` PASS le mercredi 29 juillet 2026.
  - Refonte cockpit premium : la page `/dashboard/admin/developpement` adopte dÃƒÂ©sormais une vraie structure de pilotage haut de gamme avec hero exÃƒÂ©cutif compact, rÃƒÂ©sumÃƒÂ© du projet, mÃƒÂ©triques de maÃƒÂ®trise, prochaine meilleure action, dÃƒÂ©pendances dominantes, signaux rÃƒÂ©cents, actions prioritaires, puis sections recontextualisÃƒÂ©es `Vue d'exÃƒÂ©cution`, `DÃƒÂ©cisions canoniques`, `Roadmap dynamique`, `DÃƒÂ©cisions et activitÃƒÂ©` et `Sommaire et dÃƒÂ©tail du Master Plan`. Le fond mÃƒÂ©tier est conservÃƒÂ© mais prÃƒÂ©sentÃƒÂ© comme un dashboard produit interne plutÃƒÂ´t qu'une documentation ÃƒÂ©tendue. Preuves : `MasterPlanViewer.tsx`, `page.module.scss`, `src/tests/mission-control.test.mts` `1/1 PASS`, `npm run build` PASS le mercredi 29 juillet 2026.
  - Variante `product cockpit` orientÃƒÂ©e alertes : le hero de `/dashboard/admin/developpement` lit maintenant d'abord la tension opÃƒÂ©rationnelle avec score sur 100, jauge de pression, colonne de tension dÃƒÂ©diÃƒÂ©e, alertes hiÃƒÂ©rarchisÃƒÂ©es, release readiness et lien direct vers le blocage prioritaire. La page donne une lecture plus immÃƒÂ©diate de ce qui chauffe, de ce qui bloque et de ce qui demande un arbitrage avant de descendre dans les dÃƒÂ©tails de roadmap et de journal. Preuves : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `src/tests/mission-control.test.mts` `1/1 PASS`, `npm run build` PASS le mercredi 29 juillet 2026.
  - AllÃƒÂ¨gement de la page complÃƒÂ¨te : la lecture a ÃƒÂ©tÃƒÂ© rÃƒÂ©ordonnÃƒÂ©e pour faire remonter `Roadmap intelligente` juste aprÃƒÂ¨s le hero, laisser `Mission Control` en poste de surveillance dÃƒÂ©taillÃƒÂ©e et supprimer les redondances visuelles de progression, mÃƒÂ©triques, objectifs et signaux dÃƒÂ©jÃƒÂ  prÃƒÂ©sents en tÃƒÂªte de page. La surface est plus dense en information utile dÃƒÂ¨s l'ouverture, tout en gardant les donnÃƒÂ©es mÃƒÂ©tier existantes intactes. Preuves : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `src/tests/mission-control.test.mts` `1/1 PASS`, `npm run build` PASS le mercredi 29 juillet 2026.
  - Tension plus live : la colonne de tension intÃƒÂ¨gre maintenant aussi un signal de fraÃƒÂ®cheur dÃ¢â‚¬â„¢exÃƒÂ©cution basÃƒÂ© sur le dernier repÃƒÂ¨re Git disponible et le volume hebdomadaire estimÃƒÂ©, afin de distinguer un cockpit rÃƒÂ©ellement actif dÃ¢â‚¬â„¢un cockpit sans mouvement rÃƒÂ©cent mÃƒÂªme quand les autres alertes restent stables. Preuves : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/tests/mission-control.test.mts` `1/1 PASS`, `npm run build` PASS le mercredi 29 juillet 2026.
  - Correction desktop du cockpit admin : la zone `ActivitÃƒÂ© rÃƒÂ©cente` de `/dashboard/admin` ne doit plus chevaucher `PrioritÃƒÂ©s immÃƒÂ©diates` sur grand ÃƒÂ©cran. La grille principale, les panneaux et les cartes dÃ¢â‚¬â„¢activitÃƒÂ©/prioritÃƒÂ© imposent dÃƒÂ©sormais mieux leurs largeurs minimales, leur comportement de flex et le retour ÃƒÂ  la ligne des contenus longs. Preuves : `src/app/dashboard/admin/AdminDashboard.module.scss`, `npm run build` PASS le mercredi 29 juillet 2026.
  - Repli interne des ÃƒÂ©lÃƒÂ©ments longs : la timeline du `Journal de bord` dans `/dashboard/admin/developpement` ajoute maintenant un bouton ÃƒÂ  chevron `Voir l'entrÃƒÂ©e complÃƒÂ¨te / Replier l'entrÃƒÂ©e` directement dans chaque carte, afin de garder une lecture scannable avant dÃ¢â‚¬â„¢ouvrir les dÃƒÂ©tails, audits, liens et commentaires. Preuves : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `src/tests/mission-control.test.mts` `1/1 PASS`, `npm run build` PASS le mercredi 29 juillet 2026.
  - Repli ÃƒÂ©ditorial gÃƒÂ©nÃƒÂ©ralisÃƒÂ© et colonne dÃ¢â‚¬â„¢outils : la page `/dashboard/admin/developpement` permet maintenant dÃ¢â‚¬â„¢ouvrir ou refermer depuis leur en-tÃƒÂªte les blocs `PrioritÃƒÂ©s immÃƒÂ©diates`, `DÃƒÂ©pendances et blocages`, `Signaux rÃƒÂ©cents`, `Colonne de tension`, les cartes de `MÃƒÂ©moire technique`, les colonnes de la `Roadmap intelligente`, les `RÃƒÂ©sumÃƒÂ©s quotidiens` et les entrÃƒÂ©es de timeline du `Journal de bord`. Les contrÃƒÂ´les `Rechercher une dÃƒÂ©cision...` et les filtres du journal passent dans une colonne latÃƒÂ©rale droite plus discrÃƒÂ¨te en desktop, tandis que la saisie `EntrÃƒÂ©e manuelle` se fait dÃƒÂ©sormais via une modale dÃƒÂ©diÃƒÂ©e pour allÃƒÂ©ger la page. La carte `Environnement actuel` est aussi recentrÃƒÂ©e visuellement sur grand ÃƒÂ©cran. Preuves : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `src/tests/mission-control.test.mts` `1/1 PASS`, `npm run build` PASS le mercredi 29 juillet 2026.
  - RÃƒÂ©sumÃƒÂ© quotidien relÃƒÂ©guÃƒÂ© en rail de contexte : dans le `Journal de bord` de `/dashboard/admin/developpement`, les `RÃƒÂ©sumÃƒÂ©s quotidiens` ne sÃ¢â‚¬â„¢ÃƒÂ©talent plus au-dessus de la timeline. Ils vivent dÃƒÂ©sormais dans la colonne droite comme un rail secondaire sticky sur desktop, avec cartes plus compactes et retour sous le flux principal en mobile, afin de prÃƒÂ©server la lecture de la timeline quand la page est dÃƒÂ©jÃƒÂ  dense. Preuves : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `npm run build` PASS le mercredi 29 juillet 2026.
  - CohÃƒÂ©rence filtre/compteur du Master Plan : les compteurs de statuts et prioritÃƒÂ©s de `/dashboard/admin/developpement` sont dÃƒÂ©sormais calculÃƒÂ©s sur les sections rÃƒÂ©ellement filtrables du Master Plan, et non plus sur de simples occurrences textuelles dans tout le markdown. Le filtre `Ã¢Å¡Â Ã¯Â¸Â BloquÃƒÂ© (3)` doit donc maintenant correspondre aux `3` sections affichÃƒÂ©es. Preuves : `src/app/dashboard/admin/developpement/masterPlan.ts`, `src/tests/mission-control.test.mts` `1/1 PASS`, `npm run build` PASS le mercredi 29 juillet 2026.
  - Navigation longue : sections repliables individuellement, commandes Tout replier/Tout dÃƒÂ©plier, compteur de sections ouvertes, chevrons et ÃƒÂ©tats `aria-expanded`/`aria-controls`. Preuves : ESLint ciblÃƒÂ©, parseur `2/2 PASS` et Playwright Chromium `1/1 PASS` desktop/mobile.
  - Robustesse des panneaux repliÃƒÂ©s : les en-tÃƒÂªtes repliÃƒÂ©s restent lisibles comme vrais titres accessibles sans dupliquer les `heading` quand le contenu est dÃƒÂ©jÃƒÂ  ouvert. La spec Playwright a ÃƒÂ©tÃƒÂ© rÃƒÂ©alignÃƒÂ©e sur le comportement attendu des panneaux `MÃƒÂ©moire technique` et `Sommaire et dÃƒÂ©tail du Master Plan` en ouvrant explicitement les contenus internes avant d'assert leurs filtres et leur navigation. Preuves : `MasterPlanViewer.tsx`, `page.module.scss`, `e2e/admin-development.spec.ts`, Playwright Chromium `1/1 PASS`.
  - DÃƒÂ©doublonnage du pilotage : le bloc `Planning opÃƒÂ©rationnel` a ÃƒÂ©tÃƒÂ© retirÃƒÂ© pour ÃƒÂ©viter une seconde lecture du mÃƒÂªme sÃƒÂ©quencement que la `Roadmap intelligente`. La roadmap reste lÃ¢â‚¬â„¢unique vue de priorisation dynamique ; la synthÃƒÂ¨se du Master Plan conserve uniquement les mÃƒÂ©triques documentaires utiles. Preuves : vue `MasterPlanViewer.tsx`, spec `e2e/admin-development.spec.ts`, lint et build ÃƒÂ  revalider aprÃƒÂ¨s simplification.
  - AllÃƒÂ¨gement de lecture : `Mission Control`, `MÃƒÂ©moire technique`, `Roadmap intelligente`, `Journal de bord`, puis le bloc `Sommaire et dÃƒÂ©tail du Master Plan` disposent maintenant de flÃƒÂ¨ches de repli avec rÃƒÂ©sumÃƒÂ© compact afin de rÃƒÂ©duire la charge visuelle sans retirer dÃ¢â‚¬â„¢information. Les espacements, contrastes et ÃƒÂ©tats fermÃƒÂ©s ont ÃƒÂ©tÃƒÂ© harmonisÃƒÂ©s pour une lecture plus calme sur desktop comme mobile. Preuves : `MasterPlanViewer.tsx`, `page.module.scss`, `npm run lint` PASS.
  - Stabilisation E2E locale : la route `/api/auth/dev-workspace-login` ne renvoie plus `500` quand la prÃƒÂ©paration distante Supabase ÃƒÂ©choue ; elle retourne dÃƒÂ©sormais un workspace local de repli. `NextAuth` accepte aussi un fallback strictement local pour ces workspaces de dÃƒÂ©veloppement lorsque `WORKSPACE_QUICK_LOGIN_ENABLED=true` et que Supabase Auth est inaccessible, ce qui rÃƒÂ©tablit la chaÃƒÂ®ne `/login -> /dashboard/admin` en environnement sandbox. Preuves : `src/app/api/auth/dev-workspace-login/route.ts`, `src/server/auth/devWorkspace.ts`, `src/server/auth/authOptions.ts`, Playwright Chromium `1/1 PASS` sur `e2e/admin-development.spec.ts`. Limite restante : la santÃƒÂ© Supabase connectÃƒÂ©e reste en `danger` dans Mission Control tant que cet environnement sandbox ne peut pas joindre Supabase Auth ÃƒÂ  distance.
  - HiÃƒÂ©rarchie documentaire : les titres parents H2 sans texte direct affichent dÃƒÂ©sormais un index explicite et cliquable de leurs sous-sections H3 au lieu dÃ¢â‚¬â„¢une carte visuellement vide. Validation : `1. Vision du projet` expose notamment Mission, Ambition, Valeurs et Objectifs ; Playwright desktop/mobile `1/1 PASS`, lint et build 168 pages.
  - Journal de bord du dÃƒÂ©veloppeur : timeline verticale Art DÃƒÂ©co lÃƒÂ©gÃƒÂ¨re avec couleurs par catÃƒÂ©gorie, filtres `Aujourd'hui`, `Cette semaine`, `Ce mois`, fonctionnalitÃƒÂ©, prioritÃƒÂ© et auteur, recherche instantanÃƒÂ©e, favoris, commentaires et formulaire manuel. Preuves : helper `developerLog.ts`, vue `MasterPlanViewer.tsx`, test `developer-log.test.mts`, suite `203/203 PASS`, ESLint ciblÃƒÂ© `PASS`, build Next `PASS`.
  - Journal automatique Codex : aprÃƒÂ¨s chaque lot local significatif, une entrÃƒÂ©e `Codex` est dÃƒÂ©sormais gÃƒÂ©nÃƒÂ©rÃƒÂ©e automatiquement depuis les fichiers modifiÃƒÂ©s du workspace, avec rÃƒÂ©sumÃƒÂ© des changements, raisons, fichiers touchÃƒÂ©s, impacts transverses, mises ÃƒÂ  jour de roadmap, dÃƒÂ©pendances, tÃƒÂ¢ches restantes, rÃƒÂ©gressions potentielles et rÃƒÂ©sumÃƒÂ© quotidien agrÃƒÂ©gÃƒÂ©. Preuves : `developerLog.ts`, `page.tsx`, `MasterPlanViewer.tsx`, test `developer-log.test.mts` `PASS`, Playwright Chromium `1/1 PASS`. Limite : la documentation reste dÃƒÂ©duite heuristiquement depuis Git, le Master Plan et les zones de code modifiÃƒÂ©es ; elle n'interprÃƒÂ¨te pas encore les diffs ligne par ligne ni les PR distantes.
  - Mission Control dÃƒÂ©veloppeur : cockpit premium de lecture rapide avec progression globale, charge hebdomadaire estimÃƒÂ©e, objectifs, derniÃƒÂ¨re sauvegarde, dÃƒÂ©cisions/commits rÃƒÂ©cents et santÃƒÂ© Supabase/Vercel/GitHub. Preuves : helper `missionControl.ts`, intÃƒÂ©gration serveur `page.tsx`, vue `MasterPlanViewer.tsx`, test `mission-control.test.mts`, suite `204/204 PASS`, ESLint ciblÃƒÂ© `PASS`, build Next `PASS`.
  - MÃƒÂ©moire technique : base de connaissances interne avec dÃƒÂ©cisions canoniques de stack/architecture/workflow et dÃƒÂ©cisions extraites du Master Plan, filtres catÃƒÂ©gorie/tag et recherche instantanÃƒÂ©e Ã¢â‚¬Å“Pourquoi Supabase, Next.js, VercelÃ¢â‚¬Â¦Ã¢â‚¬Â. Preuves : helper `technicalMemory.ts`, intÃƒÂ©gration serveur `page.tsx`, vue `MasterPlanViewer.tsx`, test `technical-memory.test.mts`, suite `206/206 PASS`, ESLint ciblÃƒÂ© `PASS`, build Next `PASS`. VÃƒÂ©rification navigateur : spec `e2e/admin-development.spec.ts` enrichie, mais exÃƒÂ©cution locale actuellement bloquÃƒÂ©e par la route `/api/auth/dev-workspace-login` qui ne prÃƒÂ©pare pas le compte workspace dans cet environnement.
  - Centre de dÃƒÂ©cisions : nouvelle page admin `/dashboard/admin/decisions-architecture` dÃƒÂ©diÃƒÂ©e aux arbitrages d'architecture, avec moteur de recherche, filtres par catÃƒÂ©gorie/tag, fiches complÃƒÂ¨tes `contexte / problÃƒÂ¨me / options / avantages / inconvÃƒÂ©nients / choix / justification / consÃƒÂ©quences / date / auteur` et affichage des dÃƒÂ©cisions liÃƒÂ©es entre elles. Preuves : `decisions-architecture/architectureDecisions.ts`, `DecisionCenterPage.tsx`, `page.tsx`, test `architecture-decisions.test.mts` `PASS`, ESLint ciblÃƒÂ© `PASS`, build Next `PASS`. Limite : les dÃƒÂ©cisions dÃƒÂ©rivÃƒÂ©es du Master Plan restent enrichies heuristiquement tant qu'une persistance ADR dÃƒÂ©diÃƒÂ©e n'est pas branchÃƒÂ©e.
  - Roadmap intelligente : vue vivante en trois colonnes avec prioritÃƒÂ©s, difficultÃƒÂ©, dÃƒÂ©pendances, estimation, gains, dette technique, responsable, date prÃƒÂ©vue et recommandation automatique de la prochaine fonctionnalitÃƒÂ© logique ; les clÃƒÂ´tures locales recalculent immÃƒÂ©diatement la feuille de route. Preuves : helper `roadmap.ts`, intÃƒÂ©gration serveur `page.tsx`, vue `MasterPlanViewer.tsx`, test `roadmap.test.mts`, suite `205/205 PASS`, ESLint ciblÃƒÂ© `PASS`, build Next `PASS`. VÃƒÂ©rification navigateur : spec `e2e/admin-development.spec.ts` enrichie pour couvrir la roadmap, non exÃƒÂ©cutÃƒÂ©e localement car la commande `playwright` nÃ¢â‚¬â„¢est pas disponible dans ce shell Windows.

### Roadmap par phases permanentes

| Phase | PÃƒÂ©rimÃƒÂ¨tre | Ãƒâ€°tat de pilotage |
|---|---|---|
| Phase 1 Ã¢â‚¬â€ Socle fiable | Architecture, sÃƒÂ©curitÃƒÂ©, authentification, permissions, donnÃƒÂ©es, CI | En cours : E2E et gouvernance Supabase restent P0 |
| Phase 2 Ã¢â‚¬â€ Mise en relation | Profils, recherche, disponibilitÃƒÂ©s, zones, demandes, contacts | En cours : profil artisan et densitÃƒÂ© locale prioritaires |
| Phase 3 Ã¢â‚¬â€ Conversion en mission | Devis, contrat, mission, planning, rÃƒÂ¨glement | En cours : preuve E2E et consolidation paiement manquent |
| Phase 4 Ã¢â‚¬â€ FidÃƒÂ©lisation | Outils quotidiens, ÃƒÂ©quipe, maintenance, finance, assistant dÃƒÂ©coration | En cours : plusieurs modules sont N2 et doivent ÃƒÂªtre validÃƒÂ©s/persistÃƒÂ©s |
| Phase 5 Ã¢â‚¬â€ RÃƒÂ©seau professionnel | Fil, publications, carte, mur des missions, recommandations | Ãƒâ‚¬ faire aprÃƒÂ¨s preuve de liquiditÃƒÂ© locale |
| Phase 6 Ã¢â‚¬â€ DÃƒÂ©veloppement stratÃƒÂ©gique | IA rÃƒÂ©elle, intÃƒÂ©grations, reporting avancÃƒÂ©, modÃƒÂ¨les ÃƒÂ©conomiques | Ãƒâ€°volution future ; aucune industrialisation avant validation d'usage |

Note de trajectoire : le futur module privÃƒÂ© `Pilotage PlanetLS` pour la fondatrice rejoint dÃƒÂ©sormais la phase 6 comme chantier structurant ÃƒÂ  livrer par lots `budget, trÃƒÂ©sorerie, provisions, rÃƒÂ©serve, KPI SaaS, journal, dÃƒÂ©cisions, risques`, sans le confondre avec une comptabilitÃƒÂ© rÃƒÂ©glementaire.

### IdÃƒÂ©es et opportunitÃƒÂ©s Ã¢â‚¬â€ format obligatoire

Avant d'ajouter une idÃƒÂ©e, rechercher ses synonymes dans ce document. Ne pas l'implÃƒÂ©menter hors demande.

| IdÃƒÂ©e | ProblÃƒÂ¨me rÃƒÂ©solu | Utilisateurs concernÃƒÂ©s | Valeur attendue | Effort estimÃƒÂ© | Risques | PrioritÃƒÂ© proposÃƒÂ©e | Statut |
|---|---|---|---|---|---|---|---|
| GÃƒÂ©nÃƒÂ©ration visuelle avant/aprÃƒÂ¨s dÃƒÂ©coration | Le rapport actuel ne produit qu'un prompt texte | Concierge, propriÃƒÂ©taire | Projection et conversion plus fortes | Moyen | CoÃƒÂ»t, qualitÃƒÂ©, droits sur les photos, conservation des images | P3 Confort aprÃƒÂ¨s validation du rapport | Ãƒâ‚¬ ÃƒÂ©tudier |
| Programme d'impact solidaire local | La marque n'exprime pas encore de contribution sociale tangible malgrÃƒÂ© son ancrage terrain | PropriÃƒÂ©taire, concierge, artisan, administrateur, partenaires associatifs | DiffÃƒÂ©renciation ÃƒÂ©motionnelle, fidÃƒÂ©lisation, preuve d'utilitÃƒÂ© locale, meilleure narration de marque | Moyen ÃƒÂ  ÃƒÂ©levÃƒÂ© | Promesse marketing sans exÃƒÂ©cution, arbitrage juridique/fiscal, gouvernance des causes, besoin de traÃƒÂ§abilitÃƒÂ© publique | P3 Confort | Ãƒâ‚¬ ÃƒÂ©tudier |
| Pilotage PlanetLS Ã¢â‚¬â€ espace entrepreneurial et financier privÃƒÂ© fondatrice | L'admin pilote dÃƒÂ©jÃƒÂ  l'activitÃƒÂ© et les risques opÃƒÂ©rationnels, mais pas encore le budget prÃƒÂ©visionnel, la trÃƒÂ©sorerie, les provisions, la rÃƒÂ©serve, les KPI SaaS consolidÃƒÂ©s et le journal entrepreneurial dans un mÃƒÂªme espace protÃƒÂ©gÃƒÂ© | Fondatrice, administrateur principal | Vision claire de la santÃƒÂ© business, routine financiÃƒÂ¨re simple, arbitrages plus rapides, meilleure prÃƒÂ©paration juridique/fiscale et meilleur alignement entre produit, revenus et cash | Ãƒâ€°levÃƒÂ© | Risque de dÃƒÂ©river vers un faux logiciel comptable, taux fiscaux codÃƒÂ©s en dur, mÃƒÂ©triques approximatives prises pour des vÃƒÂ©ritÃƒÂ©s, duplication avec les journaux/dÃƒÂ©cisions admin existants, confidentialitÃƒÂ© des donnÃƒÂ©es | P1 Prioritaire | ValidÃƒÂ©e |
| RÃƒÂ©fÃƒÂ©rentiel IA PlanetLS et bibliothÃƒÂ¨que de prompts versionnÃƒÂ©e | Les idÃƒÂ©es et prompts IA restent dispersÃƒÂ©s entre conversations, piÃƒÂ¨ces jointes et documents isolÃƒÂ©s, donc difficiles ÃƒÂ  retrouver et ÃƒÂ  faire ÃƒÂ©voluer | Fondatrice, administrateur principal, dÃƒÂ©veloppeur | Retrouver vite les cadres IA utiles, rÃƒÂ©duire les rÃƒÂ©pÃƒÂ©titions, prÃƒÂ©parer un futur centre de prompts sans dupliquer les sources | Moyen | DÃƒÂ©rive documentaire sans gouvernance, duplication avec le Master Plan, tentation d'industrialiser trop tÃƒÂ´t l'interface | P2 Important | ValidÃƒÂ©e |

Statuts d'idÃƒÂ©e autorisÃƒÂ©s : `Ãƒâ‚¬ ÃƒÂ©tudier`, `ValidÃƒÂ©e`, `PlanifiÃƒÂ©e`, `En dÃƒÂ©veloppement`, `LivrÃƒÂ©e`, `RefusÃƒÂ©e`, `ReportÃƒÂ©e`.

### Pilotage business et financier Ã¢â‚¬â€ rÃƒÂ©flexion sur une offre Pro

Contexte au lundi 3 aoÃƒÂ»t 2026 : le cockpit entrepreneurial privÃƒÂ© sait dÃƒÂ©jÃƒÂ  comparer des stratÃƒÂ©gies et simuler des scÃƒÂ©narios, mais PlanetLS n'a pas encore figÃƒÂ© une offre Pro monÃƒÂ©tisable ÃƒÂ  brancher ensuite dans Stripe, dans le discours commercial et dans les KPI. L'objectif prioritaire n'est donc pas d'ajouter plus de simulation, mais de choisir une offre simple ÃƒÂ  vendre, lisible pour la cible et cohÃƒÂ©rente avec la maturitÃƒÂ© rÃƒÂ©elle du produit.

### Due diligence investisseur Ã¢â‚¬â€ synthÃƒÂ¨se conservÃƒÂ©e

Lecture comitÃƒÂ© d'investissement au lundi 3 aoÃƒÂ»t 2026 : PlanetLS n'est pas encore finanÃƒÂ§able comme un SaaS prÃƒÂªt pour une levÃƒÂ©e de plusieurs millions d'euros. Le verdict simulÃƒÂ© reste `Attendre`, non parce que la vision serait faible, mais parce que trop de risques structurants restent ouverts en mÃƒÂªme temps.

Constats ÃƒÂ  garder visibles :

- PlanetLS cumule encore trois moteurs difficiles ÃƒÂ  exÃƒÂ©cuter simultanÃƒÂ©ment : `SaaS`, `marketplace locale` et `rÃƒÂ©seau professionnel`.
- Le segment payeur principal n'est pas encore verrouillÃƒÂ© avec des preuves commerciales rÃƒÂ©elles.
- La liquiditÃƒÂ© locale et l'effet rÃƒÂ©seau restent ÃƒÂ  dÃƒÂ©montrer ; ils ne peuvent pas encore ÃƒÂªtre considÃƒÂ©rÃƒÂ©s comme acquis dans une thÃƒÂ¨se d'investissement.
- Le risque de dÃƒÂ©sintermÃƒÂ©diation aprÃƒÂ¨s la premiÃƒÂ¨re mise en relation reste ÃƒÂ©levÃƒÂ©.
- Le produit est dÃƒÂ©jÃƒÂ  large et crÃƒÂ©dible, mais cette largeur augmente la dette d'exÃƒÂ©cution tant que le PMF n'est pas prouvÃƒÂ©.
- Le noyau le plus prometteur ÃƒÂ  ce stade reste `Conciergerie Pro`, ÃƒÂ  traiter d'abord comme moteur SaaS / workflow avant d'industrialiser la logique marketplace.

Top questions comitÃƒÂ© ÃƒÂ  conserver :

1. Quel problÃƒÂ¨me unique PlanetLS rÃƒÂ©sout-il mieux que tout autre outil, pour un segment unique et solvable 
2. Qui paie en premier et pourquoi 
3. Pourquoi une conciergerie paierait-elle PlanetLS plutÃƒÂ´t qu'un empilement `WhatsApp + Excel + Notion + Stripe + PMS` 
4. PlanetLS est-il d'abord un SaaS, une marketplace ou un rÃƒÂ©seau, et lequel domine ÃƒÂ©conomiquement 
5. Quel niveau de densitÃƒÂ© locale est nÃƒÂ©cessaire pour rendre la marketplace utile 
6. Quel est le risque rÃƒÂ©el de dÃƒÂ©sintermÃƒÂ©diation aprÃƒÂ¨s le premier match 
7. Quelle fonctionnalitÃƒÂ© justifie ÃƒÂ  elle seule un abonnement rÃƒÂ©current `99Ã¢â‚¬â€œ149 Ã¢â€šÂ¬ HT / mois` 
8. Quel est le taux rÃƒÂ©el `demande -> devis -> mission -> facture -> paiement` 
9. Quel moat dÃƒÂ©fendable existera ÃƒÂ  5 ans 
10. Si 70 % du produit devait disparaÃƒÂ®tre pour accÃƒÂ©lÃƒÂ©rer, quel serait le noyau conservÃƒÂ© 

Conditions minimales avant rÃƒÂ©examen investisseur :

- Signer `10 ÃƒÂ  15` conciergeries payantes rÃƒÂ©ellement actives.
- Geler une offre unique vendue pendant au moins `60 jours`.
- Mesurer `activation`, `rÃƒÂ©tention` et `churn` ÃƒÂ  `30/60/90 jours` par cohorte.
- Prouver la chaÃƒÂ®ne `demande -> mission -> paiement` sur donnÃƒÂ©es rÃƒÂ©elles.
- Valider une zone pilote avec densitÃƒÂ© locale minimale et temps de rÃƒÂ©ponse crÃƒÂ©dible.
- Choisir clairement `SaaS d'abord puis marketplace` ou l'inverse, mais ne plus piloter les deux comme moteurs primaires en mÃƒÂªme temps.
- Produire un mini-dossier avec `CAC`, `LTV`, `marge brute` et `coÃƒÂ»t d'onboarding` observÃƒÂ©s, pas seulement simulÃƒÂ©s.

#### StratÃƒÂ©gie A Ã¢â‚¬â€ Abonnement logiciel Pro unique

- Principe : une offre mensuelle simple, vendue comme cockpit Pro pour conciergeries et propriÃƒÂ©taires professionnels, avec accÃƒÂ¨s aux modules les plus mÃƒÂ»rs et promesse de gain de temps opÃƒÂ©rationnel.
- Avantages : lisibilitÃƒÂ© commerciale forte ; pricing facile ÃƒÂ  tester ; meilleur fit avec une logique SaaS rÃƒÂ©currente ; limite la charge manuelle de vente sur mesure ; facilite plus tard la connexion aux KPI MRR, churn et activation.
- Risques : promesse trop large si certains modules clÃƒÂ©s restent N2/N3 ; objection prix si la valeur n'est pas perÃƒÂ§ue dÃƒÂ¨s la premiÃƒÂ¨re semaine ; risque de vendre un "tout-en-un" alors que les usages rÃƒÂ©els sont encore hÃƒÂ©tÃƒÂ©rogÃƒÂ¨nes selon les profils.
- Conditions de rÃƒÂ©ussite : pÃƒÂ©rimÃƒÂ¨tre fonctionnel strictement bornÃƒÂ© ; onboarding trÃƒÂ¨s court avec premiÃƒÂ¨re valeur en moins de 7 jours ; page d'offre claire avec preuves d'usage concrÃƒÂ¨tes ; support fondateur trÃƒÂ¨s rÃƒÂ©actif sur les premiers comptes.

#### StratÃƒÂ©gie B Ã¢â‚¬â€ Offre Pro hybride avec abonnement socle + services d'accompagnement

- Principe : un abonnement Pro volontairement resserrÃƒÂ© sur le cockpit et les usages rÃƒÂ©currents, complÃƒÂ©tÃƒÂ© par des services payants d'onboarding, paramÃƒÂ©trage, import, cadrage ou accompagnement business.
- Avantages : monÃƒÂ©tisation plus rÃƒÂ©aliste ÃƒÂ  court terme ; rÃƒÂ©duit le risque de sous-pricer l'effort d'acquisition et de mise en route ; s'adapte ÃƒÂ  des clients encore peu matures numÃƒÂ©riquement ; crÃƒÂ©e du chiffre d'affaires mÃƒÂªme si le produit n'est pas encore totalement industrialisÃƒÂ©.
- Risques : modÃƒÂ¨le moins scalable ; dÃƒÂ©pendance plus forte au temps fondatrice/ops ; confusion possible entre logiciel et prestation ; marge plus difficile ÃƒÂ  standardiser si le catalogue d'accompagnement n'est pas bornÃƒÂ©.
- Conditions de rÃƒÂ©ussite : dÃƒÂ©coupage trÃƒÂ¨s explicite entre ce qui est inclus dans l'abonnement et ce qui relÃƒÂ¨ve du service ; packages d'accompagnement standardisÃƒÂ©s ; estimation du temps de delivery rÃƒÂ©elle ; pilotage serrÃƒÂ© du coÃƒÂ»t d'acquisition et du temps passÃƒÂ© par client.

#### StratÃƒÂ©gie C Ã¢â‚¬â€ Offre Pro segmentÃƒÂ©e par vertical mÃƒÂ©tier

- Principe : plusieurs offres Pro distinctes selon le profil, par exemple `Conciergerie Pro`, `PropriÃƒÂ©taire Pro` puis plus tard `Prestataire Pro`, chacune avec proposition de valeur, modules et prix dÃƒÂ©diÃƒÂ©s.
- Avantages : meilleure pertinence du discours ; prix potentiellement mieux alignÃƒÂ©s ÃƒÂ  la valeur perÃƒÂ§ue ; rÃƒÂ©duit l'effet "usine ÃƒÂ  gaz" d'une offre unique ; permet de concentrer la roadmap sur le segment qui convertit le mieux.
- Risques : complexitÃƒÂ© produit, marketing et pricing plus ÃƒÂ©levÃƒÂ©e ; plus de friction cÃƒÂ´tÃƒÂ© Stripe, support, contenus et KPI ; danger de lancer trop tÃƒÂ´t plusieurs offres alors que la densitÃƒÂ© d'usage et les preuves clients sont encore faibles.
- Conditions de rÃƒÂ©ussite : choisir un segment prioritaire net ; limiter le nombre d'offres actives au dÃƒÂ©part ; disposer d'indicateurs sÃƒÂ©parÃƒÂ©s par segment ; accepter de reporter certains profils tant que le message principal n'est pas stabilisÃƒÂ©.

#### Recommandation argumentÃƒÂ©e

Recommandation : privilÃƒÂ©gier la stratÃƒÂ©gie B comme point d'entrÃƒÂ©e des 60 ÃƒÂ  90 prochains jours, avec une trajectoire assumÃƒÂ©e vers la stratÃƒÂ©gie C et sans se verrouiller trop tÃƒÂ´t dans une promesse SaaS unique de type stratÃƒÂ©gie A.

Pourquoi ce choix : PlanetLS possÃƒÂ¨de dÃƒÂ©jÃƒÂ  un socle crÃƒÂ©dible, mais le Master Plan montre encore plusieurs modules `Ã°Å¸Å¸Â¡ En cours` et `Ã°Å¸Å¸Â  Partiel`, avec une valeur plus mÃƒÂ»re cÃƒÂ´tÃƒÂ© conciergerie/admin que cÃƒÂ´tÃƒÂ© produit totalement standardisÃƒÂ©. Une offre hybride permet donc de vendre dÃƒÂ¨s maintenant une valeur rÃƒÂ©elle sans surpromettre, de financer l'apprentissage terrain, de comprendre quels services deviennent rÃƒÂ©currents, puis de transformer ensuite ce qui se rÃƒÂ©pÃƒÂ¨te en fonctionnalitÃƒÂ©s produit ou en dÃƒÂ©clinaison segmentÃƒÂ©e `Conciergerie Pro`. En revanche, partir tout de suite sur une offre A trop large exposerait ÃƒÂ  du churn liÃƒÂ© aux attentes, et partir immÃƒÂ©diatement sur une offre C complÃƒÂ¨te multiplierait la complexitÃƒÂ© avant d'avoir le bon message commercial.

Cadre recommandÃƒÂ© : lancer une seule offre commerciale prioritaire `Conciergerie Pro`, avec un abonnement socle clair et 2 ÃƒÂ  3 packs d'accompagnement bornÃƒÂ©s. Les propriÃƒÂ©taires professionnels peuvent rester en cible secondaire tant que la proposition de valeur dÃƒÂ©diÃƒÂ©e n'est pas validÃƒÂ©e en entretien et en closing.

#### Plan d'action en 7 jours

1. Jour 1 : figer la cible prioritaire, le problÃƒÂ¨me principal rÃƒÂ©solu et la promesse exacte de l'offre Pro en une phrase ; bannir toute promesse non soutenue par le produit actuel.
2. Jour 2 : dÃƒÂ©finir le contenu de l'abonnement socle `Conciergerie Pro` avec une liste stricte `inclus / non inclus / bientÃƒÂ´t`, plus 2 ou 3 packs d'accompagnement standardisÃƒÂ©s.
3. Jour 3 : fixer une premiÃƒÂ¨re hypothÃƒÂ¨se de prix avec bornes basses et hautes, puis prÃƒÂ©parer un script d'entretien commercial de 20 minutes pour tester valeur perÃƒÂ§ue, objections et urgence.
4. Jour 4 : sÃƒÂ©lectionner 5 ÃƒÂ  10 prospects ou contacts chauds, rÃƒÂ©aliser les entretiens et noter systÃƒÂ©matiquement les signaux `comprÃƒÂ©hension`, `intÃƒÂ©rÃƒÂªt`, `objection prix`, `objection confiance`, `fonction manquante`.
5. Jour 5 : synthÃƒÂ©tiser les retours dans le cockpit entrepreneurial, comparer au moins 2 variantes de pricing et dÃƒÂ©cider si l'offre garde un socle unique ou si une segmentation lÃƒÂ©gÃƒÂ¨re devient dÃƒÂ©jÃƒÂ  nÃƒÂ©cessaire.
6. Jour 6 : rÃƒÂ©diger la page d'offre et le support de vente minimal `landing, argumentaire, FAQ, conditions d'accompagnement`, sans encore automatiser Stripe tant que le wording n'a pas ÃƒÂ©tÃƒÂ© validÃƒÂ© ÃƒÂ  l'oral.
7. Jour 7 : arbitrer go/no-go sur un pilote payant, choisir 1 offre officielle ÃƒÂ  tester pendant 30 jours, dÃƒÂ©finir les KPI de validation `taux de rendez-vous, taux d'intÃƒÂ©rÃƒÂªt, taux de closing, dÃƒÂ©lai ÃƒÂ  premiÃƒÂ¨re valeur, temps d'accompagnement par client`.

### Historique synthÃƒÂ©tique des fonctionnalitÃƒÂ©s structurantes

| FonctionnalitÃƒÂ© | CrÃƒÂ©ation | DerniÃƒÂ¨re ÃƒÂ©volution importante | Statut actuel | Limites connues | DÃƒÂ©pendances | Prochaine ÃƒÂ©tape |
|---|---|---|---|---|---|---|
| Authentification et permissions | Avant 2026-04 | 2026-08-07 | En cours | Le proxy bloque maintenant aussi les mutations API cross-origin non fiables via un garde CSRF central (`Origin`/`Referer`) avec exemptions explicites pour `/api/auth`, webhook Stripe et appels serveur-ÃƒÂ -serveur signÃƒÂ©s ; E2E multi-rÃƒÂ´les et validation de cette dÃƒÂ©fense en environnement rÃƒÂ©el restent absents | NextAuth, Supabase, guards API, proxy, helper CSRF partagÃƒÂ© | Automatiser les parcours et confirmer la sÃƒÂ©curitÃƒÂ© en environnement rÃƒÂ©el, y compris les cas CSRF autorisÃƒÂ©s/refusÃƒÂ©s |
| Demande Ã¢â€ â€™ devis Ã¢â€ â€™ mission Ã¢â€ â€™ paiement | Avant 2026-05 | 2026-06-06 | En cours | Validation bout en bout et consolidation paiement incomplÃƒÂ¨tes | Tables mÃƒÂ©tier, Stripe, workflow events | E2E owner/concierge et gestion visible des ÃƒÂ©checs |
| Profils professionnels | Avant 2026-04 | 2026-08-07 | Partiel | Ãƒâ€°dition et preuves privÃƒÂ©es artisan livrÃƒÂ©es ; la vue publique concierge expose maintenant une V1 actionnable type Linktree sur les liens sociaux existants, des CTA structurÃƒÂ©s et un tracking lÃƒÂ©ger des clics ; migration distante, validation admin, avis plus riches, lecture acquisition des CTA et vue provider dÃƒÂ©taillÃƒÂ©e manquent encore ; l'extension provider reste volontairement reportÃƒÂ©e | `profiles`, `provider_profile_documents`, Storage privÃƒÂ©, reviews, profils publics, workflow_events | AgrÃƒÂ©ger ensuite les CTA rÃƒÂ©ellement utilisÃƒÂ©s, clarifier les CTA mÃƒÂ©tier provider, puis ÃƒÂ©tendre la mÃƒÂ©canique sans crÃƒÂ©er de second produit de profil public |
| Maintenance, ÃƒÂ©quipe et sÃƒÂ©jours | 2026-07 | 2026-07-12 | Partiel | Persistance spÃƒÂ©cialisÃƒÂ©e incomplÃƒÂ¨te | Missions, metadata, interventions | Tables/RLS/types et E2E |
| RÃƒÂ©servations partagÃƒÂ©es propriÃƒÂ©taire -> conciergerie | 2026-07-29 | 2026-07-29 | En cours | Phases A ÃƒÂ  C terminÃƒÂ©es ; phase D dÃƒÂ©sormais appliquÃƒÂ©e ÃƒÂ  distance sur `missions`, `provider_interventions` et `workflow_events` avec confirmation le mercredi 29 juillet 2026, puis nettoyÃƒÂ©e sur les parcours secondaires : table canonique `reservations`, index, trigger `updated_at`, RLS participants, helper partagÃƒÂ©, route owner `GET/POST`, route participant `GET/PATCH`, `/api/concierge/stays` lit dÃƒÂ©sormais `reservations` avant le legacy `missions`, `GET /api/concierge/reservations` prend aussi `reservations` comme racine avec rattachement des missions workflow, l'ÃƒÂ©cran owner `voyageurs` lit/crÃƒÂ©e les sÃƒÂ©jours canoniques, le planning owner lit dÃƒÂ©sormais `/api/owner/reservations`, `missions.reservation_id` est crÃƒÂ©ÃƒÂ© en base et poussÃƒÂ© sur Supabase, `POST /api/concierge/reservations` crÃƒÂ©e ou recharge la rÃƒÂ©servation canonique avant les missions liÃƒÂ©es, `provider_interventions.reservation_id` est aussi crÃƒÂ©ÃƒÂ© et poussÃƒÂ© sur Supabase, les routes mission/provider privilÃƒÂ©gient dÃƒÂ©sormais les liaisons explicites avant fallback metadata, `workflow_events.reservation_id` est crÃƒÂ©ÃƒÂ© et poussÃƒÂ© sur Supabase, `recordWorkflowEvent` sait l'ÃƒÂ©crire avec fallback si nÃƒÂ©cessaire, `/api/workflow-events` peut maintenant filtrer directement par rÃƒÂ©servation, l'agrÃƒÂ©gation de sÃƒÂ©jour privilÃƒÂ©gie `reservation_id`, les ÃƒÂ©vÃƒÂ©nements concierge rÃƒÂ©injectent l'identifiant canonique, l'annulation des factures de workflow s'appuie d'abord sur `mission_id`, `/api/reservations/[id]` expose dÃƒÂ©sormais une timeline unifiÃƒÂ©e de la rÃƒÂ©servation canonique avec traÃƒÂ§age des crÃƒÂ©ations owner/concierge et des mises ÃƒÂ  jour statut/notes/consignes, cette lecture est branchÃƒÂ©e dans `/dashboard/concierge/sejours` et dans l'aside de `/dashboard/owner/missions/voyageurs`, l'ÃƒÂ©criture collaborative est maintenant ouverte depuis ces deux cockpits avec actions de cycle de vie et notes ÃƒÂ©ditoriales, et `/dashboard/owner/planning` rÃƒÂ©injecte ce brief canonique dans ses cartes pour une lecture plus narrative ; les fallbacks `metadata.reservation_id/reservation_workflow_id` restent volontairement conservÃƒÂ©s en lecture pour la compatibilitÃƒÂ© avec l'historique non migrÃƒÂ© | Contrats ou devis signÃƒÂ©s, planning, missions, provider_interventions, workflow_events | Ãƒâ€°tendre maintenant cette mÃƒÂªme ÃƒÂ©criture et cette narration canonique vers les vues concierge planning/rÃƒÂ©servations dÃƒÂ©taillÃƒÂ©es et vers les opÃƒÂ©rations/artisans liÃƒÂ©s afin que tout le suivi terrain parle la mÃƒÂªme chronologie |
| Pilotage PlanetLS Ã¢â‚¬â€ cockpit entrepreneurial privÃƒÂ© | 2026-07-29 | 2026-08-06 | Partiel | Le cockpit opÃƒÂ©rationnel reste en place mais le centre de stratÃƒÂ©gie business de la page `/dashboard/admin/pilotage` est maintenant recentrÃƒÂ© sur une gamme plus crÃƒÂ©dible ÃƒÂ  tester : `29 Ã¢â€šÂ¬ HT / mois`, `49 Ã¢â€šÂ¬ HT / mois` puis `sur devis`, avec prÃƒÂ©fÃƒÂ©rence actuelle pour la `stratÃƒÂ©gie B par niveau`. Les onglets marchÃƒÂ©, finance et modÃƒÂ¨le ÃƒÂ©conomique portent dÃƒÂ©sormais cette mÃƒÂªme narration, la commission n'ÃƒÂ©tant plus prÃƒÂ©sentÃƒÂ©e comme direction immÃƒÂ©diate mais comme hypothÃƒÂ¨se secondaire ÃƒÂ  rÃƒÂ©ÃƒÂ©valuer seulement si PlanetLS prouve une vraie intermÃƒÂ©diation de missions et de coordination. Les exports PDF/Excel/CSV/Business Plan/Pitch et l analyse IA restent dÃƒÂ©sactivÃƒÂ©s, et le modÃƒÂ¨le Stripe Concierge PRO existant ÃƒÂ  `29 Ã¢â€šÂ¬` reste visible mais non modifiÃƒÂ©. | Composants UI partagÃƒÂ©s, navigateur, future persistance Supabase admin, futurs paramÃƒÂ¨tres financiers canoniques, Stripe si une stratÃƒÂ©gie est validÃƒÂ©e | P1 Prioritaire : tester d'abord la lisibilitÃƒÂ© et l'acceptabilitÃƒÂ© de la gamme `29 / 49 / sur devis`, confirmer ou infirmer la prÃƒÂ©fÃƒÂ©rence pour la stratÃƒÂ©gie B sur prospects rÃƒÂ©els, puis seulement dÃƒÂ©cider s'il faut rÃƒÂ©introduire une logique de commission ou une variante hybride |
| Assistant dÃƒÂ©coration | 2026-07-18 | 2026-07-18 | Partiel | Moteur dÃƒÂ©terministe, pas d'image rÃƒÂ©elle ni envoi owner tracÃƒÂ© | `decoration_ai_reports`, API concierge | Tester avec des concierges avant extension |
| Reseau professionnel | Vision 2026-07 | 2026-07-18 | A faire | Liquidite locale non prouvee | Profils, zones, missions, moderation | Pilote local puis mur des missions |

### Mise ÃƒÂ  jour ciblÃƒÂ©e Ã¢â‚¬â€ Pilotage Business du lundi 3 aoÃƒÂ»t 2026

- Statut : `Partiel`
- PrioritÃƒÂ© : `P1 Prioritaire`
- PÃƒÂ©rimÃƒÂ¨tre mis ÃƒÂ  jour : `/dashboard/admin/pilotage`
- RÃƒÂ©alitÃƒÂ© produit : le haut de page a ÃƒÂ©tÃƒÂ© simplifiÃƒÂ© pour retirer les blocs exploratoires devenus encombrants (`comparateur d'offre Pro`, `mÃƒÂ©mo investisseur`) et garder un cockpit plus directement exploitable.
- Ajout majeur : un premier `RiskRegister` statique et filtrable est maintenant affichÃƒÂ© dans la page via `src/app/dashboard/admin/pilotage/risk-register/`, sans migration ni persistance Supabase.
- Source d'alimentation : les risques affichÃƒÂ©s reprennent la lecture due diligence et la transforment en cartographie opÃƒÂ©rationnelle par prioritÃƒÂ©, catÃƒÂ©gorie, profils impactÃƒÂ©s, horizon, mitigation et signaux d'alerte.
- Limites connues : le registre ne permet encore ni ÃƒÂ©dition, ni assignation persistÃƒÂ©e, ni historique, ni scoring dynamique ; il ne remplace pas encore un vrai module de gouvernance des risques.
- DÃƒÂ©pendances inchangÃƒÂ©es : endpoints admin existants, composants dashboard partagÃƒÂ©s, future persistance Supabase admin, futur arbitrage Stripe si un modÃƒÂ¨le financier est figÃƒÂ©.
- DÃƒÂ©cision de pilotage : conserver le cadrage financier et la synthÃƒÂ¨se investisseur dans ce Master Plan comme base d'arbitrage, sans les laisser occuper la page opÃƒÂ©rationnelle tant que le modÃƒÂ¨le ÃƒÂ©conomique n'est pas validÃƒÂ©.
- Preuve de vÃƒÂ©rification : `npm run build` PASS le lundi 3 aoÃƒÂ»t 2026.
- Prochaine ÃƒÂ©tape recommandÃƒÂ©e : dÃƒÂ©finir plus tard un schÃƒÂ©ma canonique `risk_register` seulement aprÃƒÂ¨s validation du noyau business `offre, prix, commission ou non`.
- Ãƒâ‚¬ faire demain, samedi 8 aoÃƒÂ»t 2026 : ouvrir un premier cockpit admin des ÃƒÂ©vÃƒÂ©nements `public_profile_cta_clicked` pour lire les clics CTA publics par profil, canal et pÃƒÂ©riode, puis dÃƒÂ©cider si l'itÃƒÂ©ration suivante porte sur l'agrÃƒÂ©gation acquisition concierge ou sur le cadrage des CTA mÃƒÂ©tier provider.

Ajout du lundi 3 aoÃƒÂ»t 2026 : la vue rapide chiffrÃƒÂ©e du haut de page `Pilotage Business` a aussi ÃƒÂ©tÃƒÂ© retirÃƒÂ©e, car les tuiles `pipeline`, `missions facturÃƒÂ©es`, `activation moyenne` et `points de vigilance` donnaient une prÃƒÂ©cision trompeuse. Le haut de page est maintenant recentrÃƒÂ© sur un cadrage dÃƒÂ©cisionnel qualitatif.
Ajout du lundi 3 aoÃƒÂ»t 2026 : la page `Pilotage Business` embarque maintenant un module `Conseiller stratÃƒÂ©gique` statique qui formalise la mÃƒÂ©thode de dÃƒÂ©cision de la fondatrice en 8 ÃƒÂ©tapes, les questions stratÃƒÂ©giques ÃƒÂ  poser, les critÃƒÂ¨res de comparaison des options et les sorties de pilotage ÃƒÂ  historiser. Cette brique reste volontairement sans persistance ni automatisation afin de prÃƒÂ©server la simplicitÃƒÂ© tout en crÃƒÂ©ant une mÃƒÂ©moire de travail rÃƒÂ©utilisable.
Ajout du lundi 3 aoÃƒÂ»t 2026 : la page `Pilotage Business` expose aussi un module `Validation marchÃƒÂ©` statique de type Lean Startup. Il consolide un diagnostic initial, le classement des hypothÃƒÂ¨ses critiques, un plan de validation sur 30 jours, les 13 tests mesurables, les scripts d'entretien, le sondage, les variantes de landing, les KPI de validation, la grille `GO / TEST MORE / PIVOT`, les recommandations d'intÃƒÂ©gration et les actions immÃƒÂ©diates. Cette brique s'appuie sur les parcours dÃƒÂ©jÃƒÂ  disponibles, ne modifie pas Stripe, ne lance aucune migration et sert d'abord de cadre d'exÃƒÂ©cution frugal avant toute nouvelle couche produit.

### Mise ÃƒÂ  jour ciblÃƒÂ©e Ã¢â‚¬â€ Navigation admin du mardi 4 aoÃƒÂ»t 2026

- Statut : `En cours`
- PrioritÃƒÂ© : `P2 Important`
- PÃƒÂ©rimÃƒÂ¨tre mis ÃƒÂ  jour : `/dashboard/admin/developpement`, `/dashboard/admin/controle`, `/dashboard/admin/pilotage`, `/api/admin/project-advisor`
- RÃƒÂ©alitÃƒÂ© produit : la page `developpement` n'est plus pensÃƒÂ©e comme un long scroll continu. Elle ouvre maintenant directement sur le `Tableau fonctionnel / Master Plan`, puis sÃƒÂ©pare `Mission Control`, `Roadmap`, `MÃƒÂ©moire` et `Journal` dans des onglets explicites. Le bloc `Sommaire et dÃƒÂ©tail du Master Plan` a en plus ÃƒÂ©tÃƒÂ© allÃƒÂ©gÃƒÂ© au strict utile : filtres + sections, sans mÃƒÂ©triques, sans sommaire latÃƒÂ©ral et sans raccourcis redondants.
- RÃƒÂ©alitÃƒÂ© produit : le `Conseiller projet` a quittÃƒÂ© la page `developpement`. Les signaux utiles ÃƒÂ  l'arbitrage produit/business sont maintenant relus depuis `Pilotage Business`, dans l'onglet stratÃƒÂ©gie, via la route admin `/api/admin/project-advisor`.
- RÃƒÂ©alitÃƒÂ© produit : la page `controle` est dÃƒÂ©sormais structurÃƒÂ©e par onglets de premier niveau `SantÃƒÂ© globale / Inscriptions / Missions / Messages`, ce qui isole mieux la vue de santÃƒÂ©, les filtres mÃƒÂ©tier et les listes opÃƒÂ©rationnelles sans mÃƒÂ©langer tous les blocs sur une seule lecture verticale.
- RÃƒÂ©utilisation : l'implÃƒÂ©mentation s'appuie sur les primitives UI `Tabs` dÃƒÂ©jÃƒÂ  prÃƒÂ©sentes dans le design system, sans crÃƒÂ©er de nouveau composant spÃƒÂ©cifique.
- RÃƒÂ©utilisation : la gÃƒÂ©nÃƒÂ©ration du conseiller est mutualisÃƒÂ©e cÃƒÂ´tÃƒÂ© serveur pour pouvoir alimenter `Pilotage Business` sans rÃƒÂ©introduire ces arbitrages dans la page `developpement`.
- Responsive et accessibilitÃƒÂ© : la navigation onglets reste clavier-compatible via les primitives existantes ; les listes d'onglets se replient sur une seule colonne en mobile pour ÃƒÂ©viter les dÃƒÂ©bordements horizontaux.
- Limites connues : la page `controle` conserve encore des sections pliables ÃƒÂ  l'intÃƒÂ©rieur de chaque onglet pour les filtres et le dÃƒÂ©tail ; ce n'est donc pas encore une simplification maximale du flux.
- VÃƒÂ©rification : `npm.cmd run build` `PASS` le mardi 4 aoÃƒÂ»t 2026.
- Prochaine ÃƒÂ©tape recommandÃƒÂ©e : si l'usage confirme le gain de lisibilitÃƒÂ©, rÃƒÂ©duire ensuite le nombre de sections pliables internes dans `controle` pour garder un seul niveau de hiÃƒÂ©rarchie visuelle par onglet.

### Mise ÃƒÂ  jour ciblÃƒÂ©e Ã¢â‚¬â€ IntÃƒÂ©gration progressive des dashboards du mercredi 5 aoÃƒÂ»t 2026

- Statut : `En cours`
- PrioritÃƒÂ© : `P2 Important`
- PÃƒÂ©rimÃƒÂ¨tre mis ÃƒÂ  jour : `src/app/components/dashboard/unified/`, `/dashboard/owner`, `/dashboard/admin`
- RÃƒÂ©alitÃƒÂ© produit : l'intÃƒÂ©gration dashboard est maintenant dÃƒÂ©coupÃƒÂ©e par lots au lieu de modifier les quatre espaces simultanÃƒÂ©ment. Les dashboards owner, admin, concierge et provider convergent progressivement vers un socle UI partagÃƒÂ© `UnifiedRoleDashboard`, sans fusionner leurs logiques mÃƒÂ©tier ni leurs sources de donnÃƒÂ©es. Le socle supporte dÃƒÂ©sormais les variantes de rÃƒÂ´le, les tons de badges configurables et une zone de complÃƒÂ©ment hero rÃƒÂ©utilisable.
- RÃƒÂ©alitÃƒÂ© produit : l'espace propriÃƒÂ©taire rÃƒÂ©utilise davantage les composants communs dÃƒÂ©jÃƒÂ  prÃƒÂ©sents (`UnifiedSpotlightList`, `UnifiedStatStack`) pour ses prioritÃƒÂ©s, ses prochaines missions et ses repÃƒÂ¨res sÃƒÂ©jours, ce qui rÃƒÂ©duit les rendus ad hoc sans changer les sources de donnÃƒÂ©es owner existantes.
- RÃƒÂ©alitÃƒÂ© produit : la page `/dashboard/admin` a quittÃƒÂ© l'ancien `DashboardLayout` spÃƒÂ©cifique pour rejoindre le mÃƒÂªme tronc commun visuel que l'owner. Les calculs mÃƒÂ©tier admin, les endpoints (`/api/admin/operations`, `/api/admin/overview`, `/api/admin/control-tower`, `/api/kpis/overview`) et les tableaux dÃƒÂ©taillÃƒÂ©s sont conservÃƒÂ©s, mais la composition devient plus homogÃƒÂ¨ne avec hero partagÃƒÂ©, KPI unifiÃƒÂ©s, rail d'activitÃƒÂ© et raccourcis latÃƒÂ©raux.
- RÃƒÂ©utilisation : aucune nouvelle dÃƒÂ©pendance n'a ÃƒÂ©tÃƒÂ© ajoutÃƒÂ©e ; le lot capitalise sur les primitives dashboard existantes au lieu d'introduire une seconde bibliothÃƒÂ¨que de composants.
- RÃƒÂ©alitÃƒÂ© produit : l'espace concierge reposait dÃƒÂ©jÃƒÂ  majoritairement sur ce mÃƒÂªme socle UI partagÃƒÂ© ; le lot suivant a surtout confirmÃƒÂ© cette convergence sans rÃƒÂ©ÃƒÂ©criture lourde ni changement des fetchs mÃƒÂ©tier concierge.
- RÃƒÂ©alitÃƒÂ© produit : la page `/dashboard/provider` a quittÃƒÂ© son cockpit isolÃƒÂ© pour rejoindre le mÃƒÂªme tronc commun visuel que les autres espaces, tout en conservant ses calculs mÃƒÂ©tier, ses liens d'action et ses sources provider existantes.
- Limites connues : plusieurs styles legacy restent prÃƒÂ©sents dans `page.module.scss` mÃƒÂªme si la couche de composition principale est maintenant homogÃƒÂ©nÃƒÂ©isÃƒÂ©e ; la navigation E2E inter-pages et les compteurs filtrÃƒÂ©s par lien restent encore ÃƒÂ  consolider.
- VÃƒÂ©rification : `npm run build` `PASS` le jeudi 6 aoÃƒÂ»t 2026.
- Prochaine ÃƒÂ©tape recommandÃƒÂ©e : factoriser ensuite ce qui reste dupliquÃƒÂ© dans les tableaux, listes compactes, rails de prioritÃƒÂ©s et ÃƒÂ©tats vides, sans ÃƒÂ©craser les besoins mÃƒÂ©tier propres ÃƒÂ  chaque rÃƒÂ´le.

### Checklist de fin de mission documentaire

- [ ] Relire les fichiers rÃƒÂ©ellement modifiÃƒÂ©s et identifier les fonctions touchÃƒÂ©es.
- [ ] ExÃƒÂ©cuter les tests ou vÃƒÂ©rifications proportionnÃƒÂ©s au risque.
- [ ] Mettre ÃƒÂ  jour statut, prioritÃƒÂ©, date, preuve et prochaine action.
- [ ] RÃƒÂ©ÃƒÂ©valuer la phase de roadmap et les dÃƒÂ©pendances.
- [ ] Ajouter sans doublon les idÃƒÂ©es apparues, sans les implÃƒÂ©menter hors pÃƒÂ©rimÃƒÂ¨tre.
- [ ] Ajouter au journal uniquement les dÃƒÂ©cisions utiles ÃƒÂ  long terme.
- [ ] PrÃƒÂ©ciser les limites et les ÃƒÂ©lÃƒÂ©ments non confirmables par le code.
- [ ] Ne crÃƒÂ©er aucun audit transversal supplÃƒÂ©mentaire.
---

## 13. Prochaine revue recommandÃƒÂ©e

La prochaine mise ÃƒÂ  jour de ce document doit intervenir aprÃƒÂ¨s le lot de stabilisation. Elle devra :

1. consigner le rÃƒÂ©sultat de `npm test`, `npm run lint` et `npm run build` ;
2. joindre les preuves des trois E2E critiques ;
3. confirmer la source canonique des migrations et l'ÃƒÂ©tat rÃƒÂ©el de la base ;
4. mettre ÃƒÂ  jour les niveaux N2/N3 aprÃƒÂ¨s persistance des modules rÃƒÂ©cents ;
5. nommer la zone pilote, les responsables et les dates d'acquisition ;
6. transformer toute dÃƒÂ©cision prise en entrÃƒÂ©e du journal, sans crÃƒÂ©er de nouvel audit transversal.

### Mise ÃƒÂ  jour ciblÃƒÂ©e Ã¢â‚¬â€ RÃƒÂ©fÃƒÂ©rentiel IA du lundi 3 aoÃƒÂ»t 2026

- Statut : `Partiel`
- PrioritÃƒÂ© : `P2 Important`
- PÃƒÂ©rimÃƒÂ¨tre mis ÃƒÂ  jour : `docs/ai/`, `src/server/prompt-library/`, `/api/admin/prompt-library`, `/dashboard/admin/pilotage`
- RÃƒÂ©alitÃƒÂ© produit : PlanetLS dispose maintenant d'un contexte central partagÃƒÂ©, de rÃƒÂ¨gles Codex permanentes, d'une premiÃƒÂ¨re bibliothÃƒÂ¨que de `10` prompts versionnÃƒÂ©s, d'un parseur lÃƒÂ©ger de frontmatter/sections et d'un onglet admin `Centre IA` dans `Pilotage Business` pour rechercher, filtrer, consulter et prÃƒÂ©parer les prompts sans dupliquer leur source.
- Source officielle : les prompts restent des fichiers Markdown dans `docs/ai/prompts/` ; l'interface admin ne crÃƒÂ©e pas de seconde source de vÃƒÂ©ritÃƒÂ©.
- SÃƒÂ©curitÃƒÂ© : la lecture passe par une route admin dÃƒÂ©diÃƒÂ©e `/api/admin/prompt-library` ; aucun secret, token ou donnÃƒÂ©e personnelle n'est stockÃƒÂ© dans les prompts ou les runs.
- VÃƒÂ©rifications : test ciblÃƒÂ© `src/tests/prompt-library.test.mts` `3/3 PASS` le lundi 3 aoÃƒÂ»t 2026 ; `npm run build` `PASS` le lundi 3 aoÃƒÂ»t 2026.
- Limites connues : les favoris et prÃƒÂ©parations sont stockÃƒÂ©s localement dans le navigateur ; les runs ne sont pas encore persistÃƒÂ©s automatiquement ; `npm test` global n'est pas entiÃƒÂ¨rement vert ÃƒÂ  cause de trois ÃƒÂ©checs prÃƒÂ©existants hors pÃƒÂ©rimÃƒÂ¨tre (`concierge-team-api-contract`, `dashboard-client` avec OOM, puis le nouveau test avant correction d'import).
- Prochaine ÃƒÂ©tape recommandÃƒÂ©e : migrer d'autres prompts historiques utiles, ajouter un enregistrement lÃƒÂ©ger optionnel des runs importants et relier davantage le Centre IA au journal de bord de dÃƒÂ©veloppement sans crÃƒÂ©er de duplication documentaire.
### Mise ÃƒÆ’Ã‚Â  jour ciblÃƒÆ’Ã‚Â©e ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Cartographie de convergence des dashboards du jeudi 6 aoÃƒÆ’Ã‚Â»t 2026

- Statut : `En cours`
- PrioritÃƒÆ’Ã‚Â© : `P2 Important`
- PÃƒÆ’Ã‚Â©rimÃƒÆ’Ã‚Â¨tre mis ÃƒÆ’Ã‚Â  jour : `docs/dashboards/dashboard-feature-inventory.md`, `docs/dashboards/dashboard-roadmap.md`, `docs/master-plan-planetls.md`
- RÃƒÆ’Ã‚Â©alitÃƒÆ’Ã‚Â© produit : avant de poursuivre la convergence visuelle, un inventaire repo-first des dashboards owner, concierge, provider/artisan et admin a ÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â© formalisÃƒÆ’Ã‚Â©. Il confirme que les homes `/dashboard/owner`, `/dashboard/concierge`, `/dashboard/provider` et `/dashboard/admin` partagent dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  un socle commun `UnifiedRoleDashboard`, tandis qu'une seconde strate legacy reste active sur plusieurs pages secondaires via `DashboardLayout`, `WorkspacePageShell`, `DashboardWorkspace` et `SimpleOverviewWorkspace`.
- RÃƒÆ’Ã‚Â©alitÃƒÆ’Ã‚Â© produit : la convergence progressive du cockpit n'est pas un dÃƒÆ’Ã‚Â©placement du "vrai" ÃƒÆ’Ã‚Â©tat mÃƒÆ’Ã‚Â©tier vers une abstraction vide. Elle sert au contraire ÃƒÆ’Ã‚Â  rapprocher des surfaces dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  rÃƒÆ’Ã‚Â©elles vers un socle commun de composition, sans fusionner les fetchs, les permissions ni les rÃƒÆ’Ã‚Â¨gles propres ÃƒÆ’Ã‚Â  chaque rÃƒÆ’Ã‚Â´le.
- DÃƒÆ’Ã‚Â©cision de pilotage : la suite doit rester dÃƒÆ’Ã‚Â©coupÃƒÆ’Ã‚Â©e `dashboard par dashboard`, avec prioritÃƒÆ’Ã‚Â© immÃƒÆ’Ã‚Â©diate aux briques communes et aux pages d'entrÃƒÆ’Ã‚Â©e, puis aux pages admin secondaires `controle` et `pilotage`, avant de reprendre les overviews legacy plus diffuses.
- DÃƒÆ’Ã‚Â©cision de pilotage : `DashboardLayout`, `WorkspacePageShell` et `SimpleOverviewWorkspace` restent des couches de transition acceptÃƒÆ’Ã‚Â©es tant qu'elles servent des pages encore actives, mais ne doivent plus devenir la rÃƒÆ’Ã‚Â©fÃƒÆ’Ã‚Â©rence de nouvelles intÃƒÆ’Ã‚Â©grations. Le prototype `/premium-owner-dashboard` reste une source d'inspiration UX, pas une base technique ÃƒÆ’Ã‚Â  propager.
- DÃƒÆ’Ã‚Â©pendances et limites : plusieurs modules forts restent hybrides ou partiellement consolidÃƒÆ’Ã‚Â©s cote donnÃƒÆ’Ã‚Â©es `reservations/sejours`, `CRM owner/concierge`, `equipe`, `finances`, `pages admin expertes`; leur harmonisation visuelle doit suivre leur maturitÃƒÆ’Ã‚Â© rÃƒÆ’Ã‚Â©elle et non la prÃƒÆ’Ã‚Â©cÃƒÆ’Ã‚Â©der.
- VÃƒÆ’Ã‚Â©rifications : inventaire croisÃƒÆ’Ã‚Â© entre code, routes dashboard, tests ciblÃƒÆ’Ã‚Â©s `mission-control`, `owner-crm` et documentation produit/UX existante ; pas de changement fonctionnel direct sur les parcours mÃƒÆ’Ã‚Â©tier dans ce lot.
- Prochaine ÃƒÆ’Ã‚Â©tape recommandÃƒÆ’Ã‚Â©e : migrer la prochaine surface visible `admin/controle` vers le socle partagÃƒÆ’Ã‚Â©, puis aligner plus explicitement la narration `owner <-> concierge` autour des rÃƒÆ’Ã‚Â©servations/sejours canoniques.

### Mise ÃƒÂ  jour ciblÃƒÂ©e Ã¢â‚¬â€ AllÃƒÂ¨gement du panneau Master Plan du jeudi 6 aoÃƒÂ»t 2026

- Statut : `En cours`
- PrioritÃƒÂ© : `P2 Important`
- PÃƒÂ©rimÃƒÂ¨tre mis ÃƒÂ  jour : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `docs/master-plan-planetls.md`
- RÃƒÂ©alitÃƒÂ© produit : dans `/dashboard/admin/developpement`, le panneau autrefois nommÃƒÂ© `Sommaire et dÃƒÂ©tail du Master Plan` est dÃƒÂ©sormais recentrÃƒÂ© sur la lecture utile des sections et tableaux. Le titre devient `Tableaux du Master Plan`, et les sections parentes sans contenu propre nÃ¢â‚¬â„¢affichent plus un mini-sommaire de sous-sections ; elles montrent seulement une courte phrase indiquant dÃ¢â‚¬â„¢ouvrir les sous-sections concernÃƒÂ©es.
- DÃƒÂ©cision de pilotage : dans ce cockpit, le sommaire interne nÃ¢â‚¬â„¢apporte pas assez de valeur face au coÃƒÂ»t visuel. Les filtres restent la vraie porte dÃ¢â‚¬â„¢entrÃƒÂ©e, puis les tableaux et sections dÃƒÂ©taillÃƒÂ©es servent de source de vÃƒÂ©ritÃƒÂ©.
- Limites connues : les styles historiques liÃƒÂ©s au sommaire interne peuvent encore exister dans la feuille SCSS tant quÃ¢â‚¬â„¢ils ne gÃƒÂªnent pas le rendu ; un nettoyage CSS plus large pourra ÃƒÂªtre fait lors dÃ¢â‚¬â„¢un prochain lot UI.
- VÃƒÂ©rifications : simplification locale du composant sans changement de logique mÃƒÂ©tier ; build Next ÃƒÂ  relancer aprÃƒÂ¨s le lot.
- Prochaine ÃƒÂ©tape recommandÃƒÂ©e : confirmer visuellement que la lecture `filtres -> tableaux -> sections` suffit en desktop et mobile, puis poursuivre lÃ¢â‚¬â„¢allÃƒÂ¨gement des autres panneaux documentaires si cette hiÃƒÂ©rarchie est jugÃƒÂ©e plus efficace.
### Mise ÃƒÆ’Ã‚Â  jour ciblÃƒÆ’Ã‚Â©e ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Recentrage Business Plan de la page pilotage du jeudi 6 aoÃƒÆ’Ã‚Â»t 2026

- Statut : `En cours`
- PrioritÃƒÆ’Ã‚Â© : `P1 Prioritaire`
- PÃƒÆ’Ã‚Â©rimÃƒÆ’Ã‚Â¨tre mis ÃƒÆ’Ã‚Â  jour : `/dashboard/admin/pilotage`, `docs/master-plan-planetls.md`
- RÃƒÆ’Ã‚Â©alitÃƒÆ’Ã‚Â© produit : la page `Pilotage` n'est plus organisÃƒÆ’Ã‚Â©e comme un cockpit mixte `overview / stratÃƒÆ’Ã‚Â©gie / validation / risques / centre IA`. Elle devient une page unique consacrÃƒÆ’Ã‚Â©e au `business plan PlanetLS`, avec une lecture plus directionnelle : thÃƒÆ’Ã‚Â¨se produit, rÃƒÆ’Ã‚Â©sumÃƒÆ’Ã‚Â© exÃƒÆ’Ã‚Â©cutif, traction actuelle, offre recommandÃƒÆ’Ã‚Â©e `Conciergerie Pro`, scÃƒÆ’Ã‚Â©narios financiers, ÃƒÆ’Ã‚Â©conomie unitaire cible, benchmark de positionnement, go-to-market et risques prioritaires.
- RÃƒÆ’Ã‚Â©alitÃƒÆ’Ã‚Â© produit : les donnÃƒÆ’Ã‚Â©es rÃƒÆ’Ã‚Â©elles encore utiles au business plan restent exploitÃƒÆ’Ã‚Â©es via les endpoints existants `/api/admin/overview`, `/api/admin/operations` et `/api/kpis/overview` pour alimenter la traction actuelle, les blocages de demandes, les devis acceptÃƒÆ’Ã‚Â©s non transformÃƒÆ’Ã‚Â©s et les missions non facturÃƒÆ’Ã‚Â©es.
- DÃƒÆ’Ã‚Â©cision de pilotage : le benchmark affichÃƒÆ’Ã‚Â© dans la page sert de `cadre stratÃƒÆ’Ã‚Â©gique interne` inspirÃƒÆ’Ã‚Â© des familles d'outils `PMS`, `opÃƒÆ’Ã‚Â©rations terrain`, `coordination d'interventions`, `expÃƒÆ’Ã‚Â©rience de confiance` et `marketplaces locales`. Il ne doit pas ÃƒÆ’Ã‚Âªtre interprÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â© comme un comparatif tarifaire externe vivant.
- DÃƒÆ’Ã‚Â©cision de pilotage : les modules plus exploratoires `validation marchÃƒÆ’Ã‚Â©`, `registre de risques complet`, `centre IA`, `conseiller stratÃƒÆ’Ã‚Â©gique` et `conseiller projet issu du dÃƒÆ’Ã‚Â©veloppement` ne structurent plus la page pilotage. Ils restent disponibles ailleurs dans le projet ou dans le code, mais ne sont plus la porte d'entrÃƒÆ’Ã‚Â©e principale du pilotage business.
- Limites connues : les scÃƒÆ’Ã‚Â©narios financiers et le benchmark restent des hypothÃƒÆ’Ã‚Â¨ses de pilotage et non des donnÃƒÆ’Ã‚Â©es marchÃƒÆ’Ã‚Â© validÃƒÆ’Ã‚Â©es automatiquement ; aucune persistance admin de business plan, aucun export investisseur et aucun reporting financier canonique n'ont ÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â© ajoutÃƒÆ’Ã‚Â©s dans ce lot.
- VÃƒÆ’Ã‚Â©rification : `npm run build` ÃƒÆ’Ã‚Â  relancer aprÃƒÆ’Ã‚Â¨s le lot pour confirmer la stabilitÃƒÆ’Ã‚Â©.
- Prochaine ÃƒÆ’Ã‚Â©tape recommandÃƒÆ’Ã‚Â©e : si cette narration business est validÃƒÆ’Ã‚Â©e, relier ensuite les leviers `traction, activation, rÃƒÆ’Ã‚Â©tention pilote, risques` ÃƒÆ’Ã‚Â  des filtres et vues dÃƒÆ’Ã‚Â©taillÃƒÆ’Ã‚Â©es plus ciblÃƒÆ’Ã‚Â©s, sans retransformer la page en cockpit multi-onglets hÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â©rogÃƒÆ’Ã‚Â¨ne.

Ajout du jeudi 6 aoÃƒÆ’Ã‚Â»t 2026 : la page a ensuite ÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â© poussÃƒÆ’Ã‚Â©e vers une lecture plus `investor deck / board-level`, avec une narration plus concise pour comitÃƒÆ’Ã‚Â© de direction, une table `TAM / SAM / SOM` qualitative, un plan d'exÃƒÆ’Ã‚Â©cution `12 mois` et des `conditions avant accÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©ration`. Cette surcouche reste volontairement prudente : elle professionnalise le storytelling business sans prÃƒÆ’Ã‚Â©tendre produire un vrai modÃƒÆ’Ã‚Â¨le financier canonique ni des donnÃƒÆ’Ã‚Â©es de marchÃƒÆ’Ã‚Â© live.
Ajout du jeudi 6 aoÃƒÆ’Ã‚Â»t 2026 : la page `Pilotage` a aussi ÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â© rÃƒÆ’Ã‚Â©organisÃƒÆ’Ã‚Â©e en `4 onglets` `Vue d'ensemble / MarchÃƒÆ’Ã‚Â© & offre / Finance / ExÃƒÆ’Ã‚Â©cution & risques`. Le contenu reste orientÃƒÆ’Ã‚Â© business plan et investor deck, mais il n'est plus prÃƒÆ’Ã‚Â©sentÃƒÆ’Ã‚Â© comme une longue suite de blocs verticaux ; la hiÃƒÆ’Ã‚Â©rarchie devient plus digeste et plus exploitable pour une lecture direction.
Ajout du jeudi 6 aoÃƒÆ’Ã‚Â»t 2026 : l'onglet `MarchÃƒÆ’Ã‚Â© & offre` intÃƒÆ’Ã‚Â¨gre maintenant l'ÃƒÆ’Ã‚Â©tude concurrentielle PlanetLS sous une forme visuelle et pilotable `tarifs du marchÃƒÆ’Ã‚Â©`, `benchmark concurrentiel intÃƒÆ’Ã‚Â©grÃƒÆ’Ã‚Â©`, `tableau comparatif synthÃƒÆ’Ã‚Â©tique`, `enseignements du benchmark`. Les tarifs d'Easy Concierge, Turno, Breezeway, Guesty, Airbnb co-hÃƒÆ’Ã‚Â´tes, AlloVoisins / marketplaces locales et PlanetLS servent de repÃƒÆ’Ã‚Â¨res de positionnement, pas de vÃƒÆ’Ã‚Â©ritÃƒÆ’Ã‚Â© financiÃƒÆ’Ã‚Â¨re canonique ni de comparatif contractuel vivant.
Ajout du jeudi 6 aoÃƒÆ’Ã‚Â»t 2026 : la mÃƒÆ’Ã‚Âªme page pousse dÃƒÆ’Ã‚Â©sormais le benchmark vers une lecture plus `board-level`, avec un graphe de positionnement `prix vs profondeur fonctionnelle`, un tableau `stratÃƒÆ’Ã‚Â©gie ocÃƒÆ’Ã‚Â©an bleu` et un bloc `lecture comitÃƒÆ’Ã‚Â© de direction`. La page assume ainsi davantage son rÃƒÆ’Ã‚Â´le de support d'arbitrage et de narration stratÃƒÆ’Ã‚Â©gique, tout en restant distincte d'un reporting financier canonique.

### Mise ÃƒÂ  jour ciblÃƒÂ©e Ã¢â‚¬â€ Onglet ModÃƒÂ¨le ÃƒÂ©conomique du jeudi 6 aoÃƒÂ»t 2026

- Statut : `Partiel`
- PrioritÃƒÂ© : `P1 Prioritaire`
- PÃƒÂ©rimÃƒÂ¨tre mis ÃƒÂ  jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `src/app/dashboard/admin/pilotage/economic-model/types.ts`, `src/app/dashboard/admin/pilotage/economic-model/data.ts`, `docs/master-plan-planetls.md`
- RÃƒÂ©alitÃƒÂ© produit : la page `/dashboard/admin/pilotage` expose dÃƒÂ©sormais un cinquiÃƒÂ¨me onglet `ModÃƒÂ¨le ÃƒÂ©conomique` dans la navigation principale du business plan. Cette premiÃƒÂ¨re ÃƒÂ©tape pose la structure du futur module sans crÃƒÂ©er de seconde page ni casser les onglets existants.
- RÃƒÂ©alitÃƒÂ© produit : un socle dÃƒÂ©diÃƒÂ© `economic-model` formalise maintenant les types mÃƒÂ©tier de pricing `PricingStrategyType`, `PricingStrategyStatus`, `PricingOfferStatus`, `PricingOffer`, `PricingScenario`, `PricingDecisionLogEntry`, ainsi qu'un inventaire initial des 10 stratÃƒÂ©gies tarifaires ÃƒÂ  comparer et des profils tarifaires de rÃƒÂ©fÃƒÂ©rence.
- DÃƒÂ©cision de pilotage : le module sÃƒÂ©pare explicitement `rÃƒÂ©el`, `hypothÃƒÂ¨se` et `simulation` avant d'ajouter des calculateurs plus poussÃƒÂ©s. Il documente d'abord la gouvernance, les stratÃƒÂ©gies, les profils et un journal initial des dÃƒÂ©cisions, afin d'ÃƒÂ©viter toute confusion entre aide ÃƒÂ  la dÃƒÂ©cision et offre publiÃƒÂ©e.
- DÃƒÂ©cision de pilotage : un bloc protÃƒÂ©gÃƒÂ© `Conciergerie Pro existante` rend visible dans le cockpit business l'offre rÃƒÂ©elle dÃƒÂ©jÃƒÂ  reliÃƒÂ©e ÃƒÂ  Stripe via le plan `concierge_pro_monthly`, avec prix mensuel affichÃƒÂ© `29 Ã¢â€šÂ¬`, statut de production et interdiction explicite de modification depuis ce module.
- Limites connues : l'ÃƒÂ©diteur d'offres simulÃƒÂ©es, la matrice de fonctionnalitÃƒÂ©s, le scoring pondÃƒÂ©rÃƒÂ©, les scÃƒÂ©narios `prudent / rÃƒÂ©aliste / ambitieux` et le comparateur visuel multi-stratÃƒÂ©gies ne sont pas encore branchÃƒÂ©s dans cet onglet. Le lot pose le socle de types et de structure UI pour les ÃƒÂ©tapes suivantes.
- VÃƒÂ©rification : `npm run build` PASS aprÃƒÂ¨s intÃƒÂ©gration de l'onglet `ModÃƒÂ¨le ÃƒÂ©conomique` et du bloc protÃƒÂ©gÃƒÂ© `Conciergerie Pro existante`.
- Prochaine ÃƒÂ©tape recommandÃƒÂ©e : brancher l'ÃƒÂ©diteur d'offres simulÃƒÂ©es sur ce socle, puis raccorder les futures simulations financiÃƒÂ¨res et la matrice de fonctionnalitÃƒÂ©s sans toucher ÃƒÂ  Stripe.

### Mise a jour ciblee - Extension du module Modele economique du jeudi 6 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/economic-model/data.ts`, `docs/master-plan-planetls.md`
- Realite produit : l'onglet principal `Modele economique` du business plan admin expose maintenant une navigation interne en `7 sous-onglets` `Vue d'ensemble / Strategies / Offres & profils / Simulations / Comparaison / Tests tarifaires / Decisions`, pour eviter une longue pile verticale et rendre la lecture de pilotage plus canonique.
- Realite produit : le module affiche des cartes de strategies, un bloc protege `Conciergerie Pro existante`, un tableau de scenarios financiers compares, une grille de comparaison ponderee, un backlog de tests tarifaires et un journal initial des decisions. Le tout reste dans une logique d'aide a la decision et non de publication commerciale.
- Decision de pilotage : la separation `reel / hypothese / simulation` reste stricte. L'offre `Conciergerie Pro` a `29 EUR` reliee au plan `concierge_pro_monthly` reste visible mais non modifiable depuis ce cockpit.
- Decision de pilotage : la page conserve sa vocation `business plan` et n'ouvre pas une seconde surface admin. Le module de pricing s'integre dans le meme dashboard et reutilise le design system dashboard deja en place.
- Limites connues : les simulations sont encore statiques, les ponderations ne sont pas editables, l'editeur d'offres simulees et la matrice de fonctionnalites ne sont pas encore branches, et aucun reporting business canonique persiste n'a ete ajoute dans ce lot.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres reecriture du module `economic-model`.
- Prochaine etape recommandee : brancher ensuite l'editeur d'offres simulees sur ce socle, puis ajouter une matrice de fonctionnalites et des hypotheses financieres modifiables sans toucher a Stripe.

### Mise a jour ciblee - Refonte UX du module Modele economique du jeudi 6 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : le module `Modele economique` n'utilise plus de sous-onglets internes. La lecture est maintenant structuree en une seule page continue avec un hero de cadrage, une rangee de cartes de reperes, puis 7 sections editoriales `Vue d'ensemble`, `Strategies`, `Offres & profils`, `Simulations`, `Comparaison`, `Tests tarifaires`, `Decisions`.
- Decision de pilotage : ce choix UX reduit l'effet `onglet dans l'onglet` dans la page `Pilotage` et rend le parcours plus clair pour une lecture direction, sans changer le perimetre fonctionnel du module.
- Decision de pilotage : les strategies restent visibles d'un seul coup d'oeil et les tableaux importants restent dans le flux de lecture, plutot que caches derriere des changements d'etat internes.
- Limites connues : les simulations, la comparaison et les tests restent encore des blocs statiques de pilotage ; le gain de ce lot est surtout la clarte d'interface, pas une nouvelle profondeur metier ou data.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres refonte UX du module.
- Prochaine etape recommandee : pousser la meme logique de clarte visuelle dans les futurs blocs `editeur d'offres simulees` et `matrice de fonctionnalites`, en evitant de recreer de nouveaux sous-onglets.

### Mise a jour ciblee - Renforcement board executive des blocs Strategies et Comparaison du jeudi 6 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la section `Strategies` affiche maintenant un niveau de lecture direction supplementaire avec trois cartes executive mises en avant `option prioritaire / option simple / option risquee`, en plus de la grille complete des dix strategies.
- Realite produit : la section `Comparaison` commence desormais par une synthese visuelle board-level avec cartes de score, barres de lecture rapide et classement relatif des modeles `par niveau / hybride / par profil / abonnement + commission`, avant la grille detaillee.
- Decision de pilotage : le module ne se contente plus d'enumerer les options ; il met en scene les arbitrages pour permettre une lecture plus immediate des compromis `vitesse / clarte / potentiel MRR / maintenance`.
- Limites connues : les scores restent des hypotheses editoriales statiques et non un moteur de calcul dynamique branche sur des ponderations editables. Cette couche sert la lisibilite executive, pas encore une verite analytique canonique.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres renforcement visuel board-level du module `Modele economique`.
- Prochaine etape recommandee : appliquer la meme logique de lecture executive aux futures briques `editeur d'offres simulees`, `matrice de fonctionnalites` et `simulations modifiables`, avec un vrai systeme de score ensuite si le socle data est confirme.

### Mise a jour ciblee - Mise en gamme visuelle du bloc Simulations du jeudi 6 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la section `Simulations` n'est plus seulement un tableau et trois cartes de lecture. Elle ajoute maintenant une premiere couche `KPI`, une couche `cartes scenario premium` et une couche `projection investisseur` afin de rendre la trajectoire plus lisible pour un usage board-level.
- Decision de pilotage : les hypotheses de simulation sont desormais mises en scene comme une histoire financiere a comparer `MRR / ARR / prix moyen / marge / run rate / lecture 12-24-36 mois`, sans les presenter comme des donnees reelles acquises.
- Limites connues : les scenarios restent statiques, sans edition ni recalcul dynamique, et la projection investisseur reste editoriale. Cette brique professionnalise la lecture mais ne constitue pas encore un reporting financier canonique.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres transformation premium du bloc `Simulations`.
- Prochaine etape recommandee : faire du bloc `Offres & profils` la prochaine zone premium, avec editeur visuel d'offres simulees, paliers, badges, limites et matrice de fonctionnalites lisible en lecture board.

### Mise a jour ciblee - Simplification du module et score moyen dans les cartes Strategies du jeudi 6 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la page `Modele economique` a ete simplifiee pour reduire les doublons de lecture. La rangee de cartes de reperes a ete retiree, le bloc `Strategies` repose maintenant sur une seule grille principale, et la partie `Comparaison` a ete reduite a une lecture executive plus concise.
- Realite produit : chaque carte de strategie affiche maintenant un `score moyen` visible directement dans la carte, afin de rendre le niveau d'interet plus lisible sans ouvrir d'autre vue ni lire tout le detail.
- Decision de pilotage : la page privilegie desormais une lecture plus directe `synthese -> gouvernance -> strategies -> simulations -> comparaison -> tests -> decisions`, avec moins de couches paralleles et moins de repetition visuelle.
- Limites connues : le score moyen reste un repere editorial calcule a partir d'un barÃƒÂ¨me interne statique, pas un moteur de scoring dynamique editable. La simplification ameliore la clarte mais ne change pas encore la profondeur fonctionnelle du module.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres simplification de la page et ajout du score moyen dans les cartes `Strategies`.
- Prochaine etape recommandee : simplifier de la meme maniere `Offres & profils`, puis transformer cette zone en veritable bloc premium avec offres simulees, badges, limites et matrice de fonctionnalites plus executive.

### Mise a jour ciblee - Refonte premium du bloc Offres et profils du jeudi 6 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la section `Offres & profils` ne se limite plus a un tableau de prochaine etape. Elle expose maintenant des cartes d'offres simulees, une lecture plus claire des profils cibles et un cadre produit simplifie pour le futur pricing `socle / modules / limites`.
- Decision de pilotage : cette zone devient un bloc plus direction et plus visuel, utile pour arbitrer la forme de l'offre avant de construire un veritable editeur ou une matrice fonctionnelle complete.
- Limites connues : les offres restent encore des hypotheses editoriales statiques ; il n'y a pas encore d'edition admin, pas de comparaison de fonctionnalites ligne a ligne et pas de liaison a un moteur de pricing ou a Stripe.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres refonte premium du bloc `Offres & profils`.
- Prochaine etape recommandee : poursuivre sur une matrice de fonctionnalites executive et compacte, afin de comparer clairement ce qui est inclus, limite, optionnel ou reserve a des modules futurs.

### Mise a jour ciblee - Matrice de fonctionnalites executive du jeudi 6 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la section `Offres & profils` integre maintenant une matrice de fonctionnalites executive et compacte comparant les offres simulees `Essentiel / Pro / Portefeuille` sur une lecture `Inclus / Limite / Option / Futur`.
- Decision de pilotage : cette matrice sert a rendre la promesse commerciale et les limites de chaque hypothese beaucoup plus lisibles pour un arbitrage direction, sans attendre un futur editeur complet ou une vraie persistance admin.
- Limites connues : la matrice reste statique, sans edition, sans liaison a des droits, sans moteur de pricing et sans source canonique de fonctionnalites. Elle clarifie la lecture mais ne constitue pas encore une verite produit executable.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres ajout de la matrice de fonctionnalites executive.
- Prochaine etape recommandee : soit basculer vers un mini editeur visuel des offres simulees, soit poursuivre le nettoyage editorial global de la page `Pilotage` pour harmoniser encore la densite des sections restantes.

### Mise a jour ciblee - Mini editeur visuel des offres simulees du jeudi 6 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la section `Offres & profils` integre maintenant un mini editeur visuel non editable dans les cartes d'offres simulees, avec badges, volume de biens, volume d'utilisateurs, niveau de support, modules visibles et nombre de limites clefs.
- Decision de pilotage : cette surcouche ne cherche pas encore a devenir un vrai formulaire admin ; elle sert a rendre les hypotheses d'offres beaucoup plus tangibles et discutables en reunion, sans rajouter de complexite technique ou de risque Stripe.
- Limites connues : les valeurs restent statiques et editoriales, sans edition ni persistence. Ce mini editeur est une projection UX de la future brique `offer editor`, pas encore une implementation metier complete.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres ajout du mini editeur visuel des offres simulees.
- Prochaine etape recommandee : poursuivre soit par un nettoyage editorial global de la page `Pilotage`, soit par une couche de priorisation plus nette sur `Tests tarifaires` et `Decisions` pour terminer l'harmonisation executive du module.

### Mise a jour ciblee - Nettoyage editorial et renforcement executive de la page Pilotage du jeudi 6 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la page `Pilotage` et l'onglet `Modele economique` ont ete relus et simplifies pour une lecture plus direction. Plusieurs formulations ont ete raccourcies, les messages repetitifs ont ete reduits et les blocs `Conditions avant acceleration`, `Narration board / investisseur` et le hero du module economique portent des intitules plus clairs.
- Realite produit : le rendu visuel a ete pousse vers une lecture plus `board / executive` avec un hero plus affirme, une hierarchie typographique plus nette, des espacements plus reguliers, des cartes plus homogenes, des onglets mieux incarnes et des tableaux plus lisibles.
- Decision de pilotage : cette evolution reste une mise en gamme UX/UI et editoriale. Elle ne change ni les hypotheses business, ni les donnees, ni la regle de separation stricte entre offre reelle, simulation et production Stripe.
- Limites connues : le contenu reste encore majoritairement editorial et statique. La page raconte mieux la strategie et les arbitrages, mais elle ne devient pas pour autant un reporting business canonique automatise.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres nettoyage editorial et renforcement visuel de la page `Pilotage`.
- Prochaine etape recommandee : finir l'harmonisation executive sur `Tests tarifaires` et `Decisions`, ou commencer a brancher des donnees plus canoniques pour faire converger la narration vers un vrai reporting business.

### Mise a jour ciblee - Reorganisation pleine largeur de la page Pilotage du jeudi 6 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : l'acces rapide affiche a droite dans le layout `DashboardLayout` a ete retire de la page `Pilotage` en conservant une prop `actions` vide pour rester compatible avec le composant. La page gagne une lecture plus sobre et moins dispersee.
- Realite produit : l'onglet `Modele economique` a ete reequilibre en pleine largeur sur ses blocs clefs. Le hero economique n'est plus coupe en une grande colonne et une colonne etroite ; les notes de cadrage se lisent maintenant sur toute la largeur disponible avec une organisation plus stable.
- Realite produit : plusieurs sections du module `Vue d'ensemble`, `Tests tarifaires`, `Decisions` utilisent des panneaux pleine largeur au lieu d'un empilement en deux colonnes trop serre, afin d'ameliorer la lisibilite des tableaux et la perception executive de la page.
- Decision de pilotage : cette reorganisation privilegie une lecture plus claire et plus professionnelle de gauche a droite, avec moins d'effets de fragmentation visuelle et plus d'espace pour les contenus de pilotage.
- Limites connues : cette evolution reste une amelioration de structure et de mise en page. Elle ne change ni les donnees, ni le niveau d'automatisation business, ni la nature encore editoriale de plusieurs blocs.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres reorganisation pleine largeur de la page `Pilotage`.
- Prochaine etape recommandee : harmoniser ensuite de la meme maniere `Comparaison` et `Simulations` si tu veux une lecture encore plus board-level, ou bien reduire encore la densite textuelle de certains tableaux.

### Mise a jour ciblee - Realignement tarifaire des onglets Marche, Finance et Modele economique du jeudi 6 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/economic-model/data.ts`, `docs/master-plan-planetls.md`
- Realite produit : la page `/dashboard/admin/pilotage` n'affiche plus un cadrage principal base sur `99 Ã¢â€šÂ¬ / 149 Ã¢â€šÂ¬`. Les onglets `Marche & offre`, `Finance` et `Modele economique` convergent maintenant vers une gamme de travail `29 Ã¢â€šÂ¬ HT / mois / 49 Ã¢â€šÂ¬ HT / mois / sur devis`, plus proche de l'offre Stripe reelle a `29 Ã¢â€šÂ¬` et plus defendable en phase de validation terrain.
- Realite produit : la section `Finance` projette maintenant ses scenarios sur cette base `29 / 49 / sur devis`, avec commission retiree des scenarios d'entree et maintenue seulement comme hypothese secondaire sur le cas `sur devis`.
- Realite produit : le module `Modele economique` traite desormais la `strategie B - tarification par niveau` comme direction de test prioritaire. Les cartes d'offres simulees, les simulations et le backlog de tests tarifaires ont ete realignes sur `29 Ã¢â€šÂ¬ / 49 Ã¢â€šÂ¬ / sur devis`.
- Decision de pilotage : la commission n'est plus le message principal du cockpit business. Elle reste une option a reevaluer plus tard seulement si PlanetLS prouve une vraie valeur d'intermediation et une execution suffisamment robuste.
- Limites connues : cette convergence reste editoriale et strategique. Aucun editeur admin persistant, aucun moteur de calcul dynamique et aucune modification Stripe ou checkout n'ont ete ajoutes dans ce lot.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres realignement tarifaire des onglets `Marche`, `Finance` et `Modele economique`.
- Prochaine etape recommandee : utiliser cette version comme base d'entretien terrain, documenter les retours sur `29 / 49 / sur devis`, puis seulement decider si l'hybride ou la commission meritent de revenir dans la narration principale.

### Mise a jour ciblee - Tableau financier concret `qui paie quoi` du jeudi 6 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `docs/master-plan-planetls.md`
- Realite produit : l'onglet `Finance` de `/dashboard/admin/pilotage` ne se limite plus aux scenarios et a l'economie unitaire. Il expose maintenant un bloc concret `Qui paie quoi selon le parc gere` avec une lecture `90 jours`, trois jalons de validation et un tableau operable `profil / nombre de biens / accompagnement / prix / payeur naturel / lecture terrain`.
- Decision de pilotage : la grille tarifaire est desormais pensee comme outil d'entretien et de proposition commerciale immediate, pas seulement comme hypothese abstraite de business plan. Le cadrage `29 Ã¢â€šÂ¬ / 49 Ã¢â€šÂ¬ / sur devis` gagne ainsi une traduction plus exploitable face aux prospects.
- Limites connues : le tableau reste editorial et non persistant. Il ne calcule pas automatiquement les montants selon des donnees client reelles et ne remplace pas encore un futur configurateur d'offre.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres ajout du tableau `Qui paie quoi selon le parc gere` dans l'onglet `Finance`.
- Prochaine etape recommandee : si les retours terrain convergent, transformer ensuite cette grille en script commercial ou en mini configurateur de proposition, sans toucher a Stripe tant que le modele n'est pas valide.

### Mise a jour ciblee - Consolidation desktop de la page Pilotage du vendredi 7 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la page `/dashboard/admin/pilotage` renforce sa lecture desktop sur ecran classique. Les grilles principales `highlights`, `summary`, `roadmap` et les cartes du nouveau bloc finance gagnent des largeurs minimales plus stables, des retours a la ligne plus robustes et une meilleure repartition des colonnes.
- Realite produit : la barre d'onglets principale adopte maintenant une lecture plus propre en desktop large avec cinq colonnes mieux reparties, au lieu d'un simple ruban horizontal qui pouvait paraitre serre ou desequilibre.
- Decision de pilotage : cette evolution privilegie la lisibilite executive et la stabilite du layout avant toute nouvelle profondeur metier. Elle cherche a reduire les debordements de texte et l'effet de cartes trop compressees sans changer la logique business.
- Limites connues : cette passe reste surtout CSS et composition. Elle ne constitue pas encore un audit responsive complet ni une revue pixel-perfect de toutes les tables ou de tous les contenus longs.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 apres consolidation desktop de la page `Pilotage`.
- Prochaine etape recommandee : faire ensuite une verification visuelle navigateur des ecrans desktop les plus denses `Finance`, `Modele economique`, `Controle` si tu veux pousser la qualite de finition avant d'autres ajouts.

### Mise a jour ciblee - Verification visuelle desktop de Finance et allegement du cockpit le vendredi 7 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `src/components/dashboard/DashboardLayout/DashboardLayout.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : une verification visuelle navigateur reelle a ete menee sur `/dashboard/admin/pilotage` en desktop via Playwright local avec quick login administrateur. Elle a confirme que l'ancien bloc `Faire maintenant` etait visuellement parasite et que la lecture `Finance` restait trop comprimee dans le cockpit.
- Realite produit : la page `Pilotage` masque maintenant le bloc d'actions vides du `DashboardLayout` via `hideQuickActions`, ce qui retire la zone morte `Actions rapides / Faire maintenant` en bas du cockpit business.
- Realite produit : l'onglet `Finance` bascule desormais sur une grille dediee pleine largeur, plus adaptee aux tableaux et au bloc `Qui paie quoi selon le parc gere`. La colonne principale du `DashboardLayout` a aussi ete reequilibree en desktop large pour desserrer la lecture face au rail lateral.
- Decision de pilotage : sur les ecrans denses de business plan, la priorite est la lisibilite executive et la lecture des tableaux, pas la symetrie stricte avec les autres cockpits admin.
- Limites connues : la verification visuelle a surtout valide `Finance` et la structure generale de `Pilotage`. L'onglet `Modele economique` merite encore une verification navigateur dediee si l'on veut conclure la revue desktop lourde de cette page.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 ; capture navigateur desktop locale `tmp-pilotage-finance-final.png` relue pour confirmer l'amelioration de la densite sur `Finance`.
- Prochaine etape recommandee : verifier ensuite `Modele economique` avec la meme methode navigateur et decider si son propre layout doit lui aussi passer en lecture plus pleine largeur sur certaines sections.

### Mise a jour ciblee - Verification visuelle desktop de Modele economique le vendredi 7 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : une verification visuelle navigateur reelle a ete menee sur l'onglet `Modele economique` de `/dashboard/admin/pilotage` en desktop via Playwright local avec quick login administrateur. La capture a confirme l'absence de debordement majeur, mais aussi une densite encore trop forte dans plusieurs grilles internes a cause du cockpit lateral.
- Realite produit : les sections les plus chargees du module economique ont ete desserrees pour un ecran d'ordinateur classique. Les grilles `Strategies`, `Offres & profils`, `Simulations`, `Comparaison` et la rangee de reperes utilisent maintenant moins de colonnes par defaut, afin de privilegier la lisibilite des cartes et tableaux dans le layout reel.
- Decision de pilotage : sur ce type d'ecran, il vaut mieux afficher moins de cartes par ligne et garder des contenus lisibles plutot que chercher une densite maximaliste qui degrade la lecture executive.
- Limites connues : cette passe reste une optimisation de layout. Le contenu du module `Modele economique` demeure largement editorial et statique, et certaines sections pourraient encore evoluer si le cockpit lateral change de largeur plus tard.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 ; captures navigateur desktop locales `tmp-pilotage-modele-economique.png` puis `tmp-pilotage-modele-economique-after.png` relues pour confirmer l'amelioration du confort de lecture.
- Prochaine etape recommandee : si tu veux pousser encore la finition, faire ensuite une passe visuelle dediee sur `Controle detaille` ou simplifier encore les tableaux les plus longs du module economique avant d'ajouter de nouvelles briques.

### Mise a jour ciblee - Repli responsive du rail lateral et verification desktop de Controle detaille le vendredi 7 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/components/dashboard/DashboardLayout/DashboardLayout.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : une verification visuelle navigateur reelle a ete menee sur `/dashboard/admin/controle` en desktop, avec un focus sur le rail lateral `Pilotage admin / Profil / Activite recente / Notifications / Acces rapides`. La lecture etait correcte en grand desktop, mais trop tendue sur une largeur plus classique de type `1280 px`.
- Realite produit : le layout partage `DashboardLayout` adapte maintenant le rail lateral selon la largeur d'ecran. Sur les desktops intermediaires, la colonne de droite ne reste plus rigide : elle repasse sous le contenu principal dans une version compacte en deux colonnes, ce qui supprime le risque de chevauchement avec la zone centrale. Sur les ecrans plus larges, le rail lateral reste present a droite avec une largeur un peu mieux calibree.
- Decision de pilotage : ce comportement responsive devient la regle commune des cockpits admin denses. L'objectif n'est pas de forcer une symetrie de dashboard a tout prix, mais de proteger la lisibilite reelle des pages les plus lourdes selon la largeur disponible.
- Limites connues : cette passe traite surtout le layout partage et la collision potentielle du rail lateral. Elle ne revoit pas encore le contenu editorial de tous les panneaux secondaires ni la pertinence fonctionnelle de chaque carte du rail.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 ; captures navigateur desktop locales `tmp-controle-desktop-before.png`, `tmp-controle-desktop-1280-before.png` et `tmp-controle-desktop-1280-after.png` relues pour confirmer le repli propre du rail sur desktop intermediaire.
- Prochaine etape recommandee : si tu veux aller plus loin, on peut ensuite decider quels blocs du rail lateral doivent rester visibles partout, etre compacts, ou etre masques selon la page `Pilotage / Controle / Developpement`.

### Mise a jour ciblee - Verification desktop de Developpement sans correction supplementaire le vendredi 7 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `docs/master-plan-planetls.md`
- Realite produit : une verification visuelle navigateur reelle a ete menee sur `/dashboard/admin/developpement` en desktop intermediaire `1280 px` apres la mise a jour responsive du `DashboardLayout`. La page reste dense par nature, mais aucun chevauchement critique du rail lateral avec le contenu principal n'a ete observe dans cette configuration.
- Decision de pilotage : aucune correction CSS locale n'a ete ajoutee sur `Developpement` a ce stade. Le comportement partage du layout suffit actuellement et evite d'introduire des divergences inutiles entre les cockpits admin.
- Limites connues : la page `Developpement` reste tres longue et tres chargee editorialement. La prochaine amelioration pertinente serait davantage une simplification de contenu ou de navigation interne qu'un nouveau durcissement du layout.
- Verification : capture navigateur desktop locale `tmp-developpement-desktop-1280-before.png` relue le vendredi 7 aout 2026 pour confirmer la stabilite visuelle sans modification supplementaire.
- Prochaine etape recommandee : si l'on continue sur cette page, travailler ensuite la reduction de densite editoriale, la priorisation des sections ou un acces plus rapide aux blocs les plus utiles du `Master Plan`.

### Mise a jour ciblee - Lecture guidee du Master Plan dans Developpement le vendredi 7 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : l'onglet `Master Plan` de `/dashboard/admin/developpement` ne s'ouvre plus comme une pile exhaustive sans orientation. Une `lecture guidee` devient le mode par defaut : elle met en avant les sections actives `P0 / P1 / bloquees / en cours / partielles` et les grands reperes structurants, tout en laissant une option explicite `Tout afficher`.
- Realite produit : un bloc editorial compact `Lecture recommandee` oriente maintenant la page vers `quoi lire d'abord`, avec un rappel du mode courant et une courte liste des priorites les plus utiles a lire avant de descendre dans tout le document.
- Decision de pilotage : sur une page aussi dense, la priorite n'est plus de tout montrer immediatement mais de reduire la charge cognitive initiale. L'exhaustivite reste accessible, mais elle n'est plus imposee comme experience de premiere lecture.
- Limites connues : cette passe simplifie surtout l'entree dans le Master Plan. Elle ne reecrit pas encore le contenu source du document, qui reste long par nature, ni la structure de toutes les sous-sections.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 ; capture navigateur desktop locale `tmp-developpement-desktop-1280-after-guided.png` relue pour confirmer une entree de page plus digeste et plus guidee.
- Prochaine etape recommandee : si tu veux aller plus loin, la suite la plus utile serait soit une reduction editoriale du contenu du Master Plan lui-meme, soit des presets de lecture plus precis `blocages / P1 / decisions recentes / feuille de route`.

### Mise a jour ciblee - Presets de lecture et correction du texte corrompu dans Developpement le vendredi 7 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : le texte corrompu de la mise a jour `Pilotage Business du lundi 3 aout 2026` a ete corrige directement dans `docs/master-plan-planetls.md`. La section retrouve une lecture normale avec accents, statuts et contenu metier lisibles dans la page `Developpement`.
- Realite produit : l'onglet `Master Plan` expose maintenant trois presets de lecture rapides `Blocages`, `P1`, `Decisions recentes`. Ils appliquent directement les bons filtres et ouvrent une lecture plus ciblee sans demander a l'utilisateur de regler manuellement recherche, statut et priorite.
- Decision de pilotage : sur une page documentaire dense, les presets servent de raccourcis de lecture et reduisent la friction pour retrouver vite les zones vraiment utiles au quotidien.
- Limites connues : le preset `Decisions recentes` repose sur la structure documentaire actuelle `Mise a jour ciblee` / `Ajout du` du Master Plan. Si cette convention change fortement plus tard, il faudra reajuster la logique.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 ; verification navigateur locale des presets via `tmp-developpement-preset-blocages.png`, `tmp-developpement-preset-p1.png` et `tmp-developpement-preset-decisions.png`.
- Prochaine etape recommandee : si tu veux poursuivre, on peut ensuite ajouter des presets complementaires `Roadmap prete`, `Bugs critiques`, `Ajouts de la semaine`, ou transformer ces presets en puces persistantes dans l'URL.

### Mise a jour ciblee - Suppression du bottom nav admin en doublon et nouveaux presets de lecture le vendredi 7 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/components/dashboard/DashboardLayout/DashboardLayout.tsx`, `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : le `bottomNav` du `DashboardLayout` n'est plus rendu pour la persona `admin`. Le dock mobile d'administration dedie reste la seule navigation basse sur mobile, ce qui supprime le doublon avec `DashboardMobileExperience`.
- Realite produit : la vue `Developpement` propose maintenant deux presets de lecture supplementaires `Roadmap prete` et `Bugs critiques`, en plus de `Blocages`, `P1` et `Decisions recentes`. Les presets peuvent desormais pointer soit vers le `Master Plan`, soit vers les panneaux `Roadmap` et `Mission Control` selon le besoin de lecture.
- Decision de pilotage : la navigation mobile admin doit rester unique et lisible. De la meme maniere, les raccourcis de lecture doivent orienter vers le bon panneau au lieu de forcer une lecture exhaustive ou des manipulations de filtres inutiles.
- Limites connues : les presets `Roadmap prete` et `Bugs critiques` reposent encore sur les panneaux documentaires actuels, pas sur des URLs ou des ancres persistantes partageables.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 ; verification visuelle mobile locale `tmp-admin-mobile-dock-only.png` relue pour confirmer la disparition du `bottomNav` admin doublon, et capture `tmp-developpement-presets-extra.png` pour la presence des nouveaux presets.
- Prochaine etape recommandee : si tu veux pousser la logique, on peut ensuite rendre les presets partageables via l'URL ou memoriser le dernier preset choisi pour chaque administrateur.

### Mise a jour ciblee - Audit de l'existant Business Plan du vendredi 7 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `docs/business-plan-audit.md`, `docs/master-plan-planetls.md`
- Realite produit : un audit cible du module `Business Plan / Pilotage Business` a ete formalise dans `docs/business-plan-audit.md` a partir du code et des documents existants. Il confirme que la page `/dashboard/admin/pilotage` constitue bien la surface principale, mais que le coeur du business plan reste majoritairement editorial et code en dur dans `page.tsx`, `economic-model/data.ts`, `EconomicModelTab.tsx`, `validationData.ts` et `riskData.ts`.
- Realite produit : l'audit confirme aussi que plusieurs briques existent sans etre branchees dans la page principale `RiskRegister`, `LeanValidationDashboard`, `StrategicDecisionAssistant`, `PromptLibraryCenter`, `BusinessCollapsibleSection`, ainsi qu'un atelier `business-strategy` plus modulaire mais base sur `localStorage` et non relie a une source de verite admin.
- Decision de pilotage : la prochaine transformation du Business Plan ne doit pas commencer par une refonte UI. La priorite recommandee est de centraliser les donnees business `pricing, abonnements, risques, roadmap, KPI, decisions, personas business`, de clarifier partout la difference entre `donnee reelle / hypothese / simulation`, puis seulement de reconnecter les briques existantes les plus utiles.
- Limites connues : l'audit ne cree ni persistance admin, ni schema canonique, ni mise a jour automatique des benchmarks. Il documente l'etat reel, les doublons, les manques et l'ordre de priorite recommande sans encore transformer l'architecture.
- Verification : audit documentaire produit dans `docs/business-plan-audit.md` le vendredi 7 aout 2026 apres relecture des surfaces `pilotage`, `modele economique`, `validation marche`, `registre des risques`, `abonnement Concierge Pro` et des documents business associes.
- Prochaine etape recommandee : extraire d'abord les donnees editoriales du cockpit business vers un referentiel TypeScript centralise et versionnable, puis decider quelles briques existantes doivent etre rebranchees telles quelles ou refractorees.

### Mise a jour ciblee - Restructuration du centre de pilotage Business Plan le vendredi 7 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `src/app/dashboard/admin/pilotage/businessPlanData.ts`, `docs/master-plan-planetls.md`
- Realite produit : la page `/dashboard/admin/pilotage` n'est plus un simple enchainement d'onglets editoriaux `Vue d'ensemble / Marche / Finance / Modele economique / Execution`. Elle devient un `centre de pilotage strategique SaaS` organise par grands blocs `Synthese & vision / Marche & clients / Business model / Produit & IA / Pilotage & risques / Annexes`, avec sous-sections explicites, navigation secondaire par section, accordÃƒÂ©ons repliables, cartes synthetiques, badges de statut et barre de maturite globale du Business Plan.
- Realite produit : les 22 sections cibles du Business Plan `Synthese, Vision, Probleme marche, Solution, Proposition de valeur, Personas, Etude de marche, Concurrence, Business Model Canvas, Modele economique, Tarification, Go-To-Market, Acquisition, Roadmap, Strategie IA, KPI SaaS, Previsions financieres, SWOT, Risques, Hypotheses, Plan d'action, Annexes` sont maintenant structurees dans un referentiel TypeScript dedie `businessPlanData.ts`. Cette couche centralise statuts, ordre, evidence et une partie importante des donnees editoriales deja presentes `benchmark, pricing, TAM/SAM/SOM, roadmap, SWOT reconstruit, canaux d'acquisition, etc.` sans casser les modules existants.
- Realite produit : les briques detaillees deja disponibles sont conservees et rebranchees dans la nouvelle architecture au lieu d'etre supprimees : `EconomicModelTab` pour le modele economique, `RiskRegister` pour le registre des risques, `LeanValidationDashboard` pour les hypotheses et la validation marche, `StrategicDecisionAssistant` dans les annexes. La page garde aussi sa compatibilite avec les donnees live `api/admin/overview`, `api/admin/operations` et `api/kpis/overview` pour afficher traction, alertes et KPI SaaS reels.
- Decision de pilotage : cette version privilegie une `restructuration non destructive` et une meilleure lisibilite executive, sans transformer encore le cockpit en back-office d'edition persistant. Les contenus partiels ou fragiles sont explicites via les statuts `A completer / A valider / Valide / A actualiser`, ce qui aligne mieux l'UI sur l'audit realise juste avant.
- Limites connues : le referentiel `businessPlanData.ts` centralise surtout des donnees editoriales front et non une persistence admin canonique. Plusieurs sections restent volontairement `partielles` ou `a completer` `SWOT, acquisition, strategie IA, previsions financieres, etude de marche`, car aucune donnee reelle supplementaire n'a ete inventee. Le `PromptLibraryCenter` n'est toujours pas branche dans la page principale.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 apres restructuration complete de `/dashboard/admin/pilotage`.
- Prochaine etape recommandee : poursuivre par l'extraction des derniers blocs editoriaux encore locaux vers le referentiel central, puis choisir si une future phase doit ajouter une persistence admin pour les hypotheses, decisions, KPI business et mises a jour de benchmark.

### Mise a jour ciblee - Centralisation du modele de donnees Business Plan le vendredi 7 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/business-plan-reference.ts`, `src/app/dashboard/admin/pilotage/businessPlanData.ts`, `docs/business-plan-data-model.md`, `docs/master-plan-planetls.md`
- Realite produit : le Business Plan admin dispose maintenant d'une `source de verite centralisee` locale et typee dans `business-plan-reference.ts`. Cette couche ne remplace pas la base applicative et n'ajoute aucune migration ; elle unifie les donnees strategiques qui etaient dispersees entre contenus editoriaux, modele economique, validation marche et registre de risques.
- Realite produit : chaque bloc important du Business Plan peut desormais porter des metadonnees explicites `value, source, lastUpdatedAt, confidence, status, comment, owner`. Les statuts canoniques deviennent `draft / to_validate / validated / outdated`, puis sont adaptes vers les badges UI existants `A completer / A valider / Valide / A actualiser` pour preserver la compatibilite du cockpit.
- Realite produit : `businessPlanData.ts` n'est plus la source metier principale. Il devient une couche d'adaptation UI qui derive les tableaux et listes existants depuis le referentiel central, ce qui reduit les doublons et prepare une evolution future sans casser `page.tsx`.
- Decision de pilotage : tant que le Business Plan reste principalement un outil de cadrage interne, la solution la plus simple et robuste est de conserver ce referentiel en TypeScript local plutot que d'ouvrir prematurement une nouvelle persistance Supabase ou un CMS admin.
- Limites connues : plusieurs donnees restent encore des hypotheses ou des simulations `benchmark concurrence, TAM/SAM/SOM non chiffres, scenarios financiers, certaines priorites personas`. Le referentiel clarifie leur statut, mais ne les transforme pas encore en donnees externes verifiees.
- Verification : documentation de gouvernance ajoutee dans `docs/business-plan-data-model.md` le vendredi 7 aout 2026 ; build a revalider apres branchement complet de l'adaptateur UI.
- Prochaine etape recommandee : faire remonter progressivement plus de metadata dans l'interface `source, date, confiance, proprietaire`, puis decider plus tard s'il faut une vraie edition admin persistante.

### Mise a jour ciblee - Ajout du Business Model Canvas interactif le vendredi 7 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/business-plan-reference.ts`, `src/app/dashboard/admin/pilotage/BusinessModelCanvas.tsx`, `src/app/dashboard/admin/pilotage/BusinessModelCanvas.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la section `Business Model Canvas` de `/dashboard/admin/pilotage` n'est plus une simple grille statique. Elle devient un module interactif avec `vue synthetique / vue detaillee`, score de completude, compte d'hypotheses `validees / a valider`, details repliables par bloc et liens directs vers les autres sections du Business Plan.
- Realite produit : les 9 blocs canoniques du Canvas `Segments clients, Proposition de valeur, Canaux, Relations clients, Sources de revenus, Ressources cles, Activites cles, Partenaires cles, Structure de couts` sont maintenant documentes dans le referentiel central `business-plan-reference.ts` avec synthese courte, details, statut, hypotheses associees, points restant a valider et sections connexes.
- Decision de pilotage : aucune donnee commerciale nouvelle n'a ete inventee. Quand l'information reste incomplete, le Canvas l'affiche explicitement comme `A definir` ou `Hypothese a valider`, ce qui protege la lisibilite executive sans sur-promettre un modele economique non prouve.
- Limites connues : le score de completude reste un indicateur de structuration documentaire et non une mesure de validation marche. Plusieurs hypotheses du Canvas demeurent volontairement non validees tant qu'elles ne sont pas soutenues par des cohortes, des pilotes ou des donnees business observees.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 apres integration du Canvas interactif dans `/dashboard/admin/pilotage`.
- Prochaine etape recommandee : si besoin, enrichir ensuite le Canvas avec l'affichage visible des sources, dates et niveaux de confiance par bloc, puis eventuellement connecter certaines validations a de vrais KPI business.

### Mise a jour ciblee - Construction de la section Marche & Concurrence du vendredi 7 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `src/app/dashboard/admin/pilotage/business-plan-reference.ts`, `docs/master-plan-planetls.md`
- Realite produit : les sections `Etude de marche`, `Personas / segments clients` et `Concurrence` du Business Plan admin ont ete reconstruites comme surfaces de decision plutot que comme simple contenu descriptif. Elles distinguent maintenant explicitement `faits verifies / estimations / hypotheses`, affichent `source, date, confiance` et reposent sur un referentiel central au lieu d'un texte eparpille dans la page.
- Realite produit : la partie `Marche` expose des groupes structures `definition, segments, tendances, taille macro, TAM/SAM/SOM, facteurs de croissance, freins, reglementation, opportunites`. Les chiffres macro verifies s'appuient sur des sources externes revues le vendredi 7 aout 2026 `Atout France, Insee, Service Public`, tandis que les perimetres `SAM` et `SOM` restent volontairement affiches comme hypotheses ou estimations internes quand le projet ne dispose pas encore d'un chiffrage canonique defendable.
- Realite produit : la partie `Personas` ne liste plus seulement les profils. Elle expose pour `proprietaire, concierge independant, conciergerie, artisan/prestataire` les champs de decision `probleme, besoins, frequence potentielle, disposition a payer, fonctionnalites importantes, objections, declencheurs d'achat`, avec nature de preuve explicite pour chaque ligne.
- Realite produit : la partie `Concurrence` remplace l'ancien simple benchmark par une matrice comparative exploitable `concurrent, cible, prix si connu, marketplace, gestion missions, devis, paiements, reseau professionnel, automatisation, IA, differenciation, forces, faiblesses`, plus une carte de positionnement visuelle de PlanetLS face aux acteurs revus.
- Decision de pilotage : aucune estimation n'est presentee comme un fait. Quand la source publique revue ne permet pas de conclure sur une fonctionnalite ou un chiffrage, le cockpit conserve des formulations prudentes `non visible sur la source revue`, `A definir` ou `Hypothese a valider`.
- Limites connues : plusieurs positions concurrentielles et le nuage de positionnement restent des estimations de lecture strategique, pas des mesures de marche normalisees. Les valeurs `TAM / SAM / SOM` ne doivent toujours pas etre traitees comme modele financier stabilise tant qu'une methode de calcul canonique n'est pas documentee.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 apres integration des nouveaux blocs `Marche & Concurrence`.
- Prochaine etape recommandee : si besoin, ajouter ensuite une couche de revue periodique des benchmarks `prix / fonctionnalites / reglementation`, ou connecter certaines hypotheses de disposition a payer a de vrais resultats d'entretiens et de pilotes.

### Mise a jour ciblee - Simulateur Tarification & Revenus du vendredi 7 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `src/app/dashboard/admin/pilotage/economic-model/types.ts`, `src/app/dashboard/admin/pilotage/economic-model/data.ts`, `src/app/dashboard/admin/pilotage/economic-model/PricingRevenueSimulator.tsx`, `docs/master-plan-planetls.md`
- Realite produit : la section `Tarification et abonnements` du Business Plan admin embarque maintenant un simulateur complet `Tarification & revenus` distinct de la production. Il permet de comparer des offres de travail `FREE / ESSENTIAL / PRO / BUSINESS` et trois scenarios `Prudent / Central / Ambitieux` sans modifier l'offre commerciale active ni Stripe.
- Realite produit : chaque offre de travail expose `cible, prix mensuel, prix annuel calcule, fonctionnalites, limites, commissions eventuelles, couts estimes, marge brute estimee, taux de conversion estime, nombre de clients, MRR, ARR`. Les hypotheses `prix, remise annuelle, commission, cout estime, conversion, clients par scenario, mix annuel, GMV marketplace` sont editables directement dans le cockpit et recalculent automatiquement `MRR, ARR, abonnes, ARPU, revenu marketplace, commissions, revenu total`.
- Realite produit : le simulateur reutilise les hypotheses deja presentes dans le projet `29 / 49 / 95, offre Stripe Concierge Pro, logique sur devis, scenario prudent/central/ambitieux`, mais les recadre dans une structure plus lisible pour la decision. Les noms `FREE / ESSENTIAL / PRO / BUSINESS` sont explicitement traites comme labels de travail non definitifs.
- Decision de pilotage : l'offre `Conciergerie Pro` existante reste la seule reference de production. Le simulateur ne pousse aucune modification vers le site public, le checkout, ni les produits Stripe. Il sert uniquement a explorer la gamme et les revenus potentiels.
- Limites connues : les volumes clients, taux de conversion, couts unitaires, GMV marketplace et marges brutes restent des hypotheses modifiables de simulation et non des donnees financieres acquises. Le calcul de commissions est volontairement simplifie a partir du GMV mensuel renseigne dans chaque scenario.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 apres integration du simulateur dans `/dashboard/admin/pilotage`.
- Prochaine etape recommandee : si besoin, relier plus tard certaines hypotheses du simulateur a des donnees observees `pilotes, cohortes, entretiens pricing, MRR reel`, puis clarifier quels paliers doivent devenir de vraies offres candidates a tester publiquement.

### Mise a jour ciblee - Modele de previsions financieres du vendredi 7 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/economic-model/FinancialForecastModel.tsx`, `src/app/dashboard/admin/pilotage/economic-model/financialModel.ts`, `docs/business-plan-financial-model.md`, `docs/master-plan-planetls.md`
- Realite produit : la section `Previsions financieres` du Business Plan admin n'affiche plus un simple tableau statique de scenarios. Elle devient un vrai module de modelisation SaaS sur 5 ans avec separation explicite `Hypotheses / Calculs / Resultats`, navigation par scenario `Prudent / Central / Ambitieux`, edition locale des hypotheses, cartes KPI, tableau annuel detaille et lectures visuelles `revenus versus couts`, tresorerie, break-even et runway.
- Realite produit : toutes les formules sont maintenant centralisees dans `economic-model/financialModel.ts`. Le cockpit `/dashboard/admin/pilotage` consomme ce moteur unique via `FinancialForecastModel`, ce qui reduit le risque de divergence entre calculs financiers et affichage UI.
- Realite produit : le modele couvre explicitement les variables demandees `nouveaux clients, conversion gratuit -> payant, churn, retention, abonnements, commissions marketplace, services complementaires, autres revenus, developpement, hebergement, Supabase, Vercel, API IA, paiement, marketing, freelances, support, juridique, comptabilite, autres SaaS` ainsi que les KPI `MRR, ARR, ARPU, CAC, LTV, LTV/CAC, churn, marge brute, burn rate, runway, seuil de rentabilite`.
- Decision de pilotage : ce moteur reste une simulation interne de business plan. Il ne constitue ni une comptabilite officielle, ni une source de donnees de production, ni une modification des offres commerciales live. Les hypotheses doivent rester relues et contestees a chaque apprentissage terrain.
- Limites connues : la section reste locale au front admin et non persistante. Le `MRR` affiche un run-rate mensuel global visible dans le cockpit et inclut les revenus mensuels annexes du scenario, pas seulement l'abonnement SaaS pur. Le `CAC`, la `LTV` et le `runway` restent tres sensibles aux hypotheses de conversion, churn, marge, marketing et tresorerie de depart.
- Verification : `npm run build` a relancer apres integration finale de la section `Previsions financieres`.
- Prochaine etape recommandee : reconnecter ensuite progressivement certaines hypotheses a des donnees observees `MRR reel, churn reel, couts infra, pilotes marketplace`, puis decider plus tard s'il faut une persistance admin des scenarios et de leur historique.

### Mise a jour ciblee - Cockpit strategique de premiere lecture du vendredi 7 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : l'arrivee sur `/dashboard/admin/pilotage` ne se limite plus a une hero editoriale puis a des onglets. La page expose maintenant, avant la navigation detaillee, un vrai `cockpit strategique` de premiere lecture avec cinq scores `maturite, Product-Market Fit, financier, marche, produit`, un bloc `KPI principaux`, une zone `A regarder en premier` et une lecture immediate des `prochaines decisions`.
- Realite produit : les signaux de tete de page sont derives de l'existant et non recrees en parallele. Le cockpit combine les statuts des sections du Business Plan, les KPI reels disponibles via `/api/kpis/overview`, les risques critiques, les hypotheses prioritaires, le pipeline commercial non transforme, les missions non facturees et l'anciennete des donnees marche pour faire remonter automatiquement les sujets a surveiller.
- Realite produit : la section `Synthese` du Business Plan a ete renforcee dans la meme logique. Elle affiche maintenant `Top 5 priorites`, `Top 5 risques`, `Top 5 hypotheses`, `Prochaines decisions` et `Dernieres modifications`, ce qui transforme la page en outil de pilotage plus immediat sans supprimer les modules detailles deja presents.
- Decision de pilotage : les KPI business encore non instrumentes `MRR reel, ARR reel, clients payants reels, conversion payante reelle, churn reel, CAC reel, LTV reelle` restent affiches honnÃƒÂªtement comme `A mesurer`, avec contexte issu du modele financier central ou des signaux produit existants. L'objectif est de montrer la verite actuelle plutot que de maquiller l'absence de mesure par des chiffres speculatifs.
- Limites connues : certains scores restent des heuristiques de pilotage derivees des statuts documentaires et des KPI disponibles, pas des scores scientifiques. La zone `Dernieres modifications` repose sur les dates de mise a jour du referentiel business local et non sur un historique persistant multi-auteur.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 apres integration du cockpit strategique dans `/dashboard/admin/pilotage`.
- Prochaine etape recommandee : si besoin, brancher ensuite une vraie source de verite pour les KPI business payants `MRR, clients payants, churn, CAC, LTV`, puis ajuster les scores pour qu'ils reposent davantage sur des mesures observees que sur la maturite documentaire.

### Mise a jour ciblee - Processus Business Impact Check du vendredi 7 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `docs/business-plan-maintenance.md`, `docs/business-plan-data-model.md`, `docs/master-plan-planetls.md`
- Realite produit : PlanetLS dispose maintenant d'un processus documentaire explicite de maintenance du Business Plan via `docs/business-plan-maintenance.md`. Le mecanisme `Business Impact Check` formalise les declencheurs, les zones du Business Plan a reviser, les actions autorisees sans validation humaine et les actions interdites `ne pas modifier automatiquement hypothese, prix, cout, chiffre de marche ou KPI strategique`.
- Realite produit : le process couvre explicitement les evolutions critiques `nouvelle fonctionnalite, suppression, changement d'abonnement, changement de tarif, nouveau persona, nouvelle source de revenu, nouvelle integration IA, nouveau service marketplace, changement d'architecture significatif, nouveau cout recurrent` et impose de verifier les impacts potentiels sur `proposition de valeur, roadmap, modele economique, tarification, couts, revenus, marche, concurrence, risques, KPI`.
- Realite produit : la gouvernance du referentiel central est renforcee. `docs/business-plan-data-model.md` reference maintenant le `Business Impact Check` comme regle de maintenance, et le `Master Plan` impose ce controle pour toute evolution importante susceptible d'affecter le Business Plan.
- Decision de pilotage : le systeme choisi reste volontairement simple et robuste. Il repose d'abord sur une discipline documentaire et un marquage `A actualiser / A valider` plutot que sur une automatisation risquee qui pourrait modifier silencieusement des donnees strategiques.
- Limites connues : aucun moteur automatique ne scanne encore les diffs git ou les fichiers modifies pour produire seul un impact business. Le controle reste humain, guide et traÃƒÂ§able.
- Verification : documentation relue et integree au referentiel de pilotage le vendredi 7 aout 2026 ; aucun build non indispensable n'a ete relance car le lot est purement documentaire.
- Prochaine etape recommandee : si besoin, ajouter plus tard un template reutilisable dans le cockpit admin ou dans le journal de developpement pour saisir un `Business Impact Check` directement depuis l'interface.

### Mise a jour ciblee - Correction d'encodage et uniformisation des hero cards du jeudi 13 aout 2026

- Statut : `Partiel`
- Priorite : `P2 Important`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `.editorconfig`, `docs/master-plan-planetls.md`
- Realite produit : la page `/dashboard/admin/pilotage` corrige maintenant plusieurs libelles visibles casses par un melange UTF-8 / Windows-1252 `Controle, Developpement, desormais, controle operationnel`, ce qui restaure une lecture francaise correcte sur les zones hero et navigation du cockpit.
- Realite produit : les cartes hero et les cartes de scores/alertes de premiere lecture utilisent desormais une meme structure visuelle `icone dans un cartouche + label + valeur + aide`, avec plus d'espace entre pictogramme et texte pour eviter les collisions et heterogeneites de rythme.
- Decision de pilotage : la prevention minimale retenue dans ce lot est d'ajouter une racine `.editorconfig` imposant `charset = utf-8` et des fins de ligne LF afin de reduire le risque de nouveaux libelles casses lors des prochaines editions de contenu francais.
- Limites connues : le correctif cible la page `pilotage` et la prevention d'encodage future, mais le `Master Plan` lui-meme contient encore plusieurs traces historiques d'encodage hybride deja presentes avant ce lot ; un assainissement global du document reste a planifier separement pour ne pas melanger fond et forme.
- Contradictions detectees : le depot declare deja une normalisation UTF-8 du pilotage documentaire, mais des chaines corrompues restent visibles dans `docs/master-plan-planetls.md`, ce qui montre que la normalisation n'est pas complete a l'echelle de la documentation.
- Verification : `npm run build` PASS le jeudi 13 aout 2026 apres correction de `/dashboard/admin/pilotage`.
- Prochaine etape recommandee : etendre le meme controle aux autres pages admin denses et lancer ensuite un lot documentaire dedie pour nettoyer les accents restants dans `docs/master-plan-planetls.md` sans toucher aux contenus metier.

### Mise a jour ciblee - Tableau d'action concis pour la page Developpement du jeudi 13 aout 2026

- Statut : `En cours`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la page `/dashboard/admin/developpement` gagne un premier onglet `Plan d'action` affiche par defaut. Il reprend les sujets de reprise les plus utiles sous forme de tableau court `priorite / sujet / pourquoi maintenant / prochaine action / preuve / source`, afin d'orienter l'execution sans forcer la lecture immediate de tout le Master Plan.
- Realite produit : cette vue ne recopie pas tout l'audit externe. Les points deja couverts, contradictoires ou trop affirmatifs ont ete filtres ; par exemple la presence de `E2E_STRIPE_SECRET_KEY` dans la CI n'est pas remontee comme absence de configuration, et le besoin est reformule en `couverture E2E Stripe encore a fermer`.
- Decision de pilotage : la page Developpement doit redevenir un cockpit d'arbitrage concis. Le detail documentaire complet reste disponible via les autres onglets `Tableau fonctionnel`, `Mission Control`, `Roadmap`, `Memoire`, `Journal`, mais l'entree de page privilegie maintenant la meilleure prochaine action.
- Limites connues : le tableau reste un cadrage front local et non une persistance admin editable. Il synthetise un lot de reprise mais ne remplace ni les preuves du Master Plan ni la verification manuelle des sujets sensibles avant execution.
- Contradictions detectees : l'audit externe mentionne certaines pistes utiles mais aussi des affirmations deja depassees ou partielles dans le depot courant. Le lot documente explicitement cette filtration pour eviter d'ajouter du bruit ou de faux blocages dans le cockpit.
- Verification : `npm run build` a relancer apres integration finale de l'onglet `Plan d'action`.
- Prochaine etape recommandee : si la lecture convient, poursuivre par un second lot de simplification sur les onglets secondaires les plus lourds `Mission Control` et `Journal`, en gardant la meme logique `resume court -> detail sur demande`.

### Mise a jour ciblee - Simplification radicale de la page Developpement du jeudi 13 aout 2026

- Statut : `En cours`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la page `/dashboard/admin/developpement` n'est plus pensee comme un espace documentaire a onglets a parcourir longuement avant d'agir. Elle devient un cockpit court centre sur `ou j'en suis`, `prochaine action`, `blocages`, `en cours`, `pret a faire`, `termine` et `verifications rapides`.
- Realite produit : les informations longues, redondantes ou trop secondaires ne structurent plus la lecture principale. Le tableau d'action court reste present pour la reprise, mais la priorite est donnee a l'execution immediate plutot qu'a la consultation de couches multiples `Master Plan, Mission Control, Roadmap, Memoire, Journal`.
- Decision de pilotage : sur cette page, la complexite documentaire doit s'effacer derriere la decision quotidienne. La surface sert d'abord a reprendre le projet vite et proprement, pas a relire tout l'historique.
- Limites connues : le lot simplifie fortement l'interface visible, mais conserve encore du code historique non affiche dans le composant. Un nettoyage technique plus profond pourra venir ensuite si cette direction UX est validee.
- Contradictions detectees : l'ancienne page cherchait a etre a la fois cockpit de reprise, lecteur du Master Plan, journal, memoire technique et roadmap interactive. Cette polyvalence rendait la lecture trop lourde pour l'usage reel demande.
- Verification : `npm run build` a relancer apres simplification finale de la page `Developpement`.
- Prochaine etape recommandee : si ce format te convient, faire ensuite un lot de nettoyage du code mort et des imports/helpers devenus inutiles pour aligner la structure technique sur la nouvelle experience courte.

### Mise a jour ciblee - Tableau Pilotage des priorites pour la page Developpement du jeudi 13 aout 2026

- Statut : `En cours`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la page `/dashboard/admin/developpement` reprend maintenant explicitement une section `Pilotage des priorites` en tableaux separes `P0 / P1 / P2 / P3`, avec les colonnes `ID, Titre, Categorie, DifficultÃƒÂ©, Impact, Zones concernees`, dans un format proche de l'audit externe demande.
- Realite produit : cette presentation remplace le tableau d'action court trop minimal et sert de repere plus direct pour arbitrer `critique`, `avant lancement`, `amelioration importante` et `evolution future` sans replonger dans une page trop longue.
- Realite produit : le tableau `Pilotage des priorites` agrege maintenant aussi les priorites dispersees du Master Plan qui n'etaient pas dans la matrice initiale, avec dedoublonnage des sujets recouvrants comme le cockpit entrepreneurial, pour garder une vue complete mais encore concise.
- Realite produit : la matrice `P2` integre maintenant explicitement `P2-016 - Normaliser les reliquats ASCII/labels historiques du depot` pour transformer le reliquat d'hygiene francaise du code en vraie action de pilotage, au lieu de le laisser seulement en limite connue.
- Realite produit : la source UI du tableau `Pilotage des priorites` allait encore seulement jusqu'a `P2-029`, alors que le Master Plan portait deja `P2-030` a `P2-037`. La liste codee en dur de `MasterPlanViewer.tsx` est maintenant realignee sur le referentiel documentaire et affiche bien aussi le registre des automatisations, l'audit terrain et la cartographie `AS-IS / TO-BE`.
- Decision de pilotage : la page Developpement garde une lecture courte en tete `ou j'en suis, prochaine action, bloque, en cours, pret a faire, termine`, puis utilise le tableau `Pilotage des priorites` comme reference principale de travail.
- Limites connues : certaines lignes du tableau restent du cadrage de pilotage et non des tickets relies a une persistance de statut editable. La priorisation doit donc rester relue regulierement contre le code et le Master Plan.
- Verification : `npm run build` PASS apres integration finale du tableau `Pilotage des priorites`.
- Prochaine etape recommandee : si besoin, relier ensuite chaque ligne du tableau a une vue detaillee ou a un ticket source, sans recharger la page principale.

### Mise a jour ciblee - Lecture visuelle business pour la page Pilotage du jeudi 13 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la page `/dashboard/admin/pilotage` expose maintenant une lecture business plus directe avec des cartes `Positionnement PlanetLS`, `Concurrents directs`, `Concurrents indirects`, `Differenciation PlanetLS`, un tableau comparatif multi-dimensions simplifie, une synthese visuelle des ecarts, une roadmap technique `Architecture globale / MVP / V1 / V2 / Timeline` et un bloc marketing `Proposition de valeur / Messages cles / Segments / Identite narrative`.
- Realite produit : la surface principale a aussi ete reduite pour privilegier ce `Benchmark Pack Codex` en lecture courte ; le lot suivant a remplace le gros composant historique par une implementation plus legere centree sur cette seule experience, afin d'alleger vraiment le fichier et sa maintenance.
- Realite produit : la feuille `page.module.scss` a ete purgee dans le meme sens et ne garde plus que les classes encore consommees par cette version compacte, ce qui retire la dette de styles residuels heritee de l'ancienne page longue.
- Realite produit : la page a aussi ete remodularisee dans un esprit `UI pack` avec petits composants locaux reutilisables `SectionHeader`, grille de cartes benchmark et tableau comparatif dedie, afin de rapprocher la structure du besoin `Tailwind + shadcn/ui` sans casser le design system deja en place dans le depot.
- Decision de pilotage : cette page doit pouvoir servir a la fois de cockpit d'arbitrage interne et de support lisible pour expliquer rapidement PlanetLS a un prospect, un partenaire ou un investisseur sans replonger dans des matrices trop lourdes.
- Limites connues : la page garde encore d'autres sections analytiques du Business Plan, donc cette lecture visuelle n'efface pas la profondeur documentaire ; elle rend surtout les sections clefs plus actionnables.
- Verification : `npm run build` PASS apres recentrage de la page sur le `Benchmark Pack Codex`.

### Mise a jour ciblee - Hygiene UTF-8 pour le site francais du jeudi 13 aout 2026

- Statut : `En cours`
- Priorite : `P1 Prioritaire`
- ID priorite associee : `P2-018`
- Perimetre mis a jour : `src/app/layout.tsx`, `src/app/complete-registration/CompleteRegistrationPage.tsx`, `src/app/dashboard/missions/MissionDetailClient.tsx`, `src/app/components/dashboard/navbar/DashboardNavbar.tsx`, `scripts/check-encoding.mjs`, `package.json`, `docs/master-plan-planetls.md`
- Realite produit : un audit cible des surfaces visibles a confirme que le standard repo restait bien `UTF-8`, mais que plusieurs chaines francaises avaient deja ete mojibakees dans le code source. Les textes visibles ont ete corriges dans le layout global, l'inscription et certains ecrans dashboard.
- Realite produit : la page `/dashboard/admin/pilotage` a aussi ete re-ecrite proprement en UTF-8 natif pour corriger les libelles encore sans accents ou corrompus dans le contenu principal et la navigation horizontale `Controle detaille`, `Developpement`, `Controle operationnel`, `Critere` et `Synthese`.
- Realite produit : le helper de lecture mission ne repose plus sur une liste fragile de `replaceAll` contenant des chaines cassees dans le repo ; il tente maintenant une reinterpretation UTF-8 defensive et retombe sur le texte d'origine si aucune correction n'est necessaire.
- Realite produit : un garde-fou repo `npm run check:encoding` scanne maintenant `src` et `scripts` pour bloquer les motifs d'encodage corrompu les plus frequents avant qu'ils ne reviennent dans l'application.
- Realite produit : un second lot a nettoye plusieurs surfaces visibles encore simplifiees en ASCII dans les espaces mobile, missions, logements, tarifs, reservations owner, developpement et pilotage `Acces`, `Proprietaire`, `Controle`, `Developpement`, `realisation`, `priorites`, `editoriales`, ainsi que quelques messages API visibles cote produit.
- Limites connues : la documentation historique contient encore des traces d'encodage degrade, notamment dans certains anciens passages du `Master Plan`, mais ce lot a priorise les surfaces visibles du site et le garde-fou applicatif.
- Limites connues : le scan texte final remonte encore des occurrences ASCII dans des zones plus internes ou semi-documentaires `business-plan-reference`, helpers metier, quick login dev, exports HTML/API et quelques labels techniques conservant volontairement des cles ou tokens historiques `Proprietaire`, `proprietaire`, `priorites`. Elles ne correspondent plus a un probleme UTF-8 global du site, mais meriteront un dernier lot de normalisation semantique si l'on veut une francisation exhaustive du depot.
- Verification : `npm run check:encoding` PASS, `npm run build` PASS.

### Mise a jour ciblee - Page Personas & Segments dans le pilotage business du jeudi 13 aout 2026

- Statut : `Partiel`
- Priorite : `P2 Important`
- Perimetre mis a jour : `src/app/dashboard/admin/personas/page.tsx`, `src/app/dashboard/admin/pilotage/personas/page.tsx`, `src/app/dashboard/admin/pilotage/personas/page.module.scss`, `src/app/dashboard/admin/developpement/personas/`, `src/app/components/dashboard/Sidebar/sidebarconfig.tsx`, `src/components/development/DevelopmentSectionNav.tsx`, `src/app/dashboard/admin/pilotage/page.tsx`, `docs/master-plan-planetls.md`
- Realite produit : les personas PlanetLS ont ete remis au propre en UTF-8 dans leur referentiel editable historique, puis exposes dans une page admin unique `/dashboard/admin/personas` qui devient desormais l'URL canonique.
- Realite produit : les anciennes routes `/dashboard/admin/pilotage/personas` et `/dashboard/admin/developpement/personas` sont conservees comme redirections vers `/dashboard/admin/personas`, afin d'eviter les doublons d'acces tout en gardant les anciens liens fonctionnels.
- Realite produit : la page ne duplique pas les personas comme simple galerie. Elle relie chaque profil a son usage attendu dans le pilotage avec trois couches : `personas complets`, `insights par persona` pour alimenter le controle detaille `besoins, frictions, KPI, hypotheses, risques`, puis `impact persona sur les priorites` pour aider la page Developpement a arbitrer les features.
- Decision de pilotage : les personas doivent rester operationnels. Leur place principale devient le `Pilotage Business`, tandis que l'espace `developpement/personas` conserve le role de referentiel editable et d'atelier de maturation.
- Realite produit : la page `/dashboard/admin/pilotage/personas` a ete restructuree une seconde fois pour une lecture par familles `Clients / Prestataires / Ecosysteme / Plateforme`. Chaque famille explicite maintenant son type de dashboard, sa logique d'offre et son objectif produit, afin d'eviter l'idee qu'un meme cockpit conviendrait a tous les profils.
- Decision de pilotage : PlanetLS doit raisonner `un type de persona = un cadre de lecture et souvent un dashboard distinct`, avec separation claire entre `vue proprietaire`, `cockpit conciergerie`, `vue terrain/prestataire`, `espace partenaire` et `cockpit admin`.
- Decision de pilotage : le cockpit admin ne doit plus exposer deux entrees `Personas`. Une seule page `admin/personas` est visible dans la navigation horizontale et laterale ; les entrees laterales `Utilisateurs`, `Proprietaires`, `Conciergeries` et `Artisans` sont retirees du menu admin courant car elles ne correspondent plus au perimetre de navigation souhaite.
- Realite produit : la page canonique `/dashboard/admin/personas` a ete allegee visuellement. Les fiches personas ne sont plus affichees comme de gros blocs ouverts en permanence ; elles deviennent des cartes repliables avec resume immediat `role, dashboard conseille, focus, besoins cles, a livrer d'abord`, puis details a la demande. L'objectif est de reduire la charge visuelle sans perdre la matiere strategique.
- Decision UX : pour un cockpit admin de pilotage, la lecture par defaut doit privilegier le scan rapide et l'arbitrage, pas l'exhaustivite ouverte. Le detail reste disponible, mais uniquement sur intention.
- Realite produit : la page `/dashboard/admin/personas` adopte maintenant une presentation plus proche d'une page produit de personas que d'un simple back-office. Chaque carte expose une photo plus grande, une punchline visible, une couleur par categorie `proprietaires / conciergeries / prestataires / ecosysteme / plateforme`, un badge visuel, une offre ciblee et un niveau de potentiel `etoiles` afin de rendre les profils plus memorables et plus faciles a presenter.
- Realite produit : les cards personas sont maintenant construites comme de vraies cartes rectangulaires a retournement. Le recto montre l'image, la punchline, quelques informations importantes et la valeur commerciale ; le verso affiche les details complets `contexte, besoins, frustrations, priorites`. La grille reste volontairement sur `2 cartes par ligne` en desktop puis passe a `1 par ligne` sur mobile pour garder une lecture propre.
- Decision UX : l'effet de retournement 3D a ensuite ete simplifie en interaction plus robuste. Toute la face avant de la card est maintenant cliquable et ouvre les informations detaillees dans la meme carte, sous le visuel principal, avec un bouton de fermeture explicite. L'objectif est de garder le look `carte profil` tout en rendant l'ouverture des details immediate et evidente.
- Limites connues : le persona `voyageur` n'est pas encore un vrai persona complet dans la source canonique ; il est volontairement presente comme piste a cadrer plus tard, pas comme cible deja maturee.
- Verification : `npm run check:encoding` PASS. `npm test` PASS `241/241` le jeudi 13 aout 2026 apres realignement des contrats de libelles UTF-8. `npm run build` PASS le jeudi 13 aout 2026 lors de la reverification finale.

### Mise a jour ciblee - Refonte desktop des cartes Personas du vendredi 14 aout 2026

- Statut : `En cours`
- Priorite : `P2 Important`
- ID priorite : `P2-017`
- ID priorite associee suivante : `P2-019`
- Perimetre mis a jour : `src/app/dashboard/admin/personas/page.tsx`, `src/app/dashboard/admin/personas/PersonaFlipCard.tsx`, `src/app/dashboard/admin/pilotage/personas/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la page canonique `/dashboard/admin/personas` expose maintenant un tableau distinct `Referentiel des profils cibles` avant les cartes, afin de montrer clairement `profil`, `besoin principal`, `ce que PlanetLS apporte` et `potentiel payant` pour chaque cible cle.
- Realite produit : en desktop, les cartes personas restent sur `2 cartes par ligne`, mais avec un format plus long et plus rectangulaire. Le recto affiche davantage d'informations utiles `profil, besoin principal, dashboard, focus, apport PlanetLS, potentiel`, et le verso reprend aussi ces reperes avant les blocs detail `contexte, objectifs, frustrations, besoins, fonctionnalites prioritaires`.
- Realite produit : les blocs `personaInfoPill` et `familyMetaCard` ne ressemblent plus a de simples pills rondes ; ils deviennent des cartes rectangulaires bordees, avec une grille `2 par ligne` pour les informations persona et des cartes meta plus lisibles pour chaque famille.
- Realite produit : les familles de personas et les `Insights par famille` sont maintenant pliables/depliables avec une fleche visible, pour reduire la charge visuelle tout en gardant l'information complete a la demande.
- Realite produit : le rail compact de la page supprime les blocs redondants `Profil` et `Activite recente` pour laisser la priorite a la navigation et aux notifications utiles a cette vue.
- Realite produit : le verso des cards personas a ete resserre pour remonter les textes et laisser visibles les contenus du bas de carte sur ecran desktop standard ; les marges, paddings, listes et blocs de citation sont compactes, avec un defilement vertical de securite si une fiche devient exceptionnellement plus longue.
- Realite produit : le rail lateral de la page `/dashboard/admin/personas` a ete eclairci pour corriger un contraste insuffisant `fond vert fonce / texte sombre` sur `Pilotage admin`, `Profil`, `Notifications` et `Acces rapides` ; les panneaux utilisent maintenant un fond clair premium et des couleurs de texte/liens plus lisibles.
- Decision UX : la bordure des cartes devient un signal d'etat. Le verso est volontairement plus visible avec une bordure plus marquee et un halo plus present afin qu'on distingue immediatement qu'une carte est retournee.
- Decision de pilotage : la lecture `Impact persona sur les priorites` est maintenant reformulee en `Chantiers structurants par persona`, afin de separer le referentiel business des arbitrages produit complementaires qui n'etaient pas dans le tableau de profils.
- Limites connues : le referentiel `potentiel payant` reste code en dur dans la page admin et n'est pas encore aligne sur une source editable commune avec l'atelier historique `developpement/personas`.
- Contradictions detectees : la page cherchait a etre plus visuelle et plus compacte, mais les cartes n'affichaient pas assez d'information au recto et des blocs secondaires `Profil`, `Activite recente` concurrencaient la lecture principale. Le lot recentre l'ecran sur les personas eux-memes.
- Verification : `npm run build` PASS le vendredi 14 aout 2026.
- Prochaine etape recommandee : verifier en usage reel si le flip 3D reste le bon modele quand le niveau de detail augmente, ou si une ouverture verticale plus directe devient plus robuste.

### Mise a jour ciblee - Nouvelles pistes developpables pour planning et compte rendu terrain du vendredi 14 aout 2026

- Statut : `A faire`
- Priorite : `P2 Important`
- IDs priorite : `P2-020`, `P2-021`
- Perimetre cible : `src/app/dashboard/concierge/planning/`, `src/app/api/concierge/optimized-routes/`, `src/app/api/concierge/team/`, `src/app/dashboard/concierge/sejours/`, `src/app/dashboard/concierge/missions/`, `src/app/api/reservations/`, `src/app/api/workflow-events/`
- Idee produit : ajouter un vrai moteur d'optimisation des tournees quotidiennes concierge/equipe quand plusieurs missions sont prevues la meme journee. Le systeme doit analyser horaires, logements, contraintes de check-in/check-out et deplacement, puis proposer un ordre de passage optimise tout en laissant la modification manuelle a l'utilisateur.
- Idee produit : ajouter un compte rendu vocal IA de fin d'intervention pour les check-in/check-out. Le concierge dicte librement son retour terrain ; l'application transcrit, detecte les informations importantes, propose une version structuree a valider, puis seulement apres validation enregistre le rapport, met a jour la mission ou le sejour et peut envoyer un recapitulatif au proprietaire.
- Decision de pilotage : ces deux idees sont suffisamment concretes pour entrer dans le `Pilotage des priorites` plutot que rester de simples notes de brainstorming. Elles deviennent des pistes developpables officielles a arbitrer contre les autres chantiers `P2`.
- Dependances pressenties : geolocalisation/adresses fiables, structures canoniques de reservation ou mission, timeline ou rapport d'intervention persistant, et pour la brique vocale un flux `transcription -> structuration -> validation humaine -> persistance`.
- Limites connues : aucune des deux idees n'est encore branchée au produit ni specifiée en detail ; il faudra cadrer les regles metier exactes avant implementation, notamment sur le niveau d'automatisation autorise pour les changements de statut et les notifications proprietaire.

### Mise a jour ciblee - Processus operationnels a optimiser par IA et automatisation du vendredi 14 aout 2026

- Statut : `A faire`
- Priorite : `P2 Important`
- IDs priorite : `P2-022`, `P2-023`, `P2-024`, `P2-025`, `P2-026`
- Perimetre cible : `src/app/api/service-requests/`, `src/app/api/quotes/`, `src/app/api/missions/`, `src/app/api/billing/`, `src/server/notifications/`, `src/app/dashboard/owner/demandes/`, `src/app/dashboard/concierge/demandes/`, `src/app/dashboard/owner/`, `src/app/dashboard/concierge/`
- Idee produit : formaliser un premier processus d'automatisation du cycle `demande -> devis -> mission`. Une demande proprietaire doit pouvoir etre mieux structuree, diffusee aux bons professionnels, puis convertie plus simplement en mission apres acceptation du devis, avec regles explicables et points de validation clairs.
- Idee produit : formaliser un second processus de relances automatiques sur les devis sans reponse, les missions a confirmer et les paiements en attente. L'objectif est de reduire les oublis administratifs sans supprimer le controle humain sur les cas sensibles.
- Vision d'ensemble : ces deux chantiers s'ajoutent aux priorites deja posees sur l'optimisation des tournees `P2-020` et le compte rendu vocal terrain `P2-021`. Ensemble, ils decrivent un axe produit coherent : diminuer la charge repetitive des professionnels tout en augmentant la tracabilite et la qualite de suivi cote proprietaire.
- Schema de reference a cartographier visuellement : `Demande proprietaire -> Devis -> Acceptation -> Creation de mission -> Optimisation du planning -> Check-in / Check-out -> Compte rendu vocal -> Analyse IA -> Validation humaine -> Cloture de mission -> Notification proprietaire`
- Decision de pilotage : ces processus ne doivent pas etre traites comme de simples automatisations techniques. Ils doivent rester reversibles, validables par l'utilisateur et relies a des etats lisibles dans l'historique des demandes, devis, missions et paiements.
- Cadrage metier a integrer au tableau de pilotage : avant tout developpement, il faut preciser les seuils de relance, les validations humaines obligatoires et la tracabilite des actions automatiques. Ce prerequis devient une priorite distincte `P2-024` pour eviter de lancer les automatismes sans garde-fous explicites.
- Travail attendu pour `P2-024` : definir ensuite concretement les seuils de relance, les points de validation humaine obligatoires et le niveau de journalisation attendu pour chaque action automatique.
- Feuille de route IA et automatisation a formaliser pour les livrables : `Phase 1 - Automatisation du workflow demande -> devis -> mission -> notifications`, `Phase 2 - Compte rendu vocal IA check-in/check-out`, `Phase 3 - Optimisation des tournees`, `Phase 4 - IA avancee assistant / incidents / recommandations`. Cette structuration devient une priorite distincte `P2-025` afin de cadrer une roadmap d'integration IA dediee plutot qu'une roadmap globale de tout PlanetLS.
- Fil rouge recommande pour les livrables 2 a 5 : `Concierge termine son check-out -> appuie sur compte rendu vocal -> dicte son observation -> transcription -> IA structure les informations -> PlanetLS affiche le rapport -> concierge valide -> Supabase enregistre -> mission cloturee -> proprietaire informe automatiquement`. Si l'IA detecte une anomalie type `serrure endommagee`, elle ne doit proposer une creation d'incident ou de demande d'intervention qu'avec validation humaine explicite.
- Principe produit a conserver : `l'IA prepare, analyse et propose ; le professionnel conserve le controle des decisions importantes`.
- Sources officielles defendables a citer dans les livrables et PDF : `CNIL - fiches pratiques IA` https://www.cnil.fr/fr/les-fiches-pratiques-ia ; `Make - automatisation et IA / AI Agents` https://help.make.com/make-ai-agents ; `Mistral AI - documentation developpeurs` https://docs.mistral.ai/en . La consolidation de ce referentiel de sources devient une priorite distincte `P2-026`.
- Dependances pressenties : statuts metier plus stricts sur les demandes, devis et missions, moteur de notifications, orchestration des relances, garde-fous de permissions, et journalisation des actions automatiques pour conserver la confiance produit.
- Limites connues : ce cadrage ne fixe pas encore les seuils exacts de relance, les exceptions metier, ni la frontiere entre suggestion IA et action automatique. Une specification plus detaillee sera necessaire avant implementation.

### Mise a jour ciblee - Registre des automatisations et cadrage par role du lundi 17 aout 2026

- Statut : `A faire`
- Priorite : `P2 Important`
- IDs priorite : `P2-030`, `P2-031`, `P2-032`, `P2-033`, `P2-034`
- Perimetre cible : `src/app/dashboard/admin/pilotage/`, `src/app/dashboard/admin/developpement/`, `src/app/dashboard/owner/planning/`, `src/app/dashboard/owner/missions/voyageurs/`, `src/app/dashboard/concierge/planning/`, `src/app/dashboard/concierge/sejours/`, `src/app/dashboard/concierge/missions/`, `src/app/api/reservations/`, `src/app/api/missions/`, `src/app/api/provider-interventions/`, `src/app/api/quotes/`, `src/server/notifications/`
- Regle de pilotage a graver : toute automatisation PlanetLS doit etre classee dans un des trois niveaux `Automatique`, `Automatique + validation`, `Humain obligatoire`. Le niveau `Humain obligatoire` reste la regle par defaut pour l'argent, les litiges, les sanctions, les remboursements et toute decision irreversible.
- Priorite `P2-030` : formaliser un `Registre des automatisations PlanetLS` dans le pilotage admin, separe par profils `Proprietaire / Concierge / Artisan / Admin` et par statuts `Idee -> A analyser -> Validee -> A developper -> En test -> Active -> A optimiser`, avec proprietaire, ROI estime, risque, KPI avant/apres et date de revue.
- Structure minimale recommandee pour chaque fiche d'automatisation : `ID`, `zone d'intervention`, `etat`, `objectif`, `resume`, `declencheur`, `scenario simplifie`, `dependances`, `outil/service`, `KPI`, `criticite`, `proprietaire metier`, `proprietaire technique`, `service externe`, `interrupteur d'activation`.
- Convention d'identification a graver : utiliser un identifiant stable de type `AUT-001`, `AUT-002`, `AUT-003` plutot qu'un libelle flottant `notification concierge`. Les logs, erreurs, tableaux de bord et documents doivent toujours reutiliser le meme identifiant canonique.
- Cartographie macro officielle a produire : une vue transversale des automatisations PlanetLS par grandes zones `Reservation`, `Devis`, `Mission`, `Incident`, `Paiement`, avec chaines de dependances explicites `AUT-001 -> AUT-002 -> AUT-003`. L'objectif est de pouvoir remonter facilement a la source lorsqu'une automatisation aval echoue.
- Champ supplementaire obligatoire : `criticite` avec trois niveaux minimum `Critique`, `Importante`, `Confort`. Les automatisations `paiement`, `creation mission`, `reservation`, `modification de sejour` doivent remonter plus vite dans les alertes et le suivi admin.
- Champ de responsabilite a preparer des maintenant : `proprietaire metier`, `proprietaire technique` et `service externe`. Meme si PlanetLS reste aujourd'hui une equipe tres reduite, cette discipline evite les zones grises quand plusieurs personnes ou prestataires interviendront.
- Regle d'architecture fonctionnelle : toute nouvelle automatisation doit etre rattachee a une `zone`, recevoir un `ID`, declarer ses `dependances amont/aval`, son `declencheur`, ses `KPI` et ses `scenarios enfants` avant d'etre consideree comme vraiment cadree.
- Priorite `P2-031` : cadrer le flux owner `Reservation -> Sejour -> Planning -> Taches -> Notifications` avec creation automatique du sejour, generation des missions recurrentes, recalcul en cas de changement/annulation et relance des informations voyageurs manquantes, tout en gardant une validation humaine des annulations deja engagees ou couteuses.
- Priorite `P2-032` : cadrer le flux concierge `Mission -> Checklist dynamique -> Photos -> Compte rendu -> Notification owner`, avec generation de checklist selon le type de mission, synthese IA du compte rendu, alertes de conflit planning et proposition de creation d'incident ou de demande artisan en cas d'anomalie detectee.
- Priorite `P2-033` : cadrer le flux artisan `Demande qualifiee -> Distribution intelligente -> Devis -> Intervention -> Facture preparee`, avec qualification automatique des demandes, selection par metier/zone/disponibilite/urgence, relances de devis et preparation de facture sans envoi final automatique sans validation du professionnel.
- Priorite `P2-034` : ajouter une grille `anti-sur-automatisation` dans le tableau de pilotage pour scorer chaque automatisation candidate sur `tache repetitive`, `frequence`, `temps perdu`, `risque d'erreur humaine`, `regles previsibles`, `consequence d'une erreur`, `validation humaine necessaire`, `temps economise estime`, `KPI mesurable`, `durabilite`, puis calculer un score d'opportunite `/100`.
- Vision d'ensemble : ces priorites prolongent `P2-020` a `P2-026` avec une logique plus exploitable pour la formation IA/automatisation et pour le vrai produit. L'objectif n'est pas d'automatiser partout, mais de supprimer les taches repetitives sans retirer le controle humain sur les decisions sensibles.
- Contradiction a eviter : une automatisation spectaculaire mais opaque peut detruire la confiance produit si elle modifie un statut, un paiement ou une relation client sans validation explicite. PlanetLS doit assumer un principe directeur : `l'IA prepare, propose et structure ; l'humain valide les decisions importantes`.
- KPI recommandes pour le registre : `temps gagne par sejour`, `missions creees automatiquement`, `devis sans reponse reduits`, `paiements relances a temps`, `incidents detectes plus tot`, `dossiers bloques identifies`, `taux d'acceptation des suggestions IA`, `taux de correction humaine avant envoi`.
- Cycle de vie recommande pour une automatisation candidate : `A etudier -> Cartographiee -> Validee -> A developper -> Developpement -> Test -> Pilote -> Active -> Mesuree -> Optimisee`. La progression dans ce cycle compte davantage que le nombre de workflows lances en parallele.
- Question de cadrage obligatoire : `Pourquoi cette automatisation existe-t-elle ?` Si l'equipe ne sait plus relier clairement l'automatisation a un irritant, un gain measurable et un risque acceptable, elle ne doit pas passer en developpement.
- Methode de deploiement a retenir : `processus prioritaire -> probleme reel -> automatisations necessaires -> technologie -> developpement -> test -> mesure -> deploiement`. PlanetLS doit partir des processus et non d'une liste d'outils `n8n / Make / IA / API`.
- Discipline de livraison : `Construire -> tester -> mesurer -> corriger -> valider -> passer a la suivante`. Le principe directeur reste `une automatisation a la fois` pour eviter les interferences et les dependances mal comprises.
- Plan de deploiement recommande par vagues : `Vague 1 Cartographie et audit`, `Vague 2 Coeur transactionnel demande -> devis -> mission -> planning`, `Vague 3 Sejours et conciergerie`, `Vague 4 Artisans et incidents`, `Vague 5 Automatisations intelligentes`, `Vague 6 Processus support de l'entreprise`. Les vagues 5 et 6 ne doivent accelerer qu'un socle deja fiable.
- Garde-fou de conception : chaque automatisation importante doit decrire son `plan B` en cas d'echec `retry -> nouvel echec -> alerte -> reprise manuelle possible`. Aucune automatisation sensible ne doit pouvoir echouer en silence sur `paiement`, `mission`, `notification critique` ou `synchronisation`.
- Boucle de controle des resultats a retenir : `mesurer -> detecter -> comprendre -> corriger -> tester -> redeployer -> mesurer de nouveau`. Une automatisation n'est pas consideree utile parce qu'elle tourne techniquement, mais parce qu'elle produit un gain reel et observable sans degrader l'experience metier.
- Quatre dimensions de suivi obligatoires : `Performance` `temps gagne, temps moyen par mission, temps economise par semaine, actions manuelles supprimees`, `Fiabilite` `taux de reussite, erreurs, echecs definitifs, retries, doubles creations evitees`, `Impact metier` `delais, oublis evites, devis convertis, missions traitees, incidents resolus plus vite, cout`, `Satisfaction utilisateur` `retours positifs, demandes support, abandons, corrections manuelles, perception de surcharge ou de bruit`.
- Distinction a conserver dans le pilotage : `KPI metier` et `KPI techniques`. Les KPI metier disent si le travail owner/concierge/artisan/admin s'ameliore ; les KPI techniques disent si l'automatisation elle-meme fonctionne proprement.
- Exemples de KPI metier par role : `owner temps de gestion par sejour, actions manuelles par reservation, delai pour trouver un prestataire, delai d'acceptation devis`, `concierge temps administratif hebdomadaire, missions gerees, conflits planning, missions a l'heure`, `artisan delai moyen de reponse, taux demande -> devis, taux devis -> mission, delai de paiement`, `admin nombre d'incidents, temps de traitement, interventions manuelles, taux d'automatisations en echec`.
- Instrumentation technique ciblee par automatisation : chaque automatisation doit pouvoir exposer `declenchee`, `reussie`, `echec`, `taux de reussite`, `temps moyen d'execution`, `retries`, `interventions humaines`, plus la derniere execution et la derniere erreur connue.
- Journal d'execution recommande des maintenant : `date/heure`, `automation_id`, `evenement source`, `acteur ou profil`, `entites creees/modifiees`, `resultat`, `cause si echec`, `tentative`, `duree`, `action manuelle eventuelle`. Sans ce journal, les anomalies deviennent difficiles a comprendre et a corriger.
- Gestion standard des erreurs : `succes -> continuer`, `erreur temporaire -> reessayer`, `erreur persistante -> file d'erreurs`, `erreur critique -> alerte admin + blocage des actions irreversibles`. Exemple directeur : une incoherence `Stripe` ou une action argent sensible ne doit jamais etre regularisee automatiquement sans controle humain.
- Strategie de deploiement operationnel : `Developpement -> Test -> Pilote -> Production`, avec interrupteur d'activation `OUI / NON` par automatisation et extension progressive a partir de pilotes limites avant generalisation.
- Lecture cockpit a viser dans `Pilotage -> Transformation & Automatisation` : `Vue generale`, `Performance metier`, `Sante technique`, `Amelioration continue`, plus une fiche detaillee par automatisation avec `objectif`, `KPI cible`, `reference avant`, `resultat actuel`, `temps economise`, `incidents`, `statut`, `prochaine action`.
- Frequence de suivi recommandee : `controle quotidien automatique` pour les erreurs importantes et les alertes critiques, puis `rapport hebdomadaire` pour les performances, gains, irritants et arbitrages de correction. L'objectif n'est pas de tout relire chaque jour manuellement, mais de faire remonter ce qui merite une attention.
- Regle metier explicite : une automatisation peut etre `techniquement correcte` mais `metierement mauvaise`. Si les rappels partent a `100 %` mais que les concierges les jugent intrusifs ou inutiles, l'automatisation doit etre revue malgre une bonne sante technique.
- Exemple de lecture attendue pour une automatisation `devis accepte -> mission` : `executions hebdomadaires`, `missions creees automatiquement`, `echecs`, `taux de reussite`, `temps moyen`, `temps administratif economise`. Cette lecture doit permettre de juger l'utilite reelle et pas seulement le fait que le job s'est lance.
- Structure de tableau de bord cible : `Automatisations executees cette semaine`, `taux de reussite global`, `echecs`, `temps economise estime`, `actions manuelles supprimees`, `automatisations necessitant une attention`, puis un tableau par automatisation `Executions | Succes | Erreurs | Temps gagne | Statut`.
- Trace minimale obligatoire pour chaque correction : `Probleme observe -> hypothese -> modification -> resultat avant/apres`. Cette trace evite les ajustements au hasard et alimente la boucle d'amelioration continue avec une memoire exploitable.

### Mise a jour ciblee - Module Automatisations & Processus dans la page Developpement du lundi 17 aout 2026

- Statut : `Partiel`
- Priorite : `P2 Important`
- Perimetre mis a jour : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `src/app/dashboard/admin/developpement/automationWorkspace.ts`, `docs/master-plan-planetls.md`
- Realite produit : la page `/dashboard/admin/developpement` embarque maintenant un module `Automatisations & Processus` dans son propre cockpit, sans creer une nouvelle route admin. Le module ajoute des vues `Vue d'ensemble`, `Processus`, `Automatisations`, `Cartographie`, `Performance`, `Incidents` et `Historique`, avec filtres `acteur / processus / statut / criticite / technologie / erreurs`, registre `AUT-xxx`, dependances amont/aval et quelques donnees de demonstration identifiables comme telles.
- Realite produit : l'interface reste volontairement locale a la page `developpement`. Elle documente et pilote les automatisations sans brancher encore de persistance serveur dediee ni de logs d'execution live. Les donnees proviennent d'un socle TypeScript structure `automationWorkspace.ts` pour preparer une future connexion aux vraies sources sans melanger tout de suite UI, logique metier et observabilite reelle.
- Decision de pilotage : le lot ne deplace rien vers `Pilotage Business` et n'ouvre pas de nouvelle page `automatisations`. Le besoin utilisateur etait explicite : ce premier centre de controle doit vivre uniquement dans `developpement`.
- Limites connues : les KPI, incidents, historiques et cartographies affiches sont encore des donnees de demonstration structurees. Il n'y a pas encore de lecture live de `workflow_events`, de retries, de notifications ou de webhooks ; aucune detection automatique de dependance circulaire n'est encore implementee.
- Prochaine etape recommandee : si la structure de lecture convient, brancher progressivement ce module sur de vraies donnees `workflow_events`, `missions`, `quotes`, `notifications`, puis ajouter une fiche detaillee editable et un premier niveau de journal d'execution persisté pour les automatisations critiques.

### Mise a jour ciblee - Automatisation de reference AUT-001 pour l'exercice du lundi 17 aout 2026

- Statut : `A faire`
- Priorite : `P2 Important`
- Perimetre cible : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `docs/master-plan-planetls.md`, futurs livrables de formation
- Automatisation retenue pour l'exercice : `AUT-001 - Devis accepte -> creation et planification automatique d'une mission`.
- Pourquoi ce choix : c'est l'automatisation la plus simple a expliquer, la plus proche de la valeur metier de PlanetLS et la plus defendable sans recourir a Make, n8n ou une IA non necessaire.
- Probleme identifie : apres acceptation d'un devis, la creation de mission, l'attribution, le planning, les notifications et le suivi peuvent encore exposer des ressaisies, oublis, erreurs de statut et pertes de temps.
- Objectifs mesurables recommandes : `reduire d'au moins 30 % les actions manuelles`, `eviter la double saisie`, `creer la mission en quelques secondes`, `atteindre >= 95 % de reussite en pilote puis >= 98 % stabilise`, `tracer chaque execution`.
- Distinction a graver dans le livrable : le `processus metier global` va de `besoin owner -> demande -> devis -> choix -> mission -> realisation -> validation -> facturation -> paiement`, alors que l'automatisation ne couvre que `devis accepte -> creation mission -> planification -> notifications`.
- Cartographie cible recommandee : `owner accepte le devis -> declencheur AUT-001 -> verification des donnees -> si incomplet alerte/validation -> sinon creation mission -> attribution prestataire -> ajout planning -> mise a jour statut -> notifications -> historisation -> mission creee et planifiee`.
- Chemins d'erreur obligatoires a montrer : `erreur detectee -> journalisation -> pas de doublon -> retry possible -> nouvel echec = alerte admin -> intervention manuelle si necessaire`.
- Donnees minimales a citer : `identifiant devis`, `owner`, `prestataire`, `logement`, `type de prestation`, `description`, `montant`, `date intervention`, `statut devis`, `statut mission`.
- Decision de cadrage IA : `AUT-001` n'a pas besoin d'IA pour fonctionner. La regle principale est deterministe ; l'IA peut tout au plus aider ensuite a produire un resume de mission, mais ne doit pas porter la transformation critique `devis -> mission`.

### Mise a jour ciblee - Audit terrain et cartographie des processus du lundi 17 aout 2026

- Statut : `A faire`
- Priorite : `P2 Important`
- IDs priorite : `P2-035`, `P2-036`, `P2-037`
- Perimetre cible : `docs/master-plan-planetls.md`, `src/app/dashboard/admin/pilotage/`, `src/app/dashboard/admin/developpement/`, futures specs produit et ateliers de recherche utilisateur
- Priorite `P2-035` : lancer un audit terrain par acteur `proprietaire / concierge / artisan`, avec trois methodes complementaires `questionnaire -> entretien -> observation/test`, afin de documenter les pratiques reelles, les outils utilises, les ressaisies, les irritants, les validations implicites et les limites acceptables de l'automatisation.
- Priorite `P2-036` : produire ensuite une cartographie `AS-IS` des principaux processus metier et de leurs exceptions, y compris les `Oui, sauf quand...`, avant de figer une vision cible. Les exceptions de derniere minute `reservation modifiee`, `annulation`, `depense a faire valider`, `conflit planning`, `incident en cours` doivent etre traitees comme des cas centraux et non comme des details.
- Priorite `P2-037` : faire valider chaque cartographie par les utilisateurs concernes, puis seulement transformer les processus retenus en version `TO-BE` avec grille `Automatique / Automatique + validation / Humain obligatoire`, KPI et backlog de developpement.
- Methode recommandee : documenter chaque processus sous la forme `PROCESSUS -> ETAPES -> PROBLEMES -> AUTOMATISATIONS -> CONTROLE HUMAIN -> KPI`, afin de separer clairement le flux metier, ses irritants reels, les opportunites d'automatisation et les decisions qui doivent rester humaines.
- Decision de pilotage : PlanetLS ne doit pas demander d'abord `Quelles fonctionnalites voulez-vous ?`, mais `Montrez-moi comment vous travaillez aujourd'hui`. Cette inversion est importante pour faire emerger les vraies regles metier et eviter de construire des automatismes elegants sur une comprehension incomplete du terrain.
- Livrables attendus : questionnaires par role, guide d'entretien, trame d'observation, cartographies `AS-IS`, synthese des exceptions, arbitrages `auto / assiste / humain / suppression`, puis cartographie `TO-BE` ciblee sur les 5 a 6 processus metier les plus critiques pour le MVP.

### Mise a jour ciblee - Audit et cartographie AS-IS des processus existants du lundi 17 aout 2026

- Statut : `Partiel`
- Priorite : `P2 Important`
- IDs priorite associees : `P2-035`, `P2-036`, `P2-037`
- Perimetre audite : `docs/master-plan-planetls.md`, `docs/audit-parcours-demande-devis-mission-2026-06-05.md`, `docs/spec-reservations-sejours-operations-2026-07-29.md`, `src/app/api/service-requests/route.ts`, `src/app/api/quotes/route.ts`, `src/app/api/_shared/acceptedQuoteWorkflow.ts`, `src/app/api/_shared/reservations.ts`, `src/app/api/_shared/workflowEvents.ts`, cockpits `owner / concierge / provider / admin`
- Methode utilisee : audit documentaire et audit code `routes API, helpers workflow, dashboards, tests et specifications` pour produire une premiere cartographie `AS-IS` issue du produit reel. Cette lecture reste une vue `code-first` et doit encore etre confrontee au terrain reel.
- Lecture globale : PlanetLS fonctionne deja comme une chaine de processus relies, pas comme une simple juxtaposition de pages. Le coeur actuel du produit suit surtout trois colonnes vertes : `demande -> devis -> mission commerciale`, `reservation/sejour -> taches et interventions`, `facture -> paiement -> suivi`. Les zones les moins consolidees sont `notifications uniformes`, `CRM`, `equipe`, `stocks` et certaines exceptions de planning encore hybrides.
- Cartographie metier AS-IS n°1 `Acquisition et expression du besoin owner` : `Recherche concierges -> short-list multi-concierges -> creation de demande -> recipients + conversations -> suivi des reponses`. Ce flux est reellement branche et persistant `service_requests`, `service_request_recipients`, `contact_conversations`, avec filtres owner, budget, urgence, date souhaitee et statuts derives.
- Cartographie metier AS-IS n°2 `Traitement concierge de la demande` : `demande recue -> consultation -> interet / refus / demande de precision / proposition de date -> preparation devis`. Le produit sait marquer une demande comme `viewed`, ouvrir une conversation, preparer un devis brouillon, demander une precision et proposer une date, avec journalisation workflow.
- Cartographie metier AS-IS n°3 `Devis -> selection -> mission commerciale` : `devis brouillon -> devis envoye -> comparaison owner -> acceptation/refus -> finalizeAcceptedQuoteWorkflow -> mission creee/rattachee -> facture brouillon -> mission_events + workflow_events`. Ce processus est l'un des plus solides du depot et constitue aujourd'hui le meilleur flux transactionnel inter-roles.
- Cartographie metier AS-IS n°4 `Reservation / sejour partage` : `contrat/collaboration active -> reservation creee ou importee -> sejour partage -> consignes owner/concierge -> missions liees -> suivi preparation / check-in / check-out`. Le code confirme que la reservation devient progressivement l'objet canonique partage, mais la maturite reste partielle car plusieurs lectures, etats et automatismes reposent encore sur `missions` et `metadata`.
- Cartographie metier AS-IS n°5 `Execution concierge` : `mission planifiee -> planning -> checklist / photos / preuves -> compte rendu -> information owner`. Le cockpit concierge possede deja les surfaces `planning`, `missions`, `sejours`, `stocks`, `maintenance`, `urgences`, mais la persistance complete et l'homogeneite des exceptions restent inegales selon les modules.
- Cartographie metier AS-IS n°6 `Incident -> artisan -> intervention` : `anomalie detectee -> qualification -> demande ou intervention provider -> devis eventuel -> intervention -> preuve -> facture`. Le socle provider existe bien `interventions`, `devis`, `messages`, `facture liee`, mais la frontiere entre incident concierge, mission et intervention provider reste encore plus lisible dans la documentation que dans un workflow unifie de bout en bout.
- Cartographie metier AS-IS n°7 `Facturation et paiement` : `devis accepte -> facture brouillon -> checkout/webhook -> synchronisation facture/paiement -> suivi owner/concierge/provider`. Le webhook signe et la synchronisation facture sont valides, mais la branche `Checkout heberge`, la lecture complete des echecs et certains paiements provider restent partiels.
- Cartographie support AS-IS `Onboarding et profils` : `inscription -> role -> onboarding -> profil metier -> completude -> surfaces role-based`. Les profils et dashboards existent par role, mais la qualite et la profondeur des donnees restent plus matures cote concierge/admin que cote CRM, equipe ou provider public.
- Cartographie support AS-IS `Pilotage et administration` : `kpi -> control tower -> operations -> priorites -> journal`. L'espace admin est deja un vrai centre de pilotage avec Mission Control, overview, controle, pilotage et journal du projet ; il sait remonter incidents, sante operationnelle, flux KPI et arbitrages produit.
- Cartographie support AS-IS `Messagerie, notifications, audit trail` : `conversation -> message -> evenement workflow -> lecture dashboards`. Le produit dispose des briques de conversation et d'un `workflow_events` partage, mais pas encore d'une distribution unifiee `email / push / centre de notifications` parfaitement coherente sur tous les flux.
- Exceptions majeures identifiees dans l'AS-IS : `reservation modifiee / annulee`, `mission deja commencee avec impact financier`, `intervention artisan urgente`, `conflit planning`, `incident ouvert pendant un sejour`, `donnees critiques encore porteuses en metadata`, `difference entre mission commerciale et operations de sejour`.
- Contradictions detectees : le produit raconte de plus en plus clairement une logique `reservation conteneur -> mission execution -> intervention externe`, mais plusieurs ecrans et API portent encore une histoire mixte entre `mission`, `sejour`, `intervention` et `incident`. L'audit confirme que la clarification metier est bonne, mais que son alignement complet dans les parcours n'est pas encore termine.
- Limites connues : cet audit ne remplace pas l'observation terrain. Il decrit ce que le code permet aujourd'hui, pas encore ce que les professionnels font reellement hors plateforme ni les contournements qu'ils utilisent. Le statut reste donc `Partiel` tant que les cartographies `AS-IS` n'ont pas ete validees par de vrais proprietaires, conciergeries et artisans.
- Prochaine etape recommandee : convertir cette cartographie code-first en referentiel de travail par acteur `owner / concierge / artisan / admin`, puis la confronter au terrain avec `questionnaire -> entretien -> observation -> validation`, avant de fixer les cartographies `TO-BE` et les automatismes prioritaires.

### Mise a jour ciblee - Page admin Modele financier du jeudi 13 aout 2026

- Statut : `Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/modele-financier/page.tsx`, `src/app/dashboard/admin/modele-financier/page.module.scss`, `src/app/dashboard/admin/pilotage/economic-model/sharedFinancialReference.ts`, `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/components/dashboard/Sidebar/sidebarconfig.tsx`, `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/personas/page.tsx`, `src/app/dashboard/admin/controle/page.tsx`, `src/app/dashboard/admin/decisions-architecture/DecisionCenterPage.tsx`, `docs/master-plan-planetls.md`
- Realite produit : l'espace admin dispose maintenant d'une vraie page canonique `/dashboard/admin/modele-financier` exposee dans la navigation laterale et dans plusieurs navigations internes du cockpit admin. Elle consolide le benchmark tarifaire 2026, la grille de pricing cible PlanetLS, la lecture `willingness to pay`, les couts variables et les triggers de passage au payant dans une seule surface lisible.
- Realite produit : la page n'est plus isolee du socle pricing existant. Un referentiel partage `sharedFinancialReference.ts` alimente maintenant a la fois `/dashboard/admin/modele-financier` et `EconomicModelTab`, ce qui relie la lecture business aux vraies briques `strategie prioritaire, offre protegee, scenario directeur, journal de decisions`.
- Realite produit : la page ne branche toujours pas de simulateur editable persistant ni de donnees financieres observees temps reel, mais elle n'est plus une simple synthese de texte decoree. Elle sert de hub de lecture pour la direction produit/business avec une premiere connexion aux hypotheses et garde-fous deja presents dans `economic-model`.
- Decision de pilotage : `modele financier` devient une entree admin distincte plutot qu'un simple sous-bloc du `pilotage business`. Cela clarifie le parcours admin entre `vision/benchmark`, `pricing & unit economics`, `personas`, `controle detaille` et `developpement`.
- Decision de pilotage : la source de verite du cadrage financier doit etre mutualisee plutot que recopier des constantes dans plusieurs pages admin. Le referentiel partage devient la couche intermediaire entre lecture strategique et atelier de simulation.
- Limites connues : les chiffres affiches restent des hypotheses et une synthese de benchmark, pas des valeurs branchees sur Stripe, la comptabilite ou un MRR reel. L'offre de production existante et les simulations avancees du module economique restent ailleurs et ne sont pas encore reunies dans une meme gouvernance outillee.
- Contradictions detectees : le cockpit admin disposait deja de briques `business strategy` et `economic-model`, mais sans point d'entree explicite `modele financier` dans la navigation principale ni referentiel partage entre lecture strategique et simulation. Le lot corrige la lisibilite et une premiere partie de cette duplication, sans fusionner encore tous les objets financiers avancÃƒÆ’Ã‚Â©s.
- Verification : `npx eslint src/app/dashboard/admin/modele-financier/page.tsx src/app/dashboard/admin/pilotage/economic-model/sharedFinancialReference.ts src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx` PASS. `npm run check:encoding` PASS. `npm test` PASS `241/241` le jeudi 13 aout 2026 apres realignement des contrats UTF-8. `npm run build` PASS le jeudi 13 aout 2026 apres liberation du verrou `.next`.
- Prochaine etape recommandee : etendre ensuite le meme socle partage aux autres briques finance `PricingRevenueSimulator`, `FinancialForecastModel` et, si besoin, ajouter une persistance admin des hypotheses pour sortir d'un referentiel purement code.

### Mise a jour ciblee - Realignement value-based du modele financier du vendredi 14 aout 2026

- Statut : `En cours`
- Priorite : `P1 Prioritaire`
- IDs priorite associees : `P2-025`, `P2-027`, `P2-028`, `P2-029`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/economic-model/sharedFinancialReference.ts`, `src/app/dashboard/admin/pilotage/economic-model/data.ts`, `src/app/dashboard/admin/pilotage/economic-model/types.ts`, `src/app/dashboard/admin/pilotage/economic-model/financialModel.ts`, `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/business-plan-reference.ts`, `src/app/dashboard/admin/pilotage/businessPlanData.ts`, `docs/master-plan-planetls.md`
- Realite produit : le cadrage financier admin ne repose plus seulement sur une lecture `29 / 49 / sur devis`. La source partagee met maintenant en avant une grille `Free / Owner Pro / Concierge Pro / Business` avec repere de travail `0 / 19,90 / 49 / 149`, plus proche du texte de cadrage recent sur la tarification par valeur creee.
- Priorite `P2-027` : rendre ce nouveau cadrage tarifaire visible et referencable directement dans le `Pilotage des priorites`, sans l'enfouir seulement dans la documentation narrative.
- Realite produit : seules les idees nouvelles utiles ont ete ajoutees dans la couche active `willingness to pay`, `triggers de passage au payant`, `value-based pricing`, `Owner Pro a 19,90`, `Business a 149`, sans dupliquer des hypothese deja presentes ailleurs.
- Realite produit : le module `Modele economique` et le referentiel `Business Plan` ont ete realignes sur les memes noms de paliers actifs `owner_pro`, `concierge_pro`, `business`. Les cartes d'offres simulees, les benchmarks PlanetLS, les recommandations de guidance et les scenarios de simulation partagent a nouveau une meme narration.
- Decision de pilotage : la page admin peut assumer deux verites simultanees sans les melanger. `Conciergerie Pro a 29 EUR` reste l'offre Stripe reelle existante et verrouillee ; `Free / Owner Pro / Concierge Pro / Business` devient la gamme de travail interne pour tester une tarification value-based avant toute evolution commerciale ou technique.
- Priorite `P2-028` : clarifier explicitement cette coexistence `offre Stripe reelle a 29 EUR` versus `gamme de travail admin`, afin d'eviter les contresens pendant les entretiens, les livrables et les futures decisions commerciales.
- Contradictions detectees : le projet portait en parallele plusieurs grilles `29 / 49 / sur devis`, `FREE / ESSENTIAL / PRO / BUSINESS` et `0 / 19,90 / 49 / 149`. Ce lot reduit la dispersion sur les vues actives, mais l'historique documentaire ancien garde encore des traces des versions precedentes.
- Limites connues : le simulateur financier de production n'est pas encore branche sur une persistance admin ni sur des donnees Stripe reellement observees. La comparaison entre offre reelle et gamme de travail reste donc editoriale et doit etre validee en entretien terrain avant toute migration commerciale.
- Priorite `P2-029` : nettoyer ensuite les derniers libelles historiques de pricing encore divergents dans les vues secondaires et dans l'historique documentaire utile, sans reecrire artificiellement tout l'historique ancien.
- Verification : verification locale a relancer sur `npm run build` apres realignement complet des references de tiers et des scenarios.
- Prochaine etape recommandee : harmoniser ensuite les derniers libelles de travail visibles dans `PricingRevenueSimulator`, `FinancialForecastModel` et les surfaces de validation marche qui parlent encore en `ESSENTIAL / PRO` ou en `29 EUR`.

### Mise a jour ciblee - Revalidation finale du lot admin du jeudi 13 aout 2026

- Statut : `Termine`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/page.tsx`, `src/tests/create-logement-helpers.test.mts`, `src/tests/developer-log.test.mts`, `src/tests/kpis-overview-contract.test.mts`, `docs/master-plan-planetls.md`
- Realite produit : le tableau `Pilotage des priorites` reste coherent avec les sujets remontes pendant la journee, notamment la couverture `P0/P1` deja visible dans la page `Developpement` et l'action `P2-016` sur les reliquats ASCII / labels historiques.
- Realite produit : la contradiction de verification ouverte en fin de lot est maintenant levee. Les contrats de tests impactes par la francisation ont ete realignes, et le libelle admin visible `Mode dÃƒÂ©gradÃƒÂ©` est de nouveau coherent entre interface et tests.
- Decision de pilotage : les lots du jeudi 13 aout 2026 ne doivent plus etre presentes comme simplement "verifies plus tot dans la mission" ou "bloques par lock" alors qu'une reverification finale complete existe. La preuve de validation finale devient la reference documentaire.
- Contradictions detectees : aucune contradiction ouverte restante sur l'etat de verification du lot admin du 13 aout 2026 apres relance complete des controles locaux.
- Verification : `npm test` PASS `241/241`, `npm run check:encoding` PASS, `npm run build` PASS le jeudi 13 aout 2026.
- Prochaine etape recommandee : reprendre ensuite la priorisation produit sur le contenu des lignes `P0/P1/P2` plutot que sur l'hygiene de verification de ce lot.
