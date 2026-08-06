# Regles permanentes Codex pour PlanetLS

## Analyse

- Toujours analyser l'existant avant de creer une nouvelle structure.
- Rechercher d'abord dans `docs/`, `src/` et le Master Plan ce qui existe deja.
- Distinguer faits observes, hypotheses et pistes futures.

## Architecture

- Reutiliser les composants, helpers et conventions deja en place.
- Eviter les duplications de logique, de contenu ou de routes.
- Garder les fichiers Markdown comme source officielle des prompts.
- Ne pas creer de seconde source divergente dans l'interface admin.

## Frontend

- Respecter TypeScript strict et les conventions Next.js du projet.
- Prevoir les etats vide, chargement, erreur et succes.
- Verifier desktop, tablette et mobile.
- Respecter le design system PlanetLS et la lisibilite cockpit.
- Verifier focus, labels, contrastes et navigation clavier.

## Backend

- Ne pas casser les fonctionnalites existantes.
- Securiser les routes admin et restreindre les lectures de fichiers aux dossiers autorises.
- Ne pas lancer de migration irreversible sans analyse et validation.

## Securite

- Ne stocker aucun secret, token ou donnee personnelle sensible dans les prompts ou runs.
- Ne pas exposer publiquement des fichiers internes ou des chemins arbitraires.
- Preserver les roles et autorisations existants.

## Donnees

- Distinguer donnees reelles, simulations et heuristiques.
- Ne pas presenter une estimation comme une verite business.
- Ne pas modifier Stripe sans demande explicite.

## Business

- Garder une logique frugale et utile.
- Ne pas transformer trop tot une idee en usine a gaz.
- Favoriser les solutions maintenables avec faible cout de maintenance.

## Documentation

- Mettre a jour la documentation concernee apres evolution significative.
- Mettre a jour le Master Plan dans la meme mission quand l'impact est fonctionnel, technique ou metier.
- Ajouter les decisions importantes et les limites restantes.

## Tests

- Executer les tests, lint, build ou verifications proportionnes au risque.
- Confirmer les regressions critiques autour des permissions, chargements et donnees.

## Compte rendu

- Fournir un resume des fichiers modifies.
- Indiquer les tests executes.
- Signaler les limites restantes et les prochaines actions utiles.
