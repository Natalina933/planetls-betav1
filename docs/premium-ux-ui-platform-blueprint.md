# Blueprint UX/UI premium Planet LS

## Intention produit

Planet LS doit etre percu comme un cockpit premium pour la location saisonniere: calme, fiable, organise et humain. L'interface doit reduire la charge mentale des proprietaires, donner aux conciergeries une maitrise operationnelle immediate et rester ultra pratique pour les artisans sur mobile.

## Principes d'experience

1. Clarifier l'etape suivante: chaque ecran affiche une action principale, un statut visible et un chemin de retour simple.
2. Prouver la confiance: profils verifies, avis, SLA, documents, photos, historique et responsables doivent etre proches des decisions.
3. Rendre l'organisation tangible: missions, disponibilites, trajets, equipes et devis doivent etre visibles sous forme de timeline, carte, badges et panneaux de synthese.
4. Garder une elegance utile: l'Art Deco sert les cadres, rythmes, separateurs et focus states, sans ajouter d'ornement qui ralentit la lecture.
5. Mobile terrain d'abord pour les artisans: boutons larges, details essentiels au-dessus du pli, accepter/refuser en un geste, navigation par mission.

## Parcours proprietaire

- Entree: recherche intelligente par ville, type de bien, service ou urgence.
- Comparaison: cartes conciergeries avec note, zone, delai de reponse, packs, garanties et avis.
- Decision: demande de devis guidee, recapitulatif clair, pieces utiles et niveau de service.
- Suivi: dashboard revenus, missions, documents, conversations et preuves d'intervention.
- Reassurance: statuts explicites, notifications calmes, historique lisible et interlocuteur nomme.

## Parcours conciergerie

- Entree: dashboard journee avec urgences, missions a assigner, disponibilites equipe et alertes.
- Pilotage: planning, carte des tournees, liste des logements et priorites par SLA.
- Commercial: devis dynamiques, packs de services, invitations proprietaires et relances.
- Operationnel: affectation artisan/equipe, checklist, preuves, messagerie contextualisee.
- Performance: taux de completion, temps gagne, revenus, satisfaction et zones sous tension.

## Parcours artisan / prestataire

- Entree: liste mobile des missions avec distance, delai, gain, urgence et contact.
- Decision: accepter/refuser rapidement avec motif simple si refus.
- Execution: adresse, photos, consignes, code d'acces, checklist et messagerie mission.
- Deplacement: trajet optimise, prochaines interventions et disponibilites.
- Cloture: preuve photo, commentaire, temps passe et statut facture.

## Direction visuelle

- Palette: ivoire, bleu-gris doux, encre profonde, sauge claire, rose argile discret, or laiton en accent.
- Typographie: display serif elegant pour titres forts, sans-serif lisible pour UI, labels courts et contrastes eleves.
- Formes: rayons faibles, cadres fins, doubles filets Art Deco, grilles nettes, separateurs diamant discrets.
- Texture: fibres ou papier tres leger, opacite faible, jamais au detriment de la lisibilite.
- Animation: 180 a 240 ms, hover subtil, feedback immediat, focus visible et transitions sans decalage de layout.

## Composants prioritaires

- SearchBar intelligente avec autocompletion et chips de filtres.
- ProfileCard premium avec preuves, zone, SLA, prix et CTA.
- MissionTimeline avec statut, responsable, heure, preuve et action rapide.
- InteractiveMap couplee a une liste, utilisable desktop et mobile.
- DynamicQuoteCard avec packs, options, total, marge et conditions.
- RouteOptimizerPanel pour trajets, temps gagne, conflits et disponibilites.
- TrustBadge, StatusBadge, ServicePackCard, NotificationItem, Modal de confirmation.

## Regles d'integration Next.js + SCSS

- Garder les composants par feature et les styles en SCSS modules.
- Exposer les tokens dans des variables CSS locales au theme, puis les reutiliser dans les modules.
- Eviter les textes longs dans les boutons et conserver des zones tactiles de 44px minimum.
- Prevoir les etats: chargement, vide, erreur, succes, non autorise et donnees partielles.
- Tester les points de rupture: 360px, 768px, 1024px et desktop large.
- Les tableaux complexes doivent devenir des cartes empilees sur mobile.

## Ecran de reference implemente

La route `/design-system` contient un prototype integre avec:

- hero premium et recherche intelligente;
- cartes personas proprietaire, conciergerie et artisan;
- recherche avec filtres, profils et carte;
- timeline missions;
- packs de services;
- panneaux de confiance et messagerie contextualisee.
