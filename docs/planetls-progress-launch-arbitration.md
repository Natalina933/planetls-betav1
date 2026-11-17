# PlanetLS — Dossier d'arbitrage du lancement — PROGRESS-02B2

> **État courant — PROGRESS-02B3 : neuf décisions métier confirmées par la responsable du projet le 16 novembre 2026.** Le §11 consigne les décisions et leurs conséquences actuelles. Les recommandations et options des §3–10 sont conservées comme historique 02B2 ; elles ne constituent plus des décisions principales en attente. Les détails techniques et les validations restent ouverts. Aucun GO pour des utilisateurs réels, aucun changement de code ou de Master Plan, aucune intégration 02C.

## 1. Objet, état local et statut des décisions

Préparation documentaire du 16 novembre 2026. Branche `feature/audit-master-plan-planetls`, HEAD `60e50c8b06f59e72d368e604eba1e6449b428289`. Le code observé inclut des travaux locaux non commités : le HEAD ne suffit pas à identifier la version examinée. État initial : neuf fichiers suivis modifiés et dix-neuf entrées non suivies, dont le référentiel 02B et un dossier de helpers ; vingt-huit fichiers locaux au total. Empreinte agrégée initiale : `540ca6a4f2a776f3d3457c2e4dc5cb6c911da1ff02ae4e4c7713ad84ce72df9d`.

Le [référentiel PROGRESS-02B](planetls-progress-functional-reference.md) a été lu intégralement. Ses neuf formulations ARB-01 à ARB-09 sont reproduites sans reformulation dans les titres du §4. Aucun document équivalent de lancement n'a été retrouvé dans `docs/`. Les rapports conversationnels 02A et DIAG-PROGRESS-01 apportent le contexte, pas une preuve d'exécution actuelle.

**DÉJÀ DOCUMENTÉE** = règle ou décision enregistrée dans les sources, avec sa portée et ses limites ; ce marquage ne constitue pas une revalidation opérationnelle. **PROPOSÉE** = recommandation de ce dossier. **EN ATTENTE D'APPROBATION** = choix de produit qui doit recevoir une validation explicite. Une contrainte du code n'est pas, à elle seule, une décision approuvée de lancement.

Seul ce dossier est ajouté. Le Master Plan, le référentiel 02B, les statuts, priorités, fonctionnalités, API et indicateurs restent inchangés. Aucun test applicatif, navigateur, Docker, migration, accès Supabase, authentification ou service externe exécuté. Aucune décision nouvelle de lancement approuvée, aucun GO de mise en service. PROGRESS-02C non engagé.

## 2. Sources et décisions existantes à ne pas rouvrir

Les IDs `PFC-*` renvoient aux 52 capacités proposées du référentiel ; ses dossiers S01–S16 et preuves historiques H01–H04 restent consultables. Les liens de code ci-dessous sont des observations statiques, pas des preuves de fonctionnement réel.

| Preuve | Source vérifiable | Règle existante ou constat et portée |
|---|---|---|
| E01 | [Référentiel, arbitrages](planetls-progress-functional-reference.md#L312) | Neuf questions de lancement encore ouvertes ; 52 capacités, 71 parcours parents ; critères proposés non testés |
| E02 | [Master Plan, CONCIERGE-02](master-plan-planetls.md#L101), [publication](../src/app/lib/conciergePublication.ts#L20) | **DÉJÀ DOCUMENTÉE** : publication concierge calculée depuis rôle/statut actif ou défaut compatible, identité, prestation reconnue et zone qualifiée. Photo, description ou tarif ne sont pas obligatoires ; prestation sur devis possible. Ce minimum ne vaut pas certification professionnelle |
| E03 | [Demande serveur](../src/app/api/service-requests/route.ts#L1459), [sélection owner](../src/app/dashboard/owner/concierges/OwnerConciergesPageClient.tsx#L897) | **CONSTAT DE CODE** : destinataires qualifiés comme concierges ; sélection provider ignorée dans le flux owner. Recherche artisan existante distincte d'une sollicitation commerciale complète |
| E04 | [Master Plan, CONCIERGE-03A](master-plan-planetls.md#L87), [garde d'envoi](../src/features/concierge-commercial/server/quoteSendGuard.ts#L23) | **DÉJÀ DOCUMENTÉE** : brouillon et préparation des devis liés à une invitation, un gagnant par demande, prix explicite ou gratuité confirmée, interdiction d'émission owner. Contrats de transitions à conserver ; une facture ne doit pas être inventée depuis un budget indicatif |
| E05 | [Master Plan, CONCIERGE-03B](master-plan-planetls.md#L70), [sélection de collaboration](../src/app/api/service-requests/[id]/select/route.ts#L148) | **DÉJÀ DOCUMENTÉE** : collaboration continue explicite limitée aux prestations choisies, sans dates fictives ni mission/facture/contrat signé artificiels. Activation opérationnelle distincte du contrat juridique ; anciennes demandes durables sans marqueur conservent leur circuit contractuel |
| E06 | [Réservation owner](../src/app/api/owner/reservations/route.ts#L144), [Master Plan, limites Personas](master-plan-planetls.md#L1342) | **CONSTAT DE CODE ET LIMITE DOCUMENTÉE** : création owner avec concierge, collaboration et logement cohérents. Les modes autonomes/délégations cibles ne sont pas cinq workflows livrés. Aucune décision définitive d'exclure l'autonomie du lancement n'en est déduite |
| E07 | [Master Plan, CONCIERGE-03C](master-plan-planetls.md#L56), [préavis serveur](../src/app/api/_shared/collaborationTermination.ts#L23) | **DÉJÀ DOCUMENTÉE** : défaut de 30 jours calendaires pour collaboration continue admissible ; délai différent seulement dans une version de conditions bilatéralement acceptée ; calcul UTC, demandeur/instant serveur, répétition sans prolongement, historique préservé. Le traitement définitif des interventions engagées reste ouvert. 03C remplace l'ancienne limite 03B sur la seule prise d'effet |
| E08 | [Master Plan, sécurité C1D](master-plan-planetls.md#L13), [lecture des interventions liées](../src/app/api/missions/[id]/provider-interventions/route.ts#L52), [création affectée](../src/app/api/missions/[id]/provider-interventions/route.ts#L119), [édition provider](../src/app/api/provider/interventions/[id]/route.ts#L38) | **RISQUE OUVERT DOCUMENTÉ** : liaison par réservation et/ou `metadata.mission_id`, affectation provider à sécuriser. Une intervention créée ne démontre ni accord commercial ni accès limité à la bonne mission. Les tests PostgreSQL synthétiques C1D ne ferment pas ce chantier |
| E09 | [Facture provider](../src/app/api/provider/interventions/[id]/invoice/route.ts#L10), [clients provider](../src/app/api/provider/clients/route.ts#L45), [interventions libres](../src/app/api/provider/interventions/route.ts#L52), [Master Plan, Karim](master-plan-planetls.md#L1347) | **CONSTAT/LIMITE DOCUMENTÉE** : clients et interventions sans séjour possibles ; facture après intervention terminée, budget positif et colonnes commerciales partagées. Payeur et versement final au prestataire restent à clarifier. Paiement owner ne prouve pas versement artisan |
| E10 | [Master Plan, CONCIERGE-03C](master-plan-planetls.md#L62), [messages](../src/app/api/messages/conversations/route.ts#L80), [messages provider](../src/app/api/provider/messages/route.ts#L32) | **DÉJÀ DOCUMENTÉE / CONSTAT** : événement de résiliation et consultation ne garantissent pas un email ; conversations provider et owner/concierge utilisent des tables distinctes. Aucun canal externe universel ni interopérabilité des deux messageries prouvé |
| E11 | [Connexion](../src/app/login/LoginPage.tsx#L197), [Auth.js](../src/server/auth/authOptions.ts#L254), [gardes](../src/server/auth/roleGuards.ts#L14), [référentiel AUTH-04](planetls-progress-functional-reference.md#L181) | **CONSTAT** : inscription/Credentials, configuration OAuth et gardes présents ; récupération complète non établie. Les gardes ne prouvent pas uniformément une revalidation des droits actuels pour tous les rôles ; matrice et sessions à vérifier |
| E12 | [Master Plan, extensions Personas](master-plan-planetls.md#L1353), [stocks estimés](../src/app/dashboard/concierge/stocks/stocksHelpers.ts#L30), [tournées](../src/app/api/concierge/optimized-routes/route.ts#L138) | **DÉJÀ DOCUMENTÉE / CONSTAT** : tournées et vocal hors prérequis MVP dans la lecture Personas, tout en restant historiquement P2 ; extensions PWA/assistant/images déco P4. Stocks projetés distincts d'un stock réel. Ce dossier ne change ni ces priorités ni les classifications 02B |

Les résultats historiques du 25 août, 26 octobre et 12 novembre restent ceux rapportés dans le Master Plan. Aucun résultat n'est rejoué ni promu en validation de la version actuelle. Le choix d'un périmètre ne ferme jamais une anomalie de sécurité encore accessible.

## 3. Synthèse historique 02B2 — propositions remplacées par les décisions du §11

Recommandation générale : viser un service cohérent reliant les trois catégories d'acteurs, avec des parcours simples mais complets et des preuves actuelles. **Ne pas annoncer un parcours commercial artisan livré sur la seule présence d'une recherche et d'une API d'intervention.** Un lancement owner/concierge plus restreint reste une option produit, pas une décision acquise ; il exige une promesse publique cohérente et une maîtrise des routes provider toujours accessibles.

| Arbitrage | Classe de recommandation | PROPOSÉE — recommandation synthétique | Condition ou approbation requise |
|---|---|---|---|
| ARB-01 | D — Décision métier nécessaire | Retenir comme cible un parcours artisan ponctuel complet, sans lui imposer un contrat durable | Confirmer portée trois acteurs, demande/accord/payeur ; sécurité provider bloquante |
| ARB-02 | B — Socle simplifié acceptable | Réservation avec concierge principal et collaboration cohérente ; autonomie complète différée si ce choix est approuvé | Ne pas présenter les modes autonomes cibles comme livrés |
| ARB-03 | B — Socle simplifié acceptable | Procédure d'accès externe encadrée possible, au lieu d'imposer d'emblée un coffre/cycle numérique complet | Responsables, preuve de remise, révocation, incident et confidentialité approuvés et testés |
| ARB-04 | D — Décision métier nécessaire | Définir un couple émetteur/payeur et un circuit de facture/règlement par parcours | Pas de paiement, récurrence ou reversement supposés ; rapprochement et reprises prouvés |
| ARB-05 | B — Socle simplifié acceptable | Suivi applicatif et messages ; prouver les emails essentiels retenus ; push/SMS généralisés reportables | Acceptation d'une commande ne peut dépendre d'un canal non vérifié |
| ARB-06 | A — Indispensable au lancement | Authentification, droits actuels et récupération sécurisée réellement utilisables | Aucune récupération manuelle non authentifiée ni accès élargi de convenance |
| ARB-07 | A — Indispensable au lancement | Organiser/exécuter/clôturer les prestations et appliquer les règles de fin existantes | Arbitrer les interventions engagées et prouver intégrité/concurrence/RLS |
| ARB-08 | A — Indispensable au lancement | Approuver une base versionnée de capacités, consommateurs, critères et exclusions | Base non approuvée = Non évalué, pas taux de lancement |
| ARB-09 | C — Reportable | Garder outils avancés en V1.1/Futur, sans retirer le planning et les preuves élémentaires | Valider calendrier ; ne pas changer P2/P4 officiels |

A = indispensable ; B = simplification cohérente soumise à conditions ; C = report possible ; D = décision produit indispensable. Les classes de ce tableau sont des recommandations, pas les codes S/A/F du référentiel ni des priorités Master Plan.

## 4. Les neuf arbitrages exacts et leur analyse

### ARB-01 — Lancement concierge/owner seul ou sollicitation commerciale artisan incluse ?

**Statut courant : décision métier confirmée — 16 novembre 2026 ; voir §11.1.** Analyse et recommandation ci-dessous conservées comme historique 02B2, pas comme statut actuel d'approbation.

- **Problème, espaces et parcours :** choisir la promesse de lancement pour les trois espaces ; distinguer recherche, sollicitation, réponse, accord, affectation et exécution. Concerne owner→artisan et concierge→artisan autant que le socle owner→concierge.
- **Déjà documenté :** E03 et E08 établissent une rupture technique, pas une approbation d'exclure les artisans. E09 conserve l'incertitude sur acquisition/payeur/règlement. Aucune décision de lancement à trois rôles complet retrouvée.
- **Présent / manquant :** recherche multi-rôle, profil, clients, devis, interventions et comptes rendus présents ; sélection commerciale provider ignorée côté owner, contrôle de destinataire concierge dans l'API. L'accord explicite et le raccordement commercial artisan de bout en bout ne sont pas démontrés.
- **Options :** (1) périmètre owner/concierge explicitement limité, artisan non promis commercialement ; (2) parcours artisan ponctuel complet ; (3) ajouter aussi les collaborations artisan durables. L'option 3 n'est ni nécessairement livrée ni justifiée pour le premier lancement.
- **Dépendances / risques fonctionnels :** PFC-RECH-01/02/03, PFC-COL-01, PFC-DEV-01/02/03, PFC-MIS-03/04/05, PFC-FAC-01/02. Trouver un artisan sans pouvoir le solliciter crée une impasse ; une affectation sans accord peut produire une intervention inattendue ou une facture contestée.
- **Sécurité/confidentialité :** PFC-AUTH-03, tiers et métadonnées de mission, données du propriétaire et du client ; ne jamais déduire les droits d'une simple connaissance d'UUID ou d'un séjour partagé. G02/G03 bloquants.
- **Conséquence et recommandation D — PROPOSÉE :** option 2 comme cible cohérente avec PlanetLS, seulement après conception approuvée et validation complète. Si option 1 choisie, préciser le périmètre utilisateur et traiter les chemins provider exposés ; aucun masquage ou retrait appliqué ici.
- **EN ATTENTE D'APPROBATION :** option de lancement, émetteur de sollicitation, mécanisme d'accord, destinataire du devis, payeur et périmètre de données. Aucun nouveau contrat durable artisan imposé.

### ARB-02 — Séjour owner autonome ou concierge principal requis ?

**Statut courant : décision métier confirmée — 16 novembre 2026 ; voir §11.2.** Analyse et recommandation ci-dessous conservées comme historique 02B2, pas comme statut actuel d'approbation.

- **Problème, espaces et parcours :** définir qui porte le séjour et les responsabilités opérationnelles pour owner, concierge et artisan affecté ; concerne création de réservation, interventions et accès.
- **Déjà documenté :** E06 impose actuellement concierge principal/collaboration/logement ; c'est une contrainte existante, pas un arbitrage définitif contre l'autonomie. Les différents modes d'accompagnement sont des cibles documentaires.
- **Présent / manquant :** réservation owner avec références vérifiées, vues séjour/planning et besoins présents ; autonomie complète et délégations multiples non prouvées. Une création autonome ne se réduit pas à rendre `concierge_profile_id` facultatif.
- **Options :** conserver le modèle actuel au lancement ; ou livrer un mode autonome complet avec responsabilités/permissions/émetteurs de facture définis. Remplacement et délégation partielle constituent d'autres variantes à ne pas déclarer implicitement livrées.
- **Dépendances / risques fonctionnels :** PFC-LOG-01, PFC-SEJ-01/02, PFC-MIS-01/02/03, PFC-COL-02/03. Sans responsable, arrivée, ménage ou incident peuvent rester sans prise en charge ; risque de liens réservation/mission incohérents.
- **Sécurité/confidentialité :** ne pas élargir l'accès d'un artisan à tout le séjour ni réutiliser un concierge absent pour contourner une contrainte. G02/G03/G05.
- **Conséquence et recommandation B — PROPOSÉE :** commencer par le modèle principal existant si le produit l'approuve, avec erreurs et explication utilisateur claires. Conserver l'autonomie au référentiel, hors promesse de lancement tant qu'elle n'est pas complète.
- **EN ATTENTE D'APPROBATION :** mode initial exact, acteur responsable de chaque prestation, modalités de remplacement et accès. Pas de changement de schéma ou de règle dans 02B2.

### ARB-03 — Clés numériques/physiques indispensables ou procédure externe acceptable au lancement ?

**Statut courant : décision métier confirmée — 16 novembre 2026 ; voir §11.3.** Analyse et recommandation ci-dessous conservées comme historique 02B2, pas comme statut actuel d'approbation.

- **Problème, espaces et parcours :** garantir l'accès effectif et sa révocation pour owner, concierge et intervenant, sans divulguer codes/adresses ; concerne arrivée, remise, intervention et fin de collaboration.
- **Déjà documenté :** PFC-CON-05 reste proposé S et non commencé pour un cycle complet ; le champ de remise existant ne prouve pas inventaire/détenteur/restitution. Aucune procédure externe de lancement approuvée retrouvée.
- **Présent / manquant :** consignes et références ponctuelles d'accès, mais pas de cycle canonique démontré de remise, restitution, incident et révocation.
- **Options :** cycle numérique complet avant lancement ; ou procédure externe contrôlée avec responsable identifié, preuve de remise/restitution, retrait des accès et circuit d'incident. Un simple échange de code par messagerie n'est pas une procédure suffisante.
- **Dépendances / risques fonctionnels :** PFC-CON-05, PFC-LOG-01, PFC-COL-03/04 et PFC-MIS-01 ; impossibilité d'entrer, clé perdue ou accès restant actif après fin. La procédure doit rester utilisable pendant une panne applicative.
- **Sécurité/confidentialité :** accès au strict besoin, canal autorisé pour les secrets, révocation et traçabilité ; aucune clé ou code exposé dans le catalogue public ou les preuves de ce dossier. G08/G09 bloquants.
- **Conséquence et recommandation B — PROPOSÉE :** procédure externe possible seulement après approbation et exercice réel. Le produit doit indiquer que le cycle numérique complet n'est pas fourni ; PFC-CON-05 ne devient jamais Implémenté par cette substitution.
- **EN ATTENTE D'APPROBATION :** procédure, responsable, preuve et délai opérationnel à définir, traitement d'incident et révocation. Sans alternative validée, le cycle nécessaire reste une condition préalable au lancement.

### ARB-04 — Quels paiements, factures et clients hors plateforme au lancement ?

**Statut courant : décision métier confirmée — 16 novembre 2026 ; voir §11.4.** Analyse et recommandation ci-dessous conservées comme historique 02B2, pas comme statut actuel d'approbation.

- **Problème, espaces et parcours :** fixer qui émet, reçoit et règle pour owner→concierge, owner→artisan et concierge→artisan ; distinguer facture client, paiement et éventuel versement au professionnel.
- **Déjà documenté :** E04/E05 ne permettent ni prix manquant converti en zéro ni facture fictive à l'activation continue. E09 laisse le payeur/versement artisan à clarifier. Le code d'une facture provider après intervention terminée est un constat, pas l'approbation de tous les modèles de facturation.
- **Présent / manquant :** devis, factures, documents, checkout/sync/webhook, client provider libre et facturation d'intervention présents ; circuit complet hors plateforme, reversement artisan et reprises réelles non démontrés. Le scénario historique H01 ne valide pas Stripe réel actuel.
- **Options :** limiter aux relations et circuits de paiement effectivement choisis et prouvés ; ou ajouter clients externes, récurrence et plusieurs circuits de règlement. Un encaissement externe peut être envisagé comme option distincte, sans marquer une facture payée sans justificatif ni prétendre que le code le prend déjà en charge.
- **Dépendances / risques fonctionnels :** PFC-DEV-01/02/03, PFC-FAC-01/02, PFC-ART-03, PFC-MIS-04 et conditions de collaboration. Doubles factures, montant/devise faux, payeur introuvable, encaissement non rapproché et intervention facturée au mauvais acteur.
- **Sécurité/confidentialité :** accès documents, signatures webhook, rejeu, autorisation checkout, références client/mission ; risque de fuite financière et de fausse confirmation de paiement. G02/G06/G07.
- **Conséquence et recommandation D — PROPOSÉE :** approuver un circuit explicite par parcours, avec prix/devise et règles existantes conservés, puis le valider. Ne pas promettre récurrence ou reversement non prouvés. Aucune règle fiscale, commission ou périodicité nouvelle décidée ici.
- **EN ATTENTE D'APPROBATION :** matrice émetteur/destinataire/payeur/bénéficiaire, client externe oui/non, modes de paiement et justificatifs, facture ponctuelle versus continue, acompte/solde retenus et traitement des erreurs/remboursements nécessaires au circuit choisi.

### ARB-05 — Quels canaux de notification sont indispensables ?

**Statut courant : décision métier confirmée — 16 novembre 2026 ; voir §11.5.** Analyse et recommandation ci-dessous conservées comme historique 02B2, pas comme statut actuel d'approbation.

- **Problème, espaces et parcours :** permettre aux trois acteurs de constater demande, devis, accord, modification et fin ; distinguer information applicative et livraison externe.
- **Déjà documenté :** E10 : événement de résiliation persistant ne vaut pas email livré ; messagerie provider séparée. Le référentiel propose NOT-02 en amélioration, mais exige une livraison constatée pour l'invitation propriétaire retenue dans COL-05.
- **Présent / manquant :** conversations, alertes et événements présents ; automatisation universelle, accusés de livraison et interopérabilité des deux silos non prouvés.
- **Options :** suivi applicatif fiable et emails essentiels ciblés ; ou push/SMS et distribution multicanale complète. Les canaux essentiels doivent être nommés événement par événement, pas regroupés sous « notifications OK ».
- **Dépendances / risques fonctionnels :** PFC-MSG-01/02, PFC-NOT-01/02, PFC-COL-05 et PFC-DEV-02. Invitation inaccessible, devis non reçu ou fin ignorée rendent le parcours incohérent ; répétition peut entraîner doublons.
- **Sécurité/confidentialité :** destinataire autorisé, contenu minimal, lien privé et durée adaptés ; aucun secret d'accès dans un canal non validé. G08/G10.
- **Conséquence et recommandation B — PROPOSÉE :** messages et statuts applicatifs accessibles, erreurs visibles, emails essentiels retenus effectivement reçus ; push/SMS génériques reportables. Un accord ne peut être présumé parce qu'un événement a été écrit.
- **EN ATTENTE D'APPROBATION :** tableau événement/canal/destinataire, traitement de l'échec et exigences opérationnelles. Les obligations essentielles restent dans le socle même si le moteur multicanal complet est reporté.

### ARB-06 — Quelles opérations de récupération/sécurité de compte sont exigées ?

**Statut courant : décision métier confirmée — 16 novembre 2026 ; voir §11.6.** Analyse et recommandation ci-dessous conservées comme historique 02B2, pas comme statut actuel d'approbation.

- **Problème, espaces et parcours :** un utilisateur doit pouvoir accéder à son compte, le récupérer de manière sûre et perdre ses droits lorsque nécessaire ; applicable aux trois espaces.
- **Déjà documenté :** protections d'inscription/profil et contrôles de rôles existent (E11), mais aucune décision complète retrouvée pour la politique de récupération. AUTH-04 est Non évalué dans 02B, pas Terminé.
- **Présent / manquant :** Credentials et fournisseurs configurables, session et gardes présents ; parcours de récupération, expiration/usage unique, révocation après changement et vérification de tous les rôles restent à établir. OAuth configuré ne prouve pas qu'il fonctionne.
- **Options :** récupération sécurisée avec identité prouvée et politique de session définie ; ou assistance encadrée si elle offre des garanties équivalentes approuvées. Une réattribution par simple email déclaratif ou changement de rôle manuel non contrôlé n'est pas acceptable.
- **Dépendances / risques fonctionnels :** PFC-AUTH-01/02/03/04, PFC-PROF-01 ; compte bloqué durablement ou sessions anciennes encore actives.
- **Sécurité/confidentialité :** prise de compte, jetons réutilisés, énumération d'adresses, usurpation de rôle et accès après suspension. G01/G02 bloquants pour tout périmètre exposé.
- **Conséquence et recommandation A — PROPOSÉE :** un chemin de connexion/récupération utilisable et prouvé, sans contournement d'authentification ; ne pas imposer MFA/OAuth multiples comme réalisés ou obligatoires sans décision distincte.
- **EN ATTENTE D'APPROBATION :** opérations minimales, preuve d'identité, politique de session/révocation, procédure d'assistance et fournisseurs réellement proposés. Les garanties d'accès privé ne sont pas reportables pour améliorer le taux.

### ARB-07 — Quels critères terrain et contrats terminés sont indispensables ?

**Statut courant : décision métier confirmée — 16 novembre 2026 ; voir §11.7.** Analyse et recommandation ci-dessous conservées comme historique 02B2, pas comme statut actuel d'approbation.

- **Problème, espaces et parcours :** assurer réservation → prestation → mission/intervention → preuve → clôture, et traiter les effets d'une fin de collaboration pour les trois acteurs.
- **Déjà documenté :** E05 conserve activation continue distincte du contrat et absence de mission/facture fictive ; E07 fixe préavis, effet UTC et historique. Ne pas rouvrir ces règles. L'arbitrage restant porte notamment sur les interventions engagées et leur règlement final.
- **Présent / manquant :** séjour, besoins séparés, planning, missions, checklists, preuves, comptes rendus et fin effective présents à des degrés partiels ; exécution complète, concurrence réelle et traitement final de toutes les missions encore engagées non prouvés.
- **Options :** opérations manuelles explicites et statuts simples, avec acteur responsable et preuves ; ou automatisation/optimisation avancée. « Simple » ne peut supprimer contrôle des droits, preuve de réalisation ou traitement des incidents.
- **Dépendances / risques fonctionnels :** PFC-SEJ-01/02, PFC-MIS-01 à PFC-MIS-07, PFC-COL-02/03/04, PFC-CON-09 et PFC-FAC-01. Arrivée/départ confondus, prestation oubliée, mission dupliquée, facture incohérente ou intervention poursuivie après échéance sans décision.
- **Sécurité/confidentialité :** accès aux preuves et au logement limité à l'acteur ; fin ne doit ni élargir les droits ni supprimer l'historique. G02/G03/G05/G06/G09.
- **Conséquence et recommandation A — PROPOSÉE :** valider le circuit terrain élémentaire et la fin de collaboration avant exposition de ce parcours ; conserver tournées, routines et vocal hors chemin critique. Ne pas déclarer l'opérationnel complet sur la seule présence d'un planning.
- **EN ATTENTE D'APPROBATION :** autorité de validation/clôture, preuves minimales par prestation, responsabilité et règlement des interventions déjà engagées, comportement en panne et information des participants. Aucune annulation ou réaffectation automatique nouvelle décidée.

### ARB-08 — Quelle base de référence pour le socle et quelles exclusions approuvées ?

**Statut courant : décision métier confirmée — 16 novembre 2026 ; voir §11.8.** Analyse et recommandation ci-dessous conservées comme historique 02B2, pas comme statut actuel d'approbation.

- **Problème, espaces et parcours :** fixer un périmètre stable de lancement pour les trois espaces, afin que l'indicateur ne varie pas par reclassement opportuniste.
- **Déjà documenté :** 02B est une proposition : 52 capacités dédupliquées et 71 parents, aucun dénominateur approuvé. Les 44 S ne sont ni un engagement de lancement ni une preuve d'avancement.
- **Présent / manquant :** IDs, critères, sources, consommateurs et relations proposés ; manque validation explicite des capacités/critères/rôles exigés et exclusions, avec version cible des preuves.
- **Options :** base versionnée approuvée ; ou garder l'inventaire proposé et l'état Non évalué. Une liste modifiée silencieusement à chaque campagne n'est pas un périmètre fiable.
- **Dépendances / risques fonctionnels :** tous les IDs PFC retenus, ARB-01 à ARB-07 et ARB-09 ; parents et capacités ne doivent pas être comptés ensemble. Dépendances techniques à maintenir même lorsqu'un consommateur est différé.
- **Sécurité/confidentialité :** ne pas sortir AUTH-03/MIS-03 d'une vue pour ignorer des routes encore exposées ; les preuves et captures doivent être synthétiques et sans données personnelles.
- **Conséquence et recommandation A — PROPOSÉE :** faire approuver une base B1 après arbitrages, avec journal de changement et obligations de sécurité hors calcul. Jusqu'alors aucun nouveau taux ; ce lot ne crée pas B1 approuvée.
- **EN ATTENTE D'APPROBATION :** version, décideur, date, capacités, critères communs/spécifiques, consommateurs requis, exclusions motivées et conditions de passage en service.

### ARB-09 — Vocal, tournées, CRM, stocks et rémunération : quel calendrier ?

**Statut courant : décision métier confirmée — 16 novembre 2026 ; voir §11.9.** Analyse et recommandation ci-dessous conservées comme historique 02B2, pas comme statut actuel d'approbation.

- **Problème, espaces et parcours :** différencier le travail élémentaire nécessaire au service et les outils avancés utiles aux trois acteurs, surtout à la Conciergerie.
- **Déjà documenté :** E12 : tournées/vocal hors prérequis MVP dans la lecture Personas, priorités P2 inchangées ; 02B propose tournées/CRM/stock en A et vocal/rémunération en F. Il s'agit d'hypothèses de calendrier, pas de suppression de fonctionnalités existantes.
- **Présent / manquant :** tournée et étapes partiellement codées, synthèse CRM et financière présentes, stock estimé ; gabarits/vocal/cycle complet de rémunération non établis. Une projection de consommables ne remplace pas un inventaire.
- **Options :** conserver les outils existants avec limites explicites et améliorer après lancement ; ou engager leur achèvement avant toute mise en service. Les planning, checklist et preuve simples restent dans l'opérationnel, même si l'optimisation est différée.
- **Dépendances / risques fonctionnels :** PFC-CON-04/06/07/08/10, PFC-DASH-04/05 ; missions, coordonnées, factures et modèles de rémunération requis. Risque de manque terrain si l'équipe dépend déjà d'une fonction supposée facultative : à vérifier avec le pilote.
- **Sécurité/confidentialité :** localisation précise et audio peuvent exposer des informations ; outils existants encore accessibles restent soumis aux mêmes contrôles d'accès. Report de développement n'est pas dérogation de sécurité.
- **Conséquence et recommandation C — PROPOSÉE :** V1.1 pour outils d'organisation/synthèse ; futur pour vocal et rémunération flexible, sauf besoin pilote explicitement retenu. Aucun changement P2/P4 ni retrait du code.
- **EN ATTENTE D'APPROBATION :** calendrier et dépendances du pilote, périmètre des outils déjà visibles, limites annoncées et critères de sécurité maintenus.

## 5. Parcours essentiels : analyse de bout en bout

Les tableaux distinguent présence statique et preuve attendue ; aucun parcours ci-dessous n'est certifié prêt. Les scénarios devront être exécutés sur une version et un environnement autorisés, avec données synthétiques et accès refusés entre acteurs.

### 5.1 Propriétaire → Conciergerie

| Étape | Présent / capacité | Manque ou condition de mise en service |
|---|---|---|
| Rechercher | Recherche/filtres/couverture — PFC-RECH-01/02 | Résultats réellement éligibles, géocodeur indisponible, vide/erreur et aucune donnée privée |
| Consulter prestations | Profil/catalogue — PFC-PROF-01, PFC-RECH-03, PFC-CON-01 | Publication selon E02, prestations exactes, tarif absent distinct du gratuit |
| Envoyer demande | Flux concierge — PFC-COL-01 | Lieu réel et droits logement, destinataires tous éligibles, persistance sans envoi partiel caché |
| Recevoir devis | Brouillon/envoi — PFC-DEV-01/02 | Sauvegarde/gratuité, visibilité chez le bon owner, livraison essentielle selon ARB-05 |
| Accepter/refuser | Attribution — PFC-DEV-03 | Un gagnant, refus indépendant des autres propositions, concurrence/reprise réelles |
| Établir collaboration | Ponctuel/continu — PFC-COL-01/02/03 | Contrat et activation non confondus, aucun effet fictif, périmètre conservé |
| Suivre missions | Séjour/planning/preuves — PFC-SEJ-01/02, PFC-MIS-01/02/07 | Réalisation, clôture, tiers, liens et fin de collaboration |
| Consulter factures | Facture/documents — PFC-FAC-01/02 | Prix/devise/source/payeur cohérents ; paiement et reprise prouvés pour le circuit retenu |

### 5.2 Propriétaire → Artisan

| Étape | Présent / capacité | Rupture ou condition |
|---|---|---|
| Rechercher | Exposition provider — PFC-RECH-01/02 | Ne prouve pas la disponibilité ni la possibilité de commander |
| Consulter profil | Profil/documents — PFC-PROF-01/02, PFC-ART-01 | Déclaré distinct de vérifié ; documents privés, pas de justificatif complet rendu public |
| Choisir prestation | Résolution catalogue — PFC-RECH-03 | Métier/famille ne garantit pas une intervention précise |
| Envoyer sollicitation | PFC-COL-01 | **Rupture confirmée E03** : sélection provider ignorée et API de destinataires concierge ; aucune commande artisan complète démontrée |
| Réponse/devis | API devis provider — PFC-DEV-01/02 | Lien avec la sollicitation et destinataire à définir/prouver ; présence du workspace insuffisante |
| Accepter/refuser | API commerciale commune — PFC-DEV-03 | Acteur, accord et gagnant pour la variante artisan à prouver |
| Suivre intervention | PFC-MIS-03/04 | Affectation autorisée et accord explicite distincts ; sécuriser E08 avant exposition |
| Justificatifs/factures | PFC-MIS-05/07, PFC-FAC-01/02 | Accès du bon client, facture correcte et circuit de paiement/versement défini |

Ce parcours reste un risque fonctionnel de lancement trois acteurs tant que la rupture n'est pas traitée. Une recommandation de simplification ne vaut pas autorisation de modifier l'UI/API dans ce lot.

### 5.3 Conciergerie → Artisan

| Étape | Présent / capacité | Rupture ou condition |
|---|---|---|
| Identifier le professionnel | Profil provider, recherche multi-rôle existante — PFC-PROF-01, PFC-RECH-01 | L'API de recherche professionnels autorisée à l'owner ne prouve pas un point d'entrée équivalent pour la concierge ; parcours d'identification autorisé à confirmer |
| Demander intervention | Création affectée — PFC-MIS-03, PFC-COL-01 | Une insertion `pending` n'est pas la preuve d'une demande reçue ni d'une négociation |
| Obtenir accord | Devis/édition de statut disponibles par morceaux — PFC-DEV-01/02/03, PFC-MIS-04 | Accord explicite, auteur et conséquence contractuelle à définir ; pas d'accord déduit de l'affectation |
| Affecter mission | Route mission/provider — PFC-MIS-03 | P0 E08 : lien canonique, acteur autorisé, références non forgeables et accès inter-missions |
| Suivre exécution | Workspace/planning/rapport — PFC-MIS-02/04/05 | Statuts, reprise et consultation du rapport par les bons participants |
| Contrôler preuves/droits | PFC-AUTH-03, PFC-MIS-07 | Tests HTTP et RLS/Storage réels, refus tiers, confidentialité des données logement/client |

### 5.4 Conciergerie — Gestion opérationnelle

| Fonction | Minimum proposé au lancement | Peut attendre sous réserve du pilote |
|---|---|---|
| Réservations/séjours | Dates, logement, responsables, modification et annulation cohérentes — PFC-SEJ-01/02 | Autonomie et multiples modes de délégation non livrés |
| Planning | Consultation et navigation fiables — PFC-MIS-02 | Optimisation automatique de tournées — PFC-CON-04 |
| Check-in/out et prestations | Besoins distincts, prestation précise, responsable et preuve — PFC-RECH-03, PFC-MIS-01/07 | Automatisation générale des routines — PFC-CON-06 |
| Missions/interventions | Accord, affectation sûre, statut, rapport et clôture — PFC-MIS-01/03/04/05 | Compte rendu vocal — PFC-CON-07 |
| Ponctuel/continu | Règles E04/E05, périmètre et fin E07 — PFC-COL-01/02/03/04 | Rémunération flexible/récurrence non décidée — PFC-CON-10 |
| Accès et incidents | Procédure d'accès validée ARB-03, contact responsable, urgence et données privées — PFC-CON-05/09 | Coffre/inventaire numérique complet si alternative approuvée |
| Suivi | Messages, erreurs visibles, checklist élémentaire et facture correcte — PFC-MSG-01, PFC-NOT-01, PFC-MIS-06, PFC-FAC-01 | CRM/stock/synthèses avancés — PFC-DASH-04/05, PFC-CON-08 |

## 6. Risques et conditions de mise en service

Ces conditions sont proposées comme contrôles de sortie. « Non prouvé actuellement » ne signifie pas automatiquement qu'une faille vient d'être démontrée ; E03 est une rupture fonctionnelle identifiée, E08 un chantier de sécurité déjà ouvert. Aucune exécution de ces contrôles dans 02B2.

| Condition | Risque / capacités | Preuve minimale requise avant exposition du périmètre | Portée bloquante |
|---|---|---|---|
| G01 — Identité/session | Prise de compte, compte irrécupérable — AUTH-01/02/04 | Inscription/connexion/déconnexion/récupération par rôle ; jetons invalides/expirés/réutilisés ; session révoquée selon politique approuvée | Tous les rôles exposés |
| G02 — Autorisations/RLS | Accès à des données ou actions d'un tiers — AUTH-03, PROF-02, LOG-01/02 | Matrice rôle/acteur/objet, autorisés et refusés ; handlers HTTP ; RLS authentifiée inter-tenant et chemin serveur privilégié ; migrations vérifiées sur bases fraîche et existante représentative | Toute lecture/écriture privée exposée ; tests statiques seuls insuffisants |
| G03 — Affectation provider | Liaison forgeable et accès à une autre mission du même séjour — MIS-03/04/05/07 | Jeux multi-owner/concierge/provider ; faux `metadata.mission_id`, mauvais participant, séjour partagé ; lien et refus persistants prouvés | Intervention provider intégrée ; ne pas l'exempter par retrait d'une carte de progression |
| G04 — Éligibilité/devis/accord | Sollicitation impossible ou destinataire inéligible, prix faux — RECH, COL-01, DEV-01/02/03 | Flux par couple de rôles retenu, gratuité explicite, un gagnant, concurrence/rejeu, refus tiers/hors-zone et réception | Parcours commercial correspondant |
| G05 — Collaboration/fin | Nouvelle mission après fin, historique perdu — COL-02/03/04, SEJ-01 | Règles E05/E07, dates limites UTC et zéro bilatéral ; intervention engagée traitée selon décision ; fin/création concurrentes en base | Collaboration continue exposée et opérations qui en dépendent |
| G06 — Erreurs/reprises | Mission/facture en double ou effets partiels cachés — MIS-01, FAC-01, DEV-03 | Injection de panne à chaque liaison, double appel/concurrence, reprise avec gagnant conservé ; visibilité et réparation de l'effet partiel | Chaînes d'écritures retenues |
| G07 — Facture/paiement | Mauvais payeur, fuite de document, faux payé — FAC-01/02 | Matrice ARB-04, relecture des lignes/montants/devise, document privé ; checkout/webhook/sync et rejeu ; rapprochement du règlement/versement si promis | Tout circuit financier présenté comme utilisable |
| G08 — Données personnelles/secrets | Codes d'accès, justificatifs ou adresses exposés — PROF-02, LOG-02, MSG, MIS-07, CON-05 | Projection publique minimale, tiers refusé, URLs privées/expiration, stockage et canaux adaptés ; politique de conservation/suppression à documenter et vérifier sur le périmètre | Tous les parcours exposés ; aucune conclusion globale de conformité juridique |
| G09 — Terrain et recette | Impossible d'accéder au logement, prestation oubliée ou incident sans responsable — SEJ, MIS, CON-09 | Recette authentifiée desktop/mobile, clavier, vide/erreur ; exécution check-in/out distincts, prestations retenues, accès/remise, preuve et clôture | Service terrain proposé |
| G10 — Information essentielle | Invitation/devis non reçu, décision mal attribuée — COL-05, DEV-02, MSG, NOT | Événement/canal/destinataire approuvés, réception observée, panne et reprise sans doublon ; consultation chez le bon acteur | Canaux et événements essentiels effectivement promis |

Les validations historiques PostgreSQL C1D, scénarios connectés anciens et campagnes avec doubles restent utiles comme preuves bornées, mais ne valent pas GO global. Une exclusion produit n'autorise pas à laisser une route dangereuse exposée : l'exposition effective et les droits restent à vérifier dans un lot autorisé.

## 7. Proposition historique MVP / V1.1 / Futur — remplacée par le §11

**PROPOSITION NON APPROUVÉE.** Les IDs de la colonne Capacités sont complets en leur ajoutant le préfixe `PFC-`. Chaque capacité du catalogue 02B apparaît dans un seul ensemble de cette table. Les groupes ne créent aucune nouvelle capacité. Les consommateurs et critères spécifiques restent ceux du référentiel, sous réserve des arbitrages ; on ne compte pas les groupes comme des unités supplémentaires.

| Ensemble | Fonctionnalités / espaces | Capacités | Motif, dépendances et conditions de validation |
|---|---|---|---|
| MVP proposé | Compte, connexion et droits — trois espaces | AUTH-01, AUTH-02, AUTH-03, AUTH-04 | Accès sûr indispensable ; G01/G02 et ARB-06, récupération non évaluée à établir |
| MVP proposé | Profils et justificatifs — trois espaces selon rôle | PROF-01, PROF-02 | Identité utile et documents privés ; AUTH-03, G02/G08 ; documents provider non imposés à l'owner |
| MVP proposé | Recherche, couverture, besoins — trois espaces selon parcours | RECH-01, RECH-02, RECH-03 | Mise en relation précise ; profils/zones, G04 ; recherche inverse concierge distincte de l'exposition artisan |
| MVP proposé | Messages et alertes de suivi — trois espaces | MSG-01, MSG-02, NOT-01 | Suivi des commandes/accords ; AUTH-03 et client provider, G08/G10 ; deux messageries non fusionnées par hypothèse |
| MVP proposé | Devis de bout en bout — owner, concierge, artisan | DEV-01, DEV-02, DEV-03 | Prix, envoi, réception et décision ; catalogue/destinataires, G04/G06 ; variante artisan conditionnée à ARB-01 |
| MVP proposé | Sollicitation, collaborations, historique et invitations — rôles retenus | COL-01, COL-02, COL-03, COL-04, COL-05 | Service commercial cohérent ; profils/logements/devis, G04/G05/G10 ; continu sans contrat artificiel, email essentiel non supprimé |
| MVP proposé | Logements et photos — owner/concierge | LOG-01, LOG-02 | Objet et références du service ; AUTH-03, G02/G08, vérification Storage |
| MVP proposé | Réservations et séjours — owner/concierge, artisan sur son périmètre | SEJ-01, SEJ-02 | Organisation terrain ; logement/participants, ARB-02, G05/G09 |
| MVP proposé | Missions, planning et exécution — trois espaces | MIS-01, MIS-02, MIS-03, MIS-04, MIS-05, MIS-06, MIS-07 | Responsabilité, accord, exécution et preuve ; G02/G03/G06/G09 ; rien n'est déclaré prêt sur la seule API provider |
| MVP proposé | Factures et règlement — trois espaces selon circuit | FAC-01, FAC-02 | Circuit économique complet ; ARB-04, devis/intervention, G07 ; aucune récurrence ou reversement non prouvé |
| MVP proposé | Publication, zone et tarifs concierge | CON-01, CON-02, CON-03 | Éligibilité utile à la demande ; profil/catalogue, règles E02/E04 et G04 |
| MVP proposé | Incidents et prise en charge essentielle — owner/concierge/artisan | CON-09 | Version simple avec responsable et clôture, sans promesse d'un dispatch automatique ; missions/droits, G08/G09 |
| MVP proposé | Compétences, disponibilités déclarées et clients provider | ART-01, ART-02, ART-03 | Prestation et client identifiés ; profil/catalogue, G02/G04 ; déclaration distincte d'une qualification/créneau garanti |
| MVP proposé | Dashboards essentiels — trois espaces | DASH-01, DASH-02, DASH-03 | Accès aux opérations et erreurs visibles ; données métier/droits, G09 ; synthèses minimales, pas tous les widgets indispensables |
| Condition ARB-03 | Cycle numérique des clés — trois espaces terrain | CON-05 | MVP si aucun accès externe validé ; V1.1 seulement si alternative approuvée et G08/G09 satisfaits. Jamais déclaré implémenté par substitution |
| V1.1 proposée | Distribution externe généralisée — trois espaces | NOT-02 | Push/SMS/multicanal après les canaux essentiels ; G10 reste requis pour invitations/devis retenus, même sans moteur généralisé |
| V1.1 proposée | Tournées, gabarits, stock réel — concierge et intervenants | CON-04, CON-06, CON-08 | Organisation avancée ; planning/checklist/logement, E12 ; sécurité des outils déjà exposés reste obligatoire |
| V1.1 proposée | CRM et finance avancée — concierge | DASH-04, DASH-05 | Synthèses enrichies ; messages/logements/factures ; ne pas mélanger exemple et réel |
| Futur proposé | Vocal et rémunération flexible — acteurs concernés | CON-07, CON-10 | Besoins/conditions non stabilisés ; rapports/factures, consentement et modèles à approuver ; priorités officielles inchangées |

La table couvre les 52 IDs, avec un cas conditionnel explicite ; aucun dénominateur de lancement n'en est approuvé. Le référentiel demeure à 44 S, 6 A, 2 F : la proposition conditionnelle concernant CON-05 ne réécrit pas ce classement. Tous les critères de la version simplifiée retenue doivent être définis sans se déclarer satisfaits parce qu'une autre étape a été différée.

## 8. Conséquences sur les futurs indicateurs

### 8.1 Base de développement à préparer, sans taux

La future base B1 devra contenir : liste d'IDs uniques, version de leurs critères I, consommateurs requis, variantes retenues par ARB-01/02/04/07, décision ARB-03, dépendances, exclusions motivées et approbation explicite (décideur/date/source). La table MVP est un candidat, pas B1.

Le dénominateur futur serait l'ensemble dédupliqué de capacités élémentaires retenues dans B1. Une capacité partielle, inconnue ou absente de preuve ne reçoit aucun crédit arbitraire ; afficher ces états séparément. Une exclusion approuvée ne la supprime ni du catalogue ni de la roadmap. Ne pas convertir une procédure externe en capacité numérique implémentée ; conserver ses conditions opérationnelles comme critères de sortie obligatoires du lancement.

Si une capacité garde le même ID mais un périmètre simplifié, versionner précisément ses critères et conserver la comparaison avec les critères complets 02B. Ne pas déclarer toute la capacité achevée à partir d'une réussite du seul sous-périmètre. Une scission n'est admissible que si techniquement/métier justifiée, avec liens de remplacement et sans compter parent et enfants ensemble.

### 8.2 Périmètre de validation

Le dénominateur futur serait l'ensemble unique des critères V communs et spécifiques exigés par B1, plus les conditions de sortie applicables à la mise en service. Un même critère lié à plusieurs capacités/parcours ne doit être compté qu'une fois dans le global ; les obligations différentes par rôle gardent leurs IDs propres. Toute preuve doit préciser critère, résultat attendu/observé, date, environnement, version/empreinte, portée et limites.

Les conditions de sécurité, confidentialité et procédure externe doivent être définies explicitement avant tout comptage ; elles ne doivent pas disparaître pour rendre le taux favorable. Séparer obligations d'acceptation du produit numérique et preuve de préparation opérationnelle, puis imposer leur satisfaction conjointe pour un GO. Aucun taux numérique, même complet, ne neutralise un blocage de sécurité.

Non testé, partiellement couvert, échec, preuve historique à requalifier, obsolète ou non applicable motivé restent distincts. Aucun test statique ne remplace une preuve de droits réelle. Un total de tests ancien ne remplit pas automatiquement un critère B1. Aujourd'hui, les critères 02B restent Non testés ; les nouveaux risques n'en changent pas les statuts.

### 8.3 Transversal, Non évalué et changement de version

- Dédupliquer par capacité technique PFC, jamais par somme des vues owner/concierge/artisan. Un consommateur simplifié n'approuve pas les autres consommateurs du même backend.
- Tant que le périmètre, les critères, l'exposition et les preuves ne sont pas approuvés : état « Non évalué — arbitrages de lancement ouverts » pour le futur indicateur, sans modification de l'interface actuelle.
- Un changement de périmètre exige une nouvelle version B2 avec delta d'IDs/critères/consommateurs/exclusions, motif, date et approbation. Garder les résultats B1 ; ne pas les recalculer silencieusement avec B2.
- Une modification de code sensible entraîne réexamen de l'applicabilité des preuves, sans inventer une durée universelle de validité. Conserver les journaux historiques bornés.
- Garder les formules actuelles de chantiers documentaires inchangées, y compris leurs différences P4. Ni la proposition ni une décision future n'est branchée au dashboard dans 02B2.

## 9. Historique 02B2 des décisions alors en attente

Au stade 02B2, toutes les lignes ci-dessous étaient **EN ATTENTE D'APPROBATION**. Elles sont désormais confirmées dans PROGRESS-02B3 (§11). Cette liste historique ne rouvre pas les décisions principales ; seules les réalisations, précisions techniques et preuves restent à qualifier.

| Décision | Livrable de décision attendu | Condition pour clore l'arbitrage documentaire |
|---|---|---|
| ARB-01 | Couples d'acteurs réellement servis, sollicitation/accord artisan et périmètre public | Option explicite, responsabilités et variantes nécessaires retenues |
| ARB-02 | Mode de séjour initial et responsable principal/remplacement | Accord sur simplification ou autonomie complète, sans mode fantôme |
| ARB-03 | Gestion numérique ou procédure externe des accès | Procédure complète, responsables, preuve et conditions G08/G09 approuvés |
| ARB-04 | Matrice émetteur/destinataire/payeur/bénéficiaire par parcours | Circuit de règlement, facture, client externe et reprises explicités |
| ARB-05 | Événement/canal/destinataire et traitement d'échec | Canaux essentiels distingués des améliorations multicanales |
| ARB-06 | Politique minimale d'accès/récupération/révocation | Identité prouvée et scénarios de contrôle retenus |
| ARB-07 | Réalisation/clôture, interventions engagées et règlement après fin | Compléments métier choisis sans rouvrir les règles E05/E07 |
| ARB-08 | Version B1 et critères/exclusions/consommateurs | Validation explicite, traçable et indépendante de la réussite technique |
| ARB-09 | Calendrier MVP/V1.1/Futur et limites des outils exposés | Pas de suppression ou changement automatique des priorités existantes |

Clore un arbitrage produit ne signifie pas réussir sa recette. La mise en service reste conditionnée aux preuves G01–G10 applicables. Inversement, un test réussi ne tranche pas un choix métier.

## 10. Contrôles documentaires et verdict borné

Contrôler automatiquement l'égalité des neuf formulations avec 02B, l'unicité des arbitrages, la résolution des IDs PFC cités, la couverture unique des 52 capacités dans la table de proposition, les liens locaux et repères de ligne, l'absence de changement des 28 fichiers préexistants, UTF-8 sans BOM, ainsi que les espacements Git du fichier suivi/non suivi. Relire les décisions enregistrées avec leurs limites pour ne pas présenter une contrainte technique comme une approbation produit.

**Verdict documentaire visé : PASS pour un dossier de décision préparé, pas pour une mise en service.** Les neuf arbitrages restent à valider explicitement. Les risques fonctionnels artisan et sécurité provider, les recettes réelles, RLS, reprises et circuits financiers restent ouverts selon les périmètres choisis. Aucun GO produit/technique, aucune modification de Master Plan ou du référentiel, aucune nouvelle progression. Un seul document distinct ajouté ; aucune correction applicative ou phase 02C engagée.

## 11. Décisions métier confirmées — PROGRESS-02B3

**Autorité : responsable du projet, demande explicite PROGRESS-02B3 du 16 novembre 2026.** Les neuf décisions principales sont confirmées. Les recommandations 02B2 restent conservées pour traçabilité et sont remplacées lorsqu'elles divergent. La confirmation porte sur le métier et la stratégie, pas sur l'implémentation ni sur les résultats techniques. Les conditions G01–G10 historiques restent à adapter et vérifier selon les décisions ci-dessous ; elles ne sont pas marquées réussies.

### 11.1 ARB-01 — Sollicitation des artisans

**Décision métier confirmée — 16 novembre 2026.** Deux parcours sont autorisés :

- Le propriétaire peut solliciter directement un artisan.
- Une conciergerie peut solliciter un artisan pour le compte d'un propriétaire, avec autorisation appropriée.
- Les interventions peuvent concerner des besoins hors location saisonnière.
- Demande, accord, devis et intervention doivent être distingués.

Le parcours commercial artisan reste à implémenter ou compléter selon les preuves du code. L'option historique owner/concierge seul n'est plus le périmètre cible décidé. La capacité d'affecter une intervention ne démontre pas sa sollicitation ou son accord.

**Conséquences et capacités :** PFC-COL-01, PFC-RECH-01/02/03, PFC-DEV-01/02/03, PFC-MIS-03/04/05, PFC-ART-03 et PFC-FAC-01, avec PFC-AUTH-03. Client contractuel et mandat rejoignent ARB-04. Source E03 : sélection provider ignorée et destinataires concierge ; contradiction de code conservée explicitement, sans correction dans ce lot.

**Non développé ou non établi :** chaîne de sollicitation artisan intégrée, preuve de mandat et accord persisté dans les deux parcours. **Validations restantes :** scénarios owner/artisan et concierge mandataire/artisan, sans séjour obligatoire, refus sans autorisation, rattachements et accès privés. Détails d'interface/preuve du mandat à concevoir, sans remettre les deux parcours en décision ouverte.

### 11.2 ARB-02 — Gestion des séjours

**Décision métier confirmée — 16 novembre 2026.** Deux modes sont possibles :

- Le propriétaire gère ses séjours de manière autonome.
- Le propriétaire peut déléguer la gestion à une conciergerie.
- Des prestations ponctuelles restent possibles sans délégation complète.

Respecter les modèles existants de collaborations continues et ponctuelles. La recommandation historique de limiter le lancement au concierge principal n'est plus la cible métier ; elle reste seulement l'explication de la contrainte actuelle du code.

**Conséquences et capacités :** PFC-SEJ-01/02, PFC-LOG-01, PFC-COL-01/02/03, PFC-MIS-01/02/03 et PFC-AUTH-03. **Écart :** E06 exige actuellement concierge/collaboration à la création owner ; le mode autonome n'est pas déclaré implémenté. Changer un champ obligatoire ne suffirait pas à établir responsabilités, droits et suivi.

**Validations restantes :** autonomie, délégation et prestation ponctuelle sans délégation complète, choix explicite du mode, absence de délégation implicite, isolation des acteurs et cohérence des missions/factures. Les modalités techniques de passage d'un mode à l'autre restent à qualifier ; les deux modes sont décidés.

### 11.3 ARB-03 — Clés et accès

**Décision métier confirmée — 16 novembre 2026.** Gestion simplifiée au lancement :

- Mode d'accès renseigné.
- Consignes sensibles protégées.
- Accès limité aux personnes autorisées.
- Confirmation minimale de remise et de restitution lorsque nécessaire.
- Révocation des accès lorsque l'autorisation prend fin.

Reporter le suivi numérique avancé des clés à une version ultérieure. Une procédure externe éventuelle n'exonère pas des cinq garanties décidées ; ce n'est plus une alternative non tranchée entre sécurité et absence de suivi.

**Conséquences et capacités :** PFC-CON-05 conserve son ID et son périmètre S pour la version simplifiée ; PFC-LOG-01, PFC-AUTH-03, PFC-COL-03/04, PFC-MIS-01/07 restent dépendances. Le volet numérique avancé est visible en feuille de route, sans deuxième capacité comptée.

**Non établi :** chaîne complète de protection/remise/restitution/révocation. **Validations restantes :** secret non public, acteurs autorisés, confirmation nécessaire selon mode, retrait après fin, incident et historique minimal. Le support et les canaux sûrs restent des choix techniques ; aucune clé réelle ni donnée sensible n'est ajoutée aux documents.

### 11.4 ARB-04 — Paiements et facturation

**Décision métier confirmée — 16 novembre 2026.** Les paiements des prestations sont effectués directement entre le client contractuel et le professionnel. **PlanetLS n'encaisse pas les sommes de ces prestations au lancement.**

| Circuit confirmé | Facture émise par | Client contractuel facturé |
|---|---|---|
| Propriétaire sollicitant directement un artisan | Artisan | Propriétaire |
| Conciergerie facturant ses propres prestations | Conciergerie | Son client contractuel |
| Conciergerie agissant comme intermédiaire autorisé | Artisan | Propriétaire |
| Conciergerie commandant en son nom | Artisan | Conciergerie |

Le client contractuel doit être identifié avant acceptation du devis. Aucune conciergerie ne peut engager financièrement un propriétaire sans autorisation appropriée.

Suivi des règlements :

- Le professionnel déclare avoir reçu le règlement.
- Le client consulte le statut.
- Le client peut signaler une erreur ou contester.
- Un historique des déclarations et contestations est conservé.
- Une déclaration de paiement ne constitue pas une preuve bancaire.

Les circuits financiers et obligations applicables devront être vérifiés avant lancement. Ce choix concerne les prestations ; il ne tranche pas les abonnements de PlanetLS et ne commande pas de supprimer Stripe ou un autre code existant dans cette mission.

**Conséquences et capacités :** PFC-FAC-01/02, PFC-DEV-01/03, PFC-ART-03, PFC-MIS-04, PFC-COL-01/02, PFC-NOT-01/02 et PFC-AUTH-03. La cible FAC-02 devient le suivi déclaratif direct et contestable ; la recommandation historique d'un circuit de checkout des prestations n'est pas retenue.

**Écarts observés :** API factures/Stripe présentes, mais pas preuve du modèle décidé ; la [route de statut](../src/app/api/invoices/[id]/status/route.ts#L32) est limitée aux rôles concierge/admin, et [la clôture après paiement](../src/app/api/invoices/[id]/status/route.ts#L50) a des effets à requalifier. Déclaration provider, contestation client, historique complet et identité contractuelle/mandat avant acceptation restent à compléter ou prouver. Aucun effet applicatif n'est changé.

**Validations restantes :** quatre circuits, deux types de commanditaire concierge, refus sans mandat, auteur de déclaration et client autorisés, contestation/historique persistants, reprise après erreur et absence d'assimilation à une preuve bancaire. Aucun règlement déclaré ne remplace les critères de réalisation de mission. Modalités de contestation, correction, conservation et obligations applicables restent à préciser, sans rouvrir le paiement direct ni l'absence d'encaissement par PlanetLS.

### 11.5 ARB-05 — Notifications

**Décision métier confirmée — 16 novembre 2026 :**

- Centre de notifications intégré dans PlanetLS.
- Emails pour les événements essentiels.
- Notifications secondaires uniquement dans l'application.

Événements essentiels notamment : nouvelles demandes ; devis ; acceptations et refus importants ; changements significatifs de mission ; factures ; contestations de paiement. La confidentialité, la fiabilité et la délivrabilité des emails doivent être vérifiées.

**Conséquences et capacités :** PFC-NOT-01 pour le centre ; PFC-NOT-02 entre au socle pour les emails essentiels, tandis que le multicanal non essentiel reste reporté. PFC-MSG-01/02, PFC-COL-05, PFC-DEV-02, PFC-MIS-01 et PFC-FAC-01/02 produisent des événements consommateurs distincts ; pas de doublon de capacité.

**Non établi :** centre cohérent et livraison essentielle fiable ; événements, alertes et conversations actuels ne suffisent pas. **Validations restantes :** matrice des événements/destinataires, consultation chez le bon acteur, contenu minimal, liens privés, réception réelle, panne, reprise et déduplication. Les seuils précis de « significatif » et « important » sont des détails à qualifier, pas une remise en attente des canaux décidés.

### 11.6 ARB-06 — Sécurité des comptes

**Décision métier confirmée — 16 novembre 2026.** Sécurité renforcée et accessible :

- Confirmation email.
- Récupération sécurisée du compte.
- Modification du mot de passe.
- Gestion et révocation des sessions.
- Protection contre les connexions abusives.
- Vérification renforcée pour les actions sensibles.
- Double authentification obligatoire pour les administrateurs.

La double authentification des comptes standards pourra être ajoutée progressivement. Les contrôles de sécurité réels restent obligatoires avant lancement.

**Conséquences et capacités :** PFC-AUTH-01/02/03/04 et PFC-PROF-01 ; administration comme consommateur transversal des critères de sécurité, sans créer une nouvelle capacité ni une nouvelle fiche de parcours. La position historique « MFA non imposée sans décision » est remplacée par l'exigence explicite pour les administrateurs.

**Non établi :** prise en charge complète confirmation/récupération/changement/révocation/anti-abus/vérification sensible/MFA admin dans les sources lues ; présence de Credentials, OAuth ou gardes insuffisante. **Validations restantes :** scénarios par rôle, jetons invalides/expirés/réutilisés, perte d'accès et récupération sûre, session révoquée effectivement, abus, contrôle renforcé et refus d'accès admin sans MFA. Algorithme MFA, politique de session et liste des actions sensibles à préciser ; aucune manipulation d'authentification ici.

### 11.7 ARB-07 — Exécution des missions et fin des collaborations

**Décision métier confirmée — 16 novembre 2026.** Suivi complet et sécurisé :

- Responsable identifié pour chaque intervention.
- Suivi de l'exécution.
- Justificatifs adaptés.
- Gestion des annulations.
- Gestion des absences.
- Traitement des litiges.
- Historique des événements importants.
- Traitement individuel des interventions engagées lorsqu'une collaboration prend fin.

Conserver la règle existante pour les collaborations continues : **préavis de 30 jours et date de prise d'effet calculée côté serveur**. La fin d'une collaboration ne doit pas entraîner automatiquement la suppression ou l'abandon des interventions engagées. Les détails existants documentés par 03C, notamment convention UTC et conditions bilatérales particulières, ne sont pas supprimés implicitement par cette reprise de la règle existante ; aucune règle serveur n'est réécrite.

**Conséquences et capacités :** PFC-SEJ-01/02, PFC-MIS-01/02/03/04/05/06/07, PFC-COL-02/03/04, PFC-CON-09, PFC-FAC-01 et PFC-AUTH-03. Préavis et activation distincte du contrat déjà documentés sont préservés. L'arbitrage principal sur les interventions engagées est tranché : traitement individuel sans abandon automatique ; ses modalités ne constituent pas une permission d'annuler/réaffecter automatiquement.

**Non établi :** chaîne complète des responsabilités, annulations/absences/litiges, preuves et fin sans perte. **Validations restantes :** chaque événement et acteur, persistance/reprise, intervention en cours à l'échéance, contrôle des droits, refus d'effacement induit, concurrence réelle et historique. Les procédures individuelles et justificatifs par prestation restent à préciser.

### 11.8 ARB-08 — Périmètre de lancement

**Décision métier confirmée — 16 novembre 2026.** Lancement progressif avec les trois espaces : Propriétaires, Conciergeries, Artisans / Prestataires.

Étapes :

1. Finalisation des parcours essentiels.
2. Vérifications fonctionnelles et de sécurité.
3. Bêta pilote avec utilisateurs sélectionnés.
4. Correction des problèmes identifiés.
5. Ouverture publique progressive sous conditions.

Aucune ouverture à des utilisateurs réels sans validation suffisante des permissions et de la protection des données. La décision de stratégie de lancement ne constitue pas un GO technique ou opérationnel.

**Conséquences :** les variantes artisan et autonome ne sont pas exclues pour faciliter un indicateur. Les 52 capacités restent traçables ; le référentiel §11 définit la cible B3-métier, les critères détaillés et preuves restent à qualifier avant un dénominateur publiable. L'approbation des neuf décisions ne signifie ni « 52 capacités réalisées » ni autorisation de publier/inviter des utilisateurs.

**Validations restantes :** identité/version cible, critères de sortie, permissions et protection des données avant pilote, recettes après corrections et décision explicite à chaque passage. Les modalités du pilote restent à préparer dans un lot autorisé ; 02C ne démarre pas ici.

### 11.9 ARB-09 — Outils avancés

**Décision métier confirmée — 16 novembre 2026.** Reporter les outils avancés non indispensables.

**V1.1 ou version ultérieure :** optimisation avancée des tournées ; gabarits de routines réutilisables ; gestion complète des stocks ; CRM enrichi ; tableaux de bord et synthèses avancés ; distribution multicanale non essentielle.

**Évolutions futures :** comptes rendus vocaux avancés ; rémunération flexible et périodicités complexes.

Ne pas retirer du socle : fonctionnalités essentielles de planning ; missions et justificatifs ; notifications nécessaires ; contrôles de sécurité ; obligations liées aux interventions et aux factures.

**Conséquences et capacités :** PFC-CON-04/06/08, PFC-DASH-04/05 en V1.1/ultérieur ; PFC-CON-07/10 futures ; sous-périmètres avancés de PFC-CON-05 et PFC-NOT-02 différés, leurs garanties essentielles restant au socle. Les classements P2/P4 du Master Plan demeurent inchangés.

**Validations restantes :** absence de dépendance cachée du socle vers un outil reporté, limites affichées et sécurité de tout code existant exposé. Aucun composant, outil ou donnée supprimé. La mise en place du calendrier détaillé ne rouvre pas le report décidé.

### 11.10 Traçabilité, écarts et préparation du lot suivant

| Décision | Remplacement de la recommandation 02B2 | Conséquence documentaire courante |
|---|---|---|
| ARB-01 | L'option owner/concierge seul n'est plus un choix de lancement en attente | Deux parcours artisan autorisés, contexte hors location inclus ; mandat et accord à réaliser/prouver |
| ARB-02 | Le concierge principal n'est plus le seul mode cible proposé | Autonomie et délégation requises, ponctuel sans délégation complète ; contrainte de code signalée |
| ARB-03 | Le cycle numérique n'est plus une alternative principale non tranchée | Accès simplifiés obligatoires ; avancé différé ; critères minimaux non supprimés |
| ARB-04 | Checkout/encaissement des prestations ne définit plus la cible de FAC-02 | Paiement direct, quatre circuits, déclaration contestable/historisée ; code Stripe inchangé |
| ARB-05 | Les canaux essentiels ne sont plus indéterminés | Centre intégré, emails essentiels, secondaire applicatif ; NOT-02 S pour son périmètre essentiel |
| ARB-06 | La MFA admin n'est plus une option non imposée | MFA admin obligatoire et ensemble de garanties de compte explicites ; standard progressif |
| ARB-07 | Le principe de traitement des interventions engagées n'est plus ouvert | Traitement individuel, aucun abandon/suppression automatique ; modalités à qualifier |
| ARB-08 | La stratégie trois espaces n'est plus une hypothèse de lancement | Parcours → sécurité → pilote → corrections → ouverture sous conditions ; aucun GO |
| ARB-09 | Les outils avancés ne sont plus en attente d'un arbitrage principal de report | Reports confirmés, essentiels maintenus, priorités officielles inchangées |

La préparation documentaire de 02C est détaillée au [référentiel §11](planetls-progress-functional-reference.md). Les 52 IDs et 71 parents sont conservés ; la classification cible contient 45 capacités S, 5 A et 2 F. Cette différence avec 44/6/2 est entièrement expliquée par l'email essentiel de PFC-NOT-02, sans capacité ajoutée ; les volets avancés partagés ne sont pas comptés deux fois. Aucun de ces nombres n'est un avancement ni un dénominateur publié.

Les états observés et preuves 02B sont historiques ; les nouvelles exigences exigent requalification, sans promotion en Implémenté, Validé ou PASS. Les contrôles G01–G10 restent ouverts techniquement, actualisés en portée : G01 inclut MFA admin/confirmation/session, G04 mandat et client contractuel, G05 traitement individuel des interventions, G07 paiement direct déclaré/contesté sans preuve bancaire, G08 accès sensibles, G10 emails essentiels. Sources et tests présents ne valent pas exécution actuelle.

Si une décomposition supplémentaire est nécessaire, la proposer d'abord avec critères et conséquences ; ne pas modifier arbitrairement le nombre des capacités ni les IDs. Définir version des critères et consommateurs requis, recueillir preuves applicables, distinguer Non testé/échec/partiel/historique/obsolète motivé ; dédupliquer globalement. Calcul documentaire inchangé et intitulé explicite ultérieur seulement après autorisation.

**Verdict du lot 02B3 : intégration documentaire des décisions, pas validation du service.** Seuls les deux documents PROGRESS sont modifiés ; Master Plan et code intacts. Aucun taux nouveau, aucune barre changée, aucun GO pour pilote/public, aucun commit/push/déploiement, migration, écriture Supabase, action Docker ou changement d'authentification. PROGRESS-02C non commencé. Toute intégration d'indicateurs ou fonctionnalité nécessite une autorisation explicite distincte.
