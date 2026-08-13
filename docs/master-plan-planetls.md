# Master Plan PlanetLS

> Document officiel de pilotage produit, métier et technique  
> Version initiale consolidée : 18 juillet 2026  
> Source de vérité : code du dépôt, schémas/migrations, tests, puis documentation historique  
> Propriétaire du document : direction produit PlanetLS  
> Prochaine revue : à chaque fin de lot ou au minimum toutes les deux semaines

> Encodage du document normalise en UTF-8 le 6 aout 2026 pour supprimer les entrees hybrides UTF-8 / Windows-1252.

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
8. Toute evolution importante susceptible d'affecter le Business Plan doit declencher un `Business Impact Check` selon `docs/business-plan-maintenance.md`, meme si aucune hypothese strategique n'est modifiee dans la meme mission.

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
| Authentification, inscription, rôles | 🟡 En cours | N3 | Login/register, NextAuth, proxy et guards API présents ; un garde CSRF central bloque désormais les mutations `/api` hors mêmes origines autorisées avec exemptions explicites pour `/api/auth`, webhook Stripe et appels serveur-à-serveur signés ; onboarding et catégories legacy restent complexes ; E2E absent |
| Onboarding multi-profils | 🟡 En cours | N3 | Tunnel multi-étapes et événements présents ; personnalisation concierge plus mûre que owner/provider ; cohérence et instrumentation à finir |
| Dashboard propriétaire | 🟡 En cours | N3 | Cockpit riche et données réelles ; la vue d'ensemble `/dashboard/owner` s'appuie maintenant sur un socle partagé `UnifiedRoleDashboard` avec listes spotlight et piles de stats réutilisables pour priorités, missions et séjours ; quelques strates historiques et états UX restent à harmoniser sur les pages secondaires |
| Dashboard concierge | 🟡 En cours | N3 | Surface la plus avancée : cockpit, modes, objectifs, alertes, finance, CRM, maintenance ; la vue d'ensemble `/dashboard/concierge` utilise déjà le même socle UI partagé `UnifiedRoleDashboard` et conserve ses widgets, modes d'exploitation et agrégations métier propres ; plusieurs fonctions récentes restent partiellement locales/`metadata` |
| Dashboard artisan/provider | 🟡 En cours | N3 | E2E mission → intervention → preuve média privée → facture liée validé ; la vue d'ensemble `/dashboard/provider` converge maintenant elle aussi vers le socle UI partagé `UnifiedRoleDashboard`, avec priorités, planning, devis, activité et rails latéraux homogénéisés sans fusionner la logique provider ; profil métier éditable et persistant (activité, zone, disponibilité, tarifs, expérience, identité légale, assurance, certifications) ; paiement et preuves documentaires restent incomplets |
| Dashboard administrateur | 🟡 En cours | N3 | Mission Control admin recentré sur priorités, activité, tables métier, graphiques d'activation, donuts de répartition/contrôle, cartes de santé visuelles par section, hero éditorial premium et filtres segment/période ; la page `controle` suit maintenant le même niveau premium avec hero santé, onglets de premier niveau `Santé globale / Inscriptions / Missions / Messages` et surfaces de pilotage plus lisibles ; la vue d'ensemble `/dashboard/admin` converge désormais aussi vers le socle partagé `UnifiedRoleDashboard`, ce qui aligne le hero, les KPI et les rails latéraux avec l'espace propriétaire tout en conservant les agrégations admin existantes ; le parseur d'actions admin accepte aussi des identifiants système stables non UUID pour préparer le suivi d'incidents transverses sans casser les cibles métier existantes ; la page `developpement` est maintenant recentrée sur l'exécution technique `Master Plan, Mission Control, Roadmap, Mémoire, Journal`, avec le `Tableau fonctionnel / Master Plan` placé en premier et sans le `Conseiller projet` ; la page `/dashboard/admin/pilotage` synthétise désormais acquisition, activation, pipeline missions, conversion de facturation, tensions business et actions recommandées à partir des endpoints admin existants, affiche une lecture financière plus directive `prix, abonnement, commission, réserve solidaire`, conserve un bloc `Due diligence investisseur` avec verdict, scores, questions critiques, red flags et conditions avant levée, et récupère maintenant les arbitrages utiles issus du développement via une route admin dédiée `/api/admin/project-advisor` ; lecture dégradée maintenue quand certaines sources sont indisponibles ; responsive mobile des tableaux et accessibilité clavier/lecteur d'écran renforcées ; overview, contrôle, pilotage, utilisateurs et vues par rôle reliés ; validations connectées et navigation E2E encore à renforcer |
| Profils professionnels | 🟡 En cours | N3 | Profil concierge riche, owner preferences persistées ; profil artisan enrichi et persistant avec complétude métier ; la page publique concierge `/concierges/[id]` expose maintenant aussi une mini-surface type Linktree avec liens utiles `site web, LinkedIn, Instagram, Facebook`, une section `Actions recommandées` et un tracking léger des CTA issus du profil existant, sans nouveau modèle de données ; l'ouverture aux profils provider est volontairement reportée tant que leurs signaux publics de confiance et leurs CTA métier ne sont pas mieux stabilisés ; portfolio, pièces justificatives vérifiées, avis et historique complet non aboutis |
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
| Réservations et séjours voyageurs | 🟡 En cours | N2 | Moteur, API réservations, API séjours, page concierge et tests ; données principalement via missions/`metadata`, pas d'espace voyageur ; la route `/api/reservations/[id]` s'aligne maintenant sur le type partagé `TravelerStayMissionRow` au lieu d'un cast générique ; clarification métier formalisée le mercredi 29 juillet 2026 : la réservation ou le séjour doit devenir l'objet canonique partagé entre propriétaire et conciergerie, les missions restant des actions d'exécution liées, avec interventions artisans en troisième niveau |
| Maintenance et artisans | 🟡 En cours | N3 | Affectation, exécution, preuve média privée avec empreinte SHA-256 et facture provider liée validées E2E ; paiement reste à couvrir |
| Litiges et preuves | 🟡 En cours | N2 | Migrations inspections/litiges, routes API et page owner existent ; l'export HTML de dossier litige ne diffuse plus d'URLs publiques Storage et génère désormais des liens signés temporaires pour les preuves ; parcours obligatoire post-checkout et validation E2E non prouvés |
| Carte interactive réseau | 🔴 Non commencée | N1 | Bibliothèques carte et prototypes de recherche existent, mais pas de carte unifiée acteurs + missions + recherches |
| Fil d'actualité professionnel | 🔴 Non commencée | N0 | Aucun modèle ni flux réseau professionnel canonique |
| Mur des missions | 🔴 Non commencée | N1 | Les missions urgentes fournissent un socle, sans marketplace géolocalisée ouverte et filtrable |
| Avis, réputation et certifications | 🟡 En cours | N2 | API reviews et champs de profil existent ; expérience complète, modération et preuves vérifiées non abouties |
| KPI produit | 🟡 En cours | N3 | Endpoint overview et affichage admin ; activation J+7, temps de première valeur, conversion et séries fiables disponibles ; en local, `/api/kpis/overview` injecte désormais des cohortes workspace crédibles quand Supabase est inaccessible ou quand aucune cohorte mature n'existe encore ; en connecté, un seed persistant `scripts/seed-admin-workspace-kpis.mjs` peuple désormais Supabase en profils/workflows KPI rattachés à l'e-mail admin cible, et l'endpoint KPI retombe proprement sur `provider_interventions` quand la base distante ne publie pas encore `provider_profile_id` sur `missions`, `quotes` ou `invoices` ; inspection distante du mercredi 29 juillet 2026 : `missions` existe mais n'expose pas `title`, `request_id` ni `provider_profile_id`, alors que `quotes.service_request_id`, `invoices.quote_id` et `provider_interventions.provider_profile_id` sont bien présents |
| Tests E2E navigateur | 🟠 Partiel | N3 | Parcours critiques et transactionnels passent ; branche owner Checkout hébergée prête avec carte Stripe test, retour et synchronisation ; exécution réelle bloquée par l’absence de E2E_STRIPE_SECRET_KEY |
| Responsive et accessibilité | 🟡 En cours | N3 | Socle, checklists et composants accessibles ; audit systématique clavier/mobile et tests automatisés manquent |
| Design system | 🟡 En cours | N3 | Primitives, tokens, route showcase et direction Art Déco ; double strate UI, snapshot portable et tests au vert |
| SEO et acquisition publique | 🟡 En cours | N2 | Pages publiques et profils publics présents ; la home expose désormais aussi une intention éditoriale sur l'impact solidaire/humanitaire du réseau, sans mécanique métier ni paiement associatif branchés à ce stade ; les profils concierges publics disposent maintenant d'un bloc `Liens utiles` type Linktree, d'une section `Actions recommandées` et d'une instrumentation légère de clics CTA branchée sur les champs déjà persistés, ce qui améliore l'actionnabilité sans ouvrir encore un vrai cockpit acquisition ni des CTA provider ; metadata, Open Graph, JSON-LD, pages locales et mesure acquisition restent à faire |
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
| Sécurité CSRF en environnement réel | La défense centrale existe côté proxy, mais la validation E2E multi-origines et le contrôle des exemptions signées restent à confirmer en conditions proches production | Vérifications navigateur/API sur mutations protégées, exemptions Stripe et appels serveur-à-serveur documentées et rejouées |
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
- Lecture acquisition publique des CTA réellement cliqués, avec agrégation exploitable côté admin.
- Accessibilité clavier, focus trap et responsive vérifiés sur les parcours critiques.
- Encodage français résiduel et cohérence UI.

### Manquantes — priorité stratégique importante

- Carte réseau unifiée.
- Mur des missions local et mécanisme de candidature/attribution.
- Fil d'actualité professionnel utile et modéré.
- Programme d'amorçage local et outils d'invitation/parrainage mesurés.
- Pages d'acquisition par zone et par besoin avec profils vérifiés.
- Mini-pages profils plus actionnables avec CTA métier et mesure de clics, après la V1 de liens utiles publics.

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
8. Étendre la mini-page publique type Linktree aux CTA métier, au tracking de clics et aux profils providers après validation d'usage côté concierge.

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

Ajout du vendredi 7 août 2026 : une V1 légère de mini-page publique type Linktree est désormais considérée comme une extension naturelle du profil public, pas comme un module autonome. La règle produit retenue est de réutiliser les champs déjà persistés `website`, `linkedin`, `instagram`, `facebook` pour améliorer l'actionnabilité publique sans ouvrir immédiatement de nouveaux champs, ni de slug secondaire, ni d'analytics.

Ajout du vendredi 7 août 2026 : l'étape suivante retenue pour cette surface publique est un couple `CTA métier structurés + tracking léger`, toujours limité aux profils concierges. Décision de séquencement : l'ouverture aux profils provider est reportée à plus tard, car leurs besoins publics `urgence, disponibilité, devis, spécialités, preuves` et leurs signaux de confiance ne sont pas encore assez stabilisés pour mutualiser proprement la même page.

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
| 2026-08-07 | Technique/Sécurité | Centraliser la défense CSRF sur les mutations API via le proxy applicatif | Les cookies Auth.js en `SameSite=Lax` réduisaient le risque, mais les routes métier `POST/PATCH/PUT/DELETE` n'avaient pas encore de garde CSRF explicite ni de politique d'exemption centralisée | Nouveau helper `src/server/security/csrf.ts`, contrôle `Origin` puis repli `Referer` contre l'origine courante/configurée, blocage JSON `403` pour les mutations `/api` non fiables, exemptions explicites pour `/api/auth`, `/api/billing/webhook` et appels serveur-à-serveur porteurs d'en-têtes de confiance, tests dédiés `src/tests/csrf-protection.test.mts` `6/6 PASS`; build alternatif `.next-csrf-check` bloqué par un problème TypeScript préexistant hors lot dans `src/app/dashboard/admin/pilotage/page.tsx` | Tech/Sécurité/QA |
| 2026-08-07 | Produit/Acquisition | Étendre le profil public concierge avec une mini-surface type Linktree plutôt que créer un produit séparé | Le besoin réel est d'augmenter l'actionnabilité publique des profils partagés via réseaux, bouche-à-oreille ou QR code, sans ouvrir une nouvelle dette produit ou data | `/api/profiles/public/[id]` expose désormais aussi `website`, `linkedin`, `instagram`, `facebook` ; `/concierges/[id]` affiche un bloc `Liens utiles`, un CTA `Visiter le site`, une section `Actions recommandées` et poste maintenant les clics vers `/api/profiles/public/[id]/track` pour journaliser des événements `public_profile_cta_clicked` ; helpers purs de normalisation / structuration des liens et CTA + tests dédiés ; cadrage produit consigné dans `docs/spec-profils-publics-linktree-2026-08-07.md` ; décision explicite de ne pas ouvrir encore cette mécanique aux profils provider | Produit/Tech |
| 2026-07-29 | Tech/Admin | Diagnostiquer puis rendre l'admin compatible avec le schéma distant `missions` réellement exposé | Le seed KPI connecté a réussi, mais la base distante cassait encore certaines lectures admin car `missions.title`, `missions.request_id` et `missions.provider_profile_id` ne sont pas publiés par PostgREST alors que le repo les attend | Nouveau script `npm run inspect:remote:admin-schema` / `scripts/inspect-remote-admin-schema.mjs` pour sonder le schéma REST distant ; constat vérifié le mercredi 29 juillet 2026 : `missions` expose `id, owner_profile_id, concierge_profile_id, status, created_at`, mais pas `title`, `request_id` ni `provider_profile_id` ; correctifs admin branchés : `/api/admin/control-tower` retente désormais une lecture `missions` compatible sans `title` et reconstruit un libellé via `metadata.mission_title/service_label/property_label`, `/api/admin/operations` affiche aussi un titre déduit au lieu de laisser `null`, `npm run build` PASS après ces ajustements ; correctif structurel préparé ensuite dans `docs/sql/2026-07-29-align-remote-missions-schema.sql` avec note d'application `docs/remote-missions-schema-realignment-2026-07-29.md` pour réaligner la base distante sans casser les données existantes | Admin/Tech |
| 2026-07-29 | Produit/Architecture | Clarifier le modèle métier contrat -> réservation -> tâches -> intervention | Le flux cible propriétaire/conciergerie risquait de confondre réservation voyageur, mission opérationnelle et intervention artisan, ce qui aurait fragilisé planning, statuts, facturation et UX | Nouvelle spécification `docs/spec-reservations-sejours-operations-2026-07-29.md` : un devis ou contrat signé ouvre la collaboration, la réservation ou le séjour devient l'objet canonique partagé dans les deux plannings, les consignes et besoins se rattachent au séjour, les tâches concierge en dérivent, et les artisans interviennent via des interventions liées plutôt que via une confusion générale autour de `missions` | Produit/Tech |
| 2026-07-29 | Produit/Tech | Transformer la clarification métier en plan technique de migration progressive | Après avoir clarifié que la réservation n'est pas une mission, il fallait éviter une refonte théorique et définir une trajectoire compatible avec les routes déjà présentes (`concierge/reservations`, `concierge/stays`, owner `voyageurs`) | Nouveau plan `docs/plan-technique-reservations-sejours-mvp-2026-07-29.md` : introduction recommandée d'une table canonique `reservations`, liens progressifs vers `missions`, `provider_interventions` et `workflow_events`, APIs MVP 1 owner/concierge/planning, RLS cible, stratégie de migration par phases A/B/C/D et définition de done ; orientation retenue : réutiliser les surfaces existantes mais sortir le séjour de `mission.metadata` ; phase A matérialisée par la migration `supabase/migrations/20260729153000_reservations_core.sql`, les types Supabase mis à jour et un test contractuel dédié `src/tests/reservations-core-contract.test.mts` ; phase B engagée ensuite avec un CRUD minimal owner/participants (`/api/owner/reservations`, `/api/reservations/[id]`), un helper partagé `src/app/api/_shared/reservations.ts` et la route `/api/concierge/stays` branchée sur `reservations` en source primaire avec fallback legacy `missions` ; phase C est désormais terminée : `src/app/dashboard/owner/missions/voyageurs/page.tsx` lit/crée les séjours via `reservations`, `src/app/dashboard/owner/planning/page.tsx` calcule son planning depuis `/api/owner/reservations`, et `GET /api/concierge/reservations` prend désormais `reservations` comme objet racine tout en réattachant les missions opérationnelles liées pour préserver la lecture workflow ; phase D est désormais appliquée à distance sur les trois maillons principaux et nettoyée sur les parcours secondaires : migration `supabase/migrations/20260729190000_link_missions_to_reservations.sql` appliquée sur la base Supabase distante le mercredi 29 juillet 2026, ajout de `missions.reservation_id` dans les types locaux, insert mission compatible avec fallback si la colonne n'est pas encore exposée à distance, `POST /api/concierge/reservations` garantit désormais l'existence de la réservation canonique avant création des missions liées, routes `concierge/reservations`, `concierge/stays` et `reservations/[id]` capables d'utiliser `reservation_id` avant de retomber sur `metadata.reservation_id/reservation_workflow_id`, extension explicite vers les artisans avec migration `supabase/migrations/20260729193000_link_provider_interventions_to_reservations.sql` elle aussi appliquée à distance le mercredi 29 juillet 2026, création de `provider_interventions.reservation_id` et lecture/écriture des interventions branchées d'abord sur cette liaison avant fallback metadata, puis extension explicite de la timeline avec migration `supabase/migrations/20260729194500_link_workflow_events_to_reservations.sql` appliquée à distance le mercredi 29 juillet 2026, helper `recordWorkflowEvent` compatible `reservation_id`, API `/api/workflow-events` filtrable par `reservationId`, et écritures mission/facture/devis capables d'alimenter cette relation directe ; le nettoyage secondaire est aussi livré : agrégation des séjours priorisant `reservation_id`, événements concierge enrichis en `reservation_id`, annulation de facture de workflow pilotée par `mission_id` plutôt que par le seul metadata workflow, moteur de planning aligné sur l'identifiant canonique de réservation, puis nouvelle couche de cycle de vie partagé directement sur la réservation canonique avec timeline unifiée `workflow_events + événements synthétiques`, traçage des créations owner/concierge et journalisation des mises à jour de statuts, notes et consignes dans `PATCH /api/reservations/[id]` | Produit/Tech |
| 2026-07-29 | Produit/UX | Rendre la lecture du séjour réellement collaborative dans les cockpits owner et concierge | La réservation canonique exposait déjà ses champs éditoriaux et sa timeline, mais les écrans métier lisaient encore surtout des cartes statiques ou dérivées de `missions`, sans narration partagée du séjour | `/dashboard/concierge/sejours` charge maintenant `/api/reservations/[id]` sur le séjour sélectionné et affiche une section `Lecture collaborative` avec propriétaire, dernière mise à jour, consignes d'accès, notes owner/conciergerie et une timeline récente ; `/dashboard/owner/missions/voyageurs` récupère aussi le détail canonique de la réservation focalisée, ajoute un bouton `Suivi`, un `Brief collaboratif` et une `Timeline récente` dans l'aside, avec états loading/erreur/empty ; preuves : contrat `src/tests/reservations-api-contract.test.mts` enrichi, suite Node ciblée `19/19 PASS` et `npm run build` PASS le mercredi 29 juillet 2026 | Produit/UX/Tech |
| 2026-07-29 | Produit/UX | Ouvrir l'écriture collaborative du séjour depuis les cockpits owner/concierge et prolonger ce récit dans le planning owner | La lecture canonique était branchée, mais l'utilisateur devait encore sortir des écrans métier pour enrichir le brief ou faire avancer le cycle de vie partagé du séjour | `PATCH /api/reservations/[id]` accepte désormais aussi les effacements volontaires de `access_instructions`, `owner_notes` et `concierge_notes`, tout en journalisant ces mises à jour comme `Brief collaboratif mis a jour` ; `/dashboard/concierge/sejours` permet maintenant d'éditer les consignes d'accès et les notes conciergerie, puis d'exécuter directement des actions de timeline `Accuser reception`, `Marquer en sejour` et `Cloturer` ; `/dashboard/owner/missions/voyageurs` permet désormais au propriétaire d'éditer ses consignes d'accès et notes owner dans l'aside focalisée, puis d'annuler le séjour depuis le cockpit avec traçage canonique ; `/dashboard/owner/planning` réinjecte aussi le voyageur, les notes owner/concierge, les consignes d'accès et la conciergerie dans ses cartes et pastilles pour rendre le planning plus éditorial ; preuves : contrat `src/tests/reservations-api-contract.test.mts` enrichi, suite Node ciblée `19/19 PASS`, `npm run build` PASS le mercredi 29 juillet 2026 | Produit/UX/Tech |
| 2026-07-29 | Data/Tech | Semer un jeu KPI persistant rattaché aux workspaces admin | Le fallback local gardait l'UI lisible, mais ne créait aucune donnée réelle dans Supabase pour valider les KPI connectés | Nouveau script `scripts/seed-admin-workspace-kpis.mjs` + commande `npm run seed:admin:kpis` : création idempotente de 18 profils KPI liés à `admin@planetls.fr` (6 owner, 6 concierge, 6 provider), événements d'onboarding, demandes, destinataires, devis, factures, conversations, messages, `workflow_events`, `provider_clients` et `provider_interventions` ; exécution réelle réussie le mercredi 29 juillet 2026 avec IDs persistés en base ; `/api/kpis/overview` tolère aussi les schémas distants incomplets en réessayant sans `provider_profile_id` et en calculant l'activation provider via `provider_interventions` si `missions` n'expose pas encore cette relation | Admin/Data/Tech |
| 2026-07-28 | Produit/UX | Basculer le dashboard administrateur en Mission Control orienté action | La page admin restait lisible comme audit interne mais pas encore comme cockpit quotidien de décision | `/dashboard/admin` adopte un bandeau de synthèse, un filtre 7/30/90 jours, un filtre segment `Propriétaires/Conciergeries/Artisans`, des cartes KPI, une liste de priorités actionnables, une activité récente, trois tables métier compactes, deux lectures graphiques issues des vraies données (`activation_series`, `activation_by_zone`), deux donuts supplémentaires pour la répartition des rôles et les feux de contrôle, trois cartes de santé visuelles pour `Inscriptions`, `Missions` et `Messages`, ainsi qu’un hero premium de type `data story` avec tension du jour, actions chaudes et résumés éditoriaux ; les libellés `n/a` sont remplacés par `Donnée insuffisante` / `Non disponible` ; la page `/dashboard/admin/controle` est aussi remontée au même niveau visuel avec hero santé éditorial, cartes de synthèse, onglets plus décisionnels et surfaces de pilotage plus lisibles ; la page couvre aussi une phase 6 d’états UX complets et une phase 7 responsive/a11y : boutons de filtre avec état clavier explicite, focus visible, tableaux annotés (`caption`, `scope`) et repli mobile en cartes lisibles via libellés de colonnes ; `DashboardLayout` peut masquer ses blocs secondaires pour laisser cette composition respirer ; la page reste désormais lisible en mode dégradé si `overview`, `operations`, `control-tower` ou `kpis` sont indisponibles et affiche un bandeau d’état explicite ; `/api/admin/overview`, `/api/admin/operations` et `/api/kpis/overview` renvoient aussi un payload `health` plutôt qu’un `500` quand Supabase est inaccessible, ce qui garde le cockpit exploitable en sandbox ; en complément, `/api/kpis/overview` injecte maintenant en local des cohortes workspace déterministes et des zones/series non nulles quand Supabase tombe ou quand aucune cohorte mature n'est encore disponible, afin d'éviter des visuels durablement vides pendant l'amorçage ; phase 8 validée avec `npm run build` PASS, Playwright `e2e/admin-dashboard.spec.ts` PASS, Playwright `e2e/admin-kpi-activation.spec.ts` PASS, Playwright `e2e/admin-control-actions.spec.ts` PASS et contrat `src/tests/kpis-overview-contract.test.mts` PASS ; revalidation complémentaire du 2026-07-28 : contrat `src/tests/kpis-overview-contract.test.mts` `5/5 PASS`, `npm run build` PASS | Admin/Produit/Tech |
| 2026-07-29 | Produit/Finance | Ajouter un cockpit admin dédié au pilotage entrepreneurial et financier | Le cockpit admin principal pilotait bien l'activité et les risques, mais il manquait une lecture plus directement business sur la croissance, le pipeline et la tension de trésorerie | Nouvelle route `/dashboard/admin/pilotage` branchée à la navigation admin, au centre de commandes global et au shell dashboard ; la page agrège `/api/admin/overview`, `/api/admin/operations`, `/api/admin/control-tower` et `/api/kpis/overview` pour afficher une synthèse acquisition/activation, des estimations de pipeline missions, de valeur planifiée, de valeur facturée visible, un taux de monétisation, une lecture d'encaissement final, des alertes de friction commerciale et des actions recommandées ; la page reste lisible en mode dégradé quand certaines sources remontent un `health` incomplet ; vérification : `npm run build` PASS le mercredi 29 juillet 2026, route statique `/dashboard/admin/pilotage` générée dans le build | Admin/Produit/Finance |
| 2026-08-03 | Produit/Finance | Remplacer le comparateur d'offre Pro par un cadrage financier plus direct | La fondatrice ne veut plus d'un comparateur de scénarios ; elle a besoin d'une première proposition de prix, d'une estimation selon le nombre d'abonnés et d'une hypothèse de commission | Le `Business Strategy Center` de `/dashboard/admin/pilotage` abandonne le comparatif A/B/C et affiche désormais une recommandation simple : `Conciergerie Pro` à `99 € HT / mois` en lancement puis `149 € HT / mois` en cible, avec tableau d'estimation MRR/ARR par volume d'abonnés, hypothèse alternative de commission à `8 %` avec projection mensuelle selon le nombre de missions, et note explicite indiquant que l'idée de commission solidaire associations est conservée mais reportée tant que le choix financier principal n'est pas arrêté ; vérification : `npm run build` PASS le lundi 3 août 2026 | Admin/Produit/Finance |
| 2026-08-03 | Produit/Finance | Conserver une due diligence investisseur dans le cockpit de pilotage | La réflexion due diligence produite en session risquait de rester hors du produit, donc difficilement réutilisable dans le pilotage global | La page `/dashboard/admin/pilotage` embarque désormais un bloc `Due diligence investisseur` avec verdict `Attendre`, scoring investisseur, top questions critiques, red flags majeurs et conditions minimales avant réexamen d'un dossier de levée ; le Master Plan conserve aussi une synthèse durable de cette lecture pour éviter de la perdre hors conversation ; vérification : `npm run build` PASS le lundi 3 août 2026 | Admin/Produit/Finance |
| 2026-08-03 | Documentation/IA | Conserver durablement le cadrage du futur système de prompts PlanetLS | La spécification IA détaillée était présente dans une pièce jointe Codex, donc facile à perdre et difficile à retrouver dans le dépôt | Création du dossier `docs/ai/` avec un index dédié et une fiche `systeme-gestion-prompts-planetls-2026-08-03.md` résumant l'objectif, l'architecture en 3 niveaux, les contraintes et la séquence de travail recommandée pour un futur centre de prompts ; aucun développement produit lancé à ce stade | Produit/Tech/Documentation |
| 2026-08-03 | Technique/Sécurité | Préserver la confidentialité des preuves litige et réintégrer seulement les récupérations locales à faible risque | Le poste fixe contenait des changements non poussés alors que `master` avait déjà divergé ; il fallait récupérer uniquement les morceaux encore pertinents sans réintroduire l'ancienne direction UI | Conservation ciblée de trois apports : export litige via liens signés temporaires au lieu d'URLs publiques Storage, typage explicite `TravelerStayMissionRow` dans `/api/reservations/[id]`, et ouverture du parseur `admin/control-tower` aux cibles système non UUID avec tests associés ; les écrans locaux de pilotage plus anciens ne sont pas réinjectés car `master` suit déjà une autre trajectoire fonctionnelle | Tech/Sécurité/QA |
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

**2026-08-03 - Pilotage/UX mobile admin.** La barre mobile du rÃ´le admin n'utilise plus une logique terrain gÃ©nÃ©rique `Accueil / Planning / Missions / Messages / Terrain`. Elle renvoie maintenant vers `Vue plateforme`, `Pilotage business`, `Controle detaille` et `Developpement`, avec une feuille d'actions mobile alignÃ©e sur la revue admin plutÃ´t que sur l'exÃ©cution terrain. Preuves : `src/app/components/dashboard/mobile/DashboardMobileExperience.tsx`. VÃ©rification : `next build` relancÃ© aprÃ¨s libÃ©ration du verrou `.next/lock`.

**2026-08-13 - Pilotage/UX mobile admin.** La feuille `Action admin` a finalement Ã©tÃ© retirÃ©e de la barre mobile admin. Elle restait purement locale `checklist, capture, signature`, sans persistance serveur ni impact direct sur les vraies vues `Pilotage business`, `ContrÃ´le dÃ©taillÃ©` ou `DÃ©veloppement`, et ajoutait une couche de revue redondante. La barre admin conserve un accÃ¨s direct aux pages utiles `Vue plateforme`, `Pilotage business`, `ContrÃ´le dÃ©taillÃ©`, `DÃ©veloppement` et `Missions`. Preuves : `src/app/components/dashboard/mobile/DashboardMobileExperience.tsx`. VÃ©rification restante : relancer `next build`.

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
| `docs/ai/README.md` | Point d'entrée du référentiel IA et prompts | Index documentaire actif pour retrouver les idées IA durables |
| `docs/ai/systeme-gestion-prompts-planetls-2026-08-03.md` | Vision du système de gestion des prompts Codex | Spécification IA active à réévaluer avant implémentation |
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

Pour les evolutions importantes touchant offre, marche, revenus, couts, IA, architecture ou segmentation, la mise a jour doit aussi indiquer si un `Business Impact Check` a ete realise et quelles sections du Business Plan sont potentiellement `A actualiser` ou `A valider`.

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

| Authentification | Acces rapide aux espaces de travail | Owner, concierge, provider, admin | ✅ Terminé | P1 Prioritaire | 2026-07-19 | `/login` propose les quatre comptes Supabase de travail et preremplit email/mot de passe ; selection directe par `workspace=` ; route strictement locale et hors production | Conserver les secrets uniquement dans `.env.local` et valider periodiquement les quatre comptes |

- **Vue de développement du Master Plan** — `✅ Terminé`, `P1 Prioritaire` au 2026-07-27. Preuve : route admin sécurisée `/dashboard/admin/developpement`, lecture serveur du fichier, synthèse, recherche, filtres statut/priorité, sommaire, journal de bord, Mission Control, Mémoire technique, Roadmap intelligente, génération automatique depuis Git + registre de maintenance, saisie manuelle locale, favoris, commentaires et tests dédiés. La page a été resserrée pour éviter les doublons entre pilotage quotidien et séquencement produit. Prochaine action : observer l’usage réel avant d’ajouter une persistance serveur ou des connecteurs live.
  - Conseiller projet : la vue `/dashboard/admin/developpement` embarque désormais un bloc `Conseiller projet` qui ne se comporte pas comme un simple chat, mais comme un coach technique à questions fixes. Il calcule ses réponses à partir du Master Plan, de Mission Control, de la roadmap, de la mémoire technique et de scans repo côté serveur `taille de fichiers, imports UI, pages testées, signaux de dérive design system`, avec affichage explicite du niveau de confiance `Factuel / Croisé / Heuristique`. Preuves : `projectAdvisor.ts`, enrichissement serveur `page.tsx`, rendu `MasterPlanViewer.tsx`, styles `page.module.scss`, test `project-advisor.test.mts`, suite `224/224 PASS`, `npm run build` PASS le mercredi 29 juillet 2026. Limite : il n’interprète pas encore les diffs ligne à ligne, les tickets externes ni les métriques d’usage réelles, et ses audits de design system / sous-utilisation restent volontairement heuristiques.
  - Accès au référentiel UI : l’en-tête de `/dashboard/admin/developpement` propose désormais une navigation d’espace compacte entre le `Pilotage` courant et la page `/design-system`, afin de retrouver le référentiel visuel en un clic sans l’imbriquer dans le cockpit déjà dense. Statut : `✅ Terminé`. Priorité : `P3 Confort`. Preuves : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`. Vérification restante : contrôle visuel desktop/mobile authentifié.
  - Référentiel Personas : le socle de données personas et l'atelier d'édition locale ont d'abord été construits sous `/dashboard/admin/developpement/personas`, avec huit profils cibles, portraits `public/avatars`, contexte, objectifs, frustrations, première valeur, fonctionnalités prioritaires, parcours, critères de confiance, appareil, niveau numérique, source et statut de validation. Les changements restent versionnés dans le `localStorage` via `PersonaCard`, `PersonaEditorModal`, `usePersonasStorage` et `PersonasWorkspace`, avec restauration individuelle ou globale. La clé et le schéma `planetls:product-personas:v1` sont conservés pour ne pas perdre les informations déjà modifiées. Statut : `🟠 Partiel`, car un persona est validé par l’usage et sept restent à confronter au terrain. Priorité : `P2 Important`. Preuves : `src/app/dashboard/admin/developpement/personas/`, `src/components/development/DevelopmentSectionNav.tsx`. Limite : les précisions locales ne sont ni partagées entre appareils ni persistées en base. Prochaine action : conduire des entretiens avec propriétaires, conciergeries, équipes et prestataires, puis décider si une persistance Supabase administrateur est nécessaire.
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
| Référentiel IA PlanetLS et bibliothèque de prompts versionnée | Les idées et prompts IA restent dispersés entre conversations, pièces jointes et documents isolés, donc difficiles à retrouver et à faire évoluer | Fondatrice, administrateur principal, développeur | Retrouver vite les cadres IA utiles, réduire les répétitions, préparer un futur centre de prompts sans dupliquer les sources | Moyen | Dérive documentaire sans gouvernance, duplication avec le Master Plan, tentation d'industrialiser trop tôt l'interface | P2 Important | Validée |

Statuts d'idée autorisés : `À étudier`, `Validée`, `Planifiée`, `En développement`, `Livrée`, `Refusée`, `Reportée`.

### Pilotage business et financier — réflexion sur une offre Pro

Contexte au lundi 3 août 2026 : le cockpit entrepreneurial privé sait déjà comparer des stratégies et simuler des scénarios, mais PlanetLS n'a pas encore figé une offre Pro monétisable à brancher ensuite dans Stripe, dans le discours commercial et dans les KPI. L'objectif prioritaire n'est donc pas d'ajouter plus de simulation, mais de choisir une offre simple à vendre, lisible pour la cible et cohérente avec la maturité réelle du produit.

### Due diligence investisseur — synthèse conservée

Lecture comité d'investissement au lundi 3 août 2026 : PlanetLS n'est pas encore finançable comme un SaaS prêt pour une levée de plusieurs millions d'euros. Le verdict simulé reste `Attendre`, non parce que la vision serait faible, mais parce que trop de risques structurants restent ouverts en même temps.

Constats à garder visibles :

- PlanetLS cumule encore trois moteurs difficiles à exécuter simultanément : `SaaS`, `marketplace locale` et `réseau professionnel`.
- Le segment payeur principal n'est pas encore verrouillé avec des preuves commerciales réelles.
- La liquidité locale et l'effet réseau restent à démontrer ; ils ne peuvent pas encore être considérés comme acquis dans une thèse d'investissement.
- Le risque de désintermédiation après la première mise en relation reste élevé.
- Le produit est déjà large et crédible, mais cette largeur augmente la dette d'exécution tant que le PMF n'est pas prouvé.
- Le noyau le plus prometteur à ce stade reste `Conciergerie Pro`, à traiter d'abord comme moteur SaaS / workflow avant d'industrialiser la logique marketplace.

Top questions comité à conserver :

1. Quel problème unique PlanetLS résout-il mieux que tout autre outil, pour un segment unique et solvable 
2. Qui paie en premier et pourquoi 
3. Pourquoi une conciergerie paierait-elle PlanetLS plutôt qu'un empilement `WhatsApp + Excel + Notion + Stripe + PMS` 
4. PlanetLS est-il d'abord un SaaS, une marketplace ou un réseau, et lequel domine économiquement 
5. Quel niveau de densité locale est nécessaire pour rendre la marketplace utile 
6. Quel est le risque réel de désintermédiation après le premier match 
7. Quelle fonctionnalité justifie à elle seule un abonnement récurrent `99–149 € HT / mois` 
8. Quel est le taux réel `demande -> devis -> mission -> facture -> paiement` 
9. Quel moat défendable existera à 5 ans 
10. Si 70 % du produit devait disparaître pour accélérer, quel serait le noyau conservé 

Conditions minimales avant réexamen investisseur :

- Signer `10 à 15` conciergeries payantes réellement actives.
- Geler une offre unique vendue pendant au moins `60 jours`.
- Mesurer `activation`, `rétention` et `churn` à `30/60/90 jours` par cohorte.
- Prouver la chaîne `demande -> mission -> paiement` sur données réelles.
- Valider une zone pilote avec densité locale minimale et temps de réponse crédible.
- Choisir clairement `SaaS d'abord puis marketplace` ou l'inverse, mais ne plus piloter les deux comme moteurs primaires en même temps.
- Produire un mini-dossier avec `CAC`, `LTV`, `marge brute` et `coût d'onboarding` observés, pas seulement simulés.

#### Stratégie A — Abonnement logiciel Pro unique

- Principe : une offre mensuelle simple, vendue comme cockpit Pro pour conciergeries et propriétaires professionnels, avec accès aux modules les plus mûrs et promesse de gain de temps opérationnel.
- Avantages : lisibilité commerciale forte ; pricing facile à tester ; meilleur fit avec une logique SaaS récurrente ; limite la charge manuelle de vente sur mesure ; facilite plus tard la connexion aux KPI MRR, churn et activation.
- Risques : promesse trop large si certains modules clés restent N2/N3 ; objection prix si la valeur n'est pas perçue dès la première semaine ; risque de vendre un "tout-en-un" alors que les usages réels sont encore hétérogènes selon les profils.
- Conditions de réussite : périmètre fonctionnel strictement borné ; onboarding très court avec première valeur en moins de 7 jours ; page d'offre claire avec preuves d'usage concrètes ; support fondateur très réactif sur les premiers comptes.

#### Stratégie B — Offre Pro hybride avec abonnement socle + services d'accompagnement

- Principe : un abonnement Pro volontairement resserré sur le cockpit et les usages récurrents, complété par des services payants d'onboarding, paramétrage, import, cadrage ou accompagnement business.
- Avantages : monétisation plus réaliste à court terme ; réduit le risque de sous-pricer l'effort d'acquisition et de mise en route ; s'adapte à des clients encore peu matures numériquement ; crée du chiffre d'affaires même si le produit n'est pas encore totalement industrialisé.
- Risques : modèle moins scalable ; dépendance plus forte au temps fondatrice/ops ; confusion possible entre logiciel et prestation ; marge plus difficile à standardiser si le catalogue d'accompagnement n'est pas borné.
- Conditions de réussite : découpage très explicite entre ce qui est inclus dans l'abonnement et ce qui relève du service ; packages d'accompagnement standardisés ; estimation du temps de delivery réelle ; pilotage serré du coût d'acquisition et du temps passé par client.

#### Stratégie C — Offre Pro segmentée par vertical métier

- Principe : plusieurs offres Pro distinctes selon le profil, par exemple `Conciergerie Pro`, `Propriétaire Pro` puis plus tard `Prestataire Pro`, chacune avec proposition de valeur, modules et prix dédiés.
- Avantages : meilleure pertinence du discours ; prix potentiellement mieux alignés à la valeur perçue ; réduit l'effet "usine à gaz" d'une offre unique ; permet de concentrer la roadmap sur le segment qui convertit le mieux.
- Risques : complexité produit, marketing et pricing plus élevée ; plus de friction côté Stripe, support, contenus et KPI ; danger de lancer trop tôt plusieurs offres alors que la densité d'usage et les preuves clients sont encore faibles.
- Conditions de réussite : choisir un segment prioritaire net ; limiter le nombre d'offres actives au départ ; disposer d'indicateurs séparés par segment ; accepter de reporter certains profils tant que le message principal n'est pas stabilisé.

#### Recommandation argumentée

Recommandation : privilégier la stratégie B comme point d'entrée des 60 à 90 prochains jours, avec une trajectoire assumée vers la stratégie C et sans se verrouiller trop tôt dans une promesse SaaS unique de type stratégie A.

Pourquoi ce choix : PlanetLS possède déjà un socle crédible, mais le Master Plan montre encore plusieurs modules `🟡 En cours` et `🟠 Partiel`, avec une valeur plus mûre côté conciergerie/admin que côté produit totalement standardisé. Une offre hybride permet donc de vendre dès maintenant une valeur réelle sans surpromettre, de financer l'apprentissage terrain, de comprendre quels services deviennent récurrents, puis de transformer ensuite ce qui se répète en fonctionnalités produit ou en déclinaison segmentée `Conciergerie Pro`. En revanche, partir tout de suite sur une offre A trop large exposerait à du churn lié aux attentes, et partir immédiatement sur une offre C complète multiplierait la complexité avant d'avoir le bon message commercial.

Cadre recommandé : lancer une seule offre commerciale prioritaire `Conciergerie Pro`, avec un abonnement socle clair et 2 à 3 packs d'accompagnement bornés. Les propriétaires professionnels peuvent rester en cible secondaire tant que la proposition de valeur dédiée n'est pas validée en entretien et en closing.

#### Plan d'action en 7 jours

1. Jour 1 : figer la cible prioritaire, le problème principal résolu et la promesse exacte de l'offre Pro en une phrase ; bannir toute promesse non soutenue par le produit actuel.
2. Jour 2 : définir le contenu de l'abonnement socle `Conciergerie Pro` avec une liste stricte `inclus / non inclus / bientôt`, plus 2 ou 3 packs d'accompagnement standardisés.
3. Jour 3 : fixer une première hypothèse de prix avec bornes basses et hautes, puis préparer un script d'entretien commercial de 20 minutes pour tester valeur perçue, objections et urgence.
4. Jour 4 : sélectionner 5 à 10 prospects ou contacts chauds, réaliser les entretiens et noter systématiquement les signaux `compréhension`, `intérêt`, `objection prix`, `objection confiance`, `fonction manquante`.
5. Jour 5 : synthétiser les retours dans le cockpit entrepreneurial, comparer au moins 2 variantes de pricing et décider si l'offre garde un socle unique ou si une segmentation légère devient déjà nécessaire.
6. Jour 6 : rédiger la page d'offre et le support de vente minimal `landing, argumentaire, FAQ, conditions d'accompagnement`, sans encore automatiser Stripe tant que le wording n'a pas été validé à l'oral.
7. Jour 7 : arbitrer go/no-go sur un pilote payant, choisir 1 offre officielle à tester pendant 30 jours, définir les KPI de validation `taux de rendez-vous, taux d'intérêt, taux de closing, délai à première valeur, temps d'accompagnement par client`.

### Historique synthétique des fonctionnalités structurantes

| Fonctionnalité | Création | Dernière évolution importante | Statut actuel | Limites connues | Dépendances | Prochaine étape |
|---|---|---|---|---|---|---|
| Authentification et permissions | Avant 2026-04 | 2026-08-07 | 🟡 En cours | Le proxy bloque maintenant aussi les mutations API cross-origin non fiables via un garde CSRF central (`Origin`/`Referer`) avec exemptions explicites pour `/api/auth`, webhook Stripe et appels serveur-à-serveur signés ; E2E multi-rôles et validation de cette défense en environnement réel restent absents | NextAuth, Supabase, guards API, proxy, helper CSRF partagé | Automatiser les parcours et confirmer la sécurité en environnement réel, y compris les cas CSRF autorisés/refusés |
| Demande → devis → mission → paiement | Avant 2026-05 | 2026-06-06 | 🟡 En cours | Validation bout en bout et consolidation paiement incomplètes | Tables métier, Stripe, workflow events | E2E owner/concierge et gestion visible des échecs |
| Profils professionnels | Avant 2026-04 | 2026-08-07 | 🟠 Partiel | Édition et preuves privées artisan livrées ; la vue publique concierge expose maintenant une V1 actionnable type Linktree sur les liens sociaux existants, des CTA structurés et un tracking léger des clics ; migration distante, validation admin, avis plus riches, lecture acquisition des CTA et vue provider détaillée manquent encore ; l'extension provider reste volontairement reportée | `profiles`, `provider_profile_documents`, Storage privé, reviews, profils publics, workflow_events | Agréger ensuite les CTA réellement utilisés, clarifier les CTA métier provider, puis étendre la mécanique sans créer de second produit de profil public |
| Maintenance, équipe et séjours | 2026-07 | 2026-07-12 | 🟠 Partiel | Persistance spécialisée incomplète | Missions, metadata, interventions | Tables/RLS/types et E2E |
| Réservations partagées propriétaire -> conciergerie | 2026-07-29 | 2026-07-29 | 🟡 En cours | Phases A à C terminées ; phase D désormais appliquée à distance sur `missions`, `provider_interventions` et `workflow_events` avec confirmation le mercredi 29 juillet 2026, puis nettoyée sur les parcours secondaires : table canonique `reservations`, index, trigger `updated_at`, RLS participants, helper partagé, route owner `GET/POST`, route participant `GET/PATCH`, `/api/concierge/stays` lit désormais `reservations` avant le legacy `missions`, `GET /api/concierge/reservations` prend aussi `reservations` comme racine avec rattachement des missions workflow, l'écran owner `voyageurs` lit/crée les séjours canoniques, le planning owner lit désormais `/api/owner/reservations`, `missions.reservation_id` est créé en base et poussé sur Supabase, `POST /api/concierge/reservations` crée ou recharge la réservation canonique avant les missions liées, `provider_interventions.reservation_id` est aussi créé et poussé sur Supabase, les routes mission/provider privilégient désormais les liaisons explicites avant fallback metadata, `workflow_events.reservation_id` est créé et poussé sur Supabase, `recordWorkflowEvent` sait l'écrire avec fallback si nécessaire, `/api/workflow-events` peut maintenant filtrer directement par réservation, l'agrégation de séjour privilégie `reservation_id`, les événements concierge réinjectent l'identifiant canonique, l'annulation des factures de workflow s'appuie d'abord sur `mission_id`, `/api/reservations/[id]` expose désormais une timeline unifiée de la réservation canonique avec traçage des créations owner/concierge et des mises à jour statut/notes/consignes, cette lecture est branchée dans `/dashboard/concierge/sejours` et dans l'aside de `/dashboard/owner/missions/voyageurs`, l'écriture collaborative est maintenant ouverte depuis ces deux cockpits avec actions de cycle de vie et notes éditoriales, et `/dashboard/owner/planning` réinjecte ce brief canonique dans ses cartes pour une lecture plus narrative ; les fallbacks `metadata.reservation_id/reservation_workflow_id` restent volontairement conservés en lecture pour la compatibilité avec l'historique non migré | Contrats ou devis signés, planning, missions, provider_interventions, workflow_events | Étendre maintenant cette même écriture et cette narration canonique vers les vues concierge planning/réservations détaillées et vers les opérations/artisans liés afin que tout le suivi terrain parle la même chronologie |
| Pilotage PlanetLS — cockpit entrepreneurial privé | 2026-07-29 | 2026-08-06 | 🟠 Partiel | Le cockpit opérationnel reste en place mais le centre de stratégie business de la page `/dashboard/admin/pilotage` est maintenant recentré sur une gamme plus crédible à tester : `29 € HT / mois`, `49 € HT / mois` puis `sur devis`, avec préférence actuelle pour la `stratégie B par niveau`. Les onglets marché, finance et modèle économique portent désormais cette même narration, la commission n'étant plus présentée comme direction immédiate mais comme hypothèse secondaire à réévaluer seulement si PlanetLS prouve une vraie intermédiation de missions et de coordination. Les exports PDF/Excel/CSV/Business Plan/Pitch et l analyse IA restent désactivés, et le modèle Stripe Concierge PRO existant à `29 €` reste visible mais non modifié. | Composants UI partagés, navigateur, future persistance Supabase admin, futurs paramètres financiers canoniques, Stripe si une stratégie est validée | P1 Prioritaire : tester d'abord la lisibilité et l'acceptabilité de la gamme `29 / 49 / sur devis`, confirmer ou infirmer la préférence pour la stratégie B sur prospects réels, puis seulement décider s'il faut réintroduire une logique de commission ou une variante hybride |
| Assistant décoration | 2026-07-18 | 2026-07-18 | 🟠 Partiel | Moteur déterministe, pas d'image réelle ni envoi owner tracé | `decoration_ai_reports`, API concierge | Tester avec des concierges avant extension |
| Réseau professionnel | Vision 2026-07 | 2026-07-18 | 🔴 À faire | Liquidité locale non prouvée | Profils, zones, missions, modération | Pilote local puis mur des missions |

### Mise à jour ciblée — Pilotage Business du lundi 3 août 2026

- Statut : `🟠 Partiel`
- Priorité : `P1 Prioritaire`
- Périmètre mis à jour : `/dashboard/admin/pilotage`
- Réalité produit : le haut de page a été simplifié pour retirer les blocs exploratoires devenus encombrants (`comparateur d'offre Pro`, `mémo investisseur`) et garder un cockpit plus directement exploitable.
- Ajout majeur : un premier `RiskRegister` statique et filtrable est maintenant affiché dans la page via `src/app/dashboard/admin/pilotage/risk-register/`, sans migration ni persistance Supabase.
- Source d'alimentation : les risques affichés reprennent la lecture due diligence et la transforment en cartographie opérationnelle par priorité, catégorie, profils impactés, horizon, mitigation et signaux d'alerte.
- Limites connues : le registre ne permet encore ni édition, ni assignation persistée, ni historique, ni scoring dynamique ; il ne remplace pas encore un vrai module de gouvernance des risques.
- Dépendances inchangées : endpoints admin existants, composants dashboard partagés, future persistance Supabase admin, futur arbitrage Stripe si un modèle financier est figé.
- Décision de pilotage : conserver le cadrage financier et la synthèse investisseur dans ce Master Plan comme base d'arbitrage, sans les laisser occuper la page opérationnelle tant que le modèle économique n'est pas validé.
- Preuve de vérification : `npm run build` PASS le lundi 3 août 2026.
- Prochaine étape recommandée : définir plus tard un schéma canonique `risk_register` seulement après validation du noyau business `offre, prix, commission ou non`.
- À faire demain, samedi 8 août 2026 : ouvrir un premier cockpit admin des événements `public_profile_cta_clicked` pour lire les clics CTA publics par profil, canal et période, puis décider si l'itération suivante porte sur l'agrégation acquisition concierge ou sur le cadrage des CTA métier provider.

Ajout du lundi 3 août 2026 : la vue rapide chiffrée du haut de page `Pilotage Business` a aussi été retirée, car les tuiles `pipeline`, `missions facturées`, `activation moyenne` et `points de vigilance` donnaient une précision trompeuse. Le haut de page est maintenant recentré sur un cadrage décisionnel qualitatif.
Ajout du lundi 3 août 2026 : la page `Pilotage Business` embarque maintenant un module `Conseiller stratégique` statique qui formalise la méthode de décision de la fondatrice en 8 étapes, les questions stratégiques à poser, les critères de comparaison des options et les sorties de pilotage à historiser. Cette brique reste volontairement sans persistance ni automatisation afin de préserver la simplicité tout en créant une mémoire de travail réutilisable.
Ajout du lundi 3 août 2026 : la page `Pilotage Business` expose aussi un module `Validation marché` statique de type Lean Startup. Il consolide un diagnostic initial, le classement des hypothèses critiques, un plan de validation sur 30 jours, les 13 tests mesurables, les scripts d'entretien, le sondage, les variantes de landing, les KPI de validation, la grille `GO / TEST MORE / PIVOT`, les recommandations d'intégration et les actions immédiates. Cette brique s'appuie sur les parcours déjà disponibles, ne modifie pas Stripe, ne lance aucune migration et sert d'abord de cadre d'exécution frugal avant toute nouvelle couche produit.

### Mise à jour ciblée — Navigation admin du mardi 4 août 2026

- Statut : `🟡 En cours`
- Priorité : `P2 Important`
- Périmètre mis à jour : `/dashboard/admin/developpement`, `/dashboard/admin/controle`, `/dashboard/admin/pilotage`, `/api/admin/project-advisor`
- Réalité produit : la page `developpement` n'est plus pensée comme un long scroll continu. Elle ouvre maintenant directement sur le `Tableau fonctionnel / Master Plan`, puis sépare `Mission Control`, `Roadmap`, `Mémoire` et `Journal` dans des onglets explicites. Le bloc `Sommaire et détail du Master Plan` a en plus été allégé au strict utile : filtres + sections, sans métriques, sans sommaire latéral et sans raccourcis redondants.
- Réalité produit : le `Conseiller projet` a quitté la page `developpement`. Les signaux utiles à l'arbitrage produit/business sont maintenant relus depuis `Pilotage Business`, dans l'onglet stratégie, via la route admin `/api/admin/project-advisor`.
- Réalité produit : la page `controle` est désormais structurée par onglets de premier niveau `Santé globale / Inscriptions / Missions / Messages`, ce qui isole mieux la vue de santé, les filtres métier et les listes opérationnelles sans mélanger tous les blocs sur une seule lecture verticale.
- Réutilisation : l'implémentation s'appuie sur les primitives UI `Tabs` déjà présentes dans le design system, sans créer de nouveau composant spécifique.
- Réutilisation : la génération du conseiller est mutualisée côté serveur pour pouvoir alimenter `Pilotage Business` sans réintroduire ces arbitrages dans la page `developpement`.
- Responsive et accessibilité : la navigation onglets reste clavier-compatible via les primitives existantes ; les listes d'onglets se replient sur une seule colonne en mobile pour éviter les débordements horizontaux.
- Limites connues : la page `controle` conserve encore des sections pliables à l'intérieur de chaque onglet pour les filtres et le détail ; ce n'est donc pas encore une simplification maximale du flux.
- Vérification : `npm.cmd run build` `PASS` le mardi 4 août 2026.
- Prochaine étape recommandée : si l'usage confirme le gain de lisibilité, réduire ensuite le nombre de sections pliables internes dans `controle` pour garder un seul niveau de hiérarchie visuelle par onglet.

### Mise à jour ciblée — Intégration progressive des dashboards du mercredi 5 août 2026

- Statut : `🟡 En cours`
- Priorité : `P2 Important`
- Périmètre mis à jour : `src/app/components/dashboard/unified/`, `/dashboard/owner`, `/dashboard/admin`
- Réalité produit : l'intégration dashboard est maintenant découpée par lots au lieu de modifier les quatre espaces simultanément. Les dashboards owner, admin, concierge et provider convergent progressivement vers un socle UI partagé `UnifiedRoleDashboard`, sans fusionner leurs logiques métier ni leurs sources de données. Le socle supporte désormais les variantes de rôle, les tons de badges configurables et une zone de complément hero réutilisable.
- Réalité produit : l'espace propriétaire réutilise davantage les composants communs déjà présents (`UnifiedSpotlightList`, `UnifiedStatStack`) pour ses priorités, ses prochaines missions et ses repères séjours, ce qui réduit les rendus ad hoc sans changer les sources de données owner existantes.
- Réalité produit : la page `/dashboard/admin` a quitté l'ancien `DashboardLayout` spécifique pour rejoindre le même tronc commun visuel que l'owner. Les calculs métier admin, les endpoints (`/api/admin/operations`, `/api/admin/overview`, `/api/admin/control-tower`, `/api/kpis/overview`) et les tableaux détaillés sont conservés, mais la composition devient plus homogène avec hero partagé, KPI unifiés, rail d'activité et raccourcis latéraux.
- Réutilisation : aucune nouvelle dépendance n'a été ajoutée ; le lot capitalise sur les primitives dashboard existantes au lieu d'introduire une seconde bibliothèque de composants.
- Réalité produit : l'espace concierge reposait déjà majoritairement sur ce même socle UI partagé ; le lot suivant a surtout confirmé cette convergence sans réécriture lourde ni changement des fetchs métier concierge.
- Réalité produit : la page `/dashboard/provider` a quitté son cockpit isolé pour rejoindre le même tronc commun visuel que les autres espaces, tout en conservant ses calculs métier, ses liens d'action et ses sources provider existantes.
- Limites connues : plusieurs styles legacy restent présents dans `page.module.scss` même si la couche de composition principale est maintenant homogénéisée ; la navigation E2E inter-pages et les compteurs filtrés par lien restent encore à consolider.
- Vérification : `npm run build` `PASS` le jeudi 6 août 2026.
- Prochaine étape recommandée : factoriser ensuite ce qui reste dupliqué dans les tableaux, listes compactes, rails de priorités et états vides, sans écraser les besoins métier propres à chaque rôle.

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

### Mise à jour ciblée — Référentiel IA du lundi 3 août 2026

- Statut : `🟠 Partiel`
- Priorité : `P2 Important`
- Périmètre mis à jour : `docs/ai/`, `src/server/prompt-library/`, `/api/admin/prompt-library`, `/dashboard/admin/pilotage`
- Réalité produit : PlanetLS dispose maintenant d'un contexte central partagé, de règles Codex permanentes, d'une première bibliothèque de `10` prompts versionnés, d'un parseur léger de frontmatter/sections et d'un onglet admin `Centre IA` dans `Pilotage Business` pour rechercher, filtrer, consulter et préparer les prompts sans dupliquer leur source.
- Source officielle : les prompts restent des fichiers Markdown dans `docs/ai/prompts/` ; l'interface admin ne crée pas de seconde source de vérité.
- Sécurité : la lecture passe par une route admin dédiée `/api/admin/prompt-library` ; aucun secret, token ou donnée personnelle n'est stocké dans les prompts ou les runs.
- Vérifications : test ciblé `src/tests/prompt-library.test.mts` `3/3 PASS` le lundi 3 août 2026 ; `npm run build` `PASS` le lundi 3 août 2026.
- Limites connues : les favoris et préparations sont stockés localement dans le navigateur ; les runs ne sont pas encore persistés automatiquement ; `npm test` global n'est pas entièrement vert à cause de trois échecs préexistants hors périmètre (`concierge-team-api-contract`, `dashboard-client` avec OOM, puis le nouveau test avant correction d'import).
- Prochaine étape recommandée : migrer d'autres prompts historiques utiles, ajouter un enregistrement léger optionnel des runs importants et relier davantage le Centre IA au journal de bord de développement sans créer de duplication documentaire.
### Mise Ã  jour ciblÃ©e â€” Cartographie de convergence des dashboards du jeudi 6 aoÃ»t 2026

- Statut : `ðŸŸ¡ En cours`
- PrioritÃ© : `P2 Important`
- PÃ©rimÃ¨tre mis Ã  jour : `docs/dashboards/dashboard-feature-inventory.md`, `docs/dashboards/dashboard-roadmap.md`, `docs/master-plan-planetls.md`
- RÃ©alitÃ© produit : avant de poursuivre la convergence visuelle, un inventaire repo-first des dashboards owner, concierge, provider/artisan et admin a Ã©tÃ© formalisÃ©. Il confirme que les homes `/dashboard/owner`, `/dashboard/concierge`, `/dashboard/provider` et `/dashboard/admin` partagent dÃ©jÃ  un socle commun `UnifiedRoleDashboard`, tandis qu'une seconde strate legacy reste active sur plusieurs pages secondaires via `DashboardLayout`, `WorkspacePageShell`, `DashboardWorkspace` et `SimpleOverviewWorkspace`.
- RÃ©alitÃ© produit : la convergence progressive du cockpit n'est pas un dÃ©placement du "vrai" Ã©tat mÃ©tier vers une abstraction vide. Elle sert au contraire Ã  rapprocher des surfaces dÃ©jÃ  rÃ©elles vers un socle commun de composition, sans fusionner les fetchs, les permissions ni les rÃ¨gles propres Ã  chaque rÃ´le.
- DÃ©cision de pilotage : la suite doit rester dÃ©coupÃ©e `dashboard par dashboard`, avec prioritÃ© immÃ©diate aux briques communes et aux pages d'entrÃ©e, puis aux pages admin secondaires `controle` et `pilotage`, avant de reprendre les overviews legacy plus diffuses.
- DÃ©cision de pilotage : `DashboardLayout`, `WorkspacePageShell` et `SimpleOverviewWorkspace` restent des couches de transition acceptÃ©es tant qu'elles servent des pages encore actives, mais ne doivent plus devenir la rÃ©fÃ©rence de nouvelles intÃ©grations. Le prototype `/premium-owner-dashboard` reste une source d'inspiration UX, pas une base technique Ã  propager.
- DÃ©pendances et limites : plusieurs modules forts restent hybrides ou partiellement consolidÃ©s cote donnÃ©es `reservations/sejours`, `CRM owner/concierge`, `equipe`, `finances`, `pages admin expertes`; leur harmonisation visuelle doit suivre leur maturitÃ© rÃ©elle et non la prÃ©cÃ©der.
- VÃ©rifications : inventaire croisÃ© entre code, routes dashboard, tests ciblÃ©s `mission-control`, `owner-crm` et documentation produit/UX existante ; pas de changement fonctionnel direct sur les parcours mÃ©tier dans ce lot.
- Prochaine Ã©tape recommandÃ©e : migrer la prochaine surface visible `admin/controle` vers le socle partagÃ©, puis aligner plus explicitement la narration `owner <-> concierge` autour des rÃ©servations/sejours canoniques.

### Mise à jour ciblée — Allègement du panneau Master Plan du jeudi 6 août 2026

- Statut : `🟡 En cours`
- Priorité : `P2 Important`
- Périmètre mis à jour : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `docs/master-plan-planetls.md`
- Réalité produit : dans `/dashboard/admin/developpement`, le panneau autrefois nommé `Sommaire et détail du Master Plan` est désormais recentré sur la lecture utile des sections et tableaux. Le titre devient `Tableaux du Master Plan`, et les sections parentes sans contenu propre n’affichent plus un mini-sommaire de sous-sections ; elles montrent seulement une courte phrase indiquant d’ouvrir les sous-sections concernées.
- Décision de pilotage : dans ce cockpit, le sommaire interne n’apporte pas assez de valeur face au coût visuel. Les filtres restent la vraie porte d’entrée, puis les tableaux et sections détaillées servent de source de vérité.
- Limites connues : les styles historiques liés au sommaire interne peuvent encore exister dans la feuille SCSS tant qu’ils ne gênent pas le rendu ; un nettoyage CSS plus large pourra être fait lors d’un prochain lot UI.
- Vérifications : simplification locale du composant sans changement de logique métier ; build Next à relancer après le lot.
- Prochaine étape recommandée : confirmer visuellement que la lecture `filtres -> tableaux -> sections` suffit en desktop et mobile, puis poursuivre l’allègement des autres panneaux documentaires si cette hiérarchie est jugée plus efficace.
### Mise Ã  jour ciblÃ©e â€” Recentrage Business Plan de la page pilotage du jeudi 6 aoÃ»t 2026

- Statut : `ðŸŸ¡ En cours`
- PrioritÃ© : `P1 Prioritaire`
- PÃ©rimÃ¨tre mis Ã  jour : `/dashboard/admin/pilotage`, `docs/master-plan-planetls.md`
- RÃ©alitÃ© produit : la page `Pilotage` n'est plus organisÃ©e comme un cockpit mixte `overview / stratÃ©gie / validation / risques / centre IA`. Elle devient une page unique consacrÃ©e au `business plan PlanetLS`, avec une lecture plus directionnelle : thÃ¨se produit, rÃ©sumÃ© exÃ©cutif, traction actuelle, offre recommandÃ©e `Conciergerie Pro`, scÃ©narios financiers, Ã©conomie unitaire cible, benchmark de positionnement, go-to-market et risques prioritaires.
- RÃ©alitÃ© produit : les donnÃ©es rÃ©elles encore utiles au business plan restent exploitÃ©es via les endpoints existants `/api/admin/overview`, `/api/admin/operations` et `/api/kpis/overview` pour alimenter la traction actuelle, les blocages de demandes, les devis acceptÃ©s non transformÃ©s et les missions non facturÃ©es.
- DÃ©cision de pilotage : le benchmark affichÃ© dans la page sert de `cadre stratÃ©gique interne` inspirÃ© des familles d'outils `PMS`, `opÃ©rations terrain`, `coordination d'interventions`, `expÃ©rience de confiance` et `marketplaces locales`. Il ne doit pas Ãªtre interprÃ©tÃ© comme un comparatif tarifaire externe vivant.
- DÃ©cision de pilotage : les modules plus exploratoires `validation marchÃ©`, `registre de risques complet`, `centre IA`, `conseiller stratÃ©gique` et `conseiller projet issu du dÃ©veloppement` ne structurent plus la page pilotage. Ils restent disponibles ailleurs dans le projet ou dans le code, mais ne sont plus la porte d'entrÃ©e principale du pilotage business.
- Limites connues : les scÃ©narios financiers et le benchmark restent des hypothÃ¨ses de pilotage et non des donnÃ©es marchÃ© validÃ©es automatiquement ; aucune persistance admin de business plan, aucun export investisseur et aucun reporting financier canonique n'ont Ã©tÃ© ajoutÃ©s dans ce lot.
- VÃ©rification : `npm run build` Ã  relancer aprÃ¨s le lot pour confirmer la stabilitÃ©.
- Prochaine Ã©tape recommandÃ©e : si cette narration business est validÃ©e, relier ensuite les leviers `traction, activation, rÃ©tention pilote, risques` Ã  des filtres et vues dÃ©taillÃ©es plus ciblÃ©s, sans retransformer la page en cockpit multi-onglets hÃ©tÃ©rogÃ¨ne.

Ajout du jeudi 6 aoÃ»t 2026 : la page a ensuite Ã©tÃ© poussÃ©e vers une lecture plus `investor deck / board-level`, avec une narration plus concise pour comitÃ© de direction, une table `TAM / SAM / SOM` qualitative, un plan d'exÃ©cution `12 mois` et des `conditions avant accÃ©lÃ©ration`. Cette surcouche reste volontairement prudente : elle professionnalise le storytelling business sans prÃ©tendre produire un vrai modÃ¨le financier canonique ni des donnÃ©es de marchÃ© live.
Ajout du jeudi 6 aoÃ»t 2026 : la page `Pilotage` a aussi Ã©tÃ© rÃ©organisÃ©e en `4 onglets` `Vue d'ensemble / MarchÃ© & offre / Finance / ExÃ©cution & risques`. Le contenu reste orientÃ© business plan et investor deck, mais il n'est plus prÃ©sentÃ© comme une longue suite de blocs verticaux ; la hiÃ©rarchie devient plus digeste et plus exploitable pour une lecture direction.
Ajout du jeudi 6 aoÃ»t 2026 : l'onglet `MarchÃ© & offre` intÃ¨gre maintenant l'Ã©tude concurrentielle PlanetLS sous une forme visuelle et pilotable `tarifs du marchÃ©`, `benchmark concurrentiel intÃ©grÃ©`, `tableau comparatif synthÃ©tique`, `enseignements du benchmark`. Les tarifs d'Easy Concierge, Turno, Breezeway, Guesty, Airbnb co-hÃ´tes, AlloVoisins / marketplaces locales et PlanetLS servent de repÃ¨res de positionnement, pas de vÃ©ritÃ© financiÃ¨re canonique ni de comparatif contractuel vivant.
Ajout du jeudi 6 aoÃ»t 2026 : la mÃªme page pousse dÃ©sormais le benchmark vers une lecture plus `board-level`, avec un graphe de positionnement `prix vs profondeur fonctionnelle`, un tableau `stratÃ©gie ocÃ©an bleu` et un bloc `lecture comitÃ© de direction`. La page assume ainsi davantage son rÃ´le de support d'arbitrage et de narration stratÃ©gique, tout en restant distincte d'un reporting financier canonique.

### Mise à jour ciblée — Onglet Modèle économique du jeudi 6 août 2026

- Statut : `🟠 Partiel`
- Priorité : `P1 Prioritaire`
- Périmètre mis à jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `src/app/dashboard/admin/pilotage/economic-model/types.ts`, `src/app/dashboard/admin/pilotage/economic-model/data.ts`, `docs/master-plan-planetls.md`
- Réalité produit : la page `/dashboard/admin/pilotage` expose désormais un cinquième onglet `Modèle économique` dans la navigation principale du business plan. Cette première étape pose la structure du futur module sans créer de seconde page ni casser les onglets existants.
- Réalité produit : un socle dédié `economic-model` formalise maintenant les types métier de pricing `PricingStrategyType`, `PricingStrategyStatus`, `PricingOfferStatus`, `PricingOffer`, `PricingScenario`, `PricingDecisionLogEntry`, ainsi qu'un inventaire initial des 10 stratégies tarifaires à comparer et des profils tarifaires de référence.
- Décision de pilotage : le module sépare explicitement `réel`, `hypothèse` et `simulation` avant d'ajouter des calculateurs plus poussés. Il documente d'abord la gouvernance, les stratégies, les profils et un journal initial des décisions, afin d'éviter toute confusion entre aide à la décision et offre publiée.
- Décision de pilotage : un bloc protégé `Conciergerie Pro existante` rend visible dans le cockpit business l'offre réelle déjà reliée à Stripe via le plan `concierge_pro_monthly`, avec prix mensuel affiché `29 €`, statut de production et interdiction explicite de modification depuis ce module.
- Limites connues : l'éditeur d'offres simulées, la matrice de fonctionnalités, le scoring pondéré, les scénarios `prudent / réaliste / ambitieux` et le comparateur visuel multi-stratégies ne sont pas encore branchés dans cet onglet. Le lot pose le socle de types et de structure UI pour les étapes suivantes.
- Vérification : `npm run build` PASS après intégration de l'onglet `Modèle économique` et du bloc protégé `Conciergerie Pro existante`.
- Prochaine étape recommandée : brancher l'éditeur d'offres simulées sur ce socle, puis raccorder les futures simulations financières et la matrice de fonctionnalités sans toucher à Stripe.

### Mise a jour ciblee - Extension du module Modele economique du jeudi 6 aout 2026

- Statut : ` Partiel`
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

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : le module `Modele economique` n'utilise plus de sous-onglets internes. La lecture est maintenant structuree en une seule page continue avec un hero de cadrage, une rangee de cartes de reperes, puis 7 sections editoriales `Vue d'ensemble`, `Strategies`, `Offres & profils`, `Simulations`, `Comparaison`, `Tests tarifaires`, `Decisions`.
- Decision de pilotage : ce choix UX reduit l'effet `onglet dans l'onglet` dans la page `Pilotage` et rend le parcours plus clair pour une lecture direction, sans changer le perimetre fonctionnel du module.
- Decision de pilotage : les strategies restent visibles d'un seul coup d'oeil et les tableaux importants restent dans le flux de lecture, plutot que caches derriere des changements d'etat internes.
- Limites connues : les simulations, la comparaison et les tests restent encore des blocs statiques de pilotage ; le gain de ce lot est surtout la clarte d'interface, pas une nouvelle profondeur metier ou data.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres refonte UX du module.
- Prochaine etape recommandee : pousser la meme logique de clarte visuelle dans les futurs blocs `editeur d'offres simulees` et `matrice de fonctionnalites`, en evitant de recreer de nouveaux sous-onglets.

### Mise a jour ciblee - Renforcement board executive des blocs Strategies et Comparaison du jeudi 6 aout 2026

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la section `Strategies` affiche maintenant un niveau de lecture direction supplementaire avec trois cartes executive mises en avant `option prioritaire / option simple / option risquee`, en plus de la grille complete des dix strategies.
- Realite produit : la section `Comparaison` commence desormais par une synthese visuelle board-level avec cartes de score, barres de lecture rapide et classement relatif des modeles `par niveau / hybride / par profil / abonnement + commission`, avant la grille detaillee.
- Decision de pilotage : le module ne se contente plus d'enumerer les options ; il met en scene les arbitrages pour permettre une lecture plus immediate des compromis `vitesse / clarte / potentiel MRR / maintenance`.
- Limites connues : les scores restent des hypotheses editoriales statiques et non un moteur de calcul dynamique branche sur des ponderations editables. Cette couche sert la lisibilite executive, pas encore une verite analytique canonique.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres renforcement visuel board-level du module `Modele economique`.
- Prochaine etape recommandee : appliquer la meme logique de lecture executive aux futures briques `editeur d'offres simulees`, `matrice de fonctionnalites` et `simulations modifiables`, avec un vrai systeme de score ensuite si le socle data est confirme.

### Mise a jour ciblee - Mise en gamme visuelle du bloc Simulations du jeudi 6 aout 2026

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la section `Simulations` n'est plus seulement un tableau et trois cartes de lecture. Elle ajoute maintenant une premiere couche `KPI`, une couche `cartes scenario premium` et une couche `projection investisseur` afin de rendre la trajectoire plus lisible pour un usage board-level.
- Decision de pilotage : les hypotheses de simulation sont desormais mises en scene comme une histoire financiere a comparer `MRR / ARR / prix moyen / marge / run rate / lecture 12-24-36 mois`, sans les presenter comme des donnees reelles acquises.
- Limites connues : les scenarios restent statiques, sans edition ni recalcul dynamique, et la projection investisseur reste editoriale. Cette brique professionnalise la lecture mais ne constitue pas encore un reporting financier canonique.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres transformation premium du bloc `Simulations`.
- Prochaine etape recommandee : faire du bloc `Offres & profils` la prochaine zone premium, avec editeur visuel d'offres simulees, paliers, badges, limites et matrice de fonctionnalites lisible en lecture board.

### Mise a jour ciblee - Simplification du module et score moyen dans les cartes Strategies du jeudi 6 aout 2026

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la page `Modele economique` a ete simplifiee pour reduire les doublons de lecture. La rangee de cartes de reperes a ete retiree, le bloc `Strategies` repose maintenant sur une seule grille principale, et la partie `Comparaison` a ete reduite a une lecture executive plus concise.
- Realite produit : chaque carte de strategie affiche maintenant un `score moyen` visible directement dans la carte, afin de rendre le niveau d'interet plus lisible sans ouvrir d'autre vue ni lire tout le detail.
- Decision de pilotage : la page privilegie desormais une lecture plus directe `synthese -> gouvernance -> strategies -> simulations -> comparaison -> tests -> decisions`, avec moins de couches paralleles et moins de repetition visuelle.
- Limites connues : le score moyen reste un repere editorial calcule a partir d'un barème interne statique, pas un moteur de scoring dynamique editable. La simplification ameliore la clarte mais ne change pas encore la profondeur fonctionnelle du module.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres simplification de la page et ajout du score moyen dans les cartes `Strategies`.
- Prochaine etape recommandee : simplifier de la meme maniere `Offres & profils`, puis transformer cette zone en veritable bloc premium avec offres simulees, badges, limites et matrice de fonctionnalites plus executive.

### Mise a jour ciblee - Refonte premium du bloc Offres et profils du jeudi 6 aout 2026

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la section `Offres & profils` ne se limite plus a un tableau de prochaine etape. Elle expose maintenant des cartes d'offres simulees, une lecture plus claire des profils cibles et un cadre produit simplifie pour le futur pricing `socle / modules / limites`.
- Decision de pilotage : cette zone devient un bloc plus direction et plus visuel, utile pour arbitrer la forme de l'offre avant de construire un veritable editeur ou une matrice fonctionnelle complete.
- Limites connues : les offres restent encore des hypotheses editoriales statiques ; il n'y a pas encore d'edition admin, pas de comparaison de fonctionnalites ligne a ligne et pas de liaison a un moteur de pricing ou a Stripe.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres refonte premium du bloc `Offres & profils`.
- Prochaine etape recommandee : poursuivre sur une matrice de fonctionnalites executive et compacte, afin de comparer clairement ce qui est inclus, limite, optionnel ou reserve a des modules futurs.

### Mise a jour ciblee - Matrice de fonctionnalites executive du jeudi 6 aout 2026

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la section `Offres & profils` integre maintenant une matrice de fonctionnalites executive et compacte comparant les offres simulees `Essentiel / Pro / Portefeuille` sur une lecture `Inclus / Limite / Option / Futur`.
- Decision de pilotage : cette matrice sert a rendre la promesse commerciale et les limites de chaque hypothese beaucoup plus lisibles pour un arbitrage direction, sans attendre un futur editeur complet ou une vraie persistance admin.
- Limites connues : la matrice reste statique, sans edition, sans liaison a des droits, sans moteur de pricing et sans source canonique de fonctionnalites. Elle clarifie la lecture mais ne constitue pas encore une verite produit executable.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres ajout de la matrice de fonctionnalites executive.
- Prochaine etape recommandee : soit basculer vers un mini editeur visuel des offres simulees, soit poursuivre le nettoyage editorial global de la page `Pilotage` pour harmoniser encore la densite des sections restantes.

### Mise a jour ciblee - Mini editeur visuel des offres simulees du jeudi 6 aout 2026

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la section `Offres & profils` integre maintenant un mini editeur visuel non editable dans les cartes d'offres simulees, avec badges, volume de biens, volume d'utilisateurs, niveau de support, modules visibles et nombre de limites clefs.
- Decision de pilotage : cette surcouche ne cherche pas encore a devenir un vrai formulaire admin ; elle sert a rendre les hypotheses d'offres beaucoup plus tangibles et discutables en reunion, sans rajouter de complexite technique ou de risque Stripe.
- Limites connues : les valeurs restent statiques et editoriales, sans edition ni persistence. Ce mini editeur est une projection UX de la future brique `offer editor`, pas encore une implementation metier complete.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres ajout du mini editeur visuel des offres simulees.
- Prochaine etape recommandee : poursuivre soit par un nettoyage editorial global de la page `Pilotage`, soit par une couche de priorisation plus nette sur `Tests tarifaires` et `Decisions` pour terminer l'harmonisation executive du module.

### Mise a jour ciblee - Nettoyage editorial et renforcement executive de la page Pilotage du jeudi 6 aout 2026

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la page `Pilotage` et l'onglet `Modele economique` ont ete relus et simplifies pour une lecture plus direction. Plusieurs formulations ont ete raccourcies, les messages repetitifs ont ete reduits et les blocs `Conditions avant acceleration`, `Narration board / investisseur` et le hero du module economique portent des intitules plus clairs.
- Realite produit : le rendu visuel a ete pousse vers une lecture plus `board / executive` avec un hero plus affirme, une hierarchie typographique plus nette, des espacements plus reguliers, des cartes plus homogenes, des onglets mieux incarnes et des tableaux plus lisibles.
- Decision de pilotage : cette evolution reste une mise en gamme UX/UI et editoriale. Elle ne change ni les hypotheses business, ni les donnees, ni la regle de separation stricte entre offre reelle, simulation et production Stripe.
- Limites connues : le contenu reste encore majoritairement editorial et statique. La page raconte mieux la strategie et les arbitrages, mais elle ne devient pas pour autant un reporting business canonique automatise.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres nettoyage editorial et renforcement visuel de la page `Pilotage`.
- Prochaine etape recommandee : finir l'harmonisation executive sur `Tests tarifaires` et `Decisions`, ou commencer a brancher des donnees plus canoniques pour faire converger la narration vers un vrai reporting business.

### Mise a jour ciblee - Reorganisation pleine largeur de la page Pilotage du jeudi 6 aout 2026

- Statut : ` Partiel`
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

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/dashboard/admin/pilotage/economic-model/data.ts`, `docs/master-plan-planetls.md`
- Realite produit : la page `/dashboard/admin/pilotage` n'affiche plus un cadrage principal base sur `99 € / 149 €`. Les onglets `Marche & offre`, `Finance` et `Modele economique` convergent maintenant vers une gamme de travail `29 € HT / mois / 49 € HT / mois / sur devis`, plus proche de l'offre Stripe reelle a `29 €` et plus defendable en phase de validation terrain.
- Realite produit : la section `Finance` projette maintenant ses scenarios sur cette base `29 / 49 / sur devis`, avec commission retiree des scenarios d'entree et maintenue seulement comme hypothese secondaire sur le cas `sur devis`.
- Realite produit : le module `Modele economique` traite desormais la `strategie B - tarification par niveau` comme direction de test prioritaire. Les cartes d'offres simulees, les simulations et le backlog de tests tarifaires ont ete realignes sur `29 € / 49 € / sur devis`.
- Decision de pilotage : la commission n'est plus le message principal du cockpit business. Elle reste une option a reevaluer plus tard seulement si PlanetLS prouve une vraie valeur d'intermediation et une execution suffisamment robuste.
- Limites connues : cette convergence reste editoriale et strategique. Aucun editeur admin persistant, aucun moteur de calcul dynamique et aucune modification Stripe ou checkout n'ont ete ajoutes dans ce lot.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres realignement tarifaire des onglets `Marche`, `Finance` et `Modele economique`.
- Prochaine etape recommandee : utiliser cette version comme base d'entretien terrain, documenter les retours sur `29 / 49 / sur devis`, puis seulement decider si l'hybride ou la commission meritent de revenir dans la narration principale.

### Mise a jour ciblee - Tableau financier concret `qui paie quoi` du jeudi 6 aout 2026

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `docs/master-plan-planetls.md`
- Realite produit : l'onglet `Finance` de `/dashboard/admin/pilotage` ne se limite plus aux scenarios et a l'economie unitaire. Il expose maintenant un bloc concret `Qui paie quoi selon le parc gere` avec une lecture `90 jours`, trois jalons de validation et un tableau operable `profil / nombre de biens / accompagnement / prix / payeur naturel / lecture terrain`.
- Decision de pilotage : la grille tarifaire est desormais pensee comme outil d'entretien et de proposition commerciale immediate, pas seulement comme hypothese abstraite de business plan. Le cadrage `29 € / 49 € / sur devis` gagne ainsi une traduction plus exploitable face aux prospects.
- Limites connues : le tableau reste editorial et non persistant. Il ne calcule pas automatiquement les montants selon des donnees client reelles et ne remplace pas encore un futur configurateur d'offre.
- Verification : `npm run build` PASS le jeudi 6 aout 2026 apres ajout du tableau `Qui paie quoi selon le parc gere` dans l'onglet `Finance`.
- Prochaine etape recommandee : si les retours terrain convergent, transformer ensuite cette grille en script commercial ou en mini configurateur de proposition, sans toucher a Stripe tant que le modele n'est pas valide.

### Mise a jour ciblee - Consolidation desktop de la page Pilotage du vendredi 7 aout 2026

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la page `/dashboard/admin/pilotage` renforce sa lecture desktop sur ecran classique. Les grilles principales `highlights`, `summary`, `roadmap` et les cartes du nouveau bloc finance gagnent des largeurs minimales plus stables, des retours a la ligne plus robustes et une meilleure repartition des colonnes.
- Realite produit : la barre d'onglets principale adopte maintenant une lecture plus propre en desktop large avec cinq colonnes mieux reparties, au lieu d'un simple ruban horizontal qui pouvait paraitre serre ou desequilibre.
- Decision de pilotage : cette evolution privilegie la lisibilite executive et la stabilite du layout avant toute nouvelle profondeur metier. Elle cherche a reduire les debordements de texte et l'effet de cartes trop compressees sans changer la logique business.
- Limites connues : cette passe reste surtout CSS et composition. Elle ne constitue pas encore un audit responsive complet ni une revue pixel-perfect de toutes les tables ou de tous les contenus longs.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 apres consolidation desktop de la page `Pilotage`.
- Prochaine etape recommandee : faire ensuite une verification visuelle navigateur des ecrans desktop les plus denses `Finance`, `Modele economique`, `Controle` si tu veux pousser la qualite de finition avant d'autres ajouts.

### Mise a jour ciblee - Verification visuelle desktop de Finance et allegement du cockpit le vendredi 7 aout 2026

- Statut : ` Partiel`
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

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : une verification visuelle navigateur reelle a ete menee sur l'onglet `Modele economique` de `/dashboard/admin/pilotage` en desktop via Playwright local avec quick login administrateur. La capture a confirme l'absence de debordement majeur, mais aussi une densite encore trop forte dans plusieurs grilles internes a cause du cockpit lateral.
- Realite produit : les sections les plus chargees du module economique ont ete desserrees pour un ecran d'ordinateur classique. Les grilles `Strategies`, `Offres & profils`, `Simulations`, `Comparaison` et la rangee de reperes utilisent maintenant moins de colonnes par defaut, afin de privilegier la lisibilite des cartes et tableaux dans le layout reel.
- Decision de pilotage : sur ce type d'ecran, il vaut mieux afficher moins de cartes par ligne et garder des contenus lisibles plutot que chercher une densite maximaliste qui degrade la lecture executive.
- Limites connues : cette passe reste une optimisation de layout. Le contenu du module `Modele economique` demeure largement editorial et statique, et certaines sections pourraient encore evoluer si le cockpit lateral change de largeur plus tard.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 ; captures navigateur desktop locales `tmp-pilotage-modele-economique.png` puis `tmp-pilotage-modele-economique-after.png` relues pour confirmer l'amelioration du confort de lecture.
- Prochaine etape recommandee : si tu veux pousser encore la finition, faire ensuite une passe visuelle dediee sur `Controle detaille` ou simplifier encore les tableaux les plus longs du module economique avant d'ajouter de nouvelles briques.

### Mise a jour ciblee - Repli responsive du rail lateral et verification desktop de Controle detaille le vendredi 7 aout 2026

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/components/dashboard/DashboardLayout/DashboardLayout.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : une verification visuelle navigateur reelle a ete menee sur `/dashboard/admin/controle` en desktop, avec un focus sur le rail lateral `Pilotage admin / Profil / Activite recente / Notifications / Acces rapides`. La lecture etait correcte en grand desktop, mais trop tendue sur une largeur plus classique de type `1280 px`.
- Realite produit : le layout partage `DashboardLayout` adapte maintenant le rail lateral selon la largeur d'ecran. Sur les desktops intermediaires, la colonne de droite ne reste plus rigide : elle repasse sous le contenu principal dans une version compacte en deux colonnes, ce qui supprime le risque de chevauchement avec la zone centrale. Sur les ecrans plus larges, le rail lateral reste present a droite avec une largeur un peu mieux calibree.
- Decision de pilotage : ce comportement responsive devient la regle commune des cockpits admin denses. L'objectif n'est pas de forcer une symetrie de dashboard a tout prix, mais de proteger la lisibilite reelle des pages les plus lourdes selon la largeur disponible.
- Limites connues : cette passe traite surtout le layout partage et la collision potentielle du rail lateral. Elle ne revoit pas encore le contenu editorial de tous les panneaux secondaires ni la pertinence fonctionnelle de chaque carte du rail.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 ; captures navigateur desktop locales `tmp-controle-desktop-before.png`, `tmp-controle-desktop-1280-before.png` et `tmp-controle-desktop-1280-after.png` relues pour confirmer le repli propre du rail sur desktop intermediaire.
- Prochaine etape recommandee : si tu veux aller plus loin, on peut ensuite decider quels blocs du rail lateral doivent rester visibles partout, etre compacts, ou etre masques selon la page `Pilotage / Controle / Developpement`.

### Mise a jour ciblee - Verification desktop de Developpement sans correction supplementaire le vendredi 7 aout 2026

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `docs/master-plan-planetls.md`
- Realite produit : une verification visuelle navigateur reelle a ete menee sur `/dashboard/admin/developpement` en desktop intermediaire `1280 px` apres la mise a jour responsive du `DashboardLayout`. La page reste dense par nature, mais aucun chevauchement critique du rail lateral avec le contenu principal n'a ete observe dans cette configuration.
- Decision de pilotage : aucune correction CSS locale n'a ete ajoutee sur `Developpement` a ce stade. Le comportement partage du layout suffit actuellement et evite d'introduire des divergences inutiles entre les cockpits admin.
- Limites connues : la page `Developpement` reste tres longue et tres chargee editorialement. La prochaine amelioration pertinente serait davantage une simplification de contenu ou de navigation interne qu'un nouveau durcissement du layout.
- Verification : capture navigateur desktop locale `tmp-developpement-desktop-1280-before.png` relue le vendredi 7 aout 2026 pour confirmer la stabilite visuelle sans modification supplementaire.
- Prochaine etape recommandee : si l'on continue sur cette page, travailler ensuite la reduction de densite editoriale, la priorisation des sections ou un acces plus rapide aux blocs les plus utiles du `Master Plan`.

### Mise a jour ciblee - Lecture guidee du Master Plan dans Developpement le vendredi 7 aout 2026

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : l'onglet `Master Plan` de `/dashboard/admin/developpement` ne s'ouvre plus comme une pile exhaustive sans orientation. Une `lecture guidee` devient le mode par defaut : elle met en avant les sections actives `P0 / P1 / bloquees / en cours / partielles` et les grands reperes structurants, tout en laissant une option explicite `Tout afficher`.
- Realite produit : un bloc editorial compact `Lecture recommandee` oriente maintenant la page vers `quoi lire d'abord`, avec un rappel du mode courant et une courte liste des priorites les plus utiles a lire avant de descendre dans tout le document.
- Decision de pilotage : sur une page aussi dense, la priorite n'est plus de tout montrer immediatement mais de reduire la charge cognitive initiale. L'exhaustivite reste accessible, mais elle n'est plus imposee comme experience de premiere lecture.
- Limites connues : cette passe simplifie surtout l'entree dans le Master Plan. Elle ne reecrit pas encore le contenu source du document, qui reste long par nature, ni la structure de toutes les sous-sections.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 ; capture navigateur desktop locale `tmp-developpement-desktop-1280-after-guided.png` relue pour confirmer une entree de page plus digeste et plus guidee.
- Prochaine etape recommandee : si tu veux aller plus loin, la suite la plus utile serait soit une reduction editoriale du contenu du Master Plan lui-meme, soit des presets de lecture plus precis `blocages / P1 / decisions recentes / feuille de route`.

### Mise a jour ciblee - Presets de lecture et correction du texte corrompu dans Developpement le vendredi 7 aout 2026

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : le texte corrompu de la mise a jour `Pilotage Business du lundi 3 aout 2026` a ete corrige directement dans `docs/master-plan-planetls.md`. La section retrouve une lecture normale avec accents, statuts et contenu metier lisibles dans la page `Developpement`.
- Realite produit : l'onglet `Master Plan` expose maintenant trois presets de lecture rapides `Blocages`, `P1`, `Decisions recentes`. Ils appliquent directement les bons filtres et ouvrent une lecture plus ciblee sans demander a l'utilisateur de regler manuellement recherche, statut et priorite.
- Decision de pilotage : sur une page documentaire dense, les presets servent de raccourcis de lecture et reduisent la friction pour retrouver vite les zones vraiment utiles au quotidien.
- Limites connues : le preset `Decisions recentes` repose sur la structure documentaire actuelle `Mise a jour ciblee` / `Ajout du` du Master Plan. Si cette convention change fortement plus tard, il faudra reajuster la logique.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 ; verification navigateur locale des presets via `tmp-developpement-preset-blocages.png`, `tmp-developpement-preset-p1.png` et `tmp-developpement-preset-decisions.png`.
- Prochaine etape recommandee : si tu veux poursuivre, on peut ensuite ajouter des presets complementaires `Roadmap prete`, `Bugs critiques`, `Ajouts de la semaine`, ou transformer ces presets en puces persistantes dans l'URL.

### Mise a jour ciblee - Suppression du bottom nav admin en doublon et nouveaux presets de lecture le vendredi 7 aout 2026

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/components/dashboard/DashboardLayout/DashboardLayout.tsx`, `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : le `bottomNav` du `DashboardLayout` n'est plus rendu pour la persona `admin`. Le dock mobile d'administration dedie reste la seule navigation basse sur mobile, ce qui supprime le doublon avec `DashboardMobileExperience`.
- Realite produit : la vue `Developpement` propose maintenant deux presets de lecture supplementaires `Roadmap prete` et `Bugs critiques`, en plus de `Blocages`, `P1` et `Decisions recentes`. Les presets peuvent desormais pointer soit vers le `Master Plan`, soit vers les panneaux `Roadmap` et `Mission Control` selon le besoin de lecture.
- Decision de pilotage : la navigation mobile admin doit rester unique et lisible. De la meme maniere, les raccourcis de lecture doivent orienter vers le bon panneau au lieu de forcer une lecture exhaustive ou des manipulations de filtres inutiles.
- Limites connues : les presets `Roadmap prete` et `Bugs critiques` reposent encore sur les panneaux documentaires actuels, pas sur des URLs ou des ancres persistantes partageables.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 ; verification visuelle mobile locale `tmp-admin-mobile-dock-only.png` relue pour confirmer la disparition du `bottomNav` admin doublon, et capture `tmp-developpement-presets-extra.png` pour la presence des nouveaux presets.
- Prochaine etape recommandee : si tu veux pousser la logique, on peut ensuite rendre les presets partageables via l'URL ou memoriser le dernier preset choisi pour chaque administrateur.

### Mise a jour ciblee - Audit de l'existant Business Plan du vendredi 7 aout 2026

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `docs/business-plan-audit.md`, `docs/master-plan-planetls.md`
- Realite produit : un audit cible du module `Business Plan / Pilotage Business` a ete formalise dans `docs/business-plan-audit.md` a partir du code et des documents existants. Il confirme que la page `/dashboard/admin/pilotage` constitue bien la surface principale, mais que le coeur du business plan reste majoritairement editorial et code en dur dans `page.tsx`, `economic-model/data.ts`, `EconomicModelTab.tsx`, `validationData.ts` et `riskData.ts`.
- Realite produit : l'audit confirme aussi que plusieurs briques existent sans etre branchees dans la page principale `RiskRegister`, `LeanValidationDashboard`, `StrategicDecisionAssistant`, `PromptLibraryCenter`, `BusinessCollapsibleSection`, ainsi qu'un atelier `business-strategy` plus modulaire mais base sur `localStorage` et non relie a une source de verite admin.
- Decision de pilotage : la prochaine transformation du Business Plan ne doit pas commencer par une refonte UI. La priorite recommandee est de centraliser les donnees business `pricing, abonnements, risques, roadmap, KPI, decisions, personas business`, de clarifier partout la difference entre `donnee reelle / hypothese / simulation`, puis seulement de reconnecter les briques existantes les plus utiles.
- Limites connues : l'audit ne cree ni persistance admin, ni schema canonique, ni mise a jour automatique des benchmarks. Il documente l'etat reel, les doublons, les manques et l'ordre de priorite recommande sans encore transformer l'architecture.
- Verification : audit documentaire produit dans `docs/business-plan-audit.md` le vendredi 7 aout 2026 apres relecture des surfaces `pilotage`, `modele economique`, `validation marche`, `registre des risques`, `abonnement Concierge Pro` et des documents business associes.
- Prochaine etape recommandee : extraire d'abord les donnees editoriales du cockpit business vers un referentiel TypeScript centralise et versionnable, puis decider quelles briques existantes doivent etre rebranchees telles quelles ou refractorees.

### Mise a jour ciblee - Restructuration du centre de pilotage Business Plan le vendredi 7 aout 2026

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `src/app/dashboard/admin/pilotage/businessPlanData.ts`, `docs/master-plan-planetls.md`
- Realite produit : la page `/dashboard/admin/pilotage` n'est plus un simple enchainement d'onglets editoriaux `Vue d'ensemble / Marche / Finance / Modele economique / Execution`. Elle devient un `centre de pilotage strategique SaaS` organise par grands blocs `Synthese & vision / Marche & clients / Business model / Produit & IA / Pilotage & risques / Annexes`, avec sous-sections explicites, navigation secondaire par section, accordéons repliables, cartes synthetiques, badges de statut et barre de maturite globale du Business Plan.
- Realite produit : les 22 sections cibles du Business Plan `Synthese, Vision, Probleme marche, Solution, Proposition de valeur, Personas, Etude de marche, Concurrence, Business Model Canvas, Modele economique, Tarification, Go-To-Market, Acquisition, Roadmap, Strategie IA, KPI SaaS, Previsions financieres, SWOT, Risques, Hypotheses, Plan d'action, Annexes` sont maintenant structurees dans un referentiel TypeScript dedie `businessPlanData.ts`. Cette couche centralise statuts, ordre, evidence et une partie importante des donnees editoriales deja presentes `benchmark, pricing, TAM/SAM/SOM, roadmap, SWOT reconstruit, canaux d'acquisition, etc.` sans casser les modules existants.
- Realite produit : les briques detaillees deja disponibles sont conservees et rebranchees dans la nouvelle architecture au lieu d'etre supprimees : `EconomicModelTab` pour le modele economique, `RiskRegister` pour le registre des risques, `LeanValidationDashboard` pour les hypotheses et la validation marche, `StrategicDecisionAssistant` dans les annexes. La page garde aussi sa compatibilite avec les donnees live `api/admin/overview`, `api/admin/operations` et `api/kpis/overview` pour afficher traction, alertes et KPI SaaS reels.
- Decision de pilotage : cette version privilegie une `restructuration non destructive` et une meilleure lisibilite executive, sans transformer encore le cockpit en back-office d'edition persistant. Les contenus partiels ou fragiles sont explicites via les statuts `A completer / A valider / Valide / A actualiser`, ce qui aligne mieux l'UI sur l'audit realise juste avant.
- Limites connues : le referentiel `businessPlanData.ts` centralise surtout des donnees editoriales front et non une persistence admin canonique. Plusieurs sections restent volontairement `partielles` ou `a completer` `SWOT, acquisition, strategie IA, previsions financieres, etude de marche`, car aucune donnee reelle supplementaire n'a ete inventee. Le `PromptLibraryCenter` n'est toujours pas branche dans la page principale.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 apres restructuration complete de `/dashboard/admin/pilotage`.
- Prochaine etape recommandee : poursuivre par l'extraction des derniers blocs editoriaux encore locaux vers le referentiel central, puis choisir si une future phase doit ajouter une persistence admin pour les hypotheses, decisions, KPI business et mises a jour de benchmark.

### Mise a jour ciblee - Centralisation du modele de donnees Business Plan le vendredi 7 aout 2026

- Statut : ` Partiel`
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

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/business-plan-reference.ts`, `src/app/dashboard/admin/pilotage/BusinessModelCanvas.tsx`, `src/app/dashboard/admin/pilotage/BusinessModelCanvas.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la section `Business Model Canvas` de `/dashboard/admin/pilotage` n'est plus une simple grille statique. Elle devient un module interactif avec `vue synthetique / vue detaillee`, score de completude, compte d'hypotheses `validees / a valider`, details repliables par bloc et liens directs vers les autres sections du Business Plan.
- Realite produit : les 9 blocs canoniques du Canvas `Segments clients, Proposition de valeur, Canaux, Relations clients, Sources de revenus, Ressources cles, Activites cles, Partenaires cles, Structure de couts` sont maintenant documentes dans le referentiel central `business-plan-reference.ts` avec synthese courte, details, statut, hypotheses associees, points restant a valider et sections connexes.
- Decision de pilotage : aucune donnee commerciale nouvelle n'a ete inventee. Quand l'information reste incomplete, le Canvas l'affiche explicitement comme `A definir` ou `Hypothese a valider`, ce qui protege la lisibilite executive sans sur-promettre un modele economique non prouve.
- Limites connues : le score de completude reste un indicateur de structuration documentaire et non une mesure de validation marche. Plusieurs hypotheses du Canvas demeurent volontairement non validees tant qu'elles ne sont pas soutenues par des cohortes, des pilotes ou des donnees business observees.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 apres integration du Canvas interactif dans `/dashboard/admin/pilotage`.
- Prochaine etape recommandee : si besoin, enrichir ensuite le Canvas avec l'affichage visible des sources, dates et niveaux de confiance par bloc, puis eventuellement connecter certaines validations a de vrais KPI business.

### Mise a jour ciblee - Construction de la section Marche & Concurrence du vendredi 7 aout 2026

- Statut : ` Partiel`
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

- Statut : ` Partiel`
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

- Statut : ` Partiel`
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

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/pilotage/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : l'arrivee sur `/dashboard/admin/pilotage` ne se limite plus a une hero editoriale puis a des onglets. La page expose maintenant, avant la navigation detaillee, un vrai `cockpit strategique` de premiere lecture avec cinq scores `maturite, Product-Market Fit, financier, marche, produit`, un bloc `KPI principaux`, une zone `A regarder en premier` et une lecture immediate des `prochaines decisions`.
- Realite produit : les signaux de tete de page sont derives de l'existant et non recrees en parallele. Le cockpit combine les statuts des sections du Business Plan, les KPI reels disponibles via `/api/kpis/overview`, les risques critiques, les hypotheses prioritaires, le pipeline commercial non transforme, les missions non facturees et l'anciennete des donnees marche pour faire remonter automatiquement les sujets a surveiller.
- Realite produit : la section `Synthese` du Business Plan a ete renforcee dans la meme logique. Elle affiche maintenant `Top 5 priorites`, `Top 5 risques`, `Top 5 hypotheses`, `Prochaines decisions` et `Dernieres modifications`, ce qui transforme la page en outil de pilotage plus immediat sans supprimer les modules detailles deja presents.
- Decision de pilotage : les KPI business encore non instrumentes `MRR reel, ARR reel, clients payants reels, conversion payante reelle, churn reel, CAC reel, LTV reelle` restent affiches honnêtement comme `A mesurer`, avec contexte issu du modele financier central ou des signaux produit existants. L'objectif est de montrer la verite actuelle plutot que de maquiller l'absence de mesure par des chiffres speculatifs.
- Limites connues : certains scores restent des heuristiques de pilotage derivees des statuts documentaires et des KPI disponibles, pas des scores scientifiques. La zone `Dernieres modifications` repose sur les dates de mise a jour du referentiel business local et non sur un historique persistant multi-auteur.
- Verification : `npm run build` PASS le vendredi 7 aout 2026 apres integration du cockpit strategique dans `/dashboard/admin/pilotage`.
- Prochaine etape recommandee : si besoin, brancher ensuite une vraie source de verite pour les KPI business payants `MRR, clients payants, churn, CAC, LTV`, puis ajuster les scores pour qu'ils reposent davantage sur des mesures observees que sur la maturite documentaire.

### Mise a jour ciblee - Processus Business Impact Check du vendredi 7 aout 2026

- Statut : ` Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `docs/business-plan-maintenance.md`, `docs/business-plan-data-model.md`, `docs/master-plan-planetls.md`
- Realite produit : PlanetLS dispose maintenant d'un processus documentaire explicite de maintenance du Business Plan via `docs/business-plan-maintenance.md`. Le mecanisme `Business Impact Check` formalise les declencheurs, les zones du Business Plan a reviser, les actions autorisees sans validation humaine et les actions interdites `ne pas modifier automatiquement hypothese, prix, cout, chiffre de marche ou KPI strategique`.
- Realite produit : le process couvre explicitement les evolutions critiques `nouvelle fonctionnalite, suppression, changement d'abonnement, changement de tarif, nouveau persona, nouvelle source de revenu, nouvelle integration IA, nouveau service marketplace, changement d'architecture significatif, nouveau cout recurrent` et impose de verifier les impacts potentiels sur `proposition de valeur, roadmap, modele economique, tarification, couts, revenus, marche, concurrence, risques, KPI`.
- Realite produit : la gouvernance du referentiel central est renforcee. `docs/business-plan-data-model.md` reference maintenant le `Business Impact Check` comme regle de maintenance, et le `Master Plan` impose ce controle pour toute evolution importante susceptible d'affecter le Business Plan.
- Decision de pilotage : le systeme choisi reste volontairement simple et robuste. Il repose d'abord sur une discipline documentaire et un marquage `A actualiser / A valider` plutot que sur une automatisation risquee qui pourrait modifier silencieusement des donnees strategiques.
- Limites connues : aucun moteur automatique ne scanne encore les diffs git ou les fichiers modifies pour produire seul un impact business. Le controle reste humain, guide et traçable.
- Verification : documentation relue et integree au referentiel de pilotage le vendredi 7 aout 2026 ; aucun build non indispensable n'a ete relance car le lot est purement documentaire.
- Prochaine etape recommandee : si besoin, ajouter plus tard un template reutilisable dans le cockpit admin ou dans le journal de developpement pour saisir un `Business Impact Check` directement depuis l'interface.

### Mise a jour ciblee - Correction d'encodage et uniformisation des hero cards du jeudi 13 aout 2026

- Statut : `🟠 Partiel`
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

- Statut : `🟡 En cours`
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

- Statut : `🟡 En cours`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la page `/dashboard/admin/developpement` n'est plus pensee comme un espace documentaire a onglets a parcourir longuement avant d'agir. Elle devient un cockpit court centre sur `ou j'en suis`, `prochaine action`, `blocages`, `en cours`, `pret a faire`, `termine` et `verifications rapides`.
- Realite produit : les informations longues, redondantes ou trop secondaires ne structurent plus la lecture principale. Le tableau d'action court reste present pour la reprise, mais la priorite est donnee a l'execution immediate plutot qu'a la consultation de couches multiples `Master Plan, Mission Control, Roadmap, Memoire, Journal`.
- Decision de pilotage : sur cette page, la complexite documentaire doit s'effacer derriere la decision quotidienne. La surface sert d'abord a reprendre le projet vite et proprement, pas a relire tout l'historique.
- Limites connues : le lot simplifie fortement l'interface visible, mais conserve encore du code historique non affiche dans le composant. Un nettoyage technique plus profond pourra venir ensuite si cette direction UX est validee.
- Contradictions detectees : l'ancienne page cherchait a etre a la fois cockpit de reprise, lecteur du Master Plan, journal, memoire technique et roadmap interactive. Cette polyvalence rendait la lecture trop lourde pour l'usage reel demande.
- Verification : `npm run build` a relancer apres simplification finale de la page `Developpement`.
- Prochaine etape recommandee : si ce format te convient, faire ensuite un lot de nettoyage du code mort et des imports/helpers devenus inutiles pour aligner la structure technique sur la nouvelle experience courte.

### Mise a jour ciblee - Tableau D. Priorites pour la page Developpement du jeudi 13 aout 2026

- Statut : `🟡 En cours`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/developpement/MasterPlanViewer.tsx`, `src/app/dashboard/admin/developpement/page.module.scss`, `docs/master-plan-planetls.md`
- Realite produit : la page `/dashboard/admin/developpement` reprend maintenant explicitement une section `D. Priorites` en tableaux separes `P0 / P1 / P2 / P3`, avec les colonnes `ID, Titre, Categorie, Difficulté, Impact, Zones concernees`, dans un format proche de l'audit externe demande.
- Realite produit : cette presentation remplace le tableau d'action court trop minimal et sert de repere plus direct pour arbitrer `critique`, `avant lancement`, `amelioration importante` et `evolution future` sans replonger dans une page trop longue.
- Realite produit : le tableau `D. Priorites` agrege maintenant aussi les priorites dispersees du Master Plan qui n'etaient pas dans la matrice initiale, avec dedoublonnage des sujets recouvrants comme le cockpit entrepreneurial, pour garder une vue complete mais encore concise.
- Realite produit : la matrice `P2` integre maintenant explicitement `P2-016 - Normaliser les reliquats ASCII/labels historiques du depot` pour transformer le reliquat d'hygiene francaise du code en vraie action de pilotage, au lieu de le laisser seulement en limite connue.
- Decision de pilotage : la page Developpement garde une lecture courte en tete `ou j'en suis, prochaine action, bloque, en cours, pret a faire, termine`, puis utilise le tableau `D. Priorites` comme reference principale de travail.
- Limites connues : certaines lignes du tableau restent du cadrage de pilotage et non des tickets relies a une persistance de statut editable. La priorisation doit donc rester relue regulierement contre le code et le Master Plan.
- Verification : `npm run build` PASS apres integration finale du tableau `D. Priorites`.
- Prochaine etape recommandee : si besoin, relier ensuite chaque ligne du tableau a une vue detaillee ou a un ticket source, sans recharger la page principale.

### Mise a jour ciblee - Lecture visuelle business pour la page Pilotage du jeudi 13 aout 2026

- Statut : `🟠 Partiel`
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

- Statut : `🟡 En cours`
- Priorite : `P1 Prioritaire`
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

- Statut : `🟠 Partiel`
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

### Mise a jour ciblee - Page admin Modele financier du jeudi 13 aout 2026

- Statut : `🟠 Partiel`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/modele-financier/page.tsx`, `src/app/dashboard/admin/modele-financier/page.module.scss`, `src/app/dashboard/admin/pilotage/economic-model/sharedFinancialReference.ts`, `src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx`, `src/app/components/dashboard/Sidebar/sidebarconfig.tsx`, `src/app/dashboard/admin/pilotage/page.tsx`, `src/app/dashboard/admin/personas/page.tsx`, `src/app/dashboard/admin/controle/page.tsx`, `src/app/dashboard/admin/decisions-architecture/DecisionCenterPage.tsx`, `docs/master-plan-planetls.md`
- Realite produit : l'espace admin dispose maintenant d'une vraie page canonique `/dashboard/admin/modele-financier` exposee dans la navigation laterale et dans plusieurs navigations internes du cockpit admin. Elle consolide le benchmark tarifaire 2026, la grille de pricing cible PlanetLS, la lecture `willingness to pay`, les couts variables et les triggers de passage au payant dans une seule surface lisible.
- Realite produit : la page n'est plus isolee du socle pricing existant. Un referentiel partage `sharedFinancialReference.ts` alimente maintenant a la fois `/dashboard/admin/modele-financier` et `EconomicModelTab`, ce qui relie la lecture business aux vraies briques `strategie prioritaire, offre protegee, scenario directeur, journal de decisions`.
- Realite produit : la page ne branche toujours pas de simulateur editable persistant ni de donnees financieres observees temps reel, mais elle n'est plus une simple synthese de texte decoree. Elle sert de hub de lecture pour la direction produit/business avec une premiere connexion aux hypotheses et garde-fous deja presents dans `economic-model`.
- Decision de pilotage : `modele financier` devient une entree admin distincte plutot qu'un simple sous-bloc du `pilotage business`. Cela clarifie le parcours admin entre `vision/benchmark`, `pricing & unit economics`, `personas`, `controle detaille` et `developpement`.
- Decision de pilotage : la source de verite du cadrage financier doit etre mutualisee plutot que recopier des constantes dans plusieurs pages admin. Le referentiel partage devient la couche intermediaire entre lecture strategique et atelier de simulation.
- Limites connues : les chiffres affiches restent des hypotheses et une synthese de benchmark, pas des valeurs branchees sur Stripe, la comptabilite ou un MRR reel. L'offre de production existante et les simulations avancees du module economique restent ailleurs et ne sont pas encore reunies dans une meme gouvernance outillee.
- Contradictions detectees : le cockpit admin disposait deja de briques `business strategy` et `economic-model`, mais sans point d'entree explicite `modele financier` dans la navigation principale ni referentiel partage entre lecture strategique et simulation. Le lot corrige la lisibilite et une premiere partie de cette duplication, sans fusionner encore tous les objets financiers avancÃ©s.
- Verification : `npx eslint src/app/dashboard/admin/modele-financier/page.tsx src/app/dashboard/admin/pilotage/economic-model/sharedFinancialReference.ts src/app/dashboard/admin/pilotage/economic-model/EconomicModelTab.tsx` PASS. `npm run check:encoding` PASS. `npm test` PASS `241/241` le jeudi 13 aout 2026 apres realignement des contrats UTF-8. `npm run build` PASS le jeudi 13 aout 2026 apres liberation du verrou `.next`.
- Prochaine etape recommandee : etendre ensuite le meme socle partage aux autres briques finance `PricingRevenueSimulator`, `FinancialForecastModel` et, si besoin, ajouter une persistance admin des hypotheses pour sortir d'un referentiel purement code.

### Mise a jour ciblee - Revalidation finale du lot admin du jeudi 13 aout 2026

- Statut : `✅ Terminé`
- Priorite : `P1 Prioritaire`
- Perimetre mis a jour : `src/app/dashboard/admin/page.tsx`, `src/tests/create-logement-helpers.test.mts`, `src/tests/developer-log.test.mts`, `src/tests/kpis-overview-contract.test.mts`, `docs/master-plan-planetls.md`
- Realite produit : le tableau `D. Priorites` reste coherent avec les sujets remontes pendant la journee, notamment la couverture `P0/P1` deja visible dans la page `Developpement` et l'action `P2-016` sur les reliquats ASCII / labels historiques.
- Realite produit : la contradiction de verification ouverte en fin de lot est maintenant levee. Les contrats de tests impactes par la francisation ont ete realignes, et le libelle admin visible `Mode dégradé` est de nouveau coherent entre interface et tests.
- Decision de pilotage : les lots du jeudi 13 aout 2026 ne doivent plus etre presentes comme simplement "verifies plus tot dans la mission" ou "bloques par lock" alors qu'une reverification finale complete existe. La preuve de validation finale devient la reference documentaire.
- Contradictions detectees : aucune contradiction ouverte restante sur l'etat de verification du lot admin du 13 aout 2026 apres relance complete des controles locaux.
- Verification : `npm test` PASS `241/241`, `npm run check:encoding` PASS, `npm run build` PASS le jeudi 13 aout 2026.
- Prochaine etape recommandee : reprendre ensuite la priorisation produit sur le contenu des lignes `P0/P1/P2` plutot que sur l'hygiene de verification de ce lot.
