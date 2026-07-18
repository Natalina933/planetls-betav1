# Master Plan PlanetLS

> Document officiel de pilotage produit, métier et technique  
> Version initiale consolidée : 18 juillet 2026  
> Source de vérité : code du dépôt, schémas/migrations, tests, puis documentation historique  
> Propriétaire du document : direction produit PlanetLS  
> Prochaine revue : à chaque fin de lot ou au minimum toutes les deux semaines

## 0. Mode d'emploi et gouvernance

Ce document remplace les nouveaux audits transverses comme support de pilotage. Les documents historiques de `docs/` restent conservés comme preuves, spécifications détaillées et archives de décisions ; ils ne doivent plus être utilisés seuls pour déterminer l'état courant du produit.

### Règles de mise à jour

1. Le code, les migrations réellement appliquées et les tests exécutés priment sur les affirmations historiques.
2. Une page ou une route présente ne suffit pas à déclarer une fonctionnalité terminée.
3. Une fonctionnalité est `✅ Terminée` seulement si son parcours principal est branché, persistant, autorisé côté serveur et validé.
4. Une fonctionnalité est `🟡 En cours` si une surface existe mais qu'il manque persistance, couverture de bout en bout, homogénéité ou validation réelle.
5. Une fonctionnalité est `🔴 Non commencée` si elle n'existe qu'en idée ou en spécification.
6. Toute nouvelle idée va d'abord en section 7. Toute décision prise va dans le journal, puis met à jour la roadmap et la checklist si nécessaire.
7. Ne pas créer un nouvel audit global : mettre à jour ce document et lier, si indispensable, une spécification spécialisée.

### Niveaux de maturité

| Niveau | Définition |
|---|---|
| N0 — Idée | Intention sans conception validée |
| N1 — Spécifié | Parcours/règles documentés, pas de réalisation exploitable |
| N2 — Socle | UI, helper ou API partielle ; données parfois locales ou en `metadata` |
| N3 — Fonctionnel | Parcours principal persistant et utilisable, finitions ou E2E manquants |
| N4 — Validé | Parcours complet, permissions, erreurs, tests et QA réels validés |
| N5 — Piloté | N4 + métriques, alertes et amélioration continue |

### Critère de priorité

| Priorité | Sens |
|---|---|
| Critique | Bloque la fiabilité, la sécurité, la donnée, le lancement ou un parcours de valeur principal |
| Importante | Augmente fortement conversion, rétention ou efficacité opérationnelle |
| Confort | Améliore cohérence, lisibilité ou productivité sans bloquer l'usage |
| Évolution future | Pari stratégique à valider avant industrialisation |

---

## 1. Vision du projet

### Mission

PlanetLS aide les professionnels de la location saisonnière à se trouver, se faire confiance et travailler ensemble dans un même environnement : de l'identité professionnelle et la mise en relation jusqu'à la demande, au devis, à la mission, au séjour, au paiement et au suivi opérationnel.

### Ambition

Devenir le réseau professionnel opérationnel de référence de la location saisonnière en France : un réseau vivant, local et vérifiable, doublé d'un cockpit métier pour exécuter le travail quotidien.

### Valeurs

- **Confiance prouvée** : identité, certifications, assurance, avis, historique, preuves et statuts explicites.
- **Clarté** : une prochaine action compréhensible, des règles métier stables, aucun statut ambigu.
- **Utilité terrain** : mobile, rapidité, disponibilité, zones et contraintes réelles avant sophistication décorative.
- **Coopération** : faire circuler demandes, missions, informations et responsabilités entre acteurs.
- **Professionnalisme humain** : automatiser la charge administrative sans déshumaniser la relation locale.
- **Traçabilité** : conserver décisions, événements, documents et arbitrages.
- **Accessibilité** : servir aussi bien un utilisateur peu technophile qu'une structure experte en croissance.

### Objectifs

1. Réduire le temps entre inscription et première valeur : profil utile, demande reçue ou mission trouvée.
2. Fluidifier le cycle `recherche → demande → devis → mission → paiement → avis`.
3. Donner aux conciergeries un cockpit complet : logements, propriétaires, réservations, équipe, maintenance, finance et prestataires.
4. Donner aux propriétaires visibilité, contrôle et confiance sans complexité opérationnelle.
5. Donner aux artisans un canal qualifié de missions locales et un outil de suivi mobile.
6. Créer une densité locale visible pour résoudre le démarrage du réseau.
7. Piloter activation, conversion, qualité et liquidité locale par des KPI fiables.

### Positionnement

PlanetLS n'est ni un simple annuaire, ni uniquement une marketplace, ni seulement un logiciel de conciergerie. Son positionnement cible combine :

- un **réseau professionnel vertical** centré sur la location saisonnière ;
- une **marketplace locale de besoins et de missions** ;
- un **système opérationnel partagé** pour réaliser, documenter et payer le travail.

Le point d'entrée peut varier par acteur, mais le produit doit converger vers un graphe commun : personnes, entreprises, logements, zones, services, demandes, missions, séjours et preuves.

### Différenciation

- Réseau spécialisé plutôt que plateforme généraliste de services.
- Continuité entre découverte et exécution, là où les annuaires s'arrêtent au contact.
- Données métier propres à la location saisonnière : check-in/out, ménage, linge, maintenance, voyageurs, planning, SLA et urgence.
- Profils orientés preuves et capacité réelle, pas seulement présentation.
- Expérience adaptée à chaque rôle, avec permissions et données partagées maîtrisées.
- Densité locale rendue visible par le fil, la carte et le mur des missions.

### Proposition de valeur par cible

- **Propriétaire** : trouver les bons professionnels, comparer clairement et suivre son logement sans perdre le contrôle.
- **Concierge** : gagner des mandats, organiser l'exploitation, coordonner équipes et artisans, maîtriser marge et qualité.
- **Artisan / commerçant** : recevoir des missions locales qualifiées, prouver son sérieux et simplifier intervention, devis et facturation.
- **Équipe** : savoir quoi faire, où, quand et avec quelles consignes, puis laisser une preuve exploitable.
- **Administrateur** : garantir sécurité, qualité du réseau, résolution des blocages et pilotage de la croissance.

---

## 2. Acteurs et objectifs

| Acteur | Objectifs principaux | Première valeur attendue | Critère de réussite |
|---|---|---|---|
| Propriétaire | Trouver une concierge ou un prestataire fiable, formuler son besoin, comparer, suivre missions, paiements et documents | Obtenir une première réponse qualifiée | Demande transformée en collaboration puis mission réussie |
| Propriétaire professionnel | Piloter plusieurs biens, partenaires, revenus, incidents et niveaux de service | Importer/créer ses biens et identifier les responsables | Portefeuille suivi sans outils parallèles |
| Concierge / conciergerie | Trouver des propriétaires, recevoir des demandes, vendre des packs, gérer logements, séjours, planning, équipe, artisans et finances | Recevoir une demande ou intégrer un premier logement | Activité quotidienne pilotée dans PlanetLS |
| Artisan / prestataire | Afficher métiers, zone, disponibilité et preuves ; accepter des interventions ; échanger, deviser et facturer | Voir ou recevoir une mission pertinente à proximité | Intervention réalisée, prouvée et payée |
| Commerçant | Proposer produits ou services locaux récurrents aux logements/conciergeries | Être découvert sur une zone et un besoin précis | Commande ou partenariat récurrent ; rôle encore à spécifier séparément de l'artisan |
| Équipe de conciergerie | Recevoir les affectations, exécuter checklists, signaler blocages, ajouter photos/signature | Voir le planning et la mission du jour | Mission clôturée avec preuve, sans ressaisie |
| Administrateur | Gérer utilisateurs, rôles, conformité, opérations, qualité, KPI et incidents | Identifier un compte ou workflow bloqué | Réseau sain, support rapide et métriques fiables |
| Voyageur | Recevoir des informations de séjour et signaler un besoin, sans être évalué ni surprofilé | Accéder aux informations utiles de son séjour | Arrivée/départ fluide ; rôle externe prévu, pas encore un espace utilisateur autonome |

### Principes de responsabilité

- Le propriétaire décide du besoin, du devis et du paiement.
- La conciergerie orchestre l'exploitation et les intervenants autorisés.
- L'artisan exécute son périmètre et fournit les preuves nécessaires.
- L'équipe n'accède qu'aux logements, missions et données utiles à son affectation.
- L'administrateur supervise mais les actions sensibles doivent rester tracées.
- Le voyageur reste un bénéficiaire opérationnel ; aucun scoring sensible ou profil commercial implicite.

---

## 3. État actuel du projet au 18 juillet 2026

### Photographie technique vérifiée

- Next.js App Router 16.1.6, React 19, TypeScript, Supabase, NextAuth, SCSS et Vercel.
- 118 pages App Router, 103 routes API, 42 fichiers de tests et 76 composants TSX/JSX sous `src/components` et `src/features`.
- 158 tests exécutés le 18/07/2026 : 158 réussis, aucun échec.
- Les migrations sont réparties entre `supabase/migrations` et `database/migrations` : cette double source reste une dette de gouvernance.
- Les rôles owner, concierge, provider/artisan et admin disposent de surfaces dédiées.

### Tableau fonctionnel construit depuis le code

| Fonctionnalité | État | Niveau | Observations factuelles |
|---|---|---:|---|
| Authentification, inscription, rôles | 🟡 En cours | N3 | Login/register, NextAuth, proxy et guards API présents ; onboarding et catégories legacy restent complexes ; E2E absent |
| Onboarding multi-profils | 🟡 En cours | N3 | Tunnel multi-étapes et événements présents ; personnalisation concierge plus mûre que owner/provider ; cohérence et instrumentation à finir |
| Dashboard propriétaire | 🟡 En cours | N3 | Cockpit riche et données réelles ; quelques strates historiques et états UX restent à harmoniser |
| Dashboard concierge | 🟡 En cours | N3 | Surface la plus avancée : cockpit, modes, objectifs, alertes, finance, CRM, maintenance ; plusieurs fonctions récentes restent partiellement locales/`metadata` |
| Dashboard artisan/provider | 🟡 En cours | N3 | E2E mission → intervention → preuve média privée → facture liée validé ; paiement et profil de confiance restent incomplets |
| Dashboard administrateur | 🟡 En cours | N3 | Overview, contrôle, utilisateurs et vues par rôle ; métriques présentes mais pilotage et actions admin à valider en conditions réelles |
| Profils professionnels | 🟡 En cours | N3 | Profil concierge riche, owner preferences persistées ; profil artisan dédié, certifications/avis/historique complet non aboutis |
| Recherche et matching de concierges | 🟡 En cours | N3 | Recherche, filtres, cartes publiques, alertes et sélection multi-destinataires ; qualité dépend de la densité et de champs legacy |
| Demandes de service | 🟡 En cours | N3 | E2E demande → devis accepté → mission → facture payée par webhook Stripe signé validé ; création de la session Checkout hébergée reste à couvrir avec une clé test |
| Devis | 🟡 En cours | N3 | Création, documents, consultation, comparaison, acceptation/refus et lien demande présents ; parcours complet à valider |
| Missions | 🟡 En cours | N3 | CRUD, permissions, statuts, détails riches, fichiers, événements et affectations ; plusieurs données riches sont en `metadata` |
| Missions urgentes | 🟡 En cours | N3 | Publication/acceptation et surfaces owner/concierge présentes ; liquidité réelle et règles d'attribution à éprouver |
| Planning | 🟡 En cours | N3 | Pages owner/concierge/provider, calendrier et statuts ; planification après paiement validée E2E owner/concierge ; garde anti-chevauchement actif ; charge quotidienne visible ; table équipe, RLS et API ajoutées avec repli local ; migration Supabase à appliquer avant persistance réelle, puis drag-and-drop et temps de trajet à consolider |
| Logements | 🟡 En cours | N3 | Création, édition, photos, vues owner/concierge et collaborations ; coexistence `housing`/`properties` à normaliser |
| Messagerie owner/concierge | 🟡 En cours | N3 | Conversations/messages et UI des deux rôles ; temps réel, notifications et parcours E2E à confirmer |
| Messagerie provider | 🟡 En cours | N3 | API et UI présentes, synchronisation du dernier message durcie ; QA fermeture/réouverture et chaîne client-intervention incomplètes |
| Notifications et alertes | 🟡 En cours | N2 | Centre de notifications, alertes concierge/provider et événements existent ; distribution uniforme, push et préférences manquent |
| Factures et paiements | 🟡 En cours | N3 | Factures, documents, checkout/sync/webhook, acompte/solde modélisés ; webhook de paiement signé validé E2E, Checkout hébergé et échecs visibles restent partiels |
| Tarification, packs et contrats | 🟡 En cours | N3 | Pricing, segments, règles, scénarios, packs et modèles de contrat ; complexité élevée et validation métier de bout en bout à faire |
| CRM propriétaires | 🟡 En cours | N2 | Helper et page contacts enrichie ; consolidation utile, mais persistance dédiée et timeline unifiée non finalisées |
| Équipe et affectations | 🟡 En cours | N2 | Modèle métier, page et action d'affectation ; tables spécialisées, permissions fines et persistance complète manquent |
| Réservations et séjours voyageurs | 🟡 En cours | N2 | Moteur, API réservations, API séjours, page concierge et tests ; données principalement via missions/`metadata`, pas d'espace voyageur |
| Maintenance et artisans | 🟡 En cours | N3 | Affectation, exécution, preuve média privée avec empreinte SHA-256 et facture provider liée validées E2E ; paiement reste à couvrir |
| Litiges et preuves | 🟡 En cours | N2 | Migrations inspections/litiges, routes API et page owner existent ; parcours obligatoire post-checkout et validation E2E non prouvés |
| Carte interactive réseau | 🔴 Non commencée | N1 | Bibliothèques carte et prototypes de recherche existent, mais pas de carte unifiée acteurs + missions + recherches |
| Fil d'actualité professionnel | 🔴 Non commencée | N0 | Aucun modèle ni flux réseau professionnel canonique |
| Mur des missions | 🔴 Non commencée | N1 | Les missions urgentes fournissent un socle, sans marketplace géolocalisée ouverte et filtrable |
| Avis, réputation et certifications | 🟡 En cours | N2 | API reviews et champs de profil existent ; expérience complète, modération et preuves vérifiées non abouties |
| KPI produit | 🟡 En cours | N2 | Endpoint overview et affichage admin ; activation J+7, temps de première valeur, conversion et séries fiables incomplets |
| Tests E2E navigateur | 🟠 Partiel | N3 | 3 smoke tests et 2 flux transactionnels complets passent ; CI prépare tests, lint, build et E2E, première exécution distante en attente des secrets GitHub ; Checkout Stripe test reste à faire |
| Responsive et accessibilité | 🟡 En cours | N3 | Socle, checklists et composants accessibles ; audit systématique clavier/mobile et tests automatisés manquent |
| Design system | 🟡 En cours | N3 | Primitives, tokens, route showcase et direction Art Déco ; double strate UI, snapshot portable et tests au vert |
| SEO et acquisition publique | 🟡 En cours | N2 | Pages publiques et profils publics présents ; metadata, Open Graph, JSON-LD, pages locales et mesure acquisition restent à faire |
| PWA / push / hors ligne | 🔴 Non commencée | N1 | Intentions mobile documentées ; checklist/signature actuellement locales, pas de PWA terrain industrialisée |
| Assistant décoration | 🟠 Partiel | N2 | Page/API, moteur, migration/RLS et tests présents ; E2E lecture passe mais la table n'est pas appliquée sur la base connectée ; image, partage owner et validation terrain restent à finaliser |

### Lecture synthétique

Le produit est **fonctionnellement large mais pas encore validé comme un tout**. Le meilleur qualificatif global est `N3 — Fonctionnel en consolidation`. Le risque principal n'est pas l'absence de pages ; c'est l'écart entre richesse apparente, persistance réelle, cohérence des modèles et preuve E2E.

---

## 4. Audit documentaire consolidé

### Enseignements conservés

- Réutiliser les composants et helpers existants avant de créer une nouvelle strate.
- Concevoir chaque profil selon son persona et sa première valeur, avec un socle commun limité.
- Garder une distinction nette entre demande, devis, mission et paiement.
- Centraliser statuts et transitions dans les helpers métier partagés.
- Faire du mobile terrain une priorité pour équipes et artisans.
- Exposer confiance, zone, disponibilité, services et preuve près de chaque décision.
- Harmoniser loading, vide, erreur, succès, focus et prochaine action.
- Piloter activation, délai de première valeur, conversion, qualité et liquidité.
- Conserver l'Art Déco comme accent structurel sobre, jamais au détriment de la lecture.

### Familles de doublons fusionnées

| Famille documentaire | Documents concernés | Décision canonique |
|---|---|---|
| Onboarding/personas | audits concierge des 25–26/04, gap analysis 29/04, reprise UX 29/04 | Conserver les personas simplicité/expert ; statut courant dans ce Master Plan |
| Audit global par rôles | audit approfondi 18/05, audit code/permissions 18/06, audits Sprint 1 des 07 et 12/07 | Le présent tableau fonctionnel devient la vue officielle |
| Demande → devis → mission → paiement | trois audits des 05–06/06 + architecture composants | Un workflow partagé, statuts centralisés, pas de composants parallèles |
| Profils utilisateurs | audit 18/06, cartographie, matrice, spec cible, tickets/issues, reprise owner du 19/06 | La spec persona reste détaillée ; roadmap/checklist ici fait foi |
| UX/UI | guide UX, blueprint premium, design system, handoff Figma, audit UI, checklist responsive | Un seul principe : cockpit calme, preuve visible, primitives partagées, mobile et a11y obligatoires |
| QA/KPI | checklist P0, runbook E2E, cadrage KPI | Les scénarios restent des annexes d'exécution ; leur statut est suivi ici |

### Contradictions et écarts détectés

1. **“Socle exploitable en production” contre absence de validation E2E.** Les audits de mai qualifient les trois espaces d'exploitables, mais le runbook ne prouve aucun parcours complet ; l'unique essai owner est `FAIL partiel`. Statut officiel : N3, pas N4.
2. **“Build et validations au vert” contre baseline UI datée.** L'audit du 12/07 rapportait un build valide, mais le snapshot UI n'avait pas été actualisé après les évolutions des primitives et dépendait des fins de ligne du système. Le test a été rendu portable et la baseline doit rester une décision de revue explicite.
3. **Fonctionnalité créée contre fonctionnalité persistée.** CRM, équipe, maintenance, mobile et une partie des réservations disposent de helpers/UI/tests, mais les documents récents reconnaissent l'usage de `metadata` ou du stockage local en attente de tables dédiées. Ils restent N2.
4. **Profil artisan “workspace complet” contre audit profils.** Le workspace existe, mais le profil métier, les métiers/spécialités, preuves, disponibilités, avis et complétude ne forment pas encore une identité professionnelle complète.
5. **Voyageur “module livré” contre acteur autonome.** Le centre séjours est bien livré pour la concierge ; le voyageur n'a pas d'espace ou d'identité autonome. Il reste acteur externe prévu.
6. **Source de schéma ambiguë.** Deux dossiers de migrations coexistent et les types Supabase ne couvrent pas toutes les tables ; il faut choisir `supabase/migrations` comme source canonique et régénérer les types.
7. **Design system stabilisé contre double strate UI.** Les primitives sont solides, mais `src/components/ui` et `src/app/components/ui` coexistent et de nombreux SCSS locaux divergent encore.
8. **React/Next alignement.** Next est en 16.1.6, tandis que `react` et `react-dom` sont déclarés `^19.0.0`; une vérification de version résolue et des correctifs de sécurité doit être intégrée au lot de stabilisation.

### Informations devenues obsolètes

- Le conflit Git historique de l'API register signalé en avril n'est plus présent.
- L'absence d'espace artisan décrite dans les premiers audits est dépassée : un workspace provider existe.
- L'absence de preferences owner est dépassée : page, politique de patch et tests existent depuis juin.
- L'absence de séjours voyageurs côté concierge est dépassée depuis le 12/07.
- Les feuilles de route datées d'avril à juin ne doivent plus être exécutées dans leur ordre initial ; leurs éléments non réalisés sont repris dans la roadmap ci-dessous.
- Les nombres de pages/routes cités dans les anciens audits sont des instantanés et ne doivent plus être recopiés comme état courant.

### Rôle futur des documents existants

Les spécifications détaillées restent valables lorsqu'elles décrivent des règles métier non reproduites ici : tarification, litiges, profils, accessibilité et scénarios E2E. Elles sont des **annexes**, pas des tableaux de bord concurrents. Aucun document n'est supprimé.

---

## 5. Audit des fonctionnalités et priorités

### Terminées au sens “socle livré”, à préserver

- Architecture App Router et espaces séparés owner/concierge/provider/admin.
- Guards d'autorisation métier côté API et tests de permissions principaux.
- Workflow partagé demande/devis/mission et helpers de statuts.
- Création/édition de logements et recherche publique de concierges.
- APIs de facturation, documents, checkout et synchronisation.
- Design tokens, primitives UI et composants opérationnels réutilisables.
- Tests unitaires/contrats métier étendus.

Ces éléments ne sont pas tous N4 ; “terminés” signifie ici qu'ils ne doivent pas être recréés, mais consolidés.

### Incomplètes — priorité critique

| Fonctionnalité | Manque principal | Sortie attendue |
|---|---|---|
| Parcours E2E par rôle | Aucun scénario automatisé complet | Owner et concierge : inscription/connexion → demande → devis → mission → paiement ; provider : mission → intervention → preuve → facture |
| Persistance des modules récents | `metadata` et local storage pour équipe, maintenance, mobile, réservations | Tables, RLS, Storage, types générés, migration et tests d'intégration |
| Gouvernance Supabase | Deux sources de migrations, types incomplets | Source canonique, inventaire appliqué, types régénérés, suppression progressive des casts loose |
| Qualité CI | Baseline UI à maintenir après revue | Snapshot portable LF/CRLF, mise à jour volontaire après évolution acceptée |
| Observabilité produit | KPI de conversion/activation incomplets | Événements fiables et dashboard funnel par rôle/zone |
| Profil artisan | Identité métier et confiance incomplètes | Métiers, spécialités, zone, disponibilité, documents, portfolio, complétude |

### Incomplètes — priorité importante

- Statuts et prochaines actions homogènes sur demandes, devis, missions, factures et paiements.
- Notifications structurées, préférences et relances ; push plus tard.
- Temps réel et robustesse de messagerie sur les trois rôles.
- Planning avec conflits, capacité, affectation et distances.
- Paiement consolidé au niveau mission, traitement visible des échecs et relances.
- Litiges/preuves obligatoires selon règles de checkout.
- Profil owner/concierge/provider unifié sans conteneur polymorphe `availability_hours`.
- Accessibilité clavier, focus trap et responsive vérifiés sur les parcours critiques.
- Encodage français résiduel et cohérence UI.

### Manquantes — priorité stratégique importante

- Carte réseau unifiée.
- Mur des missions local et mécanisme de candidature/attribution.
- Fil d'actualité professionnel utile et modéré.
- Programme d'amorçage local et outils d'invitation/parrainage mesurés.
- Pages d'acquisition par zone et par besoin avec profils vérifiés.

### Confort

- Widgets configurables, recherche globale serveur et favoris synchronisés.
- Exports finance/comptabilité.
- Drag-and-drop avancé et optimisation des tournées.
- Consolidation progressive des deux strates UI et des SCSS locaux.
- Tests visuels ciblés et analyse de bundle par dashboard.

### Évolutions futures

- PWA hors ligne, push et géolocalisation de preuve consentie.
- Recommandation/matching assisté, après disponibilité de données fiables.
- Automatisation des relances et affectations, toujours explicable et réversible.
- Offre commerçants et achats récurrents, après validation du besoin terrain.
- Espace voyageur limité et sécurisé, uniquement si sa valeur dépasse le coût et le risque données.

---

## 6. Roadmap priorisée valeur / effort

### Court terme — stabiliser et prouver (0 à 8 semaines)

| Ordre | Lot | Valeur | Effort | Résultat mesurable |
|---:|---|---|---|---|
| 1 | Remettre CI au vert et figer une baseline | Haute | Faible | Tests, lint, build et snapshot acceptés |
| 2 | Automatiser deux parcours E2E critiques + un provider | Très haute | Moyen | 3 scénarios exécutables en CI, preuves et données de test maîtrisées |
| 3 | Canoniser migrations/types Supabase | Très haute | Moyen | Une source, types alignés, inventaire des tables/RLS |
| 4 | Persister maintenance, équipe, réservations et rapports terrain | Très haute | Élevé | Plus de donnée critique uniquement locale/`metadata` |
| 5 | Finaliser profil artisan et confiance | Très haute | Moyen | Profil publiable et filtrable, complétude mesurée |
| 6 | Instrumenter activation et funnel | Très haute | Moyen | Inscription → profil → demande/mission → paiement par rôle et zone |
| 7 | Pilote d'acquisition dans une zone | Très haute | Moyen | Premier noyau local actif et missions réelles |

### Moyen terme — créer la liquidité et la rétention (2 à 6 mois)

1. Lancer le mur des missions géolocalisé à partir des missions urgentes et demandes existantes.
2. Déployer la carte réseau unifiée, d'abord sur la zone pilote.
3. Introduire un fil professionnel limité à des objets structurés : recherche, disponibilité, mission, logement, prestation.
4. Unifier réputation, certifications, portfolio, avis et statistiques vérifiables.
5. Renforcer planning, capacité équipe, conflits, attribution et tournées.
6. Consolider CRM, finance, relances et paiement au niveau mission.
7. Produire pages locales, SEO structuré et boucles d'invitation/parrainage.

### Long terme — devenir le réseau professionnel de référence (6 à 18 mois)

1. Étendre ville par ville avec seuils de densité avant ouverture large.
2. Déployer PWA terrain, push, offline léger et preuves synchronisées.
3. Ajouter recommandations explicables basées sur zone, disponibilité, qualité et historique.
4. Ouvrir l'écosystème commerçants/partenaires après validation du modèle récurrent.
5. Créer benchmarks anonymisés de performance pour les professionnels.
6. Étudier un espace voyageur minimal, sans scoring ni collecte excessive.

### Ce qui n'est pas prioritaire maintenant

- Ajouter de nouveaux dashboards sans fermer les parcours existants.
- Créer une nouvelle bibliothèque UI ou un store global.
- Industrialiser une IA de matching avant d'avoir densité, données et métriques fiables.
- Étendre nationalement avant d'obtenir une liquidité démontrée dans une zone pilote.

---

## 7. Idées stratégiques — registre vivant

### 7.1 PlanetLS comme réseau professionnel

Le changement de cap est officiel : PlanetLS doit être conçu comme le réseau professionnel de la location saisonnière. La marketplace et le cockpit sont ses moteurs transactionnel et opérationnel, pas sa définition complète.

Le graphe réseau cible relie :

`Professionnel ↔ entreprise ↔ zone ↔ compétence ↔ logement ↔ besoin ↔ mission ↔ preuve ↔ avis`

Chaque nouvelle fonction doit renforcer au moins une boucle : découverte, confiance, collaboration, exécution ou réputation.

### 7.2 Profils professionnels évolués

Le profil cible contient : identité, entreprise, compétences, disponibilités, zones, services, certifications, assurance, portfolio, avis, expérience, statistiques, historique et capacité opérationnelle.

Règles :

- distinguer données déclarées, vérifiées et calculées ;
- ne montrer publiquement que ce qui aide une décision professionnelle ;
- rattacher les statistiques à des événements réels ;
- ne pas créer de score opaque unique ;
- permettre à chaque rôle de comprendre et améliorer sa complétude.

### 7.3 Fil d'actualité professionnel

Le fil ne doit pas devenir un réseau social générique. La V1 doit publier des cartes structurées :

- « Je recherche une concierge » ;
- « Je suis disponible » ;
- « Je cherche un artisan » ;
- nouvelle mission ;
- nouvelle prestation ;
- nouveau logement.

Chaque publication possède zone, durée de validité, auteur vérifié, catégorie, CTA et modération. Le fil est filtré par pertinence locale ; les contenus expirés disparaissent. Une activité système utile peut animer le réseau sans inventer de faux utilisateurs : nouvelles zones couvertes, missions pourvues, profils vérifiés, tendances agrégées.

### 7.4 Carte interactive

La carte doit afficher par couches : concierges, propriétaires ayant choisi d'être visibles, artisans, missions et recherches. Les adresses privées et logements ne sont jamais exposés précisément sans autorisation. V1 : agrégation par ville/rayon, liste synchronisée, filtres et CTA. Le prototype carte/recherche actuel sert de socle visuel, pas de module final.

### 7.5 Mur des missions

Le mur inverse la recherche : les concierges et artisans voient les opportunités proches d'eux. Une carte mission montre service, zone approximative, délai, urgence, budget éventuel, preuves requises et donneur d'ordre vérifié. La candidature doit être simple ; l'accès aux coordonnées intervient après acceptation selon les règles métier.

### 7.6 Registre d'idées à évaluer

| Idée | Hypothèse | Signal de validation | Statut |
|---|---|---|---|
| Disponibilité en un clic | Rend immédiatement les profils actionnables | Plus de mises en relation dans les 7 jours | À cadrer |
| Parrainage par professionnel | Le réseau existant recrute mieux qu'une publicité froide | Invitations activées et première action utile | À tester |
| Badge “répond rapidement” | Réduit l'incertitude | Hausse du taux de contact et de réponse | Données requises |
| Packs locaux récurrents | Les conciergeries veulent des partenaires récurrents | Réachat mensuel | À explorer |
| Pages de tension locale | Montrer besoins réels attire l'offre | Inscriptions qualifiées par zone | À tester |

---

## 8. Acquisition des premiers utilisateurs — priorité stratégique

### Le vrai problème

PlanetLS est un réseau multi-faces. Une plateforme vide n'est pas seulement visuellement pauvre : elle ne fournit aucune première valeur. Une expansion nationale prématurée disperse propriétaires, concierges et artisans, réduit les probabilités de réponse et rend les KPI trompeurs.

La stratégie recommandée est donc **locale, opérée manuellement au début et centrée sur des missions réelles**.

### Comparaison des stratégies

| Stratégie | Avantage | Risque | Adaptation PlanetLS |
|---|---|---|---|
| Publicité nationale | Volume rapide | Trafic froid, réseau dispersé, coût élevé | Faible avant preuve locale |
| SEO national | Actif durable | Lent et concurrence élevée | À préparer, pas moteur initial |
| Ville pilote | Densité et apprentissage | Croissance géographique plus lente | Meilleure option |
| Partenariats locaux | Confiance et accès à des communautés | Temps commercial | Très adapté |
| Concierge comme tête de réseau | Apporte propriétaires, logements et artisans | Dépendance à quelques comptes | Très adapté avec diversification |
| Missions réelles “concierge blanc” | Valeur immédiate malgré peu d'utilisateurs | Opérations manuelles coûteuses | Recommandé au lancement |
| Freemium large | Réduit la friction | Comptes inactifs et support | À limiter à une activation guidée |
| Parrainage | Coût maîtrisé, confiance | Ne marche qu'après première valeur | À activer dans la zone pilote |

### Stratégie progressive recommandée

#### Phase A — préparer une zone (2 semaines)

Choisir une zone à forte densité de locations, accessible à l'équipe et avec quelques contacts existants. Définir un seuil minimal avant communication publique : par exemple 5 conciergeries actives, 15 artisans/prestataires vérifiés, 20 propriétaires/logements qualifiés et 10 besoins réels.

Créer manuellement les profils avec les professionnels, vérifier leurs données, services et zones, et recueillir leur disponibilité. Importer uniquement avec consentement ; aucun faux profil.

#### Phase B — garantir la première valeur (semaines 3 à 6)

- Recruter d'abord 3 à 5 conciergeries “ancres”.
- Leur offrir une mise en place accompagnée : profil, logements, packs, planning et besoins artisans.
- Transformer leurs besoins réels en premières missions du mur.
- Recruter ensuite les artisans demandés, métier par métier.
- Inviter les propriétaires déjà liés via le flux d'invitations existant.
- Faire le matching manuellement lorsque nécessaire et documenter chaque friction.

La plateforme peut paraître vivante grâce à de vrais événements structurés : disponibilités déclarées, nouvelles missions, profils vérifiés et logements ajoutés. Il ne faut jamais simuler une activité inexistante.

#### Phase C — rendre la boucle reproductible (mois 2–3)

- Lancer mur des missions et carte sur la zone uniquement.
- Ajouter parrainage professionnel et invitation propriétaire.
- Publier des études/cas locaux et pages “missions à pourvoir à [ville]”.
- Nouer des partenariats avec offices de tourisme, réseaux de propriétaires, agences, organismes de formation, fournisseurs de linge et collectifs d'artisans.
- Mesurer acquisition → activation → première réponse → mission → rétention.

#### Phase D — étendre par grappes (après preuve)

Ouvrir une nouvelle zone seulement lorsque la précédente atteint des seuils : réponse médiane < 24 h, au moins 60 % des demandes avec réponse, 30 % transformées en échange qualifié, missions récurrentes et rétention à 30 jours. Répliquer le playbook, adapter les métiers dominants et nommer un ambassadeur local.

### Offre de lancement

- Conciergerie ancre : onboarding assisté, import accompagné, visibilité locale prioritaire contre retours hebdomadaires.
- Artisan fondateur : profil vérifié gratuit pendant la phase pilote et accès prioritaire aux missions, sans promesse artificielle de volume.
- Propriétaire : demande accompagnée et réponse humaine garantie dans la zone pilote.
- Ambassadeur : reconnaissance visible et avantages limités dans le temps, liés à des utilisateurs réellement activés.

### KPI de lancement

| KPI | Définition | Cible pilote initiale |
|---|---|---:|
| Densité d'offre | Pros actifs et vérifiés par métier/zone | ≥ 3 options sur chaque besoin prioritaire |
| Taux d'activation | Inscrits accomplissant la première action utile en 7 jours | ≥ 60 % accompagnés |
| Temps de première valeur | Inscription → profil publiable, demande ou mission | < 48 h |
| Taux de réponse | Demandes avec réponse qualifiée | ≥ 60 % |
| Délai de réponse | Médiane première réponse | < 24 h |
| Conversion en mission | Demandes devenues missions | À baseliner, puis améliorer par cohorte |
| Liquidité du mur | Missions avec au moins une candidature adaptée | ≥ 70 % dans la zone pilote |
| Rétention 30 jours | Pros ayant une nouvelle action utile | ≥ 40 % |
| Part organique | Activés venant d'une invitation/parrainage | Croissante mois après mois |

### Expériences prioritaires

1. Tester deux messages : « réseau professionnel local » contre « cockpit de gestion » selon la cible.
2. Comparer onboarding autonome et onboarding accompagné sur activation à J+7.
3. Tester l'alerte disponibilité et le mur des missions avant un fil complet.
4. Tester une page locale avec besoins réels et profils vérifiés.
5. Interviewer systématiquement les non-répondants et missions non pourvues.

---

## 9. Checklist permanente

Dates : `—` signifie non planifié. Le responsable est un rôle, à remplacer par un nom lors de l'engagement du lot.

| Fonctionnalité / action | Statut | Priorité | Date cible | Responsable | Commentaires / preuve attendue |
|---|---|---|---|---|---|
| Baseline tests/lint/build/snapshot | ✅ | P0 Critique | 2026-07-18 | Tech lead | 158/158 tests, lint et build Next.js de 164 pages au vert |
| E2E owner complet | 🟠 | P0 Critique | Court terme | QA + Produit | Demande → devis → mission → facture payée par webhook signé PASS ; configurer une clé Stripe test pour valider Checkout |
| E2E concierge complet | 🟠 | P0 Critique | Court terme | QA + Produit | Réception → devis envoyé → mission → facture payée → créneau planifié et relu owner PASS ; Checkout hébergé reste à valider |
| E2E provider complet | ✅ | P0 Critique | 2026-07-18 | QA + Provider | Mission → intervention → preuve média privée → facture liée PASS ; prochaine évolution : paiement Stripe test |
| Source canonique migrations | 🟠 | Critique | Court terme | Backend | supabase/migrations canonique ; 20 fichiers historiques figés dans database/migrations ; contrôle CI ajouté ; inventaire distant bloqué sans token |
| Types Supabase régénérés | 🟡 | Critique | Court terme | Backend | Tables actives entièrement typées |
| Persistance maintenance | 🟡 | Critique | Court terme | Backend + Concierge | Tables/RLS/API/UI/tests |
| Persistance équipe/affectations | 🟡 | Critique | Court terme | Backend + Concierge | Permissions fines incluses |
| Persistance réservations/terrain | 🟡 | Critique | Court terme | Backend + Mobile | Photos/signatures/checklists Storage |
| Profil artisan complet | 🟡 | Critique | Court terme | Produit + Provider | Métiers, zone, disponibilité, preuves |
| KPI activation/funnel | 🟡 | Critique | Court terme | Data + Produit | Cohortes rôle/zone, définitions stables |
| Paiement consolidé mission | 🟡 | Importante | Moyen terme | Backend + Produit | Acompte, solde, échec, relance visibles |
| Notifications structurées | 🟡 | Importante | Moyen terme | Produit + Backend | Préférences et événements utiles |
| Litiges/preuves E2E | 🟡 | Importante | Moyen terme | Produit + QA | Parcours post-checkout validé |
| Accessibilité parcours critiques | 🟡 | Importante | Court terme | Front + QA | Clavier, focus, contraste, 360/768/1280 |
| Pilote acquisition local | 🔴 | Critique | Court terme | Growth + Direction | Zone, ancres, offre, seuils et suivi hebdo |
| Mur des missions V1 | 🔴 | Importante | Moyen terme | Produit + Tech | Géolocalisé, expirant, candidature simple |
| Carte réseau V1 | 🔴 | Importante | Moyen terme | Produit + Front | Confidentialité et liste synchronisée |
| Fil professionnel V1 | 🔴 | Importante | Moyen terme | Produit | Objets structurés, modération, expiration |
| Réputation/certifications | 🟡 | Importante | Moyen terme | Produit + Admin | Déclaré/vérifié/calculé distingués |
| SEO local et données structurées | 🟡 | Importante | Moyen terme | Growth + Front | Pages zone, OG, JSON-LD, conversion |
| PWA/push/offline | 🔴 | Évolution future | Long terme | Mobile + Backend | Après persistance et E2E |
| Assistant décoration : partage owner et image | 🟠 | P2 Important | Moyen terme | Produit + Concierge | Confirmer valeur terrain, envoi traçable et génération d'image réelle |

### Definition of Done commune

Une ligne ne passe à `✅` que si :

- règles métier et propriétaire de la donnée identifiés ;
- schéma/migration/RLS et types alignés si nécessaire ;
- permissions contrôlées côté serveur ;
- loading, vide, erreur, succès et retry traités ;
- responsive 360/768/1280 et clavier vérifiés ;
- tests unitaires/contrats et au moins une preuve de parcours ;
- événements KPI ajoutés si la fonction influence le funnel ;
- documentation et journal mis à jour dans le même lot.

---

## 10. Journal du projet

### Format obligatoire

| Date | Type | Décision / évolution | Motif | Impact | Responsable |
|---|---|---|---|---|---|
| AAAA-MM-JJ | Produit / Technique / UX / Go-to-market | Formulation courte | Données ou arbitrage | Code, données, roadmap, utilisateurs | Nom/rôle |

### Journal consolidé

| Date | Type | Décision / évolution | Motif | Impact | Responsable |
|---|---|---|---|---|---|
| 2026-04-25 | UX | Conserver deux modes d'accompagnement concierge : simplicité et expert | Besoins et aisance numérique très différents | Onboarding et densité UI adaptatifs | Produit |
| 2026-05-18 | Technique | Durcir la messagerie provider et synchroniser le dernier message | Fiabilité des conversations | Routes provider messages | Tech |
| 2026-05-18 | Produit | Introduire KPI partagés owner/concierge/provider | Mesurer activation et conversion | Endpoint KPI + admin, encore incomplet | Produit/Data |
| 2026-05-25 | UX | Adopter une checklist responsive/a11y permanente | Hétérogénéité des dashboards | Critère de sortie de chaque lot UI | Front/QA |
| 2026-06-05 | Métier | Centraliser demande → devis → mission et séparer leurs statuts | Éviter transitions contradictoires | Helpers et événements de workflow | Produit/Tech |
| 2026-06-06 | Architecture | Réutiliser/améliorer avant de créer un composant | Réduire duplication et strates concurrentes | Pages comme assembleurs, helpers partagés | Tech lead |
| 2026-06-06 | Paiement | Supporter paiement complet ou acompte/solde et consolider au niveau mission | Clarté owner/concierge | Workflow paiement à finaliser | Produit/Backend |
| 2026-06-18 | Sécurité | Contrôler les autorisations dans les APIs, jamais uniquement dans le proxy | Défense en profondeur | Guards métier et tests de permissions | Backend |
| 2026-06-19 | Produit | Concevoir les profils par persona et isoler les préférences owner | Le profil polymorphe ne supporte pas les métiers | Spec cible, policy de patch, owner preferences | Produit/Backend |
| 2026-07-07 | Architecture | Geler les conventions du Sprint 1 avant nouvelles grandes évolutions | Base riche mais fragmentée | UI, types, Supabase et workflows à consolider | Tech lead |
| 2026-07-12 | Produit | Enrichir le cockpit concierge : CRM, équipe, maintenance, réservations, mobile | Faire de PlanetLS un outil quotidien | Socles livrés, persistance spécialisée attendue | Produit/Tech |
| 2026-07-12 | Produit | Créer le centre séjours sans scoring voyageur | Besoin opérationnel et minimisation des données | API/page concierge, voyageur non autonome | Produit |
| 2026-07-18 | Stratégie | Positionner PlanetLS comme réseau professionnel de la location saisonnière | Résoudre découverte, confiance, liquidité et rétention | Fil, carte, mur des missions et profils évolués entrent dans la cible | Direction produit |
| 2026-07-18 | Gouvernance | Faire du présent Master Plan la référence officielle | Éviter la multiplication des audits | Les documents existants deviennent des annexes historiques/spécialisées | Direction produit |
| 2026-07-18 | QA | Qualifier le produit global N3 et non “terminé” | Baseline initiale 153/154, puis 157/157 après correction du snapshot ; pas d'E2E complet et modules récents partiellement persistés | Priorité à la preuve et à la consolidation | QA/Tech |
| 2026-07-18 | Produit | Ajouter un assistant décoration au cockpit concierge | Aider la concierge à préparer une recommandation budgétée pour un propriétaire | Page/API/helper, table `decoration_ai_reports`, navigation et tests ; partage et génération visuelle restent partiels | Produit/Tech |
| 2026-07-18 | QA | Rendre le snapshot UI indépendant des fins de ligne | Éviter les échecs globaux LF/CRLF sans changement logique | Hash normalisé et baseline UI régénérée ; 157/157 tests validés | Tech |
| 2026-07-18 | QA | Valider la baseline de production | Fermer le lot de stabilisation avant les E2E | Lint sans erreur et build Next.js réussi avec 164 pages ; l'échec `spawn EPERM` initial était lié à la sandbox Windows | Tech |
| 2026-07-18 | QA | Automatiser les smoke tests des trois espaces | Remplacer les runbooks sans preuve par une validation navigateur reproductible | Playwright, comptes workspace locaux, serveur `.next-e2e`, 3/3 scénarios PASS et workflow GitHub ajouté | QA/Tech |
| 2026-07-18 | Architecture | Utiliser Webpack pour le serveur E2E | Turbopack a paniqué en développement parallèle ; Webpack a révélé un sélecteur CSS Module invalide | `NEXT_DIST_DIR` isole le runner ; correction SCSS compatible avec les deux bundlers | Tech |
| 2026-07-18 | QA | Valider le flux commercial multi-rôles | Prouver la chaîne navigateur → API → données → restitution, au-delà des smoke tests | Demande, devis accepté, mission générée et facture émise/visible owner ; 1/1 PASS | QA/Tech |
| 2026-07-18 | Paiement | Reporter le paiement réel jusqu'a la configuration Stripe test | `STRIPE_SECRET_KEY` absente ; le checkout répond proprement `503` sans transaction | Configurer uniquement des clés test puis valider checkout et synchronisation | Tech/Produit |
| 2026-07-18 | Architecture | Rendre la création de mission compatible avec le schéma connecté | L'E2E a révélé l'absence de `missions.title` et l'obligation de `service_id` | Repli contrôlé vers `service_label`, service catalogue conservé dans le devis puis la mission, test unitaire dédié | Tech |
| 2026-07-18 | QA | Valider le flux opérationnel provider | Prouver l'affectation multi-rôles, la restitution terrain et la facturation | Mission → intervention → preuve → `completed` → facture liée de 90 €, 1/1 PASS | QA/Tech |
| 2026-07-18 | Architecture | Réutiliser le moteur de facturation pour les providers | Éviter un second système tout en empêchant la facturation de missions arbitraires | Route intervention-scopée, contrôle d'appartenance/statut, création idempotente et filtre `providerInterventionId` | Tech |
| 2026-07-18 | Architecture | Corriger la route mission/provider pour le schéma connecté | UUID valides rejetés et lecture dépendante de `missions.title` | Validateur UUID restauré, résolution par chemin et normalisation `title`/`service_label` | Tech |
| 2026-07-18 | Architecture | Ouvrir les preuves média aux artisans affectés uniquement | Permettre la restitution terrain sans exposer les fichiers des autres missions | Bucket privé existant réutilisé, contrôle par `provider_interventions.metadata.mission_id`, SHA-256 et URL signée ; E2E 1/1 PASS | Tech/QA |
| 2026-07-18 | Paiement | Valider la synchronisation Stripe sans transaction réelle | Fermer le risque webhook avant disponibilité des clés test | Signature HMAC avec fenêtre anti-rejeu de 5 minutes ; facture réelle passée à `paid` par webhook E2E signé, 1/1 PASS | Tech/QA |
| 2026-07-18 | CI | Étendre le workflow critique à toute la quality gate | Empêcher un E2E vert de masquer une régression unitaire, lint ou build | Vérification des secrets, `npm test`, lint, build puis Playwright ; timeout porté à 30 minutes et `.env.example` ajouté sans valeur sensible | Tech/QA |
| 2026-07-18 | QA | Valider la planification après paiement | Prouver que le garde paiement et le calendrier partagent un état persistant multi-rôles | Concierge planifie une mission payée, statut et créneau relus owner ; E2E 1/1 PASS en 3,3 min | QA/Tech |
| 2026-07-18 | Planning | Bloquer les chevauchements attribuables | Éviter la double réservation d’un logement ou d’un membre sans bloquer les ressources distinctes | Validation des dates, détection d’intersection stricte, réponse 409 avec conflits ; tests unitaires et E2E de non-régression verts | Tech/QA |
| 2026-07-18 | Planning | Exposer la capacité quotidienne de l’équipe | Donner un signal de surcharge sans inventer des horaires contractuels absents du modèle | Durée planifiée du jour, plafond configurable, taux de charge, état occupé et compteur de surcharges dans l’espace Équipe ; test dédié vert | Produit/Tech |
| 2026-07-18 | Architecture | Préparer la persistance de l’équipe concierge | Remplacer progressivement les membres locaux sans casser la base connectée actuelle | Migration concierge_team_members avec RLS, API GET/POST et UI branchée avec fallback ; smoke 3/3 PASS, migration distante non appliquée | Tech/DBA |
| 2026-07-18 | Architecture | Sécuriser le cycle de vie des membres d’équipe | Éviter les modifications transverses et conserver l’historique d’affectation | API membre PATCH/DELETE scoping propriétaire/admin, validation métier et désactivation logique ; contrat 2/2 PASS | Tech/QA |
| 2026-07-18 | Produit | Brancher la gestion persistante d’équipe dans le cockpit concierge | Remplacer les membres de démonstration dès que le schéma est disponible sans masquer une équipe réellement vide | Formulaire de création, disponibilité et désactivation connectés aux API ; fallback migration explicite ; contrat 3/3 PASS | Produit/Tech |
| 2026-07-18 | Architecture | Canoniser les nouvelles migrations Supabase | Empêcher la dette des deux dossiers de continuer sans déplacer à l’aveugle 20 migrations historiques | supabase/migrations devient canonique, archive legacy figée par check:migrations, contrôle ajouté à la CI ; inventaire distant en attente du token Supabase | Tech/DBA |

---

## 11. Index documentaire et destination

Tous les documents présents lors de la consolidation ont été pris en compte. Leur destination évite de perdre les détails utiles.

| Document | Apport conservé | Statut après Master Plan |
|---|---|---|
| `admin-supabase-audit-2026-06-16.md` | Tables et métriques admin | Annexe technique à revalider avec la base |
| `art-deco-design-system.md` | Direction visuelle et tokens | Référence design spécialisée |
| `audit-approfondi-proprietaire-concierge-artisan-2026-05-18.md` | Vue par rôle et priorités historiques | Archive, statuts remplacés ici |
| `audit-architecture-composants-workflow-2026-06-06.md` | Réutilisation et architecture workflow | Référence d'architecture |
| `audit-complet-code-routes-permissions-2026-06-18.md` | Auth, routes et permissions | Archive technique datée |
| `audit-complet-parcours-metier-proprietaire-concierge-2026-06-06.md` | Parcours métier détaillé | Spécification métier annexe |
| `audit-final-sprint-planetls-2026-07-12.md` | Bilan Sprint 1 et risques | Archive de livraison |
| `audit-parcours-demande-devis-mission-2026-06-05.md` | Workflow commercial détaillé | Spécification annexe |
| `audit-parcours-paiement-devis-mission-2026-06-06.md` | Règles paiement | Spécification annexe |
| `audit-utilisateurs-gestion-complete-profils-2026-06-18.md` | Écarts profils par rôle | Archive, backlog repris ici |
| `cartographie-champs-profils-2026-06-19.md` | Champs et dette polymorphe | Référence migration profils |
| `concierge-signup-ux-audit-lynda-christa-2026-04-25.md` | Persona simplicité/expert | Recherche UX historique |
| `concierge-signup-ux-audit-lynda-christa-suite-2026-04-26.md` | Expériences et KPI onboarding | Banque d'expériences |
| `concierge-ux-personas-analysis-2026-04-25.md` | Parcours et KPI persona | Recherche UX historique |
| `dashboard-figma-handoff.md` | Grilles et états responsive | Référence handoff UI |
| `github-issues-profils-utilisateurs-2026-06-19.md` | Formulation de 25 issues | Backlog détaillé à rapprocher des issues réelles |
| `guide-audit-ux-plateforme-mise-en-relation.md` | Checklist exhaustive de parcours | Guide méthodologique, pas état courant |
| `matrice-validation-profils-par-role-2026-06-19.md` | Champs autorisés/interdits | Référence sécurité profils |
| `module-litiges-preuves-spec.md` | UX, schéma et règles litiges | Spécification métier active |
| `onboarding-gap-analysis-all-categories-2026-04-29.md` | Gaps initiaux par rôle | Archive, plusieurs points dépassés |
| `p1-e2e-runbook-parcours-critiques-2026-05-18.md` | Scénarios manuels | Runbook QA actif |
| `p1-kpi-pilotage-partage-2026-05-18.md` | Définitions KPI initiales | Référence Data à enrichir |
| `plan-implementation-profils-utilisateurs-tickets-2026-06-19.md` | Découpage technique profils | Backlog spécialisé |
| `premium-ux-ui-platform-blueprint.md` | Vision cockpit premium | Référence UX spécialisée |
| `pricing-grid-business-spec.md` | Calcul et fallback tarifaire | Spécification métier active |
| `prompt-13-module-voyageurs-sejours-2026-07-12.md` | Bilan module séjours | Archive de livraison + limites |
| `qa-checklist-p0-profils-2026-05-18.md` | Preuves QA par rôle | Checklist d'exécution annexe |
| `reprise-profils-owner-preferences-2026-06-19.md` | État de reprise owner | Archive de chantier |
| `responsive-a11y-dashboard-checklist-2026-05-25.md` | Critères responsive/a11y | Checklist QA active |
| `spec-cible-profils-personas-2026-06-19.md` | Cible détaillée des profils | Spécification produit active |
| `sprint-1-audit-complet-planetls-2026-07-07.md` | Cartographie architecture | Archive d'audit, conventions conservées |
| `ui-harmonization-audit.md` | Tokens et règles UI | Référence UI spécialisée |
| `ux-onboarding-audit-reprise-2026-04-29.md` | État du tunnel en avril | Archive historique |

---

## 12. Maintenance continue

### Tableau de suivi à mettre à jour après chaque évolution importante

Ce tableau est le registre de maintenance courant. La photographie détaillée de la section 3 reste l'inventaire initial ; toute évolution ultérieure doit être enregistrée ici avec une preuve courte et une prochaine action.

| Domaine | Fonctionnalité | Profil concerné | Statut | Priorité | Dernière évolution | Preuves dans le code | Prochaine action |
|---|---|---|---|---|---|---|---|
| Qualité | Baseline tests, lint, build et snapshot | Tous | ✅ Terminé | P0 Critique | 2026-07-18 | 158/158 tests, ESLint, build Next.js 164 pages, snapshot UI portable | Maintenir la baseline |
| Qualité | Smoke E2E des espaces critiques | Owner, concierge, provider | ✅ Terminé | P0 Critique | 2026-07-18 | Playwright Chromium : 3/3 PASS ; workflow GitHub contrôle secrets, tests, lint, build puis tous les E2E | Configurer les secrets GitHub et lancer la première exécution distante |
| Qualité | E2E transactionnel commercial | Owner, concierge | 🟠 Partiel | P0 Critique | 2026-07-18 | Playwright : demande, devis accepté, mission, facture payée, créneau planifié et relu owner, 1/1 PASS | Configurer une clé Stripe test et valider la session Checkout hébergée |
| Qualité | E2E transactionnel provider | Concierge, provider | ✅ Terminé | P0 Critique | 2026-07-18 | Mission, intervention, preuve média privée, clôture et facture liée de 90 €, 1/1 PASS | Configurer Stripe test et valider le paiement |
| Outils métier | Assistant décoration | Concierge, propriétaire | 🟠 Partiel | P2 Important | 2026-07-18 | page `/dashboard/concierge/decoration-ai`, API dédiée, `decorationAssistant.ts`, migration `decoration_ai_reports`, tests | Valider l'usage terrain, tracer l'envoi owner et brancher une génération d'image réelle |
| Équipe | Cycle de vie des membres concierge | Concierge, admin | 🟠 Partiel | P0 Critique | 2026-07-18 | Migration/RLS, API GET/POST/PATCH/DELETE, UI création/disponibilité/désactivation, fallback explicite, contrat 3/3 PASS | Appliquer la migration distante puis valider le CRUD E2E sur données persistées |
| Pilotage | Maintenance automatique du Master Plan | Équipe projet | ✅ Terminé | P0 Critique | 2026-07-18 | `AGENTS.md`, présente section | Appliquer la checklist à chaque mission importante |

### Roadmap par phases permanentes

| Phase | Périmètre | État de pilotage |
|---|---|---|
| Phase 1 — Socle fiable | Architecture, sécurité, authentification, permissions, données, CI | En cours : E2E et gouvernance Supabase restent P0 |
| Phase 2 — Mise en relation | Profils, recherche, disponibilités, zones, demandes, contacts | En cours : profil artisan et densité locale prioritaires |
| Phase 3 — Conversion en mission | Devis, contrat, mission, planning, règlement | En cours : preuve E2E et consolidation paiement manquent |
| Phase 4 — Fidélisation | Outils quotidiens, équipe, maintenance, finance, assistant décoration | En cours : plusieurs modules sont N2 et doivent être validés/persistés |
| Phase 5 — Réseau professionnel | Fil, publications, carte, mur des missions, recommandations | À faire après preuve de liquidité locale |
| Phase 6 — Développement stratégique | IA réelle, intégrations, reporting avancé, modèles économiques | Évolution future ; aucune industrialisation avant validation d'usage |

### Idées et opportunités — format obligatoire

Avant d'ajouter une idée, rechercher ses synonymes dans ce document. Ne pas l'implémenter hors demande.

| Idée | Problème résolu | Utilisateurs concernés | Valeur attendue | Effort estimé | Risques | Priorité proposée | Statut |
|---|---|---|---|---|---|---|---|
| Génération visuelle avant/après décoration | Le rapport actuel ne produit qu'un prompt texte | Concierge, propriétaire | Projection et conversion plus fortes | Moyen | Coût, qualité, droits sur les photos, conservation des images | P3 Confort après validation du rapport | À étudier |

Statuts d'idée autorisés : `À étudier`, `Validée`, `Planifiée`, `En développement`, `Livrée`, `Refusée`, `Reportée`.

### Historique synthétique des fonctionnalités structurantes

| Fonctionnalité | Création | Dernière évolution importante | Statut actuel | Limites connues | Dépendances | Prochaine étape |
|---|---|---|---|---|---|---|
| Authentification et permissions | Avant 2026-04 | 2026-06-18 | 🟡 En cours | E2E multi-rôles absent | NextAuth, Supabase, guards API, proxy | Automatiser les parcours et confirmer la sécurité en environnement réel |
| Demande → devis → mission → paiement | Avant 2026-05 | 2026-06-06 | 🟡 En cours | Validation bout en bout et consolidation paiement incomplètes | Tables métier, Stripe, workflow events | E2E owner/concierge et gestion visible des échecs |
| Profils professionnels | Avant 2026-04 | 2026-06-20 | 🟡 En cours | Artisan et données legacy incomplets | `profiles`, services, preferences | Terminer le profil artisan et normaliser les champs |
| Maintenance, équipe et séjours | 2026-07 | 2026-07-12 | 🟠 Partiel | Persistance spécialisée incomplète | Missions, metadata, interventions | Tables/RLS/types et E2E |
| Assistant décoration | 2026-07-18 | 2026-07-18 | 🟠 Partiel | Moteur déterministe, pas d'image réelle ni envoi owner tracé | `decoration_ai_reports`, API concierge | Tester avec des concierges avant extension |
| Réseau professionnel | Vision 2026-07 | 2026-07-18 | 🔴 À faire | Liquidité locale non prouvée | Profils, zones, missions, modération | Pilote local puis mur des missions |

### Checklist de fin de mission documentaire

- [ ] Relire les fichiers réellement modifiés et identifier les fonctions touchées.
- [ ] Exécuter les tests ou vérifications proportionnés au risque.
- [ ] Mettre à jour statut, priorité, date, preuve et prochaine action.
- [ ] Réévaluer la phase de roadmap et les dépendances.
- [ ] Ajouter sans doublon les idées apparues, sans les implémenter hors périmètre.
- [ ] Ajouter au journal uniquement les décisions utiles à long terme.
- [ ] Préciser les limites et les éléments non confirmables par le code.
- [ ] Ne créer aucun audit transversal supplémentaire.
---

## 13. Prochaine revue recommandée

La prochaine mise à jour de ce document doit intervenir après le lot de stabilisation. Elle devra :

1. consigner le résultat de `npm test`, `npm run lint` et `npm run build` ;
2. joindre les preuves des trois E2E critiques ;
3. confirmer la source canonique des migrations et l'état réel de la base ;
4. mettre à jour les niveaux N2/N3 après persistance des modules récents ;
5. nommer la zone pilote, les responsables et les dates d'acquisition ;
6. transformer toute décision prise en entrée du journal, sans créer de nouvel audit transversal.
