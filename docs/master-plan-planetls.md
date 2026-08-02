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
| Dashboard artisan/provider | 🟡 En cours | N3 | E2E mission → intervention → preuve média privée → facture liée validé ; profil métier éditable et persistant (activité, zone, disponibilité, tarifs, expérience, identité légale, assurance, certifications) ; paiement et preuves documentaires restent incomplets |
| Dashboard administrateur | 🟡 En cours | N3 | Mission Control admin recentré sur priorités, activité, tables métier, graphiques d'activation, donuts de répartition/contrôle, cartes de santé visuelles par section, hero éditorial premium et filtres segment/période ; la page `controle` suit maintenant le même niveau premium avec hero santé, onglets décisionnels et surfaces de pilotage plus lisibles ; la page `developpement` embarque désormais un `Conseiller projet` qui répond à des questions de pilotage à partir du Master Plan, de la roadmap, de Mission Control, de la mémoire technique et de scans heuristiques du repo ; une nouvelle page `/dashboard/admin/pilotage` synthétise désormais acquisition, activation, pipeline missions, conversion de facturation, tensions business et actions recommandées à partir des endpoints admin existants, avec lecture dégradée quand certaines sources sont indisponibles ; responsive mobile des tableaux et accessibilité clavier/lecteur d'écran renforcées ; overview, contrôle, pilotage, utilisateurs et vues par rôle reliés ; validations connectées et navigation E2E encore à renforcer |
| Profils professionnels | 🟡 En cours | N3 | Profil concierge riche, owner preferences persistées ; profil artisan enrichi et persistant avec complétude métier ; portfolio, pièces justificatives vérifiées, avis et historique complet non aboutis |
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
| Réservations et séjours voyageurs | 🟡 En cours | N2 | Moteur, API réservations, API séjours, page concierge et tests ; données principalement via missions/`metadata`, pas d'espace voyageur ; clarification métier formalisée le mercredi 29 juillet 2026 : la réservation ou le séjour doit devenir l'objet canonique partagé entre propriétaire et conciergerie, les missions restant des actions d'exécution liées, avec interventions artisans en troisième niveau |
| Maintenance et artisans | 🟡 En cours | N3 | Affectation, exécution, preuve média privée avec empreinte SHA-256 et facture provider liée validées E2E ; paiement reste à couvrir |
| Litiges et preuves | 🟡 En cours | N2 | Migrations inspections/litiges, routes API et page owner existent ; parcours obligatoire post-checkout et validation E2E non prouvés |
| Carte interactive réseau | 🔴 Non commencée | N1 | Bibliothèques carte et prototypes de recherche existent, mais pas de carte unifiée acteurs + missions + recherches |
| Fil d'actualité professionnel | 🔴 Non commencée | N0 | Aucun modèle ni flux réseau professionnel canonique |
| Mur des missions | 🔴 Non commencée | N1 | Les missions urgentes fournissent un socle, sans marketplace géolocalisée ouverte et filtrable |
| Avis, réputation et certifications | 🟡 En cours | N2 | API reviews et champs de profil existent ; expérience complète, modération et preuves vérifiées non abouties |
| KPI produit | 🟡 En cours | N3 | Endpoint overview et affichage admin ; activation J+7, temps de première valeur, conversion et séries fiables disponibles ; en local, `/api/kpis/overview` injecte désormais des cohortes workspace crédibles quand Supabase est inaccessible ou quand aucune cohorte mature n'existe encore ; en connecté, un seed persistant `scripts/seed-admin-workspace-kpis.mjs` peuple désormais Supabase en profils/workflows KPI rattachés à l'e-mail admin cible, et l'endpoint KPI retombe proprement sur `provider_interventions` quand la base distante ne publie pas encore `provider_profile_id` sur `missions`, `quotes` ou `invoices` ; inspection distante du mercredi 29 juillet 2026 : `missions` existe mais n'expose pas `title`, `request_id` ni `provider_profile_id`, alors que `quotes.service_request_id`, `invoices.quote_id` et `provider_interventions.provider_profile_id` sont bien présents |
| Tests E2E navigateur | 🟠 Partiel | N3 | Parcours critiques et transactionnels passent ; branche owner Checkout hébergée prête avec carte Stripe test, retour et synchronisation ; exécution réelle bloquée par l’absence de E2E_STRIPE_SECRET_KEY |
| Responsive et accessibilité | 🟡 En cours | N3 | Socle, checklists et composants accessibles ; audit systématique clavier/mobile et tests automatisés manquent |
| Design system | 🟡 En cours | N3 | Primitives, tokens, route showcase et direction Art Déco ; double strate UI, snapshot portable et tests au vert |
| SEO et acquisition publique | 🟡 En cours | N2 | Pages publiques et profils publics présents ; la home expose désormais aussi une intention éditoriale sur l'impact solidaire/humanitaire du réseau, sans mécanique métier ni paiement associatif branchés à ce stade ; metadata, Open Graph, JSON-LD, pages locales et mesure acquisition restent à faire |
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
| Conversion en mission | Demandes devenues missions | À baseliner, puis améliorer par groupe |
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
| Baseline tests/lint/build/snapshot | ✅ Terminé | P0 Critique | 2026-07-19 | Tech lead | 202/202 tests, lint ciblé et build Next.js de 168 pages au vert |
| E2E owner complet | ⏸️ Reporté | P0 Critique | À reprendre avec clé Stripe test | QA + Produit | Demande → devis → mission → facture payée par webhook signé PASS ; scénario Checkout hébergé, carte test, retour owner et sync prêt ; aucune E2E_STRIPE_SECRET_KEY locale disponible pour la preuve finale |
| E2E concierge complet | 🟠 | P0 Critique | Court terme | QA + Produit | Réception → devis envoyé → mission → facture payée → créneau planifié et relu owner PASS ; Checkout hébergé reste à valider |
| E2E provider complet | ✅ | P0 Critique | 2026-07-18 | QA + Provider | Mission → intervention → preuve média privée → facture liée PASS ; prochaine évolution : paiement Stripe test |
| Source canonique migrations | 🟠 | Critique | Court terme | Backend | supabase/migrations canonique ; 20 fichiers historiques figés dans database/migrations ; contrôle CI ajouté ; inventaire distant bloqué sans token |
| Types Supabase régénérés | 🟡 | Critique | Court terme | Backend | Tables actives entièrement typées ; le build du 2026-07-28 a nécessité un helper non typé temporaire dans `/api/admin/control-tower` car `onboarding_events`, `service_requests` et `workflow_events` ne sont pas encore couverts par les types générés |
| Persistance maintenance | 🟠 Partiel | P0 Critique | Court terme | Backend + Concierge | Incidents et médias/RLS, API CRUD partiel, transitions, affectation, preuves privées SHA-256 et URL signées, contrat 6/6 ; migrations distantes et E2E restent à faire |
| Persistance équipe/affectations | 🟡 | Critique | Court terme | Backend + Concierge | Permissions fines incluses |
| Persistance réservations/terrain | 🟡 | Critique | Court terme | Backend + Mobile | Photos/signatures/checklists Storage |
| Profil artisan complet | 🟠 Partiel | P0 Critique | Court terme | Produit + Provider | Édition métier persistante et complétude dédiées ; justificatifs privés PDF/images avec SHA-256, statuts de vérification et liens signés livrés ; migration distante, validation admin, avis et vue publique détaillée restent à finaliser |
| KPI activation/funnel | ✅ Terminé | P0 Critique | Court terme | Data + Produit | Définitions J+7, groupes, séries et zones validés sur l’API connectée ; seuils par rôle, alerte faible échantillon, baisse de groupe et actions admin visibles |
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

| Achats et renouvellements logement | 🟠 Partiel | P1 Prioritaire | Court terme | Produit + Owner + Concierge | Besoin structuré persistant dans la fiche logement partagée : article, dimensions, quantité, motif, photo/lien marchand, budget/plafond, règle contractuelle, livraison, décision owner, facture, preuve et statuts signalé → installé. Garde contrat/plafond/preuve testé ; upload privé, notifications et E2E multi-rôles restent à faire. |

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
| 2026-07-29 | Tech/Admin | Diagnostiquer puis rendre l'admin compatible avec le schéma distant `missions` réellement exposé | Le seed KPI connecté a réussi, mais la base distante cassait encore certaines lectures admin car `missions.title`, `missions.request_id` et `missions.provider_profile_id` ne sont pas publiés par PostgREST alors que le repo les attend | Nouveau script `npm run inspect:remote:admin-schema` / `scripts/inspect-remote-admin-schema.mjs` pour sonder le schéma REST distant ; constat vérifié le mercredi 29 juillet 2026 : `missions` expose `id, owner_profile_id, concierge_profile_id, status, created_at`, mais pas `title`, `request_id` ni `provider_profile_id` ; correctifs admin branchés : `/api/admin/control-tower` retente désormais une lecture `missions` compatible sans `title` et reconstruit un libellé via `metadata.mission_title/service_label/property_label`, `/api/admin/operations` affiche aussi un titre déduit au lieu de laisser `null`, `npm run build` PASS après ces ajustements ; correctif structurel préparé ensuite dans `docs/sql/2026-07-29-align-remote-missions-schema.sql` avec note d'application `docs/remote-missions-schema-realignment-2026-07-29.md` pour réaligner la base distante sans casser les données existantes | Admin/Tech |
| 2026-07-29 | Produit/Architecture | Clarifier le modèle métier contrat -> réservation -> tâches -> intervention | Le flux cible propriétaire/conciergerie risquait de confondre réservation voyageur, mission opérationnelle et intervention artisan, ce qui aurait fragilisé planning, statuts, facturation et UX | Nouvelle spécification `docs/spec-reservations-sejours-operations-2026-07-29.md` : un devis ou contrat signé ouvre la collaboration, la réservation ou le séjour devient l'objet canonique partagé dans les deux plannings, les consignes et besoins se rattachent au séjour, les tâches concierge en dérivent, et les artisans interviennent via des interventions liées plutôt que via une confusion générale autour de `missions` | Produit/Tech |
| 2026-07-29 | Produit/Tech | Transformer la clarification métier en plan technique de migration progressive | Après avoir clarifié que la réservation n'est pas une mission, il fallait éviter une refonte théorique et définir une trajectoire compatible avec les routes déjà présentes (`concierge/reservations`, `concierge/stays`, owner `voyageurs`) | Nouveau plan `docs/plan-technique-reservations-sejours-mvp-2026-07-29.md` : introduction recommandée d'une table canonique `reservations`, liens progressifs vers `missions`, `provider_interventions` et `workflow_events`, APIs MVP 1 owner/concierge/planning, RLS cible, stratégie de migration par phases A/B/C/D et définition de done ; orientation retenue : réutiliser les surfaces existantes mais sortir le séjour de `mission.metadata` ; phase A matérialisée par la migration `supabase/migrations/20260729153000_reservations_core.sql`, les types Supabase mis à jour et un test contractuel dédié `src/tests/reservations-core-contract.test.mts` ; phase B engagée ensuite avec un CRUD minimal owner/participants (`/api/owner/reservations`, `/api/reservations/[id]`), un helper partagé `src/app/api/_shared/reservations.ts` et la route `/api/concierge/stays` branchée sur `reservations` en source primaire avec fallback legacy `missions` ; phase C est désormais terminée : `src/app/dashboard/owner/missions/voyageurs/page.tsx` lit/crée les séjours via `reservations`, `src/app/dashboard/owner/planning/page.tsx` calcule son planning depuis `/api/owner/reservations`, et `GET /api/concierge/reservations` prend désormais `reservations` comme objet racine tout en réattachant les missions opérationnelles liées pour préserver la lecture workflow ; phase D est désormais appliquée à distance sur les trois maillons principaux et nettoyée sur les parcours secondaires : migration `supabase/migrations/20260729190000_link_missions_to_reservations.sql` appliquée sur la base Supabase distante le mercredi 29 juillet 2026, ajout de `missions.reservation_id` dans les types locaux, insert mission compatible avec fallback si la colonne n'est pas encore exposée à distance, `POST /api/concierge/reservations` garantit désormais l'existence de la réservation canonique avant création des missions liées, routes `concierge/reservations`, `concierge/stays` et `reservations/[id]` capables d'utiliser `reservation_id` avant de retomber sur `metadata.reservation_id/reservation_workflow_id`, extension explicite vers les artisans avec migration `supabase/migrations/20260729193000_link_provider_interventions_to_reservations.sql` elle aussi appliquée à distance le mercredi 29 juillet 2026, création de `provider_interventions.reservation_id` et lecture/écriture des interventions branchées d'abord sur cette liaison avant fallback metadata, puis extension explicite de la timeline avec migration `supabase/migrations/20260729194500_link_workflow_events_to_reservations.sql` appliquée à distance le mercredi 29 juillet 2026, helper `recordWorkflowEvent` compatible `reservation_id`, API `/api/workflow-events` filtrable par `reservationId`, et écritures mission/facture/devis capables d'alimenter cette relation directe ; le nettoyage secondaire est aussi livré : agrégation des séjours priorisant `reservation_id`, événements concierge enrichis en `reservation_id`, annulation de facture de workflow pilotée par `mission_id` plutôt que par le seul metadata workflow, moteur de planning aligné sur l'identifiant canonique de réservation, puis nouvelle couche de cycle de vie partagé directement sur la réservation canonique avec timeline unifiée `workflow_events + événements synthétiques`, traçage des créations owner/concierge et journalisation des mises à jour de statuts, notes et consignes dans `PATCH /api/reservations/[id]` | Produit/Tech |
| 2026-07-29 | Produit/UX | Rendre la lecture du séjour réellement collaborative dans les cockpits owner et concierge | La réservation canonique exposait déjà ses champs éditoriaux et sa timeline, mais les écrans métier lisaient encore surtout des cartes statiques ou dérivées de `missions`, sans narration partagée du séjour | `/dashboard/concierge/sejours` charge maintenant `/api/reservations/[id]` sur le séjour sélectionné et affiche une section `Lecture collaborative` avec propriétaire, dernière mise à jour, consignes d'accès, notes owner/conciergerie et une timeline récente ; `/dashboard/owner/missions/voyageurs` récupère aussi le détail canonique de la réservation focalisée, ajoute un bouton `Suivi`, un `Brief collaboratif` et une `Timeline récente` dans l'aside, avec états loading/erreur/empty ; preuves : contrat `src/tests/reservations-api-contract.test.mts` enrichi, suite Node ciblée `19/19 PASS` et `npm run build` PASS le mercredi 29 juillet 2026 | Produit/UX/Tech |
| 2026-07-29 | Produit/UX | Ouvrir l'écriture collaborative du séjour depuis les cockpits owner/concierge et prolonger ce récit dans le planning owner | La lecture canonique était branchée, mais l'utilisateur devait encore sortir des écrans métier pour enrichir le brief ou faire avancer le cycle de vie partagé du séjour | `PATCH /api/reservations/[id]` accepte désormais aussi les effacements volontaires de `access_instructions`, `owner_notes` et `concierge_notes`, tout en journalisant ces mises à jour comme `Brief collaboratif mis a jour` ; `/dashboard/concierge/sejours` permet maintenant d'éditer les consignes d'accès et les notes conciergerie, puis d'exécuter directement des actions de timeline `Accuser reception`, `Marquer en sejour` et `Cloturer` ; `/dashboard/owner/missions/voyageurs` permet désormais au propriétaire d'éditer ses consignes d'accès et notes owner dans l'aside focalisée, puis d'annuler le séjour depuis le cockpit avec traçage canonique ; `/dashboard/owner/planning` réinjecte aussi le voyageur, les notes owner/concierge, les consignes d'accès et la conciergerie dans ses cartes et pastilles pour rendre le planning plus éditorial ; preuves : contrat `src/tests/reservations-api-contract.test.mts` enrichi, suite Node ciblée `19/19 PASS`, `npm run build` PASS le mercredi 29 juillet 2026 | Produit/UX/Tech |
| 2026-07-29 | Data/Tech | Semer un jeu KPI persistant rattaché aux workspaces admin | Le fallback local gardait l'UI lisible, mais ne créait aucune donnée réelle dans Supabase pour valider les KPI connectés | Nouveau script `scripts/seed-admin-workspace-kpis.mjs` + commande `npm run seed:admin:kpis` : création idempotente de 18 profils KPI liés à `admin@planetls.fr` (6 owner, 6 concierge, 6 provider), événements d'onboarding, demandes, destinataires, devis, factures, conversations, messages, `workflow_events`, `provider_clients` et `provider_interventions` ; exécution réelle réussie le mercredi 29 juillet 2026 avec IDs persistés en base ; `/api/kpis/overview` tolère aussi les schémas distants incomplets en réessayant sans `provider_profile_id` et en calculant l'activation provider via `provider_interventions` si `missions` n'expose pas encore cette relation | Admin/Data/Tech |
| 2026-07-28 | Produit/UX | Basculer le dashboard administrateur en Mission Control orienté action | La page admin restait lisible comme audit interne mais pas encore comme cockpit quotidien de décision | `/dashboard/admin` adopte un bandeau de synthèse, un filtre 7/30/90 jours, un filtre segment `Propriétaires/Conciergeries/Artisans`, des cartes KPI, une liste de priorités actionnables, une activité récente, trois tables métier compactes, deux lectures graphiques issues des vraies données (`activation_series`, `activation_by_zone`), deux donuts supplémentaires pour la répartition des rôles et les feux de contrôle, trois cartes de santé visuelles pour `Inscriptions`, `Missions` et `Messages`, ainsi qu’un hero premium de type `data story` avec tension du jour, actions chaudes et résumés éditoriaux ; les libellés `n/a` sont remplacés par `Donnée insuffisante` / `Non disponible` ; la page `/dashboard/admin/controle` est aussi remontée au même niveau visuel avec hero santé éditorial, cartes de synthèse, onglets plus décisionnels et surfaces de pilotage plus lisibles ; la page couvre aussi une phase 6 d’états UX complets et une phase 7 responsive/a11y : boutons de filtre avec état clavier explicite, focus visible, tableaux annotés (`caption`, `scope`) et repli mobile en cartes lisibles via libellés de colonnes ; `DashboardLayout` peut masquer ses blocs secondaires pour laisser cette composition respirer ; la page reste désormais lisible en mode dégradé si `overview`, `operations`, `control-tower` ou `kpis` sont indisponibles et affiche un bandeau d’état explicite ; `/api/admin/overview`, `/api/admin/operations` et `/api/kpis/overview` renvoient aussi un payload `health` plutôt qu’un `500` quand Supabase est inaccessible, ce qui garde le cockpit exploitable en sandbox ; en complément, `/api/kpis/overview` injecte maintenant en local des cohortes workspace déterministes et des zones/series non nulles quand Supabase tombe ou quand aucune cohorte mature n'est encore disponible, afin d'éviter des visuels durablement vides pendant l'amorçage ; phase 8 validée avec `npm run build` PASS, Playwright `e2e/admin-dashboard.spec.ts` PASS, Playwright `e2e/admin-kpi-activation.spec.ts` PASS, Playwright `e2e/admin-control-actions.spec.ts` PASS et contrat `src/tests/kpis-overview-contract.test.mts` PASS ; revalidation complémentaire du 2026-07-28 : contrat `src/tests/kpis-overview-contract.test.mts` `5/5 PASS`, `npm run build` PASS | Admin/Produit/Tech |
| 2026-07-29 | Produit/Finance | Ajouter un cockpit admin dédié au pilotage entrepreneurial et financier | Le cockpit admin principal pilotait bien l'activité et les risques, mais il manquait une lecture plus directement business sur la croissance, le pipeline et la tension de trésorerie | Nouvelle route `/dashboard/admin/pilotage` branchée à la navigation admin, au centre de commandes global et au shell dashboard ; la page agrège `/api/admin/overview`, `/api/admin/operations`, `/api/admin/control-tower` et `/api/kpis/overview` pour afficher une synthèse acquisition/activation, des estimations de pipeline missions, de valeur planifiée, de valeur facturée visible, un taux de monétisation, une lecture d'encaissement final, des alertes de friction commerciale et des actions recommandées ; la page reste lisible en mode dégradé quand certaines sources remontent un `health` incomplet ; vérification : `npm run build` PASS le mercredi 29 juillet 2026, route statique `/dashboard/admin/pilotage` générée dans le build | Admin/Produit/Finance |
| 2026-07-28 | Technique | Tolérer temporairement les tables Supabase non régénérées dans la tour de contrôle admin | Le build Vercel échouait sur `onboarding_events`, puis `service_requests`, car les migrations existent mais les types générés ne couvrent pas encore toutes les tables actives | `/api/admin/control-tower` passe par un helper local non typé pour préserver le build et le diagnostic admin ; `npm run build` repasse au vert ; la régénération complète des types Supabase reste prioritaire pour supprimer ce contournement | Tech |
| 2026-07-19 | Produit/Technique | Faire de l'état non vérifiable un statut explicite de la tour de contrôle | Une table ou colonne absente ne doit jamais produire un faux état sain | API trace 9 sources, santé globale horodatée, bandeau admin et recontrôle manuel ; 181/181 tests et build au vert | Produit/Tech/QA |
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
| 2026-07-19 | Architecture | Créer le dossier maintenance canonique | Sortir les incidents de missions.metadata sans casser l’historique existant | Table maintenance_incidents et RLS participants, API GET/POST, fusion UI dédupliquée et formulaire ; 167/167 tests, build 166 pages ; migration distante non appliquée | Tech/QA |
| 2026-07-19 | Métier | Encadrer le cycle de vie des incidents maintenance | Empêcher les clôtures arbitraires et tracer une progression opérationnelle cohérente | API PATCH scopée, transitions signalé → qualifié → affecté → devis → validé → planifié → en cours → résolu → clôturé, action UI ; contrat 4/4, 168/168 tests, build 166 pages | Produit/Tech |
| 2026-07-19 | Sécurité | Restreindre et valider l’affectation artisan | Permettre le dispatch sans exposer les coordonnées privées ni accepter un profil arbitraire | Annuaire provider dédié limité aux champs professionnels, contrôle du rôle à l’écriture, sélection cockpit ; contrat 5/5, 169/169 tests, build 167 pages | Tech/Produit |
| 2026-07-19 | Sécurité | Rendre les preuves maintenance privées et vérifiables | Conserver les photos terrain sans URL publique ni fichier non tracé | Table média/RLS, bucket privé mission-evidence réutilisé, contrôle MIME/25 Mo, SHA-256, URL signée 10 min et upload cockpit ; contrat 6/6, 170/170 tests, build 167 pages | Tech/QA |
| 2026-07-19 | Data | Stabiliser la définition de l’activation J+7 | L’ancien calcul comptait trois activités arbitraires et incluait des comptes trop récents | Cohorte limitée aux comptes ayant atteint J+7, événement dans la fenêtre individuelle : demande owner, devis concierge, mission provider ; éligibles/activés exposés ; 172/172 tests, build 167 pages | Data/Produit |
| 2026-07-19 | Data | Ajouter les séries hebdomadaires d’activation | Un taux global masque les variations de qualité d’acquisition et d’onboarding | Cohortes d’inscription hebdomadaires matures, éligibles/activés/taux par rôle, même moteur J+7 que la synthèse ; 173/173 tests, build 167 pages | Data/Produit |
| 2026-07-19 | Data | Segmenter l’activation J+7 par ville | Identifier les zones où l’acquisition ou l’onboarding fonctionne sans masquer la taille d’échantillon | Top 20 zones par rôle avec éligibles, activés et taux ; groupes immatures exclus ; 174/174 tests, build 167 pages | Data/Growth |
| 2026-07-19 | Produit/Data | Exposer activation J+7 dans le cockpit admin | Rendre les groupes actionnables sans consulter directement API | Cartes owner/concierge/provider, activés/éligibles, tendance sur quatre groupes et zone principale ; erreur locale non bloquante ; 175/175 tests, build 167 pages | Admin/Data |
| 2026-07-19 | Produit | Enrichir le profil professionnel artisan sans nouveau modèle concurrent | Le workspace provider ne permettait d'éditer que l'identité générique malgré les colonnes métier existantes | Policy de patch étendue et section persistante activité/zone/disponibilité/tarifs/expérience/légal/assurance/certifications avec complétude dédiée ; 175/175 tests, lint et build 167 pages | Produit/Tech |
| 2026-07-19 | Sécurité | Conserver les justificatifs artisan privés jusqu'à vérification | Une certification déclarée ne doit pas être confondue avec une preuve validée ni exposer un document sensible | Table/RLS dédiée, bucket privé réutilisé, PDF/images 10 Mo, SHA-256, statuts pending/verified/rejected, liens signés 10 min et panneau profil ; migration distante non appliquée ; 178/178 tests, build 168 pages | Tech/Produit |
| 2026-07-19 | Administration | Étendre le centre de santé aux contradictions opérationnelles | Un simple comptage des objets liés ne détecte ni mission sans affectation, ni planning incohérent, ni paiement ou maintenance bloquants | 11 sources tracées, moteur métier isolé et testé, contrôles affectation/planning/facture/paiement/maintenance exposés dans le cockpit ; 191/191 tests, lint ciblé et build 168 pages | Admin/Tech/QA |
| 2026-07-19 | Sécurité/Produit | Faire décider les justificatifs artisan par un administrateur sans publier les fichiers | Une déclaration fournisseur ne doit devenir un signal de confiance qu’après décision tracée, sans fuite de document, empreinte ou chemin Storage | Route admin verified/rejected avec acteur/date/motif, panneau privé dans la fiche artisan et agrégats vérifiés non expirés dans l’annuaire de dispatch ; 192/192 tests, lint et build 168 pages | Admin/Produit/Tech |
| 2026-07-19 | Pilotage | Générer le planning de développement depuis le registre de maintenance | Donner un ordre de travail lisible sans créer une seconde roadmap divergente | Chantiers non terminés groupés par horizon calculé depuis P0–P4, prochaine action et preuves visibles dans `/dashboard/admin/developpement` ; 193/193 tests, lint et build 168 pages | Produit/Tech |
| 2026-07-27 | Pilotage/UX | Transformer la page Developer en journal de bord opérationnel | La vue développement exposait déjà le Master Plan, mais ne permettait ni mémoire quotidienne, ni favoris, ni commentaires, ni saisie manuelle d’événements de développement | Section `Journal de bord` ajoutée dans `/dashboard/admin/developpement` : timeline verticale responsive, événements auto depuis Git et planning, formulaire manuel local, recherche instantanée, filtres période/fonctionnalité/priorité/auteur, favoris, commentaires et liens GitHub ; tests `203/203 PASS`, ESLint ciblé `PASS`, build Next `PASS` après exclusion des fichiers E2E du `tsconfig` applicatif | Produit/Tech/QA |
| 2026-07-27 | Pilotage/UX | Créer une Mission Control développeur lisible en 30 secondes | Le journal de bord documente l’activité, mais il manquait un cockpit de décision immédiate sur la progression produit, la charge de dev et la santé des dépendances clés | Bloc `Mission Control` ajouté dans `/dashboard/admin/developpement` : progression globale, fonctionnalités terminées/en cours/bloquées, bugs critiques/mineurs, décisions et commits récents, temps de dev hebdomadaire estimé, objectifs semaine/suivant, dernière sauvegarde, environnement courant et cartes de santé Supabase/Vercel/GitHub ; tests `204/204 PASS`, ESLint ciblé `PASS`, build Next `PASS` | Produit/Tech/QA |
| 2026-07-27 | Pilotage/UX | Transformer le planning en roadmap intelligente vivante | Le cockpit dev montrait l’état du projet, mais ne proposait pas encore de séquencement dynamique quand un chantier se termine ou se débloque | Bloc `Roadmap intelligente` ajouté dans `/dashboard/admin/developpement` : priorités, difficulté, dépendances, estimation, gains utilisateur/business, dette technique, responsable, date prévue, suggestion de prochaine fonctionnalité logique et clôture locale avec recalcul immédiat ; tests `205/205 PASS`, ESLint ciblé `PASS`, build Next `PASS`, spec Playwright enrichie mais non exécutable localement car la commande `playwright` est absente du shell | Produit/Tech/QA |
| 2026-07-27 | Pilotage/Tech | Créer une mémoire technique consultable en quelques secondes | Les arbitrages de stack, d’architecture et de workflow existaient dans le code et le Master Plan, mais restaient trop lents à retrouver lors d’un nouveau chantier | Bloc `Mémoire technique` ajouté dans `/dashboard/admin/developpement` : décisions canoniques `Pourquoi Supabase`, `Pourquoi Next.js`, `Pourquoi Vercel`, architecture, composants et workflow, complétées par les décisions extraites du Master Plan avec recherche instantanée ; tests `206/206 PASS`, ESLint ciblé `PASS`, build Next `PASS`, spec Playwright enrichie mais bloquée localement par `/api/auth/dev-workspace-login` | Produit/Tech/QA |
| 2026-07-19 | Correctif responsive | Conserver les légendes des graphiques admin dans leurs cartes | Le seuil global à 760 px imposait simultanément trois cartes et une légende latérale, coupée par le conteneur | Légende empilée, grille 2 colonnes puis 3 à 1200 px, retour à la ligne des libellés et mesure Playwright des trois camemberts `1/1 PASS` ; 193/193 tests, lint et build 168 pages | UI/QA |
| 2026-07-19 | Pilotage/UX | Rendre visibles les contenus rattachés aux titres parents du Master Plan | Les H2 suivis immédiatement de H3 semblaient vides alors que leur contenu était réparti dans les sous-sections | Index cliquable des enfants directs avec état vide explicite en dernier recours ; contrôle Playwright sur `1. Vision du projet` `1/1 PASS`, lint et build 168 pages | Produit/UI |
| 2026-07-19 | Maintenance | Supprimer uniquement les redondances prouvées hors graphe actif | Alléger le dépôt sans casser les nombreux replis legacy encore utilisés | Retrait de 10 dépendances directes sans import et de 4 fichiers sans consommateur ; les compatibilités legacy actives sont conservées ; 193/193 tests, lint et build 168 pages | Tech/QA |
| 2026-07-19 | Data/Produit | Clôturer le P0 activation par des seuils explicites et des alertes actionnables | Un taux brut sans taille de groupe, seuil ni tendance ne permettait pas à l’admin de décider | Cibles owner 30 %, concierge 25 %, provider 35 % ; seuils critiques 15/12/18 %, minimum 5 profils éligibles et baisse de 10 points ; repli connecté contact_messages, Playwright 1/1 PASS, contrat 5/5, suite 195/195 et build 168 pages | Data/Produit/Tech |
| 2026-07-19 | Administration | Clôturer le centre de santé avec des interventions humaines auditables | Le diagnostic automatique détectait les anomalies mais ne permettait ni prise en charge ni transmission persistée | Cycle enregistré dans workflow_events avec acteur, date, cible et motif : prise en charge, transmission au responsable puis clôture avec compte rendu sans masquer l’anomalie ; E2E connecté 1/1, contrat 10/10, suite 199/199, lint et build 168 pages | Admin/Tech/QA |
| 2026-07-19 | Paiement/QA | Préparer le P0 owner pour un vrai Checkout Stripe sans accepter de clé live | Le scénario attendait toujours un 503 et ne pouvait donc jamais valider Checkout après configuration | Branche sk_test_ ouvrant Checkout hébergé, carte test 4242, retour factures et synchronisation ; garde CI refusant clé absente ou non-test, contrat 2/2, fallback signé 1/1, suite 201/201 et build 168 pages ; preuve finale bloquée sans secret | Produit/Tech/QA |
| 2026-08-02 | Pilotage/UX | Reporter l'E2E Stripe et ne plus le proposer comme meilleure action tant que sa clé de test est indisponible | Garder une action matériellement impossible en tête masquait les chantiers exécutables | Les statuts Reporté et Abandonné sont exclus des listes prête/bloquée de la roadmap ; le sommaire de Développement est remonté en tête et regroupé en Agir, Décider, Documenter | Produit/Tech/QA |
| 2026-08-02 | Pilotage/UX | Rendre la page Développement responsive selon sa largeur réellement disponible | Les media queries suivaient la largeur de l'écran sans déduire la sidebar de 280 px, laissant des grilles trop larges et une partie droite coupée | Conteneur responsive local, protections anti-débordement, sommaire supérieur hiérarchisé avec repères verticaux, passages 4/3 → 2 → 1 colonnes selon l'espace réel | Produit/Tech/QA |
| 2026-08-02 | Pilotage/UX | Afficher le Sommaire et détail du Master Plan comme première section de travail | Le référentiel complet restait relégué après les outils dérivés alors qu'il constitue leur source de vérité | Bloc placé juste après l'en-tête, ouvert par défaut ; roadmap, Mission Control, conseiller, journal et mémoire suivent dans cet ordre | Produit/Tech/QA |
| 2026-07-19 | Équipe/QA | Clôturer le cycle de vie persistant des membres concierge | Le Master Plan supposait encore la migration distante absente alors que le schéma connecté est désormais disponible | CRUD connecté validé : création, modification de disponibilité, rendu UI, désactivation logique et refus owner ; Playwright 1/1, contrat 3/3, suite 201/201, lint et build 168 pages | Concierge/Tech/QA |
| 2026-07-19 | Pilotage/UX | Séparer les P0 restants des mentions historiques de priorité | Le compteur global affichait 17 occurrences de P0, y compris les éléments terminés, doublons et entrées du journal | Compteurs restant/total calculés uniquement depuis le registre officiel : 3 P0 restants sur 10 ; synthèse et filtres alignés, parseur 4/4, Playwright desktop/mobile 1/1, suite 202/202 et build 168 pages | Produit/Tech/QA |

---

| 2026-07-19 | Métier | Séparer information permanente, besoin d’achat et exécution | Une dimension d’équipement doit rester liée au logement tandis que la commande suit une décision contractuelle traçable | purchaseNeeds persiste dans stockManagement partagé ; garde contrat, plafond et photo finale ; surfaces owner et concierge ; 3 tests métier ajoutés | Produit/Tech |

**2026-07-19 - Produit/UX.** La page admin `/dashboard/admin/developpement` devient la vue de lecture du Master Plan. Elle lit directement le Markdown afin de conserver une seule source de vérité et ajoute synthèse, recherche, filtres et sommaire.

**2026-07-27 - Produit/UX.** La page admin `/dashboard/admin/developpement` devient aussi un journal de bord du développeur. Les événements automatiques sont dérivés des commits récents et du registre de maintenance ; les ajouts manuels, favoris et commentaires restent stockés localement dans le navigateur pour un pilotage quotidien sans créer une nouvelle source métier concurrente au Master Plan.

**2026-07-27 - Produit/UX.** La même page devient une `Mission Control` premium inspirée des cockpits produit. Les métriques de synthèse proviennent du registre officiel, de Git et de l’environnement réel ; les statuts Vercel et GitHub restent des signaux de configuration locale tant qu’aucun connecteur live n’est branché dans cette vue.

**2026-07-27 - Produit/UX.** La vue de développement reçoit une `Roadmap intelligente` dérivée du registre officiel. Les dépendances, dates prévues, gains et dette sont inférés depuis le Master Plan, puis recalculés localement quand un chantier est marqué terminé afin de proposer automatiquement la prochaine fonctionnalité logique sans ouvrir une seconde source de vérité.

**2026-07-27 - Pilotage/Tech.** La vue de développement reçoit une `Mémoire technique` qui consolide les décisions canoniques de stack, d’architecture, de composants et de workflow, puis les mélange aux décisions formalisées dans le Master Plan. L’objectif est de retrouver un “pourquoi” technique en quelques secondes sans repartir d’une lecture intégrale de la documentation.

**2026-07-27 - Tech/Build.** Les fichiers `e2e/` et `playwright.config.ts` sont exclus du `tsconfig` applicatif afin que `next build` ne tente plus de typer les helpers Playwright hors bundle. Les tests E2E restent exécutables via Playwright ; seul le périmètre de vérification du build Next est recentré sur l’application.

**2026-07-19 - Correctif React/mobile.** La navigation mobile admin conserve deux actions vers `/dashboard/admin/controle`, mais leur clé React combine désormais libellé et URL. Le warning de clé dupliquée est couvert par un contrat `2/2 PASS` et une assertion console Playwright `1/1 PASS`.

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
| Qualité | Baseline tests, lint, build et snapshot | Tous | ✅ Terminé | P0 Critique | 2026-07-19 | 202/202 tests, ESLint ciblé, build Next.js 168 pages, snapshot UI portable | Maintenir la baseline |
| Maintenance | Allègement du code et des dépendances mortes | Tous | ✅ Terminé | P2 Important | 2026-07-19 | 10 dépendances directes inutilisées retirées (36 paquets transitifs), 2 composants TSX et 2 fichiers de support sans consommateur supprimés ; 193/193 tests, lint et build 168 pages | Poursuivre par petits lots prouvés, sans supprimer les compatibilités legacy encore actives |
| Qualité | Smoke E2E des espaces critiques | Owner, concierge, provider | ✅ Terminé | P0 Critique | 2026-07-18 | Playwright Chromium : 3/3 PASS ; workflow GitHub contrôle secrets, tests, lint, build puis tous les E2E | Configurer les secrets GitHub et lancer la première exécution distante |
| Qualité | E2E transactionnel commercial | Owner, concierge | ⏸️ Reporté | P0 Critique | 2026-08-02 | Parcours métier et webhook signé 1/1 PASS ; branche Checkout Stripe hébergée prête avec garde sk_test_, carte de test, retour facture et synchronisation ; clé de test indisponible pour le moment | Reprendre le scénario Checkout dès qu'une E2E_STRIPE_SECRET_KEY de test sera disponible ; ne pas le proposer comme prochaine meilleure action d'ici là |
| Qualité | E2E transactionnel provider | Concierge, provider | ✅ Terminé | P0 Critique | 2026-07-18 | Mission, intervention, preuve média privée, clôture et facture liée de 90 €, 1/1 PASS | Configurer Stripe test et valider le paiement |
| Outils métier | Assistant décoration | Concierge, propriétaire | 🟠 Partiel | P2 Important | 2026-07-18 | page `/dashboard/concierge/decoration-ai`, API dédiée, `decorationAssistant.ts`, migration `decoration_ai_reports`, tests | Valider l'usage terrain, tracer l'envoi owner et brancher une génération d'image réelle |
| Maintenance | Incidents persistants | Concierge, owner, provider | 🟠 Partiel | P0 Critique | 2026-07-19 | incidents+médias/RLS, API GET/POST/PATCH, cycle, affectation, upload privé et liens signés, contrat 6/6 PASS | Appliquer les migrations puis valider le parcours E2E persistant |
| Data | Activation et funnel par rôle | Admin, direction | ✅ Terminé | P0 Critique | 2026-07-19 | API connectée et cockpit validés : taux/volumes par rôle, 4 groupes, zones, seuils visibles, faible échantillon, baisse et actions ciblées ; repli contact_messages si messages absent ; contrat 5/5, Playwright 1/1, suite 195/195 et build 168 pages | Surveiller les groupes et recalibrer les seuils lorsque le volume réel devient statistiquement représentatif |
| Profils | Identité professionnelle artisan | Provider/artisan | 🟠 Partiel | P0 Critique | 2026-07-19 | Profil métier persistant ; justificatifs privés PDF/images et SHA-256 ; décision admin tracée avec motif de rejet ; annuaire de dispatch limité aux compteurs/types vérifiés actifs, sans donnée fichier ; contrat 4/4, 192/192 tests, lint et build 168 pages | Appliquer la migration distante, valider le cycle upload → décision → signal sur données connectées, puis concevoir la fiche publique artisan détaillée |
| Équipe | Cycle de vie des membres concierge | Concierge, admin | ✅ Terminé | P0 Critique | 2026-07-19 | Migration/RLS disponible sur la base connectée ; API GET/POST/PATCH/DELETE, scoping concierge/admin, UI création/disponibilité/désactivation ; contrat 3/3, Playwright connecté 1/1, suite 201/201 et build 168 pages | Surveiller l’usage terrain et ajouter l’historique détaillé seulement si le besoin est confirmé |
| Pilotage | Maintenance automatique du Master Plan | Équipe projet | ✅ Terminé | P0 Critique | 2026-07-29 | `AGENTS.md`, présente section, journal Developer + Mission Control + Roadmap intelligente + Mémoire technique synchronisés avec le Master Plan, Git et l’environnement ; dédoublonnage de la vue développement en retirant le planning parallèle ; la vue ajoute maintenant un `Conseiller projet` avec réponses calculées sur prochaine fonctionnalité rentable, blocages, composants sous-utilisés, modules terminés, dérives design system, pages proches production, gros fichiers et manques de tests ; `224/224` tests et build Next PASS le mercredi 29 juillet 2026 | Observer l’usage réel du conseiller puis décider s’il faut une persistance serveur, des questions personnalisables ou un branchement LLM temps réel |
| Administration | Centre de santé opérationnelle | Admin | ✅ Terminé | P0 Critique | 2026-07-29 | État global sur 12 sources, sources non vérifiables explicites et cycle persistant : prise en charge, transmission au responsable et clôture avec compte rendu, sans masquer l'anomalie ; la page `/dashboard/admin/controle` suit désormais le même niveau premium que le cockpit principal : hero santé éditorial, cartes de synthèse, onglets plus décisionnels, surfaces de pilotage plus lisibles et cartes détaillées toujours compatibles avec la prise en charge persistée ; la route `/api/admin/control-tower` tolère désormais l'indisponibilité transport de Supabase via un mode dégradé traçable, garde 12 sources lisibles, injecte une anomalie de repli si tout le diagnostic distant est hors ligne et persiste localement les actions admin pour ne plus renvoyer `500` dans cet environnement ; la page `/dashboard/admin` passe en phase 8 avec un `Mission Control` premium branché sur les données réelles : hero éditorial `data story`, bandeau de synthèse, filtre 7/30/90 jours, filtre segment, KPIs de volume et complétude, liste de priorités actionnables, activité récente, tables compactes utilisateurs/demandes/missions, deux graphiques alimentés par `activation_series` et `activation_by_zone`, deux donuts visuels pour la répartition des rôles et les feux de contrôle, trois cartes de santé premium dédiées à `Inscriptions`, `Missions` et `Messages`, skeleton de chargement, états vides explicites, relance d’erreur locale, focus visible clavier et tableaux mobiles plus lisibles grâce aux libellés de colonnes et `caption/scope` ; les libellés ambigus `n/a` sont remplacés par `Donnée insuffisante` ou `Non disponible` selon le contexte ; le shell `DashboardLayout` peut désormais masquer ses blocs secondaires pour laisser chaque cockpit composer sa surface ; la page reste aussi exploitable en mode dégradé quand les endpoints admin connectés sont indisponibles et affiche alors un bandeau explicite plutôt qu’un écran vide ; `/api/admin/overview`, `/api/admin/operations` et `/api/kpis/overview` renvoient désormais un `health` explicite avec raisons et sources indisponibles au lieu de tomber en `500` lors d’une coupure Supabase ; en local avec `WORKSPACE_QUICK_LOGIN_ENABLED=true`, `/api/kpis/overview` injecte des cohortes workspace déterministes, mais la base connectée peut désormais aussi être semée pour de vrai via `npm run seed:admin:kpis` ; l’endpoint KPI retombe sur des sélections compatibles sans `provider_profile_id` et calcule l’activation provider via `provider_interventions` quand la base distante n’expose pas encore la relation provider sur `missions`, `quotes` ou `invoices` ; l’admin lit aussi désormais les missions distantes sans dépendre de `missions.title` : `control-tower` retente une sélection compatible et reconstruit un libellé via `metadata`, `operations` affiche le même fallback de titre ; le correctif structurel est maintenant prêt : `docs/sql/2026-07-29-align-remote-missions-schema.sql` ajoute et backfill `title`, `request_id` et `provider_profile_id`, avec note d'application dédiée ; vérifications : `npm run build` PASS le mercredi 29 juillet 2026, `npm run inspect:remote:admin-schema` PASS avec diagnostic précis du schéma REST distant, exécution distante `npm run seed:admin:kpis` PASS avec 18 profils seedés et 6 lots opérationnels persistés ; limite connue : la base distante n’expose toujours pas `missions.title`, `missions.request_id` ni `missions.provider_profile_id` tant que le SQL d’alignement n’a pas été exécuté sur Supabase, donc le dataset connecté reste partiellement basé sur `provider_interventions`, devis, factures, onboarding et messages pour la lecture provider | Exécuter le SQL de réalignement sur la base Supabase distante, relancer `npm run inspect:remote:admin-schema`, puis réduire progressivement les compatibilités transitoires |

| Authentification | Acces rapide aux espaces de travail | Owner, concierge, provider, admin | ✅ Terminé | P1 Prioritaire | 2026-07-19 | `/login` propose les quatre comptes Supabase de travail et preremplit email/mot de passe ; selection directe par `?workspace=` ; route strictement locale et hors production | Conserver les secrets uniquement dans `.env.local` et valider periodiquement les quatre comptes |

- **Vue de développement du Master Plan** — `✅ Terminé`, `P1 Prioritaire` au 2026-07-27. Preuve : route admin sécurisée `/dashboard/admin/developpement`, lecture serveur du fichier, synthèse, recherche, filtres statut/priorité, sommaire, journal de bord, Mission Control, Mémoire technique, Roadmap intelligente, génération automatique depuis Git + registre de maintenance, saisie manuelle locale, favoris, commentaires et tests dédiés. La page a été resserrée pour éviter les doublons entre pilotage quotidien et séquencement produit. Prochaine action : observer l’usage réel avant d’ajouter une persistance serveur ou des connecteurs live.
  - Conseiller projet : la vue `/dashboard/admin/developpement` embarque désormais un bloc `Conseiller projet` qui ne se comporte pas comme un simple chat, mais comme un coach technique à questions fixes. Il calcule ses réponses à partir du Master Plan, de Mission Control, de la roadmap, de la mémoire technique et de scans repo côté serveur `taille de fichiers, imports UI, pages testées, signaux de dérive design system`, avec affichage explicite du niveau de confiance `Factuel / Croisé / Heuristique`. Preuves : `projectAdvisor.ts`, enrichissement serveur `page.tsx`, rendu `MasterPlanViewer.tsx`, styles `page.module.scss`, test `project-advisor.test.mts`, suite `224/224 PASS`, `npm run build` PASS le mercredi 29 juillet 2026. Limite : il n’interprète pas encore les diffs ligne à ligne, les tickets externes ni les métriques d’usage réelles, et ses audits de design system / sous-utilisation restent volontairement heuristiques.
  - Accès au référentiel UI : l’en-tête de `/dashboard/admin/developpement` propose désormais une navigation d’espace compacte entre le `Pilotage` courant et la page `/design-system`, afin de retrouver le référentiel visuel en un clic sans l’imbriquer dans le cockpit déjà dense. Statut : `✅ Terminé`. Priorité : `P3 Confort`. Preuves : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`. Vérification restante : contrôle visuel desktop/mobile authentifié.
  - Référentiel Personas : la nouvelle route admin protégée `/dashboard/admin/developpement/personas` centralise huit profils cibles dans un fichier de données unique et leur associe des portraits illustratifs déjà présents dans `public/avatars`, sans réutiliser les exports de comptes réels sous `public/uploads`, avec contexte, objectifs, frustrations, première valeur, fonctionnalités prioritaires, parcours, critères de confiance, appareil, niveau numérique, source et statut de validation. Chaque fiche est désormais modifiable depuis une modale complète ; les changements sont versionnés dans le `localStorage` du navigateur, avec restauration individuelle ou globale des valeurs du code. Le code a été refactorisé en `PersonaCard`, `PersonaEditorModal`, `usePersonasStorage` et `PersonasWorkspace`, en réutilisant `Button`, `Input`, `Select`, `Textarea`, `next/image`, la navigation partagée et les helpers d’accessibilité existants. La clé et le schéma `planetls:product-personas:v1` sont conservés pour ne pas perdre les informations déjà modifiées. Les cartes réutilisent désormais le composant partagé `AvatarUpload` en grande taille (`168 px` desktop, `142 px` mobile), avec appareil photo, sélection, zoom, déplacement et rotation ; les nouveaux fichiers sont réduits à 512 px maximum avant leur sauvegarde locale, et les réglages de cadrage optionnels restent compatibles avec les personas déjà stockés. La navigation partagée `Pilotage / Personas / Design system` relie désormais les trois outils, y compris depuis `/design-system` et sa sous-page `/design-system/visuels`, qui propose aussi un retour explicite vers le référentiel principal. Statut : `🟠 Partiel`, car un persona est validé par l’usage et sept restent à confronter au terrain. Priorité : `P2 Important`. Preuves : `src/app/dashboard/admin/developpement/personas/page.tsx`, `personas.ts`, `page.module.scss`, `src/components/development/DevelopmentSectionNav.tsx`. Limite : les précisions locales ne sont ni partagées entre appareils ni persistées en base. Prochaine action : conduire des entretiens avec propriétaires, conciergeries, équipes et prestataires, puis décider si une persistance Supabase administrateur est nécessaire.
  - Validation navigateur : Playwright Chromium `1/1 PASS` sur connexion admin, lecture desktop, recherche, remise à zéro, filtre P0 et viewport mobile 390 px. Limite : inspection visuelle automatisée de la capture indisponible à cause du sandbox Windows.
  - Évolution de lecture : cartes cliquables pour chaque statut et priorité, état actif accessible avec `aria-pressed`, synchronisation avec les listes de filtres et adaptation mobile. Preuves : parseur `2/2 PASS`, ESLint ciblé et Playwright `1/1 PASS`.
  - Navigation de déblocage : dans `Mission Control`, la carte `Bloquées` ouvre désormais automatiquement `Sommaire et détail du Master Plan`, applique le filtre `⚠️ Bloqué` et scrolle vers le premier blocage visible, pour éviter une recherche manuelle dans la page de développement. Preuves : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `page.module.scss`, `src/tests/mission-control.test.mts` `1/1 PASS`, `npm run build` PASS le mercredi 29 juillet 2026.
  - Refonte cockpit premium : la page `/dashboard/admin/developpement` adopte désormais une vraie structure de pilotage haut de gamme avec hero exécutif compact, résumé du projet, métriques de maîtrise, prochaine meilleure action, dépendances dominantes, signaux récents, actions prioritaires, puis sections recontextualisées `Vue d'exécution`, `Décisions canoniques`, `Roadmap dynamique`, `Décisions et activité` et `Sommaire et détail du Master Plan`. Le fond métier est conservé mais présenté comme un dashboard produit interne plutôt qu'une documentation étendue. Preuves : `MasterPlanViewer.tsx`, `page.module.scss`, `src/tests/mission-control.test.mts` `1/1 PASS`, `npm run build` PASS le mercredi 29 juillet 2026.
  - Variante `product cockpit` orientée alertes : le hero de `/dashboard/admin/developpement` lit maintenant d'abord la tension opérationnelle avec score sur 100, jauge de pression, colonne de tension dédiée, alertes hiérarchisées, release readiness et lien direct vers le blocage prioritaire. La page donne une lecture plus immédiate de ce qui chauffe, de ce qui bloque et de ce qui demande un arbitrage avant de descendre dans les détails de roadmap et de journal. Preuves : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `src/tests/mission-control.test.mts` `1/1 PASS`, `npm run build` PASS le mercredi 29 juillet 2026.
  - Allègement de la page complète : la lecture a été réordonnée pour faire remonter `Roadmap intelligente` juste après le hero, laisser `Mission Control` en poste de surveillance détaillée et supprimer les redondances visuelles de progression, métriques, objectifs et signaux déjà présents en tête de page. La surface est plus dense en information utile dès l'ouverture, tout en gardant les données métier existantes intactes. Preuves : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `src/tests/mission-control.test.mts` `1/1 PASS`, `npm run build` PASS le mercredi 29 juillet 2026.
  - Tension plus live : la colonne de tension intègre maintenant aussi un signal de fraîcheur d’exécution basé sur le dernier repère Git disponible et le volume hebdomadaire estimé, afin de distinguer un cockpit réellement actif d’un cockpit sans mouvement récent même quand les autres alertes restent stables. Preuves : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/tests/mission-control.test.mts` `1/1 PASS`, `npm run build` PASS le mercredi 29 juillet 2026.
  - Correction desktop du cockpit admin : la zone `Activité récente` de `/dashboard/admin` ne doit plus chevaucher `Priorités immédiates` sur grand écran. La grille principale, les panneaux et les cartes d’activité/priorité imposent désormais mieux leurs largeurs minimales, leur comportement de flex et le retour à la ligne des contenus longs. Preuves : `src/app/dashboard/admin/AdminDashboard.module.scss`, `npm run build` PASS le mercredi 29 juillet 2026.
  - Repli interne des éléments longs : la timeline du `Journal de bord` dans `/dashboard/admin/developpement` ajoute maintenant un bouton à chevron `Voir l'entrée complète / Replier l'entrée` directement dans chaque carte, afin de garder une lecture scannable avant d’ouvrir les détails, audits, liens et commentaires. Preuves : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `src/tests/mission-control.test.mts` `1/1 PASS`, `npm run build` PASS le mercredi 29 juillet 2026.
  - Repli éditorial généralisé et colonne d’outils : la page `/dashboard/admin/developpement` permet maintenant d’ouvrir ou refermer depuis leur en-tête les blocs `Priorités immédiates`, `Dépendances et blocages`, `Signaux récents`, `Colonne de tension`, les cartes de `Mémoire technique`, les colonnes de la `Roadmap intelligente`, les `Résumés quotidiens` et les entrées de timeline du `Journal de bord`. Les contrôles `Rechercher une décision...` et les filtres du journal passent dans une colonne latérale droite plus discrète en desktop, tandis que la saisie `Entrée manuelle` se fait désormais via une modale dédiée pour alléger la page. La carte `Environnement actuel` est aussi recentrée visuellement sur grand écran. Preuves : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `src/tests/mission-control.test.mts` `1/1 PASS`, `npm run build` PASS le mercredi 29 juillet 2026.
  - Résumé quotidien relégué en rail de contexte : dans le `Journal de bord` de `/dashboard/admin/developpement`, les `Résumés quotidiens` ne s’étalent plus au-dessus de la timeline. Ils vivent désormais dans la colonne droite comme un rail secondaire sticky sur desktop, avec cartes plus compactes et retour sous le flux principal en mobile, afin de préserver la lecture de la timeline quand la page est déjà dense. Preuves : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `npm run build` PASS le mercredi 29 juillet 2026.
  - Cohérence filtre/compteur du Master Plan : les compteurs de statuts et priorités de `/dashboard/admin/developpement` sont désormais calculés sur les sections réellement filtrables du Master Plan, et non plus sur de simples occurrences textuelles dans tout le markdown. Le filtre `⚠️ Bloqué (3)` doit donc maintenant correspondre aux `3` sections affichées. Preuves : `src/app/dashboard/admin/developpement/masterPlan.ts`, `src/tests/mission-control.test.mts` `1/1 PASS`, `npm run build` PASS le mercredi 29 juillet 2026.
  - Navigation longue : sections repliables individuellement, commandes Tout replier/Tout déplier, compteur de sections ouvertes, chevrons et états `aria-expanded`/`aria-controls`. Preuves : ESLint ciblé, parseur `2/2 PASS` et Playwright Chromium `1/1 PASS` desktop/mobile.
  - Robustesse des panneaux repliés : les en-têtes repliés restent lisibles comme vrais titres accessibles sans dupliquer les `heading` quand le contenu est déjà ouvert. La spec Playwright a été réalignée sur le comportement attendu des panneaux `Mémoire technique` et `Sommaire et détail du Master Plan` en ouvrant explicitement les contenus internes avant d'assert leurs filtres et leur navigation. Preuves : `MasterPlanViewer.tsx`, `page.module.scss`, `e2e/admin-development.spec.ts`, Playwright Chromium `1/1 PASS`.
  - Dédoublonnage du pilotage : le bloc `Planning opérationnel` a été retiré pour éviter une seconde lecture du même séquencement que la `Roadmap intelligente`. La roadmap reste l’unique vue de priorisation dynamique ; la synthèse du Master Plan conserve uniquement les métriques documentaires utiles. Preuves : vue `MasterPlanViewer.tsx`, spec `e2e/admin-development.spec.ts`, lint et build à revalider après simplification.
  - Allègement de lecture : `Mission Control`, `Mémoire technique`, `Roadmap intelligente`, `Journal de bord`, puis le bloc `Sommaire et détail du Master Plan` disposent maintenant de flèches de repli avec résumé compact afin de réduire la charge visuelle sans retirer d’information. Les espacements, contrastes et états fermés ont été harmonisés pour une lecture plus calme sur desktop comme mobile. Preuves : `MasterPlanViewer.tsx`, `page.module.scss`, `npm run lint` PASS.
  - Stabilisation E2E locale : la route `/api/auth/dev-workspace-login` ne renvoie plus `500` quand la préparation distante Supabase échoue ; elle retourne désormais un workspace local de repli. `NextAuth` accepte aussi un fallback strictement local pour ces workspaces de développement lorsque `WORKSPACE_QUICK_LOGIN_ENABLED=true` et que Supabase Auth est inaccessible, ce qui rétablit la chaîne `/login -> /dashboard/admin` en environnement sandbox. Preuves : `src/app/api/auth/dev-workspace-login/route.ts`, `src/server/auth/devWorkspace.ts`, `src/server/auth/authOptions.ts`, Playwright Chromium `1/1 PASS` sur `e2e/admin-development.spec.ts`. Limite restante : la santé Supabase connectée reste en `danger` dans Mission Control tant que cet environnement sandbox ne peut pas joindre Supabase Auth à distance.
  - Hiérarchie documentaire : les titres parents H2 sans texte direct affichent désormais un index explicite et cliquable de leurs sous-sections H3 au lieu d’une carte visuellement vide. Validation : `1. Vision du projet` expose notamment Mission, Ambition, Valeurs et Objectifs ; Playwright desktop/mobile `1/1 PASS`, lint et build 168 pages.
  - Journal de bord du développeur : timeline verticale Art Déco légère avec couleurs par catégorie, filtres `Aujourd'hui`, `Cette semaine`, `Ce mois`, fonctionnalité, priorité et auteur, recherche instantanée, favoris, commentaires et formulaire manuel. Preuves : helper `developerLog.ts`, vue `MasterPlanViewer.tsx`, test `developer-log.test.mts`, suite `203/203 PASS`, ESLint ciblé `PASS`, build Next `PASS`.
  - Journal automatique Codex : après chaque lot local significatif, une entrée `Codex` est désormais générée automatiquement depuis les fichiers modifiés du workspace, avec résumé des changements, raisons, fichiers touchés, impacts transverses, mises à jour de roadmap, dépendances, tâches restantes, régressions potentielles et résumé quotidien agrégé. Preuves : `developerLog.ts`, `page.tsx`, `MasterPlanViewer.tsx`, test `developer-log.test.mts` `PASS`, Playwright Chromium `1/1 PASS`. Limite : la documentation reste déduite heuristiquement depuis Git, le Master Plan et les zones de code modifiées ; elle n'interprète pas encore les diffs ligne par ligne ni les PR distantes.
  - Mission Control développeur : cockpit premium de lecture rapide avec progression globale, charge hebdomadaire estimée, objectifs, dernière sauvegarde, décisions/commits récents et santé Supabase/Vercel/GitHub. Preuves : helper `missionControl.ts`, intégration serveur `page.tsx`, vue `MasterPlanViewer.tsx`, test `mission-control.test.mts`, suite `204/204 PASS`, ESLint ciblé `PASS`, build Next `PASS`.
  - Mémoire technique : base de connaissances interne avec décisions canoniques de stack/architecture/workflow et décisions extraites du Master Plan, filtres catégorie/tag et recherche instantanée “Pourquoi Supabase, Next.js, Vercel…”. Preuves : helper `technicalMemory.ts`, intégration serveur `page.tsx`, vue `MasterPlanViewer.tsx`, test `technical-memory.test.mts`, suite `206/206 PASS`, ESLint ciblé `PASS`, build Next `PASS`. Vérification navigateur : spec `e2e/admin-development.spec.ts` enrichie, mais exécution locale actuellement bloquée par la route `/api/auth/dev-workspace-login` qui ne prépare pas le compte workspace dans cet environnement.
  - Centre de décisions : nouvelle page admin `/dashboard/admin/decisions-architecture` dédiée aux arbitrages d'architecture, avec moteur de recherche, filtres par catégorie/tag, fiches complètes `contexte / problème / options / avantages / inconvénients / choix / justification / conséquences / date / auteur` et affichage des décisions liées entre elles. Preuves : `decisions-architecture/architectureDecisions.ts`, `DecisionCenterPage.tsx`, `page.tsx`, test `architecture-decisions.test.mts` `PASS`, ESLint ciblé `PASS`, build Next `PASS`. Limite : les décisions dérivées du Master Plan restent enrichies heuristiquement tant qu'une persistance ADR dédiée n'est pas branchée.
  - Roadmap intelligente : vue vivante en trois colonnes avec priorités, difficulté, dépendances, estimation, gains, dette technique, responsable, date prévue et recommandation automatique de la prochaine fonctionnalité logique ; les clôtures locales recalculent immédiatement la feuille de route. Preuves : helper `roadmap.ts`, intégration serveur `page.tsx`, vue `MasterPlanViewer.tsx`, test `roadmap.test.mts`, suite `205/205 PASS`, ESLint ciblé `PASS`, build Next `PASS`. Vérification navigateur : spec `e2e/admin-development.spec.ts` enrichie pour couvrir la roadmap, non exécutée localement car la commande `playwright` n’est pas disponible dans ce shell Windows.

### Roadmap par phases permanentes

| Phase | Périmètre | État de pilotage |
|---|---|---|
| Phase 1 — Socle fiable | Architecture, sécurité, authentification, permissions, données, CI | En cours : E2E et gouvernance Supabase restent P0 |
| Phase 2 — Mise en relation | Profils, recherche, disponibilités, zones, demandes, contacts | En cours : profil artisan et densité locale prioritaires |
| Phase 3 — Conversion en mission | Devis, contrat, mission, planning, règlement | En cours : preuve E2E et consolidation paiement manquent |
| Phase 4 — Fidélisation | Outils quotidiens, équipe, maintenance, finance, assistant décoration | En cours : plusieurs modules sont N2 et doivent être validés/persistés |
| Phase 5 — Réseau professionnel | Fil, publications, carte, mur des missions, recommandations | À faire après preuve de liquidité locale |
| Phase 6 — Développement stratégique | IA réelle, intégrations, reporting avancé, modèles économiques | Évolution future ; aucune industrialisation avant validation d'usage |

Note de trajectoire : le futur module privé `Pilotage PlanetLS` pour la fondatrice rejoint désormais la phase 6 comme chantier structurant à livrer par lots `budget, trésorerie, provisions, réserve, KPI SaaS, journal, décisions, risques`, sans le confondre avec une comptabilité réglementaire.

### Idées et opportunités — format obligatoire

Avant d'ajouter une idée, rechercher ses synonymes dans ce document. Ne pas l'implémenter hors demande.

| Idée | Problème résolu | Utilisateurs concernés | Valeur attendue | Effort estimé | Risques | Priorité proposée | Statut |
|---|---|---|---|---|---|---|---|
| Génération visuelle avant/après décoration | Le rapport actuel ne produit qu'un prompt texte | Concierge, propriétaire | Projection et conversion plus fortes | Moyen | Coût, qualité, droits sur les photos, conservation des images | P3 Confort après validation du rapport | À étudier |
| Programme d'impact solidaire local | La marque n'exprime pas encore de contribution sociale tangible malgré son ancrage terrain | Propriétaire, concierge, artisan, administrateur, partenaires associatifs | Différenciation émotionnelle, fidélisation, preuve d'utilité locale, meilleure narration de marque | Moyen à élevé | Promesse marketing sans exécution, arbitrage juridique/fiscal, gouvernance des causes, besoin de traçabilité publique | P3 Confort | À étudier |
| Pilotage PlanetLS — espace entrepreneurial et financier privé fondatrice | L'admin pilote déjà l'activité et les risques opérationnels, mais pas encore le budget prévisionnel, la trésorerie, les provisions, la réserve, les KPI SaaS consolidés et le journal entrepreneurial dans un même espace protégé | Fondatrice, administrateur principal | Vision claire de la santé business, routine financière simple, arbitrages plus rapides, meilleure préparation juridique/fiscale et meilleur alignement entre produit, revenus et cash | Élevé | Risque de dériver vers un faux logiciel comptable, taux fiscaux codés en dur, métriques approximatives prises pour des vérités, duplication avec les journaux/décisions admin existants, confidentialité des données | P1 Prioritaire | Validée |

Statuts d'idée autorisés : `À étudier`, `Validée`, `Planifiée`, `En développement`, `Livrée`, `Refusée`, `Reportée`.

### Historique synthétique des fonctionnalités structurantes

| Fonctionnalité | Création | Dernière évolution importante | Statut actuel | Limites connues | Dépendances | Prochaine étape |
|---|---|---|---|---|---|---|
| Authentification et permissions | Avant 2026-04 | 2026-06-18 | 🟡 En cours | E2E multi-rôles absent | NextAuth, Supabase, guards API, proxy | Automatiser les parcours et confirmer la sécurité en environnement réel |
| Demande → devis → mission → paiement | Avant 2026-05 | 2026-06-06 | 🟡 En cours | Validation bout en bout et consolidation paiement incomplètes | Tables métier, Stripe, workflow events | E2E owner/concierge et gestion visible des échecs |
| Profils professionnels | Avant 2026-04 | 2026-07-19 | 🟠 Partiel | Édition et preuves privées artisan livrées ; migration distante, validation admin, avis et vue publique détaillée manquent | `profiles`, `provider_profile_documents`, Storage privé, reviews | Appliquer la migration puis ajouter validation admin et signaux publics vérifiés |
| Maintenance, équipe et séjours | 2026-07 | 2026-07-12 | 🟠 Partiel | Persistance spécialisée incomplète | Missions, metadata, interventions | Tables/RLS/types et E2E |
| Réservations partagées propriétaire -> conciergerie | 2026-07-29 | 2026-07-29 | 🟡 En cours | Phases A à C terminées ; phase D désormais appliquée à distance sur `missions`, `provider_interventions` et `workflow_events` avec confirmation le mercredi 29 juillet 2026, puis nettoyée sur les parcours secondaires : table canonique `reservations`, index, trigger `updated_at`, RLS participants, helper partagé, route owner `GET/POST`, route participant `GET/PATCH`, `/api/concierge/stays` lit désormais `reservations` avant le legacy `missions`, `GET /api/concierge/reservations` prend aussi `reservations` comme racine avec rattachement des missions workflow, l'écran owner `voyageurs` lit/crée les séjours canoniques, le planning owner lit désormais `/api/owner/reservations`, `missions.reservation_id` est créé en base et poussé sur Supabase, `POST /api/concierge/reservations` crée ou recharge la réservation canonique avant les missions liées, `provider_interventions.reservation_id` est aussi créé et poussé sur Supabase, les routes mission/provider privilégient désormais les liaisons explicites avant fallback metadata, `workflow_events.reservation_id` est créé et poussé sur Supabase, `recordWorkflowEvent` sait l'écrire avec fallback si nécessaire, `/api/workflow-events` peut maintenant filtrer directement par réservation, l'agrégation de séjour privilégie `reservation_id`, les événements concierge réinjectent l'identifiant canonique, l'annulation des factures de workflow s'appuie d'abord sur `mission_id`, `/api/reservations/[id]` expose désormais une timeline unifiée de la réservation canonique avec traçage des créations owner/concierge et des mises à jour statut/notes/consignes, cette lecture est branchée dans `/dashboard/concierge/sejours` et dans l'aside de `/dashboard/owner/missions/voyageurs`, l'écriture collaborative est maintenant ouverte depuis ces deux cockpits avec actions de cycle de vie et notes éditoriales, et `/dashboard/owner/planning` réinjecte ce brief canonique dans ses cartes pour une lecture plus narrative ; les fallbacks `metadata.reservation_id/reservation_workflow_id` restent volontairement conservés en lecture pour la compatibilité avec l'historique non migré | Contrats ou devis signés, planning, missions, provider_interventions, workflow_events | Étendre maintenant cette même écriture et cette narration canonique vers les vues concierge planning/réservations détaillées et vers les opérations/artisans liés afin que tout le suivi terrain parle la même chronologie |
| Pilotage PlanetLS — cockpit entrepreneurial privé | 2026-07-29 | 2026-08-02 | 🟠 Partiel | Le cockpit opérationnel reste en place et accueille désormais un Centre de stratégie business modulaire : stratégies libres, duplication, recherche/tri/favoris/statuts, profils et offres dynamiques, matrice fonctionnelle, simulateur et projections 12/24/36 mois, KPI, scoring manuel, concurrents, timeline et journal de décisions. Les stratégies sont persistées uniquement dans le localStorage versionné du navigateur : elles ne sont ni partagées, ni sauvegardées en base, ni une comptabilité canonique. Les exports PDF/Excel/CSV/Business Plan/Pitch et l analyse IA sont préparés visuellement mais volontairement désactivés. Le modèle Stripe Concierge PRO existant n est pas modifié. | Composants UI partagés, navigateur, future persistance Supabase admin, futurs paramètres financiers canoniques, Stripe si une stratégie est validée | P1 Prioritaire : valider une première stratégie avec la fondatrice, puis ajouter persistance Supabase/RLS et tests navigateur ; seulement ensuite brancher exports et IA sur des données structurées, sans appliquer automatiquement une simulation à Stripe |
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
