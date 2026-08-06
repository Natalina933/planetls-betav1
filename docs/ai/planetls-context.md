# Contexte central PlanetLS

Ce fichier sert de base commune aux prompts Codex. Il ne contient que des informations relativement stables et doit rester plus court qu'un audit.

## 1. Vision de PlanetLS

- PlanetLS veut simplifier la location saisonniere en reunissant coordination terrain, mise en relation locale et pilotage operationnel dans un meme produit.
- Le probleme general vise est la fragmentation entre proprietaires, conciergeries, artisans et outils disperses.
- La vision long terme reste progressive : prouver d'abord un noyau utile et rentable avant d'elargir la marketplace, le reseau et les fonctions IA.
- L'objectif n'est pas la croissance a tout prix mais une rentabilite durable, lisible et compatible avec des ressources limitees.

## 2. Utilisateurs

- Proprietaires
- Concierges independants
- Conciergeries
- Artisans et prestataires
- Administrateurs
- Partenaires futurs

## 3. Proposition de valeur

- Reseau professionnel specialise location saisonniere
- Marketplace locale de services
- Outil operationnel partage
- Coordination des demandes, devis, missions, sejours et paiements

## 4. Parcours metier principaux

- Demande de service
- Reception et traitement par les profils concernes
- Emission et validation de devis
- Creation de mission
- Ajout au planning ou au sejour canonique
- Suivi d'execution, preuves, timeline et notifications
- Validation et reglement
- Suivi administrateur et arbitrages

## 5. Architecture technique reelle

- Framework : Next.js App Router
- Langage : TypeScript strict cote application et tests Node
- Frontend : React 19, SCSS modules, composants UI partages internes
- Backend : route handlers Next.js + logique serveur dans `src/app/api` et `src/server`
- Base de donnees : Supabase
- Authentification : NextAuth + resolution de profil actif
- Paiements : Stripe deja present, a ne pas modifier sans demande explicite
- Tests : Node test runner pour les tests unitaires/contrats, Playwright pour l'E2E
- Build : `npm run build`

## 6. Design system

- Direction visuelle premium, calme et fonctionnelle
- Usage fort de cartes, badges, panneaux dashboard et onglets
- Palette actuelle orientee tons sable, blanc chaud, vert profond et alertes explicites
- Responsive obligatoire desktop, tablette et mobile
- Accessibilite attendue : focus visible, labels, contrastes, lecture clavier

## 7. Regles metier importantes

- Les roles et permissions sont structurants, surtout cote admin, owner, concierge et provider
- Les donnees reelles, hypotheses et simulations doivent etre distinguees explicitement
- Les workflows demande -> devis -> mission -> paiement restent sensibles et encore partiellement valides bout en bout
- Stripe et les flux financiers ne doivent pas etre modifies sans cadrage
- Les modules de simulation business ne doivent pas etre presents comme donnees certaines

## 8. Etat strategique

- Le modele economique est encore en validation
- L'offre `Conciergerie Pro` existe comme direction de travail, pas comme verite terrain finale
- Les hypotheses prix, commission, densite locale et traction restent a prouver
- La priorite reste aux tests terrain, a la clarte du segment et a la premiere valeur tangible

## 9. Contraintes de la fondatrice

- Ressources limitees
- Progression par etapes
- Recherche de rentabilite
- Limitation de la dispersion
- Preservation de la qualite de vie
- Reutilisation maximale de l'existant

## 10. Documentation utile

- [Master Plan PlanetLS](../master-plan-planetls.md)
- [Referentiel IA](./README.md)
- [Systeme de gestion des prompts](./systeme-gestion-prompts-planetls-2026-08-03.md)
- [Regles Codex](./codex-rules.md)
- [Contexte business](./contexts/business-context.md)
- [Contexte UX/UI](./contexts/ux-ui-context.md)
- [Contexte technique](./contexts/technical-context.md)
- [Contexte Pilotage Business](./contexts/pilotage-business-context.md)
- [Bibliotheque de prompts](./prompts/README.md)
- [Runs IA](./runs/README.md)
