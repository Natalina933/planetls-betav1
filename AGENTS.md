# Instructions projet PlanetLS

## Master Plan — règles de pilotage

### Encodage et langue

- PlanetLS est un site francophone. Tous les fichiers texte doivent rester en `UTF-8 sans BOM`.
- Les textes visibles par l'utilisateur doivent utiliser les accents français corrects. Il est interdit de supprimer les accents pour contourner un problème d'encodage.
- Avant toute modification automatisée de texte, vérifier l'encodage réel du fichier et éviter les conversions globales ou doubles conversions.
- Les routes, identifiants techniques et clés existantes ne doivent pas être renommés uniquement pour ajouter des accents.

### Definitions de gouvernance

- Une **mission importante** modifie un parcours utilisateur, une regle metier, une API, un schema de donnees, une permission, une integration externe, une dependance majeure ou un risque produit/technique.
- Une **evolution significative** est une modification qui peut changer le statut, la priorite, les preuves, les dependances, les limites connues ou la roadmap d'un sujet du Master Plan.
- Un **audit** est une analyse factuelle et datee du code, des migrations, des tests et, si applicable, des donnees ou integrations. Il produit des preuves, ecarts et prochaines actions ; il ne remplace pas le Master Plan.
- Un **workflow** est une chaine de transitions metier ou techniques, avec declencheur, acteur ou systeme responsable, permissions, donnees persistantes, erreurs et resultat attendu.

### Migrations et permissions Supabase

- Toute migration doit etre testee sur une base locale fraiche et sur une base existante representative avant d'etre declaree terminee. Si un rollback, une sauvegarde ou une previsualisation est necessaire, son statut doit etre documente.
- Toute fonctionnalite qui lit ou ecrit des donnees Supabase doit inclure une verification RLS dans sa checklist : acces autorise, acces refuse entre roles ou tenants, et parcours serveur lorsque pertinent.

Le document officiel de pilotage est `docs/master-plan-planetls.md`.

Après toute évolution fonctionnelle, technique ou métier significative, analyser les fichiers modifiés et mettre à jour ce Master Plan dans la même mission. La mise à jour doit refléter l'état réel du code, le statut de la fonctionnalité, les priorités, la roadmap, les dépendances, les limites, les nouvelles idées et les décisions importantes. Ne pas créer un nouvel audit lorsque l'information peut être intégrée au document principal.

Le code, les migrations réellement appliquées et les tests sont les sources de vérité. La présence d'une page, d'un composant ou d'une route ne suffit pas pour déclarer une fonctionnalité terminée.

Statuts autorisés : `✅ Terminé`, `🟡 En cours`, `🟠 Partiel`, `🔴 À faire`, `⚠️ Bloqué`, `⏸️ Reporté`, `❌ Abandonné`.

Priorités : `P0 Critique`, `P1 Prioritaire`, `P2 Important`, `P3 Confort`, `P4 Évolution future`.

Les petites corrections typographiques ou purement visuelles ne nécessitent pas de mise à jour, sauf si elles changent une règle commune du design system.

## Vérification de fin de mission importante

- [ ] Le développement demandé est réalisé et les fichiers concernés ont été relus.
- [ ] Les tests, le lint, le build ou les vérifications pertinentes ont été exécutés.
- [ ] Les permissions, erreurs, chargements, états vides et données persistées ont été contrôlés selon le contexte.
- [ ] Le statut, la priorité, les preuves et la prochaine action ont été actualisés dans le Master Plan.
- [ ] La roadmap, les dépendances et les limites connues ont été réévaluées.
- [ ] Les idées nouvelles ont été enregistrées sans doublon, sans être implémentées hors demande.
- [ ] Les décisions significatives ont été ajoutées au journal.
- [ ] Aucun audit ou document redondant n'a été créé.

- [ ] Toute migration concernee a ete validee sur une base fraiche et une base existante representative, avec rollback, sauvegarde ou previsualisation documente si necessaire.
- [ ] Toute fonctionnalite impliquant Supabase a une verification RLS documentee : acces autorise, refus entre roles ou tenants, et parcours serveur si pertinent.

## Compte rendu final

Toute mission importante se termine par une section `Mise à jour du pilotage PlanetLS` indiquant le fichier mis à jour, les statuts et priorités déplacés, les tâches ou idées ajoutées, les contradictions détectées et les vérifications restantes. Si aucun impact significatif n'existe, l'indiquer explicitement.
## Mode d'intervention légère — économie de tokens

Pour une demande explicitement limitée à une petite modification locale
(visuel, CSS, texte, icône, espacement, responsive local, état d'affichage
ou ajustement mineur d'un composant existant) :

- Ne pas auditer le projet.
- Ne pas lire le Master Plan sauf si la modification révèle un impact
  fonctionnel, métier ou technique significatif.
- Ne pas explorer les fichiers sans rapport direct avec la demande.
- Commencer par le fichier ou composant explicitement indiqué par l'utilisateur.
- Lire uniquement ses dépendances directes si nécessaire.
- Réutiliser les composants, styles et tokens existants.
- Ne pas refactoriser du code hors périmètre.
- Ne pas créer de dépendance.
- Ne pas modifier l'architecture.
- Ne pas créer de documentation ou d'audit supplémentaire.
- Ne pas mettre à jour le Master Plan pour une modification purement visuelle locale.
- Exécuter uniquement les tests ou vérifications ciblés nécessaires.
- Ne pas lancer la suite complète, le build global ou les E2E complets sauf nécessité réelle.

Si la modification nécessite finalement une évolution significative au sens
des règles de gouvernance ci-dessous, quitter ce mode et appliquer les règles
complètes du projet.

### Compte rendu léger

Pour une intervention légère, terminer avec seulement :

- Fichiers modifiés
- Modification réalisée
- Vérification/test effectué
- Problème éventuel restant

Réponse concise.

## Classification rapide des missions Codex

Avant toute intervention, identifier la catégorie de la demande pour ajuster
la lecture du contexte, les vérifications et le compte rendu.

### A — Visuel local

CSS, SCSS, textes, icônes, composants de présentation ou ajustement mineur
d'une interface existante.

- Lire uniquement les fichiers ciblés et les dépendances nécessaires.
- Ne pas relire le Master Plan sans impact métier, technique ou sécurité.
- Préserver la logique existante et les composants, fonctions, styles et tokens déjà en place.
- Effectuer des vérifications proportionnées : diff, `git diff --check`,
  et vérification visuelle si le rendu le justifie.
- Pour du TSX, lancer un typecheck seulement si des imports, types, props ou hooks sont concernés.

### B — Fonctionnalité métier

Onboarding, recherche, demandes, devis, contrats, séjours, missions,
facturation ou tout parcours utilisateur significatif.

- Examiner le parcours concerné et ses dépendances utiles.
- Vérifier les API, états d'erreur, chargements, permissions et données persistées selon le contexte.
- Exécuter les tests ciblés, puis un typecheck ; lancer un build seulement si le risque technique le justifie.
- Mettre à jour le Master Plan selon les règles de pilotage existantes.

### C — Base de données et sécurité

Supabase, migrations, RLS, authentification, permissions, rôles, tenants ou
écriture distante.

- Faire un diagnostic préalable et vérifier les impacts avant toute action.
- Prévoir le rollback, la sauvegarde ou la prévisualisation quand une migration est concernée.
- Exécuter les tests de sécurité et de permissions adaptés.
- Ne jamais effectuer d'écriture distante sans validation explicite.

### D — Audit

Analyse, cadrage, revue ou rapport sans demande de modification.

- Travailler en lecture seule.
- Limiter les recherches aux fichiers et dossiers concernés.
- Produire un rapport sourcé et distinguer ce qui est vérifié de ce qui reste à confirmer.
- Ne modifier aucun fichier et ne lancer aucun test d'exécution inutile.

Si une mission A révèle un impact métier, technique ou sécurité, signaler le
changement de catégorie avant d'élargir le périmètre.

## Économie de contexte et de vérifications

- Commencer par les fichiers nommés dans la demande.
- Privilégier les recherches bornées au dossier concerné.
- Éviter les sorties terminal volumineuses.
- Ne pas relire intégralement les documents de gouvernance pour une modification mineure.
- Ne pas relancer plusieurs fois les mêmes tests sans raison.
- Ne pas créer de documentation redondante.
- Préserver l'encodage UTF-8 sans BOM et les accents français ; ne pas effectuer
  de conversion globale d'encodage.
- Ne jamais supprimer un test nécessaire uniquement pour économiser des crédits.

Pour une refonte importante de page, dashboard ou popup, réaliser une
vérification navigateur desktop et mobile si l'outil est disponible, comparer
avec la maquette lorsqu'elle est fournie, puis corriger les écarts dans le
périmètre autorisé. Ne jamais prétendre avoir vérifié le rendu si aucune
capture réelle n'a été réalisée. Pour un simple changement de couleur ou
d'espacement, une capture n'est pas systématiquement nécessaire.

Adapter le rapport final à la catégorie : court pour A, centré sur les impacts
métier pour B, détaillé sur les preuves techniques et sécurité pour C, structuré
et sourcé pour D. Ne pas répéter les instructions de la mission dans le rapport
final.
