# Système de gestion des prompts PlanetLS

Date de conservation : lundi 3 août 2026

## Intention

Mettre en place un système professionnel pour centraliser, retrouver, adapter, utiliser et améliorer les prompts destinés à Codex, sans créer une usine à gaz.

## Objectif principal

Le système visé repose sur trois niveaux complémentaires :

1. Un contexte central partagé avec les informations stables de PlanetLS.
2. Une bibliothèque de prompts versionnée dans le dépôt.
3. Une interface visuelle dans `Pilotage Business` pour consulter, rechercher, préparer et suivre les prompts sans dupliquer leur contenu.

## Principes d'architecture

- La source officielle doit rester dans le dépôt Git sous forme de fichiers lisibles et versionnés.
- L'interface admin doit servir de consultation et de pilotage, pas de seconde source divergente.
- Les prompts doivent éviter les répétitions de contexte PlanetLS.
- Le système doit faciliter la réutilisation future sur d'autres projets de la fondatrice.

## Résultats attendus

- Réduire la longueur des futurs prompts.
- Éviter les contradictions entre versions.
- Retrouver rapidement le bon prompt selon le besoin.
- Permettre quelques variables simples d'adaptation.
- Conserver une mémoire des usages et résultats importants.
- Savoir quand utiliser chaque prompt et avec quel objectif.

## Périmètre recommandé

### Niveau 1 — Contexte central partagé

Créer un dossier `docs/ai/` avec un fichier du type `planetls-context.md` contenant uniquement les informations stables :

- vision de PlanetLS ;
- types d'utilisateurs ;
- proposition de valeur ;
- parcours métier principaux ;
- architecture technique réellement observée ;
- design system ;
- conventions de code ;
- règles produit et métier durables.

### Niveau 2 — Bibliothèque de prompts versionnée

Créer une bibliothèque de prompts spécialisés dans le dépôt avec :

- un classement par domaine ;
- un format homogène ;
- des métadonnées minimales ;
- un système de variables simple ;
- un historique versionné par Git.

Exemples de domaines déjà pertinents pour PlanetLS :

- audit ;
- UX/UI ;
- business model ;
- risques ;
- stratégie ;
- abonnements ;
- validation marché ;
- roadmap ;
- tests ;
- sécurité ;
- documentation ;
- maintenance projet.

### Niveau 3 — Interface visuelle dans `Pilotage Business`

Ajouter une interface de consultation légère permettant de :

- rechercher un prompt ;
- filtrer par thème ;
- visualiser son objectif ;
- voir quand l'utiliser ;
- préparer ses variables ;
- retrouver les résultats importants associés ;
- éviter de recopier plusieurs fois le même contexte.

## Contraintes explicites

- Ne pas partir trop tôt sur une base de données dédiée.
- Ne pas ajouter une IA secondaire juste pour gérer les prompts.
- Ne pas dupliquer le texte intégral d'un prompt dans plusieurs endroits.
- Ne pas supprimer l'existant avant audit et diagnostic.
- Privilégier une solution simple, robuste, maintenable et réellement utile.

## Première séquence de travail proposée

1. Auditer l'existant : arborescence, docs, prompts, audits, règles Codex, page `Pilotage Business`, navigation, stockage et conventions.
2. Produire un diagnostic : à conserver, déplacer, fusionner, doublons, manques, composants réutilisables, arborescence cible, risques de migration.
3. Construire le contexte partagé `docs/ai`.
4. Structurer la bibliothèque de prompts versionnée.
5. Ajouter ensuite une interface visuelle reliée à cette source unique.

## Valeur produit pour PlanetLS

Cette idée vise à faire de la zone `Developer` ou `Pilotage Business` un véritable cerveau de projet :

- historique conservé ;
- état courant plus lisible ;
- priorités plus rapides à arbitrer ;
- recommandations réutilisables ;
- meilleure continuité entre vision, produit, technique et exécution.

## Statut

Idée conservée comme spécification documentaire. Non implémentée à ce stade.
